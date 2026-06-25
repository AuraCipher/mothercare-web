'use client';

import { useEffect, useState, useCallback } from 'react';
import { BarChart, Users, GraduationCap, FileText, Calendar, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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

export default function AttendanceDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [dashPeriod, setDashPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'full' | 'custom'>('daily');
  const [trendData, setTrendData] = useState<any[]>([]);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [dashGroupId, setDashGroupId] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const branchId = typeof window !== 'undefined' ? localStorage.getItem('activeBranchId') : null;
  const ayId = typeof window !== 'undefined' ? localStorage.getItem('activeAYId') : null;

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

  const loadTrend = useCallback(async () => {
    if (!token) return;
    let to = todayStr();
    let from: string;
    let days = 30;
    if (dashPeriod === 'custom') {
      if (!customFrom || !customTo) return;
      from = customFrom; to = customTo;
    } else {
      days = dashPeriod === 'daily' ? 7 : dashPeriod === 'weekly' ? 35 : dashPeriod === 'monthly' ? new Date().getDate() : 365;
      from = localDateStr(new Date(Date.now() - days * 86400000));
    }
    const groupParam = dashGroupId ? `&groupId=${dashGroupId}` : '';

    try {
      const [sRes, tRes] = await Promise.all([
        fetch(`${API_URL}/admin/attendance?from=${from}&to=${to}${groupParam}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch(`${API_URL}/admin/attendance/teachers?from=${from}&to=${to}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      ]);

      if (sRes.success) setStudents(sRes.data || []);
      if (tRes.success) {
        const teacherAtts: Record<string, number> = {};
        let tTotal = 0, tPresent = 0;
        for (const t of tRes.data || []) {
          for (const a of (t.attendances || [])) {
            const d = (a.date || '').split('T')[0];
            teacherAtts[d] = (teacherAtts[d] || 0) + 1;
            if (a.status === 'present' || a.status === 'holiday') tTotal++;
            else tTotal++;
          }
          tPresent += (t.attendances || []).filter((a: any) => a.status === 'present' || a.status === 'holiday').length;
        }
      }

      // Build daily dateMap from fetched data
      const dateMap: Record<string, { total: number; present: number }> = {};
      for (const s of sRes.data || []) {
        for (const a of (s.attendances || [])) {
          const d = (a.date || '').split('T')[0];
          if (!dateMap[d]) dateMap[d] = { total: 0, present: 0 };
          dateMap[d].total++;
          if (a.status === 'present' || a.status === 'holiday') dateMap[d].present++;
        }
      }

      // Build trend data appropriate for each period
      let data: any[] = [];

      if (dashPeriod === 'full') {
        // Full AY: one bar per month (Aug 2025 — Jun 2026)
        const months = [
          { label: 'Aug', m: 7, y: 2025 }, { label: 'Sep', m: 8, y: 2025 },
          { label: 'Oct', m: 9, y: 2025 }, { label: 'Nov', m: 10, y: 2025 },
          { label: 'Dec', m: 11, y: 2025 }, { label: 'Jan', m: 0, y: 2026 },
          { label: 'Feb', m: 1, y: 2026 }, { label: 'Mar', m: 2, y: 2026 },
          { label: 'Apr', m: 3, y: 2026 }, { label: 'May', m: 4, y: 2026 },
          { label: 'Jun', m: 5, y: 2026 },
        ];
        for (const month of months) {
          const daysInMonth = new Date(month.y, month.m + 1, 0).getDate();
          let total = 0, present = 0;
          for (let d = 1; d <= daysInMonth; d++) {
            const ds = `${month.y}-${String(month.m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const day = dateMap[ds];
            if (day) { total += day.total; present += day.present; }
          }
          data.push({ label: month.label, pct: total ? Math.round((present / total) * 100) : null, total });
        }
      } else if (dashPeriod === 'monthly') {
        // Monthly: daily bars for current month (day 1 — today)
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const lastDay = today.getDate();
        for (let d = 1; d <= lastDay; d++) {
          const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const day = dateMap[ds];
          data.push({ label: String(d), pct: day ? Math.round((day.present / day.total) * 100) : null, total: day?.total || 0 });
        }
      } else if (dashPeriod === 'custom') {
        // Custom: compute range length, aggregate by month if > 60 days
        const rangeDays = Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / 86400000);
        if (rangeDays > 60) {
          const monthMap: Record<string, { total: number; present: number }> = {};
          for (const [dateStr, day] of Object.entries(dateMap)) {
            const mk = dateStr.slice(0, 7);
            if (!monthMap[mk]) monthMap[mk] = { total: 0, present: 0 };
            monthMap[mk].total += day.total;
            monthMap[mk].present += day.present;
          }
          data = Object.entries(monthMap).sort(([a], [b]) => a.localeCompare(b)).map(([key, val]) => ({
            label: key, pct: val.total ? Math.round((val.present / val.total) * 100) : null, total: val.total,
          }));
        } else {
          const start = new Date(from);
          const end = new Date(to);
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const ds = localDateStr(new Date(d));
            const day = dateMap[ds];
            data.push({ label: ds.slice(5), pct: day ? Math.round((day.present / day.total) * 100) : null, total: day?.total || 0 });
          }
        }
      } else {
        // Daily or Weekly: daily data points (last N days)
        const points = Math.min(days, 31);
        const today = new Date();
        for (let i = points - 1; i >= 0; i--) {
          const ds = localDateStr(new Date(today.getFullYear(), today.getMonth(), today.getDate() - i));
          const day = dateMap[ds];
          data.push({ label: ds.slice(5), pct: day ? Math.round((day.present / day.total) * 100) : null, total: day?.total || 0 });
        }
      }

      setTrendData(data);
    } catch {}
  }, [token, dashPeriod, dashGroupId, customFrom, customTo]);

  useEffect(() => { loadTrend(); }, [loadTrend]);

  // Stats from current period data
  const allAtts = students.flatMap((s: any) => s.attendances || []);
  const periodP = allAtts.filter((a: any) => a.status === 'present' || a.status === 'holiday').length;
  const periodA = allAtts.filter((a: any) => a.status === 'absent').length;
  const periodL = allAtts.filter((a: any) => a.status === 'late').length;
  const periodLv = allAtts.filter((a: any) => a.status === 'leave').length;
  const periodHd = allAtts.filter((a: any) => a.status === 'half-day').length;
  const periodF = allAtts.filter((a: any) => a.status === 'function').length;
  const periodTotal = allAtts.length;
  const periodPct = periodTotal ? Math.round((periodP / periodTotal) * 100) : 0;

  // Status breakdown donut data
  const statusCounts = { present: periodP, absent: periodA, late: periodL, leave: periodLv, 'half-day': periodHd, function: periodF };
  const statusColors: Record<string, string> = { present: '#22c55e', absent: '#ef4444', late: '#eab308', leave: '#3b82f6', 'half-day': '#06b6d4', function: '#ec4899' };
  const statusLabels: Record<string, string> = { present: 'Present', absent: 'Absent', late: 'Late', leave: 'Leave', 'half-day': 'Half-Day', function: 'Function' };

  // Distribution histogram: bin students by % ranges
  const bins = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  const distData = bins.slice(0, -1).map((b, i) => {
    const rangeStart = b;
    const rangeEnd = bins[i + 1];
    const count = students.filter((s: any) => {
      const pct = attPercent(s.attendances || []);
      return pct >= rangeStart && pct < rangeEnd;
    }).length;
    return { label: `${rangeStart}-${rangeEnd}%`, count, pct: students.length ? Math.round((count / students.length) * 100) : 0 };
  });

  // Class breakdown
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

  // Build conic gradient for donut
  const donutSegments = Object.entries(statusCounts).filter(([, v]) => v > 0);
  const totalCount = donutSegments.reduce((s, [, v]) => s + v, 0);
  let conicStr = '';
  let curDeg = 0;
  for (const [key, val] of donutSegments) {
    const pct = totalCount > 0 ? (val / totalCount) * 360 : 0;
    conicStr += ` ${statusColors[key]} ${curDeg}deg ${curDeg + pct}deg,`;
    curDeg += pct;
  }
  conicStr = conicStr.slice(0, -1);

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

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select value={dashGroupId} onChange={e => setDashGroupId(e.target.value)}
          className="rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent">
          <option value="">All Classes</option>
          {sections.map((s: any) => (
            <option key={s.id} value={s.id}>{s.name}{s.section ? ` — ${s.section}` : ''}</option>
          ))}
        </select>
        <div className="flex gap-1">
          {(['daily', 'weekly', 'monthly', 'full', 'custom'] as const).map(p => (
            <button key={p} onClick={() => setDashPeriod(p)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${dashPeriod === p ? 'bg-warm-accent text-[#1a1614] font-medium' : 'border border-warm-card-border text-warm-muted hover:text-warm-cream'}`}>
              {p === 'daily' ? 'Daily' : p === 'weekly' ? 'Weekly' : p === 'monthly' ? 'Monthly' : p === 'full' ? 'Full AY' : 'Custom'}
            </button>
          ))}
        </div>
        {dashPeriod === 'custom' && (
          <div className="flex items-center gap-2">
            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="rounded-lg border border-warm-card-border bg-[#1a1614] px-2 py-1.5 text-xs text-warm-cream outline-none focus:border-warm-accent" />
            <span className="text-xs text-warm-muted/50">to</span>
            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="rounded-lg border border-warm-card-border bg-[#1a1614] px-2 py-1.5 text-xs text-warm-cream outline-none focus:border-warm-accent" />
          </div>
        )}
      </div>

      {/* Top row: today progress + donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-5 lg:col-span-2">
          <h2 className="text-sm font-medium text-warm-cream mb-3">
            {dashPeriod === 'daily' ? 'Today' : dashPeriod === 'weekly' ? 'This Week' : dashPeriod === 'monthly' ? 'This Month' : dashPeriod === 'full' ? 'Full Year' : 'Period'} Attendance
          </h2>
          {periodTotal > 0 ? (
            <>
              <div className="flex items-end justify-between mb-3">
                <div>
                  <span className="text-3xl font-light text-warm-accent">{periodPct}%</span>
                  <p className="text-xs text-warm-muted/50 mt-1">{periodP} present · {periodA} absent · {periodL} late · {periodTotal} total</p>
                </div>
              </div>
              <div className="w-full h-2.5 bg-warm-card-border/20 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-warm-accent transition-all duration-500" style={{ width: `${periodPct}%` }} />
              </div>
              <div className="flex gap-4 mt-3 text-[10px] text-warm-muted/50">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{background: '#22c55e'}} /> P {periodP}</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{background: '#ef4444'}} /> A {periodA}</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{background: '#eab308'}} /> L {periodL}</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{background: '#3b82f6'}} /> Lv {periodLv}</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{background: '#06b6d4'}} /> Hd {periodHd}</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{background: '#ec4899'}} /> F {periodF}</span>
              </div>
            </>
          ) : <p className="text-xs text-warm-muted/40 py-6 text-center">No attendance data for this period</p>}
        </div>

        {/* Donut chart */}
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-5">
          <h2 className="text-sm font-medium text-warm-cream mb-3">Status Breakdown</h2>
          {donutSegments.length > 0 ? (
            <div className="flex flex-col items-center">
              <div className="w-28 h-28 rounded-full relative" style={{ background: `conic-gradient(${conicStr})` }}>
                <div className="absolute inset-3 rounded-full bg-[#1a1614] flex items-center justify-center">
                  <span className="text-lg font-light text-warm-cream">{periodPct}%</span>
                </div>
              </div>
              <div className="mt-3 space-y-1 w-full">
                {donutSegments.map(([key, val]) => (
                  <div key={key} className="flex justify-between text-[10px]">
                    <span className="flex items-center gap-1.5 text-warm-muted/70">
                      <span className="w-2 h-2 rounded-full" style={{background: statusColors[key]}} />
                      {statusLabels[key]}
                    </span>
                    <span className="text-warm-cream">{val} ({Math.round((val / totalCount) * 100)}%)</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <p className="text-xs text-warm-muted/40 py-8 text-center">No data for this period</p>}
        </div>
      </div>

      {/* Distribution histogram */}
      {students.length > 0 && (
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-5 mb-6">
          <h2 className="text-sm font-medium text-warm-cream mb-4">Attendance Distribution</h2>
          <div className="flex items-end gap-1 h-32">
            {distData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                <div className="w-full rounded-sm bg-warm-accent/60 hover:bg-warm-accent/80 transition-all duration-500"
                  style={{ height: `${Math.max(d.pct, 2)}%` }}
                  title={`${d.label}: ${d.count} students (${d.pct}%)`} />
                <span className="text-[7px] text-warm-muted/30 mt-1 whitespace-nowrap">{d.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trend chart */}
      <div className="rounded-xl border border-warm-card-border bg-warm-card p-5 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-medium text-warm-cream">Attendance Trend</h2>
          <div className="flex items-center gap-1">
            <button onClick={loadTrend} className="p-1.5 text-warm-muted hover:text-warm-cream transition-colors" title="Refresh"><RefreshCw size={13} /></button>
          </div>
        </div>
        {trendData.length > 1 ? (
          <div className="relative" style={{ height: '260px' }}>
            <svg className="w-full h-full" preserveAspectRatio="xMidYMid meet" viewBox="0 0 700 260">
              {/* Grid lines */}
              <defs>
                <linearGradient id="areaGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#b39a76" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#b39a76" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              {[0, 20, 40, 60, 80, 100].map(pct => {
                const y = 230 - (pct / 100) * 180;
                return (
                  <g key={pct}>
                    <line x1="55" y1={y} x2="690" y2={y} stroke="#2a2725" strokeWidth="1" strokeDasharray={pct === 0 ? '0' : '4,4'} />
                    <text x="50" y={y + 4} textAnchor="end" fill="#888" fontSize="10">{pct}%</text>
                  </g>
                );
              })}
              {/* X-axis */}
              <line x1="55" y1="230" x2="690" y2="230" stroke="#444" strokeWidth="1" />
              {/* Area fill under line — gradient */}
              <polyline
                fill="url(#areaGrad)"
                stroke="none"
                points={'55,230 ' + trendData.map((d, i) => {
                  const x = 55 + (i / Math.max(trendData.length - 1, 1)) * 635;
                  const y = d.pct != null ? 230 - (d.pct / 100) * 180 : 230;
                  return x + ',' + y;
                }).join(' ') + ' ' + (55 + 635) + ',230'}
              />
              {/* Data line */}
              <polyline
                fill="none"
                stroke="#b39a76"
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
                points={trendData.map((d, i) => {
                  const x = 55 + (i / Math.max(trendData.length - 1, 1)) * 635;
                  const y = d.pct != null ? 230 - (d.pct / 100) * 180 : 230;
                  return x + ',' + y;
                }).join(' ')}
              />
              {/* Data dots — larger, with glow */}
              {trendData.map((d, i) => {
                if (d.pct == null) return null;
                const x = 55 + (i / Math.max(trendData.length - 1, 1)) * 635;
                const y = 230 - (d.pct / 100) * 180;
                const color = d.pct >= 80 ? '#22c55e' : d.pct >= 70 ? '#eab308' : '#ef4444';
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r="6" fill={color} stroke="#1a1614" strokeWidth="2.5" />
                    <circle cx={x} cy={y} r="8" fill={color} opacity="0.15" />
                  </g>
                );
              })}
              {/* X-axis labels — spaced evenly */}
              {(() => {
                const step = Math.max(1, Math.floor(trendData.length / 12));
                return trendData.filter((_, i) => i % step === 0).map((d, i) => {
                  const idx = trendData.indexOf(d);
                  const x = 55 + (idx / Math.max(trendData.length - 1, 1)) * 635;
                  return <text key={i} x={x} y="248" textAnchor="middle" fill="#888" fontSize="10">{d.label}</text>;
                });
              })()}
              {/* Period label in top-right */}
              <text x="688" y="18" textAnchor="end" fill="#555" fontSize="10">
                {dashPeriod === 'daily' ? 'Last 7 Days' : dashPeriod === 'weekly' ? 'Last 5 Weeks' : dashPeriod === 'monthly' ? 'This Month' : dashPeriod === 'full' ? 'Full Academic Year' : 'Custom Range'}
              </text>
            </svg>
          </div>
        ) : (
          <div className="flex items-center justify-center h-36 text-xs text-warm-muted/40">No trend data for this period</div>
        )}
      </div>

      {/* Bottom grid: class breakdown + absentees */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-5">
          <h2 className="text-sm font-medium text-warm-cream mb-4">By Class</h2>
          {classData.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
              {classData.map((c, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-warm-cream/80 truncate pr-2">{c.name}</span>
                    <span className="text-warm-accent font-medium">{c.pct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-warm-card-border/20 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-warm-accent/70 transition-all duration-500" style={{ width: `${c.pct}%` }} />
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
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-2">
              {absenteeData.map((s, i) => (
                <div key={i} className="flex items-center justify-between border-b border-warm-card-border/5 pb-2 last:border-0">
                  <span className="text-xs text-warm-muted/70 truncate flex-1">{i + 1}. {s.name}</span>
                  <span className={`text-xs font-medium ml-2 ${s.pct >= 80 ? 'text-green-400' : s.pct >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>{s.pct}%</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-xs text-warm-muted/40">No data yet</div>
          )}
        </div>
      </div>

      {stats && (
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-5">
          <h2 className="text-sm font-medium text-warm-cream mb-4">System Overview</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div><p className="text-[10px] text-warm-muted/50 uppercase tracking-wider">Students</p><p className="text-lg font-light text-warm-cream mt-1">{stats.totalStudents || 0}</p></div>
            <div><p className="text-[10px] text-warm-muted/50 uppercase tracking-wider">Teachers</p><p className="text-lg font-light text-warm-cream mt-1">{stats.byRole?.teacher || 0}</p></div>
            <div><p className="text-[10px] text-warm-muted/50 uppercase tracking-wider">Classes</p><p className="text-lg font-light text-warm-cream mt-1">{stats.totalGroups || 0}</p></div>
            <div><p className="text-[10px] text-warm-muted/50 uppercase tracking-wider">Users</p><p className="text-lg font-light text-warm-cream mt-1">{stats.totalUsers || 0}</p></div>
          </div>
        </div>
      )}
    </main>
  );
}
