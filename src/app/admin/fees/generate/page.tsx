'use client';

import { useState, useEffect } from 'react';
import { showToast } from '@/components/toast';
import { RefreshCw, CheckCircle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const CATEGORY_COLORS: Record<string, string> = {
  MONTHLY: 'bg-blue-900/20 text-blue-300',
  TERM: 'bg-purple-900/20 text-purple-300',
  ANNUAL: 'bg-green-900/20 text-green-300',
  ONE_TIME: 'bg-orange-900/20 text-orange-300',
};

export default function GenerateFeesPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [heads, setHeads] = useState<any[]>([]);
  const [selectedHeadIds, setSelectedHeadIds] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ generated: number; skipped: number; updated: number; total: number } | null>(null);
  const [loadingHeads, setLoadingHeads] = useState(true);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // Fetch all fee heads on mount
  useEffect(() => {
    const loadHeads = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/admin/fee-heads`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.success) {
          const activeHeads = json.data.filter((h: any) => h.isActive !== false);
          setHeads(activeHeads);
          // Pre-select all active heads by default
          setSelectedHeadIds(new Set(activeHeads.map((h: any) => h.id)));
        }
      } catch {} finally { setLoadingHeads(false); }
    };
    loadHeads();
  }, []);

  const toggleHead = (id: string) => {
    const next = new Set(selectedHeadIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    if (next.size === 0) next.add(id); // Keep at least one selected
    setSelectedHeadIds(next);
  };

  const handleGenerate = async () => {
    if (!token) return;
    setGenerating(true);
    setResult(null);
    try {
      const res = await fetch(`${API_URL}/admin/student-fees/generate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: month + 1,
          year,
          headIds: Array.from(selectedHeadIds),
        }),
      });
      const json = await res.json();
      if (json.success) { setResult(json.data); showToast('success', `Generated ${json.data.generated} fees`); }
      else showToast('error', json.message || 'Failed');
    } catch { showToast('error', 'Failed'); }
    finally { setGenerating(false); }
  };

  // Group heads by category for display
  const byCategory: Record<string, any[]> = {};
  for (const h of heads) {
    const cat = h.category || 'MONTHLY';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(h);
  }
  const categoryOrder = ['MONTHLY', 'TERM', 'ANNUAL', 'ONE_TIME'];

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
          <button onClick={handleGenerate} disabled={generating || loadingHeads || selectedHeadIds.size === 0}
            className="inline-flex items-center gap-1.5 rounded-lg bg-warm-accent px-6 py-2.5 text-sm font-medium text-[#1a1614] hover:bg-[#b39a76] disabled:opacity-50 transition-colors">
            {generating ? <RefreshCw size={15} className="animate-spin" /> : <CheckCircle size={15} />}
            {generating ? 'Generating...' : 'Generate'}
          </button>
        </div>

        {/* Fee heads checkboxes — grouped by category */}
        <div className="mb-6">
          <label className="block text-[10px] text-warm-muted/60 uppercase tracking-wider mb-3">Fee Heads to Include</label>
          {loadingHeads ? (
            <div className="space-y-2">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-warm-card/50" />
              ))}
            </div>
          ) : heads.length === 0 ? (
            <p className="text-xs text-warm-muted/40">No fee heads found. Create some under Fee Heads first.</p>
          ) : (
            <div className="space-y-1">
              {categoryOrder.map(cat => {
                const catHeads = byCategory[cat];
                if (!catHeads || catHeads.length === 0) return null;
                const displayName = cat === 'ONE_TIME' ? 'One-Time' : cat.charAt(0) + cat.slice(1).toLowerCase();
                return (
                  <div key={cat} className="mb-3">
                    <p className="text-[10px] text-warm-muted/40 uppercase tracking-wider mb-1.5 ml-1">{displayName}</p>
                    {catHeads.map(h => (
                      <label key={h.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-warm-card/50 cursor-pointer transition-colors">
                        <input type="checkbox" checked={selectedHeadIds.has(h.id)} onChange={() => toggleHead(h.id)}
                          className="rounded border-warm-card-border bg-[#1a1614] text-warm-accent focus:ring-warm-accent" />
                        <span className="text-sm text-warm-cream flex-1">{h.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${CATEGORY_COLORS[cat] || 'bg-gray-900/20 text-gray-300'}`}>
                          {cat}
                        </span>
                      </label>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {result && (
          <div className="rounded-lg border border-warm-card-border/30 bg-warm-card/50 p-4">
            <p className="text-sm text-warm-cream">
              Generated: <strong className="text-green-400">{result.generated}</strong>
              {result.updated > 0 && <span className="ml-2 text-warm-accent">· Updated: <strong>{result.updated}</strong></span>}
            </p>
            <p className="text-xs text-warm-muted/60 mt-1">Skipped (already exist): {result.skipped}</p>
            <p className="text-xs text-warm-muted/60">Total active students: {result.total}</p>
          </div>
        )}
      </div>
    </main>
  );
}
