import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../helpers/test-utils';
import userEvent from '@testing-library/user-event';

const mockGetTeachers = vi.hoisted(() => vi.fn());
const mockGetUsers = vi.hoisted(() => vi.fn());
const mockCreateTeacher = vi.hoisted(() => vi.fn());
const mockUpdateTeacher = vi.hoisted(() => vi.fn());
const mockDeleteTeacher = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/admin/teachers',
}));

vi.mock('@/lib/api', () => ({
  api: {
    getTeachers: mockGetTeachers,
    getUsers: mockGetUsers,
    createTeacher: mockCreateTeacher,
    updateTeacher: mockUpdateTeacher,
    deleteTeacher: mockDeleteTeacher,
  },
}));

const localStorageMock = (() => {
  let store: Record<string, string> = { token: 'test-jwt' };
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

import TeachersPage from '@/app/admin/teachers/page';

const mockTeachers = [
  {
    id: 'tp-1', userId: 'u-1', employeeId: 'TCH-001', qualification: 'M.Sc. Mathematics',
    specialization: 'Mathematics', joiningDate: '2024-01-15', salary: null,
    phone: '1234567890', emergencyContact: null, address: '123 School St',
    dateOfBirth: null, gender: 'female', bloodGroup: null,
    createdAt: '2024-01-15', updatedAt: '2024-01-15',
    user: { id: 'u-1', name: 'Ms. Sarah', email: 'sarah@school.com', phone: null, role: 'teacher', status: 'active' },
    _count: { assignments: 2 },
  },
  {
    id: 'tp-2', userId: 'u-2', employeeId: null, qualification: 'B.Ed',
    specialization: 'English', joiningDate: '2024-02-01', salary: null,
    phone: '9876543210', emergencyContact: null, address: null,
    dateOfBirth: null, gender: 'male', bloodGroup: null,
    createdAt: '2024-02-01', updatedAt: '2024-02-01',
    user: { id: 'u-2', name: 'Mr. Ahmed', email: 'ahmed@school.com', phone: null, role: 'teacher', status: 'active' },
    _count: { assignments: 0 },
  },
];

describe('TeachersPage — rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTeachers.mockResolvedValue({
      success: true,
      data: mockTeachers,
      meta: { page: 1, limit: 20, total: 2, totalPages: 1 },
    });
  });

  it('renders the page title', async () => {
    render(<TeachersPage />);
    expect(await screen.findByText('Teachers')).toBeInTheDocument();
  });

  it('renders Add Teacher button', async () => {
    render(<TeachersPage />);
    expect(await screen.findByText('Add Teacher')).toBeInTheDocument();
  });

  it('lists all teachers', async () => {
    render(<TeachersPage />);
    expect(await screen.findByText('Ms. Sarah')).toBeInTheDocument();
    expect(await screen.findByText('Mr. Ahmed')).toBeInTheDocument();
  });

  it('shows teacher qualifications', async () => {
    render(<TeachersPage />);
    expect(await screen.findByText('M.Sc. Mathematics')).toBeInTheDocument();
    const bEdElements = await screen.findAllByText('B.Ed');
    // B.Ed appears on the teacher card AND in the filter dropdown
    expect(bEdElements.length).toBeGreaterThanOrEqual(1);
  });

  it('shows employee ID badge', async () => {
    render(<TeachersPage />);
    expect(await screen.findByText('(TCH-001)')).toBeInTheDocument();
  });

  it('shows assignment count on cards', async () => {
    render(<TeachersPage />);
    expect(await screen.findByText(/2 assignments/)).toBeInTheDocument();
    expect(await screen.findByText(/0 assignments/)).toBeInTheDocument();
  });

  it('shows loading skeleton initially', () => {
    mockGetTeachers.mockReturnValue(new Promise(() => {}));
    const { container } = render(<TeachersPage />);
    expect(container.querySelectorAll('.animate-pulse').length).toBe(4);
  });
});

describe('TeachersPage — search and filter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTeachers.mockResolvedValue({
      success: true,
      data: [mockTeachers[0]],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });
  });

  it('renders search input', async () => {
    render(<TeachersPage />);
    expect(await screen.findByPlaceholderText(/Search by name or employee ID/)).toBeInTheDocument();
  });

  it('renders qualification filter dropdown', async () => {
    render(<TeachersPage />);
    expect(await screen.findByText('All Qualifications')).toBeInTheDocument();
  });
});

describe('TeachersPage — create modal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTeachers.mockResolvedValue({
      success: true, data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });
    mockGetUsers.mockResolvedValue({
      success: true,
      data: [{ id: 'u-3', name: 'New Teacher', email: 'new@school.com' }],
    });
  });

  it('opens create modal when Add Teacher is clicked', async () => {
    render(<TeachersPage />);
    const user = userEvent.setup();
    const addBtn = await screen.findByText('Add Teacher');
    await user.click(addBtn);

    expect(await screen.findByText('Add Teacher Profile')).toBeInTheDocument();
    expect(await screen.findByText(/Full Name/)).toBeInTheDocument();
    expect(await screen.findByText(/Username/)).toBeInTheDocument();
  });

  it('shows all form fields in create modal', async () => {
    render(<TeachersPage />);
    const user = userEvent.setup();
    await user.click(await screen.findByText('Add Teacher'));

    expect(await screen.findByText('Employee ID')).toBeInTheDocument();
    expect(screen.getByText('Qualification')).toBeInTheDocument();
    expect(screen.getByText('Specialization')).toBeInTheDocument();
    expect(screen.getByText('Joining Date')).toBeInTheDocument();
    expect(screen.getByText('Date of Birth')).toBeInTheDocument();
    expect(screen.getByText('Phone')).toBeInTheDocument();
    expect(screen.getByText('Emergency Contact')).toBeInTheDocument();
    expect(screen.getByText('Address')).toBeInTheDocument();
    expect(screen.getByText('Salary')).toBeInTheDocument();
    expect(screen.getByText('Blood Group')).toBeInTheDocument();
  });
});

describe('TeachersPage — delete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTeachers.mockResolvedValue({
      success: true,
      data: mockTeachers,
      meta: { page: 1, limit: 20, total: 2, totalPages: 1 },
    });
  });

  it('shows warning when deleting teacher with assignments', async () => {
    render(<TeachersPage />);
    const user = userEvent.setup();

    const deleteBtns = await screen.findAllByTitle('Delete teacher');
    await user.click(deleteBtns[0]); // Ms. Sarah has 2 assignments

    expect(await screen.findByText('Cannot Delete Teacher')).toBeInTheDocument();
    expect(screen.getByText(/2 active assignment/)).toBeInTheDocument();
  });

  it('shows delete confirmation when teacher has no assignments', async () => {
    render(<TeachersPage />);
    const user = userEvent.setup();

    const deleteBtns = await screen.findAllByTitle('Delete teacher');
    await user.click(deleteBtns[1]); // Mr. Ahmed has 0 assignments

    expect(await screen.findByText(/Delete "Mr. Ahmed"\?/)).toBeInTheDocument();
  });
});

describe('TeachersPage — empty state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTeachers.mockResolvedValue({
      success: true, data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });
  });

  it('shows empty state when no teachers', async () => {
    render(<TeachersPage />);
    expect(await screen.findByText('No teachers found.')).toBeInTheDocument();
    expect(await screen.findByText('Add your first teacher')).toBeInTheDocument();
  });
});
