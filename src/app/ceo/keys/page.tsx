'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import {
  Key, Plus, Copy, Trash2, X, Check, Eye, EyeOff, Globe, MapPin,
} from 'lucide-react';
import ConfirmModal from '@/components/confirm-modal';
import { showToast } from '@/components/toast';

interface ApiKey {
  id: string;
  name: string;
  type: 'publishable' | 'secret';
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

interface Branch {
  id: string;
  name: string;
  code: string;
}

/** Extract the branch code from a key prefix.
 *  Format: pk_mcs_{branchCode}_{hash} or sk_mcs_{branchCode}_{hash}
 *  Returns "global" for global keys, or the branch code for scoped keys.
 */
function extractScopeFromPrefix(prefix: string): string {
  const parts = prefix.split('_');
  // parts[0] = "pk" or "sk"
  // parts[1] = "mcs"
  // parts[2] = branchCode
  return parts.length >= 3 ? parts[2] : 'global';
}

export default function CeoApiKeys() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Branches for scope dropdown
  const [branches, setBranches] = useState<Branch[]>([]);

  // Create modal state
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createType, setCreateType] = useState<'publishable' | 'secret'>('publishable');
  const [createScope, setCreateScope] = useState<'global' | 'branch'>('global');
  const [createBranchId, setCreateBranchId] = useState('');
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  // New key reveal modal (one-time after creation)
  const [revealedKey, setRevealedKey] = useState<{ name: string; key: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Revoke confirm modal
  const [confirm, setConfirm] = useState<{
    open: boolean; title: string; message: string;
    variant: 'danger' | 'warning' | 'default';
    confirmLabel: string; action: () => Promise<void>;
  }>({ open: false, title: '', message: '', variant: 'default', confirmLabel: 'Confirm', action: async () => {} });

  const loadKeys = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const d = await api.getApiKeys();
      if (d.success) setKeys(d.data || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadBranches = useCallback(async () => {
    try {
      const d = await api.getBranches();
      if (d.success) setBranches(d.data || []);
    } catch {}
  }, []);

  useEffect(() => { loadKeys(); loadBranches(); }, [loadKeys, loadBranches]);

  // Build a branch-code → branch-name lookup
  const branchNameByCode = Object.fromEntries(
    branches.map(b => [b.code, b.name]),
  );

  // ─── Create ──────────────────────────────────────────

  const resetCreateForm = () => {
    setCreateName('');
    setCreateType('publishable');
    setCreateScope('global');
    setCreateBranchId('');
    setCreateError('');
  };

  const handleCreate = async () => {
    setCreateError('');
    if (!createName.trim()) {
      setCreateError('Key name is required');
      return;
    }
    if (createScope === 'branch' && !createBranchId) {
      setCreateError('Please select a branch');
      return;
    }

    setCreating(true);
    try {
      const selectedBranch = branches.find(b => b.id === createBranchId);
      const d = await api.createApiKey({
        name: createName.trim(),
        type: createType,
        branchCode: createScope === 'branch' && selectedBranch ? selectedBranch.code : undefined,
      });
      setShowCreate(false);
      resetCreateForm();
      showToast('success', 'API key created');
      // Reveal the full key (shown once)
      if (d.key) {
        setRevealedKey({ name: d.key.name || createName.trim(), key: d.key.key });
      }
      loadKeys();
    } catch (e: any) {
      setCreateError(e.message || 'Failed to create API key');
    } finally {
      setCreating(false);
    }
  };

  // ─── Revoke ──────────────────────────────────────────

  const promptRevoke = (key: ApiKey) => {
    setConfirm({
      open: true,
      title: 'Revoke API Key?',
      message: `"${key.name}" (${key.prefix}…) will be permanently disabled. This cannot be undone.`,
      variant: 'danger',
      confirmLabel: 'Revoke Key',
      action: async () => {
        try {
          await api.revokeApiKey(key.id);
          showToast('success', 'API key revoked');
          loadKeys();
        } catch (e: any) {
          showToast('error', e.message || 'Failed to revoke key');
        }
      },
    });
  };

  // ─── Copy ────────────────────────────────────────────

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const activeKeys = keys.filter(k => !k.revokedAt);
  const revokedKeys = keys.filter(k => k.revokedAt);

  // ─── Render ──────────────────────────────────────────

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-6 h-6 w-40 rounded bg-warm-card animate-pulse" />
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-warm-card animate-pulse" />
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
          <h1 className="mb-1 text-xl font-light text-warm-cream">API Keys</h1>
          <p className="text-sm text-warm-muted">
            Manage publishable and secret API keys for integrations.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 rounded-lg bg-warm-accent px-3.5 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] transition-colors"
        >
          <Plus size={14} /> Create Key
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-warm-card-border bg-warm-card px-4 py-2 text-xs text-[#b39a76]">{error}</p>
      )}

      {/* Active keys */}
      {activeKeys.length === 0 ? (
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-12 text-center">
          <Key size={32} className="mx-auto mb-3 text-warm-accent/50" />
          <p className="text-sm text-warm-muted">No API keys yet.</p>
          <p className="mb-4 text-xs text-warm-muted/60">
            Create a key to allow third-party integrations with your school data.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="text-xs text-warm-accent hover:text-[#b39a76] transition-colors"
          >
            Create your first API key
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {activeKeys.map((key) => {
            const scopeCode = extractScopeFromPrefix(key.prefix);
            const isGlobal = scopeCode === 'global';
            const branchName = branchNameByCode[scopeCode];
            return (
              <div
                key={key.id}
                className="flex items-center justify-between rounded-xl border border-warm-card-border bg-warm-card p-4 transition-colors hover:bg-warm-card/80"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warm-accent/10 shrink-0">
                    <Key size={15} className="text-warm-accent" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-warm-cream truncate">{key.name}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-warm-muted">
                      <span className="font-mono text-[11px]">{key.prefix}…</span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        key.type === 'publishable'
                          ? 'bg-blue-900/30 text-blue-400'
                          : 'bg-amber-900/30 text-amber-400'
                      }`}>
                        {key.type}
                      </span>
                      {/* Scope badge */}
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        isGlobal
                          ? 'bg-purple-900/30 text-purple-400'
                          : 'bg-emerald-900/30 text-emerald-400'
                      }`}>
                        {isGlobal ? <Globe size={10} /> : <MapPin size={10} />}
                        {isGlobal ? 'Global' : (branchName || scopeCode)}
                      </span>
                      <span>Created {new Date(key.createdAt).toLocaleDateString()}</span>
                      {key.lastUsedAt && <span>Last used {new Date(key.lastUsedAt).toLocaleDateString()}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-4 shrink-0">
                  <button
                    onClick={() => promptRevoke(key)}
                    className="rounded-lg p-2 text-warm-muted hover:text-red/80 hover:bg-warm-card-border/30 transition-colors"
                    title="Revoke key"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Revoked keys (collapsed) */}
      {revokedKeys.length > 0 && (
        <details className="mt-6">
          <summary className="cursor-pointer text-xs text-warm-muted hover:text-warm-cream transition-colors">
            Revoked keys ({revokedKeys.length})
          </summary>
          <div className="mt-3 space-y-2">
            {revokedKeys.map((key) => (
              <div key={key.id} className="flex items-center gap-3 rounded-lg border border-warm-card-border bg-warm-card/50 p-3 opacity-60">
                <Key size={13} className="text-warm-muted shrink-0" />
                <span className="text-xs text-warm-muted line-through">{key.name}</span>
                <span className="text-[10px] font-mono text-warm-muted/50">{key.prefix}…</span>
                <span className="text-[10px] text-warm-muted/50">Revoked</span>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* ── Create Modal ──────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => { setShowCreate(false); resetCreateForm(); }}>
          <div className="w-full max-w-md rounded-xl border border-warm-card-border bg-[#24201e] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-warm-cream">Create API Key</h2>
              <button onClick={() => { setShowCreate(false); resetCreateForm(); }} className="text-warm-muted hover:text-warm-cream transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs text-warm-muted">Key Name *</label>
                <input
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g. Production Frontend"
                  className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent transition-colors"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-warm-muted">Key Type *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setCreateType('publishable')}
                    className={`rounded-lg border px-3 py-2 text-xs transition-colors ${
                      createType === 'publishable'
                        ? 'border-warm-accent bg-warm-accent/10 text-warm-accent'
                        : 'border-warm-card-border text-warm-muted hover:text-warm-cream'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <Eye size={14} />
                      <span className="font-medium">Publishable</span>
                      <span className="text-[10px] opacity-70">Client-side use</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setCreateType('secret')}
                    className={`rounded-lg border px-3 py-2 text-xs transition-colors ${
                      createType === 'secret'
                        ? 'border-warm-accent bg-warm-accent/10 text-warm-accent'
                        : 'border-warm-card-border text-warm-muted hover:text-warm-cream'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <EyeOff size={14} />
                      <span className="font-medium">Secret</span>
                      <span className="text-[10px] opacity-70">Server-side use</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Scope selector */}
              <div>
                <label className="mb-1 block text-xs text-warm-muted">Scope *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { setCreateScope('global'); setCreateBranchId(''); }}
                    className={`rounded-lg border px-3 py-2 text-xs transition-colors ${
                      createScope === 'global'
                        ? 'border-warm-accent bg-warm-accent/10 text-warm-accent'
                        : 'border-warm-card-border text-warm-muted hover:text-warm-cream'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <Globe size={14} />
                      <span className="font-medium">Global</span>
                      <span className="text-[10px] opacity-70">All branches</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setCreateScope('branch')}
                    className={`rounded-lg border px-3 py-2 text-xs transition-colors ${
                      createScope === 'branch'
                        ? 'border-warm-accent bg-warm-accent/10 text-warm-accent'
                        : 'border-warm-card-border text-warm-muted hover:text-warm-cream'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <MapPin size={14} />
                      <span className="font-medium">Branch</span>
                      <span className="text-[10px] opacity-70">Single branch</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Branch dropdown (only when scope=branch) */}
              {createScope === 'branch' && (
                <div>
                  <label className="mb-1 block text-xs text-warm-muted">Select Branch *</label>
                  <select
                    value={createBranchId}
                    onChange={(e) => setCreateBranchId(e.target.value)}
                    className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent transition-colors"
                  >
                    <option value="">Select a branch…</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {createError && (
              <div className="mt-3 rounded-lg border border-red-900/30 bg-red-900/10 px-3 py-2">
                <p className="text-xs text-red-400">{createError}</p>
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => { setShowCreate(false); resetCreateForm(); }} className="rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream transition-colors">
                Cancel
              </button>
              <button onClick={handleCreate} disabled={creating} className="rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] disabled:opacity-50 transition-colors">
                {creating ? 'Creating…' : 'Create Key'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Key Reveal Modal (one-time) ──────────────── */}
      {revealedKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setRevealedKey(null)}>
          <div className="w-full max-w-lg rounded-xl border border-warm-card-border bg-[#24201e] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-warm-cream">API Key Created</h2>
              <button onClick={() => setRevealedKey(null)} className="text-warm-muted hover:text-warm-cream transition-colors">
                <X size={16} />
              </button>
            </div>

            <p className="mb-1 text-xs text-warm-muted">
              Copy this key now. <span className="font-medium text-amber-400">It will not be shown again.</span>
            </p>
            <p className="mb-4 text-xs text-warm-muted/60">
              Key: {revealedKey.name}
            </p>

            <div className="relative">
              <div className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-4 py-3 text-sm font-mono text-warm-cream break-all select-all">
                {revealedKey.key}
              </div>
              <button
                onClick={() => handleCopy(revealedKey.key)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-warm-muted hover:text-warm-cream hover:bg-warm-card transition-colors"
                title="Copy to clipboard"
              >
                {copied ? <Check size={15} className="text-green-400" /> : <Copy size={15} />}
              </button>
            </div>

            <div className="mt-5 flex justify-end">
              <button onClick={() => { setRevealedKey(null); setCopied(false); }} className="rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] transition-colors">
                I&apos;ve saved the key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Modal (revoke) ──────────────────────── */}
      <ConfirmModal
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        variant={confirm.variant}
        confirmLabel={confirm.confirmLabel}
        onConfirm={async () => {
          await confirm.action();
          setConfirm(prev => ({ ...prev, open: false }));
        }}
        onCancel={() => setConfirm(prev => ({ ...prev, open: false }))}
      />
    </main>
  );
}
