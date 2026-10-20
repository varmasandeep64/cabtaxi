import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import Logo from './components/ui/Logo';

export default async function LandingPage() {
  const { userId } = await auth();
  if (userId) redirect('/dashboard');

  return (
    <div className="min-h-[100dvh]">
      <main className="relative mx-auto flex min-h-[100dvh] w-full max-w-[480px] flex-col overflow-hidden bg-taxi md:shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
        <div className="px-6 pt-10">
          <Logo size="md" />
        </div>

        <section className="flex flex-1 flex-col justify-center px-6 py-8">
          <h1 className="font-display text-[44px] font-extrabold leading-[0.95] tracking-[-0.03em] text-ink">
            Cabs across Kalyan, Ulhasnagar &amp; Thane.
          </h1>
          <p className="mt-5 max-w-[32ch] text-lg leading-snug text-ink/80">
            Pick your stop on the map, pay upfront, and watch your driver arrive.
          </p>

          {/* Route illustration: pickup → drop-off */}
          <svg viewBox="0 0 320 120" className="mt-10 w-full" aria-hidden="true">
            <path d="M24 92 C 110 92, 120 28, 200 28 S 296 40, 296 28" fill="none" stroke="#1C1C1C" strokeWidth="14" strokeLinecap="round" />
            <path d="M24 92 C 110 92, 120 28, 200 28 S 296 40, 296 28" fill="none" stroke="#FFC629" strokeWidth="2.5" strokeDasharray="10 10" strokeLinecap="round" />
            <circle cx="24" cy="92" r="11" fill="#fff" stroke="#1C1C1C" strokeWidth="5" />
            <rect x="285" y="17" width="22" height="22" rx="4" fill="#1C1C1C" />
            <rect x="291" y="23" width="10" height="10" rx="1.5" fill="#FFC629" />
          </svg>
        </section>

        <div className="space-y-3 bg-white px-6 pb-[max(24px,env(safe-area-inset-bottom))] pt-6">
          <Link href="/sign-up" className="btn-dark w-full">Create an account</Link>
          <Link href="/sign-in" className="btn-ghost w-full">I already have an account</Link>
          <p className="pt-1 text-center text-xs text-road">Ride or drive — one account does both.</p>
        </div>
        <div className="checker h-3" aria-hidden="true" />
      </main>
    </div>
  );
}
