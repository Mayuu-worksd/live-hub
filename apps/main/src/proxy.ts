import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Fully public — no session needed
const FULLY_PUBLIC = ['/login', '/register', '/'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow static assets and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/public/') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const session = request.cookies.get('livehub_session')?.value;
  const role = request.cookies.get('livehub_role')?.value;

  // ── Fully public routes ──────────────────────────────
  if (FULLY_PUBLIC.includes(pathname)) {
    // Redirect already-logged-in users away from login/register
    if (session && role && (pathname === '/login' || pathname === '/register')) {
      return NextResponse.redirect(new URL('/home', request.url));
    }
    return NextResponse.next();
  }

  // ── No session → send to login ───────────────────────
  if (!session) {
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // ── /creator/* → creator/verified_creator only ───────
  if (pathname.startsWith('/creator')) {
    if (!role || !['creator', 'verified_creator'].includes(role)) {
      return NextResponse.redirect(new URL('/home', request.url));
    }
    return NextResponse.next();
  }

  // Note: /admin and /agency are no longer in this app. 
  // If an admin logs into the main app, they act as a viewer on /home.

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

