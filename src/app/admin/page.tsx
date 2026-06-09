'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  Users, BookOpen, GraduationCap, ArrowRight,
  UserPlus, School, ClipboardList, UserCog,
} from 'lucide-react';

interface BranchStats {
  totalStaff: number; totalTeachers: number; totalStudents: number; totalClasses: number;
}

interface AdminInfo {
  name: string; email: string | null; since: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<BranchStats | null>(null);
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null);
  const [branchName, setBranchName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const activeBranchId = localStorage.getItem('activeBranchId');

    if (!activeBranchId) {
      // Fallback to global stats if no branch selected
      api.stats().then(d => {
        if (d.success) {
          setStats({
            totalStaff: d.data.totalUsers || 0,
            totalTeachers: d.data.byRole?.teacher || 0,
            totalStudents: d.data.totalStudents || 0,
            totalClasses: d.data.totalGroups || 0,
          });
        }
      }).catch(() => setError('Failed to load stats'))
      .finally(() => setLoading(false));
      return;
    }

    api.getBranchStats(activeBranchId)
      .then(d => {
        if (d.success) {
          setStats(d.data.stats);
          setBranchName(d.data.name);
          if (d.data.admins?.length > 0) {
            const admin = d.data.admins[0];
            setAdminInfo({ name: admin.name, email: admin.email, since: admin.since });
          }
        }
      })
      .catch(e => setError(e.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: 'Total Staff', value: stats?.totalStaff ?? null, icon: Users, color: 'bg-blue-900/30 text-blue-400' },
    { label: 'Teachers', value: stats?.totalTeachers ?? null, icon: GraduationCap, color: 'bg-emerald-900/30 text-emerald-400' },
    { label: 'Students', value: stats?.totalStudents ?? null, icon: School, color: 'bg-amber-900/30 text-amber-400' },
    { label: 'Classes', value: stats?.totalClasses ?? null, icon: ClipboardList, color: 'bg-purple-900/30 text-purple-400' },
  ];

  const quickActions = [
    { label: 'Students', href: '/admin/students', icon: UserPlus, desc: 'Register & manage students' },
    { label: 'Teachers', href: '/admin/teachers', icon: GraduationCap, desc: 'Manage teaching staff' },
    { label: 'Staff', href: '/admin/staff', icon: Users, desc: 'View branch members & roles' },
    { label: 'Classes', href: '/admin/classes', icon: BookOpen, desc: 'Manage class groups' },
  ];

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-1 text-xl font-light text-warm-cream">Dashboard</h1>
        <p className="text-sm text-warm-muted">
          {branchName ? `${branchName} — Overview of your school campus.` : 'Overview of your school portal.'}
        </p>
      </div>

      {/* Admin info banner */}
      {adminInfo && (
        <div className="mb-6 rounded-lg border border-warm-card-border bg-warm-card/50 px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-warm-muted">
            <UserCog size={13} className="text-warm-accent shrink-0" />
            <span className="text-warm-cream font-medium">{adminInfo.name}</span>
            {adminInfo.email && <span className="text-warm-muted">· {adminInfo.email}</span>}
            <span className="text-warm-muted/50">· Since {new Date(adminInfo.since).toLocaleDateString()}</span>
          </div>
        </div>
      )}

      {error && (
        <p className="mb-6 rounded-lg border border-warm-card-border bg-warm-card px-4 py-2 text-xs text-[#b39a76]">{error}</p>
      )}

      {/* Stats grid */}
      {loading ? (
        <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 rounded-xl bg-warm-card animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          {statCards.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="rounded-xl border border-warm-card-border bg-warm-card p-4">
                <div className={`mb-3 inline-flex h-8 w-8 items-center justify-center rounded-lg ${s.color}`}>
                  <Icon size={16} />
                </div>
                <p className="text-xl font-light text-warm-cream">
                  {s.value !== null ? s.value.toLocaleString() : '—'}
                </p>
                <p className="mt-0.5 text-xs text-warm-muted">{s.label}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-warm-cream">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {quickActions.map(action => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={() => router.push(action.href)}
                className="flex items-center justify-between rounded-lg border border-warm-card-border bg-warm-card px-4 py-3 transition-colors hover:bg-warm-card/80 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warm-accent/10">
                    <Icon size={16} className="text-warm-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-warm-cream">{action.label}</p>
                    <p className="text-xs text-warm-muted">{action.desc}</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-warm-muted shrink-0" />
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );
}
