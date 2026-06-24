'use client';

import { useEffect, useState } from 'react';
import { BarChart, Users, GraduationCap, FileText, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const statusColors: Record<string, string> = {
  present: 'bg-green-500', absent: 'bg-red-500', late: 'bg-yellow-500',
  leave: 'bg-blue-500', 'half-day': 'bg-cyan-500', holiday: 'bg-purple-500', function: 'bg-pink-500',
};

export default function AttendanceDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    if (!token) return;
    // Load basic stats for today
    fetch(`${API_URL}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.success) setStats(d.data); }).catch(() => {});
  }, [token]);

  const cards = [
    {
      icon: Users, label: 'Student Attendance',
      desc: 'Mark and view student attendance',
      href: '/admin/attendance/students',
      color: 'text-green-400',
    },
    {
      icon: GraduationCap, label: 'Teacher Attendance',
      desc: 'Mark and view teacher attendance',
      href: '/admin/attendance/teachers',
      color: 'text-yellow-400',
    },
    {
      icon: FileText, label: 'Reports',
      desc: 'Generate monthly & term reports (PDF)',
      href: '/admin/attendance/reports',
      color: 'text-pink-400',
    },
    {
      icon: Calendar, label: 'Today Snapshot',
      desc: stats ? `${stats.totalStudents} active students` : 'Loading…',
      href: '/admin/attendance/students',
      color: 'text-blue-400',
    },
  ];

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex items-center gap-3">
        <BarChart size={24} className="text-warm-accent" />
        <h1 className="text-xl font-light text-warm-cream">Attendance Dashboard</h1>
      </div>

      {/* Quick action cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {cards.map(c => {
          const Icon = c.icon;
          return (
            <button key={c.href} onClick={() => router.push(c.href)}
              className="text-left rounded-xl border border-warm-card-border bg-warm-card p-5 hover:border-warm-accent/50 transition-colors">
              <Icon size={22} className={c.color + ' mb-3'} />
              <p className="text-sm font-medium text-warm-cream">{c.label}</p>
              <p className="mt-1 text-[11px] text-warm-muted/60">{c.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Stats summary */}
      {stats && (
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-6">
          <h2 className="text-sm font-medium text-warm-cream mb-4">System Overview</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-[10px] text-warm-muted/50 uppercase tracking-wider">Total Students</p>
              <p className="text-lg font-light text-warm-cream mt-1">{stats.totalStudents || 0}</p>
            </div>
            <div>
              <p className="text-[10px] text-warm-muted/50 uppercase tracking-wider">Total Teachers</p>
              <p className="text-lg font-light text-warm-cream mt-1">{stats.totalTeachers || 0}</p>
            </div>
            <div>
              <p className="text-[10px] text-warm-muted/50 uppercase tracking-wider">Classes</p>
              <p className="text-lg font-light text-warm-cream mt-1">{stats.totalGroups || 0}</p>
            </div>
            <div>
              <p className="text-[10px] text-warm-muted/50 uppercase tracking-wider">Attendance Records</p>
              <p className="text-lg font-light text-warm-cream mt-1">{stats.totalAttendanceRecords || '—'}</p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
