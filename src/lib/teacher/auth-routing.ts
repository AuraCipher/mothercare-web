/** Decode JWT payload client-side (routing only — API validates server-side). */
export function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(atob(parts[1]));
  } catch {
    return null;
  }
}

/**
 * True only when a well-formed JWT is past its `exp` claim
 * (seconds-since-epoch, as issued by the backend's 7-day JWT_EXPIRY).
 * Deliberately narrow: malformed strings and tokens without an `exp` claim
 * return false — those are handled by the decode-failure paths (layouts
 * clear on `!payload`) and the apiRequest 401 hook, so this helper never
 * second-guesses non-JWT values sitting in storage.
 */
export function isTokenExpired(token: string | null | undefined): boolean {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1]));
    if (typeof payload.exp !== 'number') return false;
    return payload.exp * 1000 <= Date.now();
  } catch {
    return false;
  }
}

/** Wipe every client-side auth artifact (localStorage + proxy cookie). */
export function clearAuthStorage(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
  localStorage.removeItem('activeBranchId');
  localStorage.removeItem('activeAYId');
  localStorage.removeItem('activeAYStatus');
  document.cookie = 'token=; path=/; max-age=0';
}

const ALLOWED_REDIRECT_PREFIXES = ['/teacher', '/student', '/admin', '/ceo', '/docs'] as const;

/** Prevent open redirects after login. */
export function sanitizePostLoginRedirect(path: string | null | undefined): string | null {
  if (!path || !path.startsWith('/')) return null;
  if (path.startsWith('//')) return null;
  const allowed = ALLOWED_REDIRECT_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
  return allowed ? path : null;
}

export function defaultLandingForRole(role: string | undefined): string {
  if (role === 'super_admin') return '/ceo';
  if (role === 'teacher') return '/teacher';
  if (role === 'student') return '/student';
  return '/admin';
}
