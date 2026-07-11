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
