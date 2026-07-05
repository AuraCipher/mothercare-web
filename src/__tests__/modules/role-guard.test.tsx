import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

/* ── Hoisted mocks ── */
const { mockPush, mockReplace } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockReplace: vi.fn(),
}));

const mockMeBranches = vi.hoisted(() => vi.fn());

const mockApi = vi.hoisted(() => ({
  api: {
    meBranches: mockMeBranches,
    logout: vi.fn(),
  },
}));

/* ── Helper: create a fake JWT that decodeJwtPayload can read ── */
function fakeToken(payload: Record<string, any>): string {
  const b64 = btoa(JSON.stringify(payload));
  return `header.${b64}.signature`;
}

/* ── Module mocks ── */
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/admin',
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/lib/api', () => mockApi);

vi.mock('lucide-react', () => ({
  LogOut: 'div', BookOpen: 'div', LayoutDashboard: 'div', Building2: 'div',
  Menu: 'div', X: 'div', DollarSign: 'div', ChevronDown: 'div', Check: 'div',
  MapPin: 'div', Users: 'div', Key: 'div', GraduationCap: 'div', UserPlus: 'div',
  Settings: 'div', Calendar: 'div', CalendarDays: 'div', Send: 'div', CheckSquare: 'div',
  ArrowLeft: 'div', ArrowRight: 'div', ChevronRight: 'div', ChevronLeft: 'div',
  Plus: 'div', Trash2: 'div', Edit: 'div', Search: 'div', Filter: 'div',
  MoreHorizontal: 'div', ClipboardList: 'div', Crown: 'div', Shield: 'div',
  UserCog: 'div', UserCheck: 'div', UserX: 'div', RefreshCw: 'div', Loader2: 'div',
  AlertCircle: 'div', CheckCircle: 'div', XCircle: 'div', Info: 'div',
  FileText: 'div', Download: 'div', Printer: 'div', Eye: 'div', EyeOff: 'div',
}));

vi.mock('@/components/toast', () => ({ default: () => null, showToast: vi.fn() }));
vi.mock('@/components/doc-nav', () => ({ default: () => null }));
vi.mock('@/components/doc-action-menu', () => ({ default: () => null }));
vi.mock('@/config', () => ({ default: { apiUrl: 'http://test' } }));

import AdminLayout from '@/app/admin/layout';

describe('Role-Based Layout Guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  // ── Admin layout guards ──

  it('redirects CEO from /admin to /ceo', async () => {
    mockMeBranches.mockResolvedValue({ success: true, data: [] });
    localStorage.setItem('token', fakeToken({ id: '1', role: 'super_admin', branchIds: [] }));
    render(<AdminLayout><div>Admin content</div></AdminLayout>);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/ceo');
    });
  });

  it('allows non-CEO user into admin layout', async () => {
    mockMeBranches.mockResolvedValue({ success: true, data: [] });
    localStorage.setItem('token', fakeToken({ id: '2', role: 'branch_admin', branchIds: [] }));
    render(<AdminLayout><div>Admin content</div></AdminLayout>);

    await waitFor(() => {
      expect(mockReplace).not.toHaveBeenCalled();
      expect(screen.getByText('Admin content')).toBeInTheDocument();
    });
  });

  it('allows management user into admin layout', async () => {
    mockMeBranches.mockResolvedValue({ success: true, data: [] });
    localStorage.setItem('token', fakeToken({ id: '3', role: 'management', branchIds: [] }));
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

  it('redirects to login when token has no payload (corrupt)', async () => {
    localStorage.setItem('token', 'not-a-jwt');
    render(<AdminLayout><div>Admin content</div></AdminLayout>);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });
});
