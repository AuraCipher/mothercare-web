'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import {
  ArrowLeft, Building2, Users, GraduationCap, BookOpen, Key,
  MapPin, Phone, Mail, Check, X, Trash2,
} from 'lucide-react';
import { showToast } from '@/components/toast';
import ConfirmModal from '@/components/confirm-modal';

interface BranchStats {
  id: string; name: string; code: string; address: string | null;
  phone: string | null; email: string | null; isActive: boolean;
  stats: {
    totalStaff: number; totalStudents: number; totalTeachers: number;
    totalClasses: number; totalAcademicYears: number;
  };
  admins: Array<{
    id: string; name: string; email: string | null;
    phone: string | null; status: string; since: string;
  }>;
}

export default function CeoBranchDetail() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<BranchStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState<{
    open: boolean; title: string; message: string;
    variant: 'danger' | 'warning' | 'default';
    confirmLabel: string; action: () => Promise<void>;
  }>({ open: false, title: '', message: '', variant: 'danger', confirmLabel: 'Confirm', action: async () => {} });

  const loadBranchData = () => {
    setLoading(true);
    api.getBranchStats(id)
      .then(d => { if (d.success) setData(d.data); })
      .catch(e => setError(e.message || 'Failed to load branch'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadBranchData(); }, [id]);

  const handleRemoveAdmin = (adminId: string, adminName: string) => {
    setConfirm({
      open: true,
      title: 'Remove Admin?',
      message: `"${adminName}" will lose all access. Their login credentials will be deactivated, but all branch data (students, teachers, classes) will remain untouched. A new admin can be appointed to take over.`,
      variant: 'danger',
      confirmLabel: 'Remove Admin',
      action: async () => {
        try {
          await api.removeAdmin(id, adminId);
          showToast('success', 'Admin removed. Credentials deactivated, data preserved.');
          loadBranchData();
        } catch (e: any) {
          showToast('error', e.message || 'Failed to remove admin');
        }
      },
    });
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-6 h-6 w-48 rounded bg-warm-card animate-pulse" />
        <div className="grid grid-cols-2 gap-4 mb-8 md:grid-cols-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 rounded-xl bg-warm-card animate-pulse" />)}
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <p className="rounded-lg border border-warm-card-border bg-warm-card px-4 py-2 text-xs text-[#b39a76]">{error || 'Branch not found'}</p>
        <button onClick={() => router.push('/ceo/branches')} className="mt-4 text-xs text-warm-accent hover:text-[#b39a76] transition-colors">← Back to Branches</button>
      </main>
    );
  }

  const statCards = [
    { label: 'Total Staff', value: data.stats.totalStaff, icon: Users },
    { label: 'Total Teachers', value: data.stats.totalTeachers, icon: GraduationCap },
    { label: 'Total Students', value: data.stats.totalStudents, icon: BookOpen },
    { label: 'Classes', value: data.stats.totalClasses, icon: Building2 },
  ];

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      {/* Back + Header */}
      <button onClick={() => router.push('/ceo/branches')} className="mb-6 flex items-center gap-1.5 text-xs text-warm-muted hover:text-warm-cream transition-colors">
        <ArrowLeft size={14} /> Back to Branches
      </button>

      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-light text-warm-cream">{data.name}</h1>
            <span className="text-[10px] font-mono text-warm-muted/50 uppercase">{data.code}</span>
            {data.isActive ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-900/30 px-2 py-0.5 text-[10px] text-green-400">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400" /> Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-700/30 px-2 py-0.5 text-[10px] text-gray-400">
                <span className="h-1.5 w-1.5 rounded-full bg-gray-400" /> Inactive
              </span>
            )}
          </div>
          <p className="text-sm text-warm-muted">{data.address || 'No address on file'}</p>
          <div className="flex items-center gap-4 mt-1 text-xs text-warm-muted">
            {data.phone && <span className="flex items-center gap-1"><Phone size={11} /> {data.phone}</span>}
            {data.email && <span className="flex items-center gap-1"><Mail size={11} /> {data.email}</span>}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4">
        {statCards.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-xl border border-warm-card-border bg-warm-card p-4">
              <Icon size={16} className="mb-2 text-warm-accent" />
              <p className="text-xl font-light text-warm-cream">{s.value.toLocaleString()}</p>
              <p className="mt-0.5 text-xs text-warm-muted">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Admin section */}
      <section className="mb-10">
        <h2 className="mb-3 text-sm font-medium text-warm-cream flex items-center gap-2">
          <Users size={14} className="text-warm-accent" /> Branch Admin
        </h2>

        {data.admins.length === 0 ? (
          <div className="rounded-xl border border-warm-card-border bg-warm-card p-6 text-center">
            <p className="text-sm text-warm-muted">No admin assigned to this branch.</p>
            <button
              onClick={() => router.push('/ceo/admins/invite')}
              className="mt-3 text-xs text-warm-accent hover:text-[#b39a76] transition-colors"
            >
              Invite an admin →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {data.admins.map(admin => (
              <div key={admin.id} className="rounded-xl border border-warm-card-border bg-warm-card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warm-accent/10">
                      <Users size={15} className="text-warm-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-warm-cream">{admin.name}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-warm-muted">
                        {admin.email && <span>{admin.email}</span>}
                        {admin.phone && <span>{admin.phone}</span>}
                        <span className="text-warm-muted/50">Since {new Date(admin.since).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      admin.status === 'active'
                        ? 'bg-green-900/30 text-green-400'
                        : 'bg-gray-700/30 text-gray-400'
                    }`}>
                      <span className={`inline-block h-1.5 w-1.5 rounded-full ${admin.status === 'active' ? 'bg-green-400' : 'bg-gray-400'}`} />
                      {admin.status}
                    </span>
                    {admin.status === 'active' && (
                      <button
                        onClick={() => handleRemoveAdmin(admin.id, admin.name)}
                        className="rounded-lg p-1.5 text-warm-muted hover:text-red/80 hover:bg-warm-card-border/30 transition-colors"
                        title="Remove admin"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Quick links */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-warm-cream">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <button onClick={() => router.push('/ceo/admins/invite')}
            className="flex items-center justify-between rounded-lg border border-warm-card-border bg-warm-card px-4 py-3 transition-colors hover:bg-warm-card/80 text-left">
            <span className="flex items-center gap-2 text-sm text-warm-cream"><Key size={15} className="text-warm-accent" /> Invite New Admin</span>
          </button>
          <button onClick={() => router.push('/admin/branches')}
            className="flex items-center justify-between rounded-lg border border-warm-card-border bg-warm-card px-4 py-3 transition-colors hover:bg-warm-card/80 text-left">
            <span className="flex items-center gap-2 text-sm text-warm-cream"><Building2 size={15} className="text-warm-accent" /> Manage Branch</span>
          </button>
          <button onClick={() => router.push('/ceo/keys')}
            className="flex items-center justify-between rounded-lg border border-warm-card-border bg-warm-card px-4 py-3 transition-colors hover:bg-warm-card/80 text-left">
            <span className="flex items-center gap-2 text-sm text-warm-cream"><Key size={15} className="text-warm-accent" /> API Keys</span>
          </button>
        </div>
      </section>

      {/* ── Confirm Modal (remove admin) ──────────────── */}
      <ConfirmModal
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        variant={confirm.variant}
        confirmLabel={confirm.confirmLabel}
        onConfirm={async () => { await confirm.action(); setConfirm(prev => ({ ...prev, open: false })); }}
        onCancel={() => setConfirm(prev => ({ ...prev, open: false }))}
      />
    </main>
  );
}
