/**
 * Expenses — Other Payments Page Tests
 */

import { describe, it, expect, vi, beforeEach, test } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../helpers/test-utils';

const mockPush = vi.hoisted(() => vi.fn());
const mockShowToast = vi.hoisted(() => vi.fn());
const mockGetOtherPayments = vi.hoisted(() => vi.fn());
const mockGetOtherCategories = vi.hoisted(() => vi.fn());
const mockRecordOtherPayment = vi.hoisted(() => vi.fn());
const mockCreateOtherCategory = vi.hoisted(() => vi.fn());
const mockAyPermissions = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: vi.fn(), replace: vi.fn() }),
  useParams: () => ({}),
  usePathname: () => '/admin/expenses/others',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/components/toast', () => ({ showToast: mockShowToast }));

vi.mock('@/hooks/use-ay-permissions', () => ({
  useAyPermissions: (...args: unknown[]) => mockAyPermissions(...args),
}));

vi.mock('@/lib/api', () => ({
  api: {
    getOtherPayments: mockGetOtherPayments,
    getOtherCategories: mockGetOtherCategories,
    recordOtherPayment: mockRecordOtherPayment,
    createOtherCategory: mockCreateOtherCategory,
  },
}));

vi.mock('lucide-react', () => ({
  ChevronLeft: 'div', Plus: 'div',
}));

const defaultPerms = {
  canCreate: true, canUpdate: true, canDelete: true, canRead: true,
  readOnly: false, isArchived: false, isBuildStage: false, ayStatus: 'ACTIVE', module: 'EXPENSES',
};

const mockCategories = [
  { id: 'oc1', name: 'Maintenance', isActive: true },
  { id: 'oc2', name: 'Transport', isActive: true },
  { id: 'oc3', name: 'Repairs', isActive: true },
];

const mockPayment = (overrides: Record<string, unknown> = {}) => ({
  id: 'op1',
  voucherNumber: 'OV-001',
  amount: 5000,
  paidAt: '2025-06-15T12:00:00Z',
  otherDetail: {
    category: { name: 'Maintenance' },
    payeeName: 'ABC Plumbing',
    paymentKind: 'REGULAR',
    description: 'Pipe repair',
  },
  ...overrides,
});

function setupDefaultMocks() {
  mockGetOtherPayments.mockResolvedValue({ success: true, data: [mockPayment()] });
  mockGetOtherCategories.mockResolvedValue({ success: true, data: mockCategories });
}

async function renderOthers() {
  const { default: OthersPage } = await import('@/app/admin/expenses/others/page');
  return render(<OthersPage />);
}

describe('OthersPage — rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAyPermissions.mockReturnValue(defaultPerms);
    setupDefaultMocks();
  });

  it('renders page title', async () => {
    await renderOthers();
    expect(await screen.findByText('Other Payments')).toBeInTheDocument();
  });

  it('renders page subtitle', async () => {
    await renderOthers();
    expect(await screen.findByText(/Maintenance, repairs, transport/)).toBeInTheDocument();
  });

  it('renders back navigation', async () => {
    await renderOthers();
    expect(await screen.findByText('Payments')).toBeInTheDocument();
  });

  it('renders Record payment button when canCreate', async () => {
    await renderOthers();
    expect(await screen.findByText('Record payment')).toBeInTheDocument();
  });

  it('renders Reports button', async () => {
    await renderOthers();
    expect(await screen.findByText('Reports')).toBeInTheDocument();
  });

  test.each(['Date', 'Category', 'Payee', 'Kind', 'Amount', 'Voucher'])(
    'renders table header: %s',
    async (header) => {
      await renderOthers();
      expect(await screen.findByText(header)).toBeInTheDocument();
    },
  );

  it('renders payment rows', async () => {
    await renderOthers();
    expect(await screen.findByText('ABC Plumbing')).toBeInTheDocument();
    expect(await screen.findByRole('cell', { name: 'Maintenance' })).toBeInTheDocument();
    expect(await screen.findByText('5,000')).toBeInTheDocument();
    expect(await screen.findByText('OV-001')).toBeInTheDocument();
  });

  it('renders category chips', async () => {
    await renderOthers();
    expect(await screen.findByText('Transport')).toBeInTheDocument();
    expect(await screen.findByText('Repairs')).toBeInTheDocument();
  });

  it('renders new category input', async () => {
    await renderOthers();
    expect(await screen.findByPlaceholderText('New category')).toBeInTheDocument();
  });
});

describe('OthersPage — empty state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAyPermissions.mockReturnValue(defaultPerms);
    mockGetOtherPayments.mockResolvedValue({ success: true, data: [] });
    mockGetOtherCategories.mockResolvedValue({ success: true, data: [] });
  });

  it('renders empty payments table', async () => {
    await renderOthers();
    await screen.findByText('Date');
    expect(screen.queryByText('OV-001')).not.toBeInTheDocument();
  });

  it('shows no categories when empty', async () => {
    await renderOthers();
    await screen.findByText('Categories');
    expect(screen.queryByText('Maintenance')).not.toBeInTheDocument();
  });
});

describe('OthersPage — permissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
  });

  it('hides Record payment when canCreate is false', async () => {
    mockAyPermissions.mockReturnValue({ ...defaultPerms, canCreate: false });
    await renderOthers();
    await screen.findByText('Other Payments');
    expect(screen.queryByText('Record payment')).not.toBeInTheDocument();
  });

  it('shows read-only banner when readOnly', async () => {
    mockAyPermissions.mockReturnValue({ ...defaultPerms, readOnly: true });
    await renderOthers();
    expect(await screen.findByText(/Archived year — read-only/)).toBeInTheDocument();
  });
});

describe('OthersPage — record form', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAyPermissions.mockReturnValue(defaultPerms);
    setupDefaultMocks();
    mockRecordOtherPayment.mockResolvedValue({ success: true });
  });

  it('opens form on Record payment click', async () => {
    await renderOthers();
    fireEvent.click(await screen.findByText('Record payment'));
    expect(await screen.findByText('Record other payment')).toBeInTheDocument();
  });

  it('closes form on Cancel', async () => {
    await renderOthers();
    fireEvent.click(await screen.findByText('Record payment'));
    fireEvent.click(await screen.findByText('Cancel'));
    expect(screen.queryByText('Record other payment')).not.toBeInTheDocument();
  });

  it('shows category select options', async () => {
    await renderOthers();
    fireEvent.click(await screen.findByText('Record payment'));
    const select = screen.getAllByRole('combobox')[0];
    expect(select.querySelector('option[value="oc1"]')).toBeTruthy();
    expect(select.querySelector('option[value="oc2"]')).toBeTruthy();
  });

  test.each(['REGULAR', 'EXTRA'])(
    'shows payment kind option: %s',
    async (kind) => {
      await renderOthers();
      fireEvent.click(await screen.findByText('Record payment'));
      const selects = screen.getAllByRole('combobox');
      const kindSelect = selects.find((s) => s.querySelector(`option[value="${kind}"]`));
      expect(kindSelect).toBeTruthy();
    },
  );

  test.each(['CASH', 'CHEQUE', 'BANK_TRANSFER', 'ONLINE'])(
    'shows payment method: %s',
    async (method) => {
      await renderOthers();
      fireEvent.click(await screen.findByText('Record payment'));
      const selects = screen.getAllByRole('combobox');
      const methodSelect = selects.find((s) => s.querySelector(`option[value="${method}"]`));
      expect(methodSelect).toBeTruthy();
    },
  );

  it('validates required fields on empty submit', async () => {
    await renderOthers();
    fireEvent.click(await screen.findByText('Record payment'));
    fireEvent.click(await screen.findByText('Save'));
    expect(mockShowToast).toHaveBeenCalledWith('error', 'Category, payee, and amount are required');
    expect(mockRecordOtherPayment).not.toHaveBeenCalled();
  });

  it('validates missing category', async () => {
    await renderOthers();
    fireEvent.click(await screen.findByText('Record payment'));
    fireEvent.change(screen.getByPlaceholderText('Payee name *'), { target: { value: 'Vendor' } });
    fireEvent.change(screen.getByDisplayValue('0'), { target: { value: '1000' } });
    fireEvent.click(screen.getByText('Save'));
    expect(mockRecordOtherPayment).not.toHaveBeenCalled();
  });

  it('validates missing payee', async () => {
    await renderOthers();
    fireEvent.click(await screen.findByText('Record payment'));
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'oc1' } });
    fireEvent.change(screen.getByDisplayValue('0'), { target: { value: '1000' } });
    fireEvent.click(screen.getByText('Save'));
    expect(mockRecordOtherPayment).not.toHaveBeenCalled();
  });

  it('validates zero amount', async () => {
    await renderOthers();
    fireEvent.click(await screen.findByText('Record payment'));
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'oc1' } });
    fireEvent.change(screen.getByPlaceholderText('Payee name *'), { target: { value: 'Vendor' } });
    fireEvent.click(screen.getByText('Save'));
    expect(mockRecordOtherPayment).not.toHaveBeenCalled();
  });

  it('submits valid payment', async () => {
    await renderOthers();
    fireEvent.click(await screen.findByText('Record payment'));
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'oc1' } });
    fireEvent.change(screen.getByPlaceholderText('Payee name *'), { target: { value: 'Vendor Co' } });
    fireEvent.change(screen.getByDisplayValue('0'), { target: { value: '2500' } });
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => expect(mockRecordOtherPayment).toHaveBeenCalled());
    const payload = mockRecordOtherPayment.mock.calls[0][0];
    expect(payload.categoryId).toBe('oc1');
    expect(payload.payeeName).toBe('Vendor Co');
    expect(payload.amount).toBe(2500);
    expect(mockShowToast).toHaveBeenCalledWith('success', 'Payment recorded');
  });

  it('shows error toast when submit throws', async () => {
    mockRecordOtherPayment.mockRejectedValue(new Error('Payment failed'));
    await renderOthers();
    fireEvent.click(await screen.findByText('Record payment'));
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'oc1' } });
    fireEvent.change(screen.getByPlaceholderText('Payee name *'), { target: { value: 'Vendor' } });
    fireEvent.change(screen.getByDisplayValue('0'), { target: { value: '1000' } });
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith('error', 'Payment failed'));
  });
});

describe('OthersPage — categories and navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAyPermissions.mockReturnValue(defaultPerms);
    setupDefaultMocks();
    mockCreateOtherCategory.mockResolvedValue({ success: true });
  });

  it('adds new category', async () => {
    await renderOthers();
    fireEvent.change(screen.getByPlaceholderText('New category'), { target: { value: 'Supplies' } });
    fireEvent.click(screen.getByText('Add'));
    await waitFor(() => expect(mockCreateOtherCategory).toHaveBeenCalledWith('Supplies'));
  });

  it('does not add blank category', async () => {
    await renderOthers();
    fireEvent.click(screen.getByText('Add'));
    expect(mockCreateOtherCategory).not.toHaveBeenCalled();
  });

  it('navigates to voucher detail', async () => {
    await renderOthers();
    fireEvent.click(await screen.findByText('OV-001'));
    expect(mockPush).toHaveBeenCalledWith('/admin/expenses/vouchers/op1');
  });

  it('navigates to reports', async () => {
    await renderOthers();
    fireEvent.click(await screen.findByText('Reports'));
    expect(mockPush).toHaveBeenCalledWith('/admin/expenses/reports');
  });

  it('navigates back to expenses hub', async () => {
    await renderOthers();
    fireEvent.click(await screen.findByText('Payments'));
    expect(mockPush).toHaveBeenCalledWith('/admin/expenses');
  });
});
