import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockGetBranchStats = vi.hoisted(() => vi.fn());
const mockRemoveAdmin = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api', () => ({
  api: { getBranchStats: mockGetBranchStats, removeAdmin: mockRemoveAdmin },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
  useParams: () => ({ id: 'branch-1' }),
}));

import CeoBranchDetail from '@/app/ceo/branches/[id]/page';

describe('CEO Branch Detail Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders branch name and header info', async () => {
    mockGetBranchStats.mockResolvedValue({
      success: true,
      data: {
        id: 'branch-1',
        name: 'Mother Care Sohan',
        code: 'MCS-SOHAN',
        address: 'Sohan, Islamabad',
        phone: '+92 300 1234567',
        email: 'sohan@mothercare.edu',
        isActive: true,
        stats: { totalStaff: 10, totalTeachers: 5, totalStudents: 200, totalClasses: 13, totalAcademicYears: 2 },
        admins: [{ id: 'u-1', name: 'Admin One', email: 'admin@test.com', phone: null, status: 'active', since: '2025-01-01' }],
      },
    });

    render(<CeoBranchDetail />);

    await waitFor(() => {
      expect(screen.getByText('Mother Care Sohan')).toBeInTheDocument();
      expect(screen.getByText('MCS-SOHAN')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });

  it('renders stat cards with correct values', async () => {
    mockGetBranchStats.mockResolvedValue({
      success: true,
      data: {
        id: 'branch-1', name: 'Test', code: 'TST', address: null, phone: null, email: null, isActive: true,
        stats: { totalStaff: 8, totalTeachers: 3, totalStudents: 150, totalClasses: 12, totalAcademicYears: 1 },
        admins: [],
      },
    });

    render(<CeoBranchDetail />);

    await waitFor(() => {
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
    });

    expect(screen.getByText('Total Staff')).toBeInTheDocument();
    expect(screen.getByText('Total Teachers')).toBeInTheDocument();
    expect(screen.getByText('Total Students')).toBeInTheDocument();
    expect(screen.getByText('Classes')).toBeInTheDocument();
  });

  it('shows admin section with admin info', async () => {
    mockGetBranchStats.mockResolvedValue({
      success: true,
      data: {
        id: 'branch-1', name: 'Test', code: 'TST', address: null, phone: null, email: null, isActive: true,
        stats: { totalStaff: 0, totalTeachers: 0, totalStudents: 0, totalClasses: 0, totalAcademicYears: 0 },
        admins: [{ id: 'u-1', name: 'Admin One', email: 'admin@test.com', phone: '+92 300 1234567', status: 'active', since: '2025-06-01' }],
      },
    });

    render(<CeoBranchDetail />);

    await waitFor(() => {
      expect(screen.getByText('Admin One')).toBeInTheDocument();
      expect(screen.getByText('admin@test.com')).toBeInTheDocument();
    });
  });

  it('shows invite prompt when no admin assigned', async () => {
    mockGetBranchStats.mockResolvedValue({
      success: true,
      data: {
        id: 'branch-1', name: 'Test', code: 'TST', address: null, phone: null, email: null, isActive: true,
        stats: { totalStaff: 0, totalTeachers: 0, totalStudents: 0, totalClasses: 0, totalAcademicYears: 0 },
        admins: [],
      },
    });

    render(<CeoBranchDetail />);

    await waitFor(() => {
      expect(screen.getByText('No admin assigned to this branch.')).toBeInTheDocument();
      expect(screen.getByText('Invite an admin →')).toBeInTheDocument();
    });
  });

  it('shows error state for failed load', async () => {
    mockGetBranchStats.mockRejectedValue(new Error('Branch not found'));

    render(<CeoBranchDetail />);

    await waitFor(() => {
      expect(screen.getByText('Branch not found')).toBeInTheDocument();
    });
  });

  it('renders quick action buttons', async () => {
    mockGetBranchStats.mockResolvedValue({
      success: true,
      data: {
        id: 'branch-1', name: 'Test', code: 'TST', address: null, phone: null, email: null, isActive: true,
        stats: { totalStaff: 0, totalTeachers: 0, totalStudents: 0, totalClasses: 0, totalAcademicYears: 0 },
        admins: [],
      },
    });

    render(<CeoBranchDetail />);

    await waitFor(() => {
      expect(screen.getByText('Invite New Admin')).toBeInTheDocument();
      expect(screen.getByText('Manage Branch')).toBeInTheDocument();
      expect(screen.getByText('API Keys')).toBeInTheDocument();
    });
  });

  // ─── Remove Admin tests ─────────────────────────────

  it('shows remove admin button for active admins', async () => {
    mockGetBranchStats.mockResolvedValue({
      success: true,
      data: {
        id: 'branch-1', name: 'Test', code: 'TST', address: null, phone: null, email: null, isActive: true,
        stats: { totalStaff: 0, totalTeachers: 0, totalStudents: 0, totalClasses: 0, totalAcademicYears: 0 },
        admins: [{ id: 'u-1', name: 'Active Admin', email: 'admin@test.com', phone: null, status: 'active', since: '2025-01-01' }],
      },
    });

    render(<CeoBranchDetail />);

    await waitFor(() => {
      expect(screen.getByText('Active Admin')).toBeInTheDocument();
      expect(screen.getByTitle('Remove admin')).toBeInTheDocument();
    });
  });

  it('hides remove admin button for inactive admins', async () => {
    mockGetBranchStats.mockResolvedValue({
      success: true,
      data: {
        id: 'branch-1', name: 'Test', code: 'TST', address: null, phone: null, email: null, isActive: true,
        stats: { totalStaff: 0, totalTeachers: 0, totalStudents: 0, totalClasses: 0, totalAcademicYears: 0 },
        admins: [{ id: 'u-1', name: 'Inactive Admin', email: 'admin@test.com', phone: null, status: 'inactive', since: '2025-01-01' }],
      },
    });

    render(<CeoBranchDetail />);

    await waitFor(() => {
      expect(screen.getByText('Inactive Admin')).toBeInTheDocument();
    });

    expect(screen.queryByTitle('Remove admin')).not.toBeInTheDocument();
  });

  it('opens confirmation modal when remove admin is clicked', async () => {
    const user = userEvent.setup();
    mockRemoveAdmin.mockResolvedValue({ success: true });

    mockGetBranchStats.mockResolvedValue({
      success: true,
      data: {
        id: 'branch-1', name: 'Test', code: 'TST', address: null, phone: null, email: null, isActive: true,
        stats: { totalStaff: 0, totalTeachers: 0, totalStudents: 0, totalClasses: 0, totalAcademicYears: 0 },
        admins: [{ id: 'u-1', name: 'Admin To Remove', email: 'admin@test.com', phone: null, status: 'active', since: '2025-01-01' }],
      },
    });

    render(<CeoBranchDetail />);

    await waitFor(() => {
      expect(screen.getByText('Admin To Remove')).toBeInTheDocument();
    });

    // Click the remove button
    await user.click(screen.getByTitle('Remove admin'));

    // Confirmation modal should appear
    await waitFor(() => {
      expect(screen.getByText('Remove Admin?')).toBeInTheDocument();
    });
    expect(screen.getByText(/credentials will be deactivated/i)).toBeInTheDocument();
  });

  it('calls removeAdmin API when confirm is clicked', async () => {
    const user = userEvent.setup();
    mockRemoveAdmin.mockResolvedValue({ success: true });

    mockGetBranchStats.mockResolvedValue({
      success: true,
      data: {
        id: 'branch-1', name: 'Test', code: 'TST', address: null, phone: null, email: null, isActive: true,
        stats: { totalStaff: 0, totalTeachers: 0, totalStudents: 0, totalClasses: 0, totalAcademicYears: 0 },
        admins: [{ id: 'u-1', name: 'Admin To Remove', email: 'admin@test.com', phone: null, status: 'active', since: '2025-01-01' }],
      },
    });

    render(<CeoBranchDetail />);

    await waitFor(() => {
      expect(screen.getByText('Admin To Remove')).toBeInTheDocument();
    });

    await user.click(screen.getByTitle('Remove admin'));

    await waitFor(() => {
      expect(screen.getByText('Remove Admin?')).toBeInTheDocument();
    });

    // Click the confirm button in the modal
    const confirmBtn = screen.getByText('Remove Admin').closest('button');
    if (confirmBtn) await user.click(confirmBtn);

    await waitFor(() => {
      expect(mockRemoveAdmin).toHaveBeenCalledWith('branch-1', 'u-1');
    });
  });
});
