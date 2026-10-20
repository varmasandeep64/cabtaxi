import { ClerkProvider } from '@clerk/nextjs';
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/figtree';
import './globals.css';

export const metadata = {
  title: 'cabTaxi — Book a cab',
  description: 'Labmentix Internship Project - Rapido Clone',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#FFC629',
};

// Clerk's sign-in widgets styled to match the app
const clerkAppearance = {
  variables: {
    colorPrimary: '#1C1C1C',
    colorText: '#1C1C1C',
    borderRadius: '14px',
    fontFamily: '"Figtree Variable", system-ui, sans-serif',
  },
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider afterSignOutUrl="/" appearance={clerkAppearance}>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
