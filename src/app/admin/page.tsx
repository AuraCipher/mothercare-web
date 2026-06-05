'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { LogOut, Users, BookOpen, GraduationCap, LayoutDashboard, ArrowRight, Menu, X } from 'lucide-react';

interface UserData {
  id: string;
  name: string;
  role: string;
  username?: string;
  email?: string;
  phone?: string;
  status?: string;
}

interface Stats {
  totalUsers: number;
  totalGroups: number;
  totalStudents: number;
  totalCommunities: number;
  activeApiKeys: number;
  byRole: Record<string, number>;
}

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [userData, statsData] = await Promise.all([
        api.me(),
        api.stats().catch(() => null),
      ]);
      if (userData.success) setUser(userData.user);
      if (statsData?.success) setStats(statsData.data);
    } catch {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try { await api.logout(); } catch { /* ignore */ }
    localStorage.removeItem('token');
    document.cookie = 'token=; path=/; max-age=0';
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1a1614]">
        <p className="text-sm text-warm-muted">Loading…</p>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers ?? '—', icon: Users },
    { label: 'Classes', value: stats?.totalGroups ?? '—', icon: BookOpen },
    { label: 'Students', value: stats?.totalStudents ?? '—', icon: GraduationCap },
  ];

  return (
    <div className="min-h-screen bg-[#1a1614]">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-warm-card-border px-6 py-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setMenuOpen(!menuOpen)} className="rounded-lg p-1.5 text-warm-muted hover:bg-warm-card hover:text-warm-cream transition-colors">
            {menuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
          <LayoutDashboard size={16} className="text-warm-accent" />
          <span className="text-sm font-medium text-warm-cream">Admin</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-warm-muted sm:block">{user?.name}</span>
          <span className="inline-flex items-center gap-1 rounded-full border border-warm-accent/30 bg-warm-accent/10 px-2.5 py-0.5 text-[10px] font-medium tracking-wide text-warm-accent uppercase">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-warm-accent" />
            {user?.role?.replace('_', ' ') || 'user'}
          </span>
          <button onClick={handleSignOut} className="flex items-center gap-1 text-xs text-warm-muted hover:text-warm-cream transition-colors">
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </header>

      {/* Sidebar overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div className="flex-1 bg-black/50" onClick={() => setMenuOpen(false)} />
          {/* Side menu */}
          <nav className="w-56 bg-[#24201e] border-l border-warm-card-border p-4">
            <p className="mb-4 text-[10px] font-medium tracking-wider text-warm-muted uppercase">Navigation</p>
            <div className="space-y-0.5">
              <a href="/admin/classes" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-warm-cream hover:bg-warm-card transition-colors">
                <BookOpen size={14} className="text-warm-accent" /> Classes / Groups
              </a>
              <a href="/admin" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-warm-muted hover:bg-warm-card hover:text-warm-cream transition-colors">
                <Users size={14} className="text-warm-accent" /> Teachers
              </a>
              <a href="/admin" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-warm-muted hover:bg-warm-card hover:text-warm-cream transition-colors">
                <GraduationCap size={14} className="text-warm-accent" /> Students
              </a>
            </div>
          </nav>
        </div>
      )}

      <main className="mx-auto max-w-5xl px-6 py-10">
        {/* Welcome */}
        <h1 className="mb-1 text-xl font-light text-warm-cream">Welcome, {user?.name?.split(' ')[0] || 'Admin'}</h1>
        <p className="mb-8 text-sm text-warm-muted">Manage your school portal from here.</p>

        {error && (
          <p className="mb-6 rounded-lg border border-warm-card-border bg-warm-card px-4 py-2 text-xs text-[#b39a76]">{error}</p>
        )}

        {/* Stats */}
        <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4">
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

        {/* Role breakdown */}
        {stats?.byRole && Object.keys(stats.byRole).length > 0 && (
          <div className="mb-10">
            <h2 className="mb-3 text-sm font-medium text-warm-cream">User Roles</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {Object.entries(stats.byRole).map(([role, count]) => {
                const value = typeof count === 'number' ? count : (count as any)?._count?.role ?? (count as any)?.role ?? 0;
                return (
                  <div key={role} className="rounded-lg border border-warm-card-border bg-warm-card px-4 py-3">
                    <p className="text-xs text-warm-muted capitalize">{role.replace('_', ' ')}</p>
                    <p className="text-lg font-light text-warm-cream">{value}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div>
          <h2 className="mb-3 text-sm font-medium text-warm-cream">Quick Actions</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <a href="/admin" className="flex items-center justify-between rounded-lg border border-warm-card-border bg-warm-card px-4 py-3 transition-colors hover:bg-warm-card/80">
              <span className="flex items-center gap-2 text-sm text-warm-cream"><Users size={15} className="text-warm-accent" /> Manage Users</span>
              <ArrowRight size={14} className="text-warm-muted" />
            </a>
            <a href="/admin/classes" className="flex items-center justify-between rounded-lg border border-warm-card-border bg-warm-card px-4 py-3 transition-colors hover:bg-warm-card/80">
              <span className="flex items-center gap-2 text-sm text-warm-cream"><BookOpen size={15} className="text-warm-accent" /> Classes & Groups</span>
              <ArrowRight size={14} className="text-warm-muted" />
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
