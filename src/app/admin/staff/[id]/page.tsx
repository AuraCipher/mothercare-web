'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft, Shield, Mail, Phone, User, Save, Edit3, X, Key, Copy, Check,
  Eye, EyeOff, RefreshCw, Send, Award, BookOpen, Calendar, MapPin, DollarSign,
  Heart, CreditCard, AlertTriangle, Briefcase, FileText,
} from 'lucide-react';
import { api } from '@/lib/api';
import config from '@/config';
import { showToast } from '@/components/toast';
import ConfirmModal from '@/components/confirm-modal';
import AvatarImage from '@/components/avatar-image';
import ProfileOptionMenu, { viewPhotoItem, uploadNewItem } from '@/components/profile-option-menu';
import Lightbox from '@/components/lightbox';
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
  profilePhotoId?: string | null;
  employeeId?: string | null;
  qualification?: string | null;
  specialization?: string | null;
  joiningDate?: string | null;
  salary?: number | null;
  emergencyContact?: string | null;
  address?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  bloodGroup?: string | null;
  fatherName?: string | null;
  cardId?: string | null;
  severeDisease?: string | null;
  experience?: string | null;
  bio?: string | null;
};

type ProfileForm = {
  name: string;
  email: string;
  phone: string;
  employeeId: string;
  fatherName: string;
  qualification: string;
  specialization: string;
  joiningDate: string;
  dateOfBirth: string;
  address: string;
  salary: string;
  gender: string;
  bloodGroup: string;
  emergencyContact: string;
  cardId: string;
  severeDisease: string;
  experience: string;
  bio: string;
};

const fieldClass =
  'w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent';

function fmtDate(v?: string | null) {
  if (!v) return '—';
  return new Date(v).toLocaleDateString();
}

function toInputDate(v?: string | null) {
  if (!v) return '';
  return new Date(v).toISOString().slice(0, 10);
}

function detailFromData(d: StaffDetail): ProfileForm {
  return {
    name: d.name,
    email: d.email || '',
    phone: d.phone || '',
    employeeId: d.employeeId || '',
    fatherName: d.fatherName || '',
    qualification: d.qualification || '',
    specialization: d.specialization || '',
    joiningDate: toInputDate(d.joiningDate),
    dateOfBirth: toInputDate(d.dateOfBirth),
    address: d.address || '',
    salary: d.salary != null ? String(d.salary) : '',
    gender: d.gender || '',
    bloodGroup: d.bloodGroup || '',
    emergencyContact: d.emergencyContact || '',
    cardId: d.cardId || '',
    severeDisease: d.severeDisease || '',
    experience: d.experience || '',
    bio: d.bio || '',
  };
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-warm-muted">{label}{required && ' *'}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = 'text', step }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; step?: string;
}) {
  return (
    <input
      type={type}
      step={step}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={fieldClass}
    />
  );
}

function DetailCard({ icon: Icon, label, value }: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-warm-card-border bg-warm-card p-3">
      <div className="flex items-center gap-2">
        <Icon size={13} className="shrink-0 text-warm-accent" />
        <span className="text-[10px] uppercase tracking-wider text-warm-muted">{label}</span>
      </div>
      <p className="mt-1 text-sm text-warm-cream">{value || '—'}</p>
    </div>
  );
}

export default function StaffDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [data, setData] = useState<StaffDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileEditing, setProfileEditing] = useState(false);
  const [form, setForm] = useState<ProfileForm>(detailFromData({ name: '', username: '', email: '', phone: '', status: '', branchRole: '', permissions: [], userId: '' }));
  const [savingProfile, setSavingProfile] = useState(false);

  const [permsEditing, setPermsEditing] = useState(false);
  const [perms, setPerms] = useState(toPermRecord([]));
  const [savingPerms, setSavingPerms] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

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
        setForm(detailFromData(d));
        setPerms(toPermRecord(d.permissions));
      })
      .catch((e) => showToast('error', e.message))
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const cancelProfileEdit = () => {
    if (data) setForm(detailFromData(data));
    setProfileEditing(false);
  };

  const saveProfile = async () => {
    if (!data) return;
    setSavingProfile(true);
    try {
      const res = await api.updateStaffMember(userId, {
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        employeeId: form.employeeId.trim() || undefined,
        fatherName: form.fatherName.trim() || undefined,
        qualification: form.qualification.trim() || undefined,
        specialization: form.specialization.trim() || undefined,
        joiningDate: form.joiningDate || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        address: form.address.trim() || undefined,
        salary: form.salary.trim() ? Number(form.salary) : undefined,
        gender: form.gender || undefined,
        bloodGroup: form.bloodGroup.trim() || undefined,
        emergencyContact: form.emergencyContact.trim() || undefined,
        cardId: form.cardId.trim() || undefined,
        severeDisease: form.severeDisease.trim() || undefined,
        experience: form.experience.trim() || undefined,
        bio: form.bio.trim() || undefined,
      });
      setData(res.data);
      setForm(detailFromData(res.data));
      setProfileEditing(false);
      showToast('success', 'Profile updated');
    } catch (e: unknown) {
      showToast('error', e instanceof Error ? e.message : 'Update failed');
    } finally {
      setSavingProfile(false);
    }
  };

  const uploadPhoto = async (file: File) => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('purpose', 'profile');
      const res = await fetch(`${config.apiUrl}/api/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Upload failed');
      await api.updateStaffMember(userId, { profilePhotoId: result.data.id });
      showToast('success', 'Photo updated');
      load();
    } catch (e: unknown) {
      showToast('error', e instanceof Error ? e.message : 'Failed to upload photo');
    }
  };

  const cancelPermsEdit = () => {
    if (data) setPerms(toPermRecord(data.permissions));
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
    let pw = upper[Math.floor(Math.random() * upper.length)]
      + lower[Math.floor(Math.random() * lower.length)]
      + digits[Math.floor(Math.random() * digits.length)]
      + special[Math.floor(Math.random() * special.length)];
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
    try {
      await api.setStaffPassword(userId, pendingSavePassword, adminPassword);
      setShowAdminPassPopup(false);
      setGeneratedPassword('');
      setPendingSavePassword('');
      setPasswordSaved(true);
      setShowPassword(false);
      showToast('success', 'Password saved successfully');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed';
      setAdminPassError(msg);
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
      }
    } catch (e: unknown) {
      showToast('error', e instanceof Error ? e.message : 'Failed to send');
    }
  };

  const toggleStatus = () => {
    if (!data) return;
    const action = data.status === 'active' ? api.deactivateStaffMember : api.reactivateStaffMember;
    setConfirm({
      open: true,
      title: data.status === 'active' ? `Deactivate "${data.name}"?` : `Reactivate "${data.name}"?`,
      message: data.status === 'active' ? 'Login will be disabled.' : 'Login will be restored.',
      variant: data.status === 'active' ? 'warning' : 'default',
      confirmLabel: data.status === 'active' ? 'Deactivate' : 'Reactivate',
      action: async () => {
        await action(userId);
        showToast('success', data.status === 'active' ? 'Staff deactivated' : 'Staff reactivated');
        load();
      },
    });
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="h-40 animate-pulse rounded-xl bg-warm-card" />
      </main>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <p className="text-sm text-warm-muted">Staff member not found.</p>
      </main>
    );
  }

  const displayPhone = data.phone || form.phone;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <button type="button" onClick={() => router.push('/admin/staff')} className="mb-6 flex items-center gap-1.5 text-xs text-warm-muted hover:text-warm-cream">
        <ArrowLeft size={14} /> Back to Staff
      </button>

      {/* Header + photo */}
      <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-1 items-start gap-4">
          <div className="relative shrink-0">
            <div
              className="group relative cursor-pointer"
              onClick={() => {
                if (data.profilePhotoId) setMenuOpen(true);
                else photoInputRef.current?.click();
              }}
            >
              <AvatarImage
                fileId={data.profilePhotoId}
                className="h-32 w-28 rounded-xl border-2 border-warm-card-border object-cover"
                fallback={data.name?.charAt(0)}
              />
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/0 transition-colors group-hover:bg-black/40">
                <span className="text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                  {data.profilePhotoId ? 'Options' : 'Upload'}
                </span>
              </div>
            </div>
            {data.profilePhotoId && (
              <ProfileOptionMenu
                isOpen={menuOpen}
                onClose={() => setMenuOpen(false)}
                items={[
                  viewPhotoItem(() => setLightboxOpen(true)),
                  uploadNewItem(() => photoInputRef.current?.click()),
                ]}
              />
            )}
            <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadPhoto(file);
              e.target.value = '';
            }} />
            {data.profilePhotoId && (
              <Lightbox
                isOpen={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
                src={`${config.apiUrl}/api/uploads/${data.profilePhotoId}`}
                alt={data.name}
              />
            )}
          </div>
          <div>
            <h1 className="text-xl font-light text-warm-cream">{data.name}</h1>
            <p className="mt-0.5 text-xs text-warm-muted">@{data.username} · {data.branchRole.replace('_', ' ')}</p>
            {data.employeeId && <p className="mt-1 text-xs text-warm-muted/70">{data.employeeId}</p>}
            {data.qualification && <p className="text-xs text-warm-muted">{data.qualification}</p>}
            <span className={`mt-2 inline-flex items-center gap-1 text-[11px] ${data.status === 'active' ? 'text-green-400' : 'text-warm-muted'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${data.status === 'active' ? 'bg-green-400' : 'bg-gray-500'}`} />
              {data.status}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={toggleStatus}
          className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs ${
            data.status === 'active' ? 'border-red-900/40 text-red-400 hover:bg-red-900/10' : 'border-green-900/40 text-green-400 hover:bg-green-900/10'
          }`}
        >
          {data.status === 'active' ? 'Deactivate' : 'Reactivate'}
        </button>
      </div>

      {/* Profile details */}
      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium text-warm-cream">Profile Details</h2>
          {!profileEditing ? (
            <button type="button" onClick={() => setProfileEditing(true)} className="flex items-center gap-1 rounded-lg border border-warm-card-border px-2.5 py-1 text-xs text-warm-muted hover:text-warm-cream">
              <Edit3 size={12} /> Edit
            </button>
          ) : (
            <button type="button" onClick={cancelProfileEdit} className="flex items-center gap-1 text-xs text-warm-muted hover:text-warm-cream">
              <X size={12} /> Cancel
            </button>
          )}
        </div>

        {profileEditing ? (
          <div className="rounded-xl border border-warm-card-border bg-warm-card/30 p-5 space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Full Name" required><Input value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} /></Field>
              <Field label="Email"><Input value={form.email} onChange={(v) => setForm((p) => ({ ...p, email: v }))} /></Field>
              <Field label="Phone"><Input value={form.phone} onChange={(v) => setForm((p) => ({ ...p, phone: v }))} placeholder="+92 300 …" /></Field>
              <Field label="Employee ID"><Input value={form.employeeId} onChange={(v) => setForm((p) => ({ ...p, employeeId: v }))} placeholder="e.g. STF-001" /></Field>
              <Field label="Father Name"><Input value={form.fatherName} onChange={(v) => setForm((p) => ({ ...p, fatherName: v }))} /></Field>
              <Field label="Qualification"><Input value={form.qualification} onChange={(v) => setForm((p) => ({ ...p, qualification: v }))} /></Field>
              <Field label="Specialization"><Input value={form.specialization} onChange={(v) => setForm((p) => ({ ...p, specialization: v }))} /></Field>
              <Field label="Joining Date"><Input type="date" value={form.joiningDate} onChange={(v) => setForm((p) => ({ ...p, joiningDate: v }))} /></Field>
              <Field label="Date of Birth"><Input type="date" value={form.dateOfBirth} onChange={(v) => setForm((p) => ({ ...p, dateOfBirth: v }))} /></Field>
              <Field label="Salary"><Input type="number" step="0.01" value={form.salary} onChange={(v) => setForm((p) => ({ ...p, salary: v }))} /></Field>
              <Field label="Blood Group"><Input value={form.bloodGroup} onChange={(v) => setForm((p) => ({ ...p, bloodGroup: v }))} /></Field>
              <Field label="Gender">
                <select value={form.gender} onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))} className={fieldClass}>
                  <option value="">— Select —</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </Field>
              <Field label="Emergency Contact"><Input value={form.emergencyContact} onChange={(v) => setForm((p) => ({ ...p, emergencyContact: v }))} /></Field>
              <Field label="Card ID"><Input value={form.cardId} onChange={(v) => setForm((p) => ({ ...p, cardId: v }))} /></Field>
              <Field label="Severe Disease"><Input value={form.severeDisease} onChange={(v) => setForm((p) => ({ ...p, severeDisease: v }))} /></Field>
              <Field label="Experience"><Input value={form.experience} onChange={(v) => setForm((p) => ({ ...p, experience: v }))} placeholder="e.g. 5 years" /></Field>
            </div>
            <Field label="Address"><Input value={form.address} onChange={(v) => setForm((p) => ({ ...p, address: v }))} /></Field>
            <Field label="Bio">
              <textarea value={form.bio} onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))} rows={3} className={`${fieldClass} resize-none`} />
            </Field>
            <div>
              <label className="mb-1 block text-xs text-warm-muted">Username (read-only)</label>
              <input className={fieldClass} value={data.username || ''} disabled />
            </div>
            <button type="button" disabled={savingProfile} onClick={saveProfile} className="flex items-center gap-1.5 rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] disabled:opacity-50">
              <Save size={13} /> {savingProfile ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <DetailCard icon={User} label="Full Name" value={data.name} />
            <DetailCard icon={Mail} label="Email" value={data.email || '—'} />
            <DetailCard icon={Phone} label="Phone" value={displayPhone || '—'} />
            <DetailCard icon={Award} label="Employee ID" value={data.employeeId || '—'} />
            <DetailCard icon={User} label="Father Name" value={data.fatherName || '—'} />
            <DetailCard icon={Award} label="Qualification" value={data.qualification || '—'} />
            <DetailCard icon={BookOpen} label="Specialization" value={data.specialization || '—'} />
            <DetailCard icon={Calendar} label="Joining Date" value={fmtDate(data.joiningDate)} />
            <DetailCard icon={Calendar} label="Date of Birth" value={fmtDate(data.dateOfBirth)} />
            <DetailCard icon={MapPin} label="Address" value={data.address || '—'} />
            <DetailCard icon={DollarSign} label="Salary" value={data.salary != null ? Number(data.salary).toLocaleString() : '—'} />
            <DetailCard icon={User} label="Gender" value={data.gender ? data.gender.charAt(0).toUpperCase() + data.gender.slice(1) : '—'} />
            <DetailCard icon={Heart} label="Blood Group" value={data.bloodGroup || '—'} />
            <DetailCard icon={Phone} label="Emergency Contact" value={data.emergencyContact || '—'} />
            <DetailCard icon={CreditCard} label="Card ID" value={data.cardId || '—'} />
            <DetailCard icon={AlertTriangle} label="Severe Disease" value={data.severeDisease || '—'} />
            <DetailCard icon={Briefcase} label="Experience" value={data.experience || '—'} />
            <DetailCard icon={FileText} label="Bio" value={data.bio || '—'} />
          </div>
        )}
      </section>

      {/* Module access */}
      <section className="mb-8 rounded-xl border border-warm-card-border bg-warm-card/30 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-warm-cream">Module access</h2>
            <p className="mt-0.5 text-xs text-warm-muted">Read is always on for selected modules.</p>
          </div>
          {!permsEditing ? (
            <button type="button" onClick={() => setPermsEditing(true)} className="flex items-center gap-1 rounded-lg border border-warm-card-border px-2.5 py-1 text-xs text-warm-muted hover:text-warm-cream">
              <Edit3 size={12} /> Edit
            </button>
          ) : (
            <button type="button" onClick={cancelPermsEdit} className="flex items-center gap-1 text-xs text-warm-muted hover:text-warm-cream">
              <X size={12} /> Cancel
            </button>
          )}
        </div>
        {permsEditing ? (
          <>
            <PermissionMatrix value={perms} onChange={setPerms} />
            <button type="button" disabled={savingPerms} onClick={savePermissions} className="mt-4 flex items-center gap-1.5 rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] disabled:opacity-50">
              <Save size={13} /> {savingPerms ? 'Saving…' : 'Save module access'}
            </button>
          </>
        ) : (
          <ModulePermissionsRead permissions={data.permissions} />
        )}
      </section>

      {/* Credentials */}
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
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-muted hover:text-warm-cream">
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              )}
            </div>
            {generatedPassword && (
              <button type="button" onClick={copyPassword} className="flex items-center gap-1.5 rounded-lg border border-warm-card-border px-3 py-2.5 text-xs text-warm-muted hover:text-warm-cream">
                {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            )}
            <button type="button" onClick={generatePassword} className="flex items-center gap-1.5 rounded-lg bg-warm-accent px-3 py-2.5 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76]">
              <RefreshCw size={14} /> Generate
            </button>
          </div>
          {generatedPassword && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={handleSavePasswordClick} className="flex items-center gap-1.5 rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614]">
                <Save size={13} /> Save
              </button>
              <button type="button" onClick={handleSendCredential} disabled={!displayPhone} className="flex items-center gap-1.5 rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream disabled:opacity-40">
                <Send size={13} /> Send via WhatsApp
              </button>
            </div>
          )}
          {!displayPhone && <p className="mt-2 text-[11px] text-amber-400/80">Add a phone number in profile to send credentials.</p>}
        </div>
      </section>

      {showAdminPassPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setShowAdminPassPopup(false)}>
          <div className="w-full max-w-sm rounded-xl border border-warm-card-border bg-[#24201e] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-2 text-sm font-medium text-warm-cream">Confirm password save</h3>
            <p className="mb-4 text-xs text-warm-muted">Enter your own password to confirm.</p>
            <input type="password" value={adminPassword} onChange={(e) => { setAdminPassword(e.target.value); setAdminPassError(''); }} placeholder="Your password" autoFocus className={fieldClass} onKeyDown={(e) => e.key === 'Enter' && handleAdminPassVerify()} />
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
          try { await confirm.action(); } catch (e: unknown) { showToast('error', e instanceof Error ? e.message : 'Failed'); }
          setConfirm((prev) => ({ ...prev, open: false }));
        }}
        onCancel={() => setConfirm((prev) => ({ ...prev, open: false }))}
      />
    </main>
  );
}
