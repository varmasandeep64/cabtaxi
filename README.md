# cabTaxi - Cab Booking App (Rapido / Uber clone)

This is my internship project for Labmentix. its a full stack cab booking web app, rider can book a cab on map and pay online, driver can accept the ride and complete it. rider can track ride status live, give rating to driver and download the receipt.

i made it mobile first so it look like real app on phone.

## Tech Stack

- **Frontend** - Next.js 16 (App Router), React 19, Tailwind CSS
- **Auth** - Clerk (email and google login)
- **Map** - Leaflet with OpenStreetMap, Nominatim for address search, OSRM for driving route
- **Payment** - Stripe (INR, test mode) + refund on cancel
- **Backend** - Next.js API routes (Node js)
- **Database** - Supabase (PostgreSQL) with Row Level Security on

## Features

**Rider side**
- sign up / login with Clerk, all pages are protected after login
- select pickup and drop location by search, GPS, clicking on map or dragging the pin
- shows real driving route, distance and time on map
- fare estimate for both ride type (cabTaxi Go and cabTaxi Premier)
- payment with Stripe, fare is calculated again on server side so nobody can change the price from browser
- live ride tracking - Finding driver > Driver on the way > Trip started > Completed
- cancel ride - full refund if driver not accepted yet, ₹25 fee after driver accept
- rate the driver (1 to 5 star) and write feedback after trip
- ride history and receipt download as PDF

**Driver side**
- driver mode with online / offline button
- new ride request comes automatically (refresh every 5 sec)
- accept ride > start trip > complete trip
- shows earning (driver get 80% of fare), total trips and average rating

## Folder Structure

```
app/
  page.jsx                     landing page
  dashboard/                   rider home
  book-ride/                   map, fare and stripe payment
  ride/[id]/                   live ride tracking, cancel, rating
  receipt/[id]/                receipt page (save as pdf)
  ride-history/                past trips of rider
  driver/                      driver dashboard
  api/
    geocode/                   address search and reverse geocode
    create-payment-intent/     fare calculate on server + stripe payment
    rides/                     save ride after payment, get my rides
    rides/[id]/                ride details + accept/start/complete/cancel/rate
    driver/rides/              open requests and driver trips
  components/                  RideMap, CheckoutForm, RatingModal, ui
  lib/                         fare rules, ride status, supabase client
supabase/                      sql files for database setup
middleware.js                  clerk route protection
```

## How to run on local

1. install packages
   ```bash
   npm install
   ```
2. make `.env.local` file in root folder and add your keys
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ```
3. go to Supabase > SQL Editor and create the table first
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
   after that run `supabase/rides_security.sql` and then `supabase/driver_flow.sql`
4. start the app
   ```bash
   npm run dev
   ```
   open http://localhost:3000

## How to test (demo)

1. login as rider > click on "Where to?" and book a cab
2. select pickup and drop, then pay with stripe test card `4242 4242 4242 4242` (any future date and any CVC)
3. it will open live tracking page with "Finding your driver"
4. open same link in incognito window, login (other account or same one is also ok) > go to **Drive** tab > Accept > Start trip > Complete trip
5. rider screen will update by itself. after that give rating and open receipt to save as PDF

## Security

- only home, sign in and sign up page is public, other all pages need login (clerk middleware)
- fare is calculated on server from location, browser cannot send its own price
- ride is saved only after server check with Stripe that payment is success and its of same user
- RLS is on for `rides` table, only server can read/write with service role key, and every api check the user is owner of that ride

## Future Scope

things i want to add later -
- real time update with Supabase Realtime / WebSocket, right now it is polling every few sec
- live driver location on rider map
- match rider with nearest driver
- separate driver signup with vehicle and KYC details, payout with Stripe Connect
- promo code, multi stop ride, SOS button, help and support
- receipt on email, surge pricing, unit testing and CI/CD
