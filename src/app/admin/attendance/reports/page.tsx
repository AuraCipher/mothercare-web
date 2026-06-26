'use client';

import { useEffect, useState } from 'react';
import { FileText, Download, Printer, RefreshCw, Calendar, Users, ChevronDown } from 'lucide-react';
import { showToast } from '@/components/toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

type ReportData = {
  title: string;
  generatedAt: string;
  total: number;
  statusFilter: string;
  isSingleDay: boolean;
  showSection: boolean;
  summary: { present: number; absent: number; late: number; leave: number; halfDay: number; holiday: number; function: number; total: number; percentage: number; statusCount?: number; statusPercent?: number };
  students: { name: string; roll: string; section?: string; present: number; absent: number; late: number; percent: number; statusCount?: number; statusPercent?: number; status?: string }[];
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function todayStr(): string {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

const STATUS_LABELS: Record<string, string> = { present: 'Present', absent: 'Absent', late: 'Late', leave: 'Leave', 'half-day': 'Half-Day', holiday: 'Holiday', function: 'Function' };

export default function ReportsPage() {
  const [reportTarget, setReportTarget] = useState<'student' | 'teacher'>('student');
  const [groupId, setGroupId] = useState('');
  const [period, setPeriod] = useState<'daily' | 'monthly' | 'full' | 'custom'>('monthly');
  const [reportDate, setReportDate] = useState(todayStr());
  const [reportType, setReportType] = useState<'standard' | 'absentee' | 'class-summary'>('standard');
  const [sections, setSections] = useState<any[]>([]);
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [absenteeThreshold, setAbsenteeThreshold] = useState(75);
  const [statusFilter, setStatusFilter] = useState('');

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const branchId = typeof window !== 'undefined' ? localStorage.getItem('activeBranchId') : null;
  const ayId = typeof window !== 'undefined' ? localStorage.getItem('activeAYId') : null;
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    if (branchId && ayId) {
      fetch(`${API_URL}/admin/branches/${branchId}/academic-years/${ayId}/sections`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json()).then(d => { if (d.success) setSections(d.data); }).catch(() => {});
    }
  }, [branchId, ayId, token]);

  const buildDateRange = () => {
    if (period === 'daily') return { from: reportDate, to: reportDate };
    if (period === 'monthly') {
      const y = now.getFullYear();
      const m = String(month + 1).padStart(2, '0');
      const lastDay = new Date(y, month + 1, 0).getDate();
      return { from: `${y}-${m}-01`, to: `${y}-${m}-${String(lastDay).padStart(2, '0')}` };
    }
    if (period === 'full') return { from: '2025-08-01', to: '2026-06-30' };
    return { from: fromDate, to: toDate };
  };

  const generateReport = async () => {
    if (!token) return;
    setLoading(true);
    setReport(null);
    setGenerated(false);

    const { from, to } = buildDateRange();
    if (!from || !to) { showToast('error', 'Select date range'); setLoading(false); return; }
    const isSingleDay = from === to;

    // Load attendance data
    const isTeacher = reportTarget === 'teacher';
    const url = isTeacher
      ? `${API_URL}/admin/attendance/teachers?from=${from}&to=${to}`
      : groupId
        ? `${API_URL}/admin/attendance?from=${from}&to=${to}&groupId=${groupId}`
        : `${API_URL}/admin/attendance?from=${from}&to=${to}`;

    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (!json.success) { showToast('error', 'Failed to load data'); setLoading(false); return; }

      const items = json.data || [];
      const summary: any = { present: 0, absent: 0, late: 0, leave: 0, halfDay: 0, holiday: 0, function: 0, total: 0, percentage: 0, statusCount: 0, statusPercent: 0 };
      const rows: any[] = [];
      const sf = statusFilter;
      const sfLabel = STATUS_LABELS[sf] || sf;

      const showSection = !groupId && !isTeacher;
      const getSection = (gId: string) => {
        const g = sections.find((sec: any) => sec.id === gId);
        return g ? (g.section ? `${g.name} — ${g.section}` : g.name) : '';
      };

      for (const s of items) {
        const atts = s.attendances || [];
        const dayStatus = isSingleDay && atts.length > 0 ? atts[0].status : '';
        const sectionLabel = showSection ? getSection(s.groupId) : '';
        if (sf) {
          // Status filter mode: count matching records
          const statusCount = atts.filter((a: any) => a.status === sf).length;
          if (statusCount === 0) continue; // Skip students not matching the filter
          const totalRec = atts.length;
          summary.statusCount = (summary.statusCount || 0) + statusCount;
          summary.total += totalRec;
          rows.push({ name: s.name, roll: isTeacher ? '—' : (s.rollNumber || '—'), section: sectionLabel, status: dayStatus, present: 0, absent: 0, late: 0, statusCount, statusPercent: totalRec ? Math.round((statusCount / totalRec) * 100) : 0, percent: totalRec ? Math.round((statusCount / totalRec) * 100) : 0 });
        } else {
          // Standard mode: full P/A/L breakdown
          const p = atts.filter((a: any) => a.status === 'present' || a.status === 'holiday').length;
          const a = atts.filter((a: any) => a.status === 'absent').length;
          const l = atts.filter((a: any) => a.status === 'late').length;
          const lv = atts.filter((a: any) => a.status === 'leave').length;
          const totalRec = p + a + l + lv;
          summary.present += p; summary.absent += a; summary.late += l;
          summary.leave += lv; summary.total += totalRec;
          rows.push({ name: s.name, roll: isTeacher ? '—' : (s.rollNumber || '—'), section: sectionLabel, status: dayStatus, present: p, absent: a, late: l, percent: totalRec ? Math.round((p / totalRec) * 100) : 0 });
        }
      }

      if (sf) {
        rows.sort((a: any, b: any) => (b.statusCount || 0) - (a.statusCount || 0));
        summary.statusPercent = summary.total ? Math.round(((summary.statusCount || 0) / summary.total) * 100) : 0;
        summary.percentage = summary.statusPercent;
      } else {
        rows.sort((a, b) => b.percent - a.percent);
        summary.percentage = summary.total ? Math.round((summary.present / summary.total) * 100) : 0;
      }

      const periodLabel = period === 'monthly' ? MONTHS[month] + ' ' + now.getFullYear() : period === 'full' ? 'Full Academic Year' : from + ' to ' + to;
      const label = isTeacher ? null : (groupId ? sections.find((s: any) => s.id === groupId) : null);
      const prefix = isTeacher ? 'All Teachers' : (label?.name ? label.name + (label.section ? ' — ' + label.section : '') : 'All Students');
      const title = prefix + ' · ' + (sf ? sfLabel + ' · ' : '') + periodLabel;
      const statusFilterLabel = sf;

      setReport({ title, generatedAt: new Date().toLocaleString(), total: rows.length, statusFilter: statusFilterLabel, isSingleDay, showSection, summary, students: rows });
      setGenerated(true);
    } catch { showToast('error', 'Failed to generate report'); }
    finally { setLoading(false); }
  };

  const downloadCSV = () => {
    if (!report) return;
    const isTeacher = reportTarget === 'teacher';
    const sf = report.statusFilter;
    const sfLabel = STATUS_LABELS[sf] || sf;
    let csv: string;
    if (sf && report.isSingleDay) {
      csv = isTeacher ? 'Name\n' : 'Roll,Name\n';
      for (const s of report.students) csv += isTeacher ? s.name + '\n' : s.roll + ',' + s.name + '\n';
    } else if (sf) {
      csv = isTeacher ? `Name,${sfLabel},Percent\n` : `Roll,Name,${sfLabel},Percent\n`;
      for (const s of report.students) csv += isTeacher
        ? s.name + ',' + (s as any).statusCount + ',' + (s as any).statusPercent + '\n'
        : s.roll + ',' + s.name + ',' + (s as any).statusCount + ',' + (s as any).statusPercent + '\n';
    } else if (report.isSingleDay) {
      csv = isTeacher ? 'Name,Status\n' : 'Roll,Name,Status\n';
      for (const s of report.students) csv += isTeacher
        ? s.name + ',' + (STATUS_LABELS[(s as any).status] || (s as any).status || '—') + '\n'
        : s.roll + ',' + s.name + ',' + (STATUS_LABELS[(s as any).status] || (s as any).status || '—') + '\n';
    } else {
      csv = isTeacher ? 'Name,Present,Absent,Late,Percent\n' : 'Roll,Name,Present,Absent,Late,Percent\n';
      for (const s of report.students) csv += isTeacher
        ? s.name + ',' + s.present + ',' + s.absent + ',' + s.late + ',' + s.percent + '\n'
        : s.roll + ',' + s.name + ',' + s.present + ',' + s.absent + ',' + s.late + ',' + s.percent + '\n';
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = (report.title || 'report').replace(/[^a-z0-9]/gi, '_') + '.csv';
    a.click(); URL.revokeObjectURL(url);
  };

  const downloadPDF = () => {
    if (!report) return;
    const isTeacher = reportTarget === 'teacher';
    const sf = report.statusFilter;
    const sfLabel = STATUS_LABELS[sf] || sf;
    const win = window.open('', '_blank');
    if (!win) return;
    const thRoll = isTeacher ? '' : '<th>Roll</th>';
    const tdRoll = (s: any) => isTeacher ? '' : `<td>${s.roll}</td>`;
    let rows: string;
    let thExtra: string;
    let tdExtra: (s: any) => string;
    if (sf && report.isSingleDay) {
      thExtra = '';
      tdExtra = () => '';
      rows = report.students.map(s => `<tr>${tdRoll(s)}<td>${s.name}</td></tr>`).join('');
    } else if (sf) {
      thExtra = `<th>${sfLabel}</th><th>%</th>`;
      tdExtra = (s: any) => `<td>${s.statusCount || 0}</td><td class="pct">${s.statusPercent || 0}%</td>`;
      rows = report.students.map(s => `<tr>${tdRoll(s)}<td>${s.name}</td>${tdExtra(s)}</tr>`).join('');
    } else if (report.isSingleDay) {
      thExtra = '<th>Status</th>';
      tdExtra = (s: any) => `<td>${STATUS_LABELS[(s as any).status] || (s as any).status || '—'}</td>`;
      rows = report.students.map(s => `<tr>${tdRoll(s)}<td>${s.name}</td>${tdExtra(s)}</tr>`).join('');
    } else {
      thExtra = '<th>P</th><th>A</th><th>L</th><th>%</th>';
      tdExtra = (s: any) => `<td>${s.present}</td><td>${s.absent}</td><td>${s.late}</td><td class="pct">${s.percent}%</td>`;
      rows = report.students.map(s => `<tr>${tdRoll(s)}<td>${s.name}</td>${tdExtra(s)}</tr>`).join('');
    }
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
      <div class="meta">Generated: ${report.generatedAt} · ${report.total} ${isTeacher ? 'teachers' : 'students'}</div>
      <div class="summary">
        ${sf ? `<span>${sfLabel}: <strong>${report.summary.statusCount || 0}</strong> (${report.summary.statusPercent || 0}%)</span>` : `<span class="green">P ${report.summary.present}</span><span class="red">A ${report.summary.absent}</span><span class="yellow">L ${report.summary.late}</span><span>Lv ${report.summary.leave}</span><span>%: <strong>${report.summary.percentage}%</strong></span>`}
      </div>
      <table><thead><tr>${thRoll}<th>Name</th>${thExtra}</tr></thead><tbody>${rows}</tbody></table>
      </body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex items-center gap-3">
        <FileText size={22} className="text-warm-accent" />
        <h1 className="text-xl font-light text-warm-cream">Attendance Reports</h1>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-warm-card-border bg-warm-card p-5 mb-6">
        {/* Row 1: Target, Class, Period */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-[10px] text-warm-muted/60 uppercase tracking-wider mb-1.5">Report For</label>
            <div className="flex gap-1">
              {(['student', 'teacher'] as const).map(t => (
                <button key={t} onClick={() => { setReportTarget(t); setReport(null); }}
                  className={`flex-1 rounded-lg py-2 text-xs transition-colors ${reportTarget === t ? 'bg-warm-accent text-[#1a1614] font-medium' : 'border border-warm-card-border text-warm-muted hover:text-warm-cream'}`}>
                  {t === 'student' ? 'Students' : 'Teachers'}
                </button>
              ))}
            </div>
          </div>

          <div className={reportTarget === 'teacher' ? 'opacity-30 pointer-events-none' : ''}>
            <label className="block text-[10px] text-warm-muted/60 uppercase tracking-wider mb-1.5">Class</label>
            <select value={reportTarget === 'teacher' ? '' : groupId} onChange={e => setGroupId(e.target.value)}
              className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent">
              <option value="">{reportTarget === 'teacher' ? 'N/A for teachers' : 'All Students'}</option>
              {sections.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}{s.section ? ' — ' + s.section : ''}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-warm-muted/60 uppercase tracking-wider mb-1.5">Period</label>
            <div className="flex gap-1">
              {(['daily', 'monthly', 'full', 'custom'] as const).map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`flex-1 rounded-lg py-2 text-xs transition-colors ${period === p ? 'bg-warm-accent text-[#1a1614] font-medium' : 'border border-warm-card-border text-warm-muted hover:text-warm-cream'}`}>
                  {p === 'daily' ? 'Daily' : p === 'monthly' ? 'Monthly' : p === 'full' ? 'Full AY' : 'Custom'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: Status filter */}
        <div className="mb-4">
          <label className="block text-[10px] text-warm-muted/60 uppercase tracking-wider mb-1.5">Filter by Status</label>
          <div className="flex flex-wrap items-center gap-1">
            {['', 'present', 'absent', 'late', 'leave', 'half-day', 'function'].map(st => (
              <button key={st} onClick={() => setStatusFilter(statusFilter === st ? '' : st)}
                className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
                  statusFilter === st
                    ? 'bg-warm-accent text-[#1a1614] font-medium'
                    : 'border border-warm-card-border text-warm-muted hover:text-warm-cream'
                }`}>
                {st ? (st === 'half-day' ? 'Half-Day' : st.charAt(0).toUpperCase() + st.slice(1)) : 'All'}
              </button>
            ))}
          </div>
        </div>

        {/* Row 3: Date picker (daily) OR Month picker (monthly) OR Custom date range (custom) */}
        {period === 'daily' && (
          <div className="mb-4">
            <label className="block text-[10px] text-warm-muted/60 uppercase tracking-wider mb-1.5">Date</label>
            <input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)}
              className="rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent" />
          </div>
        )}
        {period === 'monthly' && (
          <div className="mb-4">
            <label className="block text-[10px] text-warm-muted/60 uppercase tracking-wider mb-1.5">Month</label>
            <select value={month} onChange={e => setMonth(Number(e.target.value))}
              className="w-full max-w-[200px] rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent">
              {MONTHS.map((m, i) => <option key={i} value={i}>{m} 2026</option>)}
            </select>
          </div>
        )}
        {period === 'custom' && (
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-[10px] text-warm-muted/60 uppercase tracking-wider mb-1.5">From</label>
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                className="rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent" />
            </div>
            <div>
              <label className="block text-[10px] text-warm-muted/60 uppercase tracking-wider mb-1.5">To</label>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                className="rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent" />
            </div>
          </div>
        )}

        {/* Row 4: Report type + absentee threshold */}
        <div className="flex flex-wrap items-center gap-4 mb-1">
          <div>
            <label className="block text-[10px] text-warm-muted/60 uppercase tracking-wider mb-1.5">Report Type</label>
            <div className="flex gap-1">
              {(['standard', 'absentee', 'class-summary'] as const).map(t => (
                <button key={t} onClick={() => setReportType(t)}
                  className={`rounded-lg py-2 px-3 text-xs transition-colors ${reportType === t ? 'bg-warm-accent text-[#1a1614] font-medium' : 'border border-warm-card-border text-warm-muted hover:text-warm-cream'}`}>
                  {t === 'standard' ? 'Standard' : t === 'absentee' ? 'Absentee List' : 'Class Summary'}
                </button>
              ))}
            </div>
          </div>
          {reportType === 'absentee' && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-warm-muted/60 uppercase tracking-wider">Below</span>
              <input type="number" value={absenteeThreshold} onChange={e => setAbsenteeThreshold(Number(e.target.value))}
                min={0} max={100} className="w-16 rounded-lg border border-warm-card-border bg-[#1a1614] px-2 py-1.5 text-xs text-warm-cream text-center outline-none focus:border-warm-accent" />
              <span className="text-[10px] text-warm-muted/60">%</span>
            </div>
          )}
        </div>

        <button onClick={generateReport} disabled={loading}
          className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-warm-accent px-6 py-2.5 text-sm font-medium text-[#1a1614] hover:bg-[#b39a76] disabled:opacity-50 transition-colors">
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
              <p className="text-[10px] text-warm-muted/50 mt-0.5">{report.generatedAt} · {report.total} {reportTarget === 'teacher' ? 'teachers' : 'students'}</p>
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

          {/* Summary row */}
          <div className="px-5 py-3 border-t border-warm-card-border/30 flex flex-wrap gap-4 text-xs text-warm-muted/70">
            {report.statusFilter ? (
              <span><span className="font-medium" style={{color: report.statusFilter === 'absent' ? '#ef4444' : report.statusFilter === 'present' ? '#22c55e' : report.statusFilter === 'late' ? '#eab308' : '#3b82f6'}}>{report.summary.statusCount || 0}</span> {STATUS_LABELS[report.statusFilter] || report.statusFilter} · {(report.summary.statusPercent || 0)}% · {report.total} {reportTarget === 'teacher' ? 'teachers' : 'students'}</span>
            ) : report.isSingleDay ? (
              <span><span className="text-green-400 font-medium">{report.summary.present}</span> Present · <span className="text-red-400 font-medium">{report.summary.absent}</span> Absent · <span className="text-yellow-400 font-medium">{report.summary.late}</span> Late · <span className="text-blue-400 font-medium">{report.summary.leave}</span> Leave · {report.total} {reportTarget === 'teacher' ? 'teachers' : 'students'}</span>
            ) : (
              <><span><span className="text-green-400 font-medium">{report.summary.present}</span> P</span><span><span className="text-red-400 font-medium">{report.summary.absent}</span> A</span><span><span className="text-yellow-400 font-medium">{report.summary.late}</span> L</span><span><span className="text-blue-400 font-medium">{report.summary.leave}</span> Lv</span><span className="font-medium">{report.summary.percentage}%</span></>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto border-t border-warm-card-border/30">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-warm-card/50">
                  {report.statusFilter && report.isSingleDay ? (
                    // Status filter + single day: just name
                    <>{reportTarget !== 'teacher' && <th className="text-left px-4 py-2.5 text-[10px] text-warm-muted font-medium">Roll</th>}{report.showSection && <th className="text-left px-3 py-2.5 text-[10px] text-warm-muted font-medium">Class</th>}<th className="text-left px-4 py-2.5 text-[10px] text-warm-muted font-medium">Name</th></>
                  ) : report.statusFilter ? (
                    // Status filter + multi-day: name, count, %
                    <>{reportTarget !== 'teacher' && <th className="text-left px-4 py-2.5 text-[10px] text-warm-muted font-medium">Roll</th>}{report.showSection && <th className="text-left px-3 py-2.5 text-[10px] text-warm-muted font-medium">Class</th>}<th className="text-left px-4 py-2.5 text-[10px] text-warm-muted font-medium">Name</th><th className="text-center px-3 py-2.5 text-[10px] text-warm-muted font-medium">{STATUS_LABELS[report.statusFilter] || report.statusFilter}</th><th className="text-center px-3 py-2.5 text-[10px] text-warm-muted font-medium">%</th></>
                  ) : report.isSingleDay ? (
                    // Standard + single day: roll, name, status text
                    <>{reportTarget !== 'teacher' && <th className="text-left px-4 py-2.5 text-[10px] text-warm-muted font-medium">Roll</th>}{report.showSection && <th className="text-left px-3 py-2.5 text-[10px] text-warm-muted font-medium">Class</th>}<th className="text-left px-4 py-2.5 text-[10px] text-warm-muted font-medium">Name</th><th className="text-left px-3 py-2.5 text-[10px] text-warm-muted font-medium">Status</th></>
                  ) : (
                    // Standard multi-day: roll, name, P, A, L, %
                    <>{reportTarget !== 'teacher' && <th className="text-left px-4 py-2.5 text-[10px] text-warm-muted font-medium">Roll</th>}{report.showSection && <th className="text-left px-3 py-2.5 text-[10px] text-warm-muted font-medium">Class</th>}<th className="text-left px-4 py-2.5 text-[10px] text-warm-muted font-medium">Name</th><th className="text-center px-3 py-2.5 text-[10px] text-warm-muted font-medium">P</th><th className="text-center px-3 py-2.5 text-[10px] text-warm-muted font-medium">A</th><th className="text-center px-3 py-2.5 text-[10px] text-warm-muted font-medium">L</th><th className="text-center px-3 py-2.5 text-[10px] text-warm-muted font-medium">%</th></>
                  )}
                </tr>
              </thead>
              <tbody>
                {report.students.map((s: any, i: number) => (
                  <tr key={i} className="border-t border-warm-card-border/20 hover:bg-warm-card/20 transition-colors">
                    {report.statusFilter && report.isSingleDay ? (
                      <>{reportTarget !== 'teacher' && <td className="px-4 py-2 text-xs text-warm-muted">{s.roll}</td>}{report.showSection && <td className="px-3 py-2 text-xs text-warm-muted/60">{s.section || '—'}</td>}<td className="px-4 py-2 text-xs text-warm-cream">{s.name}</td></>
                    ) : report.statusFilter ? (
                      <>{reportTarget !== 'teacher' && <td className="px-4 py-2 text-xs text-warm-muted">{s.roll}</td>}{report.showSection && <td className="px-3 py-2 text-xs text-warm-muted/60">{s.section || '—'}</td>}<td className="px-4 py-2 text-xs text-warm-cream">{s.name}</td><td className="px-3 py-2 text-xs text-center font-medium" style={{color: report.statusFilter === 'absent' ? '#ef4444' : report.statusFilter === 'present' ? '#22c55e' : report.statusFilter === 'late' ? '#eab308' : '#3b82f6'}}>{s.statusCount || 0}</td><td className={`px-3 py-2 text-xs text-center font-medium ${s.statusPercent >= 80 ? 'text-green-400' : s.statusPercent >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>{s.statusPercent || 0}%</td></>
                    ) : report.isSingleDay ? (
                      <>{reportTarget !== 'teacher' && <td className="px-4 py-2 text-xs text-warm-muted">{s.roll}</td>}{report.showSection && <td className="px-3 py-2 text-xs text-warm-muted/60">{s.section || '—'}</td>}<td className="px-4 py-2 text-xs text-warm-cream">{s.name}</td><td className="px-3 py-2 text-xs text-warm-muted">{s.status ? (STATUS_LABELS[s.status as string] || s.status) : '— Not Marked'}</td></>
                    ) : (
                      <>{reportTarget !== 'teacher' && <td className="px-4 py-2 text-xs text-warm-muted">{s.roll}</td>}{report.showSection && <td className="px-3 py-2 text-xs text-warm-muted/60">{s.section || '—'}</td>}<td className="px-4 py-2 text-xs text-warm-cream">{s.name}</td><td className="px-3 py-2 text-xs text-green-400 text-center">{s.present}</td><td className="px-3 py-2 text-xs text-red-400 text-center">{s.absent}</td><td className="px-3 py-2 text-xs text-yellow-400 text-center">{s.late}</td><td className={`px-3 py-2 text-xs text-center font-medium ${s.percent >= 80 ? 'text-green-400' : s.percent >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>{s.percent}%</td></>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
