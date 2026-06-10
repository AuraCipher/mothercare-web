import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

/* ── Hoisted mocks ── */
const { mockPush, mockReplace } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockReplace: vi.fn(),
}));

const mockMe = vi.hoisted(() => vi.fn());
const mockMeBranches = vi.hoisted(() => vi.fn());

const mockApi = vi.hoisted(() => ({
  api: {
    me: mockMe,
    meBranches: mockMeBranches,
    logout: vi.fn(),
  },
}));

/* ── Module mocks ── */
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/admin',
}));

vi.mock('@/lib/api', () => mockApi);

// Mock framer-motion-like components / lucide
vi.mock('lucide-react', () => ({
  LogOut: 'div', BookOpen: 'div', LayoutDashboard: 'div', Building2: 'div',
  Menu: 'div', X: 'div', ChevronDown: 'div', Check: 'div', MapPin: 'div',
  Users: 'div', Key: 'div', GraduationCap: 'div', UserPlus: 'div', Settings: 'div',
}));

import AdminLayout from '@/app/admin/layout';

describe('Role-Based Layout Guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  // ── Admin layout guards ──

  it('redirects CEO from /admin to /ceo', async () => {
    mockMe.mockResolvedValue({
      success: true,
      user: { id: '1', name: 'CEO User', role: 'super_admin', branchIds: [] },
    });
    mockMeBranches.mockResolvedValue({ success: true, data: [] });

    localStorage.setItem('token', 'some-token');
    render(<AdminLayout><div>Admin content</div></AdminLayout>);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/ceo');
    });
  });

  it('allows non-CEO user into admin layout', async () => {
    mockMe.mockResolvedValue({
      success: true,
      user: { id: '2', name: 'Branch Admin', role: 'branch_admin', branchIds: [] },
    });
    mockMeBranches.mockResolvedValue({ success: true, data: [] });

    localStorage.setItem('token', 'some-token');
    render(<AdminLayout><div>Admin content</div></AdminLayout>);

    await waitFor(() => {
      expect(mockReplace).not.toHaveBeenCalled();
      // Should show admin content
      expect(screen.getByText('Admin content')).toBeInTheDocument();
    });
  });

  it('allows management user into admin layout', async () => {
    mockMe.mockResolvedValue({
      success: true,
      user: { id: '3', name: 'Manager', role: 'management', branchIds: [] },
    });
    mockMeBranches.mockResolvedValue({ success: true, data: [] });

    localStorage.setItem('token', 'some-token');
    render(<AdminLayout><div>Admin content</div></AdminLayout>);

    await waitFor(() => {
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });

  it('redirects to login when token is missing from admin layout', () => {
    localStorage.removeItem('token');
    render(<AdminLayout><div>Admin content</div></AdminLayout>);

    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('redirects to login when /me returns failure in admin layout', async () => {
    mockMe.mockResolvedValue({ success: false });

    localStorage.setItem('token', 'invalid-token');
    render(<AdminLayout><div>Admin content</div></AdminLayout>);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('redirects to login when /me throws in admin layout', async () => {
    mockMe.mockRejectedValue(new Error('Network error'));

    localStorage.setItem('token', 'some-token');
    render(<AdminLayout><div>Admin content</div></AdminLayout>);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });
});
