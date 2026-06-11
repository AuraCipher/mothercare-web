import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../helpers/test-utils';
import userEvent from '@testing-library/user-event';

const mockGetAcademicYears = vi.hoisted(() => vi.fn());
const mockPublish = vi.hoisted(() => vi.fn());
const mockArchive = vi.hoisted(() => vi.fn());
const mockDelete = vi.hoisted(() => vi.fn());
const mockGetCalendars = vi.hoisted(() => vi.fn());
const mockCreateCalendar = vi.hoisted(() => vi.fn());
const mockCreateAcademicYear = vi.hoisted(() => vi.fn());
const mockPause = vi.hoisted(() => vi.fn());
const mockResume = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/admin/settings/academic-years',
}));

vi.mock('@/lib/api', () => ({
  api: {
    getAcademicYears: mockGetAcademicYears,
    getCalendars: mockGetCalendars,
    createCalendar: mockCreateCalendar,
    createAcademicYear: mockCreateAcademicYear,
    publishAcademicYear: mockPublish,
    archiveAcademicYear: mockArchive,
    deleteAcademicYear: mockDelete,
    pauseAcademicYear: mockPause,
    resumeAcademicYear: mockResume,
  },
}));

const localStorageMock = (() => {
  let store: Record<string, string> = { token: 'test-jwt', activeBranchId: 'branch-1' };
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock reload
const reloadMock = vi.fn();
Object.defineProperty(window, 'location', { value: { reload: reloadMock }, writable: true });

import AcademicYearsPage from '@/app/admin/settings/academic-years/page';

const mockYears = [
  { id: 'ay-1', branchId: 'branch-1', calendarId: 'cal-1', status: 'ACTIVE', previousAcademicYearId: null, createdAt: '2024-01-01', calendar: { id: 'cal-1', label: '2024-2025' }, branch: { id: 'branch-1', name: 'Test Branch', code: 'TST' }, _count: { groups: 13, students: 200, members: 5 } },
  { id: 'ay-2', branchId: 'branch-1', calendarId: 'cal-2', status: 'BUILD_STAGE', previousAcademicYearId: 'ay-1', createdAt: '2025-06-01', calendar: { id: 'cal-2', label: '2025-2026' }, branch: { id: 'branch-1', name: 'Test Branch', code: 'TST' }, _count: { groups: 0, students: 0, members: 0 } },
  { id: 'ay-3', branchId: 'branch-1', calendarId: 'cal-3', status: 'ARCHIVED', previousAcademicYearId: null, createdAt: '2023-01-01', calendar: { id: 'cal-3', label: '2023-2024' }, branch: { id: 'branch-1', name: 'Test Branch', code: 'TST' }, _count: { groups: 12, students: 180, members: 4 } },
];

describe('AcademicYearsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAcademicYears.mockResolvedValue({ success: true, data: mockYears });
    reloadMock.mockReset();
  });

  it('renders all academic years', async () => {
    render(<AcademicYearsPage />);
    expect(await screen.findByText('2024-2025')).toBeInTheDocument();
    expect(await screen.findByText('2025-2026')).toBeInTheDocument();
    expect(await screen.findByText('2023-2024')).toBeInTheDocument();
  });

  it('shows status badges', async () => {
    render(<AcademicYearsPage />);
    expect(await screen.findByText('ACTIVE')).toBeInTheDocument();
    expect(await screen.findByText('BUILD STAGE')).toBeInTheDocument();
    expect(await screen.findByText('ARCHIVED')).toBeInTheDocument();
  });

  // ─── View button (24-B) ────────────────────────────

  it('has View button on each AY card', async () => {
    render(<AcademicYearsPage />);
    const viewBtns = await screen.findAllByText('👁');
    expect(viewBtns.length).toBe(3);
  });

  it('View button sets localStorage and reloads', async () => {
    render(<AcademicYearsPage />);
    const viewBtns = await screen.findAllByText('👁');
    await userEvent.setup().click(viewBtns[0]); // click on 2024-2025

    expect(localStorage.getItem('activeAYId')).toBe('ay-1');
    expect(reloadMock).toHaveBeenCalledOnce();
  });

  // ─── Pause/Resume (24-G) ───────────────────────────

  it('shows Pause button for ACTIVE year', async () => {
    render(<AcademicYearsPage />);
    expect(await screen.findByTitle('Pause')).toBeInTheDocument();
  });

  it('shows Resume button for ON_HOLD year after pause', async () => {
    // Mock an ON_HOLD year
    mockGetAcademicYears.mockResolvedValue({
      success: true,
      data: [{ ...mockYears[0], status: 'ON_HOLD' }],
    });
    render(<AcademicYearsPage />);
    expect(await screen.findByTitle('Resume')).toBeInTheDocument();
  });
});
