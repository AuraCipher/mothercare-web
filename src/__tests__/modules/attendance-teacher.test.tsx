/**
 * Teacher Attendance Page Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../helpers/test-utils';

const mockPush = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/admin/attendance/teachers',
}));

const localStorageMock = (() => {
  let store: Record<string, string> = { token: 'test-jwt', activeAYId: 'ay-1' };
  return { getItem: (key: string) => store[key] || null, setItem: (k: string, v: string) => { store[k] = v; }, removeItem: (k: string) => { delete store[k]; }, clear: () => { store = {}; } };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const mockTeachers = [
  { id: 't1', name: 'Ms. Fatima Ali', attendances: [{ date: '2026-06-24', status: 'present' }] },
  { id: 't2', name: 'Mr. Usman Khan', attendances: [] },
];

import TeacherAttendancePage from '@/app/admin/attendance/teachers/page';

describe('Teacher Attendance Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn(() =>
      Promise.resolve({ json: () => Promise.resolve({ success: true, data: mockTeachers, total: 2 }) })
    ) as any;
  });

  it('renders teacher attendance title', async () => {
    render(<TeacherAttendancePage />);
    expect(await screen.findByText('Teacher Attendance')).toBeInTheDocument();
  });

  it('shows All Teachers label', async () => {
    render(<TeacherAttendancePage />);
    expect(await screen.findByText('All Teachers')).toBeInTheDocument();
  });

  it('renders teacher names', async () => {
    render(<TeacherAttendancePage />);
    expect(await screen.findByText('Ms. Fatima Ali')).toBeInTheDocument();
    expect(await screen.findByText('Mr. Usman Khan')).toBeInTheDocument();
  });

  it('has view mode buttons', async () => {
    render(<TeacherAttendancePage />);
    expect(await screen.findByText('Day')).toBeInTheDocument();
    expect(await screen.findByText('Week')).toBeInTheDocument();
    expect(await screen.findByText('Month')).toBeInTheDocument();
    expect(await screen.findByText('Year')).toBeInTheDocument();
  });

  it('shows search input', async () => {
    render(<TeacherAttendancePage />);
    expect(await screen.findByPlaceholderText(/Search teacher/)).toBeInTheDocument();
  });

  it('shows bulk action buttons in day view', async () => {
    render(<TeacherAttendancePage />);
    expect(await screen.findByText('All Present')).toBeInTheDocument();
    expect(await screen.findByText('All Absent')).toBeInTheDocument();
    expect(await screen.findByText('All Late')).toBeInTheDocument();
  });

  it('shows totals bar', async () => {
    render(<TeacherAttendancePage />);
    await screen.findByText('Teacher Attendance');
    const pText = document.querySelector('.text-green-400');
    expect(pText).toBeTruthy();
  });
});
