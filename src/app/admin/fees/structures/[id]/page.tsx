'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { showToast } from '@/components/toast';
import { ArrowLeft } from 'lucide-react';
import config from '@/config';

export default function ClassStudentsFeePage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;

  const [heads, setHeads] = useState<any[]>([]);
  const [structures, setStructures] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(true);
  const [editHead, setEditHead] = useState<{ studentId: string; headId: string } | null>(null);
  const [headValues, setHeadValues] = useState<any>({});

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const branchId = typeof window !== 'undefined' ? localStorage.getItem('activeBranchId') : null;
  const ayId = typeof window !== 'undefined' ? localStorage.getItem('activeAYId') : null;

  const loadData = async () => {
    if (!token || !branchId || !ayId) return;
    try {
      const [hRes, stRes, sRes] = await Promise.all([
        fetch(`${config.apiUrl}/admin/fee-heads`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch(`${config.apiUrl}/admin/fee-structures?groupId=${groupId}&academicYearId=${ayId}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch(`${config.apiUrl}/admin/students?groupId=${groupId}&academicYearId=${ayId}&limit=500`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      ]);
      if (hRes.success) setHeads(hRes.data.filter((h: any) => h.isActive));
      if (stRes.success) setStructures(stRes.data);
      if (sRes.success) {
        const studentsData = sRes.data || [];
        setStudents(studentsData);
        if (studentsData[0]?.group) {
          const g = studentsData[0].group;
          setGroupName(g.section ? `${g.name} — ${g.section}` : g.name);
        }
        // Load persisted feeOverrides into headValues state
        const overrides: any = {};
        for (const st of studentsData) {
          if (st.feeOverrides && typeof st.feeOverrides === 'object') {
            overrides[st.id] = st.feeOverrides;
          }
        }
        if (Object.keys(overrides).length > 0) {
          setHeadValues(overrides);
        }
      }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [groupId]);

  const getBaseAmount = (feeHeadId: string) => {
    const s = structures.find((st: any) => st.feeHeadId === feeHeadId && !st.effectiveTo);
    return s ? s.amount : 0;
  };

  const persistOverrides = async (studentId: string, overrides: Record<string, number>) => {
    if (!token) return;
    const total = Object.values(overrides).reduce((s: number, v: any) => s + (v || 0), 0);
    try {
      await fetch(`${config.apiUrl}/admin/students/${studentId}/custom-fee`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ customFeeAmount: total > 0 ? total : null, feeOverrides: overrides, concessionReason: 'Per-head custom' }),
      });
    } catch {}
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <button onClick={() => router.push('/admin/fees/structures')} className="inline-flex items-center gap-1 text-xs text-warm-accent hover:underline mb-4">
        <ArrowLeft size={13} /> Back to Fee Structures
      </button>
      <h1 className="text-xl font-light text-warm-cream mb-6">{groupName || 'Class'} — Student Fees</h1>

      {loading ? <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 animate-pulse rounded-lg bg-warm-card" />)}</div> : (
        <div className="rounded-xl border border-warm-card-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-warm-card/70">
                <th className="text-left px-3 py-3 text-[10px] text-warm-muted font-medium w-12">Roll</th>
                <th className="text-left px-4 py-3 text-[10px] text-warm-muted font-medium">Student</th>
                {heads.map(h => (
                  <th key={h.id} className="text-center px-2 py-3 text-[10px] text-warm-muted font-medium min-w-[70px]">{h.name}</th>
                ))}
                <th className="text-center px-3 py-3 text-[10px] text-warm-muted font-medium min-w-[80px]">Total</th>
              </tr>
            </thead>
            <tbody>
              {[...students]
                .sort((a: any, b: any) => (parseInt(a.rollNumber, 10) || 0) - (parseInt(b.rollNumber, 10) || 0))
                .map((s: any) => {
                  const stuOverrides = headValues[s.id] || {};
                  const stuHeadValues = heads.map(h => ({
                    headId: h.id,
                    value: stuOverrides[h.id] ?? getBaseAmount(h.id),
                  }));
                  const rowTotal = stuHeadValues.reduce((sum, h) => sum + h.value, 0);
                  return (
                    <tr key={s.id} className="border-t border-warm-card-border/20 hover:bg-warm-card/20 transition-colors">
                      <td className="px-3 py-2.5 text-xs text-warm-muted">{s.rollNumber || '—'}</td>
                      <td className="px-4 py-2.5 text-xs text-warm-cream">{s.name}</td>
                      {heads.map(h => {
                        const val = stuHeadValues.find(v => v.headId === h.id)?.value || 0;
                        const editing = editHead?.studentId === s.id && editHead?.headId === h.id;
                        const isCustomized = stuOverrides[h.id] != null;
                        return (
                          <td key={h.id} className="px-2 py-2.5 text-xs text-center">
                            {editing ? (
                              <div className="flex items-center gap-1 justify-center">
                                <input type="number" defaultValue={val / 100} autoFocus
                                  className="w-16 rounded border border-warm-accent bg-[#1a1614] px-1 py-0.5 text-xs text-warm-cream text-center outline-none"
                                  onKeyDown={async (e) => {
                                    if (e.key === 'Enter') {
                                      const newVal = Math.round(parseInt((e.target as HTMLInputElement).value, 10) || 0) * 100;
                                      const newOverrides = { ...stuOverrides, [h.id]: newVal };
                                      setHeadValues((prev: any) => ({ ...prev, [s.id]: newOverrides }));
                                      setEditHead(null);
                                      await persistOverrides(s.id, newOverrides);
                                    }
                                    if (e.key === 'Escape') setEditHead(null);
                                  }}
                                  onBlur={async (e) => {
                                    const newVal = Math.round(parseInt(e.target.value, 10) || 0) * 100;
                                    const newOverrides = { ...stuOverrides, [h.id]: newVal };
                                    setHeadValues((prev: any) => ({ ...prev, [s.id]: newOverrides }));
                                    setEditHead(null);
                                    await persistOverrides(s.id, newOverrides);
                                  }} />
                              </div>
                            ) : (
                              <button onClick={() => setEditHead({ studentId: s.id, headId: h.id })}
                                className={`text-xs px-1 py-0.5 rounded transition-colors ${isCustomized ? 'text-warm-accent hover:bg-warm-accent/20' : 'text-warm-muted hover:text-warm-cream'}`}>
                                {val > 0 ? (val / 100).toLocaleString() : '—'}
                              </button>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-3 py-2.5 text-xs text-warm-muted text-center">{(rowTotal / 100).toLocaleString()}</td>
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
