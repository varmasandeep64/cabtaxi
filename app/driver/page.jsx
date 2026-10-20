'use client';

import { useEffect, useState, useCallback } from 'react';
import AppShell from '../components/ui/AppShell';
import { StarIcon } from '../components/ui/Icons';
import { DRIVER_SHARE } from '../lib/rideStatus';

const timeAgo = (d) => {
  const mins = Math.round((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  return `${Math.round(mins / 60)} hr ago`;
};
const short = (s = '') => s.split(',')[0];
const rest = (s = '') => s.split(',').slice(1, 3).join(',').trim();

function Stops({ pickup, dropoff }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center pt-1.5" aria-hidden="true">
        <span className="h-3 w-3 rounded-full border-[3px] border-white" />
        <span className="my-1 w-0.5 flex-1 bg-night-3" />
        <span className="h-3 w-3 rounded-[3px] bg-taxi" />
      </div>
      <div className="min-w-0 flex-1 space-y-3">
        <div>
          <p className="truncate font-semibold">{short(pickup)}</p>
          <p className="truncate text-xs text-road-light">{rest(pickup)}</p>
        </div>
        <div>
          <p className="truncate font-semibold">{short(dropoff)}</p>
          <p className="truncate text-xs text-road-light">{rest(dropoff)}</p>
        </div>
      </div>
    </div>
  );
}

export default function DriverDashboard() {
  const [online, setOnline] = useState(true);
  const [open, setOpen] = useState([]);
  const [mine, setMine] = useState([]);
  const [avgRating, setAvgRating] = useState(null);
  const [ratingCount, setRatingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/driver/rides', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOpen(data.open);
      setMine(data.mine);
      setAvgRating(data.avgRating);
      setRatingCount(data.ratingCount);
      setError(null);
    } catch (err) {
      setError(err.message || 'Ride requests could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Live updates: new ride requests appear automatically while online
  useEffect(() => {
    load();
    if (!online) return;
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [load, online]);

  const act = async (rideId, action) => {
    setBusyId(rideId);
    setError(null);
    try {
      const res = await fetch(`/api/rides/${rideId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
    } catch (err) {
      setError(err.message);
    } finally {
      await load();
      setBusyId(null);
    }
  };

  const active = mine.filter((r) => ['accepted', 'in_progress'].includes(r.status));
  const completed = mine.filter((r) => r.status === 'completed');
  const earnings = completed.reduce((sum, r) => sum + Number(r.amount) * DRIVER_SHARE, 0);

  return (
    <AppShell
      title="Drive"
      night
      right={
        <button
          type="button"
          role="switch"
          aria-checked={online}
          onClick={() => setOnline((v) => !v)}
          className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold ${
            online ? 'bg-go text-white' : 'bg-night-3 text-road-light'
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${online ? 'bg-white' : 'bg-road'}`} />
          {online ? 'Online' : 'Offline'}
        </button>
      }
    >
      <div className="space-y-6 px-5 pt-2">
        {/* Earnings */}
        <section className="rounded-3xl bg-taxi p-5 text-ink">
          <p className="text-sm font-semibold text-ink/70">Your earnings</p>
          <p className="font-display text-[40px] font-extrabold leading-none tracking-[-0.02em]">
            ₹{Math.round(earnings).toLocaleString('en-IN')}
          </p>
          <div className="mt-4 flex gap-6 text-sm">
            <span><strong>{completed.length}</strong> trips</span>
            <span className="inline-flex items-center gap-1">
              <StarIcon size={14} filled />
              <strong>{avgRating ? avgRating.toFixed(1) : '–'}</strong>
              <span className="text-ink/60">({ratingCount})</span>
            </span>
            <span className="text-ink/60">{Math.round(DRIVER_SHARE * 100)}% of each fare</span>
          </div>
        </section>

        {error && <p className="rounded-xl bg-stop/15 px-4 py-3 text-sm text-red-300" role="alert">{error}</p>}

        {/* Active trip */}
        {active.map((ride) => (
          <section key={ride.id} className="rounded-3xl border-2 border-taxi p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">
                {ride.status === 'accepted' ? 'Pick up your rider' : 'Trip in progress'}
              </h2>
              <span className="font-display text-xl font-bold text-taxi">₹{ride.amount}</span>
            </div>
            <Stops pickup={ride.pickup} dropoff={ride.dropoff} />
            <button
              onClick={() => act(ride.id, ride.status === 'accepted' ? 'start' : 'complete')}
              disabled={busyId === ride.id}
              className={`mt-5 w-full ${ride.status === 'accepted' ? 'btn-primary' : 'btn-dark bg-go hover:bg-go'}`}
            >
              {busyId === ride.id
                ? 'Updating…'
                : ride.status === 'accepted'
                  ? 'Rider is in — start trip'
                  : 'Arrived — complete trip'}
            </button>
          </section>
        ))}

        {/* Requests */}
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-display text-lg font-bold">Ride requests</h2>
            {online && <span className="text-xs text-road-light">Updates every 5 s</span>}
          </div>

          {!online ? (
            <div className="rounded-3xl bg-night-2 p-6 text-center">
              <p className="font-semibold">You’re offline</p>
              <p className="mt-1 text-sm text-road-light">Go online to start getting ride requests.</p>
            </div>
          ) : loading ? (
            <div className="h-32 animate-pulse rounded-3xl bg-night-2" />
          ) : open.length === 0 ? (
            <div className="rounded-3xl bg-night-2 p-6 text-center">
              <p className="font-semibold">No requests right now</p>
              <p className="mt-1 text-sm text-road-light">New rides will appear here automatically.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {open.map((ride) => (
                <li key={ride.id} className="rounded-3xl bg-night-2 p-5">
                  <div className="mb-4 flex items-baseline justify-between">
                    <span className="text-sm text-road-light">
                      {ride.ride_type.replace('cabTaxi ', '')} · {timeAgo(ride.created_at)}
                    </span>
                    <span className="font-display text-2xl font-bold">₹{ride.amount}</span>
                  </div>
                  <Stops pickup={ride.pickup} dropoff={ride.dropoff} />
                  <button
                    onClick={() => act(ride.id, 'accept')}
                    disabled={busyId === ride.id || active.length > 0}
                    className="btn-primary mt-5 w-full disabled:bg-night-3 disabled:text-road-light"
                  >
                    {active.length > 0
                      ? 'Finish your current trip first'
                      : busyId === ride.id
                        ? 'Accepting…'
                        : `Accept · earn ₹${Math.round(Number(ride.amount) * DRIVER_SHARE)}`}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* History */}
        {completed.length > 0 && (
          <section className="pb-4">
            <h2 className="mb-1 font-display text-lg font-bold">Completed trips</h2>
            <ul className="divide-y divide-night-3">
              {completed.map((ride) => (
                <li key={ride.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span className="min-w-0 truncate">
                    {short(ride.pickup)} → {short(ride.dropoff)}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    {ride.rating ? (
                      <span className="inline-flex items-center gap-0.5 text-taxi">
                        <StarIcon size={12} filled /> {ride.rating}
                      </span>
                    ) : null}
                    <strong>₹{Math.round(Number(ride.amount) * DRIVER_SHARE)}</strong>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </AppShell>
  );
}
