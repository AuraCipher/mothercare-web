/**
 * Student Detail — Status Management UI Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../helpers/test-utils';

const mockGetStudent = vi.hoisted(() => vi.fn());
const mockRequest = vi.hoisted(() => vi.fn());
const mockPush = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => ({ id: 's1' }),
}));

vi.mock('@/lib/api', () => ({
  api: { getStudent: mockGetStudent },
  apiRequest: mockRequest,
}));

vi.mock('@/components/toast', () => ({
  showToast: vi.fn(),
}));

const localStorageMock = (() => {
  let store: Record<string, string> = { token: 'test-jwt', activeBranchId: 'b-1', activeAYId: 'ay-1' };
  return { getItem: (key: string) => store[key] || null, setItem: (k: string, v: string) => { store[k] = v; }, removeItem: (k: string) => { delete store[k]; }, clear: () => { store = {}; } };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

import StudentDetailPage from '@/app/admin/students/[id]/page';

const mockStudent = {
  id: 's1', name: 'Ali Hassan', status: 'ACTIVE', isActive: true,
  group: { name: 'Class 5' }, admissionNumber: 'MCS-2026-0042',
  attendances: [], parents: [], emergencyContacts: [],
};

describe('StudentDetailPage — Status Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetStudent.mockResolvedValue({ success: true, data: mockStudent });
    mockRequest.mockResolvedValue({ success: true, data: [], message: 'OK' });
    global.fetch = vi.fn(() => Promise.resolve({ json: () => Promise.resolve({ success: true }) })) as any;
  });

  it('renders student name', async () => {
    render(<StudentDetailPage />);
    expect(await screen.findByText('Ali Hassan')).toBeInTheDocument();
  });

  it('renders Student Status section heading', async () => {
    render(<StudentDetailPage />);
    expect(await screen.findByText('Student Status')).toBeInTheDocument();
  });

  it('shows current status badge', async () => {
    render(<StudentDetailPage />);
    await screen.findByText('Student Status');
    expect(screen.getByText('ACTIVE')).toBeTruthy();
  });

  it('shows status change dropdown', async () => {
    render(<StudentDetailPage />);
    await screen.findByText('Student Status');
    expect(screen.getByText('Change status…')).toBeTruthy();
  });

  it('shows reason input field', async () => {
    render(<StudentDetailPage />);
    await screen.findByPlaceholderText(/Reason/);
  });

  it('shows Delete Student button', async () => {
    render(<StudentDetailPage />);
    await screen.findByText('Student Status');
    expect(screen.getByText('Delete Student')).toBeTruthy();
  });

  it('shows Login Credentials section', async () => {
    render(<StudentDetailPage />);
    expect(await screen.findByText('Login Credentials')).toBeInTheDocument();
  });
});
