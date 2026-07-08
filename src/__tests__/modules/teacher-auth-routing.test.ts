import { describe, it, expect } from 'vitest';
import {
  decodeJwtPayload,
  defaultLandingForRole,
  sanitizePostLoginRedirect,
} from '@/lib/teacher/auth-routing';

describe('teacher auth-routing', () => {
  it('decodeJwtPayload reads role from token', () => {
    const payload = { id: '1', role: 'teacher', branchIds: ['b1'] };
    const token = `h.${btoa(JSON.stringify(payload))}.s`;
    expect(decodeJwtPayload(token)?.role).toBe('teacher');
  });

  it('defaultLandingForRole routes teacher to /teacher', () => {
    expect(defaultLandingForRole('teacher')).toBe('/teacher');
    expect(defaultLandingForRole('super_admin')).toBe('/ceo');
    expect(defaultLandingForRole('management')).toBe('/admin');
  });

  it('sanitizePostLoginRedirect blocks external URLs', () => {
    expect(sanitizePostLoginRedirect('/teacher')).toBe('/teacher');
    expect(sanitizePostLoginRedirect('/teacher/classes/g1')).toBe('/teacher/classes/g1');
    expect(sanitizePostLoginRedirect('//evil.com')).toBeNull();
    expect(sanitizePostLoginRedirect('https://evil.com')).toBeNull();
    expect(sanitizePostLoginRedirect('/evil')).toBeNull();
  });
});
