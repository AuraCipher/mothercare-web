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
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-warm-cream">Today&apos;s Attendance</h2>
            <span className="text-lg font-light text-warm-accent">{todayPct}%</span>
          </div>
          <div className="w-full h-2 bg-warm-card-border/20 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-warm-accent transition-all" style={{ width: `${todayPct}%` }} />
          </div>
          <p className="mt-2 text-xs text-warm-muted/50">{todayP} present · {todayTotal - todayP} absent · {todayTotal} total</p>
        </div>
      )}

      {/* Trend chart */}
      <div className="rounded-xl border border-warm-card-border bg-warm-card p-5 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-medium text-warm-cream">Attendance Trend</h2>
          <div className="flex items-center gap-1">
            {(['daily', 'weekly', 'monthly'] as const).map(m => (
              <button key={m} onClick={() => setTrendMode(m)}
                className={`px-3 py-1 text-xs rounded-lg transition-colors ${trendMode === m ? 'bg-warm-accent/20 text-warm-accent font-medium' : 'text-warm-muted hover:text-warm-cream'}`}>
                {m === 'daily' ? '7 Days' : m === 'weekly' ? '5 Weeks' : 'Monthly'}
              </button>
            ))}
            <button onClick={loadTrend} className="ml-1 p-1.5 text-warm-muted hover:text-warm-cream transition-colors"><RefreshCw size={13} /></button>
          </div>
        </div>
        {trendData.length > 0 ? (
          <div className="flex items-end gap-[2px] h-36">
            {trendData.map((d, i) => {
              const h = d.pct != null ? (d.pct / 100) * 100 : 2;
              const alpha = d.pct != null ? (d.pct >= 80 ? 'cc' : d.pct >= 70 ? '99' : '66') : '20';
              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative min-w-[8px]">
                  <div className="w-full rounded-sm hover:opacity-80 transition-opacity"
                    style={{ height: `${Math.max(h, 3)}%`, backgroundColor: '#b39a76' + alpha }}
                    title={`${d.label}: ${d.pct != null ? d.pct + '%' : 'No data'}`} />
                  {trendData.length <= 31 && i % Math.ceil(trendData.length / 8) === 0 && (
                    <span className="text-[7px] text-warm-muted/30 mt-1.5 whitespace-nowrap">{d.label}</span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center h-36 text-xs text-warm-muted/40">No trend data for this period</div>
        )}
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-5">
          <h2 className="text-sm font-medium text-warm-cream mb-4">By Class</h2>
          {classData.length > 0 ? (
            <div className="space-y-3">
              {classData.map((c, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-warm-cream/80 truncate pr-2">{c.name}</span>
                    <span className="text-warm-accent font-medium">{c.pct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-warm-card-border/20 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-warm-accent/70 transition-all" style={{ width: `${c.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-xs text-warm-muted/40">No data</div>
          )}
        </div>

        <div className="rounded-xl border border-warm-card-border bg-warm-card p-5">
          <h2 className="text-sm font-medium text-warm-cream mb-4">Lowest Attendance</h2>
          {absenteeData.length > 0 ? (
            <div className="space-y-2.5">
              {absenteeData.map((s, i) => (
                <div key={i} className="flex items-center justify-between border-b border-warm-card-border/5 pb-2 last:border-0">
                  <span className="text-xs text-warm-muted/70 truncate flex-1">{i + 1}. {s.name}</span>
                  <span className="text-xs text-warm-accent/70 ml-2">{s.pct}%</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-xs text-warm-muted/40">No data</div>
          )}
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
