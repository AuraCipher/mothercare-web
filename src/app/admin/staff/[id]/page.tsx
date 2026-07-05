'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Shield, Mail, Phone, User, Save } from 'lucide-react';
import { api } from '@/lib/api';
import { showToast } from '@/components/toast';
import ConfirmModal from '@/components/confirm-modal';
import {
  PermissionMatrix,
  crudSummary,
  moduleLabel,
  toPermArray,
  toPermRecord,
  type ModulePermission,
} from '@/components/staff-permission-matrix';

type StaffDetail = {
  userId: string;
  name: string;
  username: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  branchRole: string;
  permissions: ModulePermission[];
  createdAt?: string;
  lastLoginAt?: string | null;
  isActive?: boolean;
};

const fieldClass =
  'w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent';

export default function StaffDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [data, setData] = useState<StaffDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [perms, setPerms] = useState(toPermRecord([]));
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPerms, setSavingPerms] = useState(false);

  const [confirm, setConfirm] = useState<{
    open: boolean; title: string; message: string;
    variant: 'danger' | 'warning' | 'default';
    confirmLabel: string; action: () => Promise<void>;
  }>({ open: false, title: '', message: '', variant: 'default', confirmLabel: 'Confirm', action: async () => {} });

  const load = useCallback(() => {
    if (!userId) return;
    setLoading(true);
    api.getStaffMember(userId)
      .then((r) => {
        const d = r.data as StaffDetail;
        setData(d);
        setName(d.name);
        setEmail(d.email || '');
        setPhone(d.phone || '');
        setPerms(toPermRecord(d.permissions));
      })
      .catch((e) => showToast('error', e.message))
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const saveProfile = async () => {
    if (!data) return;
    setSavingProfile(true);
    try {
      const res = await api.updateStaffMember(userId, {
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      setData(res.data);
      showToast('success', 'Profile updated');
    } catch (e: unknown) {
      showToast('error', e instanceof Error ? e.message : 'Update failed');
    } finally {
      setSavingProfile(false);
    }
  };

  const savePermissions = async () => {
    const permissions = toPermArray(perms);
    if (permissions.length === 0) {
      showToast('error', 'Select at least one module');
      return;
    }
    setSavingPerms(true);
    try {
      await api.updateStaffPermissions(userId, permissions);
      showToast('success', 'Module access updated');
      load();
    } catch (e: unknown) {
      showToast('error', e instanceof Error ? e.message : 'Update failed');
    } finally {
      setSavingPerms(false);
    }
  };

  const toggleStatus = () => {
    if (!data) return;
    if (data.status === 'active') {
      setConfirm({
        open: true,
        title: `Deactivate "${data.name}"?`,
        message: 'Login will be disabled. Permissions are kept for reactivation.',
        variant: 'warning',
        confirmLabel: 'Deactivate',
        action: async () => {
          await api.deactivateStaffMember(userId);
          showToast('success', 'Staff deactivated');
          load();
        },
      });
    } else {
      setConfirm({
        open: true,
        title: `Reactivate "${data.name}"?`,
        message: 'Login will be restored with existing module access.',
        variant: 'default',
        confirmLabel: 'Reactivate',
        action: async () => {
          await api.reactivateStaffMember(userId);
          showToast('success', 'Staff reactivated');
          load();
        },
      });
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="h-40 animate-pulse rounded-xl bg-warm-card" />
      </main>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-sm text-warm-muted">Staff member not found.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <button
        type="button"
        onClick={() => router.push('/admin/staff')}
        className="mb-6 flex items-center gap-1.5 text-xs text-warm-muted transition-colors hover:text-warm-cream"
      >
        <ArrowLeft size={14} /> Back to Staff
      </button>

      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-violet-500/10">
            <Shield size={24} className="text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-light text-warm-cream">{data.name}</h1>
            <p className="mt-0.5 text-xs text-warm-muted">
              @{data.username} · {data.branchRole.replace('_', ' ')}
            </p>
            <span className={`mt-1 inline-flex items-center gap-1 text-[11px] ${
              data.status === 'active' ? 'text-green-400' : 'text-warm-muted'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${data.status === 'active' ? 'bg-green-400' : 'bg-gray-500'}`} />
              {data.status}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={toggleStatus}
          className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
            data.status === 'active'
              ? 'border-red-900/40 text-red-400 hover:bg-red-900/10'
              : 'border-green-900/40 text-green-400 hover:bg-green-900/10'
          }`}
        >
          {data.status === 'active' ? 'Deactivate' : 'Reactivate'}
        </button>
      </div>

      <section className="mb-6 rounded-xl border border-warm-card-border bg-warm-card/30 p-5">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-medium text-warm-cream">
          <User size={15} /> Profile
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[10px] uppercase text-warm-muted/60">Full name</label>
            <input className={fieldClass} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-[10px] uppercase text-warm-muted/60">Username</label>
            <input className={fieldClass} value={data.username || ''} disabled />
          </div>
          <div>
            <label className="mb-1 flex items-center gap-1 text-[10px] uppercase text-warm-muted/60">
              <Mail size={10} /> Email
            </label>
            <input className={fieldClass} value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 flex items-center gap-1 text-[10px] uppercase text-warm-muted/60">
              <Phone size={10} /> Phone
            </label>
            <input className={fieldClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>
        <button
          type="button"
          disabled={savingProfile}
          onClick={saveProfile}
          className="mt-4 flex items-center gap-1.5 rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] disabled:opacity-50"
        >
          <Save size={13} /> {savingProfile ? 'Saving…' : 'Save profile'}
        </button>
      </section>

      <section className="rounded-xl border border-warm-card-border bg-warm-card/30 p-5">
        <h2 className="mb-1 text-sm font-medium text-warm-cream">Module access</h2>
        <p className="mb-4 text-xs text-warm-muted">Read is always enabled for selected modules.</p>
        <PermissionMatrix value={perms} onChange={setPerms} />
        {data.permissions.length > 0 && (
          <div className="mt-4 rounded-lg border border-warm-card-border/50 bg-[#1a1614]/50 p-3">
            <p className="mb-2 text-[10px] uppercase tracking-wider text-warm-muted/60">Current summary</p>
            <ul className="space-y-1 text-xs text-warm-muted">
              {data.permissions.map((p) => (
                <li key={p.module}>
                  <span className="text-warm-cream">{moduleLabel(p.module)}</span>
                  {' — '}{crudSummary(p)}
                </li>
              ))}
            </ul>
          </div>
        )}
        <button
          type="button"
          disabled={savingPerms}
          onClick={savePermissions}
          className="mt-4 flex items-center gap-1.5 rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] disabled:opacity-50"
        >
          <Save size={13} /> {savingPerms ? 'Saving…' : 'Save module access'}
        </button>
      </section>

      <ConfirmModal
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        variant={confirm.variant}
        confirmLabel={confirm.confirmLabel}
        onConfirm={async () => {
          try {
            await confirm.action();
          } catch (e: unknown) {
            showToast('error', e instanceof Error ? e.message : 'Action failed');
          }
          setConfirm((prev) => ({ ...prev, open: false }));
        }}
        onCancel={() => setConfirm((prev) => ({ ...prev, open: false }))}
      />
    </main>
  );
}
