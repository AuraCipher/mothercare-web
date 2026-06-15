import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../helpers/test-utils';

const mockGetStudents = vi.hoisted(() => vi.fn());
const mockGetSections = vi.hoisted(() => vi.fn());
const mockPush = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/admin/students',
}));

vi.mock('@/lib/api', () => ({
  api: {
    getStudents: mockGetStudents,
    getSections: mockGetSections,
  },
}));

const localStorageMock = (() => {
  let store: Record<string, string> = { token: 'test-jwt', activeBranchId: 'b-1', activeAYId: 'ay-1' };
  return { getItem: (key: string) => store[key] || null, setItem: (k: string, v: string) => { store[k] = v; }, removeItem: (k: string) => { delete store[k]; }, clear: () => { store = {}; } };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const mockStudents = [
  { id: 's-1', name: 'Ali Hassan', rollNumber: '012', admissionNumber: 'MCS-2026-0042', gender: 'male', status: 'ACTIVE', group: { name: 'Class 5', section: 'A' } },
  { id: 's-2', name: 'Fatima Ahmed', rollNumber: '008', admissionNumber: 'MCS-2026-0038', gender: 'female', status: 'ACTIVE', group: { name: 'Class 4', section: 'B' } },
  { id: 's-3', name: 'Usman Khan', rollNumber: null, admissionNumber: 'MCS-2026-0045', gender: 'male', status: 'ACTIVE', group: null },
];

import StudentsPage from '@/app/admin/students/page';

describe('StudentsPage — loading & empty', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetStudents.mockResolvedValue({ success: true, data: mockStudents, meta: { total: 3 } });
    mockGetSections.mockResolvedValue({ success: true, data: [{ id: 'g-1', name: 'Class 5', section: 'A' }] });
  });

  it('renders title and add button', async () => {
    render(<StudentsPage />);
    expect(await screen.findByText('Students')).toBeInTheDocument();
    expect(await screen.findByText('Add Student')).toBeInTheDocument();
  });

  it('renders student cards', async () => {
    render(<StudentsPage />);
    expect(await screen.findByText('Ali Hassan')).toBeInTheDocument();
    expect(await screen.findByText('Fatima Ahmed')).toBeInTheDocument();
    expect(await screen.findByText('Usman Khan')).toBeInTheDocument();
  });

  it('shows empty state when no students', async () => {
    mockGetStudents.mockResolvedValue({ success: true, data: [], meta: { total: 0 } });
    render(<StudentsPage />);
    expect(await screen.findByText('No students found.')).toBeInTheDocument();
  });

  it('shows loading skeleton', () => {
    mockGetStudents.mockImplementation(() => new Promise(() => {}));
    const { container } = render(<StudentsPage />);
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThanOrEqual(1);
  });
});

describe('StudentsPage — filters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetStudents.mockResolvedValue({ success: true, data: mockStudents, meta: { total: 3 } });
    mockGetSections.mockResolvedValue({ success: true, data: [{ id: 'g-1', name: 'Class 5', section: 'A' }, { id: 'g-2', name: 'Class 4', section: 'B' }] });
  });

  it('shows class filter dropdown', async () => {
    render(<StudentsPage />);
    expect(await screen.findByText('All Classes')).toBeInTheDocument();
    const class5s = await screen.findAllByText('Class 5 — A');
    expect(class5s.length).toBeGreaterThanOrEqual(1);
  });

  it('shows roll number filter input', async () => {
    render(<StudentsPage />);
    expect(await screen.findByPlaceholderText('Roll no.')).toBeInTheDocument();
  });

  it('shows Filter button', async () => {
    render(<StudentsPage />);
    expect(await screen.findByText('Filter')).toBeInTheDocument();
  });

  it('shows search input', async () => {
    render(<StudentsPage />);
    expect(await screen.findByPlaceholderText(/Search by name/)).toBeInTheDocument();
  });
});

describe('StudentsPage — navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetStudents.mockResolvedValue({ success: true, data: mockStudents, meta: { total: 3 } });
    mockGetSections.mockResolvedValue({ success: true, data: [] });
  });

  it('clicking a card navigates to detail page', async () => {
    render(<StudentsPage />);
    const card = await screen.findByText('Ali Hassan');
    fireEvent.click(card);
    expect(mockPush).toHaveBeenCalledWith('/admin/students/s-1');
  });

  it('clicking Add Student navigates to new page', async () => {
    render(<StudentsPage />);
    fireEvent.click(await screen.findByText('Add Student'));
    expect(mockPush).toHaveBeenCalledWith('/admin/students/new');
  });

  it('shows admission numbers on cards', async () => {
    render(<StudentsPage />);
    expect(await screen.findByText('MCS-2026-0042')).toBeInTheDocument();
    expect(await screen.findByText('MCS-2026-0045')).toBeInTheDocument();
  });

  it('shows roll number when present', async () => {
    render(<StudentsPage />);
    expect(await screen.findByText('Roll: 012')).toBeInTheDocument();
    expect(await screen.findByText('Roll: 008')).toBeInTheDocument();
  });
});
