export const FEE_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatPaise(paise: number): string {
  return (paise / 100).toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function formatPkr(paise: number): string {
  return `${formatPaise(paise)} PKR`;
}

export function paymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    CASH: 'Cash',
    CHEQUE: 'Cheque',
    BANK_TRANSFER: 'Bank Transfer',
    OTHER: 'Other',
  };
  return labels[method] || method.replace(/_/g, ' ');
}

export function classLabel(name: string, section?: string | null): string {
  return section ? `${name} — ${section}` : name;
}

export function buildFeeScopeQuery(extra?: Record<string, string | undefined>): string {
  if (typeof window === 'undefined') return '';
  const q = new URLSearchParams();
  const branchId = localStorage.getItem('activeBranchId');
  const academicYearId = localStorage.getItem('activeAYId');
  if (academicYearId) q.set('academicYearId', academicYearId);
  if (branchId) q.set('branchId', branchId);
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (v) q.set(k, v);
    }
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export type FeeReportPeriod = 'today' | 'weekly' | 'monthly' | 'yearly' | 'full' | 'custom';

export const FEE_PERIOD_LABELS: Record<FeeReportPeriod, string> = {
  today: 'Today',
  weekly: 'Last 7 Days',
  monthly: 'Monthly',
  yearly: 'Yearly',
  full: 'Full Academic Year',
  custom: 'Custom Range',
};

export function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function monthsInDateRange(from: string, to: string): { month: number; year: number }[] {
  const out: { month: number; year: number }[] = [];
  const start = new Date(from + 'T00:00:00');
  const end = new Date(to + 'T00:00:00');
  const cur = new Date(start.getFullYear(), start.getMonth(), 1);
  const endM = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cur <= endM) {
    out.push({ month: cur.getMonth() + 1, year: cur.getFullYear() });
    cur.setMonth(cur.getMonth() + 1);
  }
  return out;
}

export function feeStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PAID: 'Paid', PARTIAL: 'Partial', UNPAID: 'Unpaid', OVERPAID: 'Overpaid', NO_FEE: 'No Fee',
  };
  return labels[status] || status;
}

export function buildAnalyticsParams(opts: {
  period: FeeReportPeriod;
  month: number;
  year: number;
  customFrom: string;
  customTo: string;
  groupId: string;
}): Record<string, string> {
  const params: Record<string, string> = { period: opts.period };
  if (opts.period === 'monthly') {
    params.month = String(opts.month + 1);
    params.year = String(opts.year);
  } else if (opts.period === 'yearly') {
    params.year = String(opts.year);
  } else if (opts.period === 'custom') {
    params.from = opts.customFrom;
    params.to = opts.customTo;
  }
  if (opts.groupId) params.groupId = opts.groupId;
  return params;
}
