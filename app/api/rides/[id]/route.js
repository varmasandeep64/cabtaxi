import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { CANCEL_FEE_AFTER_ACCEPT } from '../../../lib/rideStatus';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const json = (body, status = 200) => NextResponse.json(body, { status });

async function loadRide(id) {
  const { data, error } = await supabaseAdmin.from('rides').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

// GET /api/rides/:id -> ride details (only for its rider or its driver)
export async function GET(_request, { params }) {
  const { userId } = await auth();
  if (!userId) return json({ error: 'Unauthorized' }, 401);
  const { id } = await params;

  try {
    const ride = await loadRide(id);
    if (!ride) return json({ error: 'Ride not found' }, 404);
    if (ride.user_id !== userId && ride.driver_id !== userId) {
      return json({ error: 'Not your ride' }, 403);
    }
    return json(ride);
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}

// PATCH /api/rides/:id { action, ... }
//   driver: accept | start | complete
//   rider:  cancel | rate { rating, feedback }
export async function PATCH(request, { params }) {
  const { userId } = await auth();
  if (!userId) return json({ error: 'Unauthorized' }, 401);
  const { id } = await params;

  try {
    const body = await request.json();
    const ride = await loadRide(id);
    if (!ride) return json({ error: 'Ride not found' }, 404);

    const isRider = ride.user_id === userId;
    const isDriver = ride.driver_id === userId;
    const now = new Date().toISOString();

    // Helper: update only if the ride is still in the expected status (prevents race conditions)
    const transition = async (fromStatus, changes) => {
      const { data, error } = await supabaseAdmin
        .from('rides')
        .update(changes)
        .eq('id', id)
        .eq('status', fromStatus)
        .select()
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) return json({ error: 'Ride status changed, please refresh.' }, 409);
      return json(data);
    };

    switch (body.action) {
      case 'accept': {
        if (ride.status !== 'paid' || ride.driver_id) {
          return json({ error: 'This ride is no longer available.' }, 409);
        }
        const user = await currentUser();
        const emailName = user?.emailAddresses?.[0]?.emailAddress?.split('@')[0];
        const driverName =
          [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
          user?.username ||
          (emailName ? emailName.charAt(0).toUpperCase() + emailName.slice(1) : '') ||
          'Driver';
        return transition('paid', {
          driver_id: userId,
          driver_name: driverName,
          status: 'accepted',
          accepted_at: now,
        });
      }

      case 'start':
        if (!isDriver) return json({ error: 'Only the assigned driver can start this ride.' }, 403);
        return transition('accepted', { status: 'in_progress', started_at: now });

      case 'complete':
        if (!isDriver) return json({ error: 'Only the assigned driver can complete this ride.' }, 403);
        return transition('in_progress', { status: 'completed', completed_at: now });

      case 'cancel': {
        if (!isRider) return json({ error: 'Only the rider can cancel this ride.' }, 403);
        if (!['paid', 'accepted'].includes(ride.status)) {
          return json({ error: 'This ride can no longer be cancelled.' }, 400);
        }
        // Free cancellation before a driver accepts; small fee after.
        const fee = ride.status === 'accepted' ? CANCEL_FEE_AFTER_ACCEPT : 0;
        const refund = Math.max(0, Number(ride.amount) - fee);
        if (refund > 0 && ride.payment_intent_id) {
          await stripe.refunds.create({
            payment_intent: ride.payment_intent_id,
            amount: Math.round(refund * 100),
          });
        }
        return transition(ride.status, {
          status: 'cancelled',
          cancelled_at: now,
          refund_amount: refund,
        });
      }

      case 'rate': {
        if (!isRider) return json({ error: 'Only the rider can rate this ride.' }, 403);
        if (ride.status !== 'completed') return json({ error: 'You can rate after the trip is completed.' }, 400);
        if (ride.rating) return json({ error: 'You already rated this ride.' }, 400);
        const rating = Number(body.rating);
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
          return json({ error: 'Rating must be 1 to 5.' }, 400);
        }
        const feedback = String(body.feedback || '').slice(0, 500);
        return transition('completed', { rating, feedback });
      }

      default:
        return json({ error: 'Unknown action' }, 400);
    }
  } catch (err) {
    console.error('Ride update error:', err.message);
    return json({ error: err.message }, 500);
  }
}
