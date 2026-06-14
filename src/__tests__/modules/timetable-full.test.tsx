import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../helpers/test-utils';

// ─── Hoisted mocks ──────────────────────────────────────
const mockGetSections = vi.hoisted(() => vi.fn());
const mockGetTimetableSlots = vi.hoisted(() => vi.fn());
const mockGetSectionTimetable = vi.hoisted(() => vi.fn());
const mockShowToast = vi.hoisted(() => vi.fn());
const mockPush = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), prefetch: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn() }),
  useParams: () => ({ id: 'tt-1' }),
  usePathname: () => '/admin/timetable/full/tt-1',
}));

vi.mock('@/lib/api', () => ({
  api: {
    getSections: mockGetSections,
    getTimetableSlots: mockGetTimetableSlots,
    getSectionTimetable: mockGetSectionTimetable,
  },
}));

vi.mock('@/components/toast', () => ({
  showToast: mockShowToast,
}));

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
const mockSections = [
  { id: 'sec-1', name: 'Class 1', section: 'A', displayOrder: 1 },
  { id: 'sec-2', name: 'Class 2', section: 'B', displayOrder: 2 },
  { id: 'sec-3', name: 'Class 3', section: null, displayOrder: 3 },
];

// Timetable slots (dayOfWeek === null = all days)
const timetablSlots = [
  { id: 'slot-1', lectureNumber: 1, startTime: '08:00', endTime: '08:40', dayOfWeek: null },
  { id: 'slot-2', lectureNumber: 2, startTime: '08:40', endTime: '09:20', dayOfWeek: null },
];

// Datesheet slots (dayOfWeek set)
const datesheetSlots = [
  { id: 'ds-slot-1', lectureNumber: 1, startTime: '09:00', endTime: '12:00', dayOfWeek: 1 },
  { id: 'ds-slot-2', lectureNumber: 2, startTime: '09:00', endTime: '12:00', dayOfWeek: 3 },
  { id: 'ds-slot-3', lectureNumber: 3, startTime: '14:00', endTime: '17:00', dayOfWeek: 5 },
];

const timetablEntriesSec1 = [
  { id: 'e-1', slotId: 'slot-1', note: null, subject: { id: 'subj-1', name: 'Math', code: 'MATH' }, teacher: { id: 't-1', name: 'Ms. Sarah' } },
  { id: 'e-2', slotId: 'slot-2', note: 'break', subject: null, teacher: null },
];

const timetablEntriesSec2 = [
  { id: 'e-3', slotId: 'slot-1', note: null, subject: { id: 'subj-2', name: 'English', code: 'ENG' }, teacher: { id: 't-2', name: 'Mr. Ali' } },
];

// Datesheet entries (no teacher, subject via note)
const datesheetEntriesSec1 = [
  { id: 'de-1', slotId: 'ds-slot-1', note: 'Midterm Math', subject: null, teacher: null },
  { id: 'de-2', slotId: 'ds-slot-2', note: 'Physics Exam', subject: null, teacher: null },
];

const datesheetEntriesSec2 = [
  { id: 'de-3', slotId: 'ds-slot-1', note: 'English Literature', subject: null, teacher: null },
];

import FullTimetablePage from '@/app/admin/timetable/full/[id]/page';

// ═══════════════════════════════════════════════════════════════
// TIMETABLE MODE TESTS
// ═══════════════════════════════════════════════════════════════

describe('Timetable — Loading & Empty', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSections.mockResolvedValue({ success: true, data: mockSections });
    mockGetTimetableSlots.mockResolvedValue({ success: true, data: timetablSlots });
  });

  it('renders loading skeleton', () => {
    mockGetSections.mockImplementation(() => new Promise(() => {}));
    const { container } = render(<FullTimetablePage />);
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThanOrEqual(3);
  });

  it('renders class toggle buttons', async () => {
    render(<FullTimetablePage />);
    expect(await screen.findByText('Class 1 — A')).toBeInTheDocument();
    expect(await screen.findByText('Class 2 — B')).toBeInTheDocument();
    expect(await screen.findByText('Class 3')).toBeInTheDocument();
  });

  it('renders Generate button', async () => {
    render(<FullTimetablePage />);
    expect(await screen.findByRole('button', { name: 'Generate' })).toBeInTheDocument();
  });

  it('shows empty state before generation', async () => {
    render(<FullTimetablePage />);
    expect(await screen.findByText(/Select classes above/)).toBeInTheDocument();
  });

  it('all classes selected by default', async () => {
    render(<FullTimetablePage />);
    const classBtns = await screen.findAllByRole('button', { name: /Class/ });
    expect(classBtns.length).toBe(3);
  });

  it('shows editable timetable name', async () => {
    render(<FullTimetablePage />);
    expect(await screen.findByDisplayValue('Full Timetable')).toBeInTheDocument();
  });

  it('back button navigates to timetable list', async () => {
    render(<FullTimetablePage />);
    fireEvent.click(await screen.findByText('Back'));
    expect(mockPush).toHaveBeenCalledWith('/admin/timetable');
  });
});

describe('Timetable — Class Toggles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSections.mockResolvedValue({ success: true, data: mockSections });
    mockGetTimetableSlots.mockResolvedValue({ success: true, data: timetablSlots });
  });

  it('deselecting a class shows line-through style', async () => {
    render(<FullTimetablePage />);
    const class1Btn = await screen.findByText('Class 1 — A');
    fireEvent.click(class1Btn);
    expect(class1Btn.className).toContain('line-through');
  });

  it('can select/deselect multiple classes', async () => {
    render(<FullTimetablePage />);
    const btn1 = await screen.findByText('Class 1 — A');
    const btn2 = await screen.findByText('Class 2 — B');
    fireEvent.click(btn1);
    fireEvent.click(btn2);
    expect(btn1.className).toContain('line-through');
    expect(btn2.className).toContain('line-through');
  });

  it('toggling a class back re-selects it', async () => {
    render(<FullTimetablePage />);
    const btn = await screen.findByText('Class 1 — A');
    fireEvent.click(btn);
    expect(btn.className).toContain('line-through');
    fireEvent.click(btn);
    expect(btn.className).not.toContain('line-through');
  });
});

describe('Timetable — Generate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSections.mockResolvedValue({ success: true, data: mockSections });
    mockGetTimetableSlots.mockResolvedValue({ success: true, data: timetablSlots });
    mockGetSectionTimetable.mockImplementation((_bId: string, secId: string) => {
      if (secId === 'sec-1') return Promise.resolve({ success: true, data: timetablEntriesSec1 });
      if (secId === 'sec-2') return Promise.resolve({ success: true, data: timetablEntriesSec2 });
      return Promise.resolve({ success: true, data: [] });
    });
  });

  const clickGenerate = async () => {
    fireEvent.click(await screen.findByRole('button', { name: 'Generate' }));
  };

  it('renders time range column headers', async () => {
    render(<FullTimetablePage />);
    await clickGenerate();
    const times = await screen.findAllByText('08:00 — 08:40');
    expect(times.length).toBeGreaterThanOrEqual(1);
  });

  it('shows subject names in cells', async () => {
    render(<FullTimetablePage />);
    await clickGenerate();
    expect(await screen.findByText('Math')).toBeInTheDocument();
    expect(await screen.findByText('English')).toBeInTheDocument();
  });

  it('shows teacher names in cells', async () => {
    render(<FullTimetablePage />);
    await clickGenerate();
    expect(await screen.findByText('Ms. Sarah')).toBeInTheDocument();
    expect(await screen.findByText('Mr. Ali')).toBeInTheDocument();
  });

  it('shows Break cells', async () => {
    render(<FullTimetablePage />);
    await clickGenerate();
    const breaks = await screen.findAllByText('Break');
    expect(breaks.length).toBeGreaterThanOrEqual(1);
  });

  it('shows generated name in card input', async () => {
    render(<FullTimetablePage />);
    await clickGenerate();
    const inputs = await screen.findAllByDisplayValue('Full Timetable');
    expect(inputs.length).toBeGreaterThanOrEqual(1);
  });

  it('stacks multiple generations', async () => {
    render(<FullTimetablePage />);
    await clickGenerate();
    await screen.findByText('Math');
    await clickGenerate();
    await waitFor(() => {
      expect(screen.getAllByText('Math').length).toBeGreaterThanOrEqual(2);
    });
  });

  it('deselecting all classes disables generate button', async () => {
    render(<FullTimetablePage />);
    fireEvent.click(await screen.findByText('Class 1 — A'));
    fireEvent.click(await screen.findByText('Class 2 — B'));
    fireEvent.click(await screen.findByText('Class 3'));
    expect((await screen.findByRole('button', { name: 'Generate' })) as HTMLButtonElement).toBeDisabled();
  });

  it('shows class names in first column', async () => {
    render(<FullTimetablePage />);
    await clickGenerate();
    // Class names appear in both toggle buttons and table cells
    const class3s = await screen.findAllByText('Class 3');
    expect(class3s.length).toBeGreaterThanOrEqual(1);
  });

  it('shows toast success after generation', async () => {
    render(<FullTimetablePage />);
    await clickGenerate();
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('success', expect.stringContaining('generated'));
    });
  });

  it('Class column header shows for timetable', async () => {
    render(<FullTimetablePage />);
    await clickGenerate();
    expect(await screen.findByText('Class')).toBeInTheDocument();
  });

  it('delete button removes generated timetable', async () => {
    render(<FullTimetablePage />);
    await clickGenerate();
    await screen.findByText('Math');
    // Click delete button (Trash2 icon)
    const deleteBtn = document.querySelector('[title="Delete"]');
    expect(deleteBtn).toBeTruthy();
    fireEvent.click(deleteBtn!);
    await waitFor(() => {
      expect(screen.queryByText('Math')).not.toBeInTheDocument();
    });
  });

  it('editable name changes per generation', async () => {
    render(<FullTimetablePage />);
    await clickGenerate();
    const inputs = await screen.findAllByDisplayValue('Full Timetable');
    expect(inputs.length).toBeGreaterThanOrEqual(1);
    // Change the name
    const headerInput = inputs[inputs.length - 1]; // card input
    fireEvent.change(headerInput, { target: { value: 'My Timetable' } });
    expect(headerInput).toHaveValue('My Timetable');
  });
});

describe('Timetable — Download & Print', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSections.mockResolvedValue({ success: true, data: mockSections });
    mockGetTimetableSlots.mockResolvedValue({ success: true, data: timetablSlots });
    mockGetSectionTimetable.mockResolvedValue({ success: true, data: timetablEntriesSec1 });
  });

  it('download button exists after generation', async () => {
    render(<FullTimetablePage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Generate' }));
    const maths = await screen.findAllByText('Math');
    expect(maths.length).toBeGreaterThanOrEqual(1);
    expect(document.querySelector('[title="Download Excel"]')).toBeInTheDocument();
  });

  it('print button exists after generation', async () => {
    render(<FullTimetablePage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Generate' }));
    const maths = await screen.findAllByText('Math');
    expect(maths.length).toBeGreaterThanOrEqual(1);
    expect(document.querySelector('[title="Print"]')).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════
// DATESHEET MODE TESTS
// ═══════════════════════════════════════════════════════════════

describe('Datesheet — Detection & Loading', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSections.mockResolvedValue({ success: true, data: mockSections });
    mockGetTimetableSlots.mockResolvedValue({ success: true, data: datesheetSlots });
  });

  it('renders class toggle buttons for datesheet', async () => {
    render(<FullTimetablePage />);
    expect(await screen.findByText('Class 1 — A')).toBeInTheDocument();
  });

  it('shows Generate button for datesheet', async () => {
    render(<FullTimetablePage />);
    expect(await screen.findByRole('button', { name: 'Generate' })).toBeInTheDocument();
  });
});

describe('Datesheet — Generate Columns & Rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSections.mockResolvedValue({ success: true, data: mockSections });
    mockGetTimetableSlots.mockResolvedValue({ success: true, data: datesheetSlots });
    mockGetSectionTimetable.mockImplementation((_bId: string, secId: string) => {
      if (secId === 'sec-1') return Promise.resolve({ success: true, data: datesheetEntriesSec1 });
      if (secId === 'sec-2') return Promise.resolve({ success: true, data: datesheetEntriesSec2 });
      return Promise.resolve({ success: true, data: [] });
    });
  });

  const clickGenerate = async () => {
    fireEvent.click(await screen.findByRole('button', { name: 'Generate' }));
  };

  it('shows day names as column headers instead of times', async () => {
    render(<FullTimetablePage />);
    await clickGenerate();
    expect(await screen.findByText('Monday')).toBeInTheDocument();
    expect(await screen.findByText('Wednesday')).toBeInTheDocument();
    expect(await screen.findByText('Friday')).toBeInTheDocument();
  });

  it('does NOT show time ranges in datesheet headers', async () => {
    render(<FullTimetablePage />);
    await clickGenerate();
    expect(screen.queryByText('09:00 — 12:00')).not.toBeInTheDocument();
  });

  it('shows Day column header instead of Class', async () => {
    render(<FullTimetablePage />);
    await clickGenerate();
    expect(await screen.findByText('Day')).toBeInTheDocument();
  });

  it('shows subject note in datesheet cells', async () => {
    render(<FullTimetablePage />);
    await clickGenerate();
    expect(await screen.findByText('Midterm Math')).toBeInTheDocument();
    expect(await screen.findByText('Physics Exam')).toBeInTheDocument();
  });

  it('does NOT show teacher names in datesheet cells', async () => {
    render(<FullTimetablePage />);
    await clickGenerate();
    await screen.findByText('Midterm Math');
    expect(screen.queryByText('Ms. Sarah')).not.toBeInTheDocument();
  });

  it('shows subjects for each class in correct day columns', async () => {
    render(<FullTimetablePage />);
    await clickGenerate();
    // Class 1 has Midterm Math (Monday) and Physics Exam (Wednesday)
    expect(await screen.findByText('Midterm Math')).toBeInTheDocument();
    expect(await screen.findByText('Physics Exam')).toBeInTheDocument();
    // Class 2 has English Literature (Monday)
    expect(await screen.findByText('English Literature')).toBeInTheDocument();
  });

  it('stacks multiple subjects per day if present', async () => {
    // Add a second entry on Monday for class 1
    mockGetSectionTimetable.mockImplementation((_bId: string, secId: string) => {
      if (secId === 'sec-1') return Promise.resolve({
        success: true,
        data: [
          ...datesheetEntriesSec1,
          { id: 'de-extra', slotId: 'ds-slot-4', note: 'Chemistry Quiz', subject: null, teacher: null },
        ],
      });
      return Promise.resolve({ success: true, data: [] });
    });
    // Add a 4th slot on Monday
    mockGetTimetableSlots.mockResolvedValue({ success: true, data: [
      ...datesheetSlots,
      { id: 'ds-slot-4', lectureNumber: 4, startTime: '14:00', endTime: '15:00', dayOfWeek: 1 },
    ]});

    render(<FullTimetablePage />);
    await clickGenerate();
    expect(await screen.findByText('Chemistry Quiz')).toBeInTheDocument();
  });

  it('generates with correct number of day columns', async () => {
    render(<FullTimetablePage />);
    await clickGenerate();
    // Should have column headers for Monday, Wednesday, Friday
    const mondays = await screen.findAllByText('Monday');
    // Monday appears in column header AND in select if any
    expect(mondays.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Wednesday')).toBeInTheDocument();
    expect(screen.getByText('Friday')).toBeInTheDocument();
  });

  it('orders days correctly (Mon=1, Wed=3, Fri=5)', async () => {
    render(<FullTimetablePage />);
    await clickGenerate();
    await screen.findByText('Monday');
    const cells = document.querySelectorAll('th');
    const cellTexts = Array.from(cells).map(c => c.textContent);
    const dayIdx = cellTexts.findIndex(t => t === 'Day');
    expect(dayIdx).toBeGreaterThanOrEqual(0);
    // The headers after "Day" should be Monday, Wednesday, Friday
    const dayHeaders = cellTexts.filter(t => ['Monday', 'Wednesday', 'Friday'].includes(t || ''));
    expect(dayHeaders).toEqual(['Monday', 'Wednesday', 'Friday']);
  });
});

describe('Datesheet — Download & Print', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSections.mockResolvedValue({ success: true, data: mockSections });
    mockGetTimetableSlots.mockResolvedValue({ success: true, data: datesheetSlots });
    mockGetSectionTimetable.mockResolvedValue({ success: true, data: datesheetEntriesSec1 });
  });

  it('download button appears for datesheet', async () => {
    render(<FullTimetablePage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Generate' }));
    const subjects = await screen.findAllByText('Midterm Math');
    expect(subjects.length).toBeGreaterThanOrEqual(1);
    expect(document.querySelector('[title="Download Excel"]')).toBeInTheDocument();
  });

  it('print button appears for datesheet', async () => {
    render(<FullTimetablePage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Generate' }));
    const subjects = await screen.findAllByText('Midterm Math');
    expect(subjects.length).toBeGreaterThanOrEqual(1);
    expect(document.querySelector('[title="Print"]')).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════
// EDGE CASES & INTERACTIONS
// ═══════════════════════════════════════════════════════════════

describe('Edge Cases', () => {
  it('shows disabled generate button with no sections', async () => {
    mockGetSections.mockResolvedValue({ success: true, data: [] });
    mockGetTimetableSlots.mockResolvedValue({ success: true, data: timetablSlots });
    render(<FullTimetablePage />);
    await screen.findByDisplayValue('Full Timetable');
    const generateBtn = await screen.findByRole('button', { name: 'Generate' });
    expect(generateBtn).toBeDisabled();
  });

  it('handles empty section timetable entries gracefully', async () => {
    mockGetSections.mockResolvedValue({ success: true, data: mockSections });
    mockGetTimetableSlots.mockResolvedValue({ success: true, data: timetablSlots });
    mockGetSectionTimetable.mockResolvedValue({ success: true, data: [] }); // no entries

    render(<FullTimetablePage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Generate' }));
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('success', expect.any(String));
    });
  });

  it('handles empty datesheet entries gracefully', async () => {
    mockGetSections.mockResolvedValue({ success: true, data: mockSections });
    mockGetTimetableSlots.mockResolvedValue({ success: true, data: datesheetSlots });
    mockGetSectionTimetable.mockResolvedValue({ success: true, data: [] });

    render(<FullTimetablePage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Generate' }));
    // Should show day headers even with no entries
    await waitFor(() => {
      const mondays = screen.getAllByText('Monday');
      expect(mondays.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('datesheet with mixed day slots and entries shows correct structure', async () => {
    mockGetSections.mockResolvedValue({ success: true, data: [mockSections[0]] }); // just 1 section
    mockGetTimetableSlots.mockResolvedValue({ success: true, data: datesheetSlots });
    mockGetSectionTimetable.mockResolvedValue({ success: true, data: datesheetEntriesSec1 });

    render(<FullTimetablePage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Generate' }));
    await screen.findByText('Midterm Math');
    // Day header shows
    expect(screen.getByText('Day')).toBeInTheDocument();
    // Class name shows as row
    expect(screen.getByText('Class 1 — A')).toBeInTheDocument();
    // No teacher shown
    expect(screen.queryByText('Ms. Sarah')).not.toBeInTheDocument();
  });
});
