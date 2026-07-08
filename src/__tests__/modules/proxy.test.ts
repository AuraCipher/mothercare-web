import { describe, it, expect } from 'vitest';

describe('Proxy route logic', () => {
  // Replicate the pure functions from proxy.ts for testing
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
        || pathname === '/ceo' || pathname.startsWith('/ceo/')
        || pathname === '/teacher' || pathname.startsWith('/teacher/');
  }

  function isAuthRoute(pathname: string): boolean {
    return pathname === '/login';
  }

  describe('isPublicRoute', () => {
    it('returns true for root path', () => {
      expect(isPublicRoute('/')).toBe(true);
    });

    it('returns true for /login', () => {
      expect(isPublicRoute('/login')).toBe(true);
    });

    it('returns true for /about', () => {
      expect(isPublicRoute('/about')).toBe(true);
    });

    it('returns true for /news/some-article', () => {
      expect(isPublicRoute('/news/some-article')).toBe(true);
    });

    it('returns false for /admin', () => {
      expect(isPublicRoute('/admin')).toBe(false);
    });

    it('returns false for /admin/dashboard', () => {
      expect(isPublicRoute('/admin/dashboard')).toBe(false);
    });

    it('returns false for /ceo', () => {
      expect(isPublicRoute('/ceo')).toBe(false);
    });

    it('returns false for /ceo/branches', () => {
      expect(isPublicRoute('/ceo/branches')).toBe(false);
    });

    it('returns false for /teacher', () => {
      expect(isPublicRoute('/teacher')).toBe(false);
    });
  });

  describe('isProtectedRoute', () => {
    it('returns true for /admin', () => {
      expect(isProtectedRoute('/admin')).toBe(true);
    });

    it('returns true for /admin/dashboard', () => {
      expect(isProtectedRoute('/admin/dashboard')).toBe(true);
    });

    it('returns true for /ceo', () => {
      expect(isProtectedRoute('/ceo')).toBe(true);
    });

    it('returns true for /ceo/branches', () => {
      expect(isProtectedRoute('/ceo/branches')).toBe(true);
    });

    it('returns true for /teacher', () => {
      expect(isProtectedRoute('/teacher')).toBe(true);
    });

    it('returns true for /teacher/my-classes', () => {
      expect(isProtectedRoute('/teacher/my-classes')).toBe(true);
    });

    it('returns false for /admin-settings', () => {
      expect(isProtectedRoute('/admin-settings')).toBe(false);
    });

    it('returns false for /ceo-settings', () => {
      expect(isProtectedRoute('/ceo-settings')).toBe(false);
    });

    it('returns false for /', () => {
      expect(isProtectedRoute('/')).toBe(false);
    });
  });

  describe('isAuthRoute', () => {
    it('returns true for /login', () => {
      expect(isAuthRoute('/login')).toBe(true);
    });

    it('returns false for /login/callback', () => {
      expect(isAuthRoute('/login/callback')).toBe(false);
    });

    it('returns false for /admin', () => {
      expect(isAuthRoute('/admin')).toBe(false);
    });
  });
});
