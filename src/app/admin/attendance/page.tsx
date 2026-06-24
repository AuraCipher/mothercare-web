'use client';

import { useEffect, useState, useCallback } from 'react';
import { BarChart, Users, GraduationCap, FileText, Calendar, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function localDateStr(d: Date): string {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function todayStr(): string { return localDateStr(new Date()); }

export default function AttendanceDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [trendMode, setTrendMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [trendData, setTrendData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const branchId = typeof window !== 'undefined' ? localStorage.getItem('activeBranchId') : null;
  const ayId = typeof window !== 'undefined' ? localStorage.getItem('activeAYId') : null;

  // Load sections and stats
  useEffect(() => {
    if (!token) return;
    Promise.all([
      fetch(`${API_URL}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      branchId && ayId ? fetch(`${API_URL}/admin/branches/${branchId}/academic-years/${ayId}/sections`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()) : Promise.resolve({ success: false }),
    ]).then(([sRes, secRes]) => {
      if (sRes.success) setStats(sRes.data);
      if (secRes.success) setSections(secRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [token, branchId, ayId]);

  // Load trend data
  const loadTrend = useCallback(async () => {
    if (!token) return;
    const to = todayStr();
    const days = trendMode === 'daily' ? 7 : trendMode === 'weekly' ? 35 : 365;
    const from = localDateStr(new Date(Date.now() - days * 86400000));
    try {
      const res = await fetch(`${API_URL}/admin/attendance?from=${from}&to=${to}`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (!json.success) return;
      setStudents(json.data || []);

      // Group attendance by date
      const dateMap: Record<string, any> = {};
      for (const s of json.data || []) {
        for (const a of (s.attendances || [])) {
          const d = (a.date || '').split('T')[0];
          if (!dateMap[d]) dateMap[d] = { total: 0, present: 0 };
          dateMap[d].total++;
          if (a.status === 'present' || a.status === 'holiday') dateMap[d].present++;
        }
      }
      const days2 = Math.min(days, 30);
      const today = new Date();
      const data: any[] = [];
      for (let i = days2 - 1; i >= 0; i--) {
        const d = localDateStr(new Date(today.getFullYear(), today.getMonth(), today.getDate() - i));
        const day = dateMap[d];
        data.push({
          label: trendMode === 'daily' ? d.slice(5) : trendMode === 'weekly' ? d.slice(5) : d.slice(0, 7),
          pct: day ? Math.round((day.present / day.total) * 100) : null,
          total: day?.total || 0,
        });
      }
      setTrendData(data);
    } catch {}
  }, [token, trendMode]);

  useEffect(() => { loadTrend(); }, [loadTrend]);

  // Class-wise breakdown
  const classData = sections.map(sec => {
    const classStudents = students.filter((s: any) => s.groupId === sec.id);
    const atts = classStudents.flatMap((s: any) => s.attendances || []);
    const p = atts.filter((a: any) => a.status === 'present' || a.status === 'holiday').length;
    const total = atts.length;
    const pct = total ? Math.round((p / total) * 100) : 0;
    return { name: sec.section ? `${sec.name} — ${sec.section}` : sec.name, pct, total };
  }).filter(d => d.total > 0).sort((a, b) => b.pct - a.pct);

  // Top absentees
  const absenteeData = students.map((s: any) => {
    const atts = s.attendances || [];
    const p = atts.filter((a: any) => a.status === 'present' || a.status === 'holiday').length;
    const total = atts.length;
    return { name: s.name, pct: total ? Math.round((p / total) * 100) : 0, total };
  }).filter(d => d.total > 0).sort((a, b) => a.pct - b.pct).slice(0, 10);

  const todayAtts = students.flatMap((s: any) => (s.attendances || []).filter((a: any) => (a.date || '').split('T')[0] === todayStr()));
  const todayP = todayAtts.filter((a: any) => a.status === 'present' || a.status === 'holiday').length;
  const todayTotal = todayAtts.length;
  const todayPct = todayTotal ? Math.round((todayP / todayTotal) * 100) : 0;

  const maxPct = Math.max(...trendData.map(d => d.pct || 0), 100);

  const cards = [
    { icon: Users, label: 'Student Attendance', desc: 'Mark and view student attendance', href: '/admin/attendance/students', color: 'text-green-400' },
    { icon: GraduationCap, label: 'Teacher Attendance', desc: 'Mark and view teacher attendance', href: '/admin/attendance/teachers', color: 'text-yellow-400' },
    { icon: FileText, label: 'Reports', desc: 'Generate monthly & term reports (PDF)', href: '/admin/attendance/reports', color: 'text-pink-400' },
    { icon: Calendar, label: 'Today Snapshot', desc: `${stats?.totalStudents || 0} active students`, href: '/admin/attendance/students', color: 'text-blue-400', key: 'snap' },
  ];

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex items-center gap-3">
        <BarChart size={24} className="text-warm-accent" />
        <h1 className="text-xl font-light text-warm-cream">Attendance Dashboard</h1>
      </div>

      {/* Quick action cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(c => {
          const Icon = c.icon;
          return (
            <button key={c.key || c.href} onClick={() => router.push(c.href)}
              className="text-left rounded-xl border border-warm-card-border bg-warm-card p-4 hover:border-warm-accent/50 transition-colors">
              <Icon size={20} className={c.color + ' mb-2'} />
              <p className="text-sm font-medium text-warm-cream">{c.label}</p>
              <p className="text-[11px] text-warm-muted/60">{c.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Today's snapshot */}
      {todayTotal > 0 && (
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-warm-cream">Today&apos;s Attendance</h2>
            <span className={`text-lg font-light ${todayPct >= 80 ? 'text-green-400' : todayPct >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
              {todayPct}%
            </span>
          </div>
          <div className="w-full h-3 bg-warm-card-border/30 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${todayPct >= 80 ? 'bg-green-500' : todayPct >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${todayPct}%` }} />
          </div>
          <p className="mt-2 text-[11px] text-warm-muted/50">{todayP} present out of {todayTotal} students today</p>
        </div>
      )}

      {/* Trend chart */}
      <div className="rounded-xl border border-warm-card-border bg-warm-card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-warm-cream">Trend</h2>
          <div className="flex items-center gap-1">
            {(['daily', 'weekly', 'monthly'] as const).map(m => (
              <button key={m} onClick={() => setTrendMode(m)}
                className={`px-2.5 py-1 text-[10px] rounded-lg transition-colors ${trendMode === m ? 'bg-warm-accent text-[#1a1614] font-medium' : 'text-warm-muted hover:text-warm-cream'}`}>
                {m === 'daily' ? '7 Days' : m === 'weekly' ? '5 Weeks' : 'Monthly'}
              </button>
            ))}
            <button onClick={loadTrend} className="ml-1 p-1.5 text-warm-muted hover:text-warm-cream"><RefreshCw size={12} /></button>
          </div>
        </div>
        {trendData.length > 0 && (
          <div className="flex items-end gap-[3px] h-32">
            {trendData.map((d, i) => {
              const h = d.pct != null ? Math.max((d.pct / 100) * 100, 4) : 2;
              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                  <div className="w-full rounded-sm" style={{ height: `${h}%`, backgroundColor: d.pct != null ? (d.pct >= 80 ? '#22c55e' : d.pct >= 70 ? '#eab308' : '#ef4444') : '#333' }}
                    title={`${d.label}: ${d.pct != null ? d.pct + '%' : 'No data'}`} />
                  {trendData.length <= 31 && i % Math.max(1, Math.floor(trendData.length / 10)) === 0 && (
                    <span className="text-[7px] text-warm-muted/40 mt-1 truncate w-full text-center">{d.label}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {trendData.length === 0 && <p className="text-xs text-warm-muted/50 text-center py-8">No data for this period</p>}
      </div>

      {/* Class breakdown + Top absentees */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Class breakdown */}
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-5">
          <h2 className="text-sm font-medium text-warm-cream mb-4">Class Breakdown</h2>
          {classData.length > 0 ? (
            <div className="space-y-2">
              {classData.map((c, i) => (
                <div key={i}>
                  <div className="flex justify-between text-[11px] mb-0.5">
                    <span className="text-warm-cream truncate">{c.name}</span>
                    <span className={`font-medium ${c.pct >= 80 ? 'text-green-400' : c.pct >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>{c.pct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-warm-card-border/30 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${c.pct >= 80 ? 'bg-green-500' : c.pct >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${c.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-xs text-warm-muted/50 text-center py-6">Select a class to see data</p>}
        </div>

        {/* Top absentees */}
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-5">
          <h2 className="text-sm font-medium text-warm-cream mb-4">Lowest Attendance</h2>
          {absenteeData.length > 0 ? (
            <div className="space-y-2">
              {absenteeData.map((s, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-xs text-warm-cream truncate flex-1">{i + 1}. {s.name}</span>
                  <span className={`text-xs font-medium ml-2 ${s.pct >= 80 ? 'text-green-400' : s.pct >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>{s.pct}%</span>
                </div>
              ))}
            </div>
          ) : <p className="text-xs text-warm-muted/50 text-center py-6">No data yet</p>}
        </div>
      </div>

      {/* System overview */}
      {stats && (
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-5">
          <h2 className="text-sm font-medium text-warm-cream mb-4">System Overview</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div><p className="text-[10px] text-warm-muted/50 uppercase tracking-wider">Students</p><p className="text-lg font-light text-warm-cream mt-1">{stats.totalStudents || 0}</p></div>
            <div><p className="text-[10px] text-warm-muted/50 uppercase tracking-wider">Teachers</p><p className="text-lg font-light text-warm-cream mt-1">{stats.totalTeachers || 0}</p></div>
            <div><p className="text-[10px] text-warm-muted/50 uppercase tracking-wider">Classes</p><p className="text-lg font-light text-warm-cream mt-1">{stats.totalGroups || 0}</p></div>
            <div><p className="text-[10px] text-warm-muted/50 uppercase tracking-wider">Records</p><p className="text-lg font-light text-warm-cream mt-1">{stats.totalAttendanceRecords || '—'}</p></div>
          </div>
        </div>
      )}
    </main>
  );
}
