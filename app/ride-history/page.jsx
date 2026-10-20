'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AppShell from '../components/ui/AppShell';
import { ChevronIcon, StarIcon } from '../components/ui/Icons';
import { statusLabel, statusBadge } from '../lib/rideStatus';

const ACTIVE = ['paid', 'accepted', 'in_progress'];

const when = (d) =>
  new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

const short = (s = '') => s.split(',')[0];

function RideRow({ ride }) {
  return (
    <li>
      <Link href={`/ride/${ride.id}`} className="flex items-center gap-4 py-4">
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{short(ride.dropoff)}</p>
          <p className="truncate text-sm text-road">From {short(ride.pickup)}</p>
          <p className="mt-1 flex items-center gap-2 text-xs text-road">
            {when(ride.created_at)}
            {ride.rating ? (
              <span className="inline-flex items-center gap-0.5 text-ink">
                <StarIcon size={12} filled className="text-taxi-deep" /> {ride.rating}
              </span>
            ) : null}
          </p>
        </div>
        <div className="text-right">
          <p className="font-display font-bold">₹{ride.amount}</p>
          <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusBadge(ride.status)}`}>
            {statusLabel(ride.status)}
          </span>
        </div>
        <ChevronIcon size={18} className="text-road-light" />
      </Link>
    </li>
  );
}

export default function RideHistoryPage() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchRides() {
      try {
        // If Stripe redirected back here after a UPI / netbanking payment, save that ride first.
        const params = new URLSearchParams(window.location.search);
        const paymentIntentId = params.get('payment_intent');
        if (paymentIntentId && params.get('redirect_status') === 'succeeded') {
          await fetch('/api/rides', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentIntentId }),
          });
          window.history.replaceState(null, '', '/ride-history');
        }

        // Only the signed-in user's rides (filtered on the server)
        const res = await fetch('/api/rides');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setRides(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching ride history:', err);
        setError('Your trips could not be loaded. Reopen this page to try again.');
      } finally {
        setLoading(false);
      }
    }
    fetchRides();
  }, []);

  const active = rides.filter((r) => ACTIVE.includes(r.status));
  const past = rides.filter((r) => !ACTIVE.includes(r.status));
  const spent = rides
    .filter((r) => r.status === 'completed')
    .reduce((sum, r) => sum + Number(r.amount), 0);

  return (
    <AppShell title="Your trips">
      <div className="px-5">
        {loading ? (
          <div className="space-y-3 pt-4">
            {[0, 1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-surface" />)}
          </div>
        ) : error ? (
          <p className="mt-6 rounded-xl bg-stop-soft px-4 py-3 text-sm text-stop">{error}</p>
        ) : rides.length === 0 ? (
          <div className="pt-16 text-center">
            <h2 className="font-display text-2xl font-bold">No trips yet</h2>
            <p className="mt-2 text-road">Your rides and receipts will show up here.</p>
            <Link href="/book-ride" className="btn-primary mt-6">Book your first ride</Link>
          </div>
        ) : (
          <>
            <div className="mb-2 mt-1 flex gap-3">
              <div className="flex-1 rounded-2xl bg-surface p-4">
                <p className="text-xs text-road">Trips</p>
                <p className="font-display text-2xl font-bold">{rides.filter((r) => r.status === 'completed').length}</p>
              </div>
              <div className="flex-1 rounded-2xl bg-surface p-4">
                <p className="text-xs text-road">Spent on rides</p>
                <p className="font-display text-2xl font-bold">₹{spent.toLocaleString('en-IN')}</p>
              </div>
            </div>

            {active.length > 0 && (
              <section className="mt-5">
                <h2 className="font-display text-lg font-bold">Happening now</h2>
                <ul className="divide-y divide-surface-2">{active.map((r) => <RideRow key={r.id} ride={r} />)}</ul>
              </section>
            )}

            {past.length > 0 && (
              <section className="mt-5">
                <h2 className="font-display text-lg font-bold">Past trips</h2>
                <ul className="divide-y divide-surface-2">{past.map((r) => <RideRow key={r.id} ride={r} />)}</ul>
              </section>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
