import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Pages anyone can open without signing in. Everything else requires login.
const isPublicRoute = createRouteMatcher(['/', '/sign-in(.*)', '/sign-up(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|kit)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
