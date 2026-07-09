import { describe, it, expect } from 'vitest';
import { isAuthRoute, isProtectedRoute, isPublicRoute } from '@/proxy';

describe('Proxy route logic', () => {
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

    it('returns false for /student', () => {
      expect(isPublicRoute('/student')).toBe(false);
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

    it('returns true for nested teacher routes', () => {
      expect(isProtectedRoute('/teacher/classes/g1')).toBe(true);
      expect(isProtectedRoute('/teacher/subjects/a1')).toBe(true);
      expect(isProtectedRoute('/teacher/timetable')).toBe(true);
      expect(isProtectedRoute('/teacher/attendance')).toBe(true);
      expect(isProtectedRoute('/teacher/profile')).toBe(true);
    });

    it('returns true for /student and nested student routes', () => {
      expect(isProtectedRoute('/student')).toBe(true);
      expect(isProtectedRoute('/student/fees')).toBe(true);
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
