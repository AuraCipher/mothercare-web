/**
 * Expenses — Payroll Page Tests
 */

import { describe, it, expect, vi, beforeEach, test } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../helpers/test-utils';

const mockPush = vi.hoisted(() => vi.fn());
const mockShowToast = vi.hoisted(() => vi.fn());
const mockGetPayrollList = vi.hoisted(() => vi.fn());
const mockRecordPayrollPayment = vi.hoisted(() => vi.fn());
const mockExportPayrollCsv = vi.hoisted(() => vi.fn());
const mockDownloadCsv = vi.hoisted(() => vi.fn());
const mockAyPermissions = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: vi.fn(), replace: vi.fn() }),
  useParams: () => ({}),
  usePathname: () => '/admin/expenses/payroll',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/components/toast', () => ({ showToast: mockShowToast }));

vi.mock('@/hooks/use-ay-permissions', () => ({
  useAyPermissions: (...args: unknown[]) => mockAyPermissions(...args),
}));

vi.mock('@/lib/api', () => ({
  api: {
    getPayrollList: mockGetPayrollList,
    recordPayrollPayment: mockRecordPayrollPayment,
    exportPayrollCsv: mockExportPayrollCsv,
  },
}));

vi.mock('@/lib/expenses-export', () => ({
  downloadCsvText: mockDownloadCsv,
}));

vi.mock('lucide-react', () => ({
  ChevronLeft: 'div', Plus: 'div', RefreshCw: 'div', Download: 'div', AlertTriangle: 'div',
}));

const defaultPerms = {
  canCreate: true, canUpdate: true, canDelete: true, canRead: true,
  readOnly: false, isArchived: false, isBuildStage: false, ayStatus: 'ACTIVE', module: 'EXPENSES',
};

const mockRow = (overrides: Record<string, unknown> = {}) => ({
  userId: 'u-1',
  name: 'Ahmed Khan',
  workRole: 'Mathematics Teacher',
  payeeType: 'STAFF',
  branchRole: 'TEACHER',
  profileSalary: 50000,
  attendanceEarned: 45000,
  openingBalance: 5000,
  totalPaid: 30000,
  closingBalance: 20000,
  unmarkedDays: 0,
  attendancePath: '/admin/attendance/teacher',
  ...overrides,
});

const mockRow2 = mockRow({
  userId: 'u-2',
  name: 'Sara Ali',
  workRole: 'Admin',
  payeeType: 'WORKER',
  branchRole: 'STAFF',
  profileSalary: 30000,
  attendanceEarned: 28000,
  openingBalance: 0,
  totalPaid: 28000,
  closingBalance: 0,
  unmarkedDays: 3,
});

async function renderPayroll() {
  const { default: PayrollPage } = await import('@/app/admin/expenses/payroll/page');
  return render(<PayrollPage />);
}

describe('PayrollPage — rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAyPermissions.mockReturnValue(defaultPerms);
    mockGetPayrollList.mockResolvedValue({ success: true, data: [mockRow(), mockRow2] });
  });

  it('renders page title', async () => {
    await renderPayroll();
    expect(await screen.findByText('Pays')).toBeInTheDocument();
  });

  it('renders page subtitle', async () => {
    await renderPayroll();
    expect(await screen.findByText(/Attendance-based salary/)).toBeInTheDocument();
  });

  it('renders back navigation to Payments', async () => {
    await renderPayroll();
    expect(await screen.findByText('Payments')).toBeInTheDocument();
  });

  it('renders month selector input', async () => {
    await renderPayroll();
    expect(await screen.findByDisplayValue(/\d{4}-\d{2}/)).toBeInTheDocument();
  });

  it('renders Bulk pay button when canCreate', async () => {
    await renderPayroll();
    expect(await screen.findByText('Bulk pay')).toBeInTheDocument();
  });

  it('renders Reports button', async () => {
    await renderPayroll();
    expect(await screen.findByText('Reports')).toBeInTheDocument();
  });

  test.each(['Name', 'Type', 'Profile salary', 'Earned', 'Opening', 'Paid', 'Balance', 'Missing att.', 'Actions'])(
    'renders table header: %s',
    async (header) => {
      await renderPayroll();
      expect(await screen.findByText(header)).toBeInTheDocument();
    },
  );

  it('renders employee names in table', async () => {
    await renderPayroll();
    expect(await screen.findByText('Ahmed Khan')).toBeInTheDocument();
    expect(await screen.findByText('Sara Ali')).toBeInTheDocument();
  });

  it('renders work roles under names', async () => {
    await renderPayroll();
    expect(await screen.findByText('Mathematics Teacher')).toBeInTheDocument();
  });

  it('renders formatted salary amounts', async () => {
    await renderPayroll();
    expect(await screen.findByText('50,000')).toBeInTheDocument();
  });

  it('shows Pay and Extra action buttons per row', async () => {
    await renderPayroll();
    const payBtns = await screen.findAllByText('Pay');
    const extraBtns = await screen.findAllByText('Extra');
    expect(payBtns.length).toBeGreaterThanOrEqual(2);
    expect(extraBtns.length).toBeGreaterThanOrEqual(2);
  });
});

describe('PayrollPage — loading and empty', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAyPermissions.mockReturnValue(defaultPerms);
  });

  it('shows loading state while fetching', async () => {
    mockGetPayrollList.mockReturnValue(new Promise(() => {}));
    await renderPayroll();
    expect(await screen.findByText('Loading…')).toBeInTheDocument();
  });

  it('renders empty table body when no rows', async () => {
    mockGetPayrollList.mockResolvedValue({ success: true, data: [] });
    await renderPayroll();
    await screen.findByText('Name');
    expect(screen.queryByText('Ahmed Khan')).not.toBeInTheDocument();
  });

  it('calls getPayrollList on mount', async () => {
    mockGetPayrollList.mockResolvedValue({ success: true, data: [] });
    await renderPayroll();
    await waitFor(() => expect(mockGetPayrollList).toHaveBeenCalled());
  });
});

describe('PayrollPage — unmarked attendance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAyPermissions.mockReturnValue(defaultPerms);
    mockGetPayrollList.mockResolvedValue({ success: true, data: [mockRow2] });
  });

  it('shows unmarked days warning', async () => {
    await renderPayroll();
    expect(await screen.findByText(/3 unmarked/)).toBeInTheDocument();
  });

  it('navigates to attendance path on unmarked click', async () => {
    await renderPayroll();
    fireEvent.click(await screen.findByText(/3 unmarked/));
    expect(mockPush).toHaveBeenCalledWith('/admin/attendance/teacher');
  });

  it('shows 0 for rows with no unmarked days', async () => {
    mockGetPayrollList.mockResolvedValue({ success: true, data: [mockRow()] });
    await renderPayroll();
    const zeros = await screen.findAllByText('0');
    expect(zeros.length).toBeGreaterThanOrEqual(1);
  });
});

describe('PayrollPage — permissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPayrollList.mockResolvedValue({ success: true, data: [mockRow()] });
  });

  it('hides Bulk pay when canCreate is false', async () => {
    mockAyPermissions.mockReturnValue({ ...defaultPerms, canCreate: false });
    await renderPayroll();
    await screen.findByText('Pays');
    expect(screen.queryByText('Bulk pay')).not.toBeInTheDocument();
  });

  it('hides Pay/Extra actions when canCreate is false', async () => {
    mockAyPermissions.mockReturnValue({ ...defaultPerms, canCreate: false });
    await renderPayroll();
    await screen.findByText('Ahmed Khan');
    expect(screen.queryByText('Pay')).not.toBeInTheDocument();
    expect(screen.queryByText('Extra')).not.toBeInTheDocument();
  });

  it('shows read-only banner when readOnly', async () => {
    mockAyPermissions.mockReturnValue({ ...defaultPerms, readOnly: true });
    await renderPayroll();
    expect(await screen.findByText(/Archived year — you have read-only access/)).toBeInTheDocument();
  });
});

describe('PayrollPage — pay modal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAyPermissions.mockReturnValue(defaultPerms);
    mockGetPayrollList.mockResolvedValue({ success: true, data: [mockRow()] });
    mockRecordPayrollPayment.mockResolvedValue({ success: true, data: { voucherNumber: 'PV-001' } });
  });

  it('opens regular pay modal on Pay click', async () => {
    await renderPayroll();
    fireEvent.click((await screen.findAllByText('Pay'))[0]);
    expect(await screen.findByText(/Record payment — Ahmed Khan/)).toBeInTheDocument();
  });

  it('opens extra payment modal on Extra click', async () => {
    await renderPayroll();
    fireEvent.click((await screen.findAllByText('Extra'))[0]);
    expect(await screen.findByText(/Extra payment — Ahmed Khan/)).toBeInTheDocument();
  });

  it('shows balance and earned in modal', async () => {
    await renderPayroll();
    fireEvent.click((await screen.findAllByText('Pay'))[0]);
    expect(await screen.findByText(/Balance: 20,000/)).toBeInTheDocument();
    expect(screen.getByText(/Earned: 45,000/)).toBeInTheDocument();
  });

  test.each(['CASH', 'CHEQUE', 'BANK_TRANSFER', 'ONLINE'])(
    'shows payment method option: %s',
    async (method) => {
      await renderPayroll();
      fireEvent.click((await screen.findAllByText('Pay'))[0]);
      const select = await screen.findByDisplayValue('CASH');
      expect(select.querySelector(`option[value="${method}"]`)).toBeTruthy();
    },
  );

  it('closes modal on Cancel', async () => {
    await renderPayroll();
    fireEvent.click((await screen.findAllByText('Pay'))[0]);
    fireEvent.click(await screen.findByText('Cancel'));
    expect(screen.queryByText(/Record payment — Ahmed Khan/)).not.toBeInTheDocument();
  });

  it('pre-fills amount with closing balance for regular pay', async () => {
    await renderPayroll();
    fireEvent.click((await screen.findAllByText('Pay'))[0]);
    const amountInput = await screen.findByDisplayValue('20000');
    expect(amountInput).toBeInTheDocument();
  });

  it('pre-fills zero amount for extra payment', async () => {
    await renderPayroll();
    fireEvent.click((await screen.findAllByText('Extra'))[0]);
    const amountInput = await screen.findByDisplayValue('0');
    expect(amountInput).toBeInTheDocument();
  });

  it('does not submit when amount is zero', async () => {
    await renderPayroll();
    fireEvent.click((await screen.findAllByText('Extra'))[0]);
    fireEvent.click(await screen.findByText('Record'));
    expect(mockRecordPayrollPayment).not.toHaveBeenCalled();
  });

  it('records payment successfully', async () => {
    await renderPayroll();
    fireEvent.click((await screen.findAllByText('Pay'))[0]);
    fireEvent.click(await screen.findByText('Record'));
    await waitFor(() => expect(mockRecordPayrollPayment).toHaveBeenCalled());
    expect(mockShowToast).toHaveBeenCalledWith('success', expect.stringContaining('PV-001'));
  });

  it('sends correct payload on record', async () => {
    await renderPayroll();
    fireEvent.click((await screen.findAllByText('Pay'))[0]);
    fireEvent.click(await screen.findByText('Record'));
    await waitFor(() => expect(mockRecordPayrollPayment).toHaveBeenCalled());
    const payload = mockRecordPayrollPayment.mock.calls[0][0];
    expect(payload.payeeUserId).toBe('u-1');
    expect(payload.amount).toBe(20000);
    expect(payload.paymentMethod).toBe('CASH');
    expect(payload.paymentKind).toBe('REGULAR');
  });

  it('shows error toast when record fails', async () => {
    mockRecordPayrollPayment.mockResolvedValue({ success: false, message: 'Insufficient balance' });
    await renderPayroll();
    fireEvent.click((await screen.findAllByText('Pay'))[0]);
    fireEvent.click(await screen.findByText('Record'));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith('error', 'Insufficient balance'));
  });

  it('shows error toast when record throws', async () => {
    mockRecordPayrollPayment.mockRejectedValue(new Error('Network error'));
    await renderPayroll();
    fireEvent.click((await screen.findAllByText('Pay'))[0]);
    fireEvent.click(await screen.findByText('Record'));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith('error', 'Network error'));
  });
});

describe('PayrollPage — navigation and export', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAyPermissions.mockReturnValue(defaultPerms);
    mockGetPayrollList.mockResolvedValue({ success: true, data: [] });
    mockExportPayrollCsv.mockResolvedValue({ success: true, data: { filename: 'payroll.csv', csv: 'a,b' } });
  });

  it('navigates back to expenses on Payments click', async () => {
    await renderPayroll();
    fireEvent.click(await screen.findByText('Payments'));
    expect(mockPush).toHaveBeenCalledWith('/admin/expenses');
  });

  it('navigates to bulk pay page', async () => {
    await renderPayroll();
    fireEvent.click(await screen.findByText('Bulk pay'));
    expect(mockPush).toHaveBeenCalledWith('/admin/expenses/payroll/bulk');
  });

  it('navigates to reports page', async () => {
    await renderPayroll();
    fireEvent.click(await screen.findByText('Reports'));
    expect(mockPush).toHaveBeenCalledWith('/admin/expenses/reports');
  });

  it('reloads data when month changes', async () => {
    await renderPayroll();
    await waitFor(() => expect(mockGetPayrollList).toHaveBeenCalledTimes(1));
    const monthInput = await screen.findByDisplayValue(/\d{4}-\d{2}/);
    fireEvent.change(monthInput, { target: { value: '2025-01' } });
    await waitFor(() => expect(mockGetPayrollList).toHaveBeenCalledTimes(2));
    expect(mockGetPayrollList.mock.calls[1][0]).toBe('2025-01');
  });

  it('exports CSV on download click', async () => {
    await renderPayroll();
    const downloadBtn = document.querySelector('[title="Export CSV"]') as HTMLButtonElement;
    fireEvent.click(downloadBtn);
    await waitFor(() => expect(mockExportPayrollCsv).toHaveBeenCalled());
    expect(mockDownloadCsv).toHaveBeenCalledWith('payroll.csv', 'a,b');
  });

  it('shows error toast when export fails', async () => {
    mockExportPayrollCsv.mockRejectedValue(new Error('Export failed'));
    await renderPayroll();
    const downloadBtn = document.querySelector('[title="Export CSV"]') as HTMLButtonElement;
    fireEvent.click(downloadBtn);
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith('error', 'Export failed'));
  });

  it('shows error toast when load fails', async () => {
    mockGetPayrollList.mockRejectedValue(new Error('Load failed'));
    await renderPayroll();
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith('error', 'Failed to load payroll'));
  });
});
