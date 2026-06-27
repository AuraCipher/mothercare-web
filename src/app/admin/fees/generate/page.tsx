'use client';

import { useState } from 'react';
import { showToast } from '@/components/toast';
import { RefreshCw, CheckCircle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const CATEGORIES = [
  { key: 'MONTHLY', label: 'Monthly', desc: 'Tuition, Transport, Library' },
  { key: 'TERM', label: 'Term', desc: 'Lab Fee, Sports (Aug/Nov/Feb/May)' },
  { key: 'ANNUAL', label: 'Annual', desc: 'Annual Charges (once per year)' },
  { key: 'ONE_TIME', label: 'One-Time', desc: 'Admission Fee (once per student)' },
];

export default function GenerateFeesPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [selectedCats, setSelectedCats] = useState<Set<string>>(new Set(['MONTHLY']));
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ generated: number; skipped: number; total: number } | null>(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const toggleCat = (key: string) => {
    const next = new Set(selectedCats);
    if (next.has(key)) next.delete(key); else next.add(key);
    if (next.size === 0) next.add('MONTHLY'); // Keep at least one
    setSelectedCats(next);
  };

  const handleGenerate = async () => {
    if (!token) return;
    setGenerating(true);
    setResult(null);
    try {
      const res = await fetch(`${API_URL}/admin/student-fees/generate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: month + 1, year, categories: Array.from(selectedCats) }),
      });
      const json = await res.json();
      if (json.success) { setResult(json.data); showToast('success', `Generated ${json.data.generated} fees`); }
      else showToast('error', json.message || 'Failed');
    } catch { showToast('error', 'Failed'); }
    finally { setGenerating(false); }
  };

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-xl font-light text-warm-cream mb-6">Generate Fees</h1>

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

        {/* Category checkboxes */}
        <div className="mb-6">
          <label className="block text-[10px] text-warm-muted/60 uppercase tracking-wider mb-2">Fee Categories to Include</label>
          <div className="space-y-2">
            {CATEGORIES.map(cat => (
              <label key={cat.key} className="flex items-center gap-3 p-2 rounded-lg hover:bg-warm-card/50 cursor-pointer transition-colors">
                <input type="checkbox" checked={selectedCats.has(cat.key)} onChange={() => toggleCat(cat.key)}
                  className="rounded border-warm-card-border bg-[#1a1614] text-warm-accent focus:ring-warm-accent" />
                <div>
                  <p className="text-sm text-warm-cream">{cat.label}</p>
                  <p className="text-[11px] text-warm-muted/50">{cat.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {result && (
          <div className="rounded-lg border border-warm-card-border/30 bg-warm-card/50 p-4">
            <p className="text-sm text-warm-cream">Generated: <strong className="text-green-400">{result.generated}</strong></p>
            <p className="text-xs text-warm-muted/60 mt-1">Skipped (already exist): {result.skipped}</p>
            <p className="text-xs text-warm-muted/60">Total active students: {result.total}</p>
          </div>
        )}
      </div>
    </main>
  );
}
