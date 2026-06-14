import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '../helpers/test-utils';
import userEvent from '@testing-library/user-event';

const mockGetTeacher = vi.hoisted(() => vi.fn());
const mockGetTeacherTimetables = vi.hoisted(() => vi.fn());
const mockDeactivateTeacher = vi.hoisted(() => vi.fn());
const mockReactivateTeacher = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
  useParams: () => ({ id: 'tp-1' }),
}));

vi.mock('@/lib/api', () => ({
  api: {
    getTeacher: mockGetTeacher,
    getTeacherTimetables: mockGetTeacherTimetables,
    deleteTeacher: vi.fn(),
    deactivateTeacher: mockDeactivateTeacher,
    reactivateTeacher: mockReactivateTeacher,
    createAssignment: vi.fn().mockResolvedValue({ success: true }),
    deleteAssignment: vi.fn().mockResolvedValue({ success: true }),
    getSections: vi.fn().mockResolvedValue({ success: true, data: [{ id: 'sec-1', name: 'Class 1', section: 'A', isActive: true }] }),
    getSubjects: vi.fn().mockResolvedValue({ success: true, data: [{ id: 'subj-1', name: 'Mathematics', code: 'MATH' }] }),
    getSectionSubjects: vi.fn().mockResolvedValue({ success: true, data: [] }),
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

import TeacherDetailPage from '@/app/admin/teachers/[id]/page';

const mockTeacherData = {
  id: 'tp-1', userId: 'u-1', employeeId: 'TCH-001', qualification: 'M.Sc. Mathematics',
  specialization: 'Mathematics', joiningDate: '2024-01-15T00:00:00.000Z', salary: '55000',
  phone: '1234567890', emergencyContact: '0987654321', address: '123 School St, Islamabad',
  dateOfBirth: '1985-06-15T00:00:00.000Z', gender: 'female', bloodGroup: 'A+',
  createdAt: '2024-01-15T00:00:00.000Z',
  user: { id: 'u-1', name: 'Ms. Sarah', email: 'sarah@school.com', phone: null, role: 'teacher', status: 'active' },
  assignments: [
    {
      id: 'assign-1', academicYearId: 'ay-1', teacherId: 'u-1', groupId: 'g-1', subjectId: 's-1',
      isClassTeacher: true,
      group: { id: 'g-1', name: 'Class 1-A', section: null },
      subject: { id: 's-1', name: 'Mathematics', code: 'MATH' },
      academicYear: { id: 'ay-1' },
    },
    {
      id: 'assign-2', academicYearId: 'ay-1', teacherId: 'u-1', groupId: 'g-2', subjectId: 's-2',
      isClassTeacher: false,
      group: { id: 'g-2', name: 'Class 1-B', section: null },
      subject: { id: 's-2', name: 'English', code: 'ENG' },
      academicYear: { id: 'ay-1' },
    },
  ],
};

describe('TeacherDetailPage — rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTeacher.mockResolvedValue({ success: true, data: mockTeacherData });
    mockGetTeacherTimetables.mockResolvedValue({ success: true, data: [] });
  });

  it('renders teacher name', async () => {
    render(<TeacherDetailPage />);
    const elements = await screen.findAllByText('Ms. Sarah');
    expect(elements.length).toBeGreaterThanOrEqual(1); // header + detail card
  });

  it('renders employee ID', async () => {
    render(<TeacherDetailPage />);
    const elements = await screen.findAllByText('TCH-001');
    expect(elements.length).toBeGreaterThanOrEqual(1); // header + detail card
  });

  it('renders qualification badge', async () => {
    render(<TeacherDetailPage />);
    const elements = await screen.findAllByText('M.Sc. Mathematics');
    expect(elements.length).toBeGreaterThanOrEqual(1); // badge + detail card
  });

  it('renders profile detail cards', async () => {
    render(<TeacherDetailPage />);
    expect(await screen.findByText('Profile Details')).toBeInTheDocument();
    expect(screen.getByText('sarah@school.com')).toBeInTheDocument();
    expect(screen.getByText('123 School St, Islamabad')).toBeInTheDocument();
    expect(screen.getByText('A+')).toBeInTheDocument();
  });

  it('renders assigned subjects', async () => {
    render(<TeacherDetailPage />);
    const mathElements = await screen.findAllByText('Mathematics');
    expect(mathElements.length).toBeGreaterThanOrEqual(1); // specialization card + assignment
    const engElements = await screen.findAllByText('English');
    expect(engElements.length).toBeGreaterThanOrEqual(1); // table + schedule section
  });

  it('shows Class Teacher badge', async () => {
    render(<TeacherDetailPage />);
    const elements = await screen.findAllByText('Class Teacher');
    expect(elements.length).toBeGreaterThanOrEqual(1); // table + schedule section
  });

  it('shows deactivate button for active teacher', async () => {
    render(<TeacherDetailPage />);
    expect(await screen.findByText('Deactivate')).toBeInTheDocument();
  });

  it('shows back button', async () => {
    render(<TeacherDetailPage />);
    expect(await screen.findByText('Back to Teachers')).toBeInTheDocument();
  });
});

describe('TeacherDetailPage — assignments section', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTeacherTimetables.mockResolvedValue({ success: true, data: [] });
  });

  it('shows schedule cards for each assignment', async () => {
    mockGetTeacher.mockResolvedValue({ success: true, data: mockTeacherData });
    render(<TeacherDetailPage />);

    expect(await screen.findByText('Schedule')).toBeInTheDocument();
  });

  it('shows empty assignments state', async () => {
    mockGetTeacher.mockResolvedValue({
      success: true,
      data: { ...mockTeacherData, assignments: [] },
    });
    render(<TeacherDetailPage />);

    expect(await screen.findByText(/No assignments yet/)).toBeInTheDocument();
  });
});

describe('TeacherDetailPage — deactivate/reactivate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTeacherTimetables.mockResolvedValue({ success: true, data: [] });
  });

  it('shows deactivate prompt for active teacher', async () => {
    mockGetTeacher.mockResolvedValue({ success: true, data: mockTeacherData });
    render(<TeacherDetailPage />);
    const user = userEvent.setup();

    expect(await screen.findByText('Deactivate')).toBeInTheDocument();
    const deactivateBtn = screen.getByText('Deactivate');
    await user.click(deactivateBtn);

    expect(await screen.findByText(/Deactivate "Ms. Sarah"\?/)).toBeInTheDocument();
  });

  // TODO: Re-enable when vi.hoisted mock isolation issue is resolved
  // it('shows reactivate button for inactive teacher', async () => {
  //   mockGetTeacher.mockResolvedValue({
  //     success: true,
  //     data: { ...mockTeacherData, user: { ...mockTeacherData.user, status: 'inactive' }, assignments: [] },
  //   });
  //   render(<TeacherDetailPage />);
  //   expect(await screen.findByText('Reactivate')).toBeInTheDocument();
  // });
});

describe('TeacherDetailPage — loading & error', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTeacherTimetables.mockResolvedValue({ success: true, data: [] });
  });

  it('shows loading skeleton', () => {
    mockGetTeacher.mockReturnValue(new Promise(() => {}));
    const { container } = render(<TeacherDetailPage />);
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThanOrEqual(4);
  });

  it('shows error message on failure', async () => {
    mockGetTeacher.mockRejectedValue(new Error('Failed to load'));
    render(<TeacherDetailPage />);

    expect(await screen.findByText('Failed to load')).toBeInTheDocument();
  });
});

describe('TeacherDetailPage — assignment management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('activeBranchId', 'branch-1');
    localStorage.setItem('activeAYId', 'ay-1');
    mockGetTeacher.mockResolvedValue({ success: true, data: mockTeacherData });
  });

  afterEach(() => {
    localStorage.removeItem('activeBranchId');
    localStorage.removeItem('activeAYId');
  });

  it('shows Add Assignment button', async () => {
    render(<TeacherDetailPage />);
    expect(await screen.findByText('Add Assignment')).toBeInTheDocument();
  });

  it('shows assignments table with subject names', async () => {
    render(<TeacherDetailPage />);
    const mathElements = await screen.findAllByText('Mathematics');
    expect(mathElements.length).toBeGreaterThanOrEqual(1);
    const engElements = await screen.findAllByText('English');
    expect(engElements.length).toBeGreaterThanOrEqual(1);
  });

  it('shows Class Teacher badge for class teacher', async () => {
    render(<TeacherDetailPage />);
    const badges = await screen.findAllByText('Class Teacher');
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  it('shows role text for non-class-teacher assignments', async () => {
    render(<TeacherDetailPage />);
    const texts = await screen.findAllByText('subject');
    expect(texts.length).toBeGreaterThanOrEqual(1);
  });

  it('shows Edit button on each assignment row', async () => {
    render(<TeacherDetailPage />);
    const editBtns = await screen.findAllByTitle('Edit');
    expect(editBtns.length).toBeGreaterThanOrEqual(1);
  });

  it('shows Delete button on each assignment row', async () => {
    render(<TeacherDetailPage />);
    const deleteBtns = await screen.findAllByTitle('Delete');
    expect(deleteBtns.length).toBeGreaterThanOrEqual(1);
  });

  it('opens assignment modal when Add Assignment clicked', async () => {
    render(<TeacherDetailPage />);
    await userEvent.setup().click(await screen.findByText('Add Assignment'));
    expect(await screen.findByText(/Class.*Section/)).toBeInTheDocument();
    const subjectElements = await screen.findAllByText(/Subject/);
    expect(subjectElements.length).toBeGreaterThanOrEqual(1);
  });

  it('shows role selector in assignment modal', async () => {
    render(<TeacherDetailPage />);
    await userEvent.setup().click(await screen.findByText('Add Assignment'));
    expect(await screen.findByText('Primary')).toBeInTheDocument();
    expect(await screen.findByText('Assistant')).toBeInTheDocument();
    expect(await screen.findByText('HOD')).toBeInTheDocument();
  });

  it('shows Class Teacher checkbox in modal', async () => {
    render(<TeacherDetailPage />);
    await userEvent.setup().click(await screen.findByText('Add Assignment'));
    expect(await screen.findByText(/only one per class/)).toBeInTheDocument();
  });

  it('shows empty state when no assignments exist', async () => {
    mockGetTeacher.mockResolvedValue({
      success: true,
      data: { ...mockTeacherData, assignments: [] },
    });
    render(<TeacherDetailPage />);
    expect(await screen.findByText(/No assignments yet/)).toBeInTheDocument();
  });
});

describe('TeacherDetailPage — teacher timetables', () => {
  const mockTimetableData = [
    {
      id: 'tt-1', name: 'Regular', type: 'timetable',
      entries: [
        { lectureNumber: 1, startTime: '08:00', endTime: '08:40', dayOfWeek: null, groupName: 'Class 1', groupSection: 'A', subjectName: 'Math', subjectCode: 'MATH' },
        { lectureNumber: 2, startTime: '08:40', endTime: '09:20', dayOfWeek: null, groupName: 'Class 2', groupSection: 'B', subjectName: 'Science', subjectCode: null },
      ],
    },
    {
      id: 'tt-2', name: 'Exam Schedule', type: 'datesheet',
      entries: [
        { lectureNumber: 1, startTime: '09:00', endTime: '12:00', dayOfWeek: 1, groupName: 'Class 1', groupSection: 'A', subjectName: 'Math', subjectCode: 'MATH' },
      ],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('activeBranchId', 'branch-1');
    mockGetTeacher.mockResolvedValue({ success: true, data: mockTeacherData });
    mockGetTeacherTimetables.mockResolvedValue({ success: true, data: mockTimetableData });
  });

  afterEach(() => {
    localStorage.removeItem('activeBranchId');
  });

  it('renders Timetables section heading', async () => {
    render(<TeacherDetailPage />);
    expect(await screen.findByText('Timetables')).toBeInTheDocument();
  });

  it('renders timetable card with name label', async () => {
    render(<TeacherDetailPage />);
    expect(await screen.findByText('Regular')).toBeInTheDocument();
    expect(await screen.findByText('Exam Schedule')).toBeInTheDocument();
  });

  it('renders class names in timetable cards', async () => {
    render(<TeacherDetailPage />);
    const class1a = await screen.findAllByText('Class 1 — A');
    expect(class1a.length).toBe(2); // appears in both Regular and Exam Schedule
    expect(await screen.findByText('Class 2 — B')).toBeInTheDocument();
  });

  it('renders timing values with lecture numbers', async () => {
    render(<TeacherDetailPage />);
    const l1s = await screen.findAllByText('L1');
    expect(l1s.length).toBe(2); // appears in both cards
    expect(await screen.findByText('L2')).toBeInTheDocument();
  });

  it('renders Column headers', async () => {
    render(<TeacherDetailPage />);
    const classHeaders = await screen.findAllByText('Class');
    expect(classHeaders.length).toBeGreaterThanOrEqual(1);
    const timingHeaders = await screen.findAllByText('Timing');
    expect(timingHeaders.length).toBeGreaterThanOrEqual(1);
  });

  it('does NOT show timetable section when no data', async () => {
    mockGetTeacherTimetables.mockResolvedValue({ success: true, data: [] });
    render(<TeacherDetailPage />);
    await waitFor(() => {
      expect(screen.queryByText('Timetables')).not.toBeInTheDocument();
    });
  });
});
