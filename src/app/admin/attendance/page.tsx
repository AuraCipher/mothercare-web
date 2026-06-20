'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import {
  Calendar, ChevronLeft, ChevronRight, Users, Save,
} from 'lucide-react';
import { showToast } from '@/components/toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function AttendancePage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupId, setGroupId] = useState('');
  const [sections, setSections] = useState<any[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month' | 'year'>('day');
  const [saving, setSaving] = useState(false);

  const branchId = typeof window !== 'undefined' ? localStorage.getItem('activeBranchId') : null;
  const ayId = typeof window !== 'undefined' ? localStorage.getItem('activeAYId') : null;
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const today = new Date().toISOString().split('T')[0];
  const isFutureDate = date > today;

  // Calculate from/to based on view mode
  const dateRange = (() => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return { from: today, to: today, label: today };
    if (viewMode === 'day') return { from: date, to: date, label: date };
    if (viewMode === 'week') {
      const day = d.getDay();
      const mon = new Date(d); mon.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
      return { from: mon.toISOString().split('T')[0], to: sun.toISOString().split('T')[0], label: `${mon.toISOString().split('T')[0]} — ${sun.toISOString().split('T')[0]}` };
    }
    if (viewMode === 'month') {
      const from = new Date(d.getFullYear(), d.getMonth(), 1);
      const to = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      return { from: from.toISOString().split('T')[0], to: to.toISOString().split('T')[0], label: from.toLocaleString('default', { month: 'long', year: 'numeric' }) };
    }
    // year
    return { from: `${d.getFullYear()}-01-01`, to: `${d.getFullYear()}-12-31`, label: `Year ${d.getFullYear()}` };
  })();

  const loadUrl = viewMode === 'day'
    ? `${API_URL}/admin/attendance?date=${date}&groupId=${groupId}`
    : `${API_URL}/admin/attendance?from=${dateRange.from}&to=${dateRange.to}&groupId=${groupId}`;

  useEffect(() => {
    if (branchId && ayId) {
      api.getSections(branchId, ayId).then(d => { if (d.success) setSections(d.data); }).catch(() => {});
    }
  }, []);

  const loadAttendance = useCallback(async () => {
    if (!groupId || !token) return;
    setLoading(true);
    try {
      const res = await fetch(loadUrl, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) setStudents(json.data);
    } catch {} finally { setLoading(false); }
  }, [loadUrl, token]);

  useEffect(() => { loadAttendance(); }, [loadAttendance]);

  const toggleStatus = (studentId: string) => {
    setStudents((prev: any[]) => prev.map((s: any) => {
      if (s.id !== studentId) return s;
      const current = s.attendances?.[0]?.status || 'unmarked';
      const next: Record<string, string> = { unmarked: 'present', present: 'absent', absent: 'late', late: 'present' };
      const newStatus = next[current] || 'present';
      return { ...s, attendances: [{ status: newStatus }] };
    }));
  };

  const markAll = (status: string) => {
    setStudents((prev: any[]) => prev.map((s: any) => ({ ...s, attendances: [{ status }] })));
  };

  const handleSave = async () => {
    if (!groupId || !date || !token) return;
    setSaving(true);
    const records = students
      .filter((s: any) => s.attendances?.[0]?.status && s.attendances[0].status !== 'unmarked')
      .map((s: any) => ({ studentId: s.id, status: s.attendances[0].status }));
    try {
      const res = await fetch(`${API_URL}/admin/attendance/batch`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, groupId, academicYearId: ayId, records }),
      });
      const json = await res.json();
      if (json.success) { showToast('success', `${json.data.saved} saved`); loadAttendance(); }
      else showToast('error', json.message || 'Failed');
    } catch { showToast('error', 'Failed'); } finally { setSaving(false); }
  };

  const changeDate = (dir: number) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return;
    if (viewMode === 'month') d.setMonth(d.getMonth() + dir);
    else if (viewMode === 'year') d.setFullYear(d.getFullYear() + dir);
    else d.setDate(d.getDate() + dir * (viewMode === 'week' ? 7 : 1));
    setDate(d.toISOString().split('T')[0]);
  };

  // For range views (week/month/year), compute summary per student
  const getSummary = (s: any) => {
    const atts = s.attendances || [];
    if (viewMode === 'day') {
      const status = atts[0]?.status || 'unmarked';
      return { status, label: status === 'present' ? '✓ Present' : status === 'absent' ? '✗ Absent' : status === 'late' ? '⏳ Late' : '— Not Marked' };
    }
    const p = atts.filter((a: any) => a.status === 'present').length;
    const a = atts.filter((a: any) => a.status === 'absent').length;
    const l = atts.filter((a: any) => a.status === 'late').length;
    return { status: 'summary', label: `P${p} A${a} L${l}`, p, a, l };
  };

  const statusClass = (status: string) =>
    status === 'present' ? 'bg-green-900/20 text-green-400 border-green-900/30' :
    status === 'absent' ? 'bg-red-900/20 text-red-400 border-red-900/30' :
    status === 'late' ? 'bg-yellow-900/20 text-yellow-400 border-yellow-900/30' :
    'bg-warm-card/50 text-warm-muted/50 border-warm-card-border';

  let totalP = 0, totalA = 0, totalL = 0, totalU = 0;
  students.forEach((s: any) => {
    const summary = getSummary(s);
    if (viewMode === 'day') {
      if (summary.status === 'present') totalP++;
      else if (summary.status === 'absent') totalA++;
      else if (summary.status === 'late') totalL++;
      else totalU++;
    } else {
      totalP += (summary as any).p || 0;
      totalA += (summary as any).a || 0;
      totalL += (summary as any).l || 0;
    }
  });

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Calendar size={22} className="text-warm-accent" />
        <h1 className="text-xl font-light text-warm-cream">Attendance</h1>
      </div>

      {/* Top bar: class + date + view mode */}
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
          {date !== today && <button onClick={() => setDate(today)} className="text-xs text-warm-accent hover:underline">Today</button>}
        </div>

        <div className="flex items-center gap-1">
          {(['day', 'week', 'month', 'year'] as const).map(m => (
            <button key={m} onClick={() => setViewMode(m)}
              className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
                viewMode === m ? 'bg-warm-accent text-[#1a1614] font-medium' : 'border border-warm-card-border text-warm-muted hover:text-warm-cream'
              }`}>{m === 'day' ? 'Day' : m === 'week' ? 'Week' : m === 'month' ? 'Month' : 'Year'}</button>
          ))}
        </div>
      </div>

      {!groupId ? (
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-12 text-center">
          <p className="text-sm text-warm-muted">Select a class to view attendance.</p>
        </div>
      ) : loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 animate-pulse rounded-lg bg-warm-card" />)}</div>
      ) : (
        <>
          {/* Bulk actions + summary */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button onClick={() => markAll('present')} className="rounded-lg border border-green-900/30 px-3 py-1.5 text-xs text-green-400 hover:bg-green-900/10">All Present</button>
              <button onClick={() => markAll('absent')} className="rounded-lg border border-red-900/30 px-3 py-1.5 text-xs text-red-400 hover:bg-red-900/10">All Absent</button>
              <button onClick={() => markAll('late')} className="rounded-lg border border-yellow-900/30 px-3 py-1.5 text-xs text-yellow-400 hover:bg-yellow-900/10">All Late</button>
            </div>
            <div className="flex items-center gap-3">
              {viewMode !== 'day' && (
                <span className="text-xs text-warm-muted/60 mr-2">{dateRange.label}</span>
              )}
              <span className="text-xs text-warm-muted/70">
                <span className="text-green-400 font-medium">{totalP}</span> P · <span className="text-red-400 font-medium">{totalA}</span> A · <span className="text-yellow-400 font-medium">{totalL}</span> L
                {viewMode === 'day' && <span className="text-warm-muted/40 ml-1">· {totalU} pending</span>}
              </span>
              <button onClick={handleSave} disabled={saving || isFutureDate}
                className="flex items-center gap-1.5 rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] disabled:opacity-50 transition-colors">
                <Save size={14} /> {isFutureDate ? 'Future Date' : saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-warm-card-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-warm-card/70">
                  <th className="w-16 px-4 py-3 text-xs text-warm-muted font-medium text-center">Roll</th>
                  <th className="text-left px-4 py-3 text-xs text-warm-muted font-medium">Student Name</th>
                  <th className="w-48 px-4 py-3 text-xs text-warm-muted font-medium text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s: any) => {
                  const summary = getSummary(s);
                  return (
                    <tr key={s.id} onClick={() => viewMode === 'day' && toggleStatus(s.id)}
                      className="border-t border-warm-card-border/30 hover:bg-warm-card/20 transition-colors cursor-pointer">
                      <td className="px-4 py-3 text-xs text-warm-muted text-center">{s.rollNumber || '—'}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-warm-cream">{s.name}</p>
                        <p className="text-[10px] text-warm-muted/50">{s.admissionNumber || ''}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {viewMode === 'day' ? (
                          <span className={`inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium min-w-[100px] ${statusClass(summary.status)}`}>
                            {summary.label}
                          </span>
                        ) : (
                          <span className="text-xs font-mono">
                            <span className="text-green-400 font-medium">{summary.label.split(' ')[0]}</span>
                            {summary.label.includes('A') && <span className="text-red-400 font-medium ml-1">{(summary as any).a > 0 ? `A${(summary as any).a}` : ''}</span>}
                            {summary.label.includes('L') && <span className="text-yellow-400 ml-1">{(summary as any).l > 0 ? `L${(summary as any).l}` : ''}</span>}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {students.length === 0 && (
              <div className="p-12 text-center text-sm text-warm-muted">No students in this class.</div>
            )}
          </div>
        </>
      )}
    </main>
  );
}
