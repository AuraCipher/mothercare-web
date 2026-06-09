import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const mockStats = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api', () => ({
  api: { stats: mockStats },
}));

import AdminDashboard from '@/app/admin/page';

describe('Admin Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the admin heading', () => {
    mockStats.mockResolvedValue({ success: true, data: null });
    render(<AdminDashboard />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Overview of your school portal.')).toBeInTheDocument();
  });

  it('renders stat cards with data', async () => {
    mockStats.mockResolvedValue({
      success: true,
      data: { totalUsers: 15, totalGroups: 8, totalStudents: 200, totalBranches: 1, byRole: {} },
    });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('200')).toBeInTheDocument();
    });

    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('Classes')).toBeInTheDocument();
    expect(screen.getByText('Students')).toBeInTheDocument();
  });

  it('renders user roles breakdown', async () => {
    mockStats.mockResolvedValue({
      success: true,
      data: { totalUsers: 10, totalGroups: 5, totalStudents: 100, totalBranches: 1, byRole: { teacher: 5, parent: 3 } },
    });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('teacher')).toBeInTheDocument();
      expect(screen.getByText('parent')).toBeInTheDocument();
    });
  });

  it('renders quick action links', async () => {
    mockStats.mockResolvedValue({ success: true, data: null });
    render(<AdminDashboard />);

    const classesLink = screen.getByText('Classes & Groups').closest('a');
    expect(classesLink).toHaveAttribute('href', '/admin/classes');

    const branchesLink = screen.getByText('Branches').closest('a');
    expect(branchesLink).toHaveAttribute('href', '/admin/branches');
  });

  it('shows dash placeholders when stats are loading', () => {
    mockStats.mockReturnValue(new Promise(() => {}));
    render(<AdminDashboard />);
    expect(screen.getAllByText('—').length).toBe(3);
  });

  it('shows error message when stats fail', async () => {
    mockStats.mockRejectedValue(new Error('fail'));
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load stats')).toBeInTheDocument();
    });
  });
});
