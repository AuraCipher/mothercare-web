'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import {
  ArrowLeft, GraduationCap, BookOpen, MapPin, Calendar, DollarSign,
  Phone, Mail, User, Award, Heart, AlertTriangle, Key, Copy, Check,
  Eye, EyeOff, Send, Save, RefreshCw,
} from 'lucide-react';
import { showToast } from '@/components/toast';
import ConfirmModal from '@/components/confirm-modal';

interface TeacherDetail {
  id: string;
  userId: string;
  employeeId: string | null;
  qualification: string | null;
  specialization: string | null;
  joiningDate: string | null;
  salary: string | null;
  phone: string | null;
  emergencyContact: string | null;
  address: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  bloodGroup: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string | null; phone: string | null; username: string | null; role: string; status: string };
  assignments: Assignment[];
}

interface Assignment {
  id: string;
  academicYearId: string;
  teacherId: string;
  groupId: string;
  subjectId: string;
  isClassTeacher: boolean;
  group: { id: string; name: string; section: string | null };
  subject: { id: string; name: string; code: string | null };
  academicYear: { id: string };
}

export default function TeacherDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<TeacherDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Delete confirm
  const [confirm, setConfirm] = useState<{
    open: boolean; title: string; message: string;
    variant: 'danger' | 'warning' | 'default';
    confirmLabel: string; action: () => Promise<void>;
  }>({ open: false, title: '', message: '', variant: 'danger', confirmLabel: 'Confirm', action: async () => {} });

  // Password management
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(true);

  // Admin password verification popup
  const [showAdminPassPopup, setShowAdminPassPopup] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminPassError, setAdminPassError] = useState('');
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const generatePassword = () => {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const digits = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const all = upper + lower + digits + special;

    let pw = '';
    // Ensure at least one of each type
    pw += upper[Math.floor(Math.random() * upper.length)];
    pw += lower[Math.floor(Math.random() * lower.length)];
    pw += digits[Math.floor(Math.random() * digits.length)];
    pw += special[Math.floor(Math.random() * special.length)];

    // Fill remaining 8 chars
    for (let i = 0; i < 8; i++) {
      pw += all[Math.floor(Math.random() * all.length)];
    }

    // Shuffle
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

  const handleSavePassword = () => {
    setGeneratedPassword('');
    setPasswordSaved(true);
    setShowPassword(false);
    setShowAdminPassPopup(true);
  };

  const handleAdminPassVerify = async () => {
    if (!adminPassword.trim()) {
      setAdminPassError('Enter your password to confirm');
      return;
    }
    if (!generatedPassword) {
      setAdminPassError('No password generated');
      return;
    }
    try {
      await api.setTeacherPassword(data!.id, generatedPassword, adminPassword);
      setShowAdminPassPopup(false);
      setAdminPassword('');
      setAdminPassError('');
      setGeneratedPassword('');
      setPasswordSaved(true);
      setShowPassword(false);
      showToast('success', 'Password saved successfully');
    } catch (e: any) {
      const msg = e.message || '';
      // Map backend error messages to user-friendly versions
      if (msg.includes('incorrect')) {
        setAdminPassError('Your password is incorrect. Try again.');
        showToast('error', 'Wrong password. Please try again.');
      } else if (msg.includes('Too many') || msg.includes('rate limit')) {
        setAdminPassError('Too many attempts. Please wait 1 minute before trying again.');
        showToast('error', 'Too many attempts. Please wait 1 minute.');
      } else if (msg.includes('used recently')) {
        setAdminPassError('This password was used before. Please generate a different one.');
        showToast('error', 'Password was used recently. Choose a new one.');
      } else if (msg.includes('429')) {
        setAdminPassError('Too many attempts. Please wait 1 minute before trying again.');
        showToast('error', 'Too many attempts. Please wait.');
      } else {
        setAdminPassError(msg || 'Failed to save password');
        showToast('error', msg || 'Failed to save password');
      }
    }
  };

  const loadData = () => {
    setLoading(true);
    api.getTeacher(id)
      .then(d => { if (d.success) setData(d.data); })
      .catch(e => setError(e.message || 'Failed to load teacher'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [id]);

  const handleDelete = () => {
    if (!data) return;
    const count = data.assignments?.length ?? 0;

    if (count > 0) {
      setConfirm({
        open: true,
        title: 'Cannot Delete Teacher',
        message: `This teacher has ${count} active assignment(s). Remove all assignments first.`,
        variant: 'warning',
        confirmLabel: 'Got it',
        action: async () => {},
      });
      return;
    }

    setConfirm({
      open: true,
      title: `Delete "${data.user.name}"?`,
      message: `Their profile will be deactivated and login disabled. All associated data is preserved.`,
      variant: 'danger',
      confirmLabel: 'Delete Teacher',
      action: async () => {
        try {
          await api.deleteTeacher(data.id);
          showToast('success', 'Teacher profile deactivated');
          router.push('/admin/teachers');
        } catch (e: any) {
          showToast('error', e.message || 'Failed to delete');
        }
      },
    });
  };

  // ─── Loading skeleton ──────────────────────────

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-6 h-5 w-32 animate-pulse rounded bg-warm-card" />
        <div className="mb-8 h-8 w-64 animate-pulse rounded bg-warm-card" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 rounded-xl bg-warm-card animate-pulse" />)}
        </div>
      </main>
    );
  }

  // ─── Error state ───────────────────────────────

  if (error || !data) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <button onClick={() => router.push('/admin/teachers')} className="mb-6 flex items-center gap-1.5 text-xs text-warm-muted hover:text-warm-cream transition-colors">
          <ArrowLeft size={13} /> Back to Teachers
        </button>
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-8 text-center">
          <AlertTriangle size={28} className="mx-auto mb-3 text-warm-muted" />
          <p className="text-sm text-warm-muted">{error || 'Teacher not found'}</p>
        </div>
      </main>
    );
  }

  const { user } = data;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      {/* Back */}
      <button onClick={() => router.push('/admin/teachers')} className="mb-6 flex items-center gap-1.5 text-xs text-warm-muted hover:text-warm-cream transition-colors">
        <ArrowLeft size={13} /> Back to Teachers
      </button>

      {/* Profile header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-warm-accent/10">
            <GraduationCap size={24} className="text-warm-accent" />
          </div>
          <div>
            <h1 className="text-xl font-light text-warm-cream">{user.name}</h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
              {data.employeeId && (
                <span className="text-xs text-warm-muted/60">{data.employeeId}</span>
              )}
              {data.qualification && (
                <span className="inline-flex items-center gap-1 rounded-full border border-warm-accent/20 bg-warm-accent/5 px-2 py-0.5 text-[10px] text-warm-accent">
                  {data.qualification}
                </span>
              )}
              <span className={`inline-flex items-center gap-1 text-xs ${
                user.status === 'active' ? 'text-green-400' : 'text-warm-muted/50'
              }`}>
                <span className={`inline-block h-1.5 w-1.5 rounded-full ${user.status === 'active' ? 'bg-green-400' : 'bg-gray-500'}`} />
                {user.status}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={handleDelete}
          className="flex items-center gap-1.5 rounded-lg border border-red-900/30 bg-red-900/10 px-4 py-2 text-xs text-red-400 hover:bg-red-900/20 transition-colors"
        >
          <AlertTriangle size={13} /> Delete Teacher
        </button>
      </div>

      {/* Profile details grid */}
      <section className="mb-10">
        <h2 className="mb-4 text-sm font-medium text-warm-cream">Profile Details</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <DetailCard icon={User} label="Full Name" value={user.name} />
          <DetailCard icon={Mail} label="Email" value={user.email || '—'} />
          <DetailCard icon={Phone} label="Phone" value={user.phone || data.phone || '—'} />
          <DetailCard icon={Award} label="Employee ID" value={data.employeeId || '—'} />
          <DetailCard icon={Award} label="Qualification" value={data.qualification || '—'} />
          <DetailCard icon={BookOpen} label="Specialization" value={data.specialization || '—'} />
          <DetailCard icon={Calendar} label="Joining Date" value={data.joiningDate ? new Date(data.joiningDate).toLocaleDateString() : '—'} />
          <DetailCard icon={Calendar} label="Date of Birth" value={data.dateOfBirth ? new Date(data.dateOfBirth).toLocaleDateString() : '—'} />
          <DetailCard icon={MapPin} label="Address" value={data.address || '—'} />
          <DetailCard icon={DollarSign} label="Salary" value={data.salary ? `${Number(data.salary).toLocaleString()}` : '—'} />
          <DetailCard icon={User} label="Gender" value={data.gender ? data.gender.charAt(0).toUpperCase() + data.gender.slice(1) : '—'} />
          <DetailCard icon={Heart} label="Blood Group" value={data.bloodGroup || '—'} />
          <DetailCard icon={Phone} label="Emergency Contact" value={data.emergencyContact || '—'} />
        </div>
      </section>

      {/* ════════════════════════════════════════════
          Password Management
         ════════════════════════════════════════════ */}
      <section className="mb-10">
        <h2 className="mb-4 text-sm font-medium text-warm-cream">Login Credentials</h2>
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-5">
          {/* Username */}
          <div className="mb-4">
            <p className="mb-1 text-[10px] font-medium tracking-wider text-warm-muted uppercase">Username</p>
            <div className="flex items-center gap-2 rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2.5">
              <User size={14} className="text-warm-muted shrink-0" />
              <span className="text-sm text-warm-cream font-mono">{user.username || '—'}</span>
            </div>
          </div>

          {/* Password */}
          <div>
            <p className="mb-1 text-[10px] font-medium tracking-wider text-warm-muted uppercase">Password</p>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  ref={passwordInputRef}
                  type={showPassword ? 'text' : 'password'}
                  value={generatedPassword}
                  readOnly
                  placeholder={passwordSaved ? '••••••••••••' : ''}
                  className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] py-2.5 pl-9 pr-9 text-sm text-warm-cream font-mono outline-none placeholder:text-warm-muted/30 focus:border-warm-accent transition-colors"
                />
                <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-muted" />
                {generatedPassword && (
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-muted hover:text-warm-cream transition-colors"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                )}
              </div>
              {generatedPassword && (
                <button onClick={copyPassword} title="Copy password"
                  className="flex items-center gap-1.5 rounded-lg border border-warm-card-border px-3 py-2.5 text-xs text-warm-muted hover:text-warm-cream hover:border-warm-accent/50 transition-colors"
                >
                  {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              )}
              <button onClick={generatePassword} title="Generate new password"
                className="flex items-center gap-1.5 rounded-lg bg-warm-accent px-3 py-2.5 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] transition-colors"
              >
                <RefreshCw size={14} /> Generate
              </button>
            </div>

            {/* Save + Send buttons */}
            {generatedPassword && (
              <div className="mt-3 flex gap-2">
                <button onClick={handleSavePassword}
                  className="flex items-center gap-1.5 rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] transition-colors"
                >
                  <Save size={13} /> Save
                </button>
                <button
                  className="flex items-center gap-1.5 rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream transition-colors"
                >
                  <Send size={13} /> Send
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Assignments */}
      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium text-warm-cream">Assignments</h2>
        </div>

        {data.assignments.length === 0 ? (
          <div className="rounded-xl border border-warm-card-border bg-warm-card p-6 text-center">
            <BookOpen size={20} className="mx-auto mb-2 text-warm-muted" />
            <p className="text-xs text-warm-muted">No assignments yet. Assign this teacher to a subject and group.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-warm-card-border">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-warm-card-border bg-warm-card/50">
                  <th className="px-4 py-3 text-[10px] font-medium tracking-wider text-warm-muted uppercase">Subject</th>
                  <th className="px-4 py-3 text-[10px] font-medium tracking-wider text-warm-muted uppercase">Group</th>
                  <th className="px-4 py-3 text-[10px] font-medium tracking-wider text-warm-muted uppercase">Section</th>
                  <th className="px-4 py-3 text-[10px] font-medium tracking-wider text-warm-muted uppercase">Role</th>
                </tr>
              </thead>
              <tbody>
                {data.assignments.map(a => (
                  <tr key={a.id} className="border-b border-warm-card-border last:border-0 hover:bg-warm-card/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-warm-cream">{a.subject.name}</td>
                    <td className="px-4 py-3 text-sm text-warm-cream">{a.group.name}</td>
                    <td className="px-4 py-3 text-sm text-warm-muted">{a.group.section || '—'}</td>
                    <td className="px-4 py-3">
                      {a.isClassTeacher ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-warm-accent/20 bg-warm-accent/5 px-2 py-0.5 text-[10px] text-warm-accent">
                          Class Teacher
                        </span>
                      ) : (
                        <span className="text-xs text-warm-muted">Subject Teacher</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Schedule view */}
      {data.assignments.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-sm font-medium text-warm-cream">Schedule</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {data.assignments.map(a => (
              <div key={a.id} className="rounded-xl border border-warm-card-border bg-warm-card p-4">
                <div className="mb-2 flex items-center gap-2">
                  <BookOpen size={14} className="text-warm-accent shrink-0" />
                  <span className="text-sm font-medium text-warm-cream">{a.subject.name}</span>
                  {a.isClassTeacher && (
                    <span className="rounded-full border border-warm-accent/20 bg-warm-accent/5 px-1.5 py-0.5 text-[9px] text-warm-accent">Class Teacher</span>
                  )}
                </div>
                <p className="text-xs text-warm-muted">
                  {a.group.name}{a.group.section ? ` · ${a.group.section}` : ''}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Confirm modal (delete) */}
      <ConfirmModal
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        variant={confirm.variant}
        confirmLabel={confirm.confirmLabel}
        onConfirm={async () => { await confirm.action(); setConfirm(prev => ({ ...prev, open: false })); }}
        onCancel={() => setConfirm(prev => ({ ...prev, open: false }))}
      />

      {/* ── Admin Password Verification popup ──────────── */}
      {showAdminPassPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setShowAdminPassPopup(false)}>
          <div className="w-full max-w-sm rounded-xl border border-warm-card-border bg-[#24201e] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-2 text-sm font-medium text-warm-cream">Verify Your Password</h2>
            <p className="mb-4 text-xs text-warm-muted">Enter your own password to confirm saving the teacher's new credentials.</p>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => { setAdminPassword(e.target.value); setAdminPassError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleAdminPassVerify()}
              placeholder="Your password"
              className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2.5 text-sm text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent transition-colors"
              autoFocus
            />
            {adminPassError && (
              <p className="mt-2 text-xs text-red-400">{adminPassError}</p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => { setShowAdminPassPopup(false); setAdminPassword(''); setAdminPassError(''); }} className="rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream transition-colors">Cancel</button>
              <button onClick={handleAdminPassVerify} className="rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] transition-colors">Verify</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/* ── Detail card helper ── */
function DetailCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-warm-card-border bg-warm-card p-3">
      <div className="flex items-center gap-2">
        <Icon size={13} className="text-warm-accent shrink-0" />
        <span className="text-[10px] tracking-wider text-warm-muted uppercase">{label}</span>
      </div>
      <p className="mt-1 text-sm text-warm-cream">{value}</p>
    </div>
  );
}
