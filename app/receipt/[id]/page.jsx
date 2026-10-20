'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Logo from '../../components/ui/Logo';
import { BackIcon } from '../../components/ui/Icons';
import { statusLabel } from '../../lib/rideStatus';

const fmt = (d) =>
  d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

function Row({ label, children }) {
  return (
    <div className="flex justify-between gap-6 py-2 text-sm">
      <dt className="shrink-0 text-road">{label}</dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  );
}

export default function ReceiptPage() {
  const { id } = useParams();
  const [ride, setRide] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`/api/rides/${id}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setRide(data);
      })
      .catch((err) => setError(err.message || 'This receipt could not be loaded.'));
  }, [id]);

  const amount = Number(ride?.amount || 0);
  const refund = Number(ride?.refund_amount || 0);

  return (
    <div className="min-h-[100dvh] print:bg-white">
      <main className="mx-auto flex min-h-[100dvh] w-full max-w-[480px] flex-col bg-surface px-5 pb-10 pt-4 print:max-w-none print:bg-white">
        <div className="mb-4 flex items-center print:hidden">
          <Link href={ride ? `/ride/${ride.id}` : '/ride-history'} aria-label="Back" className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-2">
            <BackIcon />
          </Link>
          <h1 className="font-display text-lg font-bold">Receipt</h1>
        </div>

        {error ? (
          <p className="rounded-xl bg-stop-soft px-4 py-3 text-sm text-stop">{error}</p>
        ) : !ride ? (
          <div className="h-96 animate-pulse rounded-3xl bg-white" />
        ) : (
          <>
            <article className="overflow-hidden rounded-3xl bg-white print:rounded-none">
              <div className="checker h-2.5" aria-hidden="true" />
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <Logo size="sm" />
                  <div className="text-right text-xs text-road">
                    <p>Receipt {String(ride.id).slice(0, 8).toUpperCase()}</p>
                    <p>{fmt(ride.created_at)}</p>
                  </div>
                </div>

                <p className="mt-8 text-sm text-road">Total paid</p>
                <p className="font-display text-5xl font-extrabold tracking-[-0.03em]">₹{amount.toFixed(2)}</p>
                {ride.status === 'cancelled' && (
                  <p className="mt-1 text-sm font-semibold text-stop">₹{refund.toFixed(2)} refunded</p>
                )}

                <dl className="mt-6 divide-y divide-surface-2 border-y border-surface-2">
                  <Row label="Ride">{ride.ride_type}</Row>
                  <Row label="Status">{statusLabel(ride.status)}</Row>
                  <Row label="Driver">{ride.driver_name || '—'}</Row>
                  <Row label="Pickup"><span className="line-clamp-2">{ride.pickup}</span></Row>
                  <Row label="Drop-off"><span className="line-clamp-2">{ride.dropoff}</span></Row>
                  <Row label="Trip started">{fmt(ride.started_at)}</Row>
                  <Row label="Trip ended">{fmt(ride.completed_at)}</Row>
                </dl>

                <p className="mt-4 break-all text-[11px] text-road">
                  Paid via Stripe · Payment ID {ride.payment_intent_id || '—'}
                </p>
              </div>
            </article>

            <div className="mt-5 space-y-2 print:hidden">
              <button onClick={() => window.print()} className="btn-dark w-full">Download PDF</button>
              <p className="text-center text-xs text-road">In the print window, choose “Save as PDF”.</p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
