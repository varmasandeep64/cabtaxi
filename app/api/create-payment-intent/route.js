import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Stripe from 'stripe';
import { RIDE_TYPES, calcFare, haversineKm, isValidCoords } from '../../lib/fare';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Distance is measured on the server so the browser can't choose its own price.
async function getRouteKm(pickupCoords, dropoffCoords) {
  const [lat1, lon1] = pickupCoords;
  const [lat2, lon2] = dropoffCoords;
  try {
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`
    );
    const data = await res.json();
    if (data.routes && data.routes.length > 0) return data.routes[0].distance / 1000;
  } catch {
    // fall through to straight-line estimate
  }
  return haversineKm(pickupCoords, dropoffCoords) * 1.3;
}

const clip = (s) => String(s || '').slice(0, 450); // Stripe metadata values max 500 chars

export async function POST(request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Please sign in to book a ride.' }, { status: 401 });
  }

  try {
    const { pickupCoords, dropoffCoords, rideType, pickup, dropoff } = await request.json();

    if (!RIDE_TYPES[rideType]) {
      return NextResponse.json({ error: 'Invalid ride type.' }, { status: 400 });
    }
    if (!isValidCoords(pickupCoords) || !isValidCoords(dropoffCoords)) {
      return NextResponse.json({ error: 'Invalid pickup or drop-off location.' }, { status: 400 });
    }

    const distanceKm = await getRouteKm(pickupCoords, dropoffCoords);
    const amount = calcFare(distanceKm, rideType);
    if (!amount) {
      return NextResponse.json({ error: 'Could not calculate fare.' }, { status: 400 });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // rupees -> paise
      currency: 'inr',
      automatic_payment_methods: { enabled: true },
      metadata: {
        userId,
        rideType,
        pickup: clip(pickup),
        dropoff: clip(dropoff),
        distanceKm: distanceKm.toFixed(2),
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount,
      distanceKm,
    });
  } catch (error) {
    console.error('Stripe error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
