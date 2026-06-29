'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { api } from '@/lib/api';
import {
  Calendar, ChevronLeft, ChevronRight, Save,
} from 'lucide-react';
import { showToast } from '@/components/toast';
import config from '@/config';
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const EDIT_LOCK_DAYS = 7; // Can't edit attendance older than this many days

// Format date as YYYY-MM-DD using local time (no UTC timezone shift)
function localDateStr(d: Date): string {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function todayStr(): string { return localDateStr(new Date()); }

// Attendance percentage across an array of attendance records
function attPercent(atts: any[]): number {
  const total = atts.length;
  if (!total) return 0;
  const present = atts.filter((a: any) => a.status === 'present' || a.status === 'holiday').length;
  return Math.round((present / total) * 100);
}
function attColor(pct: number): string {
  return pct >= 80 ? 'text-green-400' : pct >= 70 ? 'text-yellow-400' : 'text-red-400';
}

// Build a display label for a group from sections array
function groupLabel(sections: any[], id: string): string {
  const g = sections.find(s => s.id === id);
  if (!g) return '';
  return g.section ? `${g.name} — ${g.section}` : g.name;
}

export default function AttendancePage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupId, setGroupId] = useState('');
  const [sections, setSections] = useState<any[]>([]);
  const [date, setDate] = useState(todayStr());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month' | 'year'>('day');
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  const scrollToLetter = (letter: string) => {
    const el = document.getElementById('stu-' + letter);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const branchId = typeof window !== 'undefined' ? localStorage.getItem('activeBranchId') : null;
  const ayId = typeof window !== 'undefined' ? localStorage.getItem('activeAYId') : null;
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const todayDt = new Date();
  const today = todayStr();
  const isFutureDate = date > today;
  const isLocked = (() => {
    const d = new Date(date + 'T00:00:00');
    const cutoff = new Date(todayDt);
    cutoff.setDate(cutoff.getDate() - EDIT_LOCK_DAYS);
    return d < cutoff;
  })();

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
        from: localDateStr(mon),
        to: localDateStr(sun),
        label: `${localDateStr(mon)} — ${localDateStr(sun)}`,
        days: Array.from({ length: 7 }, (_, i) => {
          const day = new Date(mon); day.setDate(mon.getDate() + i);
          return localDateStr(day);
        }),
      };
    }
    if (viewMode === 'month') {
      const from = new Date(d.getFullYear(), d.getMonth(), 1);
      const to = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const daysInMonth = to.getDate();
      return {
        from: localDateStr(from),
        to: localDateStr(to),
        label: from.toLocaleString('default', { month: 'long', year: 'numeric' }),
        days: Array.from({ length: daysInMonth }, (_, i) => {
          const day = new Date(from); day.setDate(i + 1);
          return localDateStr(day);
        }),
      };
    }
    // year
    const year = d.getFullYear();
    return {
      from: `${year}-01-01`,
      to: `${year}-12-31`,
      label: `Year ${year}`,
      months: Array.from({ length: 12 }, (_, i) => {
        const m = String(i + 1).padStart(2, '0');
        return { label: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i], from: `${year}-${m}-01`, to: `${year}-${m}-${new Date(year, i + 1, 0).getDate()}` };
      }),
    };
  }, [date, viewMode, today]);

  const loadUrl = viewMode === 'day'
    ? `${config.apiUrl}/admin/attendance?date=${date}${groupId ? `&groupId=${groupId}` : ''}`
    : `${config.apiUrl}/admin/attendance?from=${dateRange.from}&to=${dateRange.to}${groupId ? `&groupId=${groupId}` : ''}`;

  useEffect(() => {
    if (branchId && ayId) {
      api.getSections(branchId, ayId).then(d => { if (d.success) setSections(d.data); }).catch(() => {});
    }
  }, [branchId, ayId]);

  const loadAttendance = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(loadUrl, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) setStudents(json.data);
    } catch {} finally { setLoading(false); }
  }, [loadUrl, token]);

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

  // Filter students by search query and status
  const filteredStudents = useMemo(() => {
    let result = students;
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((s: any) =>
        s.name?.toLowerCase().includes(q) ||
        s.rollNumber?.toLowerCase().includes(q)
      );
    }
    // Status filter (only in day view)
    if (statusFilter && viewMode === 'day') {
      result = result.filter((s: any) => {
        const st = s.attendances?.[0]?.status || 'unmarked';
        return st === statusFilter;
      });
    }
    return result;
  }, [students, searchQuery, statusFilter, viewMode]);

  // Check if a date string is Sunday
  const isSunday = (dateStr: string) => new Date(dateStr + 'T00:00:00').getDay() === 0;

  // Get cell status: actual attendance, or 'holiday' for Sunday with no record
  const getCellStatus = (studentId: string, dateStr: string) => {
    const attStatus = statusMap[studentId]?.[dateStr];
    if (attStatus) return attStatus;
    if (isSunday(dateStr)) return 'holiday';
    return 'unmarked';
  };

  const toggleStatus = (studentId: string) => {
    setStudents((prev: any[]) => prev.map((s: any) => {
      if (s.id !== studentId) return s;
      const current = s.attendances?.[0]?.status || 'unmarked';
      const next: Record<string, string> = { unmarked: 'present', present: 'absent', absent: 'late', late: 'leave', leave: 'half-day', 'half-day': 'function', function: 'present' };
      const newStatus = next[current] || 'present';
      const note = newStatus === 'present' ? '' : (s.attendances?.[0]?.note || '');
      return { ...s, attendances: [{ status: newStatus, note }] };
    }));
  };

  const markAll = (status: string) => {
    setStudents((prev: any[]) => prev.map((s: any) => ({ ...s, attendances: [{ status }] })));
  };

  // Mark a date as holiday for all students
  const markHoliday = async (dateStr: string) => {
    if (!groupId || !token) return;
    setSaving(true);
    const records = students.map((s: any) => ({ studentId: s.id, status: 'holiday' }));
    try {
      const res = await fetch(`${config.apiUrl}/admin/attendance/batch`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateStr, groupId, academicYearId: ayId, records }),
      });
      const json = await res.json();
      if (json.success) { showToast('success', `Holiday set for ${json.data.saved} students`); loadAttendance(); }
      else showToast('error', json.message || 'Failed');
    } catch { showToast('error', 'Failed'); } finally { setSaving(false); }
  };

  const handleSave = async () => {
    if (!groupId || !date || !token) return;
    setSaving(true);
    const records = students
      .filter((s: any) => s.attendances?.[0]?.status && s.attendances[0].status !== 'unmarked')
      .map((s: any) => ({ studentId: s.id, status: s.attendances[0].status, note: s.attendances[0]?.note || '' }));
    try {
      const res = await fetch(`${config.apiUrl}/admin/attendance/batch`, {
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
    setDate(localDateStr(d));
  };

  // For day view — single status
  const getDayStatus = (s: any) => {
    const atts = s.attendances || [];
    const status = atts[0]?.status || 'unmarked';
    const labels: Record<string, string> = { present: '✓ Present', absent: '✗ Absent', late: '⏳ Late', leave: '✈ Leave', 'half-day': 'Half-Day', holiday: 'Holiday', function: 'Function' };
    return { status, label: labels[status] || '— Not Marked' };
  };

  const statusClass = (status: string) =>
    status === 'present' ? 'bg-green-900/20 text-green-400 border-green-900/30' :
    status === 'absent' ? 'bg-red-900/20 text-red-400 border-red-900/30' :
    status === 'late' ? 'bg-yellow-900/20 text-yellow-400 border-yellow-900/30' :
    status === 'leave' ? 'bg-blue-900/20 text-blue-400 border-blue-900/30' :
    status === 'half-day' ? 'bg-cyan-900/20 text-cyan-400 border-cyan-900/30' :
    status === 'holiday' ? 'bg-purple-900/20 text-purple-400 border-purple-900/30' :
    status === 'function' ? 'bg-pink-900/20 text-pink-400 border-pink-900/30' :
    'bg-warm-card/50 text-warm-muted/50 border-warm-card-border';

  const cellClass = (status: string) =>
    status === 'present' ? 'text-green-400 bg-green-900/10' :
    status === 'absent' ? 'text-red-400 bg-red-900/10' :
    status === 'late' ? 'text-yellow-400 bg-yellow-900/10' :
    status === 'leave' ? 'text-blue-400 bg-blue-900/10' :
    status === 'half-day' ? 'text-cyan-400 bg-cyan-900/10' :
    status === 'holiday' ? 'text-purple-400 bg-purple-900/10' :
    status === 'function' ? 'text-pink-400 bg-pink-900/10' :
    'text-warm-muted/30';

  // Get the day/month columns for timetable-style views
  const viewDays = useMemo(() => {
    if (viewMode === 'week' || viewMode === 'month') return (dateRange as any).days as string[] | undefined;
    return undefined;
  }, [viewMode, dateRange]);

  const viewMonths = useMemo(() => {
    if (viewMode === 'year') return (dateRange as any).months as { label: string; from: string; to: string }[] | undefined;
    return undefined;
  }, [viewMode, dateRange]);

  const isTimetableView = viewMode === 'week' || viewMode === 'month' || viewMode === 'year';

  // Compute totals
  let totalP = 0, totalA = 0, totalL = 0, totalLv = 0, totalHd = 0, totalF = 0, totalU = 0;
  if (viewMode === 'day') {
    students.forEach((s: any) => {
      const st = getDayStatus(s).status;
      if (st === 'present') totalP++;
      else if (st === 'absent') totalA++;
      else if (st === 'late') totalL++;
      else if (st === 'leave') totalLv++;
      else if (st === 'half-day') totalHd++;
      else if (st === 'function') totalF++;
      else totalU++;
    });
  } else if (viewMode === 'year' && viewMonths) {
    for (const s of students) {
      for (const att of (s.attendances || [])) {
        const st = att.status;
        if (st === 'present') totalP++;
        else if (st === 'absent') totalA++;
        else if (st === 'late') totalL++;
        else if (st === 'leave') totalLv++;
      else if (st === 'half-day') totalHd++;
        else if (st === 'function') totalF++;
      }
    }
  } else if (isTimetableView && viewDays) {
    for (const s of students) {
      for (const d of viewDays) {
        const st = getCellStatus(s.id, d);
        if (st === 'present' || st === 'holiday') totalP++;
        else if (st === 'absent') totalA++;
        else if (st === 'late') totalL++;
        else if (st === 'leave') totalLv++;
      else if (st === 'half-day') totalHd++;
        else if (st === 'function') totalF++;
        else totalU++;
      }
    }
  } else {
    students.forEach((s: any) => {
      const atts = s.attendances || [];
      totalP += atts.filter((a: any) => a.status === 'present').length;
      totalA += atts.filter((a: any) => a.status === 'absent').length;
      totalL += atts.filter((a: any) => a.status === 'late').length;
      totalLv += atts.filter((a: any) => a.status === 'leave').length;
      totalHd += atts.filter((a: any) => a.status === 'half-day').length;
      totalF += atts.filter((a: any) => a.status === 'function').length;
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
            <option value="">— All Students —</option>
            {sections.map((s: any) => (
              <option key={s.id} value={s.id}>{s.name}{s.section ? ` — ${s.section}` : ''}</option>
            ))}
          </select>
        </div>

        <div className="relative min-w-[180px]">
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student name or roll…"
            className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent transition-colors" />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-warm-muted/50 hover:text-warm-cream text-xs">✕</button>
          )}
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

      {/* Status filter buttons — day view only */}
      {viewMode === 'day' && (
        <div className="mb-4 flex flex-wrap items-center gap-1">
          {['', 'present', 'absent', 'late', 'leave', 'half-day', 'function'].map(st => (
            <button key={st} onClick={() => setStatusFilter(statusFilter === st ? '' : st)}
              className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
                statusFilter === st
                  ? 'bg-warm-accent text-[#1a1614] font-medium'
                  : 'border border-warm-card-border text-warm-muted hover:text-warm-cream'
              }`}>
              {st ? (st === 'half-day' ? 'Half-Day' : st.charAt(0).toUpperCase() + st.slice(1)) : 'All'}
            </button>
          ))}
          {statusFilter && (
            <span className="text-[10px] text-warm-muted/50 ml-2">{filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}</span>
          )}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 animate-pulse rounded-lg bg-warm-card" />)}</div>
      ) : (
        <>
          {/* Bulk actions + summary */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              {viewMode === 'day' && groupId && (
                <>
                  <button onClick={() => markAll('present')} className="rounded-lg border border-green-900/30 px-3 py-1.5 text-xs text-green-400 hover:bg-green-900/10">All Present</button>
                  <button onClick={() => markAll('absent')} className="rounded-lg border border-red-900/30 px-3 py-1.5 text-xs text-red-400 hover:bg-red-900/10">All Absent</button>
                  <button onClick={() => markAll('late')} className="rounded-lg border border-yellow-900/30 px-3 py-1.5 text-xs text-yellow-400 hover:bg-yellow-900/10">All Late</button>
                  <button onClick={() => markAll('leave')} className="rounded-lg border border-blue-900/30 px-3 py-1.5 text-xs text-blue-400 hover:bg-blue-900/10">All Leave</button>
                  <button onClick={() => markAll('half-day')} className="rounded-lg border border-cyan-900/30 px-3 py-1.5 text-xs text-cyan-400 hover:bg-cyan-900/10">All Half-Day</button>
                  <button onClick={() => markAll('function')} className="rounded-lg border border-pink-900/30 px-3 py-1.5 text-xs text-pink-400 hover:bg-pink-900/10">All Function</button>
                  <button onClick={() => markHoliday(date)} className="rounded-lg border border-purple-900/30 px-3 py-1.5 text-xs text-purple-400 hover:bg-purple-900/10">Mark Holiday</button>
                </>
              )}
            </div>
          </div>

          {/* Status legend + totals */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-warm-muted/60">
              <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400/60" /> Present</span>
              <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400/60" /> Absent</span>
              <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400/60" /> Late</span>
              <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400/60" /> Leave</span>
              <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-400/60" /> Half-Day</span>
              <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-pink-400/60" /> Function</span>
              <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-400/60" /> Holiday</span>
            </div>
            <span className="text-xs text-warm-muted/70">
              {viewMode !== 'day' && <span className="text-warm-muted/60 mr-2">{dateRange.label} — </span>}
              <span className="text-green-400 font-medium">{totalP}</span> P · <span className="text-red-400 font-medium">{totalA}</span> A · <span className="text-yellow-400 font-medium">{totalL}</span> L · <span className="text-blue-400 font-medium">{totalLv}</span> Lv · <span className="text-cyan-400 font-medium">{totalHd}</span> Hd · <span className="text-pink-400 font-medium">{totalF}</span> F{viewMode === 'day' && <span className="text-warm-muted/40 ml-1">· {totalU} pending</span>}
            </span>
            <button onClick={handleSave} disabled={saving || isFutureDate || isLocked || viewMode !== 'day' || !groupId}
              className="inline-flex items-center gap-1.5 rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] disabled:opacity-50 transition-colors">
              <Save size={14} /> {!groupId ? 'Select a Class' : viewMode !== 'day' ? 'Read Only' : isFutureDate ? 'Future Date' : isLocked ? 'Locked' : saving ? 'Saving...' : 'Save'}
            </button>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-warm-card-border relative" ref={containerRef}>
            <table className="w-full text-sm" style={{ minWidth: isTimetableView ? `${(viewMode === 'year' ? viewMonths : viewDays)!.length * (viewMode === 'month' ? 24 : viewMode === 'year' ? 52 : 32) + 200}px` : undefined }}>
              <thead>
                {viewMode === 'year' && viewMonths ? (
                  <tr>
                    <th className="w-10 min-w-[40px] px-1 py-3 text-xs text-warm-muted font-medium text-center sticky left-0 bg-[#24201e] z-20">#</th>
                    <th className="text-left px-2 py-3 text-xs text-warm-muted font-medium min-w-[120px] sticky left-10 bg-[#24201e] z-20">Student</th>
                    {viewMonths.map((m) => (
                      <th key={m.label} className="px-0.5 py-3 text-xs text-warm-muted font-medium text-center bg-[#24201e] w-[52px] min-w-[52px]">
                        <span className="font-semibold">{m.label}</span>
                      </th>
                    ))}
                    <th className="w-12 min-w-[48px] px-1 py-3 text-xs text-warm-muted font-medium text-center sticky right-16 bg-[#24201e] z-20">%</th>
                    <th className="w-16 min-w-[64px] px-2 py-3 text-xs text-warm-muted font-medium text-center sticky right-0 bg-[#24201e] z-20">Sum</th>
                  </tr>
                ) : isTimetableView && viewDays ? (
                  <tr>
                    <th className="w-10 min-w-[40px] px-1 py-3 text-xs text-warm-muted font-medium text-center sticky left-0 bg-[#24201e] z-20">#</th>
                    <th className="text-left px-2 py-3 text-xs text-warm-muted font-medium min-w-[120px] sticky left-10 bg-[#24201e] z-20">Student</th>
                    {viewDays.map((d, i) => (
                      <th key={d} className="px-0 py-3 text-xs text-warm-muted font-medium text-center bg-[#24201e]" style={{ minWidth: viewMode === 'month' ? 24 : 32, width: viewMode === 'month' ? 24 : 32 }}>
                        <span className="font-semibold">{viewMode === 'week' ? DAYS[i] : parseInt(d.slice(8), 10)}</span>
                      </th>
                    ))}
                    <th className="w-12 min-w-[48px] px-1 py-3 text-xs text-warm-muted font-medium text-center sticky right-16 bg-[#24201e] z-20">%</th>
                    <th className="w-16 min-w-[64px] px-2 py-3 text-xs text-warm-muted font-medium text-center sticky right-0 bg-[#24201e] z-20">Sum</th>
                  </tr>
                ) : (
                  <tr className="bg-warm-card/70">
                    <th className="w-12 px-2 py-3 text-xs text-warm-muted font-medium text-center">#</th>
                    <th className="w-16 px-2 py-3 text-xs text-warm-muted font-medium text-center">Roll</th>
                    <th className="text-left px-4 py-3 text-xs text-warm-muted font-medium">Student Name</th>
                    {viewMode !== 'day' && <th className="w-12 px-2 py-3 text-xs text-warm-muted font-medium text-center">%</th>}
                    <th className="w-48 px-4 py-3 text-xs text-warm-muted font-medium text-center">
                      {viewMode === 'day' ? 'Status' : 'Sum'}
                    </th>
                  </tr>
                )}
              </thead>
              <tbody>
                {filteredStudents.map((s: any, idx: number) => {
                  if (viewMode === 'year' && viewMonths) {
                    let totalP = 0, totalA = 0, totalL = 0, totalLv = 0;
                    return (
                      <tr key={s.id} className="border-t border-warm-card-border/30 hover:bg-warm-card/20 transition-colors">
                        <td className="px-1 py-2 text-xs text-warm-muted text-center sticky left-0 bg-[#1a1614] z-10">{idx + 1}</td>
                        <td className="px-2 py-2 sticky left-10 bg-[#1a1614] z-10">
                          <p className="text-sm text-warm-cream truncate max-w-[140px]">{s.name}</p>
                          <p className="text-[9px] text-warm-muted/40">{s.rollNumber || ''}{s.groupId ? ' · ' + groupLabel(sections, s.groupId) : ''}</p>
                        </td>
                        {viewMonths.map(m => {
                          const atts = (s.attendances || []).filter((a: any) => {
                            const ad = typeof a.date === 'string' ? a.date.split('T')[0] : a.date;
                            return ad >= m.from && ad <= m.to;
                          });
                          const p = atts.filter((a: any) => a.status === 'present').length;
                          const a = atts.filter((a: any) => a.status === 'absent').length;
                          const l = atts.filter((a: any) => a.status === 'late').length;
                          const lv = atts.filter((a: any) => a.status === 'leave').length;
                          totalP += p; totalA += a; totalL += l; totalLv += lv;
                          return (
                            <td key={m.label} className="px-0.5 py-2 text-center text-[10px] font-mono w-[52px] min-w-[52px]">
                              <span className="text-green-400">{p > 0 ? 'P' + p : ''}</span>
                              {a > 0 && <span className="text-red-400 ml-0.5">A{a}</span>}
                              {l > 0 && <span className="text-yellow-400 ml-0.5">L{l}</span>}
                              {p === 0 && a === 0 && l === 0 && <span className="text-warm-muted/30">·</span>}
                            </td>
                          );
                        })}
                        <td className="px-1 py-2 text-center sticky right-16 bg-[#1a1614] z-10">
                          <span className={`text-xs font-mono font-medium ${(totalP + totalA + totalL + totalLv) > 0 ? attColor((totalP / (totalP + totalA + totalL + totalLv)) * 100) : 'text-warm-muted/30'}`}>
                            {(totalP + totalA + totalL + totalLv) > 0 ? Math.round((totalP / (totalP + totalA + totalL + totalLv)) * 100) + '%' : '·'}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-center sticky right-0 bg-[#1a1614] z-10">
                          <span className="text-xs font-mono">
                            <span className="text-green-400 font-medium">{totalP > 0 ? 'P' + totalP : ''}</span>
                            {totalA > 0 && <span className="text-red-400 font-medium ml-0.5">A{totalA}</span>}
                            {totalL > 0 && <span className="text-yellow-400 font-medium ml-0.5">L{totalL}</span>}
                            {totalLv > 0 && <span className="text-blue-400 font-medium ml-0.5">Lv{totalLv}</span>}
                            {totalP === 0 && totalA === 0 && totalL === 0 && totalLv === 0 && <span className="text-warm-muted/30">·</span>}
                          </span>
                        </td>
                      </tr>
                    );
                  }

                  if (isTimetableView && viewDays) {
                    let sp = 0, sa = 0, sl = 0, slv = 0;
                    for (const d of viewDays) {
                      const st = getCellStatus(s.id, d);
                      if (st === 'present') sp++;
                      else if (st === 'absent') sa++;
                      else if (st === 'late') sl++;
                      else if (st === 'leave') slv++;
                    }
                    return (
                      <tr key={s.id} className="border-t border-warm-card-border/30 hover:bg-warm-card/20 transition-colors">
                        <td className="px-1 py-2 text-xs text-warm-muted text-center sticky left-0 bg-[#1a1614] z-10">{idx + 1}</td>
                        <td className="px-2 py-2 sticky left-10 bg-[#1a1614] z-10">
                          <p className="text-sm text-warm-cream truncate max-w-[140px]">{s.name}</p>
                          <p className="text-[9px] text-warm-muted/40">{s.rollNumber || ''}{s.groupId ? ' · ' + groupLabel(sections, s.groupId) : ''}</p>
                        </td>
                        {viewDays.map(d => {
                          const st = getCellStatus(s.id, d);
                          return (
                            <td key={d} className="px-0 py-2 text-center" style={{ minWidth: viewMode === 'month' ? 24 : 32, width: viewMode === 'month' ? 24 : 32 }}>
                              <span className={`inline-flex items-center justify-center rounded font-bold ${viewMode === 'month' ? 'w-5 h-5 text-[10px]' : 'w-7 h-7 text-xs'} ${cellClass(st)}`}>
                                {st === 'present' ? 'P' : st === 'absent' ? 'A' : st === 'late' ? 'L' : st === 'leave' ? 'Lv' : st === 'half-day' ? 'Hd' : st === 'holiday' ? 'H' : st === 'function' ? 'F' : '·'}
                              </span>
                            </td>
                          );
                        })}
                        <td className="px-1 py-2 text-center sticky right-16 bg-[#1a1614] z-10">
                          <span className={`text-xs font-mono font-medium ${(sp + sa + sl + slv) > 0 ? attColor((sp / (sp + sa + sl + slv)) * 100) : 'text-warm-muted/30'}`}>
                            {(sp + sa + sl + slv) > 0 ? Math.round((sp / (sp + sa + sl + slv)) * 100) + '%' : '·'}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-center sticky right-0 bg-[#1a1614] z-10">
                          <span className="text-xs font-mono">
                            <span className="text-green-400 font-medium">{sp > 0 ? 'P' + sp : ''}</span>
                            {sa > 0 && <span className="text-red-400 font-medium ml-0.5">A{sa}</span>}
                            {sl > 0 && <span className="text-yellow-400 font-medium ml-0.5">L{sl}</span>}
                            {slv > 0 && <span className="text-blue-400 font-medium ml-0.5">Lv{slv}</span>}
                            {sp === 0 && sa === 0 && sl === 0 && slv === 0 && <span className="text-warm-muted/30">·</span>}
                          </span>
                        </td>
                      </tr>
                    );
                  }

                  const dayView = viewMode === 'day';

                  return (
                    <tr key={s.id} id={'stu-' + (s.name?.[0] || '').toUpperCase()}
                      className="border-t border-warm-card-border/30 hover:bg-warm-card/20 transition-colors">
                      <td className="px-2 py-3 text-xs text-warm-muted/60 text-center">{idx + 1}</td>
                      <td className="px-2 py-3 text-xs text-warm-muted text-center">{s.rollNumber || '—'}</td>
                      <td className="px-4 py-3 cursor-pointer" onClick={() => window.location.href = '/admin/attendance/student/' + s.id}>
                        <p className="text-sm text-warm-cream hover:text-warm-accent transition-colors">{s.name}</p>
                        <p className="text-[10px] text-warm-muted/50">{s.admissionNumber || ''}{s.groupId ? ' · ' + groupLabel(sections, s.groupId) : ''}</p>
                      </td>
                      {!dayView && (
                        <td className="px-2 py-3 text-xs text-center font-mono">
                          <span className={`font-medium ${attColor(attPercent(s.attendances || []))}`}>
                            {attPercent(s.attendances || [])}%
                          </span>
                        </td>
                      )}
                      <td className="px-4 py-3 text-center">
                        {dayView ? (
                          <span className={`inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium min-w-[100px] ${groupId ? 'cursor-pointer' : ''} ${statusClass(getDayStatus(s).status)}`}
                            onClick={() => groupId && toggleStatus(s.id)}>
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
            {students.length > 0 && (
              <div className="fixed right-2 top-1/2 -translate-y-1/2 flex flex-col gap-0 z-40">
                {ALPHABET.map(letter => {
                  const found = filteredStudents.some((s: any) => (s.name?.[0] || '').toUpperCase() === letter);
                  return (
                    <button key={letter} onClick={() => scrollToLetter(letter)}
                      className={`text-[11px] leading-tight px-1 py-0 rounded transition-colors ${found ? 'text-warm-accent hover:text-warm-cream font-medium' : 'text-warm-muted/20 cursor-default'}`}>
                      {letter}
                    </button>
                  );
                })}
              </div>
            )}
            {students.length === 0 && (
              <div className="p-12 text-center text-sm text-warm-muted">No students in this class.</div>
            )}
          </div>
        </>
      )}
    </main>
  );
}
