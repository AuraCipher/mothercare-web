import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../helpers/test-utils';

const mockCreateStudent = vi.hoisted(() => vi.fn());
const mockGetSections = vi.hoisted(() => vi.fn());
const mockPush = vi.hoisted(() => vi.fn());
const mockShowToast = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/admin/students/new',
}));

vi.mock('@/lib/api', () => ({
  api: { createStudent: mockCreateStudent, getSections: mockGetSections },
}));

vi.mock('@/components/toast', () => ({ showToast: mockShowToast }));

const localStorageMock = (() => {
  const store: Record<string, string> = { token: 'test-jwt', activeBranchId: 'b-1', activeAYId: 'ay-1' };
  return { getItem: (key: string) => store[key] || null, setItem: () => {}, removeItem: () => {}, clear: () => {} };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

import NewStudentPage from '@/app/admin/students/new/page';

describe('NewStudentPage — rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSections.mockResolvedValue({ success: true, data: [{ id: 'g-1', name: 'Class 5', section: 'A' }] });
    mockCreateStudent.mockResolvedValue({ success: true, data: { id: 's-1' } });
  });

  it('renders page title', async () => {
    render(<NewStudentPage />);
    expect(await screen.findByText('Add New Student')).toBeInTheDocument();
  });

  it('shows back button', async () => {
    render(<NewStudentPage />);
    expect(await screen.findByText('Back to Students')).toBeInTheDocument();
  });

  it('shows all section headers', async () => {
    render(<NewStudentPage />);
    expect(await screen.findByText('Student Identity')).toBeInTheDocument();
    expect(await screen.findByText('Parent / Guardian')).toBeInTheDocument();
    const addresses = await screen.findAllByText('Address');
    expect(addresses.length).toBeGreaterThanOrEqual(1);
    expect(await screen.findByText('Previous Education')).toBeInTheDocument();
    expect(await screen.findByText('Class Assignment')).toBeInTheDocument();
  });

  it('shows required name field', async () => {
    render(<NewStudentPage />);
    expect(await screen.findByText('Full Name *')).toBeInTheDocument();
  });

  it('shows gender select', async () => {
    render(<NewStudentPage />);
    expect(await screen.findByText('Gender')).toBeInTheDocument();
  });

  it('shows class section dropdown', async () => {
    render(<NewStudentPage />);
    expect(await screen.findByText('Class / Section *')).toBeInTheDocument();
  });

  it('shows guardian name field', async () => {
    render(<NewStudentPage />);
    expect(await screen.findByText('Guardian Name *')).toBeInTheDocument();
  });

  it('shows guardian phone field', async () => {
    render(<NewStudentPage />);
    expect(await screen.findByText('Guardian Phone')).toBeInTheDocument();
  });

  it('shows country field', async () => {
    render(<NewStudentPage />);
    expect(await screen.findByPlaceholderText('e.g. Pakistan')).toBeInTheDocument();
  });

  it('shows create button', async () => {
    render(<NewStudentPage />);
    expect(await screen.findByText('Create Student')).toBeInTheDocument();
  });

  it('shows cancel button', async () => {
    render(<NewStudentPage />);
    expect(await screen.findByText('Cancel')).toBeInTheDocument();
  });
});

describe('NewStudentPage — validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSections.mockResolvedValue({ success: true, data: [{ id: 'g-1', name: 'Class 5', section: 'A' }] });
  });

  it('shows toast when name is empty on submit', async () => {
    render(<NewStudentPage />);
    fireEvent.click(await screen.findByText('Create Student'));
    expect(mockShowToast).toHaveBeenCalledWith('error', 'Student name is required');
  });

  it('calls createStudent on valid submit', async () => {
    mockCreateStudent.mockResolvedValue({ success: true, data: { id: 's-1' } });
    render(<NewStudentPage />);
    const nameInput = await screen.findByPlaceholderText('e.g. Ali Hassan');
    fireEvent.change(nameInput, { target: { value: 'Test Student' } });
    const classOption = await screen.findByRole('option', { name: 'Class 5 — A' });
    const classSelect = classOption.parentElement as HTMLSelectElement;
    fireEvent.change(classSelect, { target: { value: 'g-1' } });
    fireEvent.click(screen.getByText('Create Student'));
    await waitFor(() => {
      expect(mockCreateStudent).toHaveBeenCalled();
    });
  });

  it('navigates to detail page after creation', async () => {
    mockCreateStudent.mockResolvedValue({ success: true, data: { id: 's-1' } });
    render(<NewStudentPage />);
    const nameInput = await screen.findByPlaceholderText('e.g. Ali Hassan');
    fireEvent.change(nameInput, { target: { value: 'Test Student' } });
    const classOption = await screen.findByRole('option', { name: 'Class 5 — A' });
    const classSelect = classOption.parentElement as HTMLSelectElement;
    fireEvent.change(classSelect, { target: { value: 'g-1' } });
    fireEvent.click(screen.getByText('Create Student'));
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin/students/s-1');
    });
  });

  it('shows error toast on failed creation', async () => {
    mockCreateStudent.mockRejectedValue(new Error('Server error'));
    render(<NewStudentPage />);
    const nameInput = await screen.findByPlaceholderText('e.g. Ali Hassan');
    fireEvent.change(nameInput, { target: { value: 'Test Student' } });
    const classOption = await screen.findByRole('option', { name: 'Class 5 — A' });
    const classSelect = classOption.parentElement as HTMLSelectElement;
    fireEvent.change(classSelect, { target: { value: 'g-1' } });
    fireEvent.click(screen.getByText('Create Student'));
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('error', 'Server error');
    });
  });
});
