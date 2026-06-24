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
};

export default function StudentAttendanceDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [student, setStudent] = useState<any>(null);
  const [records, setRecords] = useState<AttRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [summary, setSummary] = useState<any>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    if (!id || !token) return;
    Promise.all([
      fetch(`${API_URL}/admin/students/${id}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API_URL}/admin/attendance?date=2026-06-24&groupId=`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([stuRes]) => {
      if (stuRes.success) setStudent(stuRes.data);
    }).catch(() => {});
  }, [id, token]);

  useEffect(() => {
    if (!id || !token) return;
    setLoading(true);
    fetch(`${API_URL}/admin/students/${id}/attendance?from=2026-06-01&to=2026-06-30`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()).then(res => {
      if (res.success) { setRecords(res.data.records || []); setSummary(res.data.summary); }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id, token]);

  const toggleStatus = (idx: number) => {
    setRecords(prev => prev.map((r, i) => {
      if (i !== idx) return r;
      const current = r.status || 'unmarked';
      const next: Record<string, string> = { unmarked: 'present', present: 'absent', absent: 'late', late: 'leave', leave: 'function', function: 'present' };
      const ns = next[current] || 'present';
      return { ...r, status: ns, note: ns === 'present' ? '' : r.note };
    }));
  };

  const setNote = (idx: number, note: string) => {
    setRecords(prev => prev.map((r, i) => i === idx ? { ...r, note } : r));
  };

  const handleSave = async () => {
    if (!id || !token) return;
    setSaving(true);
    const changed = records.filter(r => r.status && r.status !== 'unmarked');
    let saved = 0;
    for (const rec of changed) {
      try {
        const res = await fetch(`${API_URL}/admin/attendance/batch`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: rec.date, groupId: student?.groupId || 'temp',
            academicYearId: localStorage.getItem('activeAYId'),
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

  const d = (dateStr: string) => {
    const dt = new Date(dateStr + 'T00:00:00');
    return dt.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <button onClick={() => router.back()} className="mb-6 flex items-center gap-1.5 text-xs text-warm-muted hover:text-warm-cream">
        <ArrowLeft size={13} /> Back to Attendance
      </button>

      <div className="mb-6 flex items-center gap-3">
        <Calendar size={22} className="text-warm-accent" />
        <h1 className="text-xl font-light text-warm-cream">{student?.name || 'Student Attendance'}</h1>
      </div>

      {summary && (
        <div className="mb-6 flex items-center gap-4 text-xs text-warm-muted/70">
          <span className="text-green-400 font-medium">{summary.present}</span> P ·
          <span className="text-red-400 font-medium">{summary.absent}</span> A ·
          <span className="text-yellow-400 font-medium">{summary.late}</span> L ·
          <span className="font-medium">{summary.percentage}%</span>
        </div>
      )}

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
              {records.map((rec, idx) => (
                <tr key={rec.date} className="border-t border-warm-card-border/30 hover:bg-warm-card/20 transition-colors">
                  <td className="px-4 py-3 text-xs text-warm-muted/70">{d(rec.date)}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => toggleStatus(idx)}
                      className={`inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium min-w-[90px] ${statusColors[rec.status] || 'bg-warm-card/50 text-warm-muted/50 border-warm-card-border'}`}>
                      {rec.status ? rec.status.charAt(0).toUpperCase() + rec.status.slice(1) : '—'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    {['absent','late','leave'].includes(rec.status) ? (
                      <input type="text" value={rec.note || ''} onChange={e => setNote(idx, e.target.value)}
                        placeholder="Enter reason…"
                        className="w-full rounded border border-warm-card-border bg-[#1a1614] px-3 py-1.5 text-xs text-warm-cream outline-none placeholder:text-warm-muted/30 focus:border-warm-accent" />
                    ) : (
                      <span className="text-xs text-warm-muted/30">{rec.note || '—'}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {records.length === 0 && <div className="p-12 text-center text-sm text-warm-muted">No attendance records found.</div>}
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
