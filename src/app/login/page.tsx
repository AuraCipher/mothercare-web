'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { firstAllowedPath } from '@/lib/staff-permissions';

async function resolveAdminLanding(token: string): Promise<string> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return '/admin';
    const payload = JSON.parse(atob(parts[1]));
    const branchId = payload.branchIds?.[0];
    if (!branchId) return '/admin';
    localStorage.setItem('activeBranchId', branchId);
    const res = await api.mePermissions(branchId);
    if (res.data?.isRestricted) return firstAllowedPath(res.data);
  } catch {
    /* fall through */
  }
  return '/admin';
}

export function mapLoginErrorMessage(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes('disabled after graduation')) {
    return 'Your account is closed after graduation. Contact school admin for archive access.';
  }
  if (lower.includes('not enrolled in any active academic year')) {
    return 'No active academic-year enrollment found for this account. Contact school admin.';
  }
  return msg;
}

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // If already logged in, redirect instantly using JWT payload (no API call)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Proxy only reads cookies — sync cookie from localStorage if missing
    const hasCookie = document.cookie.split(';').some((c) => c.trim().startsWith('token='));
    if (!hasCookie) {
      document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
    }

    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        if (payload.role === 'super_admin') {
          router.replace('/ceo');
        } else {
          resolveAdminLanding(token).then((path) => router.replace(path));
        }
        return;
      }
    } catch {
      localStorage.removeItem('token');
      document.cookie = 'token=; path=/; max-age=0';
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim()) { setError('Enter your username, email, or phone'); return; }
    if (!password.trim()) { setError('Enter your password'); return; }

    setLoading(true);

    try {
      const data = await api.login(identifier.trim(), password);

      if (data.success && data.token) {
        localStorage.setItem('token', data.token);
        // Set cookie for proxy middleware (which reads cookies, not localStorage)
        document.cookie = `token=${data.token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;

        // Redirect based on role, or use the redirect param from proxy.ts
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get('redirect');

        if (redirect) {
          router.push(redirect);
        } else if (data.user?.role === 'super_admin') {
          router.push('/ceo');
        } else {
          const path = await resolveAdminLanding(data.token);
          router.push(path);
        }
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Cannot reach the server. Please try again.';
      setError(mapLoginErrorMessage(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#1a1614] px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <svg
            viewBox="0 0 24 24"
            className="mx-auto mb-4 h-8 w-8 stroke-warm-accent"
            fill="none"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          <h1 className="text-xl font-light text-warm-cream">Mother Care School</h1>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="id" className="mb-1.5 block text-xs text-warm-muted">
              Username, email, or phone
            </label>
            <input
              id="id"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Enter your identifier"
              disabled={loading}
              autoComplete="username"
              className="w-full border-b bg-transparent px-0 py-2 text-sm text-warm-cream outline-none transition-colors placeholder:text-warm-muted/40 focus:border-warm-accent"
              style={{ borderColor: 'rgba(240, 235, 227, 0.15)' }}
            />
          </div>

          <div>
            <label htmlFor="pw" className="mb-1.5 block text-xs text-warm-muted">
              Password
            </label>
            <input
              id="pw"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={loading}
              autoComplete="current-password"
              className="w-full border-b bg-transparent px-0 py-2 text-sm text-warm-cream outline-none transition-colors placeholder:text-warm-muted/40 focus:border-warm-accent"
              style={{ borderColor: 'rgba(240, 235, 227, 0.15)' }}
            />
          </div>

          {/* Remember / error */}
          <div className="flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-2 text-xs text-warm-muted">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-warm-card-border bg-warm-card text-warm-accent focus:ring-warm-accent"
              />
              Stay signed in
            </label>
          </div>

          {error && (
            <p className="text-xs text-[#b39a76]">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-warm-accent px-6 py-2.5 text-sm font-medium text-[#1a1614] transition-colors hover:bg-[#b39a76] disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-warm-muted/50">
          All credentials are managed by school admin.
        </p>
      </div>
    </div>
  );
}
