'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Download, FileText } from 'lucide-react';
import { api } from '@/lib/api';
import { showToast } from '@/components/toast';
import { downloadCsvText } from '@/lib/expenses-export';

export default function ExpensesReportsPage() {
  const router = useRouter();
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [from, setFrom] = useState(() => new Date().toISOString().slice(0, 10).slice(0, 8) + '01');
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [exporting, setExporting] = useState<string | null>(null);

  const runExport = async (kind: 'payroll' | 'utilities' | 'others') => {
    setExporting(kind);
    try {
      let res;
      if (kind === 'payroll') res = await api.exportPayrollCsv(month);
      else if (kind === 'utilities') res = await api.exportUtilitiesCsv({ from, to });
      else res = await api.exportOthersCsv({ from, to });
      if (res.success && res.data?.csv) {
        downloadCsvText(res.data.filename, res.data.csv);
        showToast('success', 'CSV downloaded');
      }
    } catch (e: any) {
      showToast('error', e.message || 'Export failed');
    } finally {
      setExporting(null);
    }
  };

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <button type="button" onClick={() => router.push('/admin/expenses')} className="mb-4 flex items-center gap-1 text-xs text-warm-muted hover:text-warm-cream">
        <ChevronLeft size={14} /> Payments
      </button>
      <div className="mb-6 flex items-center gap-3">
        <FileText size={20} className="text-warm-accent" />
        <div>
          <h1 className="text-xl font-light text-warm-cream">Reports & Export</h1>
          <p className="text-xs text-warm-muted">Download CSV exports for payroll, utilities, and other payments</p>
        </div>
      </div>

      <div className="space-y-4">
        <section className="rounded-xl border border-warm-card-border bg-warm-card p-5">
          <h2 className="mb-3 text-sm text-warm-cream">Payroll export</h2>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <label className="text-xs text-warm-muted">Salary month</label>
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream" />
          </div>
          <button type="button" disabled={exporting === 'payroll'} onClick={() => runExport('payroll')} className="flex items-center gap-1 rounded-lg bg-warm-accent px-3 py-2 text-xs text-black disabled:opacity-50">
            <Download size={14} /> {exporting === 'payroll' ? 'Exporting…' : 'Download payroll CSV'}
          </button>
        </section>

        <section className="rounded-xl border border-warm-card-border bg-warm-card p-5">
          <h2 className="mb-3 text-sm text-warm-cream">Utilities & others export</h2>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream" />
            <span className="text-xs text-warm-muted">to</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream" />
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={exporting === 'utilities'} onClick={() => runExport('utilities')} className="flex items-center gap-1 rounded-lg border border-warm-card-border px-3 py-2 text-xs text-warm-muted hover:text-warm-cream disabled:opacity-50">
              <Download size={14} /> Utilities CSV
            </button>
            <button type="button" disabled={exporting === 'others'} onClick={() => runExport('others')} className="flex items-center gap-1 rounded-lg border border-warm-card-border px-3 py-2 text-xs text-warm-muted hover:text-warm-cream disabled:opacity-50">
              <Download size={14} /> Others CSV
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-warm-card-border bg-warm-card/50 p-5">
          <h2 className="mb-2 text-sm text-warm-cream">Voucher lookup</h2>
          <p className="text-xs text-warm-muted">Click any voucher number on Pays, Utilities, or Others pages to open full detail and void if needed.</p>
        </section>
      </div>
    </main>
  );
}
