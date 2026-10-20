import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '../../lib/supabaseAdmin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// GET /api/rides -> only the signed-in user's rides
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from('rides')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching rides:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data || []);
}

// POST /api/rides { paymentIntentId } -> save a ride, but only after Stripe confirms the payment.
// All ride details come from the PaymentIntent (set by the server), not from the browser.
export async function POST(request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { paymentIntentId } = await request.json();
    if (!paymentIntentId || typeof paymentIntentId !== 'string') {
      return NextResponse.json({ error: 'Missing paymentIntentId' }, { status: 400 });
    }

    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (pi.metadata?.userId !== userId) {
      return NextResponse.json({ error: 'This payment does not belong to you.' }, { status: 403 });
    }
    if (pi.status !== 'succeeded') {
      return NextResponse.json({ error: `Payment not completed (status: ${pi.status})` }, { status: 400 });
    }

    // upsert + unique payment_intent_id = saving twice never creates duplicates
    const { error } = await supabaseAdmin.from('rides').upsert(
      {
        user_id: userId,
        payment_intent_id: pi.id,
        ride_type: pi.metadata.rideType,
        pickup: pi.metadata.pickup,
        dropoff: pi.metadata.dropoff,
        amount: pi.amount / 100,
        status: 'paid',
      },
      { onConflict: 'payment_intent_id', ignoreDuplicates: true }
    );

    if (error) {
      console.error('Error saving ride:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return the ride id so the app can open the tracking page
    const { data: saved } = await supabaseAdmin
      .from('rides')
      .select('id')
      .eq('payment_intent_id', pi.id)
      .maybeSingle();

    return NextResponse.json({ ok: true, id: saved?.id || null });
  } catch (err) {
    console.error('Unexpected error saving ride:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
