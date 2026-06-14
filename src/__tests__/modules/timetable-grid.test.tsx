import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../helpers/test-utils';

// ─── Hoisted mocks ──────────────────────────────────────
const mockGetSections = vi.hoisted(() => vi.fn());
const mockGetTimetableSlots = vi.hoisted(() => vi.fn());
const mockGetTimetableDays = vi.hoisted(() => vi.fn());
const mockSetTimetableDays = vi.hoisted(() => vi.fn());
const mockCreateTimetableSlot = vi.hoisted(() => vi.fn());
const mockDeleteTimetableSlot = vi.hoisted(() => vi.fn());
const mockShowToast = vi.hoisted(() => vi.fn());
const mockPush = vi.hoisted(() => vi.fn());
const mockSearchParamsGet = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), prefetch: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => ({ get: mockSearchParamsGet }),
  usePathname: () => '/admin/timetable/grid',
}));

vi.mock('@/lib/api', () => ({
  api: {
    getSections: mockGetSections,
    getTimetableSlots: mockGetTimetableSlots,
    getTimetableDays: mockGetTimetableDays,
    setTimetableDays: mockSetTimetableDays,
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
  { id: 'slot-1', dayOfWeek: null, lectureNumber: 1, startTime: '08:00', endTime: '08:40' },
  { id: 'slot-2', dayOfWeek: null, lectureNumber: 2, startTime: '08:40', endTime: '09:20' },
];
const mockDayConfigs = [
  { id: 'dc-1', timetableId: 'tt-1', dayOfWeek: 1, isActive: true },
  { id: 'dc-2', timetableId: 'tt-1', dayOfWeek: 2, isActive: true },
  { id: 'dc-3', timetableId: 'tt-1', dayOfWeek: 3, isActive: true },
  { id: 'dc-4', timetableId: 'tt-1', dayOfWeek: 4, isActive: true },
  { id: 'dc-5', timetableId: 'tt-1', dayOfWeek: 5, isActive: true },
  { id: 'dc-6', timetableId: 'tt-1', dayOfWeek: 6, isActive: false }, // Saturday inactive
];
const mockSections = [
  { id: 'sec-1', name: 'Class 1', section: 'A', _count: { students: 15 } },
  { id: 'sec-2', name: 'Class 2', section: null, _count: { students: 20 } },
];

import TimetableGridPage from '@/app/admin/timetable/grid/page';

describe('TimetableGridPage — Loading & Summary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParamsGet.mockReturnValue('tt-1');
    mockGetSections.mockResolvedValue({ success: true, data: mockSections });
    mockGetTimetableSlots.mockResolvedValue({ success: true, data: mockSlots });
    mockGetTimetableDays.mockResolvedValue({ success: true, data: mockDayConfigs });
  });

  it('renders loading skeleton initially', () => {
    mockGetSections.mockImplementation(() => new Promise(() => {}));
    const { container } = render(<TimetableGridPage />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThanOrEqual(1);
  });

  it('renders title and summary', async () => {
    render(<TimetableGridPage />);
    expect(await screen.findByText('Timetable')).toBeInTheDocument();
    expect(await screen.findByText('2 lecture(s) · 5 day(s) active')).toBeInTheDocument();
  });

  it('renders all day toggle buttons', async () => {
    render(<TimetableGridPage />);
    expect(await screen.findByText('Monday')).toBeInTheDocument();
    expect(await screen.findByText('Tuesday')).toBeInTheDocument();
    expect(await screen.findByText('Wednesday')).toBeInTheDocument();
    expect(await screen.findByText('Thursday')).toBeInTheDocument();
    expect(await screen.findByText('Friday')).toBeInTheDocument();
    expect(await screen.findByText('Saturday')).toBeInTheDocument();
  });

  it('shows Edit Lectures button', async () => {
    render(<TimetableGridPage />);
    expect(await screen.findByText('Edit Lectures')).toBeInTheDocument();
  });

  it('back button navigates to timetable list', async () => {
    render(<TimetableGridPage />);
    const backBtn = await screen.findByText('Back');
    fireEvent.click(backBtn);
    expect(mockPush).toHaveBeenCalledWith('/admin/timetable');
  });
});

describe('TimetableGridPage — Day Toggles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParamsGet.mockReturnValue('tt-1');
    mockGetSections.mockResolvedValue({ success: true, data: mockSections });
    mockGetTimetableSlots.mockResolvedValue({ success: true, data: mockSlots });
    mockGetTimetableDays.mockResolvedValue({ success: true, data: mockDayConfigs });
    mockSetTimetableDays.mockResolvedValue({ success: true });
  });

  it('calls setTimetableDays when a day is toggled', async () => {
    render(<TimetableGridPage />);
    const mondayBtn = await screen.findByText('Monday');
    fireEvent.click(mondayBtn);
    await waitFor(() => {
      expect(mockSetTimetableDays).toHaveBeenCalled();
    });
  });
});

describe('TimetableGridPage — Slot Editor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParamsGet.mockReturnValue('tt-1');
    mockGetSections.mockResolvedValue({ success: true, data: mockSections });
    mockGetTimetableSlots.mockResolvedValue({ success: true, data: mockSlots });
    mockGetTimetableDays.mockResolvedValue({ success: true, data: mockDayConfigs });
    mockSetTimetableDays.mockResolvedValue({ success: true });
  });

  it('shows slot editor after clicking Edit Lectures', async () => {
    render(<TimetableGridPage />);
    fireEvent.click(await screen.findByText('Edit Lectures'));
    expect(await screen.findByText('Lecture')).toBeInTheDocument();
    const starts = await screen.findAllByText('Start');
    expect(starts.length).toBeGreaterThanOrEqual(1);
    const ends = await screen.findAllByText('End');
    expect(ends.length).toBeGreaterThanOrEqual(1);
  });

  it('shows Add Lecture button in editor', async () => {
    render(<TimetableGridPage />);
    fireEvent.click(await screen.findByText('Edit Lectures'));
    expect(await screen.findByText('Add Lecture')).toBeInTheDocument();
  });

  it('shows Done Editing after toggling', async () => {
    render(<TimetableGridPage />);
    fireEvent.click(await screen.findByText('Edit Lectures'));
    expect(await screen.findByText('Done Editing')).toBeInTheDocument();
  });

  it('hides editor after clicking Done Editing', async () => {
    render(<TimetableGridPage />);
    fireEvent.click(await screen.findByText('Edit Lectures'));
    await screen.findByText('Done Editing');
    fireEvent.click(screen.getByText('Done Editing'));
    await waitFor(() => {
      expect(screen.queryByText('Done Editing')).not.toBeInTheDocument();
    });
  });

  it('shows existing slots in the editor table', async () => {
    render(<TimetableGridPage />);
    fireEvent.click(await screen.findByText('Edit Lectures'));
    // Times appear in both table cells and time input default values
    const slot08s = await screen.findAllByText('08:00');
    expect(slot08s.length).toBeGreaterThanOrEqual(1);
    const slot08s40 = await screen.findAllByText('08:40');
    expect(slot08s40.length).toBeGreaterThanOrEqual(1);
  });

  it('shows remove buttons for each slot', async () => {
    render(<TimetableGridPage />);
    fireEvent.click(await screen.findByText('Edit Lectures'));
    await screen.findByText('Lecture'); // wait for table
    const trashButtons = document.querySelectorAll('[class*="lucide-trash"]');
    expect(trashButtons.length).toBe(2);
  });

  it('calls delete API when remove is clicked', async () => {
    mockDeleteTimetableSlot.mockResolvedValue({ success: true, message: 'Slot deleted' });
    render(<TimetableGridPage />);
    fireEvent.click(await screen.findByText('Edit Lectures'));
    await screen.findByText('Lecture'); // wait for table
    const trashButtons = document.querySelectorAll('[class*="lucide-trash"]');
    fireEvent.click(trashButtons[0]);
    await waitFor(() => {
      expect(mockDeleteTimetableSlot).toHaveBeenCalledWith('branch-1', 'tt-1', 'slot-1');
    });
  });

  it('calls create API when Add Lecture is clicked', async () => {
    mockCreateTimetableSlot.mockResolvedValue({ success: true, data: {} });
    mockGetTimetableSlots.mockResolvedValue({ success: true, data: mockSlots });
    render(<TimetableGridPage />);
    fireEvent.click(await screen.findByText('Edit Lectures'));
    const addBtn = await screen.findByText('Add Lecture');
    fireEvent.click(addBtn);
    await waitFor(() => {
      expect(mockCreateTimetableSlot).toHaveBeenCalledWith('branch-1', 'tt-1', { startTime: '08:00', endTime: '08:40' });
    });
  });
});

describe('TimetableGridPage — Class Cards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParamsGet.mockReturnValue('tt-1');
    mockGetSections.mockResolvedValue({ success: true, data: mockSections });
    mockGetTimetableSlots.mockResolvedValue({ success: true, data: mockSlots });
    mockGetTimetableDays.mockResolvedValue({ success: true, data: mockDayConfigs });
    mockSetTimetableDays.mockResolvedValue({ success: true });
  });

  it('shows no classes when sections empty', async () => {
    mockGetSections.mockResolvedValue({ success: true, data: [] });
    render(<TimetableGridPage />);
    expect(await screen.findByText('No classes yet.')).toBeInTheDocument();
  });

  it('renders class cards', async () => {
    render(<TimetableGridPage />);
    expect(await screen.findByText('Class 1')).toBeInTheDocument();
    expect(await screen.findByText('Class 2')).toBeInTheDocument();
  });

  it('shows section label on card', async () => {
    render(<TimetableGridPage />);
    expect(await screen.findByText('Section — A')).toBeInTheDocument();
  });

  it('shows student counts', async () => {
    render(<TimetableGridPage />);
    expect(await screen.findByText('15 students')).toBeInTheDocument();
    expect(await screen.findByText('20 students')).toBeInTheDocument();
  });

  it('clicking class card navigates to section page', async () => {
    render(<TimetableGridPage />);
    const card = await screen.findByText('Class 1');
    fireEvent.click(card);
    expect(mockPush).toHaveBeenCalledWith('/admin/timetable/sec-1?id=tt-1&src=timetable');
  });
});
