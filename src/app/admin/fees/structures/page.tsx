'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { showToast } from '@/components/toast';
import config from '@/config';

export default function FeeStructuresPage() {
  const router = useRouter();
  const [sections, setSections] = useState<any[]>([]);
  const [heads, setHeads] = useState<any[]>([]);
  const [structures, setStructures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editCell, setEditCell] = useState<{ groupId: string; feeHeadId: string } | null>(null);
  const [editAmount, setEditAmount] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const branchId = typeof window !== 'undefined' ? localStorage.getItem('activeBranchId') : null;
  const ayId = typeof window !== 'undefined' ? localStorage.getItem('activeAYId') : null;

  const loadData = async () => {
    if (!token || !branchId || !ayId) return;
    try {
      const [sRes, hRes, stRes] = await Promise.all([
        fetch(`${config.apiUrl}/admin/branches/${branchId}/academic-years/${ayId}/sections`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch(`${config.apiUrl}/admin/fee-heads`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch(`${config.apiUrl}/admin/fee-structures`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      ]);
      if (sRes.success) setSections((sRes.data || []).sort((a: any, b: any) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)));
      if (hRes.success) setHeads(hRes.data.filter((h: any) => h.isActive));
      if (stRes.success) setStructures(stRes.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const getAmount = (groupId: string, feeHeadId: string) => {
    const s = structures.find((st: any) => st.groupId === groupId && st.feeHeadId === feeHeadId && !st.effectiveTo);
    return s ? s.amount : 0;
  };

  const handleSaveCell = async (groupId: string, feeHeadId: string) => {
    if (!token || !ayId) return;
    const amount = parseInt(editAmount, 10) * 100; // Convert to paise
    try {
      const res = await fetch(`${config.apiUrl}/admin/fee-structures`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ academicYearId: ayId, groupId, feeHeadId, amount }),
      });
      const json = await res.json();
      if (json.success) { showToast('success', 'Saved'); loadData(); }
      else showToast('error', json.message || 'Failed');
    } catch { showToast('error', 'Failed'); }
    setEditCell(null);
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-xl font-light text-warm-cream mb-6">Fee Structures</h1>

      {loading ? <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 animate-pulse rounded-lg bg-warm-card" />)}</div> : (
        <div className="rounded-xl border border-warm-card-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-warm-card/70">
                <th className="text-left px-4 py-3 text-[10px] text-warm-muted font-medium min-w-[150px]">Class</th>
                {heads.map(h => (
                  <th key={h.id} className="text-center px-3 py-3 text-[10px] text-warm-muted font-medium min-w-[90px]">{h.name}</th>
                ))}
                <th className="text-center px-3 py-3 text-[10px] text-warm-muted font-medium min-w-[80px]">Total</th>
              </tr>
            </thead>
            <tbody>
              {sections.map(sec => {
                const total = heads.reduce((s, h) => s + getAmount(sec.id, h.id), 0);
                return (
                  <tr key={sec.id} className="border-t border-warm-card-border/20 hover:bg-warm-card/20 transition-colors">
                    <td className="px-4 py-3">
                      <button onClick={() => router.push(`/admin/fees/structures/${sec.id}`)}
                        className="text-xs text-warm-cream font-medium hover:text-warm-accent transition-colors text-left">{sec.section ? `${sec.name} — ${sec.section}` : sec.name}</button>
                    </td>
                    {heads.map(h => {
                      const amt = getAmount(sec.id, h.id);
                      const editing = editCell?.groupId === sec.id && editCell?.feeHeadId === h.id;
                      return (
                        <td key={h.id} className="px-3 py-3 text-center">
                          {editing ? (
                            <div className="flex items-center gap-1 justify-center">
                              <input type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)}
                                className="w-20 rounded border border-warm-accent bg-[#1a1614] px-2 py-1 text-xs text-warm-cream text-center outline-none"
                                autoFocus
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleSaveCell(sec.id, h.id);
                                  if (e.key === 'Escape') setEditCell(null);
                                }} />
                              <button onClick={() => handleSaveCell(sec.id, h.id)} className="text-xs text-green-400 hover:underline">✓</button>
                              <button onClick={() => setEditCell(null)} className="text-xs text-warm-muted hover:underline">✕</button>
                            </div>
                          ) : (
                            <button onClick={() => { setEditCell({ groupId: sec.id, feeHeadId: h.id }); setEditAmount(String(amt / 100 || '')); }}
                              className="text-xs text-warm-cream hover:text-warm-accent transition-colors px-2 py-1 rounded hover:bg-warm-card/50">
                              {amt > 0 ? `${(amt / 100).toLocaleString()}` : '—'}
                            </button>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-3 py-3 text-xs text-warm-accent font-medium text-center">{total > 0 ? `${(total / 100).toLocaleString()}` : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
