'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { showToast } from '@/components/toast';
import { ArrowLeft } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function ClassStudentsFeePage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;

  const [heads, setHeads] = useState<any[]>([]);
  const [structures, setStructures] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(true);
  const [editStudent, setEditStudent] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editReason, setEditReason] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const branchId = typeof window !== 'undefined' ? localStorage.getItem('activeBranchId') : null;
  const ayId = typeof window !== 'undefined' ? localStorage.getItem('activeAYId') : null;

  const loadData = async () => {
    if (!token || !branchId || !ayId) return;
    try {
      const [hRes, stRes, sRes] = await Promise.all([
        fetch(`${API_URL}/admin/fee-heads`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch(`${API_URL}/admin/fee-structures?groupId=${groupId}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch(`${API_URL}/admin/students?groupId=${groupId}&limit=500`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      ]);
      if (hRes.success) setHeads(hRes.data.filter((h: any) => h.isActive));
      if (stRes.success) setStructures(stRes.data);
      if (sRes.success) {
        setStudents(sRes.data || []);
        if (sRes.data?.[0]?.group) {
          const g = sRes.data[0].group;
          setGroupName(g.section ? `${g.name} — ${g.section}` : g.name);
        }
      }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [groupId]);

  // Get the base amount for a fee head for this class
  const getBaseAmount = (feeHeadId: string) => {
    const s = structures.find((st: any) => st.feeHeadId === feeHeadId && !st.effectiveTo);
    return s ? s.amount : 0;
  };

  const getStudentTotal = (student: any) => {
    if (student.customFeeAmount != null) return student.customFeeAmount;
    return heads.reduce((sum, h) => sum + getBaseAmount(h.id), 0);
  };

  const handleSave = async (studentId: string) => {
    if (!token) return;
    const amt = parseInt(editAmount, 10);
    try {
      const res = await fetch(`${API_URL}/admin/students/${studentId}/custom-fee`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customFeeAmount: amt > 0 ? Math.round(amt * 100) : null,
          concessionReason: editReason || null,
        }),
      });
      const json = await res.json();
      if (json.success) { showToast('success', amt > 0 ? 'Custom fee set' : 'Custom fee removed'); setEditStudent(null); loadData(); }
      else showToast('error', json.message || 'Failed');
    } catch { showToast('error', 'Failed'); }
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
                <th className="text-center px-3 py-3 text-[10px] text-warm-muted font-medium min-w-[80px]">Base Total</th>
                <th className="text-center px-3 py-3 text-[10px] text-warm-muted font-medium min-w-[100px]">Custom Fee</th>
                <th className="text-center px-3 py-3 text-[10px] text-warm-muted font-medium w-16">Action</th>
              </tr>
            </thead>
            <tbody>
              {[...students]
                .sort((a: any, b: any) => (parseInt(a.rollNumber, 10) || 0) - (parseInt(b.rollNumber, 10) || 0))
                .map((s: any) => {
                  const baseTotal = heads.reduce((sum, h) => sum + getBaseAmount(h.id), 0);
                  const hasCustom = s.customFeeAmount != null;
                  return (
                    <tr key={s.id} className="border-t border-warm-card-border/20 hover:bg-warm-card/20 transition-colors">
                      <td className="px-3 py-2.5 text-xs text-warm-muted">{s.rollNumber || '—'}</td>
                      <td className="px-4 py-2.5 text-xs text-warm-cream">{s.name}</td>
                      {heads.map(h => (
                        <td key={h.id} className="px-2 py-2.5 text-xs text-warm-muted text-center">{getBaseAmount(h.id) > 0 ? (getBaseAmount(h.id) / 100).toLocaleString() : '—'}</td>
                      ))}
                      <td className="px-3 py-2.5 text-xs text-center">{(baseTotal / 100).toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-xs text-center">
                        {editStudent === s.id ? (
                          <div className="flex flex-col items-center gap-1">
                            <input type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)}
                              className="w-20 rounded border border-warm-accent bg-[#1a1614] px-2 py-1 text-xs text-warm-cream text-center outline-none" autoFocus placeholder="PKR" />
                            <input value={editReason} onChange={e => setEditReason(e.target.value)}
                              className="w-24 rounded border border-warm-card-border bg-[#1a1614] px-2 py-0.5 text-[9px] text-warm-cream text-center outline-none" placeholder="Reason" />
                          </div>
                        ) : (
                          <span className={`text-xs ${hasCustom ? 'text-warm-accent font-medium' : 'text-warm-muted/40'}`}>
                            {hasCustom ? `${(s.customFeeAmount / 100).toLocaleString()}` : '—'}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {editStudent === s.id ? (
                          <div className="flex gap-1 justify-center">
                            <button onClick={() => handleSave(s.id)} className="text-xs text-green-400 hover:underline">✓</button>
                            <button onClick={() => setEditStudent(null)} className="text-xs text-warm-muted hover:underline">✕</button>
                          </div>
                        ) : (
                          <button onClick={() => { setEditStudent(s.id); setEditAmount(String(hasCustom ? s.customFeeAmount / 100 : '')); setEditReason(s.concessionReason || ''); }}
                            className="text-xs text-warm-accent hover:underline">
                            {hasCustom ? 'Edit' : 'Set'}
                          </button>
                        )}
                      </td>
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
