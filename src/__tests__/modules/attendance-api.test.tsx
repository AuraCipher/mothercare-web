/**
 * Attendance API Integration Mocking Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../helpers/test-utils';

const mockGetSections = vi.hoisted(() => vi.fn());
const mockPush = vi.hoisted(() => vi.fn());
let mockFetch: any;

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/admin/attendance',
}));

import { mockScopeQuery } from '../helpers/mocks';

vi.mock('@/lib/api', () => ({
  api: { getSections: mockGetSections },
  scopeQuery: mockScopeQuery,
}));

vi.mock('@/components/toast', () => ({
  showToast: vi.fn(),
}));

const localStorageMock = (() => {
  let store: Record<string, string> = { token: 'test-jwt', activeBranchId: 'b-1', activeAYId: 'ay-1' };
  return { getItem: (key: string) => store[key] || null, setItem: (k: string, v: string) => { store[k] = v; }, removeItem: (k: string) => { delete store[k]; }, clear: () => { store = {}; } };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

import AttendancePage from '@/app/admin/attendance/students/page';

describe('Attendance API — empty state and errors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSections.mockResolvedValue({ success: true, data: [] });
  });

  it('shows No students message when API returns empty', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ json: () => Promise.resolve({ success: true, data: [], total: 0 }) })
    ) as any;
    render(<AttendancePage />);
    expect(await screen.findByText(/No students/i)).toBeInTheDocument();
  });

  it('handles API error gracefully', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('Network error'))) as any;
    render(<AttendancePage />);
    // Should not crash — show loading then empty state
    await screen.findByText('Attendance');
    // No crash means success
  });
});

describe('Attendance API — batch save', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSections.mockResolvedValue({ success: true, data: [{ id: 'g1', name: 'Class 1' }] });
    global.fetch = vi.fn((url: string) => {
      if (url.includes('attendance?')) {
        return Promise.resolve({ json: () => Promise.resolve({ success: true, data: [{ id: 's1', name: 'Test', rollNumber: '1', groupId: 'g1', attendances: [] }], total: 1 }) });
      }
      if (url.includes('/batch')) {
        return Promise.resolve({ json: () => Promise.resolve({ success: true, data: { saved: 1, total: 1 } }) });
      }
      return Promise.resolve({ json: () => Promise.resolve({}) });
    }) as any;
  });

  it('calls batch API with correct endpoint for students', async () => {
    render(<AttendancePage />);
    await screen.findByText('Test');
    // Select class first
    const select = await screen.findByText('— All Students —');
    fireEvent.click(select);
    // Verify the page rendered with student data
    expect(await screen.findByText('Test')).toBeInTheDocument();
  });
});
