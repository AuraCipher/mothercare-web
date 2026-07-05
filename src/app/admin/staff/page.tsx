'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, UserPlus, Search, X, Edit3, Trash2, ExternalLink, Shield,
} from 'lucide-react';
import { api } from '@/lib/api';
import { showToast } from '@/components/toast';
import ConfirmModal from '@/components/confirm-modal';
import {
  PermissionMatrix,
  emptyPermMap,
  formatModuleSummary,
  toPermArray,
  type ModulePermission,
} from '@/components/staff-permission-matrix';

type StaffRow = {
  userId: string;
  name: string;
  username: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  branchRole: string;
  permissions: ModulePermission[];
};

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-warm-muted">{label}{required && ' *'}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = 'text' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent transition-colors"
    />
  );
}

export default function StaffPage() {
  const router = useRouter();
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [cf, setCf] = useState({ name: '', username: '', email: '', phone: '' });
  const [createPerms, setCreatePerms] = useState(emptyPermMap);

  const [confirm, setConfirm] = useState<{
    open: boolean; title: string; message: string;
    variant: 'danger' | 'warning' | 'default';
    confirmLabel: string; action: () => Promise<void>;
  }>({ open: false, title: '', message: '', variant: 'default', confirmLabel: 'Confirm', action: async () => {} });

  const load = useCallback(() => {
    setLoading(true);
    api.getStaffList({
      search: search.trim() || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
    })
      .then((r) => setStaff(r.data || []))
      .catch((e) => showToast('error', e.message))
      .finally(() => setLoading(false));
  }, [search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const resetCreate = () => {
    setCf({ name: '', username: '', email: '', phone: '' });
    setCreatePerms(emptyPermMap());
    setCreateError('');
  };

  const handleCreate = async () => {
    setCreateError('');
    if (!cf.name.trim() || !cf.username.trim()) {
      setCreateError('Name and username are required');
      return;
    }
    const permissions = toPermArray(createPerms);
    if (permissions.length === 0) {
      setCreateError('Select at least one module');
      return;
    }
    setCreating(true);
    try {
      await api.createStaffMember({
        name: cf.name.trim(),
        username: cf.username.trim(),
        email: cf.email.trim() || undefined,
        phone: cf.phone.trim() || undefined,
        permissions,
      });
      setShowCreate(false);
      resetCreate();
      showToast('success', 'Staff member created');
      load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to create staff';
      setCreateError(msg);
      showToast('error', msg);
    } finally {
      setCreating(false);
    }
  };

  const promptDeactivate = (s: StaffRow) => {
    setConfirm({
      open: true,
      title: `Deactivate "${s.name}"?`,
      message: 'Login will be disabled. Module permissions are preserved and can be restored later.',
      variant: 'warning',
      confirmLabel: 'Deactivate',
      action: async () => {
        await api.deactivateStaffMember(s.userId);
        showToast('success', `"${s.name}" deactivated`);
        load();
      },
    });
  };

  const promptReactivate = (s: StaffRow) => {
    setConfirm({
      open: true,
      title: `Reactivate "${s.name}"?`,
      message: 'Login and branch access will be restored with existing module permissions.',
      variant: 'default',
      confirmLabel: 'Reactivate',
      action: async () => {
        await api.reactivateStaffMember(s.userId);
        showToast('success', `"${s.name}" reactivated`);
        load();
      },
    });
  };

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-xl font-light text-warm-cream">Staff</h1>
          <p className="text-sm text-warm-muted">Manage staff accounts and module access.</p>
        </div>
        <button
          type="button"
          onClick={() => { resetCreate(); setShowCreate(true); }}
          className="flex items-center gap-1.5 rounded-lg bg-warm-accent px-4 py-2 text-sm font-medium text-[#1a1614] transition-colors hover:bg-[#b39a76]"
        >
          <Plus size={15} /> Add Staff
        </button>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
            placeholder="Search by name or username…"
            className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] py-2 pl-9 pr-3 text-sm text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent transition-colors"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-muted outline-none focus:border-warm-accent transition-colors"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button
          type="button"
          onClick={load}
          className="rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted transition-colors hover:text-warm-cream"
        >
          Search
        </button>
      </div>

      {loading && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-warm-card" />
          ))}
        </div>
      )}

      {!loading && staff.length === 0 && (
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-8 text-center">
          <UserPlus size={32} className="mx-auto mb-3 text-warm-muted" />
          <p className="text-sm text-warm-muted">No staff found.</p>
          <button
            type="button"
            onClick={() => { resetCreate(); setShowCreate(true); }}
            className="mt-4 text-xs text-warm-accent hover:underline"
          >
            Add your first staff member
          </button>
        </div>
      )}

      {!loading && staff.length > 0 && (
        <div className="space-y-3">
          {staff.map((s) => (
            <div
              key={s.userId}
              className="flex items-center justify-between rounded-xl border border-warm-card-border bg-warm-card p-4 transition-colors hover:bg-warm-card/80"
            >
              <button
                type="button"
                onClick={() => router.push(`/admin/staff/${s.userId}`)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
                  <Shield size={18} className="text-violet-400" />
                </div>
                <div className="min-w-0">
                  <p className="flex items-center gap-2 truncate text-sm font-medium text-warm-cream">
                    {s.name}
                    {s.username && (
                      <span className="text-[10px] font-normal text-warm-muted/60">@{s.username}</span>
                    )}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-warm-muted">
                    <span className="truncate">{formatModuleSummary(s.permissions)}</span>
                    <span className={`inline-flex items-center gap-1 ${
                      s.status === 'active' ? 'text-green-400' : 'text-warm-muted/50'
                    }`}>
                      <span className={`inline-block h-1.5 w-1.5 rounded-full ${s.status === 'active' ? 'bg-green-400' : 'bg-gray-500'}`} />
                      {s.status}
                    </span>
                  </p>
                </div>
              </button>
              <div className="ml-3 flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => router.push(`/admin/staff/${s.userId}`)}
                  className="rounded-lg p-1.5 text-warm-muted transition-colors hover:bg-warm-card-border/30 hover:text-warm-cream"
                  title="Edit access"
                >
                  <Edit3 size={14} />
                </button>
                {s.status === 'active' ? (
                  <button
                    type="button"
                    onClick={() => promptDeactivate(s)}
                    className="rounded-lg p-1.5 text-warm-muted transition-colors hover:bg-warm-card-border/30 hover:text-red/80"
                    title="Deactivate"
                  >
                    <Trash2 size={14} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => promptReactivate(s)}
                    className="rounded-lg p-1.5 text-warm-muted transition-colors hover:bg-warm-card-border/30 hover:text-green-400"
                    title="Reactivate"
                  >
                    <span className="text-[13px]">↻</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => router.push(`/admin/staff/${s.userId}`)}
                  className="rounded-lg p-1.5 text-warm-muted transition-colors hover:bg-warm-card-border/30 hover:text-warm-cream"
                  title="View details"
                >
                  <ExternalLink size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => { setShowCreate(false); resetCreate(); }}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-warm-card-border bg-[#24201e] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-medium text-warm-cream">Add Staff Member</h2>
              <button
                type="button"
                onClick={() => { setShowCreate(false); resetCreate(); }}
                className="text-warm-muted transition-colors hover:text-warm-cream"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Full Name" required>
                  <Input value={cf.name} onChange={(v) => setCf((p) => ({ ...p, name: v }))} placeholder="e.g. Ali Khan" />
                </Field>
                <Field label="Username" required>
                  <Input value={cf.username} onChange={(v) => setCf((p) => ({ ...p, username: v }))} placeholder="e.g. ali_fees" />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Email">
                  <Input value={cf.email} onChange={(v) => setCf((p) => ({ ...p, email: v }))} placeholder="optional" />
                </Field>
                <Field label="Phone">
                  <Input value={cf.phone} onChange={(v) => setCf((p) => ({ ...p, phone: v }))} placeholder="optional" />
                </Field>
              </div>

              <hr className="border-warm-card-border" />
              <p className="text-[10px] font-medium uppercase tracking-wider text-warm-muted">Module access</p>
              <PermissionMatrix value={createPerms} onChange={setCreatePerms} compact />
            </div>

            {createError && (
              <div className="mt-3 rounded-lg border border-red-900/30 bg-red-900/10 px-3 py-2">
                <p className="text-xs text-red-400">{createError}</p>
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setShowCreate(false); resetCreate(); }}
                className="rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted transition-colors hover:text-warm-cream"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating}
                className="rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] transition-colors hover:bg-[#b39a76] disabled:opacity-50"
              >
                {creating ? 'Creating…' : 'Create Staff'}
              </button>
            </div>
          </div>
        </div>
      )}

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
