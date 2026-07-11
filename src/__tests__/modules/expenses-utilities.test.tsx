/**
 * Expenses — Utilities Page Tests
 */

import { describe, it, expect, vi, beforeEach, test } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../helpers/test-utils';

const mockPush = vi.hoisted(() => vi.fn());
const mockShowToast = vi.hoisted(() => vi.fn());
const mockGetUtilityBills = vi.hoisted(() => vi.fn());
const mockGetUtilityCategories = vi.hoisted(() => vi.fn());
const mockGetUtilityProviders = vi.hoisted(() => vi.fn());
const mockGetUtilityReminders = vi.hoisted(() => vi.fn());
const mockRecordUtilityBill = vi.hoisted(() => vi.fn());
const mockDuplicateUtilityBill = vi.hoisted(() => vi.fn());
const mockCreateUtilityCategory = vi.hoisted(() => vi.fn());
const mockAyPermissions = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: vi.fn(), replace: vi.fn() }),
  useParams: () => ({}),
  usePathname: () => '/admin/expenses/utilities',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/components/toast', () => ({ showToast: mockShowToast }));

vi.mock('@/hooks/use-ay-permissions', () => ({
  useAyPermissions: (...args: unknown[]) => mockAyPermissions(...args),
}));

vi.mock('@/lib/api', () => ({
  api: {
    getUtilityBills: mockGetUtilityBills,
    getUtilityCategories: mockGetUtilityCategories,
    getUtilityProviders: mockGetUtilityProviders,
    getUtilityReminders: mockGetUtilityReminders,
    recordUtilityBill: mockRecordUtilityBill,
    duplicateUtilityBill: mockDuplicateUtilityBill,
    createUtilityCategory: mockCreateUtilityCategory,
  },
}));

vi.mock('lucide-react', () => ({
  ChevronLeft: 'div', Plus: 'div', Copy: 'div', Bell: 'div',
}));

const defaultPerms = {
  canCreate: true, canUpdate: true, canDelete: true, canRead: true,
  readOnly: false, isArchived: false, isBuildStage: false, ayStatus: 'ACTIVE', module: 'EXPENSES',
};

const mockCategories = [
  { id: 'c1', name: 'Electricity', isActive: true },
  { id: 'c2', name: 'Water', isActive: true },
  { id: 'c3', name: 'Gas', isActive: false },
];

const mockProviders = [
  { id: 'p1', name: 'LESCO', consumerNumber: '12345', typicalAmount: 15000, reminderDayOfMonth: 15 },
  { id: 'p2', name: 'SNGPL', consumerNumber: '67890', typicalAmount: 8000, reminderDayOfMonth: 10 },
];

const mockReminders = [
  { id: 'p1', name: 'LESCO', reminderDayOfMonth: 15, typicalAmount: 15000, isDueSoon: true },
  { id: 'p2', name: 'SNGPL', reminderDayOfMonth: 10, typicalAmount: 8000, isDueSoon: false },
];

const mockBill = (overrides: Record<string, unknown> = {}) => ({
  id: 'b1',
  voucherNumber: 'UV-001',
  amount: 15000,
  paidAt: '2025-06-01T10:00:00Z',
  utilityDetail: {
    category: { name: 'Electricity' },
    providerName: 'LESCO',
    paymentKind: 'REGULAR',
  },
  ...overrides,
});

function setupDefaultMocks() {
  mockGetUtilityBills.mockResolvedValue({ success: true, data: [mockBill()] });
  mockGetUtilityCategories.mockResolvedValue({ success: true, data: mockCategories });
  mockGetUtilityProviders.mockResolvedValue({ success: true, data: mockProviders });
  mockGetUtilityReminders.mockResolvedValue({ success: true, data: mockReminders });
}

async function renderUtilities() {
  const { default: UtilitiesPage } = await import('@/app/admin/expenses/utilities/page');
  return render(<UtilitiesPage />);
}

describe('UtilitiesPage — rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAyPermissions.mockReturnValue(defaultPerms);
    setupDefaultMocks();
  });

  it('renders page title', async () => {
    await renderUtilities();
    expect(await screen.findByText('Utility Bills')).toBeInTheDocument();
  });

  it('renders page subtitle', async () => {
    await renderUtilities();
    expect(await screen.findByText(/Electricity, water, gas/)).toBeInTheDocument();
  });

  it('renders back navigation', async () => {
    await renderUtilities();
    expect(await screen.findByText('Payments')).toBeInTheDocument();
  });

  it('renders Record bill button when canCreate', async () => {
    await renderUtilities();
    expect(await screen.findByText('Record bill')).toBeInTheDocument();
  });

  test.each(['Date', 'Category', 'Provider', 'Kind', 'Amount', 'Voucher'])(
    'renders table header: %s',
    async (header) => {
      await renderUtilities();
      expect(await screen.findByText(header)).toBeInTheDocument();
    },
  );

  it('renders bill rows', async () => {
    await renderUtilities();
    const lescoCells = await screen.findAllByText('LESCO');
    expect(lescoCells.length).toBeGreaterThanOrEqual(1);
    expect(await screen.findByText('15,000')).toBeInTheDocument();
    expect(await screen.findByText('UV-001')).toBeInTheDocument();
    expect(await screen.findByRole('cell', { name: 'Electricity' })).toBeInTheDocument();
  });

  it('renders category chips', async () => {
    await renderUtilities();
    const electricity = await screen.findAllByText('Electricity');
    expect(electricity.length).toBeGreaterThanOrEqual(1);
    expect(await screen.findByText('Water')).toBeInTheDocument();
  });

  it('shows inactive category with line-through', async () => {
    await renderUtilities();
    const gas = await screen.findByText('Gas');
    expect(gas.className).toContain('line-through');
  });

  it('renders bill reminders section', async () => {
    await renderUtilities();
    expect(await screen.findByText('Bill reminders')).toBeInTheDocument();
    expect(await screen.findByText(/LESCO — day 15/)).toBeInTheDocument();
  });

  it('renders saved providers section', async () => {
    await renderUtilities();
    expect(await screen.findByText(/Saved providers — duplicate last bill/)).toBeInTheDocument();
    const lescoBtns = await screen.findAllByText('LESCO');
    expect(lescoBtns.length).toBeGreaterThanOrEqual(1);
  });
});

describe('UtilitiesPage — empty states', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAyPermissions.mockReturnValue(defaultPerms);
    mockGetUtilityBills.mockResolvedValue({ success: true, data: [] });
    mockGetUtilityCategories.mockResolvedValue({ success: true, data: [] });
    mockGetUtilityProviders.mockResolvedValue({ success: true, data: [] });
    mockGetUtilityReminders.mockResolvedValue({ success: true, data: [] });
  });

  it('renders empty bills table', async () => {
    await renderUtilities();
    await screen.findByText('Date');
    expect(screen.queryByText('UV-001')).not.toBeInTheDocument();
  });

  it('hides reminders section when none', async () => {
    await renderUtilities();
    await screen.findByText('Utility Bills');
    expect(screen.queryByText('Bill reminders')).not.toBeInTheDocument();
  });

  it('hides providers section when none', async () => {
    await renderUtilities();
    await screen.findByText('Utility Bills');
    expect(screen.queryByText(/Saved providers/)).not.toBeInTheDocument();
  });
});

describe('UtilitiesPage — permissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
  });

  it('hides Record bill when canCreate is false', async () => {
    mockAyPermissions.mockReturnValue({ ...defaultPerms, canCreate: false });
    await renderUtilities();
    await screen.findByText('Utility Bills');
    expect(screen.queryByText('Record bill')).not.toBeInTheDocument();
  });

  it('shows read-only banner when readOnly', async () => {
    mockAyPermissions.mockReturnValue({ ...defaultPerms, readOnly: true });
    await renderUtilities();
    expect(await screen.findByText(/Archived year — read-only/)).toBeInTheDocument();
  });

  it('disables duplicate buttons when canCreate is false', async () => {
    mockAyPermissions.mockReturnValue({ ...defaultPerms, canCreate: false });
    await renderUtilities();
    const providerBtns = await screen.findAllByText('LESCO');
    const dupBtn = providerBtns.find((el) => el.closest('button'))?.closest('button');
    expect(dupBtn).toBeDisabled();
  });
});

describe('UtilitiesPage — record form', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAyPermissions.mockReturnValue(defaultPerms);
    setupDefaultMocks();
    mockRecordUtilityBill.mockResolvedValue({ success: true });
  });

  it('opens form on Record bill click', async () => {
    await renderUtilities();
    fireEvent.click(await screen.findByText('Record bill'));
    expect(await screen.findByText('Record utility bill')).toBeInTheDocument();
  });

  it('closes form on Cancel', async () => {
    await renderUtilities();
    fireEvent.click(await screen.findByText('Record bill'));
    fireEvent.click(await screen.findByText('Cancel'));
    expect(screen.queryByText('Record utility bill')).not.toBeInTheDocument();
  });

  it('shows category select with active options', async () => {
    await renderUtilities();
    fireEvent.click(await screen.findByText('Record bill'));
    expect(await screen.findByText('Select category')).toBeInTheDocument();
    const select = screen.getAllByRole('combobox')[0];
    expect(select.querySelector('option[value="c1"]')).toBeTruthy();
    expect(select.querySelector('option[value="c3"]')).toBeFalsy();
  });

  test.each(['CASH', 'CHEQUE', 'BANK_TRANSFER', 'ONLINE'])(
    'shows payment method: %s',
    async (method) => {
      await renderUtilities();
      fireEvent.click(await screen.findByText('Record bill'));
      const selects = screen.getAllByRole('combobox');
      const methodSelect = selects.find((s) => s.querySelector(`option[value="${method}"]`));
      expect(methodSelect).toBeTruthy();
    },
  );

  it('validates required fields on submit', async () => {
    await renderUtilities();
    fireEvent.click(await screen.findByText('Record bill'));
    fireEvent.click(await screen.findByText('Save'));
    expect(mockShowToast).toHaveBeenCalledWith('error', 'Category, provider, and amount are required');
    expect(mockRecordUtilityBill).not.toHaveBeenCalled();
  });

  it('submits valid bill', async () => {
    await renderUtilities();
    fireEvent.click(await screen.findByText('Record bill'));
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'c1' } });
    fireEvent.change(screen.getByPlaceholderText('Provider name *'), { target: { value: 'LESCO' } });
    const amountInput = screen.getByDisplayValue('0');
    fireEvent.change(amountInput, { target: { value: '5000' } });
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => expect(mockRecordUtilityBill).toHaveBeenCalled());
    expect(mockShowToast).toHaveBeenCalledWith('success', 'Utility bill recorded');
  });

  it('shows error toast when submit throws', async () => {
    mockRecordUtilityBill.mockRejectedValue(new Error('Server error'));
    await renderUtilities();
    fireEvent.click(await screen.findByText('Record bill'));
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'c1' } });
    fireEvent.change(screen.getByPlaceholderText('Provider name *'), { target: { value: 'LESCO' } });
    fireEvent.change(screen.getByDisplayValue('0'), { target: { value: '5000' } });
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith('error', 'Server error'));
  });

  it('auto-fills provider fields when saved provider selected', async () => {
    await renderUtilities();
    fireEvent.click(await screen.findByText('Record bill'));
    const providerSelect = screen.getAllByRole('combobox')[1];
    fireEvent.change(providerSelect, { target: { value: 'p1' } });
    expect(screen.getByPlaceholderText('Provider name *')).toHaveValue('LESCO');
    expect(screen.getByPlaceholderText('Consumer / account number')).toHaveValue('12345');
  });

  it('shows reminder day input when saveProvider checked', async () => {
    await renderUtilities();
    fireEvent.click(await screen.findByText('Record bill'));
    fireEvent.click(screen.getByLabelText(/Save as new provider/));
    expect(await screen.findByPlaceholderText('Reminder day of month (1–31)')).toBeInTheDocument();
  });
});

describe('UtilitiesPage — categories and duplicate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAyPermissions.mockReturnValue(defaultPerms);
    setupDefaultMocks();
    mockCreateUtilityCategory.mockResolvedValue({ success: true });
    mockDuplicateUtilityBill.mockResolvedValue({ success: true });
  });

  it('adds new category', async () => {
    await renderUtilities();
    fireEvent.change(screen.getByPlaceholderText('New category'), { target: { value: 'Internet' } });
    fireEvent.click(screen.getByText('Add'));
    await waitFor(() => expect(mockCreateUtilityCategory).toHaveBeenCalledWith('Internet'));
  });

  it('does not add empty category', async () => {
    await renderUtilities();
    fireEvent.click(screen.getByText('Add'));
    expect(mockCreateUtilityCategory).not.toHaveBeenCalled();
  });

  it('duplicates bill from provider', async () => {
    await renderUtilities();
    const providerBtns = await screen.findAllByText('LESCO');
    const dupBtn = providerBtns
      .map((el) => el.closest('button'))
      .find((btn): btn is HTMLButtonElement => btn instanceof HTMLButtonElement);
    expect(dupBtn).toBeDefined();
    if (!dupBtn) return;
    fireEvent.click(dupBtn);
    await waitFor(() => expect(mockDuplicateUtilityBill).toHaveBeenCalledWith('p1'));
    expect(mockShowToast).toHaveBeenCalledWith('success', 'Bill duplicated from last payment');
  });

  it('shows error when duplicate fails', async () => {
    mockDuplicateUtilityBill.mockRejectedValue(new Error('No previous bill'));
    await renderUtilities();
    const providerBtns = await screen.findAllByText('LESCO');
    const dupBtn = providerBtns
      .map((el) => el.closest('button'))
      .find((btn): btn is HTMLButtonElement => btn instanceof HTMLButtonElement);
    expect(dupBtn).toBeDefined();
    if (!dupBtn) return;
    fireEvent.click(dupBtn);
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith('error', 'No previous bill'));
  });

  it('navigates to voucher on voucher click', async () => {
    await renderUtilities();
    fireEvent.click(await screen.findByText('UV-001'));
    expect(mockPush).toHaveBeenCalledWith('/admin/expenses/vouchers/b1');
  });

  it('navigates back to expenses', async () => {
    await renderUtilities();
    fireEvent.click(await screen.findByText('Payments'));
    expect(mockPush).toHaveBeenCalledWith('/admin/expenses');
  });
});
