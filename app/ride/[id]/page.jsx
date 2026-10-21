'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AppShell from '../../components/ui/AppShell';
import RatingModal from '../../components/RatingModal';
import { CarIcon, ReceiptIcon, StarIcon } from '../../components/ui/Icons';
import { STATUS_STEPS, CANCEL_FEE_AFTER_ACCEPT, displayName } from '../../lib/rideStatus';

const HEADLINE = {
  paid: { title: 'Finding your driver', sub: 'Hang tight — nearby drivers are seeing your request.' },
  accepted: { title: 'Driver is on the way', sub: 'Head to your pickup point.' },
  in_progress: { title: 'On the trip', sub: 'Sit back. We’ll let you know when you arrive.' },
  completed: { title: 'You’ve arrived', sub: 'Thanks for riding with cabTaxi.' },
  cancelled: { title: 'Ride cancelled', sub: '' },
};

const initials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || 'D';

export default function RideTrackingPage() {
  const { id } = useParams();
  const [ride, setRide] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const statusRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/rides/${id}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRide(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'This ride could not be loaded.');
    }
  }, [id]);

  // Live updates: poll every 4 seconds until the ride is finished
  useEffect(() => {
    load();
    const timer = setInterval(() => {
      if (!['completed', 'cancelled'].includes(statusRef.current)) load();
    }, 4000);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    statusRef.current = ride?.status;
  }, [ride]);

  const patch = async (body) => {
    const res = await fetch(`/api/rides/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'That didn’t go through. Try again.');
    setRide(data);
    return data;
  };

  const handleCancel = async () => {
    setBusy(true);
    try {
      await patch({ action: 'cancel' });
      setConfirmCancel(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!ride) {
    return (
      <AppShell title="Your ride" back="/dashboard">
        {error ? (
          <div className="px-5 pt-10 text-center">
            <p className="text-stop">{error}</p>
            <Link href="/ride-history" className="btn-ghost mt-6">See your trips</Link>
          </div>
        ) : (
          <div className="space-y-4 px-5 pt-6">
            <div className="h-40 animate-pulse rounded-3xl bg-surface" />
            <div className="h-24 animate-pulse rounded-3xl bg-surface" />
          </div>
        )}
      </AppShell>
    );
  }

  const step = STATUS_STEPS.indexOf(ride.status);
  const isCancelled = ride.status === 'cancelled';
  const head = HEADLINE[ride.status] || { title: ride.status, sub: '' };
  const fee = ride.status === 'accepted' ? CANCEL_FEE_AFTER_ACCEPT : 0;

  return (
    <AppShell title="Your ride" back="/dashboard">
      <div className="space-y-5 px-5 pt-2">
        {/* Status hero */}
        <section className={`overflow-hidden rounded-3xl ${isCancelled ? 'bg-surface' : 'bg-taxi'} p-6`}>
          {ride.status === 'paid' && (
            <div className="relative mx-auto mb-5 flex h-28 w-28 items-center justify-center" aria-hidden="true">
              <span className="absolute h-full w-full animate-ping rounded-full bg-ink/10 [animation-duration:2s]" />
              <span className="absolute h-20 w-20 animate-ping rounded-full bg-ink/10 [animation-delay:0.6s] [animation-duration:2s]" />
              <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-ink text-taxi">
                <CarIcon size={28} />
              </span>
            </div>
          )}
          <h2 className="font-display text-[28px] font-extrabold leading-tight tracking-[-0.02em]" aria-live="polite">
            {head.title}
          </h2>
          {isCancelled ? (
            <p className="mt-1 text-ink/70">
              ₹{ride.refund_amount ?? 0} is on its way back to your payment method.
            </p>
          ) : (
            <p className="mt-1 text-ink/70">{head.sub}</p>
          )}

          {!isCancelled && (
            <div className="mt-5 grid grid-cols-4 gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={4} aria-valuenow={step + 1}>
              {STATUS_STEPS.map((s, i) => (
                <span key={s} className={`h-1.5 rounded-full ${i <= step ? 'bg-ink' : 'bg-ink/15'}`} />
              ))}
            </div>
          )}
        </section>

        {/* Driver */}
        {ride.driver_name && (
          <section className="flex items-center gap-4 rounded-3xl bg-surface p-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-ink font-display text-lg font-bold text-taxi">
              {initials(displayName(ride.driver_name))}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm text-road">Your driver</span>
              <span className="block truncate font-display text-lg font-bold">{displayName(ride.driver_name)}</span>
            </span>
            <span className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-semibold">
              {ride.ride_type.replace('cabTaxi ', '')}
            </span>
          </section>
        )}

        {/* Trip */}
        <section className="rounded-3xl border border-surface-2 p-5">
          <div className="flex gap-3">
            <div className="flex flex-col items-center pt-1.5" aria-hidden="true">
              <span className="h-3 w-3 rounded-full border-[3px] border-ink bg-white" />
              <span className="my-1 w-0.5 flex-1 bg-surface-2" />
              <span className="h-3 w-3 rounded-[3px] bg-ink" />
            </div>
            <div className="min-w-0 flex-1 space-y-4">
              <div>
                <p className="text-xs text-road">Pickup</p>
                <p className="line-clamp-2 text-sm font-semibold">{ride.pickup}</p>
              </div>
              <div>
                <p className="text-xs text-road">Drop-off</p>
                <p className="line-clamp-2 text-sm font-semibold">{ride.dropoff}</p>
              </div>
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-surface-2 pt-4">
            <span className="text-sm text-road">Paid · {ride.ride_type}</span>
            <span className="font-display text-xl font-bold">₹{ride.amount}</span>
          </div>
        </section>

        {error && <p className="rounded-xl bg-stop-soft px-4 py-3 text-sm text-stop" role="alert">{error}</p>}

        {/* Rating */}
        {ride.status === 'completed' && (
          <section className="rounded-3xl bg-surface p-5">
            {ride.rating ? (
              <div className="text-center">
                <p className="text-sm text-road">You rated this ride</p>
                <div className="mt-1 flex justify-center text-taxi-deep">
                  {Array.from({ length: ride.rating }).map((_, i) => <StarIcon key={i} size={26} filled />)}
                </div>
                {ride.feedback && <p className="mt-2 text-sm text-ink/80">“{ride.feedback}”</p>}
              </div>
            ) : (
              <RatingModal
                driverName={displayName(ride.driver_name)}
                onSubmitRating={({ rating, feedback }) => patch({ action: 'rate', rating, feedback })}
              />
            )}
          </section>
        )}

        {/* Actions */}
        <div className="space-y-3 pb-4">
          {['completed', 'cancelled'].includes(ride.status) ? (
            <div className="grid grid-cols-2 gap-3">
              <Link href={`/receipt/${ride.id}`} className="btn-ghost">
                <ReceiptIcon size={18} /> Receipt
              </Link>
              <Link href="/book-ride" className="btn-dark py-3.5 text-sm">Book again</Link>
            </div>
          ) : confirmCancel ? (
            <div className="rounded-2xl border-2 border-stop p-4">
              <p className="text-sm font-semibold">
                {fee
                  ? `Your driver is already on the way. Cancelling costs ₹${fee}; you’ll get ₹${Number(ride.amount) - fee} back.`
                  : `Cancel for free? You’ll get the full ₹${ride.amount} back.`}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <button onClick={() => setConfirmCancel(false)} className="btn-ghost">Keep ride</button>
                <button onClick={handleCancel} disabled={busy} className="btn-dark bg-stop py-3.5 text-sm hover:bg-stop">
                  {busy ? 'Cancelling…' : 'Cancel ride'}
                </button>
              </div>
            </div>
          ) : (
            ['paid', 'accepted'].includes(ride.status) && (
              <button onClick={() => setConfirmCancel(true)} className="w-full py-3 text-sm font-semibold text-stop">
                Cancel ride
              </button>
            )
          )}

          {ride.status === 'paid' && (
            <p className="text-center text-xs text-road">
              Demo: open Drive in another browser window to accept this ride.
            </p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
