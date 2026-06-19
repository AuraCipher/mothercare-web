'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  Calendar, ChevronLeft, ChevronRight, Users, Save,
} from 'lucide-react';
import { showToast } from '@/components/toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function AttendancePage() {
  const router = useRouter();
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

  // Calculate date range based on view mode
  const dateRange = useMemo(() => {
    const d = new Date(date);
    if (viewMode === 'day') return { from: date, to: date };
    if (viewMode === 'week') {
      const day = d.getDay();
      const mon = new Date(d); mon.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
      return { from: mon.toISOString().split('T')[0], to: sun.toISOString().split('T')[0] };
    }
    if (viewMode === 'month') {
      const from = new Date(d.getFullYear(), d.getMonth(), 1);
      const to = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      return { from: from.toISOString().split('T')[0], to: to.toISOString().split('T')[0] };
    }
    // year
    const from = new Date(d.getFullYear(), 0, 1);
    const to = new Date(d.getFullYear(), 11, 31);
    return { from: from.toISOString().split('T')[0], to: to.toISOString().split('T')[0] };
  }, [date, viewMode]);

  // Generate date columns
  const dateColumns = useMemo(() => {
    if (viewMode === 'day') return [date];
    if (viewMode === 'week') {
      const cols: string[] = [];
      const d = new Date(dateRange.from);
      while (d <= new Date(dateRange.to)) {
        cols.push(d.toISOString().split('T')[0]);
        d.setDate(d.getDate() + 1);
      }
      return cols;
    }
    if (viewMode === 'month') {
      const cols: string[] = [];
      const d = new Date(dateRange.from);
      while (d <= new Date(dateRange.to)) {
        cols.push(d.toISOString().split('T')[0]);
        d.setDate(d.getDate() + 1);
      }
      return cols;
    }
    // year - months
    return MONTHS;
  }, [viewMode, date, dateRange]);

  // Build status map: studentId → { date: status }
  const statusMap = useMemo(() => {
    const map: Record<string, Record<string, string>> = {};
    students.forEach((s: any) => {
      map[s.id] = {};
      (s.attendances || []).forEach((a: any) => {
        const key = new Date(a.date).toISOString().split('T')[0];
        map[s.id][key] = a.status;
      });
    });
    return map;
  }, [students]);

  // Monthly/yearly summary per student
  const getSummary = (studentId: string, monthIdx: number) => {
    const m = monthIdx + 1;
    const entries = Object.entries(statusMap[studentId] || {}).filter(([d]) => {
      const date = new Date(d);
      return date.getFullYear() === new Date(date).getFullYear() && date.getMonth() === monthIdx;
    });
    const p = entries.filter(([, s]) => s === 'present').length;
    const a = entries.filter(([, s]) => s === 'absent').length;
    const l = entries.filter(([, s]) => s === 'late').length;
    return `${p}/${a}/${l}`;
  };

  // Load sections
  useEffect(() => {
    if (branchId && ayId) {
      api.getSections(branchId, ayId).then(d => { if (d.success) setSections(d.data); }).catch(() => {});
    }
  }, []);

  const loadAttendance = useCallback(async () => {
    if (!groupId || !token) return;
    setLoading(true);
    try {
      const url = `${API_URL}/admin/attendance?from=${dateRange.from}&to=${dateRange.to}&groupId=${groupId}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setStudents(data.data);
    } catch {} finally { setLoading(false); }
  }, [groupId, token, dateRange]);

  useEffect(() => { loadAttendance(); }, [loadAttendance]);

  const handleSave = async () => {
    if (!groupId || !date || !token) return;
    setSaving(true);
    const records: any[] = [];
    students.forEach((s: any) => {
      const dayStatus = statusMap[s.id]?.[date];
      if (dayStatus && dayStatus !== 'unmarked') {
        records.push({ studentId: s.id, status: dayStatus });
      }
    });
    try {
      const res = await fetch(`${API_URL}/admin/attendance/batch`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, groupId, academicYearId: ayId, records }),
      });
      const data = await res.json();
      if (data.success) { showToast('success', `${data.data.saved} saved`); loadAttendance(); }
      else showToast('error', data.message || 'Save failed');
    } catch { showToast('error', 'Failed to save'); }
    finally { setSaving(false); }
  };

  const changeDate = (dir: number) => {
    const d = new Date(date);
    if (viewMode === 'month') d.setMonth(d.getMonth() + dir);
    else if (viewMode === 'year') d.setFullYear(d.getFullYear() + dir);
    else d.setDate(d.getDate() + dir * (viewMode === 'week' ? 7 : 1));
    setDate(d.toISOString().split('T')[0]);
  };

  const today = new Date().toISOString().split('T')[0];
  const isFutureDate = date > today;

  // Toggle a student's status for a specific date (daily view only)
  const toggleStatus = (studentId: string, dateKey: string) => {
    const current = statusMap[studentId]?.[dateKey] || 'unmarked';
    const next: Record<string, string> = { unmarked: 'present', present: 'absent', absent: 'late', late: 'half-day', 'half-day': 'present' };
    setStudents((prev: any[]) => prev.map((s: any) => {
      if (s.id !== studentId) return s;
      const existing = (s.attendances || []).findIndex((a: any) => new Date(a.date).toISOString().split('T')[0] === dateKey);
      if (existing >= 0) {
        const updated = [...s.attendances];
        updated[existing] = { ...updated[existing], status: next[current] || 'present' };
        return { ...s, attendances: updated };
      }
      return { ...s, attendances: [...(s.attendances || []), { date: dateKey, status: next[current] || 'present' }] };
    }));
  };

  const markAll = (status: string) => {
    setStudents((prev: any[]) => prev.map((s: any) => {
      const existing = (s.attendances || []).filter((a: any) => new Date(a.date).toISOString().split('T')[0] !== date);
      return { ...s, attendances: [...existing, { date, status }] };
    }));
  };

  // Counts for daily view
  const dayStatuses = students.map((s: any) => statusMap[s.id]?.[date] || 'unmarked');
  const counts = {
    present: dayStatuses.filter(s => s === 'present').length,
    absent: dayStatuses.filter(s => s === 'absent').length,
    late: dayStatuses.filter(s => s === 'late').length,
    'half-day': dayStatuses.filter(s => s === 'half-day').length,
    unmarked: dayStatuses.filter(s => s === 'unmarked').length,
  };

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
        <div className="flex items-center gap-1.5">
          <button onClick={() => setViewMode('day')}
            className={`rounded-lg px-2.5 py-1.5 text-[11px] transition-colors ${viewMode === 'day' ? 'bg-warm-accent text-[#1a1614] font-medium' : 'border border-warm-card-border text-warm-muted hover:text-warm-cream'}`}>Day</button>
          <button onClick={() => setViewMode('week')}
            className={`rounded-lg px-2.5 py-1.5 text-[11px] transition-colors ${viewMode === 'week' ? 'bg-warm-accent text-[#1a1614] font-medium' : 'border border-warm-card-border text-warm-muted hover:text-warm-cream'}`}>Week</button>
          <button onClick={() => setViewMode('month')}
            className={`rounded-lg px-2.5 py-1.5 text-[11px] transition-colors ${viewMode === 'month' ? 'bg-warm-accent text-[#1a1614] font-medium' : 'border border-warm-card-border text-warm-muted hover:text-warm-cream'}`}>Month</button>
          <button onClick={() => setViewMode('year')}
            className={`rounded-lg px-2.5 py-1.5 text-[11px] transition-colors ${viewMode === 'year' ? 'bg-warm-accent text-[#1a1614] font-medium' : 'border border-warm-card-border text-warm-muted hover:text-warm-cream'}`}>Year</button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => changeDate(-1)} className="rounded-lg p-2 text-warm-muted hover:bg-warm-card hover:text-warm-cream transition-colors"><ChevronLeft size={16} /></button>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent transition-colors" />
          <button onClick={() => changeDate(1)} className="rounded-lg p-2 text-warm-muted hover:bg-warm-card hover:text-warm-cream transition-colors"><ChevronRight size={16} /></button>
          {date !== today && viewMode === 'day' && (
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
              <button onClick={handleSave} disabled={saving || isFutureDate}
                className="flex items-center gap-1.5 rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] transition-colors disabled:opacity-50">
                <Save size={14} /> {isFutureDate ? 'Future Date' : saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>

          {/* Student list */}
          <div className="rounded-xl border border-warm-card-border overflow-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-warm-card/50">
                  <th className="sticky left-0 bg-warm-card/50 z-10 w-12 px-2 py-2 text-warm-muted font-medium text-left">Roll</th>
                  <th className="sticky left-12 bg-warm-card/50 z-10 px-2 py-2 text-warm-muted font-medium text-left min-w-[140px]">Name</th>
                  {viewMode === 'year' ? MONTHS.map(m => (
                    <th key={m} className="px-2 py-2 text-warm-muted font-medium text-center min-w-[60px]">{m}</th>
                  )) : dateColumns.map(d => {
                    const dt = new Date(d);
                    return <th key={d} className={`px-1 py-2 text-warm-muted font-medium text-center ${dt.getDay() === 0 || dt.getDay() === 6 ? 'text-warm-muted/40' : ''}`}>
                      {viewMode === 'month' ? dt.getDate() : `${DAYS[dt.getDay()]} ${dt.getDate()}`}
                    </th>;
                  })}
                </tr>
              </thead>
              <tbody>
                {students.map((s: any) => (
                  <tr key={s.id} className="border-t border-warm-card-border/50 hover:bg-warm-card/30 transition-colors">
                    <td className="sticky left-0 bg-[#1a1614] z-10 px-2 py-2 text-warm-muted text-center">{s.rollNumber || '—'}</td>
                    <td className="sticky left-12 bg-[#1a1614] z-10 px-2 py-2">
                      <p className="text-xs text-warm-cream whitespace-nowrap">{s.name}</p>
                    </td>
                    {viewMode === 'year' ? MONTHS.map((m, mi) => {
                      const [p, a, l] = getSummary(s.id, mi).split('/').map(Number);
                      return <td key={m} className="px-2 py-2 text-center">
                        <span className="text-green-400">{p}</span>
                        {a > 0 && <span className="text-red-400 ml-0.5">/{a}</span>}
                        {l > 0 && <span className="text-yellow-400 ml-0.5">/{l}</span>}
                      </td>;
                    }) : dateColumns.map(d => {
                      const stat = statusMap[s.id]?.[d] || (new Date(d) > new Date(today) ? 'future' : '—');
                      const isToday = d === today;
                      return <td key={d} className={`px-1 py-2 text-center ${isToday ? 'ring-1 ring-warm-accent/30 rounded' : ''}`}>
                        {stat === 'present' ? <span className="text-green-400 font-bold">✓</span> :
                         stat === 'absent' ? <span className="text-red-400 font-bold">✗</span> :
                         stat === 'late' ? <span className="text-yellow-400">⏳</span> :
                         stat === 'half-day' ? <span className="text-blue-400">◐</span> :
                         stat === 'future' ? <span className="text-warm-muted/20">·</span> :
                         <span className="text-warm-muted/30">·</span>}
                      </td>;
                    })}
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
