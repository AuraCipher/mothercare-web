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
import {
  decodeJwtPayload,
  defaultLandingForRole,
  sanitizePostLoginRedirect,
} from '@/lib/teacher/auth-routing';

export const PUBLIC_ROUTES = [
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

export function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true;
  return PUBLIC_ROUTES.some(
    (route) => route !== '/' && pathname.startsWith(route + '/'),
  );
}

export function isProtectedRoute(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/')
    || pathname === '/ceo' || pathname.startsWith('/ceo/')
    || pathname === '/teacher' || pathname.startsWith('/teacher/')
    || pathname === '/student' || pathname.startsWith('/student/')
    || pathname === '/docs' || pathname.startsWith('/docs/');
}

export function isAuthRoute(pathname: string): boolean {
  return pathname === '/login';
}

function roleFromToken(token: string | undefined): string | null {
  if (!token) return null;
  return decodeJwtPayload(token)?.role ?? null;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;
  const role = roleFromToken(token);

  // 1. If user has token and visits login, let the login page handle redirect
  if (isAuthRoute(pathname) && token) {
    return NextResponse.next();
  }

  // 2. Always allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // 3. Protected routes — require token + role-appropriate namespace
  if (isProtectedRoute(pathname)) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      const safeRedirect = sanitizePostLoginRedirect(pathname);
      if (safeRedirect) loginUrl.searchParams.set('redirect', safeRedirect);
      return NextResponse.redirect(loginUrl);
    }

    if (pathname.startsWith('/teacher') && role && role !== 'teacher') {
      const dest = defaultLandingForRole(role);
      return NextResponse.redirect(new URL(dest, request.url));
    }

    if (pathname.startsWith('/student') && role && role !== 'student') {
      const dest = defaultLandingForRole(role);
      return NextResponse.redirect(new URL(dest, request.url));
    }

    if (pathname.startsWith('/admin') && role === 'teacher') {
      return NextResponse.redirect(new URL('/teacher', request.url));
    }

    if (pathname.startsWith('/admin') && role === 'student') {
      return NextResponse.redirect(new URL('/student', request.url));
    }

    if (pathname.startsWith('/ceo') && role && role !== 'super_admin') {
      const dest = defaultLandingForRole(role);
      return NextResponse.redirect(new URL(dest, request.url));
    }

    return NextResponse.next();
  }

  // 4. Default: allow through
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
