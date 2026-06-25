import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/public/') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/auth/login') || pathname === '/unauthorized') {
    return NextResponse.next();
  }

  const role = request.cookies.get('livehub_role')?.value;

  if (!role) {
    const url = new URL('/auth/login', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  if (!['agency', 'agency_manager', 'moderator', 'admin', 'super_admin'].includes(role)) {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  if (pathname.startsWith('/super-admin') && role !== 'super_admin') {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  if (pathname.startsWith('/admin') && !['admin', 'super_admin'].includes(role)) {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  if (pathname.startsWith('/moderator') && !['moderator', 'admin', 'super_admin'].includes(role)) {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  if (pathname.startsWith('/agency') && !['agency', 'agency_manager', 'super_admin'].includes(role)) {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  if (pathname === '/') {
    return NextResponse.redirect(new URL(getHomeForRole(role), request.url));
  }

  return NextResponse.next();
}

function getHomeForRole(role: string): string {
  if (role === 'super_admin') return '/super-admin';
  if (role === 'admin') return '/admin';
  if (role === 'moderator') return '/moderator';
  if (role === 'agency' || role === 'agency_manager') return '/agency';
  return '/unauthorized';
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
