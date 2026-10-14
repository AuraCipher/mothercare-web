import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isTokenExpired,
  clearAuthStorage,
} from '@/lib/teacher/auth-routing';

/** Unsigned fake JWT — signature never verified client-side. */
function fakeJwt(payload: Record<string, unknown>): string {
  return `h.${btoa(JSON.stringify(payload))}.s`;
}

const FUTURE = Math.floor(Date.now() / 1000) + 3600;
const PAST = Math.floor(Date.now() / 1000) - 3600;

describe('isTokenExpired', () => {
  it('returns false for a token expiring in the future', () => {
    expect(isTokenExpired(fakeJwt({ exp: FUTURE, role: 'admin' }))).toBe(false);
  });

  it('returns true for a token past its exp (the 7-day expiry case)', () => {
    expect(isTokenExpired(fakeJwt({ exp: PAST, role: 'admin' }))).toBe(true);
  });

  it('returns true when there is no token at all', () => {
    expect(isTokenExpired(null)).toBe(true);
    expect(isTokenExpired(undefined)).toBe(true);
    expect(isTokenExpired('')).toBe(true);
  });

  it('returns false for malformed tokens (decode-failure paths own those)', () => {
    expect(isTokenExpired('not-a-jwt')).toBe(false);
  });

  it('returns false when there is no exp claim (server enforces via 401)', () => {
    expect(isTokenExpired(fakeJwt({ role: 'admin' }))).toBe(false);
  });
});

describe('clearAuthStorage', () => {
  it('wipes token, scope keys and the proxy cookie', () => {
    localStorage.setItem('token', 't');
    localStorage.setItem('activeBranchId', 'b');
    localStorage.setItem('activeAYId', 'y');
    document.cookie = 'token=t; path=/';
    clearAuthStorage();
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('activeBranchId')).toBeNull();
    expect(localStorage.getItem('activeAYId')).toBeNull();
    expect(document.cookie).not.toContain('token=t');
  });
});

describe('apiRequest 401 handling', () => {
  const realLocation = window.location;

  function stubLocation(pathname: string) {
    const stub = { href: `http://localhost${pathname}`, pathname };
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: stub,
    });
    return stub;
  }

  function mockFetch(status: number, body: unknown) {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: status >= 200 && status < 300,
        status,
        json: async () => body,
      }),
    );
  }

  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    document.cookie = 'token=; path=/; max-age=0';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: realLocation,
    });
  });

  it('expired session: clears auth and redirects any portal page to login', async () => {
    localStorage.setItem('token', fakeJwt({ exp: PAST, role: 'admin' }));
    document.cookie = 'token=old; path=/';
    const loc = stubLocation('/admin/teachers');
    mockFetch(401, { success: false, message: 'Token expired' });

    const { apiRequest } = await import('@/lib/api');
    await expect(apiRequest('/admin/teachers')).rejects.toThrow('Session expired');
    expect(localStorage.getItem('token')).toBeNull();
    expect(document.cookie).not.toContain('token=old');
    expect(loc.href).toBe('/login?redirect=%2Fadmin%2Fteachers');
  });

  it('does not redirect public (tokenless) 401s — e.g. bad invite links', async () => {
    const loc = stubLocation('/admin/students/operations');
    mockFetch(401, { success: false, message: 'Invalid invitation' });

    const { apiRequest } = await import('@/lib/api');
    await expect(apiRequest('/admin/invitations/abc')).rejects.toThrow('Invalid invitation');
    expect(loc.href).toBe('http://localhost/admin/students/operations');
  });

  it('does not redirect failed logins (wrong password stays on the form)', async () => {
    const loc = stubLocation('/login');
    mockFetch(401, { success: false, message: 'Invalid credentials' });

    const { api } = await import('@/lib/api');
    await expect(api.login('x', 'wrong')).rejects.toThrow('Invalid credentials');
    expect(loc.href).toBe('http://localhost/login');
  });

  it('passes successful responses through untouched', async () => {
    localStorage.setItem('token', fakeJwt({ exp: FUTURE, role: 'teacher' }));
    const loc = stubLocation('/teacher');
    mockFetch(200, { success: true, data: { hello: 1 } });

    const { apiRequest } = await import('@/lib/api');
    await expect(apiRequest('/teacher/bootstrap')).resolves.toEqual({
      success: true,
      data: { hello: 1 },
    });
    expect(localStorage.getItem('token')).not.toBeNull();
    expect(loc.href).toBe('http://localhost/teacher');
  });
});
