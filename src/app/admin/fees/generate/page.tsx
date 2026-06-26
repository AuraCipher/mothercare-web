'use client';

import { useState } from 'react';
import { showToast } from '@/components/toast';
import { RefreshCw, CheckCircle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function GenerateFeesPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ generated: number; skipped: number; total: number } | null>(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const handleGenerate = async () => {
    if (!token) return;
    setGenerating(true);
    setResult(null);
    try {
      const res = await fetch(`${API_URL}/admin/student-fees/generate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: month + 1, year }),
      });
      const json = await res.json();
      if (json.success) { setResult(json.data); showToast('success', `Generated ${json.data.generated} fees`); }
      else showToast('error', json.message || 'Failed');
    } catch { showToast('error', 'Failed'); }
    finally { setGenerating(false); }
  };

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-xl font-light text-warm-cream mb-6">Generate Monthly Fees</h1>

      <div className="rounded-xl border border-warm-card-border bg-warm-card p-6">
        <div className="flex items-end gap-4 mb-6">
          <div>
            <label className="block text-[10px] text-warm-muted/60 uppercase tracking-wider mb-1.5">Month</label>
            <select value={month} onChange={e => setMonth(Number(e.target.value))}
              className="rounded-lg border border-warm-card-border bg-[#1a1614] px-4 py-2.5 text-sm text-warm-cream outline-none focus:border-warm-accent">
              {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-warm-muted/60 uppercase tracking-wider mb-1.5">Year</label>
            <input type="number" value={year} onChange={e => setYear(Number(e.target.value))}
              className="rounded-lg border border-warm-card-border bg-[#1a1614] px-4 py-2.5 text-sm text-warm-cream outline-none focus:border-warm-accent w-24" />
          </div>
          <button onClick={handleGenerate} disabled={generating}
            className="inline-flex items-center gap-1.5 rounded-lg bg-warm-accent px-6 py-2.5 text-sm font-medium text-[#1a1614] hover:bg-[#b39a76] disabled:opacity-50 transition-colors">
            {generating ? <RefreshCw size={15} className="animate-spin" /> : <CheckCircle size={15} />}
            {generating ? 'Generating...' : 'Generate'}
          </button>
        </div>

        {result && (
          <div className="rounded-lg border border-warm-card-border/30 bg-warm-card/50 p-4">
            <p className="text-sm text-warm-cream">Generated: <strong className="text-green-400">{result.generated}</strong></p>
            <p className="text-xs text-warm-muted/60 mt-1">Skipped (already exists): {result.skipped}</p>
            <p className="text-xs text-warm-muted/60">Total active students: {result.total}</p>
          </div>
        )}
      </div>
    </main>
  );
}
