'use client';

import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';

export default function CheckoutForm({ amount, rideType, pickup, dropoff, onSuccess, onBack }) {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ready, setReady] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setErrorMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Used only by payment methods that redirect (e.g. UPI / netbanking).
        // The ride-history page saves the ride when it sees ?payment_intent=... in the URL.
        return_url: window.location.origin + '/ride-history',
      },
      redirect: 'if_required',
    });

    setIsProcessing(false);

    if (error) {
      setErrorMessage(error.message);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      onSuccess(paymentIntent.id);
    } else {
      setErrorMessage(`Payment is ${paymentIntent?.status || 'not complete'}. Try again or use another method.`);
    }
  };

  const short = (s) => (s || '').split(',')[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-display text-2xl font-bold">Pay ₹{amount}</h2>
          <p className="truncate text-sm text-road">
            {rideType} · {short(pickup)} to {short(dropoff)}
          </p>
        </div>
        <button type="button" onClick={onBack} className="shrink-0 text-sm font-semibold underline underline-offset-4">
          Change
        </button>
      </div>

      {!ready && (
        <div className="space-y-3" aria-live="polite">
          <div className="h-12 animate-pulse rounded-xl bg-surface" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-12 animate-pulse rounded-xl bg-surface" />
            <div className="h-12 animate-pulse rounded-xl bg-surface" />
          </div>
          <p className="text-center text-sm text-road">Loading secure payment…</p>
        </div>
      )}
      <PaymentElement onReady={() => setReady(true)} options={{ layout: 'tabs' }} />

      {errorMessage && (
        <p className="rounded-xl bg-stop-soft px-4 py-3 text-sm text-stop" role="alert">
          {errorMessage}
        </p>
      )}

      <button type="submit" disabled={isProcessing || !ready || !stripe || !elements} className="btn-primary w-full">
        {isProcessing ? 'Processing…' : `Pay ₹${amount} and book`}
      </button>
      <p className="text-center text-xs text-road">Secured by Stripe. Test card: 4242 4242 4242 4242</p>
    </form>
  );
}
