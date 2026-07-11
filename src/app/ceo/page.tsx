'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Building2, Users, GraduationCap, Key, ArrowRight,
} from 'lucide-react';

interface Stats {
  totalUsers: number; totalGroups: number; totalStudents: number;
  totalAcademicYears: number; totalBranches: number; activeApiKeys: number; byRole: Record<string, number>;
}

export default function CeoDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    try { const d = await api.stats(); if (d.success) setStats(d.data); }
    catch { setError('Failed to load stats'); }
  };

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8">
        <h1 className="mb-1 text-xl font-light text-warm-cream">CEO Dashboard</h1>
        <p className="text-sm text-warm-muted">Overview of all branches and staff.</p>
      </div>

      {error && (
        <p className="mb-6 rounded-lg border border-warm-card-border bg-warm-card px-4 py-2 text-xs text-[#b39a76]">{error}</p>
      )}

      {/* Stats cards */}
      <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-4">
          <Building2 size={16} className="mb-2 text-warm-accent" />
          <p className="text-xl font-light text-warm-cream">{stats?.totalBranches?.toLocaleString() ?? '—'}</p>
          <p className="mt-0.5 text-xs text-warm-muted">Total Branches</p>
        </div>
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-4">
          <Users size={16} className="mb-2 text-warm-accent" />
          <p className="text-xl font-light text-warm-cream">{stats?.totalUsers?.toLocaleString() ?? '—'}</p>
          <p className="mt-0.5 text-xs text-warm-muted">Total Staff</p>
        </div>
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-4">
          <GraduationCap size={16} className="mb-2 text-warm-accent" />
          <p className="text-xl font-light text-warm-cream">{stats?.totalStudents?.toLocaleString() ?? '—'}</p>
          <p className="mt-0.5 text-xs text-warm-muted">Total Students</p>
        </div>
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-4">
          <Key size={16} className="mb-2 text-warm-accent" />
          <p className="text-xl font-light text-warm-cream">{stats?.activeApiKeys?.toLocaleString() ?? '—'}</p>
          <p className="mt-0.5 text-xs text-warm-muted">Active API Keys</p>
        </div>
      </div>

      {/* Role breakdown */}
      {stats?.byRole && Object.keys(stats.byRole).length > 0 && (
        <div className="mb-10">
          <h2 className="mb-3 text-sm font-medium text-warm-cream">Staff by Role</h2>
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

      {/* Quick actions */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-warm-cream">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/ceo/branches" className="flex items-center justify-between rounded-lg border border-warm-card-border bg-warm-card px-4 py-3 transition-colors hover:bg-warm-card/80">
            <span className="flex items-center gap-2 text-sm text-warm-cream"><Building2 size={15} className="text-warm-accent" /> Manage Branches</span>
            <ArrowRight size={14} className="text-warm-muted" />
          </Link>
          <Link href="/ceo/keys" className="flex items-center justify-between rounded-lg border border-warm-card-border bg-warm-card px-4 py-3 transition-colors hover:bg-warm-card/80">
            <span className="flex items-center gap-2 text-sm text-warm-cream"><Key size={15} className="text-warm-accent" /> API Key Manager</span>
            <ArrowRight size={14} className="text-warm-muted" />
          </Link>
        </div>
      </div>
    </main>
  );
}
