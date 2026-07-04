/**
 * Fee Payments — Advanced Payment Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../helpers/test-utils';

// Use relative paths instead of @ alias to avoid vitest resolution issues
import CollectionsPage from '../../app/admin/fees/collections/page';
import GenerateFeesPage from '../../app/admin/fees/generate/page';
import FeeReportsPage from '../../app/admin/fees/reports/page';
import FamilyPayRedirectPage from '../../app/admin/fees/collections/family-pay/page';
import FeeHeadsPage from '../../app/admin/fees/heads/page';

const mockReplace = vi.hoisted(() => vi.fn());

const mockShowToast = vi.hoisted(() => vi.fn());
vi.mock('@/components/toast', () => ({ showToast: mockShowToast }));

vi.mock('lucide-react', () => ({
  ArrowLeft: 'div', ArrowRight: 'div', Printer: 'div', Save: 'div', Plus: 'div',
  ChevronDown: 'div', ChevronRight: 'div', Trash2: 'div', Download: 'div', Search: 'div',
  DollarSign: 'div', Users: 'div', FileText: 'div', Calendar: 'div', RefreshCw: 'div',
  CheckCircle: 'div', BarChart: 'div', Edit3: 'div', X: 'div',
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), replace: mockReplace }),
  useParams: () => ({ id: 's-1' }),
  usePathname: () => '/admin/fees',
  useSearchParams: () => new URLSearchParams(),
}));

let lsStore: Record<string, string> = {};
function setupLS() {
  lsStore = { token: 'test-jwt', activeBranchId: 'b-1', activeAYId: 'ay-1', collectionsPeriod: 'monthly' };
  try { Object.defineProperty(window, 'localStorage', { value: { getItem: (k: string) => lsStore[k] || null, setItem: (k: string, v: string) => { lsStore[k] = v; }, removeItem: (k: string) => { delete lsStore[k]; }, clear: () => { lsStore = {}; } } }); } catch {}
}

const mockFetch = (d: any) => vi.fn(() => Promise.resolve({ json: () => Promise.resolve(d) } as any));

// COLLECTIONS
describe('Collections — Advanced', () => {
  beforeEach(() => { vi.clearAllMocks(); setupLS(); });
  it('shows Monthly/Full AY toggles', async () => {
    global.fetch = mockFetch({ success: true, data: [] }); render(<CollectionsPage />);
    expect(await screen.findByText('Monthly')).toBeInTheDocument();
    expect(await screen.findByText('Full AY')).toBeInTheDocument();
  });
  it('shows Class-wise toggle', async () => {
    global.fetch = mockFetch({ success: true, data: [] }); render(<CollectionsPage />);
    expect(await screen.findByText('Class-wise')).toBeInTheDocument();
    expect(await screen.findByText('Alphabetical')).toBeInTheDocument();
  });
  it('monthly empty state shows generate prompt', async () => {
    global.fetch = mockFetch({ success: true, data: [] });
    render(<CollectionsPage />);
    expect(await screen.findByText(/No fees generated for/)).toBeInTheDocument();
    expect(await screen.findByText('Generate Now')).toBeInTheDocument();
  });
  it('monthly does not show ungenerated students', async () => {
    global.fetch = mockFetch({ success: true, data: [
      { student: { id: 's1', name: 'Ahmed', group: { name: 'Class 2' }, parents: [] }, netAmount: 500000, paidAmount: 0, status: 'UNPAID', fee: { id: 'sf1' } },
    ] });
    render(<CollectionsPage />);
    expect(await screen.findByText('Ahmed')).toBeInTheDocument();
    expect(screen.queryByText('Not generated')).not.toBeInTheDocument();
  });
  it('monthly request includes academicYearId', async () => {
    const urls: string[] = [];
    global.fetch = vi.fn((url: string) => {
      urls.push(url);
      return Promise.resolve({ json: () => Promise.resolve({ success: true, data: [] }) } as any);
    });
    render(<CollectionsPage />);
    await waitFor(() => expect(urls.some(u => u.includes('academicYearId=ay-1'))).toBe(true));
    expect(urls.some(u => u.includes('period=monthly'))).toBe(true);
  });
  it('shows due for PARTIAL', async () => {
    global.fetch = mockFetch({ success: true, data: [{ student: { id: 's1', name: 'Ahmed', group: { name: 'Class 5' }, parents: [] }, netAmount: 500000, paidAmount: 200000, status: 'PARTIAL', fee: { id: 'sf1' } }] }); render(<CollectionsPage />);
    const matches = await screen.findAllByText('3,000');
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });
  it('shows PAID badge', async () => {
    global.fetch = mockFetch({ success: true, data: [{ student: { id: 's1', name: 'Ahmed', group: { name: 'Class 5' }, parents: [] }, netAmount: 500000, paidAmount: 500000, status: 'PAID' }] }); render(<CollectionsPage />);
    expect(await screen.findByText('PAID')).toBeInTheDocument();
  });
  it('shows UNPAID badge', async () => {
    global.fetch = mockFetch({ success: true, data: [{ student: { id: 's1', name: 'Ahmed', group: { name: 'Class 5' }, parents: [] }, netAmount: 500000, paidAmount: 0, status: 'UNPAID' }] }); render(<CollectionsPage />);
    expect(await screen.findByText('UNPAID')).toBeInTheDocument();
  });
  it('shows empty state for full AY', async () => {
    global.fetch = mockFetch({ success: true, data: [] }); render(<CollectionsPage />);
    fireEvent.click(await screen.findByText('Full AY'));
    expect(await screen.findByText('No students found')).toBeInTheDocument();
  });
  it('shows Pay button', async () => {
    global.fetch = mockFetch({ success: true, data: [{ student: { id: 's1', name: 'Ahmed', group: { name: 'Class 5' }, parents: [] }, netAmount: 500000, paidAmount: 0, status: 'UNPAID' }] }); render(<CollectionsPage />);
    const btns = await screen.findAllByText('Pay'); expect(btns.length).toBeGreaterThanOrEqual(1);
  });
  it('shows Roll no filter', async () => {
    global.fetch = mockFetch({ success: true, data: [] }); render(<CollectionsPage />);
    expect(await screen.findByPlaceholderText('Roll no')).toBeInTheDocument();
  });
});

const mockHeads = [
  { id: 'fh1', name: 'Tuition', category: 'MONTHLY', isActive: true },
  { id: 'fh2', name: 'Transport', category: 'MONTHLY', isActive: true },
  { id: 'fh3', name: 'Lab Fee', category: 'TERM', isActive: true },
  { id: 'fh4', name: 'Annual Charges', category: 'ANNUAL', isActive: true },
  { id: 'fh5', name: 'Admission Fee', category: 'ONE_TIME', isActive: true },
];

const mockSections = [
  { id: 'g1', name: 'Class 1', section: null, displayOrder: 1 },
  { id: 'g2', name: 'Class 2', section: 'A', displayOrder: 2 },
  { id: 'g3', name: 'Class 2', section: 'B', displayOrder: 2 },
];

function mockGenerateFetch(opts?: { onGenerate?: (body: any) => void }) {
  return vi.fn((url: string, init?: RequestInit) => {
    if (url.includes('fee-heads')) return Promise.resolve({ json: () => Promise.resolve({ success: true, data: mockHeads }) });
    if (url.includes('/sections')) return Promise.resolve({ json: () => Promise.resolve({ success: true, data: mockSections }) });
    if (url.includes('student-fees/generate')) {
      let mode = 'generate';
      if (init?.body) {
        const body = JSON.parse(init.body as string);
        mode = body.mode || 'generate';
        opts?.onGenerate?.(body);
      }
      return Promise.resolve({ json: () => Promise.resolve({ success: true, data: { generated: 345, skipped: 0, total: 345, mode } }) });
    }
    return Promise.resolve({ json: () => Promise.resolve({ success: true, data: [] }) });
  });
}

// GENERATE
describe('GenerateFees', () => {
  beforeEach(() => { vi.clearAllMocks(); setupLS(); global.fetch = mockGenerateFetch(); });
  it('shows checkboxes for each fee head', async () => { render(<GenerateFeesPage />); await screen.findByText('Tuition'); const headCbs = screen.getAllByRole('checkbox').filter(cb => mockHeads.some(h => (cb.closest('label')?.textContent || '').includes(h.name))); expect(headCbs.length).toBe(mockHeads.length); });
  it('all heads checked by default', async () => { render(<GenerateFeesPage />); await screen.findByText('Tuition'); const headCbs = screen.getAllByRole('checkbox').filter(cb => mockHeads.some(h => (cb.closest('label')?.textContent || '').includes(h.name))); headCbs.forEach(cb => expect(cb).toBeChecked()); });
  it('keeps one head checked', async () => { render(<GenerateFeesPage />); await screen.findByText('Tuition'); const headCbs = screen.getAllByRole('checkbox').filter(cb => mockHeads.some(h => (cb.closest('label')?.textContent || '').includes(h.name))); headCbs.forEach(cb => fireEvent.click(cb)); const checked = headCbs.filter(cb => (cb as HTMLInputElement).checked); expect(checked.length).toBe(1); });
  it('shows result', async () => {
    global.fetch = mockGenerateFetch();
    render(<GenerateFeesPage />);
    fireEvent.click(await screen.findByText('Generate')); expect(await screen.findByText('345')).toBeInTheDocument();
  });
  it('posts groupIds for selected sections only', async () => {
    let body: any = null;
    global.fetch = mockGenerateFetch({ onGenerate: (b) => { body = b; } });
    render(<GenerateFeesPage />);
    fireEvent.click(await screen.findByText('Classes to Include'));
    await screen.findByText('Class 2');
    fireEvent.click(screen.getByText('Class 2').closest('label')!.querySelector('input')!);
    fireEvent.click(await screen.findByText('Generate'));
    await waitFor(() => expect(body).not.toBeNull());
    expect(body.groupIds).toEqual(['g1']);
    expect(body.groupIds).not.toContain('g2');
    expect(body.groupIds).not.toContain('g3');
  });
  it('posts academicYearId from localStorage', async () => {
    let body: any = null;
    global.fetch = mockGenerateFetch({ onGenerate: (b) => { body = b; } });
    render(<GenerateFeesPage />);
    fireEvent.click(await screen.findByText('Generate'));
    await waitFor(() => expect(body).not.toBeNull());
    expect(body.academicYearId).toBe('ay-1');
  });
  it('classes panel collapsed by default', async () => {
    render(<GenerateFeesPage />);
    expect(await screen.findByText(/All 3 selected|3 selected/)).toBeInTheDocument();
    expect(screen.queryByText('Class 1')).not.toBeInTheDocument();
  });
});

// LEGACY FAMILY-PAY REDIRECT
describe('FamilyPayRedirect — legacy route', () => {
  beforeEach(() => { vi.clearAllMocks(); mockReplace.mockClear(); setupLS(); });

  it('redirects to families hub', async () => {
    render(<FamilyPayRedirectPage />);
    expect(await screen.findByText(/Redirecting to Families/)).toBeInTheDocument();
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/admin/fees/families');
    });
  });
});

describe('FeeReports', () => {
  beforeEach(() => { vi.clearAllMocks(); setupLS(); });
  it('shows tabs', async () => {
    global.fetch = mockFetch({ success: true, data: {} }); render(<FeeReportsPage />);
    expect(await screen.findByText('Summary')).toBeInTheDocument();
    expect(await screen.findByText('Defaulters')).toBeInTheDocument();
    expect(await screen.findByText('By Class')).toBeInTheDocument();
  });
  it('shows stats', async () => {
    global.fetch = mockFetch({ success: true, data: { totalDue: 50000000, totalCollected: 30000000, pendingCount: 45, collectionRate: 60 } }); render(<FeeReportsPage />);
    expect(await screen.findByText('500,000')).toBeInTheDocument();
  });
});

// FEE HEADS ERRORS
describe('FeeHeads — Errors', () => {
  beforeEach(() => { vi.clearAllMocks(); setupLS(); });
  it('handles network error', async () => { global.fetch = vi.fn(() => Promise.reject(new Error('x'))); render(<FeeHeadsPage />); expect(await screen.findByText('Fee Heads')).toBeInTheDocument(); });
});

// STUDENT DETAIL (dynamic import due to [id] path)
describe('StudentFeeDetail', () => {
  beforeEach(() => { vi.clearAllMocks(); setupLS(); });
  it('shows loading', async () => {
    global.fetch = () => new Promise<any>(() => {}); const { default: Pg } = await import('@/app/admin/fees/student/[id]/page'); render(<Pg />);
    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });
  it('shows Fee History', async () => {
    global.fetch = mockFetch({ success: true, data: { id: 's1', name: 'Ahmed', group: { name: 'Class 5' }, parents: [], studentFees: [{ id: 'sf1', netAmount: 500000, paidAmount: 0, month: 6, year: 2026, status: 'UNPAID', payments: [], extraItems: [] }] } }); const { default: Pg } = await import('@/app/admin/fees/student/[id]/page'); render(<Pg />);
    expect(await screen.findByText('Fee History')).toBeInTheDocument();
  });
  it('shows Add Extra Due', async () => {
    global.fetch = mockFetch({ success: true, data: { id: 's1', name: 'Ahmed', group: { name: 'Class 5' }, parents: [], studentFees: [] } }); const { default: Pg } = await import('@/app/admin/fees/student/[id]/page'); render(<Pg />);
    expect(await screen.findByText('Add Extra Due')).toBeInTheDocument();
  });
  it('shows Pay Now', async () => {
    global.fetch = mockFetch({ success: true, data: { id: 's1', name: 'Ahmed', group: { name: 'Class 5' }, parents: [], studentFees: [{ id: 'sf1', netAmount: 500000, paidAmount: 0, month: 6, year: 2026, status: 'UNPAID', payments: [], extraItems: [] }] } }); const { default: Pg } = await import('@/app/admin/fees/student/[id]/page'); render(<Pg />);
    expect(await screen.findByText('Pay Now')).toBeInTheDocument();
  });
});
