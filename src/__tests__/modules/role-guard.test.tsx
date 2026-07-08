import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/* ── Hoisted mocks ── */
const { mockPush, mockReplace } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockReplace: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/admin',
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
}));

function fakeToken(payload: Record<string, any>): string {
  const b64 = btoa(JSON.stringify(payload));
  return `header.${b64}.signature`;
}

function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(atob(parts[1]));
  } catch {
    return null;
  }
}

/** Minimal harness mirroring AdminLayout auth guard useEffect (layout.tsx). */
function AdminLayoutAuthHarness({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const payload = decodeJwtPayload(token);
    if (!payload) {
      router.push('/login');
      return;
    }

    if (payload.role === 'super_admin') {
      router.replace('/ceo');
    }
  }, [router]);

  return <>{children}</>;
}

describe('Role-Based Layout Guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('redirects CEO from /admin to /ceo', async () => {
    localStorage.setItem('token', fakeToken({ id: '1', role: 'super_admin', branchIds: [] }));
    render(<AdminLayoutAuthHarness><div>Admin content</div></AdminLayoutAuthHarness>);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/ceo');
    });
  });

  it('allows non-CEO user into admin layout', async () => {
    localStorage.setItem('token', fakeToken({ id: '2', role: 'branch_admin', branchIds: [] }));
    render(<AdminLayoutAuthHarness><div>Admin content</div></AdminLayoutAuthHarness>);

    await waitFor(() => {
      expect(mockReplace).not.toHaveBeenCalled();
      expect(screen.getByText('Admin content')).toBeInTheDocument();
    });
  });

  it('allows management user into admin layout', async () => {
    localStorage.setItem('token', fakeToken({ id: '3', role: 'management', branchIds: [] }));
    render(<AdminLayoutAuthHarness><div>Admin content</div></AdminLayoutAuthHarness>);

    await waitFor(() => {
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });

  it('redirects to login when token is missing from admin layout', () => {
    localStorage.removeItem('token');
    render(<AdminLayoutAuthHarness><div>Admin content</div></AdminLayoutAuthHarness>);

    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('redirects to login when token has no payload (corrupt)', async () => {
    localStorage.setItem('token', 'not-a-jwt');
    render(<AdminLayoutAuthHarness><div>Admin content</div></AdminLayoutAuthHarness>);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });
});
