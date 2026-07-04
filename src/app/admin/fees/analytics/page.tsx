'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3, TrendingUp, Users, AlertTriangle, Download, FileText, ArrowRight, RefreshCw,
  Calendar, CreditCard, Wallet,
} from 'lucide-react';
import config from '@/config';
import { api } from '@/lib/api';
import {
  FEE_MONTHS, formatPaise, formatPkr, paymentMethodLabel, classLabel, buildFeeScopeQuery, downloadCsv,
} from '@/lib/feeAnalytics';
import { FeeLineChart, FeeBarChart, FeeHorizontalBars } from '@/components/fees/FeeCharts';

type Period = 'today' | 'weekly' | 'monthly' | 'yearly' | 'full' | 'custom';

type AnalyticsData = {
  filters: { period: Period; from: string; to: string; month: number | null; year: number | null; groupId: string | null };
  summary: {
    totalDue: number; totalCollected: number; totalPaymentsInRange: number; outstanding: number;
    pendingCount: number; totalStudents: number; paymentCount: number; collectionRate: number;
    paymentRate: number; avgPayment: number; avgDuePerStudent: number;
  };
  statusBreakdown: { paid: number; partial: number; unpaid: number; overpaid: number };
  paymentMethods: { method: string; amount: number; count: number }[];
  classBreakdown: {
    groupId: string; groupName: string; section: string | null;
    students: number; total: number; collected: number; pending: number; rate: number;
  }[];
  topDefaulters: {
    id: string; studentName: string; groupName: string; section: string | null;
    due: number; paid: number; pending: number; status: string;
  }[];
  monthlyTrend: { month: number; year: number; label: string; due: number; collected: number; rate: number }[];
  lineTrend: { key: string; label: string; date: string; due: number; collected: number; rate: number; paymentCount: number }[];
  trendGranularity: 'daily' | 'monthly';
};

const STATUS_COLORS: Record<string, string> = {
  paid: '#22c55e', partial: '#eab308', unpaid: '#ef4444', overpaid: '#3b82f6',
};

const PERIOD_LABELS: Record<Period, string> = {
  today: 'Today', weekly: 'Last 7 Days', monthly: 'Monthly', yearly: 'Yearly',
  full: 'Full AY', custom: 'Custom Range',
};

function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function FeeAnalyticsPage() {
  const router = useRouter();
  const now = new Date();
  const [period, setPeriod] = useState<Period>('monthly');
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [customFrom, setCustomFrom] = useState(localDateStr(new Date(now.getTime() - 30 * 86400000)));
  const [customTo, setCustomTo] = useState(localDateStr(now));
  const [groupId, setGroupId] = useState('');
  const [sections, setSections] = useState<{ id: string; name: string; section?: string | null }[]>([]);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const branchId = typeof window !== 'undefined' ? localStorage.getItem('activeBranchId') : null;
  const ayId = typeof window !== 'undefined' ? localStorage.getItem('activeAYId') : null;

  useEffect(() => {
    if (!branchId || !ayId) return;
    api.getSections(branchId, ayId).then(d => { if (d.success) setSections(d.data || []); }).catch(() => {});
  }, [branchId, ayId]);

  const loadData = useCallback(async () => {
    if (!token || !ayId) return;
    if (period === 'custom' && (!customFrom || !customTo)) return;
    setLoading(true);
    try {
      const params: Record<string, string> = { period };
      if (period === 'monthly') {
        params.month = String(month + 1);
        params.year = String(year);
      } else if (period === 'yearly') {
        params.year = String(year);
      } else if (period === 'custom') {
        params.from = customFrom;
        params.to = customTo;
      }
      if (groupId) params.groupId = groupId;
      const res = await fetch(`${config.apiUrl}/admin/fees/analytics${buildFeeScopeQuery(params)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch {} finally { setLoading(false); }
  }, [token, ayId, period, month, year, customFrom, customTo, groupId]);

  useEffect(() => { loadData(); }, [loadData]);

  const summary = data?.summary;
  const maxTrend = useMemo(() => {
    if (!data?.monthlyTrend.length) return 1;
    return Math.max(...data.monthlyTrend.map(t => t.due), 1);
  }, [data]);

  const statusSegments = useMemo(() => {
    if (!data) return [];
    const b = data.statusBreakdown;
    return (['paid', 'partial', 'unpaid', 'overpaid'] as const)
      .map(k => [k, b[k]] as const)
      .filter(([, v]) => v > 0);
  }, [data]);

  const periodSlug = useMemo(() => {
    if (period === 'full') return 'full-ay';
    if (period === 'monthly') return `${FEE_MONTHS[month]}-${year}`;
    if (period === 'yearly') return `year-${year}`;
    if (period === 'custom') return `${customFrom}-to-${customTo}`;
    return period;
  }, [period, month, year, customFrom, customTo]);

  const exportClassCsv = () => {
    if (!data) return;
    downloadCsv(
      `fee-class-report-${periodSlug}.csv`,
      ['Class', 'Students', 'Total Due', 'Collected', 'Pending', 'Rate %'],
      data.classBreakdown.map(c => [
        classLabel(c.groupName, c.section), c.students,
        formatPaise(c.total), formatPaise(c.collected), formatPaise(c.pending), c.rate,
      ]),
    );
  };

  const exportDefaultersCsv = () => {
    if (!data) return;
    downloadCsv(
      `fee-defaulters-${periodSlug}.csv`,
      ['Student', 'Class', 'Due', 'Paid', 'Pending', 'Status'],
      data.topDefaulters.map(d => [
        d.studentName, classLabel(d.groupName, d.section),
        formatPaise(d.due), formatPaise(d.paid), formatPaise(d.pending), d.status,
      ]),
    );
  };

  if (!ayId) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-10">
        <p className="text-sm text-warm-muted">Select an academic year from the sidebar to view fee analytics.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BarChart3 size={24} className="text-warm-accent" />
          <div>
            <h1 className="text-xl font-light text-warm-cream">Fee Analytics</h1>
            <p className="text-xs text-warm-muted/60">Collection performance, trends & defaulters</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={loadData} className="rounded-lg border border-warm-card-border p-2 text-warm-muted hover:text-warm-cream">
            <RefreshCw size={14} />
          </button>
          <button onClick={() => router.push('/admin/fees/reports')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-warm-card-border px-3 py-2 text-xs text-warm-muted hover:text-warm-cream">
            <FileText size={13} /> Reports <ArrowRight size={12} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-warm-card-border bg-warm-card p-4 mb-6 space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {(['today', 'weekly', 'monthly', 'yearly', 'full', 'custom'] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${period === p ? 'bg-warm-accent text-[#1a1614] font-medium' : 'border border-warm-card-border text-warm-muted hover:text-warm-cream'}`}>
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {period === 'monthly' && (
            <>
              <select value={month} onChange={e => setMonth(Number(e.target.value))}
                className="rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent">
                {FEE_MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
              <input type="number" value={year} onChange={e => setYear(Number(e.target.value))}
                className="rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent w-20" />
            </>
          )}
          {period === 'yearly' && (
            <input type="number" value={year} onChange={e => setYear(Number(e.target.value))}
              className="rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent w-24" />
          )}
          {period === 'custom' && (
            <>
              <Calendar size={14} className="text-warm-muted" />
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                className="rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent" />
              <span className="text-xs text-warm-muted">to</span>
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                className="rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent" />
            </>
          )}
          <select value={groupId} onChange={e => setGroupId(e.target.value)}
            className="rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent min-w-[140px]">
            <option value="">All Classes</option>
            {sections.map(s => (
              <option key={s.id} value={s.id}>{classLabel(s.name, s.section)}</option>
            ))}
          </select>
        </div>
        {data?.filters && (
          <p className="text-[10px] text-warm-muted/40">
            Showing {PERIOD_LABELS[data.filters.period]} · {data.filters.from} → {data.filters.to}
            {data.filters.groupId ? ` · filtered by class` : ''}
          </p>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="h-28 animate-pulse rounded-xl bg-warm-card" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="h-48 animate-pulse rounded-xl bg-warm-card lg:col-span-2" />
            <div className="h-48 animate-pulse rounded-xl bg-warm-card" />
          </div>
        </div>
      ) : summary ? (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {[
              { label: 'Total Due', value: formatPkr(summary.totalDue), color: 'text-warm-cream', icon: Wallet },
              { label: 'Collected', value: formatPkr(summary.totalCollected), color: 'text-green-400', icon: TrendingUp },
              { label: 'Outstanding', value: formatPkr(summary.outstanding), color: 'text-red-400', icon: AlertTriangle },
              { label: 'Collection Rate', value: `${summary.collectionRate}%`, color: 'text-warm-accent', icon: BarChart3 },
              { label: 'Payments', value: `${summary.paymentCount}`, color: 'text-warm-cream', icon: CreditCard },
              { label: 'Avg Payment', value: formatPkr(summary.avgPayment), color: 'text-warm-cream', icon: Wallet },
            ].map(k => (
              <div key={k.label} className="rounded-xl border border-warm-card-border bg-warm-card p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] text-warm-muted/50 uppercase tracking-wide">{k.label}</p>
                  <k.icon size={12} className="text-warm-muted/30" />
                </div>
                <p className={`text-lg font-light ${k.color}`}>{k.value}</p>
              </div>
            ))}
          </div>

          {/* Line trend chart */}
          {data.lineTrend.length > 0 && (
            <div className="rounded-xl border border-warm-card-border bg-warm-card p-5 mb-6">
              <FeeLineChart
                data={data.lineTrend}
                title={`Collection Trend (${data.trendGranularity === 'daily' ? 'Daily' : 'Monthly'})`}
                subtitle={`Due vs collected · dashed line = collection rate %`}
                height={300}
              />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Collection progress */}
            <div className="rounded-xl border border-warm-card-border bg-warm-card p-5 lg:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-medium text-warm-cream flex items-center gap-2">
                  <TrendingUp size={16} className="text-warm-accent" /> Collection Progress
                </h2>
                <span className="text-2xl font-light text-warm-accent">{summary.collectionRate}%</span>
              </div>
              <div className="w-full h-3 bg-warm-card-border/20 rounded-full overflow-hidden mb-2">
                <div className="h-full rounded-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-500"
                  style={{ width: `${Math.min(summary.collectionRate, 100)}%` }} />
              </div>
              <p className="text-xs text-warm-muted/50">
                {formatPkr(summary.totalCollected)} collected of {formatPkr(summary.totalDue)} due
                {summary.totalPaymentsInRange !== summary.totalCollected && (
                  <> · {formatPkr(summary.totalPaymentsInRange)} received in period</>
                )}
              </p>
            </div>

            {/* Status breakdown */}
            <div className="rounded-xl border border-warm-card-border bg-warm-card p-5">
              <h2 className="text-sm font-medium text-warm-cream mb-3">Payment Status</h2>
              {statusSegments.length > 0 ? (
                <div className="space-y-2">
                  {statusSegments.map(([key, val]) => {
                    const total = summary.totalStudents || 1;
                    const pct = Math.round((val / total) * 100);
                    return (
                      <div key={key}>
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="text-warm-muted capitalize">{key}</span>
                          <span className="text-warm-cream">{val} ({pct}%)</span>
                        </div>
                        <div className="h-1.5 bg-warm-card-border/20 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: STATUS_COLORS[key] }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-warm-muted/40 py-6 text-center">No fee records for this period</p>
              )}
            </div>
          </div>

          {/* Monthly AY trend bar chart */}
          {data.monthlyTrend.length > 0 && (
            <div className="rounded-xl border border-warm-card-border bg-warm-card p-5 mb-6">
              <h2 className="text-sm font-medium text-warm-cream mb-4">Academic Year — Monthly Comparison</h2>
              <div className="flex items-end gap-2 h-36 overflow-x-auto pb-2">
                {data.monthlyTrend.map(t => {
                  const dueH = Math.round((t.due / maxTrend) * 100);
                  const colH = Math.round((t.collected / maxTrend) * 100);
                  return (
                    <div key={t.label} className="flex flex-col items-center min-w-[52px] flex-shrink-0">
                      <span className="text-[9px] text-warm-muted/50 mb-1">{t.rate}%</span>
                      <div className="relative w-8 h-24 flex items-end justify-center gap-0.5">
                        <div className="w-3 rounded-t bg-warm-card-border/40" style={{ height: `${dueH}%` }} title={`Due: ${formatPkr(t.due)}`} />
                        <div className="w-3 rounded-t bg-green-500/70" style={{ height: `${colH}%` }} title={`Collected: ${formatPkr(t.collected)}`} />
                      </div>
                      <span className="text-[9px] text-warm-muted/60 mt-1.5 text-center leading-tight">{t.label}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-4 mt-2 text-[10px] text-warm-muted/50">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-warm-card-border/60" /> Due</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-green-500/70" /> Collected</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Payment methods bar */}
            <div className="rounded-xl border border-warm-card-border bg-warm-card p-5">
              {data.paymentMethods.length > 0 ? (
                <FeeBarChart
                  title="Payment Methods"
                  data={data.paymentMethods.map(pm => ({
                    label: paymentMethodLabel(pm.method),
                    value: pm.amount,
                    color: pm.method === 'CASH' ? '#22c55e' : pm.method === 'BANK_TRANSFER' ? '#3b82f6' : '#b39a76',
                  }))}
                />
              ) : (
                <>
                  <h2 className="text-sm font-medium text-warm-cream mb-3">Payment Methods</h2>
                  <p className="text-xs text-warm-muted/40 py-4 text-center">No payments recorded</p>
                </>
              )}
            </div>

            {/* Class collection rates */}
            <div className="rounded-xl border border-warm-card-border bg-warm-card p-5">
              <FeeHorizontalBars
                title="Collection Rate by Class"
                data={data.classBreakdown.map(c => ({
                  label: classLabel(c.groupName, c.section),
                  value: c.collected,
                  max: c.total,
                  pct: c.rate,
                }))}
              />
            </div>

            {/* Top defaulters */}
            <div className="rounded-xl border border-warm-card-border bg-warm-card p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-medium text-warm-cream flex items-center gap-2">
                  <AlertTriangle size={16} className="text-red-400" /> Top Defaulters
                </h2>
                <button onClick={exportDefaultersCsv} className="text-[10px] text-warm-accent hover:underline flex items-center gap-1">
                  <Download size={11} /> CSV
                </button>
              </div>
              {data.topDefaulters.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {data.topDefaulters.slice(0, 10).map(d => (
                    <div key={d.id} className="flex items-center justify-between border-b border-warm-card-border/10 pb-2 last:border-0">
                      <div>
                        <p className="text-xs text-warm-cream">{d.studentName}</p>
                        <p className="text-[10px] text-warm-muted/50">{classLabel(d.groupName, d.section)}</p>
                      </div>
                      <span className="text-xs text-red-400 font-medium">{formatPkr(d.pending)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-green-400/70 py-4 text-center">All fees paid for this period</p>
              )}
            </div>
          </div>

          {/* Class breakdown table */}
          <div className="rounded-xl border border-warm-card-border overflow-hidden">
            <div className="p-4 border-b border-warm-card-border/30 flex items-center justify-between">
              <h2 className="text-sm font-medium text-warm-cream flex items-center gap-2">
                <Users size={16} className="text-warm-accent" /> Collection by Class
              </h2>
              <button onClick={exportClassCsv} className="text-xs text-warm-accent hover:underline flex items-center gap-1">
                <Download size={12} /> Export CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-warm-card/70">
                    <th className="text-left px-4 py-3 text-[10px] text-warm-muted font-medium">Class</th>
                    <th className="text-right px-4 py-3 text-[10px] text-warm-muted font-medium">Students</th>
                    <th className="text-right px-4 py-3 text-[10px] text-warm-muted font-medium">Due</th>
                    <th className="text-right px-4 py-3 text-[10px] text-warm-muted font-medium">Collected</th>
                    <th className="text-right px-4 py-3 text-[10px] text-warm-muted font-medium">Pending</th>
                    <th className="text-center px-4 py-3 text-[10px] text-warm-muted font-medium">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {data.classBreakdown.map(c => (
                    <tr key={c.groupId} className="border-t border-warm-card-border/20 hover:bg-warm-card/20">
                      <td className="px-4 py-3 text-xs text-warm-cream">{classLabel(c.groupName, c.section)}</td>
                      <td className="px-4 py-3 text-xs text-warm-muted text-right">{c.students}</td>
                      <td className="px-4 py-3 text-xs text-warm-muted text-right">{formatPaise(c.total)}</td>
                      <td className="px-4 py-3 text-xs text-green-400 text-right">{formatPaise(c.collected)}</td>
                      <td className="px-4 py-3 text-xs text-red-400 text-right">{formatPaise(c.pending)}</td>
                      <td className="px-4 py-3 text-xs text-center">
                        <span className={`font-medium ${c.rate >= 80 ? 'text-green-400' : c.rate >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {c.rate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.classBreakdown.length === 0 && (
                <div className="p-6 text-center text-xs text-warm-muted/40">No class data for this period</div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-8 text-center text-sm text-warm-muted">
          No analytics data available. Generate fees first.
        </div>
      )}
    </main>
  );
}
