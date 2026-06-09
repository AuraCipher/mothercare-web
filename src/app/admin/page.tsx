'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Users, BookOpen, GraduationCap, ArrowRight } from 'lucide-react';

interface Stats {
  totalUsers: number; totalGroups: number; totalStudents: number;
  totalBranches: number; byRole: Record<string, number>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    try { const d = await api.stats(); if (d.success) setStats(d.data); }
    catch { setError('Failed to load stats'); }
  };

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers ?? '—', icon: Users },
    { label: 'Classes', value: stats?.totalGroups ?? '—', icon: BookOpen },
    { label: 'Students', value: stats?.totalStudents ?? '—', icon: GraduationCap },
  ];

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8">
        <h1 className="mb-1 text-xl font-light text-warm-cream">Dashboard</h1>
        <p className="text-sm text-warm-muted">Overview of your school portal.</p>
      </div>

      {error && (
        <p className="mb-6 rounded-lg border border-warm-card-border bg-warm-card px-4 py-2 text-xs text-[#b39a76]">{error}</p>
      )}

      <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-3">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-xl border border-warm-card-border bg-warm-card p-4">
              <Icon size={16} className="mb-2 text-warm-accent" aria-hidden="true" />
              <p className="text-xl font-light text-warm-cream">{typeof s.value === 'number' ? s.value.toLocaleString() : s.value}</p>
              <p className="mt-0.5 text-xs text-warm-muted">{s.label}</p>
            </div>
          );
        })}
      </div>

      {stats?.byRole && Object.keys(stats.byRole).length > 0 && (
        <div className="mb-10">
          <h2 className="mb-3 text-sm font-medium text-warm-cream">User Roles</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {Object.entries(stats.byRole).map(([role, count]) => (
              <div key={role} className="rounded-lg border border-warm-card-border bg-warm-card px-4 py-3">
                <p className="text-xs text-warm-muted capitalize">{role.replace('_', ' ')}</p>
                <p className="text-lg font-light text-warm-cream">{typeof count === 'number' ? count : 0}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-3 text-sm font-medium text-warm-cream">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-1">
          <a href="/admin/classes" className="flex items-center justify-between rounded-lg border border-warm-card-border bg-warm-card px-4 py-3 transition-colors hover:bg-warm-card/80">
            <span className="flex items-center gap-2 text-sm text-warm-cream"><BookOpen size={15} className="text-warm-accent" /> Classes & Groups</span>
            <ArrowRight size={14} className="text-warm-muted" />
          </a>
        </div>
      </div>
    </main>
  );
}
