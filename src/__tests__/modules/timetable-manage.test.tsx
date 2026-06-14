import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../helpers/test-utils';

const mockGetTimetables = vi.hoisted(() => vi.fn());
const mockGetSections = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/admin/timetable',
}));

vi.mock('@/lib/api', () => ({
  api: {
    getTimetables: mockGetTimetables,
    getSections: mockGetSections,
    getTimetableSlots: vi.fn().mockResolvedValue({ success: true, data: [] }),
    getTimetableDays: vi.fn().mockResolvedValue({ success: true, data: [] }),
    setTimetableDays: vi.fn().mockResolvedValue({ success: true }),
    createTimetable: vi.fn().mockResolvedValue({ success: true }),
    renameTimetable: vi.fn().mockResolvedValue({ success: true }),
    deleteTimetable: vi.fn().mockResolvedValue({ success: true }),
  },
}));

const localStorageMock = (() => {
  let store: Record<string, string> = { token: 'test-jwt', activeBranchId: 'branch-1', activeAYId: 'ay-1' };
  return { getItem: (key: string) => store[key] || null, setItem: (k: string, v: string) => { store[k] = v; }, removeItem: (k: string) => { delete store[k]; }, clear: () => { store = {}; } };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

import TimetableManagePage from '@/app/admin/timetable/page';

describe('TimetableManagePage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders title', async () => {
    mockGetTimetables.mockResolvedValue({ success: true, data: [] });
    mockGetSections.mockResolvedValue({ success: true, data: [] });
    render(<TimetableManagePage />);
    expect(await screen.findByText('Schedule Manager')).toBeInTheDocument();
  });

  it('shows Time Tables column', async () => {
    mockGetTimetables.mockResolvedValue({ success: true, data: [] });
    mockGetSections.mockResolvedValue({ success: true, data: [] });
    render(<TimetableManagePage />);
    expect(await screen.findByText('Time Tables')).toBeInTheDocument();
  });

  it('shows Date Sheets column', async () => {
    mockGetTimetables.mockResolvedValue({ success: true, data: [] });
    mockGetSections.mockResolvedValue({ success: true, data: [] });
    render(<TimetableManagePage />);
    expect(await screen.findByText('Date Sheets')).toBeInTheDocument();
  });

  it('renders timetable cards when data exists', async () => {
    mockGetTimetables.mockResolvedValue({ success: true, data: [{ id: 'tt-1', name: 'Regular', type: 'timetable', slotCount: 3, activeDays: 5 }] });
    mockGetSections.mockResolvedValue({ success: true, data: [] });
    render(<TimetableManagePage />);
    expect(await screen.findByText('Regular')).toBeInTheDocument();
  });

  it('renders datesheet cards when data exists', async () => {
    mockGetTimetables.mockResolvedValue({ success: true, data: [{ id: 'ds-1', name: 'Final Exam', type: 'datesheet', slotCount: 0, activeDays: 6 }] });
    mockGetSections.mockResolvedValue({ success: true, data: [] });
    render(<TimetableManagePage />);
    expect(await screen.findByText('Final Exam')).toBeInTheDocument();
  });

  it('shows Active status for timetable with active days', async () => {
    mockGetTimetables.mockResolvedValue({ success: true, data: [{ id: 'tt-1', name: 'Regular', type: 'timetable', slotCount: 3, activeDays: 5 }] });
    mockGetSections.mockResolvedValue({ success: true, data: [] });
    render(<TimetableManagePage />);
    const activeLabels = await screen.findAllByText('Active');
    expect(activeLabels.length).toBeGreaterThanOrEqual(1);
  });

  it('shows Inactive status for timetable with zero active days', async () => {
    mockGetTimetables.mockResolvedValue({ success: true, data: [{ id: 'tt-1', name: 'Regular', type: 'timetable', slotCount: 0, activeDays: 0 }] });
    mockGetSections.mockResolvedValue({ success: true, data: [] });
    render(<TimetableManagePage />);
    expect(await screen.findByText('Inactive')).toBeInTheDocument();
  });
});
