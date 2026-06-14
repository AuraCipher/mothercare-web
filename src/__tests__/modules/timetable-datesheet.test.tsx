import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../helpers/test-utils';

// ─── Hoisted mocks ──────────────────────────────────────
const mockGetTimetableSlots = vi.hoisted(() => vi.fn());
const mockGetSections = vi.hoisted(() => vi.fn());
const mockCreateTimetableSlot = vi.hoisted(() => vi.fn());
const mockDeleteTimetableSlot = vi.hoisted(() => vi.fn());
const mockShowToast = vi.hoisted(() => vi.fn());
const mockPush = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), prefetch: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn() }),
  useParams: () => ({ id: 'ds-1' }),
  usePathname: () => '/admin/timetable/datesheet/ds-1',
}));

vi.mock('@/lib/api', () => ({
  api: {
    getTimetableSlots: mockGetTimetableSlots,
    getSections: mockGetSections,
    createTimetableSlot: mockCreateTimetableSlot,
    deleteTimetableSlot: mockDeleteTimetableSlot,
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
const mockSlots = [
  { id: 's-1', dayOfWeek: 1, lectureNumber: 1, startTime: '09:00', endTime: '12:00' },
  { id: 's-2', dayOfWeek: 3, lectureNumber: 2, startTime: '09:00', endTime: '12:00' },
  { id: 's-3', dayOfWeek: 5, lectureNumber: 3, startTime: '14:00', endTime: '17:00' },
];
const mockSections = [
  { id: 'sec-1', name: 'Class 1', section: 'A', displayOrder: 1, _count: { students: 15 } },
  { id: 'sec-2', name: 'Class 2', section: 'B', displayOrder: 2, _count: { students: 20 } },
];

import DatesheetPage from '@/app/admin/timetable/datesheet/[id]/page';

describe('DatesheetPage — Loading & Empty', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTimetableSlots.mockResolvedValue({ success: true, data: mockSlots });
    mockGetSections.mockResolvedValue({ success: true, data: mockSections });
  });

  it('renders loading skeleton initially', () => {
    mockGetTimetableSlots.mockImplementation(() => new Promise(() => {}));
    const { container } = render(<DatesheetPage />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThanOrEqual(1);
  });

  it('renders title', async () => {
    render(<DatesheetPage />);
    expect(await screen.findByText('Date Sheet')).toBeInTheDocument();
  });

  it('shows empty classes when no sections', async () => {
    mockGetSections.mockResolvedValue({ success: true, data: [] });
    render(<DatesheetPage />);
    expect(await screen.findByText('No classes found.')).toBeInTheDocument();
  });
});

describe('DatesheetPage — Editor (Edit Papers)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTimetableSlots.mockResolvedValue({ success: true, data: mockSlots });
    mockGetSections.mockResolvedValue({ success: true, data: mockSections });
  });

  it('shows Edit Papers button', async () => {
    render(<DatesheetPage />);
    expect(await screen.findByText('Edit Papers')).toBeInTheDocument();
  });

  it('shows editor panel after clicking Edit Papers', async () => {
    render(<DatesheetPage />);
    fireEvent.click(await screen.findByText('Edit Papers'));
    // After toggling editor, the heading "Add Paper" appears
    const addPaperHeadings = await screen.findAllByText('Add Paper');
    expect(addPaperHeadings.length).toBeGreaterThanOrEqual(1);
  });

  it('shows papers in the editor table', async () => {
    render(<DatesheetPage />);
    fireEvent.click(await screen.findByText('Edit Papers'));
    // Wait for table to render — check for column headers
    expect(await screen.findByText('Paper')).toBeInTheDocument();
    // Day names appear in both table cells and dropdown options
    const mondays = await screen.findAllByText('Monday');
    expect(mondays.length).toBeGreaterThanOrEqual(1);
  });

  it('shows remove buttons for each paper', async () => {
    render(<DatesheetPage />);
    fireEvent.click(await screen.findByText('Edit Papers'));
    await screen.findByText('Paper'); // wait for table
    const trashButtons = document.querySelectorAll('[class*="lucide-trash"]');
    expect(trashButtons.length).toBe(3);
  });

  it('calls delete API when remove is clicked', async () => {
    mockDeleteTimetableSlot.mockResolvedValue({ success: true, message: 'Slot deleted' });
    render(<DatesheetPage />);
    fireEvent.click(await screen.findByText('Edit Papers'));
    await screen.findByText('Paper'); // wait for table
    const trashButtons = document.querySelectorAll('[class*="lucide-trash"]');
    fireEvent.click(trashButtons[0]);
    await waitFor(() => {
      expect(mockDeleteTimetableSlot).toHaveBeenCalledWith('branch-1', 'ds-1', 's-1');
    });
  });

  it('shows Add Paper form controls after toggling editor', async () => {
    render(<DatesheetPage />);
    fireEvent.click(await screen.findByText('Edit Papers'));
    // The Add Paper section heading
    const addPaperHeadings = await screen.findAllByText('Add Paper');
    expect(addPaperHeadings.length).toBeGreaterThanOrEqual(1);
    // Check for time text inputs (HH:MM format)
    const timeInputs = document.querySelectorAll('input[placeholder="HH:MM"]');
    expect(timeInputs.length).toBe(2);
    // Check for day select
    const selects = document.querySelectorAll('select');
    expect(selects.length).toBeGreaterThanOrEqual(1);
  });

  it('calls create API when Add Paper button is clicked', async () => {
    mockCreateTimetableSlot.mockResolvedValue({ success: true, data: {} });
    mockGetTimetableSlots.mockResolvedValue({ success: true, data: mockSlots });
    render(<DatesheetPage />);
    fireEvent.click(await screen.findByText('Edit Papers'));

    // Find the "Add Paper" button (not the heading)
    const addPaperButtons = await screen.findAllByRole('button', { name: /add paper/i });
    fireEvent.click(addPaperButtons[addPaperButtons.length - 1]);

    await waitFor(() => {
      expect(mockCreateTimetableSlot).toHaveBeenCalledWith('branch-1', 'ds-1', { dayOfWeek: 1, startTime: '09:00', endTime: '12:00' });
    });
  });

  it('hides editor after clicking Done Editing', async () => {
    render(<DatesheetPage />);
    fireEvent.click(await screen.findByText('Edit Papers'));
    // Wait for editor to appear
    await screen.findByText('Done Editing');
    fireEvent.click(screen.getByText('Done Editing'));
    await waitFor(() => {
      expect(screen.queryByText('Done Editing')).not.toBeInTheDocument();
    });
  });
});

describe('DatesheetPage — Class Cards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTimetableSlots.mockResolvedValue({ success: true, data: mockSlots });
    mockGetSections.mockResolvedValue({ success: true, data: mockSections });
  });

  it('shows Classes heading', async () => {
    render(<DatesheetPage />);
    expect(await screen.findByText('Classes')).toBeInTheDocument();
  });

  it('renders class cards with section names', async () => {
    render(<DatesheetPage />);
    expect(await screen.findByText('Class 1')).toBeInTheDocument();
    expect(await screen.findByText('Class 2')).toBeInTheDocument();
  });

  it('shows section labels on cards', async () => {
    render(<DatesheetPage />);
    expect(await screen.findByText('Section — A')).toBeInTheDocument();
    expect(await screen.findByText('Section — B')).toBeInTheDocument();
  });

  it('shows student counts', async () => {
    render(<DatesheetPage />);
    expect(await screen.findByText('15 students')).toBeInTheDocument();
    expect(await screen.findByText('20 students')).toBeInTheDocument();
  });

  it('clicking class card navigates to section page', async () => {
    render(<DatesheetPage />);
    const classCard = await screen.findByText('Class 1');
    fireEvent.click(classCard);
    expect(mockPush).toHaveBeenCalledWith('/admin/timetable/sec-1?id=ds-1&src=datesheet');
  });

  it('back button navigates to timetable list', async () => {
    render(<DatesheetPage />);
    const backBtn = await screen.findByText('Back');
    fireEvent.click(backBtn);
    expect(mockPush).toHaveBeenCalledWith('/admin/timetable');
  });
});
