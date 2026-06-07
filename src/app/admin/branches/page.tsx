'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Plus, Building2, MapPin, Phone, ExternalLink, Trash2, Edit3 } from 'lucide-react';

interface Branch {
  id: string;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  _count?: { academicYears: number; branchMembers: number };
}

export default function BranchesPage() {
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      const data = await api.getBranches();
      setBranches(data.data || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load branches');
    } finally {
      setLoading(false);
    }
  };

  // ─── Create ──────────────────────────────────────────────────

  const handleCreate = async () => {
    setCreateError('');
    if (!createName.trim() || !createCode.trim()) {
      setCreateError('Name and code are required');
      return;
    }
    setCreating(true);
    try {
      await api.createBranch({
        name: createName.trim(),
        code: createCode.trim().toUpperCase(),
        address: createAddress.trim() || undefined,
        phone: createPhone.trim() || undefined,
        email: createEmail.trim() || undefined,
      });
      setShowCreate(false);
      resetCreateForm();
      loadBranches();
    } catch (e: any) {
      setCreateError(e.message || 'Failed to create branch');
    } finally {
      setCreating(false);
    }
  };

  const resetCreateForm = () => {
    setCreateName('');
    setCreateCode('');
    setCreateAddress('');
    setCreatePhone('');
    setCreateEmail('');
    setCreateError('');
  };

  // ─── Edit ────────────────────────────────────────────────────

  const openEdit = (branch: Branch) => {
    setEditId(branch.id);
    setEditName(branch.name);
    setEditAddress(branch.address || '');
    setEditPhone(branch.phone || '');
    setEditEmail(branch.email || '');
    setEditError('');
    setShowEdit(true);
  };

  const handleUpdate = async () => {
    setEditError('');
    if (!editName.trim()) {
      setEditError('Branch name cannot be empty');
      return;
    }
    setUpdating(true);
    try {
      await api.updateBranch(editId, {
        name: editName.trim(),
        address: editAddress.trim() || undefined,
        phone: editPhone.trim() || undefined,
        email: editEmail.trim() || undefined,
      });
      setShowEdit(false);
      loadBranches();
    } catch (e: any) {
      setEditError(e.message || 'Failed to update branch');
    } finally {
      setUpdating(false);
    }
  };

  // ─── Deactivate ──────────────────────────────────────────────

  const handleDeactivate = async (branch: Branch) => {
    const msg = `Deactivate "${branch.name}"?\nThis will mark the branch as inactive. ${branch._count && branch._count.academicYears > 0 ? 'It has active academic years.' : ''}`;
    if (!confirm(msg)) return;
    try {
      await api.deactivateBranch(branch.id);
      loadBranches();
    } catch (e: any) {
      alert(e.message || 'Failed to deactivate');
    }
  };

  // ─── Render ──────────────────────────────────────────────────

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8 h-6 w-32 rounded bg-warm-card animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-warm-card animate-pulse" />
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-light text-warm-cream">Branches</h1>
          <p className="text-sm text-warm-muted">Manage school campuses and locations.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 rounded-lg bg-warm-accent px-3.5 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] transition-colors"
        >
          <Plus size={14} /> Add Branch
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-warm-card-border bg-warm-card px-4 py-2 text-xs text-[#b39a76]">{error}</p>
      )}

      {/* Branch list */}
      {branches.length === 0 ? (
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-12 text-center">
          <Building2 size={32} className="mx-auto mb-3 text-warm-accent/50" />
          <p className="text-sm text-warm-muted">No branches yet.</p>
          <p className="mb-4 text-xs text-warm-muted/60">Create your first school branch to get started.</p>
          <button onClick={() => setShowCreate(true)} className="text-xs text-warm-accent hover:text-[#b39a76] transition-colors">
            Create your first branch
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {branches.map((branch) => (
            <div
              key={branch.id}
              className="rounded-xl border border-warm-card-border bg-warm-card p-4 transition-colors hover:bg-warm-card/80"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 size={15} className="text-warm-accent shrink-0" />
                    <span className="text-sm font-medium text-warm-cream truncate">{branch.name}</span>
                    <span className="text-[10px] font-mono text-warm-muted/50 uppercase">{branch.code}</span>
                    {branch.isActive ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-900/30 px-2 py-0.5 text-[10px] text-green-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-700/30 px-2 py-0.5 text-[10px] text-gray-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                        Inactive
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-warm-muted/70">
                    {branch.address && (
                      <span className="flex items-center gap-1">
                        <MapPin size={11} /> {branch.address}
                      </span>
                    )}
                    {branch.phone && (
                      <span className="flex items-center gap-1">
                        <Phone size={11} /> {branch.phone}
                      </span>
                    )}
                    {branch._count && (
                      <span>{branch._count.academicYears} academic year{branch._count.academicYears !== 1 ? 's' : ''}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-4 shrink-0">
                  <button
                    onClick={() => router.push(`/admin/branches/${branch.id}`)}
                    className="rounded-lg p-2 text-warm-muted hover:text-warm-cream hover:bg-warm-card-border/30 transition-colors"
                    title="View details"
                  >
                    <ExternalLink size={14} />
                  </button>
                  <button
                    onClick={() => openEdit(branch)}
                    className="rounded-lg p-2 text-warm-muted hover:text-warm-cream hover:bg-warm-card-border/30 transition-colors"
                    title="Edit branch"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => handleDeactivate(branch)}
                    className="rounded-lg p-2 text-warm-muted hover:text-red/80 hover:bg-warm-card-border/30 transition-colors"
                    title="Deactivate branch"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create Modal ──────────────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => { setShowCreate(false); resetCreateForm(); }}>
          <div className="w-full max-w-md rounded-xl border border-warm-card-border bg-[#24201e] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-sm font-medium text-warm-cream">Add Branch</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-warm-muted">Branch Name *</label>
                  <input value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="e.g. Mother Care Sohan" className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-warm-muted">Branch Code *</label>
                  <input value={createCode} onChange={(e) => setCreateCode(e.target.value)} placeholder="e.g. MCS-SOHAN" className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent uppercase" />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs text-warm-muted">Address</label>
                <input value={createAddress} onChange={(e) => setCreateAddress(e.target.value)} placeholder="e.g. Sohan, Islamabad" className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-warm-muted">Phone</label>
                  <input value={createPhone} onChange={(e) => setCreatePhone(e.target.value)} placeholder="e.g. +92 300 1234567" className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-warm-muted">Email</label>
                  <input value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} placeholder="e.g. sohan@mothercare.edu" className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent" />
                </div>
              </div>
            </div>

            {createError && <p className="mt-3 text-xs text-[#b39a76]">{createError}</p>}

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => { setShowCreate(false); resetCreateForm(); }} className="rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream transition-colors">Cancel</button>
              <button onClick={handleCreate} disabled={creating} className="rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] disabled:opacity-50 transition-colors">
                {creating ? 'Creating…' : 'Create Branch'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ────────────────────────────────────────── */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setShowEdit(false)}>
          <div className="w-full max-w-md rounded-xl border border-warm-card-border bg-[#24201e] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-sm font-medium text-warm-cream">Edit Branch</h2>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs text-warm-muted">Branch Name</label>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent" />
              </div>

              <div>
                <label className="mb-1 block text-xs text-warm-muted">Address</label>
                <input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-warm-muted">Phone</label>
                  <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-warm-muted">Email</label>
                  <input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent" />
                </div>
              </div>
            </div>

            {editError && <p className="mt-3 text-xs text-[#b39a76]">{editError}</p>}

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setShowEdit(false)} className="rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream transition-colors">Cancel</button>
              <button onClick={handleUpdate} disabled={updating} className="rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] disabled:opacity-50 transition-colors">
                {updating ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
