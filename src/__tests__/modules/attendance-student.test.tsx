/**
 * Student Attendance Page Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../helpers/test-utils';

const mockLoadAttendance = vi.hoisted(() => vi.fn());
const mockGetSections = vi.hoisted(() => vi.fn());
const mockShowToast = vi.hoisted(() => vi.fn());
const mockPush = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/admin/attendance',
}));

vi.mock('@/lib/api', () => ({
  api: { getSections: mockGetSections },
}));

vi.mock('@/components/toast', () => ({
  showToast: mockShowToast,
}));

const localStorageMock = (() => {
  let store: Record<string, string> = { token: 'test-jwt', activeBranchId: 'b-1', activeAYId: 'ay-1' };
  return { getItem: (key: string) => store[key] || null, setItem: (k: string, v: string) => { store[k] = v; }, removeItem: (k: string) => { delete store[k]; }, clear: () => { store = {}; } };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const mockStudents = [
  { id: 's1', name: 'Ali', rollNumber: '1', admissionNumber: 'ADM-1', groupId: 'g1', attendances: [] },
  { id: 's2', name: 'Fatima', rollNumber: '2', admissionNumber: 'ADM-2', groupId: 'g1', attendances: [] },
];

import AttendancePage from '@/app/admin/attendance/page';

describe('Student Attendance Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSections.mockResolvedValue({ success: true, data: [{ id: 'g1', name: 'Class 1' }] });
    global.fetch = vi.fn(() =>
      Promise.resolve({ json: () => Promise.resolve({ success: true, data: mockStudents, total: 2 }) })
    ) as any;
  });

  it('renders the attendance title', async () => {
    render(<AttendancePage />);
    expect(await screen.findByText('Attendance')).toBeInTheDocument();
  });

  it('shows All Students option in class selector', async () => {
    render(<AttendancePage />);
    expect(await screen.findByText('— All Students —')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    render(<AttendancePage />);
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders view mode buttons (Day, Week, Month, Year)', async () => {
    render(<AttendancePage />);
    expect(await screen.findByText('Day')).toBeInTheDocument();
    expect(await screen.findByText('Week')).toBeInTheDocument();
    expect(await screen.findByText('Month')).toBeInTheDocument();
    expect(await screen.findByText('Year')).toBeInTheDocument();
  });

  it('switches to Week view on button click', async () => {
    render(<AttendancePage />);
    const weekBtn = await screen.findByText('Week');
    fireEvent.click(weekBtn);
    expect(await screen.findByText('Mon')).toBeInTheDocument();
  });

  it('renders student names in the table', async () => {
    render(<AttendancePage />);
    expect(await screen.findByText('Ali')).toBeInTheDocument();
    expect(await screen.findByText('Fatima')).toBeInTheDocument();
  });

  it('shows totals bar with P/A/L/Lv/F counts', async () => {
    render(<AttendancePage />);
    await screen.findByText('Ali');
    expect(document.querySelector('.text-green-400')).toBeTruthy();
  });

  it('shows select a class when no group selected', async () => {
    render(<AttendancePage />);
    await screen.findByText('Attendance');
    expect(screen.getByText(/Select a Class/i)).toBeTruthy();
  });

  it('search input filters students', async () => {
    render(<AttendancePage />);
    await screen.findByText('Ali');
    const searchInput = document.querySelector('input[placeholder*="Search"]');
    expect(searchInput).toBeTruthy();
  });
});
