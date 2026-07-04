'use client';

import { useEffect, useState } from 'react';
import { FileText, Download, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { showToast } from '@/components/toast';
import config from '@/config';
import { api } from '@/lib/api';
import {
  FEE_MONTHS, formatPaise, formatPkr, paymentMethodLabel, classLabel, buildFeeScopeQuery,
  downloadCsv, FEE_PERIOD_LABELS, localDateStr, monthsInDateRange, feeStatusLabel,
  buildAnalyticsParams, type FeeReportPeriod,
} from '@/lib/feeAnalytics';
import { FEE_STATUS_OPTIONS, type FeeStatusFilter } from '@/lib/feeStatusFilter';

type ReportType = 'standard' | 'defaulter' | 'class-summary' | 'payment-methods' | 'monthly-trend' | 'collection-summary';

type ReportRow = {
  roll: string;
  name: string;
  section: string;
  due: number;
  paid: number;
  pending: number;
  status: string;
  rate: number;
  count?: number;
  method?: string;
  month?: string;
};

type ReportData = {
  title: string;
  generatedAt: string;
  total: number;
  reportType: ReportType;
  showSection: boolean;
  summary: {
    totalDue: number;
    totalCollected: number;
    outstanding: number;
    collectionRate: number;
    pendingCount: number;
    paymentCount: number;
    paid: number;
    partial: number;
    unpaid: number;
  };
  rows: ReportRow[];
  headers: string[];
};

const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  standard: 'Standard',
  defaulter: 'Defaulter List',
  'class-summary': 'Class Summary',
  'payment-methods': 'Payment Methods',
  'monthly-trend': 'Monthly Trend',
  'collection-summary': 'Collection Summary',
};

function todayStr(): string {
  return localDateStr(new Date());
}

function rowMatchesStatus(status: string, filter: FeeStatusFilter): boolean {
  if (!filter) return true;
  if (filter === 'paid') return status === 'PAID' || status === 'OVERPAID';
  if (filter === 'partial') return status === 'PARTIAL';
  if (filter === 'unpaid') return status === 'UNPAID';
  return true;
}

async function fetchAllStudentsList(
  token: string,
  params: Record<string, string>,
): Promise<any[]> {
  const all: any[] = [];
  let page = 1;
  let totalPages = 1;
  while (page <= totalPages) {
    const q = new URLSearchParams({ ...params, page: String(page), limit: '500' });
    const res = await fetch(`${config.apiUrl}/admin/fees/students-list?${q}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!json.success) break;
    all.push(...(json.data || []));
    totalPages = json.pagination?.totalPages || 1;
    page++;
  }
  return all;
}

async function fetchStudentRowsForPeriod(
  token: string,
  period: FeeReportPeriod,
  month: number,
  year: number,
  customFrom: string,
  customTo: string,
  groupId: string,
  ayId: string,
  branchId: string | null,
  statusFilter: FeeStatusFilter,
): Promise<ReportRow[]> {
  const baseParams: Record<string, string> = { academicYearId: ayId };
  if (branchId) baseParams.branchId = branchId;
  if (groupId) baseParams.groupId = groupId;
  if (statusFilter) baseParams.feeStatus = statusFilter;

  if (period === 'monthly') {
    const rows = await fetchAllStudentsList(token, {
      ...baseParams,
      period: 'month',
      month: String(month + 1),
      year: String(year),
    });
    return rows.map(r => ({
      roll: r.student?.rollNumber || '—',
      name: r.student?.name || '',
      section: classLabel(r.student?.group?.name || '', r.student?.group?.section),
      due: r.netAmount || 0,
      paid: r.paidAmount || 0,
      pending: Math.max(0, (r.netAmount || 0) - (r.paidAmount || 0)),
      status: r.status || 'NO_FEE',
      rate: r.netAmount ? Math.round(((r.paidAmount || 0) / r.netAmount) * 100) : 0,
    }));
  }

  if (period === 'full') {
    const rows = await fetchAllStudentsList(token, { ...baseParams, period: 'full' });
    return rows.map(r => ({
      roll: r.student?.rollNumber || '—',
      name: r.student?.name || '',
      section: classLabel(r.student?.group?.name || '', r.student?.group?.section),
      due: r.netAmount || 0,
      paid: r.paidAmount || 0,
      pending: Math.max(0, (r.netAmount || 0) - (r.paidAmount || 0)),
      status: r.status || 'NO_FEE',
      rate: r.netAmount ? Math.round(((r.paidAmount || 0) / r.netAmount) * 100) : 0,
    }));
  }

  // Multi-month periods: aggregate student-fees in range
  const from = period === 'today' ? todayStr()
    : period === 'weekly' ? localDateStr(new Date(Date.now() - 6 * 86400000))
    : period === 'yearly' ? `${year}-01-01`
    : period === 'custom' ? customFrom : '2000-01-01';
  const to = period === 'today' ? todayStr()
    : period === 'weekly' ? todayStr()
    : period === 'yearly' ? `${year}-12-31`
    : period === 'custom' ? customTo : '2100-12-31';

  const monthPairs = monthsInDateRange(from, to);
  const statusParam = statusFilter === 'paid' ? 'PAID,OVERPAID'
    : statusFilter === 'partial' ? 'PARTIAL'
    : statusFilter === 'unpaid' ? 'UNPAID' : '';

  const q = buildFeeScopeQuery({
    ...(groupId ? { groupId } : {}),
    ...(statusParam ? { status: statusParam } : {}),
  });
  const res = await fetch(`${config.apiUrl}/admin/student-fees${q}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!json.success) return [];

  const studentMap: Record<string, ReportRow> = {};
  for (const f of json.data || []) {
    const inRange = monthPairs.some(p => p.month === f.month && p.year === f.year);
    if (!inRange) continue;
    const sid = f.student?.id || f.studentId;
    if (!sid) continue;
    const extra = (f.extraItems || []).reduce((s: number, e: { amount: number }) => s + e.amount, 0);
    const due = f.netAmount + extra;
    if (!studentMap[sid]) {
      studentMap[sid] = {
        roll: f.student?.rollNumber || '—',
        name: f.student?.name || '',
        section: classLabel(f.student?.group?.name || '', f.student?.group?.section),
        due: 0, paid: 0, pending: 0, status: 'NO_FEE', rate: 0,
      };
    }
    studentMap[sid].due += due;
    studentMap[sid].paid += f.paidAmount || 0;
  }

  return Object.values(studentMap).map(r => {
    r.pending = Math.max(0, r.due - r.paid);
    r.rate = r.due ? Math.round((r.paid / r.due) * 100) : 0;
    r.status = r.due === 0 ? 'NO_FEE'
      : r.paid >= r.due ? (r.paid > r.due ? 'OVERPAID' : 'PAID')
      : r.paid > 0 ? 'PARTIAL' : 'UNPAID';
    return r;
  }).filter(r => rowMatchesStatus(r.status, statusFilter));
}

export default function FeeReportsPage() {
  const router = useRouter();
  const now = new Date();
  const [period, setPeriod] = useState<FeeReportPeriod>('monthly');
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [customFrom, setCustomFrom] = useState(localDateStr(new Date(now.getTime() - 30 * 86400000)));
  const [customTo, setCustomTo] = useState(todayStr());
  const [groupId, setGroupId] = useState('');
  const [statusFilter, setStatusFilter] = useState<FeeStatusFilter>('');
  const [reportType, setReportType] = useState<ReportType>('standard');
  const [defaulterThreshold, setDefaulterThreshold] = useState(100);
  const [sections, setSections] = useState<{ id: string; name: string; section?: string | null }[]>([]);
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);

  const branchId = typeof window !== 'undefined' ? localStorage.getItem('activeBranchId') : null;
  const ayId = typeof window !== 'undefined' ? localStorage.getItem('activeAYId') : null;
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    if (branchId && ayId) {
      api.getSections(branchId, ayId).then(d => { if (d.success) setSections(d.data || []); }).catch(() => {});
    }
  }, [branchId, ayId]);

  const buildPeriodLabel = () => {
    if (period === 'monthly') return `${FEE_MONTHS[month]} ${year}`;
    if (period === 'yearly') return `Year ${year}`;
    if (period === 'full') return 'Full Academic Year';
    if (period === 'custom') return `${customFrom} to ${customTo}`;
    return FEE_PERIOD_LABELS[period];
  };

  const generateReport = async () => {
    if (!token || !ayId) { showToast('error', 'Select an academic year'); return; }
    if (period === 'custom' && (!customFrom || !customTo)) {
      showToast('error', 'Select date range');
      return;
    }
    setLoading(true);
    setReport(null);

    try {
      const analyticsParams = buildAnalyticsParams({ period, month, year, customFrom, customTo, groupId });
      const res = await fetch(`${config.apiUrl}/admin/fees/analytics${buildFeeScopeQuery(analyticsParams)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!json.success) { showToast('error', 'Failed to load data'); setLoading(false); return; }
      const analytics = json.data;

      const classLabel_ = groupId
        ? (() => {
            const g = sections.find(s => s.id === groupId);
            return g ? classLabel(g.name, g.section) : 'Selected Class';
          })()
        : 'All Students';

      const periodLabel = buildPeriodLabel();
      const sfLabel = statusFilter
        ? FEE_STATUS_OPTIONS.find(o => o.value === statusFilter)?.label || statusFilter
        : '';
      const title = `${classLabel_} · ${REPORT_TYPE_LABELS[reportType]}${sfLabel ? ` · ${sfLabel}` : ''} · ${periodLabel}`;

      const summary = {
        totalDue: analytics.summary.totalDue,
        totalCollected: analytics.summary.totalCollected,
        outstanding: analytics.summary.outstanding,
        collectionRate: analytics.summary.collectionRate,
        pendingCount: analytics.summary.pendingCount,
        paymentCount: analytics.summary.paymentCount,
        paid: analytics.statusBreakdown.paid,
        partial: analytics.statusBreakdown.partial,
        unpaid: analytics.statusBreakdown.unpaid,
      };

      const showSection = !groupId;
      let rows: ReportRow[] = [];
      let headers: string[] = [];

      if (reportType === 'standard' || reportType === 'defaulter') {
        rows = await fetchStudentRowsForPeriod(
          token, period, month, year, customFrom, customTo, groupId, ayId, branchId, statusFilter,
        );
        if (reportType === 'defaulter') {
          rows = rows
            .filter(r => r.pending > 0 || r.rate < defaulterThreshold)
            .sort((a, b) => b.pending - a.pending);
        } else {
          rows.sort((a, b) => b.pending - a.pending);
        }
        headers = showSection
          ? ['Roll', 'Class', 'Name', 'Due', 'Paid', 'Pending', 'Status', 'Rate']
          : ['Roll', 'Name', 'Due', 'Paid', 'Pending', 'Status', 'Rate'];
      } else if (reportType === 'class-summary') {
        rows = (analytics.classBreakdown || []).map((c: any) => ({
          roll: '—',
          name: classLabel(c.groupName, c.section),
          section: classLabel(c.groupName, c.section),
          due: c.total,
          paid: c.collected,
          pending: c.pending,
          status: `${c.rate}%`,
          rate: c.rate,
          count: c.students,
        }));
        headers = ['Class', 'Students', 'Due', 'Collected', 'Pending', 'Rate'];
      } else if (reportType === 'payment-methods') {
        rows = (analytics.paymentMethods || []).map((m: any) => ({
          roll: '—',
          name: paymentMethodLabel(m.method),
          section: '',
          due: m.amount,
          paid: 0,
          pending: 0,
          status: String(m.count),
          rate: analytics.summary.totalCollected
            ? Math.round((m.amount / analytics.summary.totalCollected) * 100) : 0,
          method: m.method,
        }));
        headers = ['Method', 'Amount', 'Transactions', 'Share %'];
      } else if (reportType === 'monthly-trend') {
        const trend = analytics.trendGranularity === 'daily' && analytics.lineTrend?.length
          ? analytics.lineTrend
          : analytics.monthlyTrend || [];
        rows = trend.map((t: any) => ({
          roll: '—',
          name: t.label,
          section: '',
          due: t.due,
          paid: t.collected,
          pending: Math.max(0, t.due - t.collected),
          status: `${t.rate}%`,
          rate: t.rate,
          month: t.label,
        }));
        headers = ['Period', 'Due', 'Collected', 'Pending', 'Rate'];
      } else {
        rows = [
          { roll: '—', name: 'Total Due', section: '', due: summary.totalDue, paid: 0, pending: 0, status: '', rate: 0 },
          { roll: '—', name: 'Collected', section: '', due: 0, paid: summary.totalCollected, pending: 0, status: '', rate: 0 },
          { roll: '—', name: 'Outstanding', section: '', due: 0, paid: 0, pending: summary.outstanding, status: '', rate: 0 },
          { roll: '—', name: 'Collection Rate', section: '', due: 0, paid: 0, pending: 0, status: `${summary.collectionRate}%`, rate: summary.collectionRate },
          { roll: '—', name: 'Paid Records', section: '', due: 0, paid: summary.paid, pending: 0, status: '', rate: 0 },
          { roll: '—', name: 'Partial Records', section: '', due: 0, paid: summary.partial, pending: 0, status: '', rate: 0 },
          { roll: '—', name: 'Unpaid Records', section: '', due: 0, paid: summary.unpaid, pending: 0, status: '', rate: 0 },
          { roll: '—', name: 'Payments in Period', section: '', due: 0, paid: summary.paymentCount, pending: 0, status: '', rate: 0 },
        ];
        headers = ['Metric', 'Value'];
      }

      setReport({
        title,
        generatedAt: new Date().toLocaleString(),
        total: rows.length,
        reportType,
        showSection,
        summary,
        rows,
        headers,
      });
    } catch {
      showToast('error', 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (!report) return;
    const csvRows = report.rows.map(r => {
      if (report.reportType === 'class-summary') {
        return [r.name, r.count ?? 0, formatPaise(r.due), formatPaise(r.paid), formatPaise(r.pending), `${r.rate}%`];
      }
      if (report.reportType === 'payment-methods') {
        return [r.name, formatPaise(r.due), r.status, `${r.rate}%`];
      }
      if (report.reportType === 'monthly-trend') {
        return [r.name, formatPaise(r.due), formatPaise(r.paid), formatPaise(r.pending), `${r.rate}%`];
      }
      if (report.reportType === 'collection-summary') {
        if (r.name === 'Collection Rate') return [r.name, r.status];
        if (r.name === 'Payments in Period') return [r.name, String(r.paid)];
        if (r.name === 'Paid Records' || r.name === 'Partial Records' || r.name === 'Unpaid Records') {
          return [r.name, String(r.paid)];
        }
        if (r.name === 'Outstanding') return [r.name, formatPaise(r.pending)];
        if (r.name === 'Collected') return [r.name, formatPaise(r.paid)];
        return [r.name, formatPaise(r.due)];
      }
      const base = report.showSection
        ? [r.roll, r.section, r.name, formatPaise(r.due), formatPaise(r.paid), formatPaise(r.pending), feeStatusLabel(r.status), `${r.rate}%`]
        : [r.roll, r.name, formatPaise(r.due), formatPaise(r.paid), formatPaise(r.pending), feeStatusLabel(r.status), `${r.rate}%`];
      return base;
    });
    downloadCsv(
      (report.title || 'fee-report').replace(/[^a-z0-9]/gi, '_') + '.csv',
      report.headers,
      csvRows,
    );
  };

  const downloadPDF = () => {
    if (!report) return;
    const win = window.open('', '_blank');
    if (!win) return;

    const th = report.headers.map(h => `<th>${h}</th>`).join('');
    const tr = report.rows.map(r => {
      if (report.reportType === 'class-summary') {
        return `<tr><td>${r.name}</td><td>${r.count}</td><td>${formatPaise(r.due)}</td><td>${formatPaise(r.paid)}</td><td>${formatPaise(r.pending)}</td><td class="pct">${r.rate}%</td></tr>`;
      }
      if (report.reportType === 'payment-methods') {
        return `<tr><td>${r.name}</td><td>${formatPaise(r.due)}</td><td>${r.status}</td><td class="pct">${r.rate}%</td></tr>`;
      }
      if (report.reportType === 'monthly-trend') {
        return `<tr><td>${r.name}</td><td>${formatPaise(r.due)}</td><td>${formatPaise(r.paid)}</td><td>${formatPaise(r.pending)}</td><td class="pct">${r.rate}%</td></tr>`;
      }
      if (report.reportType === 'collection-summary') {
        const val = r.name === 'Collection Rate' ? r.status
          : r.name === 'Payments in Period' || r.name.includes('Records') ? String(r.paid)
          : r.name === 'Outstanding' ? formatPaise(r.pending)
          : r.name === 'Collected' ? formatPaise(r.paid)
          : formatPaise(r.due);
        return `<tr><td>${r.name}</td><td>${val}</td></tr>`;
      }
      const cells = report.showSection
        ? `<td>${r.roll}</td><td>${r.section}</td><td>${r.name}</td><td>${formatPaise(r.due)}</td><td>${formatPaise(r.paid)}</td><td>${formatPaise(r.pending)}</td><td>${feeStatusLabel(r.status)}</td><td class="pct">${r.rate}%</td>`
        : `<td>${r.roll}</td><td>${r.name}</td><td>${formatPaise(r.due)}</td><td>${formatPaise(r.paid)}</td><td>${formatPaise(r.pending)}</td><td>${feeStatusLabel(r.status)}</td><td class="pct">${r.rate}%</td>`;
      return `<tr>${cells}</tr>`;
    }).join('');

    win.document.write(`
      <html><head><title>${report.title}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #222; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        .meta { font-size: 12px; color: #666; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { background: #f0f0f0; text-align: left; padding: 8px; border-bottom: 2px solid #ddd; }
        td { padding: 6px 8px; border-bottom: 1px solid #eee; }
        .pct { font-weight: bold; }
        .summary { margin-bottom: 20px; font-size: 13px; }
        .summary span { margin-right: 16px; }
        .green { color: #16a34a; } .red { color: #dc2626; } .yellow { color: #ca8a04; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      <h1>${report.title}</h1>
      <div class="meta">Generated: ${report.generatedAt} · ${report.total} records</div>
      <div class="summary">
        <span>Due: <strong>${formatPkr(report.summary.totalDue)}</strong></span>
        <span class="green">Collected: ${formatPkr(report.summary.totalCollected)}</span>
        <span class="red">Outstanding: ${formatPkr(report.summary.outstanding)}</span>
        <span>Rate: <strong>${report.summary.collectionRate}%</strong></span>
      </div>
      <table><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table>
      </body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  };

  const renderCell = (r: ReportRow, header: string) => {
    if (report?.reportType === 'class-summary') {
      if (header === 'Class') return r.name;
      if (header === 'Students') return r.count ?? 0;
      if (header === 'Due') return formatPaise(r.due);
      if (header === 'Collected') return formatPaise(r.paid);
      if (header === 'Pending') return formatPaise(r.pending);
      if (header === 'Rate') return `${r.rate}%`;
    }
    if (report?.reportType === 'payment-methods') {
      if (header === 'Method') return r.name;
      if (header === 'Amount') return formatPaise(r.due);
      if (header === 'Transactions') return r.status;
      if (header === 'Share %') return `${r.rate}%`;
    }
    if (report?.reportType === 'monthly-trend') {
      if (header === 'Period') return r.name;
      if (header === 'Due') return formatPaise(r.due);
      if (header === 'Collected') return formatPaise(r.paid);
      if (header === 'Pending') return formatPaise(r.pending);
      if (header === 'Rate') return `${r.rate}%`;
    }
    if (report?.reportType === 'collection-summary') {
      if (header === 'Metric') return r.name;
      if (header === 'Value') {
        if (r.name === 'Collection Rate') return r.status;
        if (r.name === 'Payments in Period' || r.name.includes('Records')) return String(r.paid);
        if (r.name === 'Outstanding') return formatPaise(r.pending);
        if (r.name === 'Collected') return formatPaise(r.paid);
        return formatPaise(r.due);
      }
    }
    if (header === 'Roll') return r.roll;
    if (header === 'Class') return r.section;
    if (header === 'Name') return r.name;
    if (header === 'Due') return formatPaise(r.due);
    if (header === 'Paid') return formatPaise(r.paid);
    if (header === 'Pending') return <span className="text-red-400">{formatPaise(r.pending)}</span>;
    if (header === 'Status') return feeStatusLabel(r.status);
    if (header === 'Rate') return `${r.rate}%`;
    return '';
  };

  if (!ayId) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-10">
        <p className="text-sm text-warm-muted">Select an academic year from the sidebar to generate fee reports.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex items-center gap-3">
        <FileText size={22} className="text-warm-accent" />
        <div>
          <h1 className="text-xl font-light text-warm-cream">Fee Reports</h1>
          <p className="text-xs text-warm-muted/60">
            Generate printable reports ·{' '}
            <button onClick={() => router.push('/admin/fees/analytics')} className="text-warm-accent hover:underline">
              View Analytics
            </button>
          </p>
        </div>
      </div>

      {/* Filters — same layout pattern as attendance reports */}
      <div className="rounded-xl border border-warm-card-border bg-warm-card p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className={reportType === 'class-summary' ? 'opacity-30 pointer-events-none' : ''}>
            <label className="block text-[10px] text-warm-muted/60 uppercase tracking-wider mb-1.5">Class</label>
            <select value={groupId} onChange={e => setGroupId(e.target.value)}
              className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent">
              <option value="">All Students</option>
              {sections.map(s => (
                <option key={s.id} value={s.id}>{classLabel(s.name, s.section)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-warm-muted/60 uppercase tracking-wider mb-1.5">Period</label>
            <div className="flex flex-wrap gap-1">
              {(['today', 'weekly', 'monthly', 'yearly', 'full', 'custom'] as FeeReportPeriod[]).map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`rounded-lg px-2 py-1.5 text-[10px] transition-colors ${period === p ? 'bg-warm-accent text-[#1a1614] font-medium' : 'border border-warm-card-border text-warm-muted hover:text-warm-cream'}`}>
                  {p === 'today' ? 'Today' : p === 'weekly' ? 'Weekly' : p === 'monthly' ? 'Monthly' : p === 'yearly' ? 'Yearly' : p === 'full' ? 'Full AY' : 'Custom'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-warm-muted/60 uppercase tracking-wider mb-1.5">Report Type</label>
            <select value={reportType} onChange={e => setReportType(e.target.value as ReportType)}
              className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent">
              {(Object.keys(REPORT_TYPE_LABELS) as ReportType[]).map(t => (
                <option key={t} value={t}>{REPORT_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={'mb-4' + (reportType === 'defaulter' ? ' opacity-30 pointer-events-none' : '')}>
          <label className="block text-[10px] text-warm-muted/60 uppercase tracking-wider mb-1.5">Filter by Status</label>
          <div className="flex flex-wrap gap-1">
            {FEE_STATUS_OPTIONS.map(opt => (
              <button key={opt.value} onClick={() => setStatusFilter(opt.value)}
                className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
                  statusFilter === opt.value
                    ? 'bg-warm-accent text-[#1a1614] font-medium'
                    : 'border border-warm-card-border text-warm-muted hover:text-warm-cream'
                }`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {period === 'monthly' && (
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-[10px] text-warm-muted/60 uppercase tracking-wider mb-1.5">Month</label>
              <select value={month} onChange={e => setMonth(Number(e.target.value))}
                className="rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent">
                {FEE_MONTHS.map((m, i) => <option key={i} value={i}>{m} {year}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-warm-muted/60 uppercase tracking-wider mb-1.5">Year</label>
              <input type="number" value={year} onChange={e => setYear(Number(e.target.value))}
                className="rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent w-24" />
            </div>
          </div>
        )}

        {period === 'yearly' && (
          <div className="mb-4">
            <label className="block text-[10px] text-warm-muted/60 uppercase tracking-wider mb-1.5">Year</label>
            <input type="number" value={year} onChange={e => setYear(Number(e.target.value))}
              className="rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent w-24" />
          </div>
        )}

        {period === 'custom' && (
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-[10px] text-warm-muted/60 uppercase tracking-wider mb-1.5">From</label>
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                className="rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent" />
            </div>
            <div>
              <label className="block text-[10px] text-warm-muted/60 uppercase tracking-wider mb-1.5">To</label>
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                className="rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent" />
            </div>
          </div>
        )}

        {reportType === 'defaulter' && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[10px] text-warm-muted/60 uppercase tracking-wider">Pending or below</span>
            <input type="number" value={defaulterThreshold} onChange={e => setDefaulterThreshold(Number(e.target.value))}
              min={0} max={100} className="w-16 rounded-lg border border-warm-card-border bg-[#1a1614] px-2 py-1.5 text-xs text-warm-cream text-center outline-none focus:border-warm-accent" />
            <span className="text-[10px] text-warm-muted/60">% collection rate</span>
          </div>
        )}

        <button onClick={generateReport} disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg bg-warm-accent px-6 py-2.5 text-sm font-medium text-[#1a1614] hover:bg-[#b39a76] disabled:opacity-50 transition-colors">
          {loading ? <RefreshCw size={15} className="animate-spin" /> : <FileText size={15} />}
          {loading ? 'Generating…' : 'Generate Report'}
        </button>
      </div>

      {/* Report output */}
      {report && (
        <div className="rounded-xl border border-warm-card-border overflow-hidden">
          <div className="bg-warm-card/70 px-5 py-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-medium text-warm-cream">{report.title}</h2>
              <p className="text-[10px] text-warm-muted/50 mt-0.5">{report.generatedAt} · {report.total} records</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={downloadCSV}
                className="inline-flex items-center gap-1.5 rounded-lg border border-warm-card-border px-3 py-1.5 text-xs text-warm-cream hover:bg-warm-card transition-colors">
                CSV
              </button>
              <button onClick={downloadPDF}
                className="inline-flex items-center gap-1.5 rounded-lg border border-warm-card-border px-3 py-1.5 text-xs text-warm-cream hover:bg-warm-card transition-colors">
                <Download size={13} /> Download / Print
              </button>
              <button onClick={generateReport}
                className="inline-flex items-center gap-1.5 rounded-lg border border-warm-card-border px-3 py-1.5 text-xs text-warm-muted hover:text-warm-cream transition-colors">
                <RefreshCw size={13} /> Regenerate
              </button>
            </div>
          </div>

          <div className="px-5 py-3 border-t border-warm-card-border/30 flex flex-wrap gap-4 text-xs text-warm-muted/70">
            <span>Due: <span className="text-warm-cream font-medium">{formatPkr(report.summary.totalDue)}</span></span>
            <span>Collected: <span className="text-green-400 font-medium">{formatPkr(report.summary.totalCollected)}</span></span>
            <span>Outstanding: <span className="text-red-400 font-medium">{formatPkr(report.summary.outstanding)}</span></span>
            <span>Rate: <span className="text-warm-accent font-medium">{report.summary.collectionRate}%</span></span>
            <span>Paid: <span className="text-green-400">{report.summary.paid}</span></span>
            <span>Partial: <span className="text-yellow-400">{report.summary.partial}</span></span>
            <span>Unpaid: <span className="text-red-400">{report.summary.unpaid}</span></span>
          </div>

          <div className="overflow-x-auto border-t border-warm-card-border/30 max-h-[32rem] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-warm-card/90 backdrop-blur-sm">
                <tr>
                  {report.headers.map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-[10px] text-warm-muted font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.rows.map((r, i) => (
                  <tr key={i} className="border-t border-warm-card-border/20 hover:bg-warm-card/20 transition-colors">
                    {report.headers.map(h => (
                      <td key={h} className="px-4 py-2 text-xs text-warm-cream">{renderCell(r, h)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {report.rows.length === 0 && (
              <div className="p-8 text-center text-xs text-warm-muted/40">No records match this report criteria</div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
