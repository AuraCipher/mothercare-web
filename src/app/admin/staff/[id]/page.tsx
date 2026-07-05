'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft, Shield, Mail, Phone, User, Save, Edit3, X, Key, Copy, Check,
  Eye, EyeOff, RefreshCw, Send,
} from 'lucide-react';
import { api } from '@/lib/api';
import { showToast } from '@/components/toast';
import ConfirmModal from '@/components/confirm-modal';
import {
  PermissionMatrix,
  ModulePermissionsRead,
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
};

const fieldClass =
  'w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent';

function DetailRow({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ComponentType<{ size?: number; className?: string }> }) {
  return (
    <div className="rounded-lg border border-warm-card-border/50 bg-[#1a1614]/40 px-3 py-2.5">
      <p className="mb-0.5 flex items-center gap-1 text-[10px] uppercase tracking-wider text-warm-muted/60">
        {Icon && <Icon size={10} />} {label}
      </p>
      <p className="text-sm text-warm-cream">{value || '—'}</p>
    </div>
  );
}

export default function StaffDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const [data, setData] = useState<StaffDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const [profileEditing, setProfileEditing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [permsEditing, setPermsEditing] = useState(false);
  const [perms, setPerms] = useState(toPermRecord([]));
  const [savingPerms, setSavingPerms] = useState(false);

  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(true);
  const [showAdminPassPopup, setShowAdminPassPopup] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminPassError, setAdminPassError] = useState('');
  const [pendingSavePassword, setPendingSavePassword] = useState('');

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

  const cancelProfileEdit = () => {
    if (!data) return;
    setName(data.name);
    setEmail(data.email || '');
    setPhone(data.phone || '');
    setProfileEditing(false);
  };

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
      setProfileEditing(false);
      showToast('success', 'Profile updated');
    } catch (e: unknown) {
      showToast('error', e instanceof Error ? e.message : 'Update failed');
    } finally {
      setSavingProfile(false);
    }
  };

  const cancelPermsEdit = () => {
    if (!data) return;
    setPerms(toPermRecord(data.permissions));
    setPermsEditing(false);
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
      setPermsEditing(false);
      load();
    } catch (e: unknown) {
      showToast('error', e instanceof Error ? e.message : 'Update failed');
    } finally {
      setSavingPerms(false);
    }
  };

  const generatePassword = () => {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const digits = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const all = upper + lower + digits + special;
    let pw = '';
    pw += upper[Math.floor(Math.random() * upper.length)];
    pw += lower[Math.floor(Math.random() * lower.length)];
    pw += digits[Math.floor(Math.random() * digits.length)];
    pw += special[Math.floor(Math.random() * special.length)];
    for (let i = 0; i < 8; i++) pw += all[Math.floor(Math.random() * all.length)];
    const arr = pw.split('');
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setGeneratedPassword(arr.join(''));
    setPasswordSaved(false);
    setCopied(false);
    setTimeout(() => passwordInputRef.current?.focus(), 50);
  };

  const copyPassword = () => {
    if (!generatedPassword) return;
    navigator.clipboard.writeText(generatedPassword).then(() => {
      setCopied(true);
      showToast('success', 'Password copied');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSavePasswordClick = () => {
    if (!generatedPassword) return;
    setPendingSavePassword(generatedPassword);
    setShowAdminPassPopup(true);
    setAdminPassword('');
    setAdminPassError('');
  };

  const handleAdminPassVerify = async () => {
    if (!adminPassword.trim()) {
      setAdminPassError('Enter your password to confirm');
      return;
    }
    if (!pendingSavePassword) {
      setAdminPassError('No password generated');
      return;
    }
    try {
      await api.setStaffPassword(userId, pendingSavePassword, adminPassword);
      setShowAdminPassPopup(false);
      setAdminPassword('');
      setAdminPassError('');
      setGeneratedPassword('');
      setPendingSavePassword('');
      setPasswordSaved(true);
      setShowPassword(false);
      showToast('success', 'Password saved successfully');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to save password';
      if (msg.includes('incorrect')) {
        setAdminPassError('Your password is incorrect. Try again.');
      } else if (msg.includes('used recently')) {
        setAdminPassError('This password was used before. Generate a different one.');
      } else {
        setAdminPassError(msg);
      }
      showToast('error', msg);
    }
  };

  const handleSendCredential = async () => {
    try {
      const res = await api.sendStaffCredentials(userId);
      if (res.success) {
        showToast('success', 'Credentials sent via WhatsApp');
        setPasswordSaved(true);
        setGeneratedPassword('');
      } else {
        showToast('error', (res as { message?: string }).message || 'Failed to send');
      }
    } catch (e: unknown) {
      showToast('error', e instanceof Error ? e.message : 'Failed to send');
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

      {/* Profile */}
      <section className="mb-6 rounded-xl border border-warm-card-border bg-warm-card/30 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-medium text-warm-cream">
            <User size={15} /> Profile
          </h2>
          {!profileEditing ? (
            <button
              type="button"
              onClick={() => setProfileEditing(true)}
              className="flex items-center gap-1 rounded-lg border border-warm-card-border px-2.5 py-1 text-xs text-warm-muted hover:text-warm-cream"
            >
              <Edit3 size={12} /> Edit
            </button>
          ) : (
            <button
              type="button"
              onClick={cancelProfileEdit}
              className="flex items-center gap-1 text-xs text-warm-muted hover:text-warm-cream"
            >
              <X size={12} /> Cancel
            </button>
          )}
        </div>

        {profileEditing ? (
          <>
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
                <label className="mb-1 block text-[10px] uppercase text-warm-muted/60">Email</label>
                <input className={fieldClass} value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase text-warm-muted/60">Phone</label>
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
          </>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailRow label="Full name" value={data.name} icon={User} />
            <DetailRow label="Username" value={data.username || ''} />
            <DetailRow label="Email" value={data.email || ''} icon={Mail} />
            <DetailRow label="Phone" value={data.phone || ''} icon={Phone} />
          </div>
        )}
      </section>

      {/* Module access */}
      <section className="mb-6 rounded-xl border border-warm-card-border bg-warm-card/30 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-warm-cream">Module access</h2>
            <p className="mt-0.5 text-xs text-warm-muted">Read is always on for selected modules.</p>
          </div>
          {!permsEditing ? (
            <button
              type="button"
              onClick={() => setPermsEditing(true)}
              className="flex items-center gap-1 rounded-lg border border-warm-card-border px-2.5 py-1 text-xs text-warm-muted hover:text-warm-cream"
            >
              <Edit3 size={12} /> Edit
            </button>
          ) : (
            <button
              type="button"
              onClick={cancelPermsEdit}
              className="flex items-center gap-1 text-xs text-warm-muted hover:text-warm-cream"
            >
              <X size={12} /> Cancel
            </button>
          )}
        </div>

        {permsEditing ? (
          <>
            <PermissionMatrix value={perms} onChange={setPerms} />
            <button
              type="button"
              disabled={savingPerms}
              onClick={savePermissions}
              className="mt-4 flex items-center gap-1.5 rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] disabled:opacity-50"
            >
              <Save size={13} /> {savingPerms ? 'Saving…' : 'Save module access'}
            </button>
          </>
        ) : (
          <ModulePermissionsRead permissions={data.permissions} />
        )}
      </section>

      {/* Login credentials */}
      <section className="rounded-xl border border-warm-card-border bg-warm-card/30 p-5">
        <h2 className="mb-4 text-sm font-medium text-warm-cream">Login Credentials</h2>
        <div className="mb-4">
          <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-warm-muted">Username</p>
          <div className="flex items-center gap-2 rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2.5">
            <User size={14} className="shrink-0 text-warm-muted" />
            <span className="font-mono text-sm text-warm-cream">{data.username || '—'}</span>
          </div>
        </div>
        <div>
          <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-warm-muted">Password</p>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1">
              <input
                ref={passwordInputRef}
                type={showPassword ? 'text' : 'password'}
                value={generatedPassword}
                readOnly
                placeholder={passwordSaved ? '••••••••••••' : ''}
                className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] py-2.5 pl-9 pr-9 font-mono text-sm text-warm-cream outline-none placeholder:text-warm-muted/30 focus:border-warm-accent"
              />
              <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-muted" />
              {generatedPassword && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-muted hover:text-warm-cream"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              )}
            </div>
            {generatedPassword && (
              <button
                type="button"
                onClick={copyPassword}
                className="flex items-center gap-1.5 rounded-lg border border-warm-card-border px-3 py-2.5 text-xs text-warm-muted hover:border-warm-accent/50 hover:text-warm-cream"
              >
                {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            )}
            <button
              type="button"
              onClick={generatePassword}
              className="flex items-center gap-1.5 rounded-lg bg-warm-accent px-3 py-2.5 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76]"
            >
              <RefreshCw size={14} /> Generate
            </button>
          </div>
          {generatedPassword && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSavePasswordClick}
                className="flex items-center gap-1.5 rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76]"
              >
                <Save size={13} /> Save
              </button>
              <button
                type="button"
                onClick={handleSendCredential}
                disabled={!data.phone}
                title={!data.phone ? 'Add phone number in profile first' : undefined}
                className="flex items-center gap-1.5 rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream disabled:opacity-40"
              >
                <Send size={13} /> Send via WhatsApp
              </button>
            </div>
          )}
          {!data.phone && (
            <p className="mt-2 text-[11px] text-amber-400/80">Add a phone number in profile to send credentials.</p>
          )}
        </div>
      </section>

      {showAdminPassPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setShowAdminPassPopup(false)}>
          <div className="w-full max-w-sm rounded-xl border border-warm-card-border bg-[#24201e] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-2 text-sm font-medium text-warm-cream">Confirm password save</h3>
            <p className="mb-4 text-xs text-warm-muted">Enter your own password to confirm saving this staff member&apos;s new credentials.</p>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => { setAdminPassword(e.target.value); setAdminPassError(''); }}
              placeholder="Your password"
              autoFocus
              className={fieldClass}
              onKeyDown={(e) => e.key === 'Enter' && handleAdminPassVerify()}
            />
            {adminPassError && <p className="mt-2 text-xs text-red-400">{adminPassError}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setShowAdminPassPopup(false)} className="rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted">Cancel</button>
              <button type="button" onClick={handleAdminPassVerify} className="rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614]">Confirm</button>
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
