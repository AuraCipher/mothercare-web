import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../helpers/test-utils';
import userEvent from '@testing-library/user-event';

const mockGetSubjects = vi.hoisted(() => vi.fn());
const mockCreateSubject = vi.hoisted(() => vi.fn());
const mockUpdateSubject = vi.hoisted(() => vi.fn());
const mockDeleteSubject = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/admin/settings/subjects',
}));

vi.mock('@/lib/api', () => ({
  api: {
    getSubjects: mockGetSubjects,
    createSubject: mockCreateSubject,
    updateSubject: mockUpdateSubject,
    deleteSubject: mockDeleteSubject,
  },
}));

const localStorageMock = (() => {
  let store: Record<string, string> = { token: 'test-jwt', activeBranchId: 'branch-1', activeAYId: 'ay-1' };
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

import SubjectsPage from '@/app/admin/settings/subjects/page';

const mockSubjects = [
  { id: 's-1', academicYearId: 'ay-1', name: 'Mathematics', code: 'MATH', description: null, totalMarks: 100, passingMarks: 50, isElective: false, hodId: null, hod: null, _count: { groupSubjects: 2, teacherAssignments: 1 } },
  { id: 's-2', academicYearId: 'ay-1', name: 'English', code: 'ENG', description: 'Grammar & Literature', totalMarks: 100, passingMarks: 40, isElective: false, hodId: 'hod-1', hod: { id: 'hod-1', name: 'Dr. Khan' }, _count: { groupSubjects: 1, teacherAssignments: 0 } },
  { id: 's-3', academicYearId: 'ay-1', name: 'Art', code: null, description: null, totalMarks: 50, passingMarks: 25, isElective: true, hodId: null, hod: null, _count: { groupSubjects: 0, teacherAssignments: 0 } },
];

describe('SubjectsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSubjects.mockResolvedValue({ success: true, data: mockSubjects });
  });

  // 1
  it('renders the page title', async () => {
    render(<SubjectsPage />);
    expect(await screen.findByText('Subjects')).toBeInTheDocument();
  });

  // 2
  it('renders Add Subject button', async () => {
    render(<SubjectsPage />);
    expect(await screen.findByText('Add Subject')).toBeInTheDocument();
  });

  // 3
  it('lists all subjects', async () => {
    render(<SubjectsPage />);
    expect(await screen.findByText('Mathematics')).toBeInTheDocument();
    expect(await screen.findByText('English')).toBeInTheDocument();
    expect(await screen.findByText('Art')).toBeInTheDocument();
  });

  // 4
  it('shows subject codes when present', async () => {
    render(<SubjectsPage />);
    expect(await screen.findByText('MATH')).toBeInTheDocument();
    expect(await screen.findByText('ENG')).toBeInTheDocument();
  });

  // 5
  it('shows HOD name when assigned', async () => {
    render(<SubjectsPage />);
    expect(await screen.findByText('HOD: Dr. Khan')).toBeInTheDocument();
  });

  // 6
  it('shows marks info on each card', async () => {
    render(<SubjectsPage />);
    // 100 marks appears for Mathematics and English, 50 for Art
    const hundredMarks = await screen.findAllByText(/100 marks/);
    expect(hundredMarks.length).toBeGreaterThanOrEqual(1);
    const fiftyMarks = await screen.findAllByText(/50 marks/);
    expect(fiftyMarks.length).toBeGreaterThanOrEqual(1);
  });

  // 7
  it('shows elective badge for elective subjects', async () => {
    render(<SubjectsPage />);
    expect(await screen.findByText(/Elective/)).toBeInTheDocument();
  });

  // 8
  it('opens create modal when Add Subject is clicked', async () => {
    render(<SubjectsPage />);
    const user = userEvent.setup();
    await user.click(await screen.findByText('Add Subject'));
    expect(await screen.findByPlaceholderText(/e\.g\. Mathematics/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\. MATH/)).toBeInTheDocument();
  });

  // 9
  it('shows error when no AY is selected', async () => {
    localStorage.removeItem('activeAYId');
    render(<SubjectsPage />);
    expect(await screen.findByText(/Select a year from the sidebar/)).toBeInTheDocument();
    localStorage.setItem('activeAYId', 'ay-1');
  });

  // 10
  it('shows empty state when no subjects', async () => {
    mockGetSubjects.mockResolvedValue({ success: true, data: [] });
    render(<SubjectsPage />);
    expect(await screen.findByText('No subjects yet.')).toBeInTheDocument();
  });
});

describe('SubjectsPage — create modal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSubjects.mockResolvedValue({ success: true, data: mockSubjects });
    mockCreateSubject.mockResolvedValue({ success: true });
  });

  it('creates a subject with valid data', async () => {
    render(<SubjectsPage />);
    const user = userEvent.setup();
    await user.click(await screen.findByText('Add Subject'));

    await user.type(screen.getByPlaceholderText(/e\.g\. Mathematics/), 'Physics');
    await user.type(screen.getByPlaceholderText(/e\.g\. MATH/), 'PHY');
    await user.click(screen.getByText('Create Subject'));

    expect(mockCreateSubject).toHaveBeenCalledWith('branch-1', 'ay-1',
      expect.objectContaining({ name: 'Physics', code: 'PHY' }));
  });
});

describe('SubjectsPage — delete & edit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSubjects.mockResolvedValue({ success: true, data: mockSubjects });
  });

  it('shows delete confirmation for subject with no links', async () => {
    mockDeleteSubject.mockResolvedValue({ success: true });
    render(<SubjectsPage />);
    const user = userEvent.setup();

    // Art has no links — click its delete button
    const deleteBtns = await screen.findAllByTitle('Delete');
    await user.click(deleteBtns[deleteBtns.length - 1]); // last one = Art

    expect(await screen.findByText(/Delete "Art"\?/)).toBeInTheDocument();
  });

  it('shows warning for subject linked to classes', async () => {
    render(<SubjectsPage />);
    const user = userEvent.setup();

    // Mathematics has links — click disabled delete
    const deleteBtns = await screen.findAllByTitle('Linked to classes');
    await user.click(deleteBtns[0]);

    expect(await screen.findByText('Cannot Delete Subject')).toBeInTheDocument();
  });

  it('opens edit modal with pre-populated fields', async () => {
    render(<SubjectsPage />);
    const user = userEvent.setup();
    const editBtns = await screen.findAllByTitle('Edit');

    // Click edit on English (index 1)
    await user.click(editBtns[1]);

    expect(await screen.findByText('Edit Subject')).toBeInTheDocument();
    expect(screen.getByDisplayValue('English')).toBeInTheDocument();
    expect(screen.getByDisplayValue('ENG')).toBeInTheDocument();
  });

  it('shows loading skeleton initially', () => {
    mockGetSubjects.mockReturnValue(new Promise(() => {}));
    const { container } = render(<SubjectsPage />);
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThanOrEqual(3);
  });
});
