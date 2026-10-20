import Link from 'next/link';
import { currentUser } from '@clerk/nextjs/server';
import { UserButton } from '@clerk/nextjs';
import AppShell from '../components/ui/AppShell';
import { SearchIcon, ChevronIcon, SteeringIcon, FlagIcon } from '../components/ui/Icons';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import { RIDE_TYPES } from '../lib/fare';
import { POPULAR_PLACES } from '../lib/places';
import { statusLabel } from '../lib/rideStatus';

function greeting() {
  const hour = Number(
    new Intl.DateTimeFormat('en-IN', { hour: 'numeric', hour12: false, timeZone: 'Asia/Kolkata' }).format(new Date())
  );
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const RIDE_COPY = {
  'cabTaxi Go': 'Everyday hatchbacks',
  'cabTaxi Premier': 'Roomy sedans, top drivers',
};

export default async function DashboardPage() {
  const user = await currentUser();

  // Show an in-progress ride at the top, like a real ride app
  let activeRide = null;
  if (user) {
    const { data } = await supabaseAdmin
      .from('rides')
      .select('id, status, dropoff, driver_name')
      .eq('user_id', user.id)
      .in('status', ['paid', 'accepted', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(1);
    activeRide = data?.[0] || null;
  }

  return (
    <AppShell bare>
      {/* Yellow header block */}
      <section className="bg-taxi px-5 pb-7 pt-6">
        <div className="mb-6 flex items-center justify-between">
          <p className="font-semibold text-ink/70">
            {greeting()}, {user?.firstName || 'rider'}
          </p>
          <UserButton />
        </div>
        <h1 className="font-display text-[34px] font-extrabold leading-none tracking-[-0.02em]">Where to?</h1>
        <Link
          href="/book-ride"
          className="mt-5 flex items-center gap-3 rounded-2xl bg-white px-4 py-4 text-left shadow-float"
        >
          <SearchIcon className="text-ink" />
          <span className="flex-1 text-[15px] text-road">Search a destination</span>
          <span className="rounded-full bg-surface px-3 py-1 text-xs font-semibold text-ink">Now</span>
        </Link>
      </section>
      <div className="checker h-2" aria-hidden="true" />

      <div className="space-y-8 px-5 pt-6">
        {activeRide && (
          <Link
            href={`/ride/${activeRide.id}`}
            className="flex items-center gap-4 rounded-2xl bg-ink p-4 text-white"
          >
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-taxi opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-taxi" />
            </span>
            <span className="flex-1">
              <span className="block font-semibold">{statusLabel(activeRide.status)}</span>
              <span className="block truncate text-sm text-white/70">To {activeRide.dropoff.split(',')[0]}</span>
            </span>
            <span className="text-sm font-semibold text-taxi">Track</span>
          </Link>
        )}

        {/* Popular stops */}
        <section>
          <h2 className="mb-2 font-display text-lg font-bold">Popular near you</h2>
          <ul className="divide-y divide-surface-2">
            {POPULAR_PLACES.map((p) => (
              <li key={p.name}>
                <Link
                  href={`/book-ride?to=${encodeURIComponent(p.name)}&lat=${p.coords[0]}&lon=${p.coords[1]}`}
                  className="flex items-center gap-4 py-3.5"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface">
                    <FlagIcon size={18} />
                  </span>
                  <span className="flex-1">
                    <span className="block font-semibold">{p.name}</span>
                    <span className="block text-sm text-road">{p.area}</span>
                  </span>
                  <ChevronIcon size={18} className="text-road-light" />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Ride options */}
        <section>
          <h2 className="mb-3 font-display text-lg font-bold">Ride options</h2>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(RIDE_TYPES).map(([name, r]) => (
              <Link key={name} href="/book-ride" className="rounded-2xl bg-surface p-4 transition hover:bg-surface-2">
                <span className="block font-display text-base font-bold">{name.replace('cabTaxi ', '')}</span>
                <span className="mt-0.5 block text-xs text-road">{RIDE_COPY[name]}</span>
                <span className="mt-4 block text-sm font-semibold">₹{r.perKm}/km</span>
                <span className="block text-xs text-road">min ₹{r.minFare}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Drive */}
        <Link href="/driver" className="flex items-center gap-4 rounded-2xl border-2 border-ink p-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-taxi">
            <SteeringIcon />
          </span>
          <span className="flex-1">
            <span className="block font-display font-bold">Drive with cabTaxi</span>
            <span className="block text-sm text-road">Accept trips and keep 80% of every fare</span>
          </span>
          <ChevronIcon size={18} />
        </Link>
      </div>
    </AppShell>
  );
}
