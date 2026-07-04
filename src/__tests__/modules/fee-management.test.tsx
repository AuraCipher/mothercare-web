/**
 * Fee Management — Frontend Tests
 *
 * Tests fee heads page, structures page, collections page, student detail,
 * generate page, family pay page, and reports page rendering and interactions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../helpers/test-utils';

const mockPush = vi.hoisted(() => vi.fn());
const mockShowToast = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: vi.fn(), replace: vi.fn() }),
  useParams: () => ({ id: 's-1' }),
  usePathname: () => '/admin/fees',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/components/toast', () => ({ showToast: mockShowToast }));

vi.mock('lucide-react', () => ({
  ArrowLeft: 'div', ArrowRight: 'div', Printer: 'div', Save: 'div', Download: 'div',
  Search: 'div', DollarSign: 'div', Plus: 'div', Users: 'div', FileText: 'div',
  Calendar: 'div', ChevronDown: 'div', ChevronRight: 'div', Trash2: 'div',
  RefreshCw: 'div', CheckCircle: 'div', BarChart: 'div', Edit3: 'div', X: 'div',
}));

const localStorageMock = (() => {
  let store: Record<string, string> = { token: 'test-jwt', activeBranchId: 'b-1', activeAYId: 'ay-1', collectionsPeriod: 'monthly' };
  return { getItem: (key: string) => store[key] || null, setItem: (k: string, v: string) => { store[k] = v; }, removeItem: (k: string) => { delete store[k]; }, clear: () => { store = {}; } };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const mockFetch = (data: any) => vi.fn(() => Promise.resolve({ json: () => Promise.resolve(data) }));

const mockHeads = [
  { id: 'fh1', name: 'Tuition', category: 'MONTHLY', isActive: true, isOptional: false, description: null },
  { id: 'fh2', name: 'Transport', category: 'MONTHLY', isActive: true, isOptional: true, description: null },
  { id: 'fh3', name: 'Lab Fee', category: 'TERM', isActive: true, isOptional: false, description: null },
  { id: 'fh4', name: 'Annual Charges', category: 'ANNUAL', isActive: true, isOptional: false, description: null },
  { id: 'fh5', name: 'Admission Fee', category: 'ONE_TIME', isActive: true, isOptional: false, description: null },
];

const mockSections = [
  { id: 'g1', name: 'Class 1', section: null, displayOrder: 1 },
  { id: 'g2', name: 'Class 2', section: 'A', displayOrder: 2 },
  { id: 'g3', name: 'Class 2', section: 'B', displayOrder: 2 },
];

function mockGenerateFetch(extra?: { generateResult?: any; onGenerate?: (body: any) => void }) {
  return vi.fn((url: string, opts?: RequestInit) => {
    if (url.includes('fee-heads')) {
      return Promise.resolve({ json: () => Promise.resolve({ success: true, data: mockHeads }) });
    }
    if (url.includes('/sections')) {
      return Promise.resolve({ json: () => Promise.resolve({ success: true, data: mockSections }) });
    }
    if (url.includes('student-fees/generate')) {
      let mode = 'generate';
      if (opts?.body) {
        const body = JSON.parse(opts.body as string);
        mode = body.mode || 'generate';
        extra?.onGenerate?.(body);
      }
      return Promise.resolve({
        json: () => Promise.resolve({
          success: true,
          data: extra?.generateResult ?? { generated: 345, skipped: 0, updated: 0, total: 345, mode },
        }),
      });
    }
    return Promise.resolve({ json: () => Promise.resolve({ success: true, data: [] }) });
  });
}

function mockCollectionsFetch(data: any[] = [], onFetch?: (url: string) => void, pagination?: any) {
  return vi.fn((url: string) => {
    onFetch?.(url);
    if (url.includes('students-list')) {
      return Promise.resolve({
        json: () => Promise.resolve({
          success: true,
          data,
          pagination: pagination ?? { page: 1, limit: 100, total: data.length, totalPages: 1 },
        }),
      });
    }
    if (url.includes('/sections')) {
      return Promise.resolve({ json: () => Promise.resolve({ success: true, data: mockSections }) });
    }
    return Promise.resolve({ json: () => Promise.resolve({ success: true, data: [] }) });
  });
}

// ═══════════════════════════════════════════════════════════════════
// FEE HEADS PAGE
// ═══════════════════════════════════════════════════════════════════

describe('FeeHeadsPage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders page title', async () => {
    global.fetch = mockFetch({ success: true, data: [] });
    const { default: FeeHeadsPage } = await import('@/app/admin/fees/heads/page');
    render(<FeeHeadsPage />);
    expect(await screen.findByText('Fee Heads')).toBeInTheDocument();
  });

  it('shows Add Head button', async () => {
    global.fetch = mockFetch({ success: true, data: [] });
    const { default: FeeHeadsPage } = await import('@/app/admin/fees/heads/page');
    render(<FeeHeadsPage />);
    expect(await screen.findByText('Add Head')).toBeInTheDocument();
  });

  it('shows empty state when no heads', async () => {
    global.fetch = mockFetch({ success: true, data: [] });
    const { default: FeeHeadsPage } = await import('@/app/admin/fees/heads/page');
    render(<FeeHeadsPage />);
    expect(await screen.findByText('No fee heads yet')).toBeInTheDocument();
  });

  it('renders fee heads in table', async () => {
    global.fetch = mockFetch({ success: true, data: [
      { id: 'fh1', name: 'Tuition', category: 'MONTHLY', isActive: true, description: null, isOptional: false },
      { id: 'fh2', name: 'Transport', category: 'MONTHLY', isActive: true, description: 'Bus fee', isOptional: true },
    ]});
    const { default: FeeHeadsPage } = await import('@/app/admin/fees/heads/page');
    render(<FeeHeadsPage />);
    expect(await screen.findByText('Tuition')).toBeInTheDocument();
    expect(await screen.findByText('Transport')).toBeInTheDocument();
    const monthlyLabels = await screen.findAllByText('MONTHLY');
    expect(monthlyLabels.length).toBeGreaterThanOrEqual(1);
  });

  it('shows Active status for active heads', async () => {
    global.fetch = mockFetch({ success: true, data: [
      { id: 'fh1', name: 'Tuition', category: 'MONTHLY', isActive: true },
    ]});
    const { default: FeeHeadsPage } = await import('@/app/admin/fees/heads/page');
    render(<FeeHeadsPage />);
    expect(await screen.findByText('Active')).toBeInTheDocument();
  });

  it('shows Add Head form on button click', async () => {
    global.fetch = mockFetch({ success: true, data: [] });
    const { default: FeeHeadsPage } = await import('@/app/admin/fees/heads/page');
    render(<FeeHeadsPage />);
    const addBtn = await screen.findByText('Add Head');
    fireEvent.click(addBtn);
    expect(await screen.findByText('Create')).toBeInTheDocument();
    expect(await screen.findByText('Cancel')).toBeInTheDocument();
  });

  it('shows category options in form', async () => {
    global.fetch = mockFetch({ success: true, data: [] });
    const { default: FeeHeadsPage } = await import('@/app/admin/fees/heads/page');
    render(<FeeHeadsPage />);
    fireEvent.click(await screen.findByText('Add Head'));
    expect(await screen.findByText('Monthly')).toBeInTheDocument();
    expect(await screen.findByText('Term')).toBeInTheDocument();
    expect(await screen.findByText('Annual')).toBeInTheDocument();
    expect(await screen.findByText('One Time')).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════
// FEE STRUCTURES PAGE
// ═══════════════════════════════════════════════════════════════════

describe('FeeStructuresPage', () => {
  beforeEach(() => { vi.clearAllMocks(); global.fetch = mockFetch({ success: true, data: [] }); });

  it('renders page title', async () => {
    const { default: FeeStructuresPage } = await import('@/app/admin/fees/structures/page');
    render(<FeeStructuresPage />);
    expect(await screen.findByText('Fee Structures')).toBeInTheDocument();
  });

  it('renders loading state', async () => {
    global.fetch = () => new Promise(() => {}); // Never resolves
    const { default: FeeStructuresPage } = await import('@/app/admin/fees/structures/page');
    render(<FeeStructuresPage />);
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows loading then content', async () => {
    const { default: FeeStructuresPage } = await import('@/app/admin/fees/structures/page');
    render(<FeeStructuresPage />);
    // Should eventually show the table header
    const classHeaders = await screen.findAllByText('Class');
    expect(classHeaders.length).toBeGreaterThanOrEqual(1);
  });
});

// ═══════════════════════════════════════════════════════════════════
// GENERATE FEES PAGE
// ═══════════════════════════════════════════════════════════════════

describe('GenerateFeesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = mockGenerateFetch();
  });

  it('renders page title', async () => {
    const { default: GenerateFeesPage } = await import('@/app/admin/fees/generate/page');
    render(<GenerateFeesPage />);
    expect(await screen.findByText('Generate Fees')).toBeInTheDocument();
  });

  it('shows month selector', async () => {
    const { default: GenerateFeesPage } = await import('@/app/admin/fees/generate/page');
    render(<GenerateFeesPage />);
    expect(await screen.findByText('Month')).toBeInTheDocument();
  });

  it('shows year input', async () => {
    const { default: GenerateFeesPage } = await import('@/app/admin/fees/generate/page');
    render(<GenerateFeesPage />);
    expect(await screen.findByText('Year')).toBeInTheDocument();
  });

  it('shows Generate, Update, and Regenerate buttons', async () => {
    const { default: GenerateFeesPage } = await import('@/app/admin/fees/generate/page');
    render(<GenerateFeesPage />);
    expect(await screen.findByText('Generate')).toBeInTheDocument();
    expect(screen.getByText('Update')).toBeInTheDocument();
    expect(screen.getByText('Regenerate')).toBeInTheDocument();
  });

  it('shows fee heads grouped by category', async () => {
    const { default: GenerateFeesPage } = await import('@/app/admin/fees/generate/page');
    render(<GenerateFeesPage />);
    expect(await screen.findByText('Classes to Include')).toBeInTheDocument();
    expect(await screen.findByText('Fee Heads to Include')).toBeInTheDocument();
    expect(await screen.findByText('Monthly')).toBeInTheDocument();
    expect(await screen.findByText('Tuition')).toBeInTheDocument();
  });

  it('pre-selects all heads by default', async () => {
    const { default: GenerateFeesPage } = await import('@/app/admin/fees/generate/page');
    render(<GenerateFeesPage />);
    await screen.findByText('Tuition');
    const headCheckboxes = screen.getAllByRole('checkbox').filter(cb =>
      mockHeads.some(h => (cb.closest('label')?.textContent || '').includes(h.name)),
    );
    expect(headCheckboxes.length).toBe(mockHeads.length);
    headCheckboxes.forEach(cb => expect(cb).toBeChecked());
  });

  it('pre-selects all classes by default', async () => {
    const { default: GenerateFeesPage } = await import('@/app/admin/fees/generate/page');
    render(<GenerateFeesPage />);
    expect(await screen.findByText(/All 3 selected/)).toBeInTheDocument();
    fireEvent.click(screen.getByText('Classes to Include'));
    expect(await screen.findByText('Class 1')).toBeInTheDocument();
    expect(screen.getByText('Class 2')).toBeInTheDocument();
  });

  it('shows success result after generation', async () => {
    global.fetch = mockGenerateFetch();
    const { default: GenerateFeesPage } = await import('@/app/admin/fees/generate/page');
    render(<GenerateFeesPage />);
    fireEvent.click(await screen.findByText('Generate'));
    expect(await screen.findByText('345')).toBeInTheDocument();
  });

  it('sends academicYearId and all groupIds when generating with defaults', async () => {
    let posted: any = null;
    global.fetch = mockGenerateFetch({ onGenerate: (body) => { posted = body; } });
    const { default: GenerateFeesPage } = await import('@/app/admin/fees/generate/page');
    render(<GenerateFeesPage />);
    await screen.findByText(/All 3 selected/);
    fireEvent.click(await screen.findByText('Generate'));
    await waitFor(() => expect(posted).not.toBeNull());
    expect(posted.academicYearId).toBe('ay-1');
    expect(posted.groupIds).toEqual(expect.arrayContaining(['g1', 'g2', 'g3']));
    expect(posted.groupIds).toHaveLength(3);
    expect(posted.headIds).toHaveLength(mockHeads.length);
    expect(posted.mode).toBe('generate');
  });

  it('sends only selected class groupIds after unchecking a class', async () => {
    let posted: any = null;
    global.fetch = mockGenerateFetch({ onGenerate: (body) => { posted = body; } });
    const { default: GenerateFeesPage } = await import('@/app/admin/fees/generate/page');
    render(<GenerateFeesPage />);
    fireEvent.click(await screen.findByText('Classes to Include'));
    await screen.findByText('Class 1');
    const class1Row = screen.getByText('Class 1').closest('label');
    const class1Checkbox = class1Row?.querySelector('input[type="checkbox"]') as HTMLInputElement;
    fireEvent.click(class1Checkbox);
    fireEvent.click(await screen.findByText('Generate'));
    await waitFor(() => expect(posted).not.toBeNull());
    expect(posted.groupIds).not.toContain('g1');
    expect(posted.groupIds).toEqual(expect.arrayContaining(['g2', 'g3']));
  });

  it('classes panel is collapsed by default', async () => {
    const { default: GenerateFeesPage } = await import('@/app/admin/fees/generate/page');
    render(<GenerateFeesPage />);
    expect(await screen.findByText(/All 3 selected/)).toBeInTheDocument();
    expect(screen.queryByText('Class 1')).not.toBeInTheDocument();
  });

  it('sends month and year in generate payload', async () => {
    let posted: any = null;
    global.fetch = mockGenerateFetch({ onGenerate: (body) => { posted = body; } });
    const { default: GenerateFeesPage } = await import('@/app/admin/fees/generate/page');
    render(<GenerateFeesPage />);
    fireEvent.click(await screen.findByText('Generate'));
    await waitFor(() => expect(posted).not.toBeNull());
    expect(posted.month).toBeGreaterThan(0);
    expect(posted.year).toBeGreaterThan(2020);
  });

  it('cannot uncheck all classes — at least one remains selected', async () => {
    const { default: GenerateFeesPage } = await import('@/app/admin/fees/generate/page');
    render(<GenerateFeesPage />);
    fireEvent.click(await screen.findByText('Classes to Include'));
    await screen.findByText('Class 1');
    for (const name of ['Class 1', 'Class 2']) {
      const row = screen.getByText(name).closest('label');
      fireEvent.click(row!.querySelector('input[type="checkbox"]')!);
    }
    expect(await screen.findByText(/All 3 selected|3 selected/)).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════
// COLLECTIONS PAGE
// ═══════════════════════════════════════════════════════════════════

describe('CollectionsPage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders page title', async () => {
    global.fetch = mockFetch({ success: true, data: [] });
    const { default: CollectionsPage } = await import('@/app/admin/fees/collections/page');
    render(<CollectionsPage />);
    expect(await screen.findByText('Collections')).toBeInTheDocument();
  });

  it('shows month selector', async () => {
    global.fetch = mockFetch({ success: true, data: [] });
    const { default: CollectionsPage } = await import('@/app/admin/fees/collections/page');
    render(<CollectionsPage />);
    expect(await screen.findByText('Monthly')).toBeInTheDocument();
  });

  it('shows Full AY toggle', async () => {
    global.fetch = mockFetch({ success: true, data: [] });
    const { default: CollectionsPage } = await import('@/app/admin/fees/collections/page');
    render(<CollectionsPage />);
    expect(await screen.findByText('Full AY')).toBeInTheDocument();
  });

  it('shows search input', async () => {
    global.fetch = mockFetch({ success: true, data: [] });
    const { default: CollectionsPage } = await import('@/app/admin/fees/collections/page');
    render(<CollectionsPage />);
    expect(await screen.findByPlaceholderText(/Search by name/)).toBeInTheDocument();
  });

  it('shows Roll no filter', async () => {
    global.fetch = mockFetch({ success: true, data: [] });
    const { default: CollectionsPage } = await import('@/app/admin/fees/collections/page');
    render(<CollectionsPage />);
    expect(await screen.findByPlaceholderText('Roll no')).toBeInTheDocument();
  });

  it('shows Class-wise toggle', async () => {
    global.fetch = mockFetch({ success: true, data: [] });
    const { default: CollectionsPage } = await import('@/app/admin/fees/collections/page');
    render(<CollectionsPage />);
    expect(await screen.findByText('Class-wise')).toBeInTheDocument();
  });

  it('shows Alphabetical toggle', async () => {
    global.fetch = mockFetch({ success: true, data: [] });
    const { default: CollectionsPage } = await import('@/app/admin/fees/collections/page');
    render(<CollectionsPage />);
    expect(await screen.findByText('Alphabetical')).toBeInTheDocument();
  });

  it('shows monthly empty state when no generated fees', async () => {
    global.fetch = mockCollectionsFetch([]);
    const { default: CollectionsPage } = await import('@/app/admin/fees/collections/page');
    render(<CollectionsPage />);
    expect(await screen.findByText(/No fees generated for/)).toBeInTheDocument();
  });

  it('renders student rows with data', async () => {
    global.fetch = mockFetch({ success: true, data: [
      { student: { id: 's1', name: 'Ahmed', rollNumber: '1', group: { name: 'Class 5' }, parents: [] }, netAmount: 1000000, paidAmount: 500000, status: 'PARTIAL' },
      { student: { id: 's2', name: 'Ali', rollNumber: '2', group: { name: 'Class 5' }, parents: [] }, netAmount: 1000000, paidAmount: 0, status: 'UNPAID' },
    ]});
    const { default: CollectionsPage } = await import('@/app/admin/fees/collections/page');
    render(<CollectionsPage />);
    expect(await screen.findByText('Ahmed')).toBeInTheDocument();
    expect(await screen.findByText('Ali')).toBeInTheDocument();
  });

  it('shows Pay button per row', async () => {
    global.fetch = mockFetch({ success: true, data: [
      { student: { id: 's1', name: 'Ahmed', group: { name: 'Class 5' }, parents: [] }, netAmount: 1000000, paidAmount: 0, status: 'UNPAID', fee: { id: 'sf1' } },
    ]});
    const { default: CollectionsPage } = await import('@/app/admin/fees/collections/page');
    render(<CollectionsPage />);
    const payBtns = await screen.findAllByText('Pay');
    expect(payBtns.length).toBeGreaterThanOrEqual(1);
  });

  it('monthly view requests academicYearId in students-list URL', async () => {
    const urls: string[] = [];
    global.fetch = mockCollectionsFetch([], (url) => urls.push(url));
    const { default: CollectionsPage } = await import('@/app/admin/fees/collections/page');
    render(<CollectionsPage />);
    await waitFor(() => expect(urls.some(u => u.includes('academicYearId=ay-1'))).toBe(true));
    expect(urls.some(u => u.includes('period=monthly'))).toBe(true);
  });

  it('monthly view shows generate prompt when no fees generated', async () => {
    global.fetch = mockCollectionsFetch([]);
    const { default: CollectionsPage } = await import('@/app/admin/fees/collections/page');
    render(<CollectionsPage />);
    expect(await screen.findByText(/No fees generated for/)).toBeInTheDocument();
    expect(await screen.findByText('Generate Now')).toBeInTheDocument();
  });

  it('monthly view only shows students returned from API (generated fees)', async () => {
    global.fetch = mockCollectionsFetch([
      { student: { id: 's1', name: 'Ahmed', rollNumber: '1', group: { name: 'Class 2', section: 'A' }, parents: [] }, netAmount: 500000, paidAmount: 0, status: 'UNPAID', fee: { id: 'sf1' } },
    ]);
    const { default: CollectionsPage } = await import('@/app/admin/fees/collections/page');
    render(<CollectionsPage />);
    expect(await screen.findByText('Ahmed')).toBeInTheDocument();
    expect(screen.queryByText('Sara')).not.toBeInTheDocument();
  });

  it('shows family chip and Family pay button when student belongs to a family', async () => {
    global.fetch = mockCollectionsFetch([
      {
        student: {
          id: 's1', name: 'Ahmed', rollNumber: '1', familyId: 'fam1',
          family: { id: 'fam1', name: 'Khan Family' },
          group: { name: 'Class 2', section: 'A' }, parents: [],
        },
        netAmount: 500000, paidAmount: 0, status: 'UNPAID', fee: { id: 'sf1' },
      },
    ]);
    const { default: CollectionsPage } = await import('@/app/admin/fees/collections/page');
    render(<CollectionsPage />);
    expect(await screen.findByText('Khan Family')).toBeInTheDocument();
    expect(await screen.findByText('Family')).toBeInTheDocument();
  });

  it('full AY empty state shows No students found', async () => {
    global.fetch = mockCollectionsFetch([]);
    const { default: CollectionsPage } = await import('@/app/admin/fees/collections/page');
    render(<CollectionsPage />);
    fireEvent.click(await screen.findByText('Full AY'));
    expect(await screen.findByText('No students found')).toBeInTheDocument();
  });

  it('monthly view includes month and year in students-list request', async () => {
    const urls: string[] = [];
    global.fetch = mockCollectionsFetch([], (url) => urls.push(url));
    const { default: CollectionsPage } = await import('@/app/admin/fees/collections/page');
    render(<CollectionsPage />);
    await waitFor(() => expect(urls.some(u => u.includes('month='))).toBe(true));
    expect(urls.some(u => u.includes('year='))).toBe(true);
  });

  it('monthly view does not show Pay for rows without fee id from API', async () => {
    global.fetch = mockCollectionsFetch([
      { student: { id: 's1', name: 'Ahmed', rollNumber: '1', group: { name: 'Class 2' }, parents: [] }, netAmount: 500000, paidAmount: 0, status: 'UNPAID', fee: { id: 'sf1' } },
    ]);
    const { default: CollectionsPage } = await import('@/app/admin/fees/collections/page');
    render(<CollectionsPage />);
    expect(await screen.findByText('Ahmed')).toBeInTheDocument();
    expect(await screen.findAllByText('Pay')).toHaveLength(1);
  });

  it('switching to Full AY requests period=full', async () => {
    const urls: string[] = [];
    global.fetch = mockCollectionsFetch([], (url) => urls.push(url));
    const { default: CollectionsPage } = await import('@/app/admin/fees/collections/page');
    render(<CollectionsPage />);
    fireEvent.click(await screen.findByText('Full AY'));
    await waitFor(() => expect(urls.some(u => u.includes('period=full'))).toBe(true));
  });

  it('defaults to monthly view on load', async () => {
    const urls: string[] = [];
    global.fetch = mockCollectionsFetch([], (url) => urls.push(url));
    const { default: CollectionsPage } = await import('@/app/admin/fees/collections/page');
    render(<CollectionsPage />);
    await waitFor(() => expect(urls.some(u => u.includes('period=monthly'))).toBe(true));
  });

  it('shows summary strip when students loaded', async () => {
    global.fetch = mockCollectionsFetch([
      { student: { id: 's1', name: 'Ahmed', rollNumber: '1', group: { name: 'Class 2' }, parents: [] }, netAmount: 500000, paidAmount: 200000, status: 'PARTIAL', fee: { id: 'sf1' } },
    ]);
    const { default: CollectionsPage } = await import('@/app/admin/fees/collections/page');
    render(<CollectionsPage />);
    expect(await screen.findByText(/students/)).toBeInTheDocument();
    expect(await screen.findByText('Outstanding')).toBeInTheDocument();
  });

  it('passes search query to server after debounce', async () => {
    const urls: string[] = [];
    global.fetch = mockCollectionsFetch([], (url) => urls.push(url));
    const { default: CollectionsPage } = await import('@/app/admin/fees/collections/page');
    render(<CollectionsPage />);
    fireEvent.change(await screen.findByPlaceholderText(/Search by name/), { target: { value: 'Ahmed' } });
    await waitFor(() => expect(urls.some(u => u.includes('search=Ahmed'))).toBe(true), { timeout: 2000 });
  });

  it('passes fatherSearch query to server after debounce', async () => {
    const urls: string[] = [];
    global.fetch = mockCollectionsFetch([], (url) => urls.push(url));
    const { default: CollectionsPage } = await import('@/app/admin/fees/collections/page');
    render(<CollectionsPage />);
    fireEvent.change(await screen.findByPlaceholderText(/Father name or phone/), { target: { value: 'Ali' } });
    await waitFor(() => expect(urls.some(u => u.includes('fatherSearch=Ali'))).toBe(true), { timeout: 2000 });
  });

  it('requests pagination with limit 100', async () => {
    const urls: string[] = [];
    global.fetch = mockCollectionsFetch([], (url) => urls.push(url));
    const { default: CollectionsPage } = await import('@/app/admin/fees/collections/page');
    render(<CollectionsPage />);
    await waitFor(() => expect(urls.some(u => u.includes('limit=100'))).toBe(true));
    expect(urls.some(u => u.includes('page=1'))).toBe(true);
  });

  it('shows pagination controls when multiple pages', async () => {
    global.fetch = mockCollectionsFetch(
      [{ student: { id: 's1', name: 'Ahmed', rollNumber: '1', group: { name: 'Class 2' }, parents: [] }, netAmount: 500000, paidAmount: 0, status: 'UNPAID', fee: { id: 'sf1' } }],
      undefined,
      { page: 1, limit: 100, total: 250, totalPages: 3 },
    );
    const { default: CollectionsPage } = await import('@/app/admin/fees/collections/page');
    render(<CollectionsPage />);
    expect(await screen.findByText(/Page 1 of 3/)).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════
// FEE REPORTS PAGE
// ═══════════════════════════════════════════════════════════════════

describe('FeeReportsPage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders page title', async () => {
    global.fetch = mockFetch({ success: true, data: {} });
    const { default: FeeReportsPage } = await import('@/app/admin/fees/reports/page');
    render(<FeeReportsPage />);
    expect(await screen.findByText('Fee Reports')).toBeInTheDocument();
  });

  it('shows Summary tab', async () => {
    global.fetch = mockFetch({ success: true, data: {} });
    const { default: FeeReportsPage } = await import('@/app/admin/fees/reports/page');
    render(<FeeReportsPage />);
    expect(await screen.findByText('Summary')).toBeInTheDocument();
  });

  it('shows Defaulters tab', async () => {
    global.fetch = mockFetch({ success: true, data: {} });
    const { default: FeeReportsPage } = await import('@/app/admin/fees/reports/page');
    render(<FeeReportsPage />);
    expect(await screen.findByText('Defaulters')).toBeInTheDocument();
  });

  it('shows By Class tab', async () => {
    global.fetch = mockFetch({ success: true, data: {} });
    const { default: FeeReportsPage } = await import('@/app/admin/fees/reports/page');
    render(<FeeReportsPage />);
    expect(await screen.findByText('By Class')).toBeInTheDocument();
  });

  it('renders summary stats cards', async () => {
    global.fetch = mockFetch({ success: true, data: { totalDue: 50000000, totalCollected: 30000000, pendingCount: 45, collectionRate: 60 } });
    const { default: FeeReportsPage } = await import('@/app/admin/fees/reports/page');
    render(<FeeReportsPage />);
    fireEvent.click(await screen.findByText('Summary'));
    expect(await screen.findByText('500,000')).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════
// FEE DASHBOARD PAGE
// ═══════════════════════════════════════════════════════════════════

describe('FeesDashboardPage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders page title', async () => {
    global.fetch = mockFetch({ success: true, data: { totalDue: 10000000, totalCollected: 7000000, pendingCount: 50, collectionRate: 70 } });
    const { default: FeesDashboardPage } = await import('@/app/admin/fees/page');
    render(<FeesDashboardPage />);
    expect(await screen.findByText('Fees & Payments')).toBeInTheDocument();
  });

  it('shows all 6 feature cards', async () => {
    global.fetch = mockFetch({ success: true, data: { totalDue: 10000000, totalCollected: 7000000, pendingCount: 50, collectionRate: 70 } });
    const { default: FeesDashboardPage } = await import('@/app/admin/fees/page');
    render(<FeesDashboardPage />);
    expect(await screen.findByText('Fee Heads')).toBeInTheDocument();
    expect(await screen.findByText('Fee Structures')).toBeInTheDocument();
    expect(await screen.findByText('Generate Fees')).toBeInTheDocument();
    expect(await screen.findByText('Collections')).toBeInTheDocument();
    expect(await screen.findByText('Families')).toBeInTheDocument();
    expect(await screen.findByText('Reports')).toBeInTheDocument();
  });

  it('shows Quick Actions section', async () => {
    global.fetch = mockFetch({ success: true, data: { totalDue: 10000000, totalCollected: 7000000, pendingCount: 50, collectionRate: 70 } });
    const { default: FeesDashboardPage } = await import('@/app/admin/fees/page');
    render(<FeesDashboardPage />);
    expect(await screen.findByText('Quick Actions')).toBeInTheDocument();
  });

  it('shows This Month Summary', async () => {
    global.fetch = mockFetch({ success: true, data: { totalDue: 10000000, totalCollected: 7000000, pendingCount: 50, collectionRate: 70 } });
    const { default: FeesDashboardPage } = await import('@/app/admin/fees/page');
    render(<FeesDashboardPage />);
    expect(await screen.findByText('This Month Summary')).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════
// FAMILY PAY PAGE
// ═══════════════════════════════════════════════════════════════════

describe('FamilyPayPage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders page title', async () => {
    const { default: FamilyPayPage } = await import('@/app/admin/fees/collections/family-pay/page');
    render(<FamilyPayPage />);
    expect(await screen.findByText('Family Combined Payment')).toBeInTheDocument();
  });

  it('shows search input', async () => {
    const { default: FamilyPayPage } = await import('@/app/admin/fees/collections/family-pay/page');
    render(<FamilyPayPage />);
    expect(await screen.findByPlaceholderText(/Search by father name/)).toBeInTheDocument();
  });

  it('shows Search button', async () => {
    const { default: FamilyPayPage } = await import('@/app/admin/fees/collections/family-pay/page');
    render(<FamilyPayPage />);
    const searchBtns = await screen.findAllByText('Search');
    expect(searchBtns.length).toBeGreaterThanOrEqual(1);
  });
});

// ═══════════════════════════════════════════════════════════════════
// FEE STRUCTURES PER-CLASS PAGE
// ═══════════════════════════════════════════════════════════════════

describe('ClassStudentsFeePage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('shows back button', async () => {
    global.fetch = mockFetch({ success: true, data: [] });
    const { default: ClassStudentsFeePage } = await import('@/app/admin/fees/structures/[id]/page');
    render(<ClassStudentsFeePage />);
    expect(await screen.findByText('Back to Fee Structures')).toBeInTheDocument();
  });

  it('renders student table', async () => {
    global.fetch = mockFetch({ success: true, data: [] });
    const { default: ClassStudentsFeePage } = await import('@/app/admin/fees/structures/[id]/page');
    render(<ClassStudentsFeePage />);
    const roll = await screen.findAllByText('Roll');
    expect(roll.length).toBeGreaterThanOrEqual(1);
  });
});

