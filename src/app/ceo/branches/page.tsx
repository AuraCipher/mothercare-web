'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Plus, MapPin, Users, ArrowRight, Building2, X, Edit3, Trash2, ExternalLink } from 'lucide-react';
import { showToast } from '@/components/toast';
import ConfirmModal from '@/components/confirm-modal';

interface Branch {
  id: string; name: string; code: string; address?: string; phone?: string; email?: string;
  isActive: boolean; createdAt: string;
  _count?: { academicYears: number; branchMembers: number };
}

export default function CeoBranches() {
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  // Create modal state
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createCode, setCreateCode] = useState('');
  const [createAddress, setCreateAddress] = useState('');
  const [createPhone, setCreatePhone] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  // Edit modal state
  const [showEdit, setShowEdit] = useState(false);
  const [editId, setEditId] = useState('');
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editError, setEditError] = useState('');
  const [updating, setUpdating] = useState(false);

  // Confirm modal (deactivate)
  const [confirm, setConfirm] = useState<{
    open: boolean; title: string; message: string;
    variant: 'danger' | 'warning' | 'default';
    confirmLabel: string; action: () => Promise<void>;
  }>({ open: false, title: '', message: '', variant: 'default', confirmLabel: 'Confirm', action: async () => {} });

  useEffect(() => { loadBranches(); }, []);

  const loadBranches = () => {
    api.getBranches().then(d => {
      if (d.success) setBranches(d.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  const resetCreateForm = () => {
    setCreateName(''); setCreateCode(''); setCreateAddress('');
    setCreatePhone(''); setCreateEmail(''); setCreateError('');
  };

  const handleCreate = async () => {
    setCreateError('');
    if (!createName.trim() || !createCode.trim()) {
      setCreateError('Name and code are required'); return;
    }
    setCreating(true);
    try {
      await api.createBranch({
        name: createName.trim(), code: createCode.trim().toUpperCase(),
        address: createAddress.trim() || undefined,
        phone: createPhone.trim() || undefined,
        email: createEmail.trim() || undefined,
      });
      setShowCreate(false); resetCreateForm();
      showToast('success', 'Branch created successfully');
      loadBranches();
    } catch (e: any) {
      setCreateError(e.message || 'Failed to create branch');
    } finally { setCreating(false); }
  };

  const openEdit = (branch: Branch) => {
    setEditId(branch.id); setEditName(branch.name);
    setEditAddress(branch.address || ''); setEditPhone(branch.phone || '');
    setEditEmail(branch.email || ''); setEditError(''); setShowEdit(true);
  };

  const handleUpdate = async () => {
    setEditError('');
    if (!editName.trim()) { setEditError('Branch name cannot be empty'); return; }
    setUpdating(true);
    try {
      await api.updateBranch(editId, {
        name: editName.trim(),
        address: editAddress.trim() || undefined,
        phone: editPhone.trim() || undefined,
        email: editEmail.trim() || undefined,
      });
      setShowEdit(false); showToast('success', 'Branch updated');
      loadBranches();
    } catch (e: any) {
      setEditError(e.message || 'Failed to update branch');
    } finally { setUpdating(false); }
  };

  const promptDeactivate = (branch: Branch) => {
    const hasData = (branch._count?.academicYears ?? 0) > 0 || (branch._count?.branchMembers ?? 0) > 0;
    setConfirm({
      open: true,
      title: hasData ? 'Archive Branch?' : 'Delete Branch?',
      message: hasData
        ? `"${branch.name}" has ${branch._count!.academicYears} academic year(s) and ${branch._count!.branchMembers} member(s). It will be archived — data preserved but branch hidden.`
        : `"${branch.name}" has no linked data. It will be permanently deleted.`,
      variant: hasData ? 'warning' : 'danger',
      confirmLabel: hasData ? 'Archive Branch' : 'Delete Permanently',
      action: async () => {
        try {
          const res = await api.deactivateBranch(branch.id) as any;
          showToast('success', res?.message || (hasData ? 'Branch archived' : 'Branch deleted'));
          loadBranches();
        } catch (e: any) {
          showToast('error', e.message || 'Failed to remove branch');
        }
      },
    });
  };

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-xl font-light text-warm-cream">Branches</h1>
          <p className="text-sm text-warm-muted">All school campuses managed by you.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 rounded-lg bg-warm-accent px-4 py-2 text-sm font-medium text-[#1a1614] transition-colors hover:bg-[#b39a76]">
          <Plus size={15} /> Add Branch
        </button>
      </div>

      {loading && <p className="text-sm text-warm-muted">Loading…</p>}

      {!loading && branches.length === 0 && (
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-8 text-center">
          <MapPin size={28} className="mx-auto mb-3 text-warm-muted" />
          <p className="text-sm text-warm-muted">No branches yet.</p>
        </div>
      )}

      <div className="space-y-3">
        {branches.map(b => (
          <div key={b.id} className="flex items-center justify-between rounded-xl border border-warm-card-border bg-warm-card p-4 transition-colors hover:bg-warm-card/80">
            <button onClick={() => router.push(`/ceo/branches/${b.id}`)} className="flex items-center gap-3 min-w-0 flex-1 text-left">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warm-accent/10 shrink-0">
                <Building2 size={18} className="text-warm-accent" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-warm-cream truncate">{b.name}</p>
                <p className="text-xs text-warm-muted truncate">{b.code}{b.address ? ` · ${b.address}` : ''}</p>
              </div>
            </button>
            <div className="flex items-center gap-2 shrink-0 ml-3">
              <span className="hidden text-xs text-warm-muted md:block">{b._count?.branchMembers ?? '—'} staff</span>
              <button onClick={() => openEdit(b)} className="rounded-lg p-1.5 text-warm-muted hover:text-warm-cream hover:bg-warm-card-border/30 transition-colors" title="Edit branch">
                <Edit3 size={14} />
              </button>
              <button onClick={() => promptDeactivate(b)} className="rounded-lg p-1.5 text-warm-muted hover:text-red/80 hover:bg-warm-card-border/30 transition-colors" title="Deactivate branch">
                <Trash2 size={14} />
              </button>
              <button onClick={() => router.push(`/ceo/branches/${b.id}`)} className="rounded-lg p-1.5 text-warm-muted hover:text-warm-cream hover:bg-warm-card-border/30 transition-colors" title="View details">
                <ExternalLink size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Create Modal ──────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => { setShowCreate(false); resetCreateForm(); }}>
          <div className="w-full max-w-md rounded-xl border border-warm-card-border bg-[#24201e] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-warm-cream">Add Branch</h2>
              <button onClick={() => { setShowCreate(false); resetCreateForm(); }} className="text-warm-muted hover:text-warm-cream transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-warm-muted">Branch Name *</label>
                  <input value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="e.g. Mother Care Sohan" className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent transition-colors" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-warm-muted">Branch Code *</label>
                  <input value={createCode} onChange={(e) => setCreateCode(e.target.value)} placeholder="e.g. MCS-SOHAN" className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent transition-colors uppercase" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-warm-muted">Address</label>
                <input value={createAddress} onChange={(e) => setCreateAddress(e.target.value)} placeholder="e.g. Sohan, Islamabad" className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-warm-muted">Phone</label>
                  <input value={createPhone} onChange={(e) => setCreatePhone(e.target.value)} placeholder="e.g. +92 300 1234567" className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent transition-colors" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-warm-muted">Email</label>
                  <input value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} placeholder="e.g. sohan@mothercare.edu" className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent transition-colors" />
                </div>
              </div>
            </div>
            {createError && <div className="mt-3 rounded-lg border border-red-900/30 bg-red-900/10 px-3 py-2"><p className="text-xs text-red-400">{createError}</p></div>}
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => { setShowCreate(false); resetCreateForm(); }} className="rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream transition-colors">Cancel</button>
              <button onClick={handleCreate} disabled={creating} className="rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] disabled:opacity-50 transition-colors">
                {creating ? 'Creating…' : 'Create Branch'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ──────────────────────────────── */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setShowEdit(false)}>
          <div className="w-full max-w-md rounded-xl border border-warm-card-border bg-[#24201e] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-warm-cream">Edit Branch</h2>
              <button onClick={() => setShowEdit(false)} className="text-warm-muted hover:text-warm-cream transition-colors"><X size={16} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs text-warm-muted">Branch Name</label>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent transition-colors" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-warm-muted">Address</label>
                <input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-warm-muted">Phone</label>
                  <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent transition-colors" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-warm-muted">Email</label>
                  <input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent transition-colors" />
                </div>
              </div>
            </div>
            {editError && <div className="mt-3 rounded-lg border border-red-900/30 bg-red-900/10 px-3 py-2"><p className="text-xs text-red-400">{editError}</p></div>}
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setShowEdit(false)} className="rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream transition-colors">Cancel</button>
              <button onClick={handleUpdate} disabled={updating} className="rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] disabled:opacity-50 transition-colors">
                {updating ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Modal ──────────────────────────────── */}
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
