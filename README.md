# cabTaxi — Cab Booking App (Rapido / Uber clone)

A full-stack ride-hailing web app built for the **Labmentix internship project**.
Riders book and pay for rides on a live map; drivers accept and complete trips; riders track status live, rate the driver and download receipts.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS |
| Auth | Clerk (email + social login) |
| Maps & routing | Leaflet + OpenStreetMap tiles, Nominatim (geocoding), OSRM (driving routes) |
| Payments | Stripe Payment Element (INR, test mode) + Stripe refunds |
| Backend | Next.js API routes (Node.js) |
| Database | Supabase (PostgreSQL) with Row Level Security |

## Features

**Rider**
- Sign up / log in with Clerk; protected pages
- Choose pickup & drop-off by search (autocomplete), GPS, clicking the map, or dragging pins
- Real driving route, distance and ETA on the map
- Fare estimate per ride type (cabTaxi Go / Premier)
- Secure Stripe payment — fare is recalculated on the server so it can't be tampered with
- Live ride tracking: *Finding driver → Driver accepted → Trip started → Completed*
- Cancel a ride: full refund before a driver accepts, ₹25 fee after (refund via Stripe)
- Rate the driver (1–5 stars + feedback) after the trip
- Ride history and downloadable PDF receipts

**Driver**
- Driver mode dashboard with new ride requests (auto-refresh)
- Accept → Start trip → Complete trip
- Earnings (80% of fare), completed trips, and average rating

## Project structure

```
app/
  page.jsx                     Landing page
  dashboard/                   Rider dashboard
  book-ride/                   Map, fare, Stripe checkout
  ride/[id]/                   Live ride tracking, cancel, rating
  receipt/[id]/                Printable / PDF receipt
  ride-history/                Rider's past trips
  driver/                      Driver dashboard
  api/
    geocode/                   Address search + reverse geocoding (Nominatim)
    create-payment-intent/     Server-side fare + Stripe PaymentIntent
    rides/                     Save ride after verified payment, list my rides
    rides/[id]/                Ride details + accept/start/complete/cancel/rate
    driver/rides/              Open requests + driver's trips
  components/                  RideMap, CheckoutForm, RatingModal
  lib/                         fare rules, ride status, Supabase clients
supabase/                      SQL to set up the rides table
middleware.js                  Clerk route protection
```

## Running locally

1. Install dependencies
   ```bash
   npm install
   ```
2. Create `.env.local` in the project root:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ```
3. In Supabase → SQL Editor, create the table and run the two setup scripts:
   ```sql
   create table rides (
     id uuid default gen_random_uuid() primary key,
     ride_type text not null,
     pickup text not null,
     dropoff text not null,
     amount numeric not null,
     created_at timestamptz default now() not null
   );
   ```
   then `supabase/rides_security.sql`, then `supabase/driver_flow.sql`.
4. Start the app
   ```bash
   npm run dev
   ```
   Open http://localhost:3000

## Demo walkthrough

1. Sign in as a **rider** → Dashboard → **Request a Cab**.
2. Pick pickup & drop-off → **Proceed to Payment** → pay with test card `4242 4242 4242 4242`, any future date, any CVC.
3. You land on the **live tracking page** ("Finding a driver").
4. In an incognito window, sign in (another account or the same one) → Dashboard → **Go Online as Driver** → **Accept Ride** → **Start Trip** → **Complete Trip**.
5. The rider's tracking page updates automatically. Rate the driver, then open the **Receipt** and save it as PDF.

## Security notes

- All pages except home / sign-in / sign-up require login (Clerk middleware).
- Fare is calculated on the server from coordinates; the browser cannot set the price.
- A ride is saved only after the server confirms with Stripe that the payment succeeded and belongs to the user.
- The `rides` table has Row Level Security enabled; only the server (service role key) can read/write it, and every API checks the user owns the ride.

## Future scope

- Real-time updates with Supabase Realtime / WebSockets instead of polling
- Live driver GPS location on the rider's map
- Matching riders to the nearest available driver
- Separate driver sign-up with vehicle/KYC details and Stripe Connect payouts
- Promo codes, multi-stop rides, SOS button, help & support tickets
- Emailed receipts, surge pricing, unit tests and CI/CD
