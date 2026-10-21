'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from '../components/CheckoutForm';
import { RIDE_TYPES, calcFare, inServiceArea, MAX_TRIP_KM, SERVICE_AREA_NAME } from '../lib/fare';
import { POPULAR_PLACES } from '../lib/places';
import { BackIcon, GpsIcon, CarIcon } from '../components/ui/Icons';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const RideMap = dynamic(() => import('../components/RideMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-surface-2" />,
});

const RIDE_COPY = {
  'cabTaxi Go': { blurb: 'Everyday hatchback', seats: 4 },
  'cabTaxi Premier': { blurb: 'Roomy sedan', seats: 4 },
};

const stripeAppearance = {
  theme: 'stripe',
  variables: { colorPrimary: '#1C1C1C', colorText: '#1C1C1C', borderRadius: '12px', spacingUnit: '4px' },
};

export default function BookRidePage() {
  const router = useRouter();
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropoffCoords, setDropoffCoords] = useState(null);

  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState([]);
  const [activeInput, setActiveInput] = useState(null);
  const [locatingGps, setLocatingGps] = useState(false);

  const [routeGeometry, setRouteGeometry] = useState([]);
  const [distanceKm, setDistanceKm] = useState(0);
  const [durationMin, setDurationMin] = useState(0);
  const [routeLoading, setRouteLoading] = useState(false);

  const [rideType, setRideType] = useState('cabTaxi Go');
  const [rideRequested, setRideRequested] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const [chargedAmount, setChargedAmount] = useState(null); // fare confirmed by the server
  const [saveError, setSaveError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [searching, setSearching] = useState(null); // 'pickup' | 'dropoff' | null

  // Destination passed from the home screen shortcuts (?to=...&lat=...&lon=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const to = params.get('to');
    const lat = parseFloat(params.get('lat'));
    const lon = parseFloat(params.get('lon'));
    if (to && Number.isFinite(lat) && Number.isFinite(lon)) {
      setDropoff(to);
      setDropoffCoords([lat, lon]);
      setActiveInput('pickup');
    }
  }, []);

  // Use current GPS as pickup
  const handleUseCurrentLocation = () => {
    if (!('geolocation' in navigator)) {
      setNotice('Location is not available in this browser. Search or tap the map instead.');
      return;
    }
    setLocatingGps(true);
    setNotice(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setPickupCoords([lat, lon]);
        setNotice(null);
        try {
          const res = await fetch(`/api/geocode?lat=${lat}&lon=${lon}`);
          const data = await res.json();
          setPickup(data.display_name || `Current location (${lat.toFixed(3)}, ${lon.toFixed(3)})`);
        } catch {
          setPickup(`Current location (${lat.toFixed(3)}, ${lon.toFixed(3)})`);
        }
        setLocatingGps(false);
        setActiveInput(null);
      },
      () => {
        setLocatingGps(false);
        setNotice('Location permission was blocked. Search for your pickup or tap the map.');
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  const selectPlace = (type, name, coords) => {
    setNotice(null);
    if (type === 'pickup') {
      setPickup(name);
      setPickupCoords(coords);
      setPickupSuggestions([]);
      setActiveInput(dropoffCoords ? null : 'dropoff');
    } else {
      setDropoff(name);
      setDropoffCoords(coords);
      setDropoffSuggestions([]);
      setActiveInput(pickupCoords ? null : 'pickup');
    }
  };

  const updateLocationFromCoords = async (coords, type) => {
    const [lat, lon] = coords;
    setNotice(null);
    if (type === 'pickup') {
      setPickupCoords(coords);
      setPickup('Finding address…');
    } else {
      setDropoffCoords(coords);
      setDropoff('Finding address…');
    }
    try {
      const res = await fetch(`/api/geocode?lat=${lat}&lon=${lon}`);
      const data = await res.json();
      const address = data.display_name || `Pinned location (${lat.toFixed(3)}, ${lon.toFixed(3)})`;
      if (type === 'pickup') setPickup(address);
      else setDropoff(address);
    } catch {
      const fallback = `Pinned location (${lat.toFixed(3)}, ${lon.toFixed(3)})`;
      if (type === 'pickup') setPickup(fallback);
      else setDropoff(fallback);
    }
  };

  // Autocomplete pickup
  useEffect(() => {
    if (activeInput !== 'pickup' || pickupCoords || pickup.trim().length < 2) {
      setPickupSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching('pickup');
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(pickup)}`);
        const data = await res.json();
        setPickupSuggestions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(null);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [pickup, activeInput, pickupCoords]);

  // Autocomplete drop-off
  useEffect(() => {
    if (activeInput !== 'dropoff' || dropoffCoords || dropoff.trim().length < 2) {
      setDropoffSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching('dropoff');
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(dropoff)}`);
        const data = await res.json();
        setDropoffSuggestions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(null);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [dropoff, activeInput, dropoffCoords]);

  // Fetch driving route from OSRM
  useEffect(() => {
    if (!pickupCoords || !dropoffCoords) {
      setRouteGeometry([]);
      setDistanceKm(0);
      setDurationMin(0);
      return;
    }
    let cancelled = false; // ignore stale responses if pins move again quickly
    setRouteLoading(true);
    setDistanceKm(0);
    async function fetchRoute() {
      try {
        const [lat1, lon1] = pickupCoords;
        const [lat2, lon2] = dropoffCoords;
        const res = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=full&geometries=geojson`
        );
        const data = await res.json();
        if (cancelled) return;
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          setRouteGeometry(route.geometry.coordinates.map(([lon, lat]) => [lat, lon]));
          setDistanceKm(route.distance / 1000);
          setDurationMin(Math.max(3, Math.round(route.duration / 60)));
        }
      } catch {
        console.error('Routing error');
      } finally {
        if (!cancelled) setRouteLoading(false);
      }
    }
    fetchRoute();
    return () => {
      cancelled = true;
    };
  }, [pickupCoords, dropoffCoords]);

  const handleMapClick = (coords) => {
    if (rideRequested) return;
    if (!pickupCoords || activeInput === 'pickup') {
      updateLocationFromCoords(coords, 'pickup');
      setActiveInput(dropoffCoords ? null : 'dropoff');
    } else {
      updateLocationFromCoords(coords, 'dropoff');
      setActiveInput(null);
    }
  };

  // Estimate shown to the user. The real charge is recalculated on the server.
  const estimatedFare = calcFare(distanceKm, rideType);
  // Service area check (the server checks this again before charging)
  const areaProblem =
    (pickupCoords && !inServiceArea(pickupCoords)) || (dropoffCoords && !inServiceArea(dropoffCoords))
      ? `cabTaxi only runs within the ${SERVICE_AREA_NAME} right now. Pick places in Mumbai, Thane, Kalyan, Ulhasnagar or Navi Mumbai.`
      : distanceKm > MAX_TRIP_KM
        ? `This trip is ${distanceKm.toFixed(0)} km. Trips are limited to ${MAX_TRIP_KM} km.`
        : null;
  const canBook = Boolean(pickupCoords && dropoffCoords && distanceKm > 0 && !routeLoading && !areaProblem);

  // Save the paid ride. The server verifies the payment with Stripe before saving.
  const saveRide = async (paymentIntentId) => {
    setSaveError(null);
    try {
      const res = await fetch('/api/rides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentIntentId }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error('Error saving ride:', data.error);
        setSaveError(data.error || 'Could not save this ride.');
      } else if (data.id) {
        router.push(`/ride/${data.id}`); // live tracking page
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setSaveError('Could not save this ride.');
    }
  };

  const handleRequestRide = async (e) => {
    e.preventDefault();
    if (!canBook) return;
    setNotice(null);
    setRideRequested(true);
    setClientSecret(null);
    setChargedAmount(null);

    try {
      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pickupCoords, dropoffCoords, rideType, pickup, dropoff }),
      });
      const data = await res.json();
      if (data.clientSecret) {
        setChargedAmount(data.amount);
        setClientSecret(data.clientSecret);
      } else {
        setNotice(`Payment could not start: ${data.error || 'unknown error'}. Try again.`);
        setRideRequested(false);
      }
    } catch (err) {
      console.error(err);
      setNotice('No connection to the payment service. Check your internet and try again.');
      setRideRequested(false);
    }
  };

  const stage = paymentSuccess ? 'done' : rideRequested ? 'pay' : 'plan';

  const suggestionList = (items, type) =>
    items.length > 0 && (
      <ul className="absolute left-0 right-0 top-full z-30 mt-2 max-h-64 overflow-y-auto rounded-2xl bg-white py-1 shadow-float ring-1 ring-surface-2">
        {items.map((place) => (
          <li key={place.place_id}>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() =>
                selectPlace(type, place.display_name, [parseFloat(place.lat), parseFloat(place.lon)])
              }
              className="block w-full px-4 py-3 text-left hover:bg-surface"
            >
              <span className="block truncate text-sm font-semibold">{place.display_name.split(',')[0]}</span>
              <span className="block truncate text-xs text-road">
                {place.display_name.split(',').slice(1, 4).join(',')}
              </span>
            </button>
          </li>
        ))}
      </ul>
    );

  return (
    <div className="min-h-[100dvh]">
      <div className="relative mx-auto flex h-[100dvh] w-full max-w-[480px] flex-col overflow-hidden bg-white md:shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
        {/* Map */}
        <div className="relative h-[42dvh] min-h-[240px] shrink-0">
          <RideMap
            className="h-full"
            bottomPadding={50}
            pickup={pickup}
            dropoff={dropoff}
            pickupCoords={pickupCoords}
            dropoffCoords={dropoffCoords}
            routeGeometry={routeGeometry}
            onMapClick={handleMapClick}
            onPickupDrag={(coords) => updateLocationFromCoords(coords, 'pickup')}
            onDropoffDrag={(coords) => updateLocationFromCoords(coords, 'dropoff')}
          />
          <Link
            href="/dashboard"
            aria-label="Back to home"
            className="absolute left-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-float"
          >
            <BackIcon />
          </Link>
          {stage === 'plan' && (
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              className="absolute right-4 top-4 z-10 flex h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold shadow-float"
            >
              <GpsIcon size={18} />
              {locatingGps ? 'Locating…' : 'My location'}
            </button>
          )}
          {routeLoading && (
            <span className="absolute bottom-10 left-1/2 z-10 -translate-x-1/2 rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-white">
              Finding the best route…
            </span>
          )}
        </div>

        {/* Bottom sheet */}
        <section className="relative z-10 -mt-6 flex min-h-0 flex-1 flex-col rounded-t-sheet bg-white shadow-sheet">
          <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-surface-2" aria-hidden="true" />

          {stage === 'plan' && (
            <form onSubmit={handleRequestRide} className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 space-y-5 overflow-y-auto px-5 pb-4 pt-3">
                {/* Pickup / drop-off fields joined by a route line */}
                <div className="relative flex gap-3">
                  <div className="flex flex-col items-center pt-[18px]" aria-hidden="true">
                    <span className="h-3.5 w-3.5 rounded-full border-[4px] border-ink bg-white" />
                    <span className="my-1 w-0.5 flex-1 bg-surface-2" />
                    <span className="flex h-3.5 w-3.5 items-center justify-center rounded-[3px] bg-ink">
                      <span className="h-1.5 w-1.5 rounded-[1px] bg-taxi" />
                    </span>
                  </div>
                  <div className="flex-1 space-y-2.5">
                    <div className="relative">
                      <label htmlFor="pickup" className="sr-only">Pickup location</label>
                      <input
                        id="pickup"
                        type="text"
                        autoComplete="off"
                        spellCheck={false}
                        value={pickup}
                        onFocus={() => setActiveInput('pickup')}
                        onChange={(e) => {
                          setPickup(e.target.value);
                          setPickupCoords(null); // typed text no longer matches the pin
                        }}
                        placeholder="Pickup location"
                        className="field"
                      />
                      {activeInput === 'pickup' && searching === 'pickup' && pickupSuggestions.length === 0 && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-road">Searching…</span>
                      )}
                      {activeInput === 'pickup' && suggestionList(pickupSuggestions, 'pickup')}
                    </div>
                    <div className="relative">
                      <label htmlFor="dropoff" className="sr-only">Drop-off location</label>
                      <input
                        id="dropoff"
                        type="text"
                        autoComplete="off"
                        spellCheck={false}
                        value={dropoff}
                        onFocus={() => setActiveInput('dropoff')}
                        onChange={(e) => {
                          setDropoff(e.target.value);
                          setDropoffCoords(null);
                        }}
                        placeholder="Where to?"
                        className="field"
                      />
                      {activeInput === 'dropoff' && searching === 'dropoff' && dropoffSuggestions.length === 0 && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-road">Searching…</span>
                      )}
                      {activeInput === 'dropoff' && suggestionList(dropoffSuggestions, 'dropoff')}
                    </div>
                  </div>
                </div>

                {notice && (
                  <p className="rounded-xl bg-stop-soft px-4 py-3 text-sm text-stop" role="alert">{notice}</p>
                )}
                {areaProblem && (
                  <p className="rounded-xl bg-stop-soft px-4 py-3 text-sm text-stop" role="alert">{areaProblem}</p>
                )}

                {/* Before a route exists: shortcuts. After: ride options. */}
                {!pickupCoords || !dropoffCoords ? (
                  <div>
                    <p className="mb-2 text-sm text-road">
                      Search, tap the map, or pick a stop for your{' '}
                      {activeInput === 'pickup' || !pickupCoords ? 'pickup' : 'drop-off'}:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {POPULAR_PLACES.filter((p) => p.name !== pickup && p.name !== dropoff).map((p) => (
                        <button
                          key={p.name}
                          type="button"
                          onClick={() =>
                            selectPlace(activeInput === 'pickup' || !pickupCoords ? 'pickup' : 'dropoff', p.name, p.coords)
                          }
                          className="rounded-full bg-surface px-3.5 py-2 text-sm font-semibold hover:bg-surface-2"
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : areaProblem ? null : (
                  <div>
                    <div className="mb-3 flex items-baseline justify-between">
                      <h2 className="font-display text-lg font-bold">Choose a ride</h2>
                      {distanceKm > 0 && (
                        <span className="text-sm text-road">
                          {distanceKm.toFixed(1)} km · {durationMin} min
                        </span>
                      )}
                    </div>
                    <fieldset className="space-y-2.5">
                      <legend className="sr-only">Ride type</legend>
                      {Object.keys(RIDE_TYPES).map((type) => {
                        const selected = rideType === type;
                        const fare = calcFare(distanceKm, type);
                        return (
                          <label
                            key={type}
                            className={`flex cursor-pointer items-center gap-4 rounded-2xl border-2 p-3.5 transition ${
                              selected ? 'border-ink bg-taxi-soft' : 'border-surface-2 hover:border-road-light'
                            }`}
                          >
                            <input
                              type="radio"
                              name="rideType"
                              value={type}
                              checked={selected}
                              onChange={() => setRideType(type)}
                              className="sr-only"
                            />
                            <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${selected ? 'bg-taxi' : 'bg-surface'}`}>
                              <CarIcon size={26} />
                            </span>
                            <span className="flex-1">
                              <span className="block font-display font-bold">{type.replace('cabTaxi ', '')}</span>
                              <span className="block text-xs text-road">
                                {RIDE_COPY[type]?.blurb} · {RIDE_COPY[type]?.seats} seats
                              </span>
                            </span>
                            <span className="font-display text-lg font-bold">
                              {routeLoading || !fare ? '…' : `₹${fare}`}
                            </span>
                          </label>
                        );
                      })}
                    </fieldset>
                  </div>
                )}
              </div>

              <div className="border-t border-surface-2 bg-white px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-3">
                <button type="submit" disabled={!canBook} className="btn-primary w-full">
                  {canBook
                    ? `Book ${rideType.replace('cabTaxi ', '')} · ₹${estimatedFare}`
                    : areaProblem
                      ? 'Outside service area'
                      : routeLoading
                      ? 'Finding the best route…'
                      : 'Set pickup and drop-off'}
                </button>
              </div>
            </form>
          )}

          {stage === 'pay' && (
            <div className="flex-1 overflow-y-auto px-5 pb-6 pt-3">
              {clientSecret ? (
                <Elements stripe={stripePromise} options={{ clientSecret, appearance: stripeAppearance }}>
                  <CheckoutForm
                    amount={chargedAmount}
                    rideType={rideType}
                    pickup={pickup}
                    dropoff={dropoff}
                    onSuccess={(paymentIntentId) => {
                      setPaymentSuccess(true);
                      saveRide(paymentIntentId);
                    }}
                    onBack={() => {
                      setRideRequested(false);
                      setClientSecret(null);
                    }}
                  />
                </Elements>
              ) : (
                <div className="space-y-3 py-6" aria-live="polite">
                  <div className="h-6 w-40 animate-pulse rounded bg-surface" />
                  <div className="h-24 animate-pulse rounded-2xl bg-surface" />
                  <div className="h-14 animate-pulse rounded-2xl bg-surface" />
                  <p className="text-center text-sm text-road">Confirming your fare…</p>
                </div>
              )}
            </div>
          )}

          {stage === 'done' && (
            <div className="flex flex-1 flex-col items-center justify-center px-6 pb-10 text-center">
              <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-go text-white">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
              </span>
              <h2 className="font-display text-2xl font-bold">₹{chargedAmount} paid</h2>
              {saveError ? (
                <p className="mt-3 rounded-xl bg-stop-soft px-4 py-3 text-sm text-stop">
                  Your payment went through, but the ride wasn&apos;t saved: {saveError}
                </p>
              ) : (
                <p className="mt-2 text-road">Finding you a driver…</p>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
