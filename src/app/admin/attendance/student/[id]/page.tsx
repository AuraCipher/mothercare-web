'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Calendar } from 'lucide-react';
import { showToast } from '@/components/toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

type AttRecord = { date: string; status: string; note?: string };

const statusColors: Record<string, string> = {
  present: 'bg-green-900/20 text-green-400 border-green-900/30',
  absent: 'bg-red-900/20 text-red-400 border-red-900/30',
  late: 'bg-yellow-900/20 text-yellow-400 border-yellow-900/30',
  leave: 'bg-blue-900/20 text-blue-400 border-blue-900/30',
  holiday: 'bg-purple-900/20 text-purple-400 border-purple-900/30',
  function: 'bg-pink-900/20 text-pink-400 border-pink-900/30',
  future: 'bg-warm-card/30 text-warm-muted/30 border-warm-card-border',
};

function fmtDate(d: string): string {
  const raw = (d || '').split('T')[0];
  if (!raw) return d;
  const dt = new Date(raw + 'T00:00:00');
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

function thisMonthRange() {
  const now = new Date();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const y = now.getFullYear();
  const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
  return { from: `${y}-${m}-01`, to: `${y}-${m}-${String(lastDay).padStart(2, '0')}` };
}

function isFutureDate(dateStr: string): boolean {
  const d = new Date(dateStr + 'T23:59:59');
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return d > today;
}

export default function StudentAttendanceDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [student, setStudent] = useState<any>(null);
  const [records, setRecords] = useState<AttRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ayId, setAyId] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const { from, to } = thisMonthRange();

  useEffect(() => {
    if (!id || !token) return;
    setAyId(localStorage.getItem('activeAYId') || '');

    setLoading(true);
    Promise.all([
      fetch(`${API_URL}/admin/students/${id}/attendance?from=${from}&to=${to}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API_URL}/admin/students/${id}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([attRes, stuRes]) => {
      if (stuRes.success) setStudent(stuRes.data);

      // Build full month day list merged with existing records
      const attMap: Record<string, AttRecord> = {};
      if (attRes.success) {
        for (const r of (attRes.data?.records || [])) {
          const key = (r.date || '').split('T')[0];
          attMap[key] = { date: key, status: r.status, note: r.note };
        }
      }

      const todayStr = new Date().toISOString().split('T')[0];
      const allDays: AttRecord[] = [];
      const cursor = new Date(from);
      while (cursor.toISOString().split('T')[0] <= to) {
        const key = cursor.toISOString().split('T')[0];
        if (attMap[key]) {
          allDays.push(attMap[key]);
        } else {
          allDays.push({ date: key, status: key > todayStr ? 'future' : 'unmarked', note: '' });
        }
        cursor.setDate(cursor.getDate() + 1);
      }
      setRecords(allDays);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id, token, from, to]);

  const toggleStatus = (idx: number) => {
    setRecords(prev => prev.map((r, i) => {
      if (i !== idx || r.status === 'future' || isFutureDate(r.date)) return r;
      const current = r.status || 'unmarked';
      const next: Record<string, string> = { unmarked: 'present', present: 'absent', absent: 'late', late: 'leave', leave: 'function', function: 'present' };
      const ns = next[current] || 'present';
      return { ...r, status: ns, note: ns === 'present' ? '' : r.note };
    }));
  };

  const setNote = (idx: number, note: string) => {
    setRecords(prev => prev.map((r, i) => {
      if (i !== idx || r.status === 'future' || isFutureDate(r.date)) return r;
      return { ...r, note };
    }));
  };

  const handleSave = async () => {
    if (!id || !token) return;
    setSaving(true);
    const changed = records.filter(r => r.status && !['unmarked', 'future'].includes(r.status));
    let saved = 0;
    for (const rec of changed) {
      // Skip future dates
      if (isFutureDate(rec.date)) continue;
      try {
        const res = await fetch(`${API_URL}/admin/attendance/batch`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: rec.date, groupId: student?.groupId || 'temp',
            academicYearId: ayId,
            records: [{ studentId: id, status: rec.status, note: rec.note || '' }],
          }),
        });
        const json = await res.json();
        if (json.success) saved++;
      } catch {}
    }
    showToast('success', `${saved} records saved`);
    setSaving(false);
  };

  const totalP = records.filter(r => r.status === 'present' || r.status === 'holiday').length;
  const totalA = records.filter(r => r.status === 'absent').length;
  const totalL = records.filter(r => r.status === 'late').length;
  const totalLv = records.filter(r => r.status === 'leave').length;
  const totalRec = records.filter(r => r.status !== 'future').length;
  const totalF = records.filter(r => r.status === 'function').length;
  const pct = totalRec ? Math.round(((totalP) / (totalP + totalA + totalL + totalLv + totalF)) * 100) : 0;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <button onClick={() => router.back()} className="mb-6 flex items-center gap-1.5 text-xs text-warm-muted hover:text-warm-cream">
        <ArrowLeft size={13} /> Back
      </button>

      <div className="mb-6">
        <h1 className="text-xl font-light text-warm-cream">{student?.name || 'Student Attendance'}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-warm-muted/70">
          <span className="text-green-400 font-medium">{totalP}</span> P ·
          <span className="text-red-400 font-medium">{totalA}</span> A ·
          <span className="text-yellow-400 font-medium">{totalL}</span> L ·
          <span className="text-blue-400 font-medium">{totalLv}</span> Lv ·
          <span className={pct >= 80 ? 'text-green-400 font-medium' : pct >= 70 ? 'text-yellow-400 font-medium' : 'text-red-400 font-medium'}>{pct}%</span>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 animate-pulse rounded-lg bg-warm-card" />)}</div>
      ) : (
        <div className="rounded-xl border border-warm-card-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-warm-card/70">
                <th className="text-left px-4 py-3 text-xs text-warm-muted font-medium">Date</th>
                <th className="w-32 px-4 py-3 text-xs text-warm-muted font-medium text-center">Status</th>
                <th className="px-4 py-3 text-xs text-warm-muted font-medium">Note / Reason</th>
              </tr>
            </thead>
            <tbody>
              {records.map((rec, idx) => {
                const fut = rec.status === 'future' || isFutureDate(rec.date);
                return (
                  <tr key={rec.date} className={`border-t border-warm-card-border/30 transition-colors ${fut ? 'opacity-50' : 'hover:bg-warm-card/20'}`}>
                    <td className="px-4 py-3 text-xs text-warm-muted/70">{fmtDate(rec.date)}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => toggleStatus(idx)} disabled={fut}
                        className={`inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium min-w-[90px] ${statusColors[rec.status] || 'bg-warm-card/50 text-warm-muted/50 border-warm-card-border'}`}>
                        {rec.status === 'future' ? '—' : rec.status ? rec.status.charAt(0).toUpperCase() + rec.status.slice(1) : '—'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      {fut ? (
                        <span className="text-xs text-warm-muted/20">Upcoming</span>
                      ) : ['absent','late','leave'].includes(rec.status) ? (
                        <input type="text" value={rec.note || ''} onChange={e => setNote(idx, e.target.value)}
                          placeholder="Enter reason…"
                          className="w-full rounded border border-warm-card-border bg-[#1a1614] px-3 py-1.5 text-xs text-warm-cream outline-none placeholder:text-warm-muted/30 focus:border-warm-accent" />
                      ) : (
                        <span className="text-xs text-warm-muted/30">{rec.note || '—'}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {records.length === 0 && <div className="p-12 text-center text-sm text-warm-muted">No attendance records this month.</div>}
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-1.5 rounded-lg bg-warm-accent px-6 py-2.5 text-sm font-medium text-[#1a1614] hover:bg-[#b39a76] disabled:opacity-50 transition-colors">
          <Save size={15} /> {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </main>
  );
}
