/**
 * Mother Care School — Route Protection Proxy
 *
 * Next.js 16 renamed middleware → proxy. This file runs on every matching request
 * before it reaches the app, handling auth redirects and route protection.
 *
 * Classification order: auth routes → public routes → protected routes.
 * Token presence is checked (not validated — downstream routes must verify).
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/about',
  '/academics',
  '/admission',
  '/news',
  '/blog',
  '/reviews',
  '/contact',
  '/resources',
];

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true;
  return PUBLIC_ROUTES.some(
    (route) => route !== '/' && pathname.startsWith(route + '/'),
  );
}

function isProtectedRoute(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/')
      || pathname === '/ceo' || pathname.startsWith('/ceo/');
}

function isAuthRoute(pathname: string): boolean {
  return pathname === '/login';
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  // 1. If user has token and visits login, redirect to admin
  if (isAuthRoute(pathname) && token) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // 2. Always allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // 3. Protected routes — require token
  if (isProtectedRoute(pathname)) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // 4. Default: allow through
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static assets, images, and favicon
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
