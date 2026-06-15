import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../helpers/test-utils';

const mockGetStudent = vi.hoisted(() => vi.fn());
const mockPush = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
  useParams: () => ({ id: 's-1' }),
  usePathname: () => '/admin/students/s-1',
}));

vi.mock('@/lib/api', () => ({
  api: { getStudent: mockGetStudent, updateStudent: vi.fn().mockResolvedValue({ success: true }) },
  apiRequest: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/components/toast', () => ({ showToast: vi.fn() }));

const localStorageMock = (() => {
  let store: Record<string, string> = { token: 'test-jwt' };
  return { getItem: () => null, setItem: () => {}, removeItem: () => {}, clear: () => {} };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const mockData = {
  id: 's-1', name: 'Ali Hassan', rollNumber: '012', admissionNumber: 'MCS-2026-0042',
  dateOfBirth: '2014-01-15T00:00:00.000Z', gender: 'male', bloodGroup: 'B+',
  religion: 'Islam', nationality: 'Pakistani', phone: '+92 300', studentEmail: 'a@b.com',
  studentWhatsapp: '+92 300', address: 'Street 5', city: 'Islamabad', bformCnic: '12345',
  status: 'ACTIVE', profilePhotoId: null,
  group: { name: 'Class 5', section: 'A' },
  parents: [{ id: 'sp-1', relation: 'Father', isPrimary: true, parent: { id: 'p-1', userId: 'u-1', occupation: 'Business', employerName: 'Co', maritalStatus: 'Married', monthlyIncome: 'above_20k', phone: '+92', whatsapp: '+92', email: 'p@e.com', cnicNumber: '12345', user: { id: 'u-1', name: 'Mr. Parent', phone: '+92' } } }],
  emergencyContacts: [{ id: 'ec-1', name: 'Mother', relationship: 'Mother', phone: '+92 300', whatsapp: null }],
  healthRecord: { id: 'hr-1', bloodGroup: 'B+', hasChronicDisease: true, diseaseDetails: 'Asthma', allergies: 'Dust', disability: null, medicalNotes: 'Use inhaler', doctorName: 'Dr. A', doctorPhone: '+92' },
  enrollments: [],
};

import StudentDetailPage from '@/app/admin/students/[id]/page';

describe('StudentDetailPage — rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetStudent.mockResolvedValue({ success: true, data: mockData });
  });

  it('renders student name', async () => {
    render(<StudentDetailPage />);
    const names = await screen.findAllByText('Ali Hassan');
    expect(names.length).toBeGreaterThanOrEqual(1);
  });

  it('renders roll number', async () => {
    render(<StudentDetailPage />);
    expect(await screen.findByText('Roll No: 012')).toBeInTheDocument();
  });

  it('renders class badge', async () => {
    render(<StudentDetailPage />);
    const class5s = await screen.findAllByText('Class 5 — A');
    expect(class5s.length).toBeGreaterThanOrEqual(1);
  });

  it('renders status', async () => {
    render(<StudentDetailPage />);
    expect(await screen.findByText('ACTIVE')).toBeInTheDocument();
  });

  it('renders section headers', async () => {
    render(<StudentDetailPage />);
    expect(await screen.findByText('Student Information')).toBeInTheDocument();
    expect(await screen.findByText('Parent / Guardian')).toBeInTheDocument();
    expect(await screen.findByText('Emergency Contacts')).toBeInTheDocument();
    expect(await screen.findByText('Health & Medical')).toBeInTheDocument();
  });

  it('renders student info cards', async () => {
    render(<StudentDetailPage />);
    const bps = await screen.findAllByText('B+');
    expect(bps.length).toBeGreaterThanOrEqual(1);
    expect(await screen.findByText('Islam')).toBeInTheDocument();
    expect(await screen.findByText('Pakistani')).toBeInTheDocument();
  });

  it('renders parent info', async () => {
    render(<StudentDetailPage />);
    expect(await screen.findByText('Mr. Parent')).toBeInTheDocument();
    expect(await screen.findByText('Business')).toBeInTheDocument();
  });

  it('renders emergency contact', async () => {
    render(<StudentDetailPage />);
    const mothers = await screen.findAllByText('Mother');
    expect(mothers.length).toBeGreaterThanOrEqual(1);
  });

  it('renders health info', async () => {
    render(<StudentDetailPage />);
    expect(await screen.findByText('Asthma')).toBeInTheDocument();
    expect(await screen.findByText('Use inhaler')).toBeInTheDocument();
  });

  it('shows back button', async () => {
    render(<StudentDetailPage />);
    expect(await screen.findByText('Back to Students')).toBeInTheDocument();
  });

  it('shows edit button for student info', async () => {
    render(<StudentDetailPage />);
    const edits = await screen.findAllByText('Edit');
    expect(edits.length).toBeGreaterThanOrEqual(1);
  });

  it('shows loading skeleton', () => {
    mockGetStudent.mockImplementation(() => new Promise(() => {}));
    const { container } = render(<StudentDetailPage />);
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThanOrEqual(4);
  });

  it('shows error state when not found', async () => {
    mockGetStudent.mockRejectedValue(new Error('Student not found'));
    render(<StudentDetailPage />);
    expect(await screen.findByText('Student not found')).toBeInTheDocument();
  });
});
