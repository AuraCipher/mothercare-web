import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../helpers/test-utils';

// ─── Hoisted mocks ──────────────────────────────────────
const mockGetSections = vi.hoisted(() => vi.fn());
const mockGetTimetableSlots = vi.hoisted(() => vi.fn());
const mockGetSectionTimetable = vi.hoisted(() => vi.fn());
const mockGetSubjects = vi.hoisted(() => vi.fn());
const mockGetUsers = vi.hoisted(() => vi.fn());
const mockUpsertTimetableEntry = vi.hoisted(() => vi.fn());
const mockShowToast = vi.hoisted(() => vi.fn());
const mockPush = vi.hoisted(() => vi.fn());
const mockSearchParamsGet = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), prefetch: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn() }),
  useParams: () => ({ sectionId: 'sec-1' }),
  useSearchParams: () => ({ get: mockSearchParamsGet }),
  usePathname: () => '/admin/timetable/sec-1',
}));

vi.mock('@/lib/api', () => ({
  api: {
    getSections: mockGetSections,
    getTimetableSlots: mockGetTimetableSlots,
    getSectionTimetable: mockGetSectionTimetable,
    getSubjects: mockGetSubjects,
    getUsers: mockGetUsers,
    upsertTimetableEntry: mockUpsertTimetableEntry,
  },
}));

vi.mock('@/components/toast', () => ({
  showToast: mockShowToast,
}));

// ─── LocalStorage mock ──────────────────────────────────
const localStorageMock = (() => {
  let store: Record<string, string> = { token: 'test-jwt', activeBranchId: 'branch-1', activeAYId: 'ay-1' };
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// ─── Shared mock data ───────────────────────────────────
const mockSection = { id: 'sec-1', name: 'Class 1', section: 'A' };
const mockSlots = [
  { id: 'slot-1', dayOfWeek: null, lectureNumber: 1, startTime: '08:00', endTime: '08:40' },
  { id: 'slot-2', dayOfWeek: null, lectureNumber: 2, startTime: '08:40', endTime: '09:20' },
  { id: 'slot-3', dayOfWeek: null, lectureNumber: 3, startTime: '09:30', endTime: '10:10' },
];
const datesheetSlots = [
  { id: 'ds-slot-1', dayOfWeek: 1, lectureNumber: 1, startTime: '09:00', endTime: '12:00' },
  { id: 'ds-slot-2', dayOfWeek: 3, lectureNumber: 2, startTime: '09:00', endTime: '12:00' },
];
const mockSubjects = [
  { id: 'subj-1', name: 'Math', code: 'MATH' },
  { id: 'subj-2', name: 'Science', code: 'SCI' },
];
const mockTeachers = [
  { id: 't-1', name: 'Ms. Sarah' },
  { id: 't-2', name: 'Mr. Khan' },
];
const mockEntries = [
  { id: 'e-1', slotId: 'slot-1', note: null, subject: mockSubjects[0], teacher: mockTeachers[0] },
];

import SectionTimetablePage from '@/app/admin/timetable/[sectionId]/page';

describe('SectionTimetablePage — Loading & Empty', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParamsGet.mockImplementation((key: string) => {
      if (key === 'id') return 'tt-1';
      if (key === 'src') return 'timetable';
      return '';
    });
    mockGetSections.mockResolvedValue({ success: true, data: [mockSection] });
    mockGetTimetableSlots.mockResolvedValue({ success: true, data: mockSlots });
    mockGetSectionTimetable.mockResolvedValue({ success: true, data: mockEntries });
    mockGetSubjects.mockResolvedValue({ success: true, data: mockSubjects });
    mockGetUsers.mockResolvedValue({ success: true, data: mockTeachers });
  });

  it('renders loading skeleton initially', () => {
    mockGetSections.mockImplementation(() => new Promise(() => {}));
    const { container } = render(<SectionTimetablePage />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThanOrEqual(1);
  });

  it('renders empty state when no slots', async () => {
    mockGetTimetableSlots.mockResolvedValue({ success: true, data: [] });
    render(<SectionTimetablePage />);
    expect(await screen.findByText('No lectures defined for this timetable.')).toBeInTheDocument();
  });
});

describe('SectionTimetablePage — Timetable mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParamsGet.mockImplementation((key: string) => {
      if (key === 'id') return 'tt-1';
      if (key === 'src') return 'timetable';
      return '';
    });
    mockGetSections.mockResolvedValue({ success: true, data: [mockSection] });
    mockGetTimetableSlots.mockResolvedValue({ success: true, data: mockSlots });
    mockGetSectionTimetable.mockResolvedValue({ success: true, data: mockEntries });
    mockGetSubjects.mockResolvedValue({ success: true, data: mockSubjects });
    mockGetUsers.mockResolvedValue({ success: true, data: mockTeachers });
  });

  it('renders section name and timetable label', async () => {
    render(<SectionTimetablePage />);
    expect(await screen.findByText('Class 1 — A')).toBeInTheDocument();
    expect(await screen.findByText('Timetable')).toBeInTheDocument();
  });

  it('renders lecture numbers and times', async () => {
    render(<SectionTimetablePage />);
    expect(await screen.findByText('1')).toBeInTheDocument();
    expect(await screen.findByText('08:00 — 08:40')).toBeInTheDocument();
    expect(await screen.findByText('2')).toBeInTheDocument();
    expect(await screen.findByText('08:40 — 09:20')).toBeInTheDocument();
    expect(await screen.findByText('3')).toBeInTheDocument();
  });

  it('shows subject dropdown for timetable mode', async () => {
    render(<SectionTimetablePage />);
    const selects = await screen.findAllByRole('combobox');
    expect(selects.length).toBeGreaterThanOrEqual(3);
  });

  it('shows subject options with code', async () => {
    render(<SectionTimetablePage />);
    const mathOpts = await screen.findAllByText('Math (MATH)');
    expect(mathOpts.length).toBe(3); // once per row
    const sciOpts = await screen.findAllByText('Science (SCI)');
    expect(sciOpts.length).toBe(3);
  });

  it('shows Break option in subject dropdown', async () => {
    render(<SectionTimetablePage />);
    const breakOpts = await screen.findAllByText('🕐 Break');
    expect(breakOpts.length).toBe(3); // once per row
  });

  it('shows teacher options rendered in selects', async () => {
    render(<SectionTimetablePage />);
    // Teacher name appears in each row's teacher select
    const teacherOpts = await screen.findAllByText('Mr. Khan');
    expect(teacherOpts.length).toBe(3); // once per row
  });

  it('shows Teacher column header', async () => {
    render(<SectionTimetablePage />);
    expect(await screen.findByText('Teacher')).toBeInTheDocument();
  });

  it('preselects subject and teacher from existing entry', async () => {
    render(<SectionTimetablePage />);
    const selects = await screen.findAllByRole('combobox');
    await waitFor(() => {
      expect((selects[0] as HTMLSelectElement).value).toBe('subj-1');
    });
  });

  it('calls upsert when subject is changed', async () => {
    mockUpsertTimetableEntry.mockResolvedValue({ success: true, data: {} });
    mockGetSectionTimetable.mockResolvedValue({ success: true, data: mockEntries });

    render(<SectionTimetablePage />);
    const selects = await screen.findAllByRole('combobox');
    const subjectSelect = selects[0];

    fireEvent.change(subjectSelect, { target: { value: 'subj-2' } });

    await waitFor(() => {
      expect(mockUpsertTimetableEntry).toHaveBeenCalledWith(
        'branch-1', 'sec-1', 'slot-1',
        { subjectId: 'subj-2', teacherId: 't-1', note: null }
      );
    });
  });

  it('calls upsert with break payload when Break selected', async () => {
    mockUpsertTimetableEntry.mockResolvedValue({ success: true, data: {} });
    mockGetSectionTimetable.mockResolvedValue({ success: true, data: mockEntries });

    render(<SectionTimetablePage />);
    const selects = await screen.findAllByRole('combobox');
    const subjectSelect = selects[0];

    fireEvent.change(subjectSelect, { target: { value: '__break__' } });

    await waitFor(() => {
      expect(mockUpsertTimetableEntry).toHaveBeenCalledWith(
        'branch-1', 'sec-1', 'slot-1',
        { subjectId: null, teacherId: null, note: 'break' }
      );
    });
  });

  it('calls upsert when teacher is changed on a row with entry', async () => {
    mockUpsertTimetableEntry.mockResolvedValue({ success: true, data: {} });
    mockGetSectionTimetable.mockResolvedValue({ success: true, data: mockEntries });

    render(<SectionTimetablePage />);
    const selects = await screen.findAllByRole('combobox');
    // slot-1 has an entry. Row structure: [subj-select-1, teacher-select-1, subj-select-2, teacher-select-2, subj-select-3, teacher-select-3]
    // Teacher for slot-1 is indexes [1] (the 2nd combobox)
    const teacherSelect = selects[1];

    fireEvent.change(teacherSelect, { target: { value: 't-2' } });

    await waitFor(() => {
      expect(mockUpsertTimetableEntry).toHaveBeenCalledWith(
        'branch-1', 'sec-1', 'slot-1',
        { subjectId: 'subj-1', teacherId: 't-2' }
      );
    });
  });

  it('back button links to grid page', async () => {
    render(<SectionTimetablePage />);
    const backBtn = await screen.findByText('Back');
    fireEvent.click(backBtn);
    expect(mockPush).toHaveBeenCalledWith('/admin/timetable/grid?id=tt-1');
  });
});

describe('SectionTimetablePage — Datesheet mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParamsGet.mockImplementation((key: string) => {
      if (key === 'id') return 'ds-1';
      if (key === 'src') return 'datesheet';
      return '';
    });
    mockGetSections.mockResolvedValue({ success: true, data: [mockSection] });
    mockGetTimetableSlots.mockResolvedValue({ success: true, data: datesheetSlots });
    mockGetSectionTimetable.mockResolvedValue({ success: true, data: [] });
  });

  it('renders Date Sheet label', async () => {
    render(<SectionTimetablePage />);
    expect(await screen.findByText('Date Sheet')).toBeInTheDocument();
  });

  it('shows text input instead of dropdown for subject', async () => {
    render(<SectionTimetablePage />);
    const inputs = await screen.findAllByPlaceholderText('Subject');
    expect(inputs.length).toBeGreaterThanOrEqual(1);
  });

  it('does NOT show Teacher column for datesheet', async () => {
    render(<SectionTimetablePage />);
    await screen.findByText('Subject');
    await waitFor(() => {
      expect(screen.queryByText('Teacher')).not.toBeInTheDocument();
    });
  });

  it('does NOT fetch subjects or teachers in datesheet mode', async () => {
    render(<SectionTimetablePage />);
    await screen.findByText('Date Sheet');
    expect(mockGetSubjects).not.toHaveBeenCalled();
    expect(mockGetUsers).not.toHaveBeenCalled();
  });

  it('back button links to datesheet page', async () => {
    render(<SectionTimetablePage />);
    const backBtn = await screen.findByText('Back');
    fireEvent.click(backBtn);
    expect(mockPush).toHaveBeenCalledWith('/admin/timetable/datesheet/ds-1');
  });
});
