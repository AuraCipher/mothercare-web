'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Calendar, ChevronLeft, ChevronRight, Save,
} from 'lucide-react';
import { showToast } from '@/components/toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function localDateStr(d: Date): string {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function todayStr(): string { return localDateStr(new Date()); }

function attPercent(atts: any[]): number {
  const total = atts.length;
  if (!total) return 0;
  const present = atts.filter((a: any) => a.status === 'present' || a.status === 'holiday').length;
  return Math.round((present / total) * 100);
}
function attColor(pct: number): string {
  return pct >= 80 ? 'text-green-400' : pct >= 70 ? 'text-yellow-400' : 'text-red-400';
}

export default function TeacherAttendancePage() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(todayStr());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month' | 'year'>('day');
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const ayId = typeof window !== 'undefined' ? localStorage.getItem('activeAYId') : null;
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const EDIT_LOCK_DAYS = 7;
  const todayDt = new Date();
  const today = todayStr();
  const isFutureDate = date > today;
  const isLocked = (() => {
    const d = new Date(date + 'T00:00:00');
    const cutoff = new Date(todayDt);
    cutoff.setDate(cutoff.getDate() - EDIT_LOCK_DAYS);
    return d < cutoff;
  })();

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
    ? `${API_URL}/admin/attendance/teachers?date=${date}`
    : `${API_URL}/admin/attendance/teachers?from=${dateRange.from}&to=${dateRange.to}`;

  const loadAttendance = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(loadUrl, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) setTeachers(json.data);
    } catch {} finally { setLoading(false); }
  }, [loadUrl, token]);

  useEffect(() => { loadAttendance(); }, [loadAttendance]);

  const statusMap = useMemo(() => {
    const map: Record<string, Record<string, string>> = {};
    for (const t of teachers) {
      map[t.id] = {};
      for (const att of (t.attendances || [])) {
        const d = typeof att.date === 'string' ? att.date.split('T')[0] : att.date;
        map[t.id][d] = att.status;
      }
    }
    return map;
  }, [teachers]);

  const filteredTeachers = useMemo(() => {
    if (!searchQuery.trim()) return teachers;
    const q = searchQuery.toLowerCase();
    return teachers.filter((t: any) =>
      t.name?.toLowerCase().includes(q)
    );
  }, [teachers, searchQuery]);

  const isSunday = (dateStr: string) => new Date(dateStr + 'T00:00:00').getDay() === 0;

  const getCellStatus = (teacherId: string, dateStr: string) => {
    const attStatus = statusMap[teacherId]?.[dateStr];
    if (attStatus) return attStatus;
    if (isSunday(dateStr)) return 'holiday';
    return 'unmarked';
  };

  const toggleStatus = (teacherId: string) => {
    setTeachers((prev: any[]) => prev.map((t: any) => {
      if (t.id !== teacherId) return t;
      const current = t.attendances?.[0]?.status || 'unmarked';
      const next: Record<string, string> = { unmarked: 'present', present: 'absent', absent: 'late', late: 'leave', leave: 'function', function: 'present' };
      const newStatus = next[current] || 'present';
      return { ...t, attendances: [{ status: newStatus }] };
    }));
  };

  const markAll = (status: string) => {
    setTeachers((prev: any[]) => prev.map((t: any) => ({ ...t, attendances: [{ status }] })));
  };

  const markHoliday = async (dateStr: string) => {
    if (!token) return;
    setSaving(true);
    const records = teachers.map((t: any) => ({ teacherId: t.id, status: 'holiday' }));
    try {
      const res = await fetch(`${API_URL}/admin/attendance/teachers/batch`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateStr, academicYearId: ayId, records }),
      });
      const json = await res.json();
      if (json.success) { showToast('success', `Holiday set for ${json.data.saved} teachers`); loadAttendance(); }
      else showToast('error', json.message || 'Failed');
    } catch { showToast('error', 'Failed'); } finally { setSaving(false); }
  };

  const handleSave = async () => {
    if (!date || !token) return;
    setSaving(true);
    const records = teachers
      .filter((t: any) => t.attendances?.[0]?.status && t.attendances[0].status !== 'unmarked')
      .map((t: any) => ({ teacherId: t.id, status: t.attendances[0].status }));
    try {
      const res = await fetch(`${API_URL}/admin/attendance/teachers/batch`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, academicYearId: ayId, records }),
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

  const getDayStatus = (t: any) => {
    const atts = t.attendances || [];
    const status = atts[0]?.status || 'unmarked';
    const labels: Record<string, string> = { present: '✓ Present', absent: '✗ Absent', late: '⏳ Late', leave: '✈ Leave', holiday: 'Holiday', function: 'Function' };
    return { status, label: labels[status] || '— Not Marked' };
  };

  const statusClass = (status: string) =>
    status === 'present' ? 'bg-green-900/20 text-green-400 border-green-900/30' :
    status === 'absent' ? 'bg-red-900/20 text-red-400 border-red-900/30' :
    status === 'late' ? 'bg-yellow-900/20 text-yellow-400 border-yellow-900/30' :
    status === 'leave' ? 'bg-blue-900/20 text-blue-400 border-blue-900/30' :
    status === 'holiday' ? 'bg-purple-900/20 text-purple-400 border-purple-900/30' :
    status === 'function' ? 'bg-pink-900/20 text-pink-400 border-pink-900/30' :
    'bg-warm-card/50 text-warm-muted/50 border-warm-card-border';

  const cellClass = (status: string) =>
    status === 'present' ? 'text-green-400 bg-green-900/10' :
    status === 'absent' ? 'text-red-400 bg-red-900/10' :
    status === 'late' ? 'text-yellow-400 bg-yellow-900/10' :
    status === 'leave' ? 'text-blue-400 bg-blue-900/10' :
    status === 'holiday' ? 'text-purple-400 bg-purple-900/10' :
    status === 'function' ? 'text-pink-400 bg-pink-900/10' :
    'text-warm-muted/30';

  const viewDays = useMemo(() => {
    if (viewMode === 'week' || viewMode === 'month') return (dateRange as any).days as string[] | undefined;
    return undefined;
  }, [viewMode, dateRange]);

  const viewMonths = useMemo(() => {
    if (viewMode === 'year') return (dateRange as any).months as { label: string; from: string; to: string }[] | undefined;
    return undefined;
  }, [viewMode, dateRange]);

  const isTimetableView = viewMode === 'week' || viewMode === 'month' || viewMode === 'year';

  let totalP = 0, totalA = 0, totalL = 0, totalLv = 0, totalF = 0, totalU = 0;
  if (viewMode === 'day') {
    teachers.forEach((t: any) => {
      const st = getDayStatus(t).status;
      if (st === 'present') totalP++;
      else if (st === 'absent') totalA++;
      else if (st === 'late') totalL++;
      else if (st === 'leave') totalLv++;
      else if (st === 'function') totalF++;
      else totalU++;
    });
  } else if (viewMode === 'year' && viewMonths) {
    for (const t of teachers) {
      for (const att of (t.attendances || [])) {
        const st = att.status;
        if (st === 'present') totalP++;
        else if (st === 'absent') totalA++;
        else if (st === 'late') totalL++;
        else if (st === 'leave') totalLv++;
        else if (st === 'function') totalF++;
      }
    }
  } else if (isTimetableView && viewDays) {
    for (const t of teachers) {
      for (const d of viewDays) {
        const st = getCellStatus(t.id, d);
        if (st === 'present' || st === 'holiday') totalP++;
        else if (st === 'absent') totalA++;
        else if (st === 'late') totalL++;
        else if (st === 'leave') totalLv++;
        else if (st === 'function') totalF++;
        else totalU++;
      }
    }
  } else {
    teachers.forEach((t: any) => {
      const atts = t.attendances || [];
      totalP += atts.filter((a: any) => a.status === 'present').length;
      totalA += atts.filter((a: any) => a.status === 'absent').length;
      totalL += atts.filter((a: any) => a.status === 'late').length;
      totalLv += atts.filter((a: any) => a.status === 'leave').length;
      totalF += atts.filter((a: any) => a.status === 'function').length;
    });
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex items-center gap-3">
        <Calendar size={22} className="text-warm-accent" />
        <h1 className="text-xl font-light text-warm-cream">Teacher Attendance</h1>
      </div>

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div className="flex items-center gap-2 px-3 py-2 text-sm text-warm-muted border border-warm-card-border rounded-lg">
          <Calendar size={14} className="text-warm-accent" />
          <span>All Teachers</span>
        </div>

        <div className="relative min-w-[180px]">
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search teacher name…"
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

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 animate-pulse rounded-lg bg-warm-card" />)}</div>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              {viewMode === 'day' && (
                <>
                  <button onClick={() => markAll('present')} className="rounded-lg border border-green-900/30 px-3 py-1.5 text-xs text-green-400 hover:bg-green-900/10">All Present</button>
                  <button onClick={() => markAll('absent')} className="rounded-lg border border-red-900/30 px-3 py-1.5 text-xs text-red-400 hover:bg-red-900/10">All Absent</button>
                  <button onClick={() => markAll('late')} className="rounded-lg border border-yellow-900/30 px-3 py-1.5 text-xs text-yellow-400 hover:bg-yellow-900/10">All Late</button>
                  <button onClick={() => markAll('leave')} className="rounded-lg border border-blue-900/30 px-3 py-1.5 text-xs text-blue-400 hover:bg-blue-900/10">All Leave</button>
                  <button onClick={() => markAll('function')} className="rounded-lg border border-pink-900/30 px-3 py-1.5 text-xs text-pink-400 hover:bg-pink-900/10">All Function</button>
                  <button onClick={() => markHoliday(date)} className="rounded-lg border border-purple-900/30 px-3 py-1.5 text-xs text-purple-400 hover:bg-purple-900/10">Mark Holiday</button>
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              {viewMode !== 'day' && (
                <span className="text-xs text-warm-muted/60 mr-2">{dateRange.label}</span>
              )}
              <span className="text-xs text-warm-muted/70">
                <span className="text-green-400 font-medium">{totalP}</span> P · <span className="text-red-400 font-medium">{totalA}</span> A · <span className="text-yellow-400 font-medium">{totalL}</span> L · <span className="text-blue-400 font-medium">{totalLv}</span> Lv · <span className="text-pink-400 font-medium">{totalF}</span> F{viewMode === 'day' && <span className="text-warm-muted/40 ml-1">· {totalU} pending</span>}
              </span>
              <button onClick={handleSave} disabled={saving || isFutureDate || isLocked || viewMode !== 'day'}
                className="flex items-center gap-1.5 rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] disabled:opacity-50 transition-colors">
                <Save size={14} /> {viewMode !== 'day' ? 'Read Only' : isFutureDate ? 'Future Date' : isLocked ? 'Locked' : saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-warm-card-border overflow-x-auto relative">
            <table className="w-full text-sm" style={{ minWidth: isTimetableView ? `${(viewMode === 'year' ? viewMonths : viewDays)!.length * (viewMode === 'month' ? 24 : viewMode === 'year' ? 70 : 32) + 200}px` : undefined }}>
              <thead>
                {viewMode === 'year' && viewMonths ? (
                  <tr>
                    <th className="w-10 min-w-[40px] px-1 py-3 text-xs text-warm-muted font-medium text-center sticky left-0 bg-[#24201e] z-20">#</th>
                    <th className="text-left px-2 py-3 text-xs text-warm-muted font-medium min-w-[120px] sticky left-10 bg-[#24201e] z-20">Teacher</th>
                    {viewMonths.map((m) => (
                      <th key={m.label} className="px-1 py-3 text-xs text-warm-muted font-medium text-center bg-[#24201e] w-[70px] min-w-[70px]">
                        <span className="font-semibold">{m.label}</span>
                      </th>
                    ))}
                    <th className="w-12 min-w-[48px] px-1 py-3 text-xs text-warm-muted font-medium text-center sticky right-16 bg-[#24201e] z-20">%</th>
                    <th className="w-16 min-w-[64px] px-2 py-3 text-xs text-warm-muted font-medium text-center sticky right-0 bg-[#24201e] z-20">Sum</th>
                  </tr>
                ) : isTimetableView && viewDays ? (
                  <tr>
                    <th className="w-10 min-w-[40px] px-1 py-3 text-xs text-warm-muted font-medium text-center sticky left-0 bg-[#24201e] z-20">#</th>
                    <th className="text-left px-2 py-3 text-xs text-warm-muted font-medium min-w-[120px] sticky left-10 bg-[#24201e] z-20">Teacher</th>
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
                    <th className="text-left px-4 py-3 text-xs text-warm-muted font-medium">Teacher Name</th>
                    <th className="w-12 px-2 py-3 text-xs text-warm-muted font-medium text-center">%</th>
                    <th className="w-48 px-4 py-3 text-xs text-warm-muted font-medium text-center">
                      {viewMode === 'day' ? 'Status' : 'Sum'}
                    </th>
                  </tr>
                )}
              </thead>
              <tbody>
                {filteredTeachers.map((t: any, idx: number) => {
                  if (viewMode === 'year' && viewMonths) {
                    let totalP = 0, totalA = 0, totalL = 0, totalLv = 0;
                    return (
                      <tr key={t.id} className="border-t border-warm-card-border/30 hover:bg-warm-card/20 transition-colors">
                        <td className="px-1 py-2 text-xs text-warm-muted text-center sticky left-0 bg-[#1a1614] z-10">{idx + 1}</td>
                        <td className="px-2 py-2 sticky left-10 bg-[#1a1614] z-10">
                          <p className="text-sm text-warm-cream truncate max-w-[180px]">{t.name}</p>
                        </td>
                        {viewMonths.map(m => {
                          const atts = (t.attendances || []).filter((a: any) => {
                            const ad = typeof a.date === 'string' ? a.date.split('T')[0] : a.date;
                            return ad >= m.from && ad <= m.to;
                          });
                          const p = atts.filter((a: any) => a.status === 'present').length;
                          const a = atts.filter((a: any) => a.status === 'absent').length;
                          const l = atts.filter((a: any) => a.status === 'late').length;
                          const lv = atts.filter((a: any) => a.status === 'leave').length;
                          totalP += p; totalA += a; totalL += l; totalLv += lv;
                          return (
                            <td key={m.label} className="px-1 py-2 text-center text-[11px] font-mono w-[70px] min-w-[70px]">
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
                      const st = getCellStatus(t.id, d);
                      if (st === 'present') sp++;
                      else if (st === 'absent') sa++;
                      else if (st === 'late') sl++;
                      else if (st === 'leave') slv++;
                    }
                    return (
                      <tr key={t.id} className="border-t border-warm-card-border/30 hover:bg-warm-card/20 transition-colors">
                        <td className="px-1 py-2 text-xs text-warm-muted text-center sticky left-0 bg-[#1a1614] z-10">{idx + 1}</td>
                        <td className="px-2 py-2 sticky left-10 bg-[#1a1614] z-10">
                          <p className="text-sm text-warm-cream truncate max-w-[180px]">{t.name}</p>
                        </td>
                        {viewDays.map(d => {
                          const st = getCellStatus(t.id, d);
                          return (
                            <td key={d} className="px-0 py-2 text-center" style={{ minWidth: viewMode === 'month' ? 24 : 32, width: viewMode === 'month' ? 24 : 32 }}>
                              <span className={`inline-flex items-center justify-center rounded font-bold ${viewMode === 'month' ? 'w-5 h-5 text-[10px]' : 'w-7 h-7 text-xs'} ${cellClass(st)}`}>
                                {st === 'present' ? 'P' : st === 'absent' ? 'A' : st === 'late' ? 'L' : st === 'leave' ? 'Lv' : st === 'holiday' ? 'H' : st === 'function' ? 'F' : '·'}
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
                    <tr key={t.id} onClick={() => dayView && toggleStatus(t.id)}
                      className="border-t border-warm-card-border/30 hover:bg-warm-card/20 transition-colors cursor-pointer">
                      <td className="px-2 py-3 text-xs text-warm-muted/60 text-center">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-warm-cream">{t.name}</p>
                      </td>
                      <td className="px-2 py-3 text-xs text-center font-mono">
                        <span className={`font-medium ${attColor(attPercent(t.attendances || []))}`}>
                          {attPercent(t.attendances || [])}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {dayView ? (
                          <span className={`inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium min-w-[100px] ${statusClass(getDayStatus(t).status)}`}>
                            {getDayStatus(t).label}
                          </span>
                        ) : (
                          (() => {
                            const atts = t.attendances || [];
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
            {teachers.length === 0 && (
              <div className="p-12 text-center text-sm text-warm-muted">No teachers found.</div>
            )}
          </div>
        </>
      )}
    </main>
  );
}
