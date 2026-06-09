import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const mockStats = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api', () => ({
  api: { stats: mockStats },
}));

import CeoDashboard from '@/app/ceo/page';

describe('CEO Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the CEO heading', () => {
    mockStats.mockResolvedValue({ success: true, data: null });
    render(<CeoDashboard />);
    expect(screen.getByText('CEO Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Overview of all branches and staff.')).toBeInTheDocument();
  });

  it('renders stat cards with data', async () => {
    mockStats.mockResolvedValue({
      success: true,
      data: { totalBranches: 3, totalUsers: 25, totalStudents: 450, activeApiKeys: 5, byRole: {} },
    });

    render(<CeoDashboard />);

    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('450')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    expect(screen.getByText('Total Branches')).toBeInTheDocument();
    expect(screen.getByText('Total Staff')).toBeInTheDocument();
    expect(screen.getByText('Total Students')).toBeInTheDocument();
    expect(screen.getByText('Active API Keys')).toBeInTheDocument();
  });

  it('renders staff by role breakdown', async () => {
    mockStats.mockResolvedValue({
      success: true,
      data: { totalBranches: 1, totalUsers: 10, totalStudents: 100, activeApiKeys: 2, byRole: { super_admin: 1, management: 3, teacher: 6 } },
    });

    render(<CeoDashboard />);

    await waitFor(() => {
      expect(screen.getByText('super admin')).toBeInTheDocument();
      expect(screen.getByText('management')).toBeInTheDocument();
      expect(screen.getByText('teacher')).toBeInTheDocument();
    });
  });

  it('renders quick action links', async () => {
    mockStats.mockResolvedValue({ success: true, data: null });
    render(<CeoDashboard />);

    const manageBranchesLink = screen.getByText('Manage Branches').closest('a');
    expect(manageBranchesLink).toHaveAttribute('href', '/ceo/branches');

    const apiKeyLink = screen.getByText('API Key Manager').closest('a');
    expect(apiKeyLink).toHaveAttribute('href', '/key-manager');
    expect(apiKeyLink).toHaveAttribute('target', '_blank');
  });

  it('shows dash placeholders when stats are loading', () => {
    mockStats.mockReturnValue(new Promise(() => {}));
    render(<CeoDashboard />);
    // All stat cards should show dash while loading
    expect(screen.getAllByText('—').length).toBe(4);
  });

  it('shows error message when stats fail', async () => {
    mockStats.mockRejectedValue(new Error('fail'));
    render(<CeoDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load stats')).toBeInTheDocument();
    });
  });
});
