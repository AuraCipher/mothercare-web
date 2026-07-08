/**
 * Expenses — Voucher Detail Page Tests
 */

import { describe, it, expect, vi, beforeEach, test } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../helpers/test-utils';

const mockBack = vi.hoisted(() => vi.fn());
const mockShowToast = vi.hoisted(() => vi.fn());
const mockGetExpenseVoucher = vi.hoisted(() => vi.fn());
const mockVoidExpenseVoucher = vi.hoisted(() => vi.fn());
const mockAyPermissions = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: mockBack, replace: vi.fn() }),
  useParams: () => ({ id: 'v-1' }),
  usePathname: () => '/admin/expenses/vouchers/v-1',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/components/toast', () => ({ showToast: mockShowToast }));

vi.mock('@/hooks/use-ay-permissions', () => ({
  useAyPermissions: (...args: unknown[]) => mockAyPermissions(...args),
}));

vi.mock('@/lib/api', () => ({
  api: {
    getExpenseVoucher: mockGetExpenseVoucher,
    voidExpenseVoucher: mockVoidExpenseVoucher,
  },
}));

vi.mock('lucide-react', () => ({
  ArrowLeft: 'div', Ban: 'div',
}));

const defaultPerms = {
  canCreate: true, canUpdate: true, canDelete: true, canRead: true,
  readOnly: false, isArchived: false, isBuildStage: false, ayStatus: 'ACTIVE', module: 'EXPENSES',
};

const baseVoucher = {
  id: 'v-1',
  voucherNumber: 'PV-2025-001',
  type: 'PAYROLL',
  status: 'PAID',
  amount: 25000,
  paymentMethod: 'CASH',
  paidAt: '2025-06-01T10:00:00Z',
  recordedBy: { name: 'Admin User' },
  reference: 'REF-123',
  note: 'June salary',
};

const payrollVoucher = {
  ...baseVoucher,
  payrollDetail: {
    payee: { name: 'Ahmed Khan' },
    salaryMonth: '2025-06',
    paymentKind: 'REGULAR',
    attendanceEarned: 25000,
  },
};

const utilityVoucher = {
  ...baseVoucher,
  id: 'v-2',
  voucherNumber: 'UV-2025-001',
  type: 'UTILITY',
  utilityDetail: {
    category: { name: 'Electricity' },
    providerName: 'LESCO',
    consumerNumber: '12345',
    billReference: 'BILL-99',
  },
};

const otherVoucher = {
  ...baseVoucher,
  id: 'v-3',
  voucherNumber: 'OV-2025-001',
  type: 'OTHER',
  otherDetail: {
    category: { name: 'Maintenance' },
    payeeName: 'ABC Plumbing',
    description: 'Pipe repair',
  },
};

const voidedVoucher = {
  ...payrollVoucher,
  status: 'VOID',
  voidedAt: '2025-06-02T14:00:00Z',
  voidedBy: { name: 'Super Admin' },
  voidReason: 'Duplicate entry',
};

async function renderVoucher() {
  const { default: VoucherPage } = await import('@/app/admin/expenses/vouchers/[id]/page');
  return render(<VoucherPage />);
}

describe('VoucherDetailPage — loading and errors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAyPermissions.mockReturnValue(defaultPerms);
  });

  it('shows loading state', async () => {
    mockGetExpenseVoucher.mockReturnValue(new Promise(() => {}));
    await renderVoucher();
    expect(await screen.findByText('Loading…')).toBeInTheDocument();
  });

  it('shows not found when voucher is null', async () => {
    mockGetExpenseVoucher.mockResolvedValue({ success: true, data: null });
    await renderVoucher();
    expect(await screen.findByText('Voucher not found.')).toBeInTheDocument();
  });

  it('shows error toast when load throws', async () => {
    mockGetExpenseVoucher.mockRejectedValue(new Error('Not found'));
    await renderVoucher();
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith('error', 'Not found'));
  });

  it('calls getExpenseVoucher with id from params', async () => {
    mockGetExpenseVoucher.mockResolvedValue({ success: true, data: payrollVoucher });
    await renderVoucher();
    await waitFor(() => expect(mockGetExpenseVoucher).toHaveBeenCalledWith('v-1'));
  });
});

describe('VoucherDetailPage — payroll voucher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAyPermissions.mockReturnValue(defaultPerms);
    mockGetExpenseVoucher.mockResolvedValue({ success: true, data: payrollVoucher });
  });

  it('renders voucher number as title', async () => {
    await renderVoucher();
    expect(await screen.findByText('PV-2025-001')).toBeInTheDocument();
  });

  it('renders type and status', async () => {
    await renderVoucher();
    expect(await screen.findByText('PAYROLL · PAID')).toBeInTheDocument();
  });

  it('renders back button', async () => {
    await renderVoucher();
    expect(await screen.findByText('Back')).toBeInTheDocument();
  });

  test.each([
    ['Amount', '25,000'],
    ['Method', 'CASH'],
    ['Recorded by', 'Admin User'],
    ['Reference', 'REF-123'],
    ['Note', 'June salary'],
  ])('renders field: %s = %s', async (label, value) => {
    await renderVoucher();
    const labelEl = await screen.findByText(label);
    const row = labelEl.closest('div');
    expect(row?.textContent).toContain(value);
  });

  it('renders payroll-specific fields', async () => {
    await renderVoucher();
    expect(await screen.findByText('Payee')).toBeInTheDocument();
    expect(screen.getByText('Ahmed Khan')).toBeInTheDocument();
    expect(screen.getByText('Salary month')).toBeInTheDocument();
    expect(screen.getByText('2025-06')).toBeInTheDocument();
    expect(screen.getByText('Payment kind')).toBeInTheDocument();
    expect(screen.getByText('REGULAR')).toBeInTheDocument();
    expect(screen.getByText('Attendance earned')).toBeInTheDocument();
  });

  it('shows Void button for PAID voucher when canDelete', async () => {
    await renderVoucher();
    expect(await screen.findByText('Void')).toBeInTheDocument();
  });

  it('hides Void button when canDelete is false', async () => {
    mockAyPermissions.mockReturnValue({ ...defaultPerms, canDelete: false });
    await renderVoucher();
    await screen.findByText('PV-2025-001');
    expect(screen.queryByText('Void')).not.toBeInTheDocument();
  });
});

describe('VoucherDetailPage — utility voucher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAyPermissions.mockReturnValue(defaultPerms);
    mockGetExpenseVoucher.mockResolvedValue({ success: true, data: utilityVoucher });
  });

  it('renders utility voucher number', async () => {
    await renderVoucher();
    expect(await screen.findByText('UV-2025-001')).toBeInTheDocument();
  });

  test.each([
    ['Category', 'Electricity'],
    ['Provider', 'LESCO'],
    ['Consumer #', '12345'],
    ['Bill ref', 'BILL-99'],
  ])('renders utility field: %s', async (label, value) => {
    await renderVoucher();
    expect(await screen.findByText(label)).toBeInTheDocument();
    expect(screen.getByText(value)).toBeInTheDocument();
  });
});

describe('VoucherDetailPage — other voucher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAyPermissions.mockReturnValue(defaultPerms);
    mockGetExpenseVoucher.mockResolvedValue({ success: true, data: otherVoucher });
  });

  it('renders other voucher number', async () => {
    await renderVoucher();
    expect(await screen.findByText('OV-2025-001')).toBeInTheDocument();
  });

  test.each([
    ['Category', 'Maintenance'],
    ['Payee', 'ABC Plumbing'],
    ['Description', 'Pipe repair'],
  ])('renders other field: %s', async (label, value) => {
    await renderVoucher();
    expect(await screen.findByText(label)).toBeInTheDocument();
    expect(screen.getByText(value)).toBeInTheDocument();
  });
});

describe('VoucherDetailPage — voided voucher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAyPermissions.mockReturnValue(defaultPerms);
    mockGetExpenseVoucher.mockResolvedValue({ success: true, data: voidedVoucher });
  });

  it('renders VOID status', async () => {
    await renderVoucher();
    expect(await screen.findByText(/PAYROLL · VOID/)).toBeInTheDocument();
  });

  it('renders void details', async () => {
    await renderVoucher();
    expect(await screen.findByText('Voided by')).toBeInTheDocument();
    expect(screen.getByText('Super Admin')).toBeInTheDocument();
    expect(screen.getByText('Reason')).toBeInTheDocument();
    expect(screen.getByText('Duplicate entry')).toBeInTheDocument();
  });

  it('hides Void button for already voided voucher', async () => {
    await renderVoucher();
    await screen.findByText('PV-2025-001');
    expect(screen.queryByText('Void')).not.toBeInTheDocument();
  });
});

describe('VoucherDetailPage — void modal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAyPermissions.mockReturnValue(defaultPerms);
    mockGetExpenseVoucher.mockResolvedValue({ success: true, data: payrollVoucher });
    mockVoidExpenseVoucher.mockResolvedValue({ success: true });
  });

  it('opens void modal on Void click', async () => {
    await renderVoucher();
    fireEvent.click(await screen.findByText('Void'));
    expect(await screen.findByText('Void voucher?')).toBeInTheDocument();
    expect(screen.getByText(/Payroll balances will be recalculated/)).toBeInTheDocument();
  });

  it('closes void modal on Cancel', async () => {
    await renderVoucher();
    fireEvent.click(await screen.findByText('Void'));
    const cancelBtns = await screen.findAllByText('Cancel');
    fireEvent.click(cancelBtns[cancelBtns.length - 1]);
    expect(screen.queryByText('Void voucher?')).not.toBeInTheDocument();
  });

  it('validates empty void reason', async () => {
    await renderVoucher();
    fireEvent.click(await screen.findByText('Void'));
    const voidBtns = await screen.findAllByText('Void');
    fireEvent.click(voidBtns[voidBtns.length - 1]);
    expect(mockShowToast).toHaveBeenCalledWith('error', 'Void reason is required');
    expect(mockVoidExpenseVoucher).not.toHaveBeenCalled();
  });

  it('submits void with reason', async () => {
    await renderVoucher();
    fireEvent.click(await screen.findByText('Void'));
    fireEvent.change(screen.getByPlaceholderText('Why is this payment being voided?'), {
      target: { value: 'Entered twice' },
    });
    const voidBtns = await screen.findAllByText('Void');
    fireEvent.click(voidBtns[voidBtns.length - 1]);
    await waitFor(() => expect(mockVoidExpenseVoucher).toHaveBeenCalledWith('v-1', 'Entered twice'));
    expect(mockShowToast).toHaveBeenCalledWith('success', 'Voucher voided');
  });

  it('shows error toast when void fails', async () => {
    mockVoidExpenseVoucher.mockRejectedValue(new Error('Cannot void'));
    await renderVoucher();
    fireEvent.click(await screen.findByText('Void'));
    fireEvent.change(screen.getByPlaceholderText('Why is this payment being voided?'), {
      target: { value: 'Mistake' },
    });
    const voidBtns = await screen.findAllByText('Void');
    fireEvent.click(voidBtns[voidBtns.length - 1]);
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith('error', 'Cannot void'));
  });

  it('navigates back on Back click', async () => {
    await renderVoucher();
    fireEvent.click(await screen.findByText('Back'));
    expect(mockBack).toHaveBeenCalled();
  });
});
