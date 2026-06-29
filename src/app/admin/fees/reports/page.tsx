'use client';

import { useEffect, useState } from 'react';
import { FileText, Download } from 'lucide-react';
import { showToast } from '@/components/toast';
import config from '@/config';
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function FeeReportsPage() {
  const now = new Date();
  const [tab, setTab] = useState<'summary' | 'defaulter' | 'classes'>('summary');
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [summary, setSummary] = useState<any>(null);
  const [defaulters, setDefaulters] = useState<any[]>([]);
  const [classReport, setClassReport] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const m = month + 1;
      const [sRes, dRes, cRes] = await Promise.all([
        fetch(`${config.apiUrl}/admin/fees/summary?month=${m}&year=${year}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch(`${config.apiUrl}/admin/fees/defaulter?month=${m}&year=${year}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch(`${config.apiUrl}/admin/fees/collection-report?month=${m}&year=${year}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      ]);
      if (sRes.success) setSummary(sRes.data);
      if (dRes.success) setDefaulters(dRes.data);
      if (cRes.success) setClassReport(cRes.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [month, year]);

  const downloadCSV = () => {
    let csv = 'Class,Total Due,Collected,Pending,Students,Rate\n';
    for (const c of classReport) csv += `${c.groupId},${c.total},${c.collected},${c.pending},${c.students},${c.rate}%\n`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `fee-report-${MONTHS[month]}-${year}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-light text-warm-cream">Fee Reports</h1>
        <div className="flex items-center gap-3">
          <select value={month} onChange={e => setMonth(Number(e.target.value))}
            className="rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent">
            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <input type="number" value={year} onChange={e => setYear(Number(e.target.value))}
            className="rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent w-20" />
          <button onClick={loadData} className="rounded-lg border border-warm-card-border px-3 py-2 text-xs text-warm-muted hover:text-warm-cream"><FileText size={13} /></button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6">
        {(['summary', 'defaulter', 'classes'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-xs transition-colors ${tab === t ? 'bg-warm-accent text-[#1a1614] font-medium' : 'border border-warm-card-border text-warm-muted hover:text-warm-cream'}`}>
            {t === 'summary' ? 'Summary' : t === 'defaulter' ? 'Defaulters' : 'By Class'}
          </button>
        ))}
      </div>

      {loading ? <div className="h-32 animate-pulse rounded-xl bg-warm-card" /> : (
        <>
          {tab === 'summary' && summary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-xl border border-warm-card-border bg-warm-card p-5"><p className="text-[10px] text-warm-muted/50 uppercase">Total Due</p><p className="text-2xl font-light text-warm-cream mt-1">{(summary.totalDue / 100).toLocaleString()}</p></div>
              <div className="rounded-xl border border-warm-card-border bg-warm-card p-5"><p className="text-[10px] text-warm-muted/50 uppercase">Collected</p><p className="text-2xl font-light text-green-400 mt-1">{(summary.totalCollected / 100).toLocaleString()}</p></div>
              <div className="rounded-xl border border-warm-card-border bg-warm-card p-5"><p className="text-[10px] text-warm-muted/50 uppercase">Pending</p><p className="text-2xl font-light text-red-400 mt-1">{summary.pendingCount} students</p></div>
              <div className="rounded-xl border border-warm-card-border bg-warm-card p-5"><p className="text-[10px] text-warm-muted/50 uppercase">Collection Rate</p><p className="text-2xl font-light text-warm-accent mt-1">{summary.collectionRate}%</p></div>
            </div>
          )}

          {tab === 'defaulter' && (
            <div className="rounded-xl border border-warm-card-border overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="bg-warm-card/70"><th className="text-left px-4 py-3 text-[10px] text-warm-muted font-medium">Student</th><th className="text-left px-4 py-3 text-[10px] text-warm-muted font-medium">Class</th><th className="text-right px-4 py-3 text-[10px] text-warm-muted font-medium">Due</th><th className="text-right px-4 py-3 text-[10px] text-warm-muted font-medium">Paid</th><th className="text-right px-4 py-3 text-[10px] text-warm-muted font-medium">Pending</th></tr></thead>
                <tbody>
                  {defaulters.map(f => {
                    const due = (f.netAmount - f.paidAmount) / 100;
                    return (
                      <tr key={f.id} className="border-t border-warm-card-border/20 hover:bg-warm-card/20 transition-colors">
                        <td className="px-4 py-3 text-xs text-warm-cream">{f.student?.name}</td>
                        <td className="px-4 py-3 text-xs text-warm-muted/60">{f.student?.group?.name || ''}</td>
                        <td className="px-4 py-3 text-xs text-warm-muted text-right">{(f.netAmount / 100).toLocaleString()}</td>
                        <td className="px-4 py-3 text-xs text-green-400 text-right">{(f.paidAmount / 100).toLocaleString()}</td>
                        <td className="px-4 py-3 text-xs text-red-400 text-right font-medium">{due.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {defaulters.length === 0 && <div className="p-6 text-center text-xs text-warm-muted/40">All fees paid for this month</div>}
            </div>
          )}

          {tab === 'classes' && (
            <div className="rounded-xl border border-warm-card-border overflow-hidden">
              <div className="p-3 border-b border-warm-card-border/30 flex justify-end">
                <button onClick={downloadCSV} className="inline-flex items-center gap-1 text-xs text-warm-accent hover:underline"><Download size={12} /> CSV</button>
              </div>
              <table className="w-full text-sm">
                <thead><tr className="bg-warm-card/70"><th className="text-left px-4 py-3 text-[10px] text-warm-muted font-medium">Class</th><th className="text-right px-4 py-3 text-[10px] text-warm-muted font-medium">Students</th><th className="text-right px-4 py-3 text-[10px] text-warm-muted font-medium">Total Due</th><th className="text-right px-4 py-3 text-[10px] text-warm-muted font-medium">Collected</th><th className="text-right px-4 py-3 text-[10px] text-warm-muted font-medium">Pending</th><th className="text-center px-4 py-3 text-[10px] text-warm-muted font-medium">Rate</th></tr></thead>
                <tbody>
                  {classReport.map(c => (
                    <tr key={c.groupId} className="border-t border-warm-card-border/20 hover:bg-warm-card/20 transition-colors">
                      <td className="px-4 py-3 text-xs text-warm-cream">{c.groupId}</td>
                      <td className="px-4 py-3 text-xs text-warm-muted text-right">{c.students}</td>
                      <td className="px-4 py-3 text-xs text-warm-muted text-right">{(c.total / 100).toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs text-green-400 text-right">{(c.collected / 100).toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs text-red-400 text-right">{(c.pending / 100).toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs text-center font-medium">{c.rate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </main>
  );
}
