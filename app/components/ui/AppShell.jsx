'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HomeIcon, CarIcon, ClockIcon, SteeringIcon, BackIcon } from './Icons';

const TABS = [
  { href: '/dashboard', label: 'Home', Icon: HomeIcon },
  { href: '/book-ride', label: 'Ride', Icon: CarIcon },
  { href: '/ride-history', label: 'Trips', Icon: ClockIcon },
  { href: '/driver', label: 'Drive', Icon: SteeringIcon },
];

/**
 * Phone-width app frame used by every signed-in screen.
 * On desktop it sits centred like a device, so the app always looks the way it does on a phone.
 */
export default function AppShell({ title, back, right, children, tabs = true, night = false, bare = false }) {
  const pathname = usePathname();

  return (
    <div className={`min-h-[100dvh] ${night ? 'theme-night' : ''}`}>
      <div
        className={`relative mx-auto flex min-h-[100dvh] w-full max-w-[480px] flex-col md:shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_20px_60px_rgba(0,0,0,0.12)] ${
          night ? 'bg-night text-white' : 'bg-white text-ink'
        }`}
      >
        {!bare && (
          <header
            className={`sticky top-0 z-30 flex h-14 items-center gap-2 px-4 ${
              night ? 'bg-night/95' : 'bg-white/95'
            } backdrop-blur`}
          >
            {back && (
              <Link
                href={back}
                aria-label="Back"
                className={`-ml-2 flex h-10 w-10 items-center justify-center rounded-full ${
                  night ? 'hover:bg-night-2' : 'hover:bg-surface'
                }`}
              >
                <BackIcon />
              </Link>
            )}
            <h1 className="flex-1 truncate font-display text-lg font-bold tracking-tight">{title}</h1>
            {right}
          </header>
        )}

        <main className={`flex-1 ${tabs ? 'pb-24' : ''}`}>{children}</main>

        {tabs && (
          <nav
            aria-label="Main"
            className={`fixed bottom-0 left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 border-t pb-[env(safe-area-inset-bottom)] ${
              night ? 'border-night-3 bg-night' : 'border-surface-2 bg-white'
            }`}
          >
            <ul className="grid grid-cols-4">
              {TABS.map(({ href, label, Icon }) => {
                const active = pathname === href || pathname.startsWith(href + '/');
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={active ? 'page' : undefined}
                      className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold ${
                        active
                          ? night ? 'text-taxi' : 'text-ink'
                          : night ? 'text-road-light' : 'text-road'
                      }`}
                    >
                      <span
                        className={`flex h-8 w-14 items-center justify-center rounded-full transition ${
                          active ? (night ? 'bg-night-3' : 'bg-taxi') : ''
                        }`}
                      >
                        <Icon size={20} />
                      </span>
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}
      </div>
    </div>
  );
}
