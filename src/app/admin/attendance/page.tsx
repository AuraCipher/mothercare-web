'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { api } from '@/lib/api';
import {
  Calendar, ChevronLeft, ChevronRight, Users, Save,
} from 'lucide-react';
import { showToast } from '@/components/toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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
  const dateRange = useMemo(() => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return { from: today, to: today, label: today };
    if (viewMode === 'day') return { from: date, to: date, label: date };
    if (viewMode === 'week') {
      const day = d.getDay();
      const mon = new Date(d); mon.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
      return {
        from: mon.toISOString().split('T')[0],
        to: sun.toISOString().split('T')[0],
        label: `${mon.toISOString().split('T')[0]} — ${sun.toISOString().split('T')[0]}`,
        days: Array.from({ length: 7 }, (_, i) => {
          const day = new Date(mon); day.setDate(mon.getDate() + i);
          return day.toISOString().split('T')[0];
        }),
      };
    }
    if (viewMode === 'month') {
      const from = new Date(d.getFullYear(), d.getMonth(), 1);
      const to = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const daysInMonth = to.getDate();
      return {
        from: from.toISOString().split('T')[0],
        to: to.toISOString().split('T')[0],
        label: from.toLocaleString('default', { month: 'long', year: 'numeric' }),
        days: Array.from({ length: daysInMonth }, (_, i) => {
          const day = new Date(from); day.setDate(i + 1);
          return day.toISOString().split('T')[0];
        }),
      };
    }
    // year
    return { from: `${d.getFullYear()}-01-01`, to: `${d.getFullYear()}-12-31`, label: `Year ${d.getFullYear()}` };
  }, [date, viewMode, today]);

  const loadUrl = viewMode === 'day'
    ? `${API_URL}/admin/attendance?date=${date}&groupId=${groupId}`
    : `${API_URL}/admin/attendance?from=${dateRange.from}&to=${dateRange.to}&groupId=${groupId}`;

  useEffect(() => {
    if (branchId && ayId) {
      api.getSections(branchId, ayId).then(d => { if (d.success) setSections(d.data); }).catch(() => {});
    }
  }, [branchId, ayId]);

  const loadAttendance = useCallback(async () => {
    if (!groupId || !token) return;
    setLoading(true);
    try {
      const res = await fetch(loadUrl, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) setStudents(json.data);
    } catch {} finally { setLoading(false); }
  }, [loadUrl, token, groupId]);

  useEffect(() => { loadAttendance(); }, [loadAttendance]);

  // Build lookup map: studentId -> dateString -> status
  const statusMap = useMemo(() => {
    const map: Record<string, Record<string, string>> = {};
    for (const s of students) {
      map[s.id] = {};
      for (const att of (s.attendances || [])) {
        const d = typeof att.date === 'string' ? att.date.split('T')[0] : att.date;
        map[s.id][d] = att.status;
      }
    }
    return map;
  }, [students]);

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

  // For day view — single status
  const getDayStatus = (s: any) => {
    const atts = s.attendances || [];
    const status = atts[0]?.status || 'unmarked';
    return { status, label: status === 'present' ? '✓ Present' : status === 'absent' ? '✗ Absent' : status === 'late' ? '⏳ Late' : '— Not Marked' };
  };

  const statusClass = (status: string) =>
    status === 'present' ? 'bg-green-900/20 text-green-400 border-green-900/30' :
    status === 'absent' ? 'bg-red-900/20 text-red-400 border-red-900/30' :
    status === 'late' ? 'bg-yellow-900/20 text-yellow-400 border-yellow-900/30' :
    'bg-warm-card/50 text-warm-muted/50 border-warm-card-border';

  const cellClass = (status: string) =>
    status === 'present' ? 'text-green-400 bg-green-900/10' :
    status === 'absent' ? 'text-red-400 bg-red-900/10' :
    status === 'late' ? 'text-yellow-400 bg-yellow-900/10' :
    'text-warm-muted/30';

  // Get the day columns for timetable-style views
  const viewDays = useMemo(() => {
    if (viewMode === 'week' || viewMode === 'month') return (dateRange as any).days as string[] | undefined;
    return undefined;
  }, [viewMode, dateRange]);

  const isTimetableView = viewMode === 'week' || viewMode === 'month';

  // Compute totals
  let totalP = 0, totalA = 0, totalL = 0, totalU = 0;
  if (viewMode === 'day') {
    students.forEach((s: any) => {
      const st = getDayStatus(s).status;
      if (st === 'present') totalP++;
      else if (st === 'absent') totalA++;
      else if (st === 'late') totalL++;
      else totalU++;
    });
  } else if (isTimetableView && viewDays) {
    for (const s of students) {
      for (const d of viewDays) {
        const st = statusMap[s.id]?.[d] || 'unmarked';
        if (st === 'present') totalP++;
        else if (st === 'absent') totalA++;
        else if (st === 'late') totalL++;
        else totalU++;
      }
    }
  } else {
    // Year view — summary counts
    students.forEach((s: any) => {
      const atts = s.attendances || [];
      totalP += atts.filter((a: any) => a.status === 'present').length;
      totalA += atts.filter((a: any) => a.status === 'absent').length;
      totalL += atts.filter((a: any) => a.status === 'late').length;
    });
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
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
              {viewMode === 'day' && (
                <>
                  <button onClick={() => markAll('present')} className="rounded-lg border border-green-900/30 px-3 py-1.5 text-xs text-green-400 hover:bg-green-900/10">All Present</button>
                  <button onClick={() => markAll('absent')} className="rounded-lg border border-red-900/30 px-3 py-1.5 text-xs text-red-400 hover:bg-red-900/10">All Absent</button>
                  <button onClick={() => markAll('late')} className="rounded-lg border border-yellow-900/30 px-3 py-1.5 text-xs text-yellow-400 hover:bg-yellow-900/10">All Late</button>
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              {viewMode !== 'day' && (
                <span className="text-xs text-warm-muted/60 mr-2">{dateRange.label}</span>
              )}
              <span className="text-xs text-warm-muted/70">
                <span className="text-green-400 font-medium">{totalP}</span> P · <span className="text-red-400 font-medium">{totalA}</span> A · <span className="text-yellow-400 font-medium">{totalL}</span> L
                {viewMode === 'day' && <span className="text-warm-muted/40 ml-1">· {totalU} pending</span>}
              </span>
              <button onClick={handleSave} disabled={saving || isFutureDate || viewMode !== 'day'}
                className="flex items-center gap-1.5 rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] disabled:opacity-50 transition-colors">
                <Save size={14} /> {viewMode !== 'day' ? 'Read Only' : isFutureDate ? 'Future Date' : saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-warm-card-border overflow-x-auto relative">
            <table className="w-full text-sm" style={{ minWidth: isTimetableView && viewDays ? `${viewDays.length * 32 + 260}px` : undefined }}>
              <thead>
                {isTimetableView && viewDays ? (
                  <tr>
                    <th className="w-10 min-w-[40px] px-1 py-3 text-xs text-warm-muted font-medium text-center sticky left-0 bg-[#24201e] z-20">#</th>
                    <th className="text-left px-2 py-3 text-xs text-warm-muted font-medium min-w-[120px] sticky left-10 bg-[#24201e] z-20">Student</th>
                    {viewDays.map((d, i) => {
                      const dt = new Date(d + 'T00:00:00');
                      const monthLabel = dt.toLocaleString('default', { month: 'short' });
                      const dayNum = parseInt(d.slice(8), 10);
                      return (
                        <th key={d} className="px-0 py-3 text-xs text-warm-muted font-medium text-center min-w-[32px] w-[32px] bg-[#24201e]">
                          <div className="flex flex-col items-center leading-tight">
                            <span className="font-semibold">
                              {viewMode === 'week' ? DAYS[i] : dayNum}
                              {viewMode === 'week' && <span className="text-[9px] text-warm-muted/40 ml-0.5">{monthLabel}</span>}
                            </span>
                            <span className="text-[8px] text-warm-muted/30 -mt-0.5">{d.slice(5, 7)}/{d.slice(8)}</span>
                          </div>
                        </th>
                      );
                    })}
                    <th className="w-16 min-w-[64px] px-2 py-3 text-xs text-warm-muted font-medium text-center sticky right-0 bg-[#24201e] z-20">Sum</th>
                  </tr>
                ) : (
                  <tr className="bg-warm-card/70">
                    <th className="w-16 px-4 py-3 text-xs text-warm-muted font-medium text-center">Roll</th>
                    <th className="text-left px-4 py-3 text-xs text-warm-muted font-medium">Student Name</th>
                    <th className="w-48 px-4 py-3 text-xs text-warm-muted font-medium text-center">
                      {viewMode === 'day' ? 'Status' : 'Sum'}
                    </th>
                  </tr>
                )}
              </thead>
              <tbody>
                {students.map((s: any, idx: number) => {
                  if (isTimetableView && viewDays) {
                    let sp = 0, sa = 0, sl = 0;
                    for (const d of viewDays) {
                      const st = statusMap[s.id]?.[d] || 'unmarked';
                      if (st === 'present') sp++;
                      else if (st === 'absent') sa++;
                      else if (st === 'late') sl++;
                    }
                    return (
                      <tr key={s.id} className="border-t border-warm-card-border/30 hover:bg-warm-card/20 transition-colors">
                        <td className="px-1 py-2 text-xs text-warm-muted text-center sticky left-0 bg-[#1a1614] z-10">{idx + 1}</td>
                        <td className="px-2 py-2 sticky left-10 bg-[#1a1614] z-10">
                          <p className="text-sm text-warm-cream truncate max-w-[140px]">{s.name}</p>
                          <p className="text-[9px] text-warm-muted/40">{s.rollNumber || ''}</p>
                        </td>
                        {viewDays.map(d => {
                          const st = statusMap[s.id]?.[d] || 'unmarked';
                          return (
                            <td key={d} className="px-0 py-2 text-center min-w-[32px] w-[32px]">
                              <span className={`inline-flex items-center justify-center w-7 h-7 rounded text-xs font-bold ${cellClass(st)}`}>
                                {st === 'present' ? 'P' : st === 'absent' ? 'A' : st === 'late' ? 'L' : '·'}
                              </span>
                            </td>
                          );
                        })}
                        <td className="px-2 py-2 text-center sticky right-0 bg-[#1a1614] z-10">
                          <span className="text-xs font-mono">
                            <span className="text-green-400 font-medium">{sp > 0 ? 'P' + sp : ''}</span>
                            {sa > 0 && <span className="text-red-400 font-medium ml-0.5">A{sa}</span>}
                            {sl > 0 && <span className="text-yellow-400 font-medium ml-0.5">L{sl}</span>}
                            {sp === 0 && sa === 0 && sl === 0 && <span className="text-warm-muted/30">·</span>}
                          </span>
                        </td>
                      </tr>
                    );
                  }

                  const dayView = viewMode === 'day';

                  return (
                    <tr key={s.id} onClick={() => dayView && toggleStatus(s.id)}
                      className="border-t border-warm-card-border/30 hover:bg-warm-card/20 transition-colors cursor-pointer">
                      <td className="px-4 py-3 text-xs text-warm-muted text-center">{s.rollNumber || '—'}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-warm-cream">{s.name}</p>
                        <p className="text-[10px] text-warm-muted/50">{s.admissionNumber || ''}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {dayView ? (
                          <span className={`inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium min-w-[100px] ${statusClass(getDayStatus(s).status)}`}>
                            {getDayStatus(s).label}
                          </span>
                        ) : (
                          (() => {
                            const atts = s.attendances || [];
                            const p = atts.filter((a: any) => a.status === 'present').length;
                            const a = atts.filter((a: any) => a.status === 'absent').length;
                            const l = atts.filter((a: any) => a.status === 'late').length;
                            return (
                              <span className="text-xs font-mono">
                                <span className="text-green-400 font-medium">{p > 0 ? `P${p}` : ''}</span>
                                {a > 0 && <span className="text-red-400 font-medium ml-1">{`A${a}`}</span>}
                                {l > 0 && <span className="text-yellow-400 ml-1">{`L${l}`}</span>}
                                {p === 0 && a === 0 && l === 0 && <span className="text-warm-muted/30">·</span>}
                              </span>
                            );
                          })()
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
