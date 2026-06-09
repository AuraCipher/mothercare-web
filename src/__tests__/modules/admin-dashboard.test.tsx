import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const mockStats = vi.hoisted(() => vi.fn());
const mockGetBranchStats = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/admin',
}));

vi.mock('@/lib/api', () => ({
  api: { stats: mockStats, getBranchStats: mockGetBranchStats },
}));

import AdminDashboard from '@/app/admin/page';

describe('Admin Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders the admin heading', () => {
    render(<AdminDashboard />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText(/Overview of your school portal/)).toBeInTheDocument();
  });

  it('renders stat cards with data (branch stats)', async () => {
    localStorage.setItem('activeBranchId', 'branch-1');
    mockGetBranchStats.mockResolvedValue({
      success: true,
      data: {
        name: 'Test Branch',
        stats: { totalStaff: 10, totalTeachers: 5, totalStudents: 200, totalClasses: 13, totalAcademicYears: 1 },
        admins: [{ name: 'Admin One', email: 'admin@test.com', since: '2025-01-01' }],
      },
    });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('200')).toBeInTheDocument();
      expect(screen.getByText('13')).toBeInTheDocument();
    });

    // Some labels appear in both stats and quick actions — verify count
    expect(screen.getByText('Total Staff')).toBeInTheDocument();
    expect(screen.getAllByText('Teachers').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Students').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Classes').length).toBeGreaterThanOrEqual(1);
  });

  it('shows select branch message when no activeBranchId', async () => {
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/No branch selected/i)).toBeInTheDocument();
    });
  });

  it('shows admin info banner when admin data is available', async () => {
    localStorage.setItem('activeBranchId', 'branch-1');
    mockGetBranchStats.mockResolvedValue({
      success: true,
      data: {
        name: 'Test Branch',
        stats: { totalStaff: 0, totalTeachers: 0, totalStudents: 0, totalClasses: 0, totalAcademicYears: 0 },
        admins: [{ name: 'Principal Admin', email: 'principal@school.com', since: '2025-06-01' }],
      },
    });

    render(<AdminDashboard />);

    expect(await screen.findByText('Principal Admin')).toBeInTheDocument();
  });

  it('renders all quick action buttons', async () => {
    mockStats.mockResolvedValue({ success: true, data: null });
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Register & manage students')).toBeInTheDocument();
      expect(screen.getByText('Manage teaching staff')).toBeInTheDocument();
      expect(screen.getByText('View branch members & roles')).toBeInTheDocument();
      expect(screen.getByText('Manage class groups')).toBeInTheDocument();
    });
  });

  it('shows loading skeleton with 4 animated placeholders when branch selected', () => {
    localStorage.setItem('activeBranchId', 'branch-1');
    mockGetBranchStats.mockReturnValue(new Promise(() => {}));
    const { container } = render(<AdminDashboard />);
    expect(container.querySelectorAll('.animate-pulse').length).toBe(4);
  });

  it('shows error message when branch stats fail', async () => {
    localStorage.setItem('activeBranchId', 'branch-1');
    mockGetBranchStats.mockRejectedValue(new Error('fail'));
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(mockGetBranchStats).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.queryByText(/fail/i)).toBeInTheDocument();
    }, { timeout: 2000 });
  });
});
