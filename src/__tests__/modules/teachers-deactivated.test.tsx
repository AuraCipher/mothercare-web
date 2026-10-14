import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '../helpers/test-utils';
import userEvent from '@testing-library/user-event';

const mockGetTeachers = vi.hoisted(() => vi.fn());
const mockReactivateTeacher = vi.hoisted(() => vi.fn());
const mockDeleteTeacher = vi.hoisted(() => vi.fn());
const mockPush = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/admin/teachers/deactivated',
}));

vi.mock('@/lib/api', () => ({
  api: {
    getTeachers: mockGetTeachers,
    reactivateTeacher: mockReactivateTeacher,
    deleteTeacher: mockDeleteTeacher,
  },
}));

const localStorageMock = (() => {
  const store: Record<string, string> = { token: 'test-jwt' };
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => {},
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

import DeactivatedTeachersPage from '@/app/admin/teachers/deactivated/page';

const mockInactiveTeachers = [
  {
    id: 'tp-1', userId: 'u-1', employeeId: 'TCH-001', qualification: 'M.Sc',
    specialization: 'Mathematics',
    user: { id: 'u-1', name: 'Ms. Sarah', email: null, phone: null, role: 'teacher', status: 'inactive' },
    _count: { assignments: 2 },
  },
  {
    id: 'tp-2', userId: 'u-2', employeeId: null, qualification: null,
    specialization: null,
    user: { id: 'u-2', name: 'Mr. Ahmed', email: null, phone: null, role: 'teacher', status: 'inactive' },
    _count: { assignments: 0 },
  },
];

describe('DeactivatedTeachersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTeachers.mockResolvedValue({
      success: true,
      data: mockInactiveTeachers,
      meta: { page: 1, limit: 20, total: 2, totalPages: 1 },
    });
    mockReactivateTeacher.mockResolvedValue({ success: true });
  });

  it('requests only inactive teachers', async () => {
    render(<DeactivatedTeachersPage />);
    await screen.findByText('Ms. Sarah');
    expect(mockGetTeachers).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'inactive' }),
    );
  });

  it('renders inactive teachers with a reactivate action', async () => {
    render(<DeactivatedTeachersPage />);
    await screen.findByText('Ms. Sarah');
    expect(screen.getByText('Mr. Ahmed')).toBeInTheDocument();
    expect(screen.getAllByTitle('Reactivate teacher')).toHaveLength(2);
  });

  it('reactivates a teacher through the confirm flow', async () => {
    const user = userEvent.setup();
    render(<DeactivatedTeachersPage />);
    await screen.findByText('Ms. Sarah');

    await user.click(screen.getAllByTitle('Reactivate teacher')[0]);
    expect(await screen.findByText('Reactivate "Ms. Sarah"?')).toBeInTheDocument();

    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Reactivate' }));
    expect(mockReactivateTeacher).toHaveBeenCalledWith('tp-1');
  });

  it('shows empty state when nobody is deactivated', async () => {
    mockGetTeachers.mockResolvedValue({
      success: true,
      data: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });
    render(<DeactivatedTeachersPage />);
    expect(await screen.findByText('No deactivated teachers.')).toBeInTheDocument();
  });

  it('offers permanent delete only for teachers with no history', async () => {
    render(<DeactivatedTeachersPage />);
    await screen.findByText('Ms. Sarah');
    // Only Mr. Ahmed (0 assignments) gets the ✕ delete button.
    expect(screen.getAllByTitle('Delete permanently')).toHaveLength(1);
  });

  it('fetches and shows page 2 when Next is clicked (no infinite loading)', async () => {
    mockGetTeachers.mockImplementation((params: any) => {
      if (params?.page === 2) {
        return Promise.resolve({
          success: true,
          data: [
            {
              ...mockInactiveTeachers[0],
              id: 'tp-21', userId: 'u-21',
              user: { ...mockInactiveTeachers[0].user, id: 'u-21', name: 'Ms. Page Two' },
            },
          ],
          meta: { page: 2, limit: 20, total: 21, totalPages: 2 },
        });
      }
      return Promise.resolve({
        success: true,
        data: mockInactiveTeachers,
        meta: { page: 1, limit: 20, total: 21, totalPages: 2 },
      });
    });
    const user = userEvent.setup();
    render(<DeactivatedTeachersPage />);
    await screen.findByText('Ms. Sarah');

    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(mockGetTeachers).toHaveBeenCalledWith(expect.objectContaining({ page: 2, status: 'inactive' }));
    expect(await screen.findByText('Ms. Page Two')).toBeInTheDocument();
  });
});
