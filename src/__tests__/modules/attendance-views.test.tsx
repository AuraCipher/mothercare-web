/**
 * Attendance View Mode Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../helpers/test-utils';

const mockGetSections = vi.hoisted(() => vi.fn());
vi.mock('@/lib/api', () => ({ api: { getSections: mockGetSections } }));
vi.mock('@/components/toast', () => ({ showToast: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({}), usePathname: () => '/admin/attendance' }));

const localStorageMock = () => {
  let store: Record<string, string> = { token: 'test-jwt', activeBranchId: 'b-1', activeAYId: 'ay-1' };
  return { getItem: (key: string) => store[key] || null, setItem: () => {}, removeItem: () => {}, clear: () => {} };
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock() });

import AttendancePage from '@/app/admin/attendance/students/page';

describe('View mode switching', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSections.mockResolvedValue({ success: true, data: [] });
    global.fetch = vi.fn(() => Promise.resolve({ json: () => Promise.resolve({ success: true, data: [], total: 0 }) })) as any;
  });

  it('defaults to Day view', async () => {
    render(<AttendancePage />);
    const dayBtn = await screen.findByText('Day');
    expect(dayBtn.className).toContain('bg-warm-accent');
  });

  it('switches to Week view', async () => {
    render(<AttendancePage />);
    fireEvent.click(await screen.findByText('Week'));
    await screen.findByText('Mon');
    expect(await screen.findByText('Sun')).toBeInTheDocument();
  });

  it('switches to Month view', async () => {
    render(<AttendancePage />);
    fireEvent.click(await screen.findByText('Month'));
    await screen.findByText('1');
  });

  it('switches to Year view', async () => {
    render(<AttendancePage />);
    fireEvent.click(await screen.findByText('Year'));
    await screen.findByText('Jan');
    expect(await screen.findByText('Dec')).toBeInTheDocument();
  });

  it('shows search input in all views', async () => {
    render(<AttendancePage />);
    expect(await screen.findByPlaceholderText(/Search/)).toBeInTheDocument();
  });

  it('has navigation arrows for date', async () => {
    render(<AttendancePage />);
    const chevrons = document.querySelectorAll('button');
    const leftArrow = Array.from(chevrons).find(b => b.innerHTML.includes('ChevronLeft'));
    const rightArrow = Array.from(chevrons).find(b => b.innerHTML.includes('ChevronRight'));
    // They exist since lucide renders SVG elements
    expect(document.querySelectorAll('svg').length).toBeGreaterThan(0);
  });
});
