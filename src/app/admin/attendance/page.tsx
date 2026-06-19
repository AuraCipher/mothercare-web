'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  Calendar, ChevronLeft, ChevronRight, Users, BookOpen, Search,
  Check, X, AlertTriangle, Save,
} from 'lucide-react';
import { showToast } from '@/components/toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

type AttStatus = 'present' | 'absent' | 'late' | 'half-day' | 'unmarked';

export default function AttendancePage() {
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupId, setGroupId] = useState('');
  const [sections, setSections] = useState<any[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  const branchId = typeof window !== 'undefined' ? localStorage.getItem('activeBranchId') : null;
  const ayId = typeof window !== 'undefined' ? localStorage.getItem('activeAYId') : null;

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // Load sections
  useEffect(() => {
    if (branchId && ayId) {
      api.getSections(branchId, ayId).then(d => { if (d.success) setSections(d.data); }).catch(() => {});
    }
  }, []);

  const loadAttendance = useCallback(async () => {
    if (!groupId || !date || !token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/attendance?date=${date}&groupId=${groupId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setStudents(data.data);
    } catch {} finally { setLoading(false); }
  }, [groupId, date, token]);

  useEffect(() => { loadAttendance(); }, [loadAttendance]);

  const setStatus = (studentId: string, status: AttStatus) => {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status } : s));
  };

  const toggleStatus = (studentId: string, current: AttStatus) => {
    const next: Record<string, AttStatus> = { unmarked: 'present', present: 'absent', absent: 'late', late: 'half-day', 'half-day': 'present' };
    setStatus(studentId, next[current] || 'present');
  };

  const markAll = (status: AttStatus) => {
    setStudents(prev => prev.map(s => ({ ...s, status })));
  };

  const handleSave = async () => {
    if (!groupId || !date || !token) return;
    setSaving(true);
    const records = students
      .filter(s => s.status !== 'unmarked')
      .map(s => ({ studentId: s.id, status: s.status }));

    try {
      const res = await fetch(`${API_URL}/admin/attendance/batch`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, groupId, academicYearId: ayId, records }),
      });
      const data = await res.json();
      if (data.success) { showToast('success', `${data.data.saved} attendance records saved`); loadAttendance(); }
      else showToast('error', data.message || 'Save failed');
    } catch { showToast('error', 'Failed to save'); }
    finally { setSaving(false); }
  };

  const changeDate = (days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().split('T')[0]);
  };

  const today = new Date().toISOString().split('T')[0];
  const counts = { present: 0, absent: 0, late: 0, 'half-day': 0, unmarked: 0 };
  students.forEach(s => { (counts as any)[s.status]++; });

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar size={22} className="text-warm-accent" />
          <h1 className="text-xl font-light text-warm-cream">Attendance</h1>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div className="min-w-[200px]">
          <select value={groupId} onChange={(e) => setGroupId(e.target.value)}
            className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent transition-colors">
            <option value="">— Select Class —</option>
            {sections.map((s: any) => (
              <option key={s.id} value={s.id}>{s.name}{s.section ? ` — ${s.section}` : ''}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => changeDate(-1)} className="rounded-lg p-2 text-warm-muted hover:bg-warm-card hover:text-warm-cream transition-colors"><ChevronLeft size={16} /></button>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent transition-colors" />
          <button onClick={() => changeDate(1)} className="rounded-lg p-2 text-warm-muted hover:bg-warm-card hover:text-warm-cream transition-colors"><ChevronRight size={16} /></button>
          {date !== today && (
            <button onClick={() => setDate(today)} className="text-xs text-warm-accent hover:underline">Today</button>
          )}
        </div>
      </div>

      {!groupId ? (
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-12 text-center">
          <p className="text-sm text-warm-muted">Select a class to view attendance.</p>
        </div>
      ) : loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 animate-pulse rounded-lg bg-warm-card" />)}</div>
      ) : students.length === 0 ? (
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-12 text-center">
          <p className="text-sm text-warm-muted">No students found in this class.</p>
        </div>
      ) : (
        <>
          {/* Bulk actions + summary */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => markAll('present')} className="rounded-lg border border-green-900/30 px-3 py-1.5 text-xs text-green-400 hover:bg-green-900/10 transition-colors">All Present</button>
              <button onClick={() => markAll('absent')} className="rounded-lg border border-red-900/30 px-3 py-1.5 text-xs text-red-400 hover:bg-red-900/10 transition-colors">All Absent</button>
              <button onClick={() => markAll('late')} className="rounded-lg border border-yellow-900/30 px-3 py-1.5 text-xs text-yellow-400 hover:bg-yellow-900/10 transition-colors">All Late</button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-warm-muted/60">
                <span className="text-green-400">{counts.present} P</span>
                {' · '}
                <span className="text-red-400">{counts.absent} A</span>
                {' · '}
                <span className="text-yellow-400">{counts.late} L</span>
                {' · '}
                <span className="text-warm-muted/40">{counts.unmarked} pending</span>
              </span>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-1.5 rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] transition-colors disabled:opacity-50">
                <Save size={14} /> {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>

          {/* Student list */}
          <div className="rounded-xl border border-warm-card-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-warm-card/50">
                  <th className="w-12 px-3 py-2 text-xs text-warm-muted font-medium">Roll</th>
                  <th className="text-left px-3 py-2 text-xs text-warm-muted font-medium">Name</th>
                  <th className="text-center px-3 py-2 text-xs text-warm-muted font-medium w-32">Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s: any) => (
                  <tr key={s.id}
                    className="border-t border-warm-card-border/50 hover:bg-warm-card/30 transition-colors cursor-pointer"
                    onClick={() => toggleStatus(s.id, s.status)}>
                    <td className="px-3 py-3 text-xs text-warm-muted text-center">{s.rollNumber || '—'}</td>
                    <td className="px-3 py-3">
                      <p className="text-sm text-warm-cream">{s.name}</p>
                      <p className="text-[10px] text-warm-muted/50">{s.admissionNumber || ''}</p>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                        s.status === 'present' ? 'bg-green-900/20 text-green-400' :
                        s.status === 'absent' ? 'bg-red-900/20 text-red-400' :
                        s.status === 'late' ? 'bg-yellow-900/20 text-yellow-400' :
                        s.status === 'half-day' ? 'bg-blue-900/20 text-blue-400' :
                        'bg-warm-card/50 text-warm-muted/50'
                      }`}>
                        {s.status === 'present' ? '✓ Present' :
                         s.status === 'absent' ? '✗ Absent' :
                         s.status === 'late' ? '⏳ Late' :
                         s.status === 'half-day' ? '◐ Half Day' :
                         '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}
