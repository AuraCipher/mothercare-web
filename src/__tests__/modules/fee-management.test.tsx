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
}));

vi.mock('@/components/toast', () => ({ showToast: mockShowToast }));

vi.mock('lucide-react', () => ({
  ArrowLeft: 'div', ArrowRight: 'div', Printer: 'div', Save: 'div', Download: 'div',
  Search: 'div', DollarSign: 'div', Plus: 'div', Users: 'div', FileText: 'div',
  Calendar: 'div', ChevronDown: 'div', ChevronRight: 'div', Trash2: 'div',
  RefreshCw: 'div', CheckCircle: 'div', BarChart: 'div', Edit3: 'div', X: 'div',
}));

const localStorageMock = (() => {
  let store: Record<string, string> = { token: 'test-jwt', activeBranchId: 'b-1', activeAYId: 'ay-1' };
  return { getItem: (key: string) => store[key] || null, setItem: (k: string, v: string) => { store[k] = v; }, removeItem: (k: string) => { delete store[k]; }, clear: () => { store = {}; } };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const mockFetch = (data: any) => vi.fn(() => Promise.resolve({ json: () => Promise.resolve(data) }));

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
  beforeEach(() => { vi.clearAllMocks(); });

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

  it('shows Generate button', async () => {
    const { default: GenerateFeesPage } = await import('@/app/admin/fees/generate/page');
    render(<GenerateFeesPage />);
    expect(await screen.findByText('Generate')).toBeInTheDocument();
  });

  it('shows category checkboxes', async () => {
    const { default: GenerateFeesPage } = await import('@/app/admin/fees/generate/page');
    render(<GenerateFeesPage />);
    expect(await screen.findByText('Fee Categories to Include')).toBeInTheDocument();
    expect(await screen.findByText('Monthly')).toBeInTheDocument();
    expect(await screen.findByText('Term')).toBeInTheDocument();
    expect(await screen.findByText('Annual')).toBeInTheDocument();
    expect(await screen.findByText('One-Time')).toBeInTheDocument();
  });

  it('shows Monthly checked by default', async () => {
    const { default: GenerateFeesPage } = await import('@/app/admin/fees/generate/page');
    render(<GenerateFeesPage />);
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes.length).toBe(4);
    expect((checkboxes[0] as HTMLInputElement).checked).toBe(true);
  });

  it('shows success result after generation', async () => {
    global.fetch = mockFetch({ success: true, data: { generated: 345, skipped: 0, total: 345 } });
    const { default: GenerateFeesPage } = await import('@/app/admin/fees/generate/page');
    render(<GenerateFeesPage />);
    fireEvent.click(await screen.findByText('Generate'));
    expect(await screen.findByText('345')).toBeInTheDocument();
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

  it('shows No students found when empty', async () => {
    global.fetch = mockFetch({ success: true, data: [] });
    const { default: CollectionsPage } = await import('@/app/admin/fees/collections/page');
    render(<CollectionsPage />);
    expect(await screen.findByText('No students found')).toBeInTheDocument();
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
      { student: { id: 's1', name: 'Ahmed', group: { name: 'Class 5' }, parents: [] }, netAmount: 1000000, paidAmount: 0, status: 'UNPAID' },
    ]});
    const { default: CollectionsPage } = await import('@/app/admin/fees/collections/page');
    render(<CollectionsPage />);
    const payBtns = await screen.findAllByText('Pay');
    expect(payBtns.length).toBeGreaterThanOrEqual(1);
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
    expect(await screen.findByText('Family Pay')).toBeInTheDocument();
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

