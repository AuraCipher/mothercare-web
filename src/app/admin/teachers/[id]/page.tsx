'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import {
  ArrowLeft, BookOpen, MapPin, Calendar, DollarSign,
  Phone, Mail, User, Award, Heart, AlertTriangle, Key, Copy, Check,
  Eye, EyeOff, Send, Save, RefreshCw, Plus, Edit3, Trash2, X,
  CalendarDays, Clock, CreditCard, Briefcase, FileText,
} from 'lucide-react';
import AvatarImage from '@/components/avatar-image';
import ProfileOptionMenu, { viewPhotoItem, uploadNewItem } from '@/components/profile-option-menu';
import Lightbox from '@/components/lightbox';
import { showToast } from '@/components/toast';
import ConfirmModal from '@/components/confirm-modal';
import PayrollHistoryPanel from '@/components/payroll-history-panel';
import TenureHistoryPanel from '@/components/tenure-history-panel';
import { TeacherPermissionsPanel } from '@/components/admin/teacher-permissions-panel';
import config from '@/config';

interface TeacherDetail {
  id: string;
  userId: string;
  fatherName: string | null;
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
  cardId: string | null;
  severeDisease: string | null;
  experience: string | null;
  bio: string | null;
  portalAccess?: 'FULL' | 'READ_ONLY' | 'FROZEN';
  canViewParentContact?: boolean;
  hodParentContactScope?: 'ASSIGNED_ONLY' | 'DEPARTMENT_ALL';
  createdAt: string;
  user: { id: string; name: string; email: string | null; phone: string | null; username: string | null; role: string; status: string; profilePhotoId: string | null };
  assignments: Assignment[];
}

interface Assignment {
  id: string;
  academicYearId: string;
  teacherId: string;
  groupId: string;
  subjectId: string;
  isClassTeacher: boolean;
  role?: string;
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Delete confirm
  const [confirm, setConfirm] = useState<{
    open: boolean; title: string; message: string;
    variant: 'danger' | 'warning' | 'default';
    confirmLabel: string; action: () => Promise<void>;
  }>({ open: false, title: '', message: '', variant: 'danger', confirmLabel: 'Confirm', action: async () => {} });

  // Teacher timetables
  const [teacherTimetables, setTeacherTimetables] = useState<any[]>([]);
  const [loadingTt, setLoadingTt] = useState(false);

  // Password management
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(true);

  // Assignment modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editAssignId, setEditAssignId] = useState<string | null>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [assignForm, setAssignForm] = useState({ sectionId: '', subjectId: '', role: 'primary', isClassTeacher: false });
  const [savingAssign, setSavingAssign] = useState(false);
  const [assignError, setAssignError] = useState('');

  // Admin password verification popup
  const [showAdminPassPopup, setShowAdminPassPopup] = useState(false);
  const [pendingSavePassword, setPendingSavePassword] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminPassError, setAdminPassError] = useState('');

  // Profile edit
  const [profileEditing, setProfileEditing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [form, setForm] = useState({
    employeeId: '', fatherName: '', qualification: '', specialization: '',
    joiningDate: '', dateOfBirth: '', phone: '', emergencyContact: '', address: '',
    salary: '', gender: '', bloodGroup: '', cardId: '', severeDisease: '', experience: '', bio: '',
  });
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const [tenures, setTenures] = useState<any[]>([]);
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);

  useEffect(() => {
    setActiveBranchId(localStorage.getItem('activeBranchId'));
  }, []);

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
    if (!generatedPassword) return;
    setPendingSavePassword(generatedPassword);
    setShowAdminPassPopup(true);
    setAdminPassword('');
    setAdminPassError('');
  };

  const handleSendCredential = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      if (!data) return;
      const res = await fetch(`${config.apiUrl}/admin/teachers/${data.id}/send-credentials`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) showToast('success', 'Credentials sent via WhatsApp');
      else showToast('error', result.message || 'Failed to send');
    } catch { showToast('error', 'Failed to send'); }
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
      await api.setTeacherPassword(data!.id, pendingSavePassword, adminPassword);
      setShowAdminPassPopup(false);
      setAdminPassword('');
      setAdminPassError('');
      setPendingSavePassword('');
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
      .then((d) => {
        if (d.success) {
          setData(d.data);
        }
      })
      .catch(e => setError(e.message || 'Failed to load teacher'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [id]);

  useEffect(() => {
    if (!data?.userId) return;
    api.getTeacherTenures(data.userId).then((r) => setTenures(r.data || [])).catch(() => setTenures([]));
  }, [data?.userId]);

  const refreshTenures = () => {
    if (!data?.userId) return;
    api.getTeacherTenures(data.userId).then((r) => setTenures(r.data || [])).catch(() => {});
  };

  const detailFromTeacher = (t: TeacherDetail) => ({
    employeeId: t.employeeId || '',
    fatherName: t.fatherName || '',
    qualification: t.qualification || '',
    specialization: t.specialization || '',
    joiningDate: t.joiningDate ? t.joiningDate.substring(0, 10) : '',
    dateOfBirth: t.dateOfBirth ? t.dateOfBirth.substring(0, 10) : '',
    phone: t.phone || t.user.phone || '',
    emergencyContact: t.emergencyContact || '',
    address: t.address || '',
    salary: t.salary != null ? String(t.salary) : '',
    gender: t.gender || '',
    bloodGroup: t.bloodGroup || '',
    cardId: t.cardId || '',
    severeDisease: t.severeDisease || '',
    experience: t.experience || '',
    bio: t.bio || '',
  });

  useEffect(() => {
    if (data) setForm(detailFromTeacher(data));
  }, [data]);

  const cancelProfileEdit = () => {
    if (data) setForm(detailFromTeacher(data));
    setProfileEditing(false);
  };

  const saveProfile = async () => {
    if (!data) return;
    setSavingProfile(true);
    try {
      await api.updateTeacher(data.id, {
        employeeId: form.employeeId.trim() || undefined,
        fatherName: form.fatherName.trim() || undefined,
        qualification: form.qualification.trim() || undefined,
        specialization: form.specialization.trim() || undefined,
        joiningDate: form.joiningDate || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        phone: form.phone.trim() || undefined,
        emergencyContact: form.emergencyContact.trim() || undefined,
        address: form.address.trim() || undefined,
        salary: form.salary.trim() ? Number(form.salary) : undefined,
        gender: form.gender || undefined,
        bloodGroup: form.bloodGroup.trim() || undefined,
        cardId: form.cardId.trim() || undefined,
        severeDisease: form.severeDisease.trim() || undefined,
        experience: form.experience.trim() || undefined,
        bio: form.bio.trim() || undefined,
      });
      setProfileEditing(false);
      showToast('success', 'Profile updated');
      loadData();
    } catch (e: any) {
      showToast('error', e.message || 'Update failed');
    } finally {
      setSavingProfile(false);
    }
  };

  // Fetch teacher timetables when teacher data is available
  useEffect(() => {
    if (!data?.id) return;
    const bId = localStorage.getItem('activeBranchId');
    if (!bId) return;
    setLoadingTt(true);
    api.getTeacherTimetables(bId, data.id)
      .then(d => { if (d.success) setTeacherTimetables(d.data); })
      .catch(() => {})
      .finally(() => setLoadingTt(false));
  }, [data?.id]);

  const handleDeactivate = () => {
    if (!data) return;
    setConfirm({
      open: true,
      title: `Deactivate "${data.user.name}"?`,
      message: `Their assignments will be ended and login disabled. All teaching history preserved. They can be reactivated later.`,
      variant: 'warning',
      confirmLabel: 'Deactivate',
      action: async () => {
        try {
          await api.deactivateTeacher(data.id);
          showToast('success', `"${data.user.name}" deactivated`);
          router.push('/admin/teachers');
        } catch (e: any) {
          showToast('error', e.message || 'Failed to deactivate');
        }
      },
    });
  };

  const handleReactivate = () => {
    if (!data) return;
    setConfirm({
      open: true,
      title: `Reactivate "${data.user.name}"?`,
      message: `Their login and branch access will be restored.`,
      variant: 'default',
      confirmLabel: 'Reactivate',
      action: async () => {
        try {
          await api.reactivateTeacher(data.id);
          showToast('success', `"${data.user.name}" reactivated`);
          loadData();
        } catch (e: any) {
          showToast('error', e.message || 'Failed to reactivate');
        }
      },
    });
  };

  // ─── Assignment management ─────────────────────

  const openAssignmentModal = async () => {
    setEditAssignId(null);
    setAssignForm({ sectionId: '', subjectId: '', role: 'primary', isClassTeacher: false });
    setAssignError('');
    setShowAssignModal(true);
    const branchId = localStorage.getItem('activeBranchId');
    const ayId = localStorage.getItem('activeAYId');
    if (!branchId || !ayId) { setAssignError('No branch or academic year selected'); return; }
    try {
      const [secData, subjData] = await Promise.all([
        api.getSections(branchId, ayId),
        api.getSubjects(branchId, ayId),
      ]);
      setSections(secData.data || []);
      setSubjects(subjData.data || []);
    } catch {}
  };

  const handleSaveAssignment = async () => {
    if (!assignForm.sectionId || !assignForm.subjectId) {
      setAssignError('Select a class and subject'); return;
    }
    const ayId = localStorage.getItem('activeAYId');
    if (!ayId) { setAssignError('No academic year selected'); return; }
    setSavingAssign(true);
    try {
      if (editAssignId) {
        await api.updateAssignment(editAssignId, { isClassTeacher: assignForm.isClassTeacher });
        showToast('success', 'Assignment updated');
      } else {
        await api.createAssignment({
          academicYearId: ayId,
          teacherId: data!.userId,
          groupId: assignForm.sectionId,
          subjectId: assignForm.subjectId,
          isClassTeacher: assignForm.isClassTeacher,
          role: assignForm.role,
        });
        showToast('success', 'Assignment added');
      }
      setShowAssignModal(false);
      setEditAssignId(null);
      loadData();
    } catch (e: any) {
      setAssignError(e.message || 'Failed to save assignment');
    } finally { setSavingAssign(false); }
  };

  const openEditAssignment = async (a: Assignment) => {
    setEditAssignId(a.id);
    setAssignForm({ sectionId: a.groupId, subjectId: a.subjectId, role: a.role || 'primary', isClassTeacher: a.isClassTeacher });
    setAssignError('');
    setShowAssignModal(true);
    const branchId = localStorage.getItem('activeBranchId');
    const ayId = localStorage.getItem('activeAYId');
    if (!branchId || !ayId) return;
    try {
      const [secData, subjData] = await Promise.all([
        api.getSections(branchId, ayId),
        api.getSubjects(branchId, ayId),
      ]);
      setSections(secData.data || []);
      setSubjects(subjData.data || []);
    } catch {}
  };

  const handleEndAssignment = (a: Assignment) => {
    setConfirm({
      open: true,
      title: 'End assignment?',
      message: `End "${a.subject.name}" for ${a.group.name}${a.group.section ? ` — ${a.group.section}` : ''}? The teacher will lose portal access to this class immediately.`,
      variant: 'warning',
      confirmLabel: 'End assignment',
      action: async () => {
        try {
          await api.endAssignment(a.id);
          showToast('success', 'Assignment ended');
          loadData();
        } catch (e: any) {
          showToast('error', e.message || 'Failed to end assignment');
        }
      },
    });
  };

  const handleDeleteAssignment = (a: Assignment) => {
    setConfirm({
      open: true,
      title: 'Remove Assignment?',
      message: `Remove "${a.subject.name}" from ${a.group.name}${a.group.section ? ` — ${a.group.section}` : ''}?`,
      variant: 'danger',
      confirmLabel: 'Remove',
      action: async () => {
        try {
          await api.deleteAssignment(a.id);
          showToast('success', 'Assignment removed');
          loadData();
        } catch (e: any) {
          showToast('error', e.message || 'Failed to remove');
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
      <div className="mb-8 flex items-start justify-between gap-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold text-warm-cream tracking-tight">{user.name}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
            {data.employeeId && (
              <span className="text-sm text-warm-muted/70">{data.employeeId}</span>
            )}
            {data.qualification && (
              <span className="inline-flex items-center gap-1 rounded-full border border-warm-accent/20 bg-warm-accent/5 px-2.5 py-0.5 text-[11px] text-warm-accent">
                {data.qualification}
              </span>
            )}
            <span className={`inline-flex items-center gap-1.5 text-xs ${
              user.status === 'active' ? 'text-green-400' : 'text-warm-muted/50'
            }`}>
              <span className={`inline-block h-2 w-2 rounded-full ${user.status === 'active' ? 'bg-green-400' : 'bg-gray-500'}`} />
              {user.status}
            </span>
          </div>
          <div className="mt-3">
            {user.status === 'active' ? (
              <button onClick={handleDeactivate}
                className="flex items-center gap-1.5 rounded-lg border border-red-900/30 bg-red-900/10 px-3 py-1.5 text-[11px] text-red-400 hover:bg-red-900/20 transition-colors">
                <AlertTriangle size={12} /> Deactivate
              </button>
            ) : (
              <button onClick={handleReactivate}
                className="flex items-center gap-1.5 rounded-lg border border-green-900/30 bg-green-900/10 px-3 py-1.5 text-[11px] text-green-400 hover:bg-green-900/20 transition-colors">
                ↻ Reactivate
              </button>
            )}
          </div>
        </div>

        {/* Passport-size photo — clickable with context menu */}
        <div className="relative shrink-0">
          <div className="relative group cursor-pointer"
            onClick={() => {
              if (user.profilePhotoId) {
                setMenuOpen(true);
              } else {
                photoInputRef.current?.click();
              }
            }}>
            <AvatarImage fileId={user.profilePhotoId} className="w-28 h-32 rounded-xl object-cover border-2 border-warm-card-border" fallback={user.name?.charAt(0)} />
            <div className="absolute inset-0 rounded-xl bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-colors">
              <span className="text-white text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                {user.profilePhotoId ? 'Options' : 'Upload'}
              </span>
            </div>
          </div>

          {/* Context menu when photo exists */}
          {user.profilePhotoId && (
            <ProfileOptionMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)}
              items={[
                viewPhotoItem(() => setLightboxOpen(true)),
                uploadNewItem(() => photoInputRef.current?.click()),
              ]} />
          )}

          <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              const token = localStorage.getItem('token');
              const formData = new FormData();
              formData.append('file', file);
              formData.append('purpose', 'profile');
              formData.append('entityType', 'teacher');
              formData.append('entityId', data.id);
              const res = await fetch(`${config.apiUrl}/api/upload`, {
                method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData,
              });
              const result = await res.json();
              if (!res.ok) throw new Error(result.message || 'Upload failed');
              await api.updateTeacher(data.id, { profilePhotoId: result.data.id });
              showToast('success', 'Photo updated');
              loadData();
            } catch (err: any) {
              showToast('error', err.message || 'Failed to upload photo');
            }
          }} />

          {/* Lightbox for viewing full-size */}
          <Lightbox isOpen={lightboxOpen} onClose={() => setLightboxOpen(false)}
            fileId={user.profilePhotoId}
            alt={user.name} />
        </div>
      </div>

      {/* Profile details grid */}
      <section className="mb-10">
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
              <ProfileField label="Employee ID"><ProfileInput value={form.employeeId} onChange={(v) => setForm((p) => ({ ...p, employeeId: v }))} /></ProfileField>
              <ProfileField label="Father Name"><ProfileInput value={form.fatherName} onChange={(v) => setForm((p) => ({ ...p, fatherName: v }))} /></ProfileField>
              <ProfileField label="Qualification"><ProfileInput value={form.qualification} onChange={(v) => setForm((p) => ({ ...p, qualification: v }))} /></ProfileField>
              <ProfileField label="Specialization"><ProfileInput value={form.specialization} onChange={(v) => setForm((p) => ({ ...p, specialization: v }))} /></ProfileField>
              <ProfileField label="Joining Date"><ProfileInput type="date" value={form.joiningDate} onChange={(v) => setForm((p) => ({ ...p, joiningDate: v }))} /></ProfileField>
              <ProfileField label="Date of Birth"><ProfileInput type="date" value={form.dateOfBirth} onChange={(v) => setForm((p) => ({ ...p, dateOfBirth: v }))} /></ProfileField>
              <ProfileField label="Phone"><ProfileInput value={form.phone} onChange={(v) => setForm((p) => ({ ...p, phone: v }))} placeholder="+92 300 …" /></ProfileField>
              <ProfileField label="Emergency Contact"><ProfileInput value={form.emergencyContact} onChange={(v) => setForm((p) => ({ ...p, emergencyContact: v }))} /></ProfileField>
              <ProfileField label="Salary"><ProfileInput type="number" step="0.01" value={form.salary} onChange={(v) => setForm((p) => ({ ...p, salary: v }))} /></ProfileField>
              <ProfileField label="Blood Group"><ProfileInput value={form.bloodGroup} onChange={(v) => setForm((p) => ({ ...p, bloodGroup: v }))} /></ProfileField>
              <ProfileField label="Gender">
                <select value={form.gender} onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))} className={profileFieldClass}>
                  <option value="">— Select —</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </ProfileField>
              <ProfileField label="Card ID"><ProfileInput value={form.cardId} onChange={(v) => setForm((p) => ({ ...p, cardId: v }))} /></ProfileField>
              <ProfileField label="Severe Disease"><ProfileInput value={form.severeDisease} onChange={(v) => setForm((p) => ({ ...p, severeDisease: v }))} /></ProfileField>
              <ProfileField label="Experience"><ProfileInput value={form.experience} onChange={(v) => setForm((p) => ({ ...p, experience: v }))} placeholder="e.g. 5 years" /></ProfileField>
            </div>
            <ProfileField label="Address"><ProfileInput value={form.address} onChange={(v) => setForm((p) => ({ ...p, address: v }))} /></ProfileField>
            <ProfileField label="Bio">
              <textarea value={form.bio} onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))} rows={3} className={`${profileFieldClass} resize-none`} />
            </ProfileField>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-warm-muted">Full Name (read-only)</label>
                <input className={profileFieldClass} value={user.name} disabled />
              </div>
              <div>
                <label className="mb-1 block text-xs text-warm-muted">Email (read-only)</label>
                <input className={profileFieldClass} value={user.email || ''} disabled />
              </div>
            </div>
            <button type="button" disabled={savingProfile} onClick={saveProfile} className="flex items-center gap-1.5 rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] disabled:opacity-50">
              <Save size={13} /> {savingProfile ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <DetailCard icon={User} label="Full Name" value={user.name} />
            <DetailCard icon={Mail} label="Email" value={user.email || '—'} />
            <DetailCard icon={Phone} label="Phone" value={user.phone || data.phone || '—'} />
            <DetailCard icon={Award} label="Employee ID" value={data.employeeId || '—'} />
            <DetailCard icon={User} label="Father Name" value={data.fatherName || '—'} />
            <DetailCard icon={Award} label="Qualification" value={data.qualification || '—'} />
            <DetailCard icon={BookOpen} label="Specialization" value={data.specialization || '—'} />
            <DetailCard icon={Calendar} label="Joining Date" value={data.joiningDate ? new Date(data.joiningDate).toLocaleDateString() : '—'} />
            <DetailCard icon={Calendar} label="Date of Birth" value={data.dateOfBirth ? new Date(data.dateOfBirth).toLocaleDateString() : '—'} />
            <DetailCard icon={MapPin} label="Address" value={data.address || '—'} />
            <DetailCard icon={DollarSign} label="Salary" value={data.salary ? `${Number(data.salary).toLocaleString()}` : '—'} />
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

      <section className="mb-10">
        <h2 className="mb-4 text-sm font-medium text-warm-cream">Payments</h2>
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-4">
          <PayrollHistoryPanel userId={data.userId} payeeName={user.name} />
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-sm font-medium text-warm-cream">Join / Leave History</h2>
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-4">
          {data ? (
            <TenureHistoryPanel
              tenures={tenures}
              onRefresh={refreshTenures}
              onRecordJoin={() => api.addTeacherTenureJoin(data.userId)}
              onRecordLeave={(payload) => api.addTeacherTenureLeave(data.userId, payload)}
            />
          ) : null}
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
                <button onClick={handleSendCredential}
                  className="flex items-center gap-1.5 rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream transition-colors"
                >
                  <Send size={13} /> Send
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <TeacherPermissionsPanel teacherProfileId={id} branchId={activeBranchId} />

      {/* Assignments */}
      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium text-warm-cream">Assignments</h2>
          <button onClick={openAssignmentModal}
            className="flex items-center gap-1.5 rounded-lg bg-warm-accent px-3 py-1.5 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] transition-colors">
            <Plus size={13} /> Add Assignment
          </button>
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
                  <th className="px-4 py-3 text-[10px] font-medium tracking-wider text-warm-muted uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.assignments.map(a => (
                  <tr key={a.id} className="border-b border-warm-card-border last:border-0 hover:bg-warm-card/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-warm-cream">{a.subject.name}</td>
                    <td className="px-4 py-3 text-sm text-warm-cream">{a.group.name}</td>
                    <td className="px-4 py-3 text-sm text-warm-muted">{a.group.section || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {a.isClassTeacher ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-warm-accent/20 bg-warm-accent/5 px-2 py-0.5 text-[10px] text-warm-accent">Class Teacher</span>
                        ) : (
                          <span className="text-xs text-warm-muted capitalize">{a.role || 'subject'}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEditAssignment(a)} title="Edit" className="rounded p-1 text-warm-muted hover:text-warm-cream transition-colors">
                          <Edit3 size={13} />
                        </button>
                        <button onClick={() => handleEndAssignment(a)} title="End assignment" className="rounded px-1.5 py-0.5 text-[10px] text-warm-muted hover:text-yellow-300 transition-colors">
                          End
                        </button>
                        <button onClick={() => handleDeleteAssignment(a)} title="Delete" className="rounded p-1 text-warm-muted hover:text-red transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
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

      {/* Timetables — shows timetable entries where teacher is tagged */}
      {teacherTimetables.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-sm font-medium text-warm-cream">Timetables</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {teacherTimetables.map((tt: any) => (
              <div key={tt.id} className="rounded-xl border border-warm-card-border bg-warm-card p-4">
                <h3 className="mb-3 text-xs font-semibold text-warm-accent uppercase tracking-wider">{tt.name}</h3>
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-warm-card-border">
                      <th className="pb-1.5 pr-2 text-[10px] uppercase text-warm-muted">Class</th>
                      <th className="pb-1.5 text-[10px] uppercase text-warm-muted">Timing</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tt.entries.map((entry: any, i: number) => (
                      <tr key={i} className="border-b border-warm-card-border/50 last:border-0">
                        <td className="py-1.5 pr-2 text-warm-cream">
                          {entry.groupName}{entry.groupSection ? ` — ${entry.groupSection}` : ''}
                        </td>
                        <td className="py-1.5 text-warm-cream text-[11px]">
                          <span className="text-warm-accent/70">L{entry.lectureNumber}</span>{' '}
                          {entry.startTime} — {entry.endTime}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Add Assignment Modal ────────────────────────── */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setShowAssignModal(false)}>
          <div className="w-full max-w-md rounded-xl border border-warm-card-border bg-[#24201e] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-warm-cream">{editAssignId ? 'Edit Assignment' : 'Add Assignment'}</h2>
              <button onClick={() => { setShowAssignModal(false); setEditAssignId(null); }} className="text-warm-muted hover:text-warm-cream transition-colors"><X size={16} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs text-warm-muted">Class / Section *</label>
                <select value={assignForm.sectionId} onChange={(e) => setAssignForm(p => ({ ...p, sectionId: e.target.value }))}
                  className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent transition-colors">
                  <option value="">— Select —</option>
                  {sections.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name}{s.section ? ` — ${s.section}` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-warm-muted">Subject *</label>
                <select value={assignForm.subjectId} onChange={(e) => setAssignForm(p => ({ ...p, subjectId: e.target.value }))}
                  className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent transition-colors">
                  <option value="">— Select —</option>
                  {subjects.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name}{s.code ? ` (${s.code})` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-warm-muted">Role</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-xs text-warm-cream cursor-pointer">
                    <input type="radio" name="role" value="primary" checked={assignForm.role === 'primary'} onChange={(e) => setAssignForm(p => ({ ...p, role: e.target.value }))} className="h-3 w-3 text-warm-accent" /> Primary
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-warm-cream cursor-pointer">
                    <input type="radio" name="role" value="assistant" checked={assignForm.role === 'assistant'} onChange={(e) => setAssignForm(p => ({ ...p, role: e.target.value }))} className="h-3 w-3 text-warm-accent" /> Assistant
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-warm-cream cursor-pointer">
                    <input type="radio" name="role" value="hod" checked={assignForm.role === 'hod'} onChange={(e) => setAssignForm(p => ({ ...p, role: e.target.value }))} className="h-3 w-3 text-warm-accent" /> HOD
                  </label>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isClassTeacher" checked={assignForm.isClassTeacher} onChange={(e) => setAssignForm(p => ({ ...p, isClassTeacher: e.target.checked }))} className="h-3.5 w-3.5 rounded border-warm-card-border bg-[#1a1614] text-warm-accent focus:ring-warm-accent" />
                <label htmlFor="isClassTeacher" className="text-xs text-warm-muted">Class Teacher (only one per class)</label>
              </div>
            </div>
            {assignError && <div className="mt-3 rounded-lg border border-red-900/30 bg-red-900/10 px-3 py-2"><p className="text-xs text-red-400">{assignError}</p></div>}
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setShowAssignModal(false)} className="rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream transition-colors">Cancel</button>
              <button onClick={handleSaveAssignment} disabled={savingAssign} className="rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] disabled:opacity-50 transition-colors">
                {savingAssign ? 'Saving…' : editAssignId ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
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
            <p className="mb-4 text-xs text-warm-muted">Enter your own password to confirm saving the teacher&apos;s new credentials.</p>
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
const profileFieldClass =
  'w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent';

function ProfileField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-warm-muted">{label}</label>
      {children}
    </div>
  );
}

function ProfileInput({ value, onChange, placeholder, type = 'text', step }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; step?: string;
}) {
  return (
    <input
      type={type}
      step={step}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={profileFieldClass}
    />
  );
}

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
