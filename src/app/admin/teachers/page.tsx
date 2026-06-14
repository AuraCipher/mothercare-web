'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  Plus, GraduationCap, Search, X, Edit3, Trash2, ExternalLink,
  BookOpen, MapPin, Calendar, DollarSign, Phone, Mail, User,
} from 'lucide-react';
import { showToast } from '@/components/toast';
import ConfirmModal from '@/components/confirm-modal';

interface TeacherProfile {
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
  fatherName: string | null;
  cardId: string | null;
  severeDisease: string | null;
  experience: string | null;
  bio: string | null;
  createdAt: string;
  user: {
    id: string; name: string; email: string | null; phone: string | null;
    role: string; status: string;
  };
  _count?: { assignments: number };
}

/* ── Reusable form field ── */
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-warm-muted">{label}{required && ' *'}</label>
      {children}
    </div>
  );
}

/* ── Form input helper ── */
function Input({ value, onChange, placeholder, type = 'text', step }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; step?: string;
}) {
  return (
    <input
      type={type} step={step} value={value} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent transition-colors"
    />
  );
}

export default function TeachersPage() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [qualFilter, setQualFilter] = useState('');
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const [cf, setCf] = useState({ // create form fields
    name: '', email: '', username: '',
    employeeId: '', qualification: '', specialization: '',
    joiningDate: '', salary: '', phone: '', emergencyContact: '',
    address: '', dateOfBirth: '', gender: '', bloodGroup: '',
    fatherName: '', cardId: '', severeDisease: '', experience: '', bio: '',
  });

  // Edit modal
  const [showEdit, setShowEdit] = useState(false);
  const [editId, setEditId] = useState('');
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState('');
  const [ef, setEf] = useState({ // edit form fields
    employeeId: '', qualification: '', specialization: '',
    joiningDate: '', salary: '', phone: '', emergencyContact: '',
    address: '', dateOfBirth: '', gender: '', bloodGroup: '',
    fatherName: '', cardId: '', severeDisease: '', experience: '', bio: '',
  });

  // Delete confirm
  const [confirm, setConfirm] = useState<{
    open: boolean; title: string; message: string;
    variant: 'danger' | 'warning' | 'default';
    confirmLabel: string; action: () => Promise<void>;
  }>({ open: false, title: '', message: '', variant: 'default', confirmLabel: 'Confirm', action: async () => {} });

  useEffect(() => { loadTeachers(); }, []);

  const loadTeachers = () => {
    const params: any = {};
    if (search) params.search = search;
    if (qualFilter) params.qualification = qualFilter;
    params.page = meta.page;
    params.limit = meta.limit;

    api.getTeachers(params).then(d => {
      if (d.success) {
        setTeachers(d.data || []);
        setMeta(d.meta);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  };

  const handleSearch = () => {
    setLoading(true);
    setMeta(m => ({ ...m, page: 1 }));
    loadTeachers();
  };

  // ─── Create ──────────────────────────────────────────

  const resetCreateForm = () => {
    setCf({ name: '', email: '', username: '', employeeId: '', qualification: '', specialization: '', joiningDate: '', salary: '', phone: '', emergencyContact: '', address: '', dateOfBirth: '', gender: '', bloodGroup: '', fatherName: '', cardId: '', severeDisease: '', experience: '', bio: '' });
    setCreateError('');
  };

  const openCreate = () => {
    resetCreateForm();
    setShowCreate(true);
  };

  const handleCreate = async () => {
    setCreateError('');
    if (!cf.name || !cf.username) {
      setCreateError('Name and username are required');
      return;
    }

    setCreating(true);
    try {
      // Auto-generate a temporary random password
      const tempPassword = 'tmp_' + Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 6);
      const branchId = localStorage.getItem('activeBranchId') || '';
      await api.createTeacher({
        name: cf.name.trim(),
        email: cf.email.trim() || undefined,
        username: cf.username.trim(),
        password: tempPassword,
        branchId,
        employeeId: cf.employeeId || undefined,
        qualification: cf.qualification || undefined,
        specialization: cf.specialization || undefined,
        joiningDate: cf.joiningDate || undefined,
        salary: cf.salary ? Number(cf.salary) : undefined,
        phone: cf.phone || undefined,
        emergencyContact: cf.emergencyContact || undefined,
        address: cf.address || undefined,
        dateOfBirth: cf.dateOfBirth || undefined,
        gender: cf.gender || undefined,
        bloodGroup: cf.bloodGroup || undefined,
        fatherName: cf.fatherName || undefined,
        cardId: cf.cardId || undefined,
        severeDisease: cf.severeDisease || undefined,
        experience: cf.experience || undefined,
        bio: cf.bio || undefined,
      });
      setShowCreate(false);
      resetCreateForm();
      showToast('success', 'Teacher profile created');
      loadTeachers();
    } catch (e: any) {
      const msg = e.message || '';
      // Show friendly messages for known errors
      if (msg.includes('already exists') || msg.includes('already in use')) {
        setCreateError(msg);
        showToast('error', msg);
      } else {
        setCreateError(msg || 'Failed to create teacher');
      }
    } finally { setCreating(false); }
  };

  // ─── Edit ────────────────────────────────────────────

  const openEdit = (t: TeacherProfile) => {
    setEditId(t.id);
    setEf({
      employeeId: t.employeeId || '',
      qualification: t.qualification || '',
      specialization: t.specialization || '',
      joiningDate: t.joiningDate ? t.joiningDate.substring(0, 10) : '',
      salary: t.salary || '',
      phone: t.phone || '',
      emergencyContact: t.emergencyContact || '',
      address: t.address || '',
      dateOfBirth: t.dateOfBirth ? t.dateOfBirth.substring(0, 10) : '',
      gender: t.gender || '',
      bloodGroup: t.bloodGroup || '',
      fatherName: t.fatherName || '',
      cardId: t.cardId || '',
      severeDisease: t.severeDisease || '',
      experience: t.experience || '',
      bio: t.bio || '',
    });
    setEditError('');
    setShowEdit(true);
  };

  const handleUpdate = async () => {
    setEditError('');
    setEditing(true);
    try {
      await api.updateTeacher(editId, {
        employeeId: ef.employeeId || undefined,
        qualification: ef.qualification || undefined,
        specialization: ef.specialization || undefined,
        joiningDate: ef.joiningDate || undefined,
        salary: ef.salary ? Number(ef.salary) : undefined,
        phone: ef.phone || undefined,
        emergencyContact: ef.emergencyContact || undefined,
        address: ef.address || undefined,
        dateOfBirth: ef.dateOfBirth || undefined,
        gender: ef.gender || undefined,
        bloodGroup: ef.bloodGroup || undefined,
        fatherName: ef.fatherName || undefined,
        cardId: ef.cardId || undefined,
        severeDisease: ef.severeDisease || undefined,
        experience: ef.experience || undefined,
        bio: ef.bio || undefined,
      });
      setShowEdit(false);
      showToast('success', 'Teacher profile updated');
      loadTeachers();
    } catch (e: any) {
      const msg = e.message || '';
      if (msg.includes('already in use')) {
        setEditError(msg);
        showToast('error', msg);
      } else {
        setEditError(msg || 'Failed to update teacher');
      }
    } finally { setEditing(false); }
  };

  // ─── Deactivate / Reactivate / Delete ────────────────

  const promptDeactivate = (t: TeacherProfile) => {
    setConfirm({
      open: true,
      title: `Deactivate "${t.user.name}"?`,
      message: `Their assignments will be ended and login disabled. All teaching history will be preserved. They can be reactivated later.`,
      variant: 'warning',
      confirmLabel: 'Deactivate',
      action: async () => {
        try {
          await api.deactivateTeacher(t.id);
          showToast('success', `"${t.user.name}" deactivated`);
          loadTeachers();
        } catch (e: any) {
          showToast('error', e.message || 'Failed to deactivate');
        }
      },
    });
  };

  const promptReactivate = (t: TeacherProfile) => {
    setConfirm({
      open: true,
      title: `Reactivate "${t.user.name}"?`,
      message: `Their login and branch access will be restored. Past assignments remain as history.`,
      variant: 'default',
      confirmLabel: 'Reactivate',
      action: async () => {
        try {
          await api.reactivateTeacher(t.id);
          showToast('success', `"${t.user.name}" reactivated`);
          loadTeachers();
        } catch (e: any) {
          showToast('error', e.message || 'Failed to reactivate');
        }
      },
    });
  };

  const promptDelete = (t: TeacherProfile) => {
    if ((t._count?.assignments ?? 0) > 0) {
      showToast('error', 'Cannot delete: teacher has assignment history. Deactivate instead.');
      return;
    }
    setConfirm({
      open: true,
      title: `Permanently Delete "${t.user.name}"?`,
      message: `This teacher has no teaching history. They will be permanently removed. This cannot be undone.`,
      variant: 'danger',
      confirmLabel: 'Delete Permanently',
      action: async () => {
        try {
          await api.deleteTeacher(t.id);
          showToast('success', 'Teacher deleted permanently');
          loadTeachers();
        } catch (e: any) {
          showToast('error', e.message || 'Failed to delete');
        }
      },
    });
  };

  // ─── Render ──────────────────────────────────────────

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-xl font-light text-warm-cream">Teachers</h1>
          <p className="text-sm text-warm-muted">Manage teaching staff profiles and assignments.</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-1.5 rounded-lg bg-warm-accent px-4 py-2 text-sm font-medium text-[#1a1614] transition-colors hover:bg-[#b39a76]">
          <Plus size={15} /> Add Teacher
        </button>
      </div>

      {/* Search + Filter */}
      <div className="mb-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-muted" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search by name or employee ID…"
            className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] py-2 pl-9 pr-3 text-sm text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent transition-colors"
          />
        </div>
        <select
          value={qualFilter} onChange={(e) => { setQualFilter(e.target.value); setLoading(true); }}
          className="rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-muted outline-none focus:border-warm-accent transition-colors"
        >
          <option value="">All Qualifications</option>
          <option value="M.Sc">M.Sc</option>
          <option value="B.Ed">B.Ed</option>
          <option value="M.Ed">M.Ed</option>
          <option value="B.Sc">B.Sc</option>
          <option value="PhD">PhD</option>
        </select>
        <button onClick={handleSearch} className="rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream transition-colors">
          Search
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 rounded-xl bg-warm-card animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && teachers.length === 0 && (
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-8 text-center">
          <GraduationCap size={32} className="mx-auto mb-3 text-warm-muted" />
          <p className="text-sm text-warm-muted">No teachers found.</p>
          <button onClick={openCreate} className="mt-4 text-xs text-warm-accent hover:underline">
            Add your first teacher
          </button>
        </div>
      )}

      {/* Teacher cards */}
      {!loading && teachers.length > 0 && (
        <div className="space-y-3">
          {teachers.map(t => (
            <div key={t.id} className="flex items-center justify-between rounded-xl border border-warm-card-border bg-warm-card p-4 transition-colors hover:bg-warm-card/80">
              <button onClick={() => router.push(`/admin/teachers/${t.id}`)} className="flex items-center gap-3 min-w-0 flex-1 text-left">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-warm-accent/10">
                  <GraduationCap size={18} className="text-warm-accent" />
                </div>
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-medium text-warm-cream truncate">
                    {t.user.name}
                    {t.employeeId && <span className="text-[10px] text-warm-muted/60 font-normal">({t.employeeId})</span>}
                  </p>
                  <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-warm-muted mt-0.5">
                    {t.qualification && <span>{t.qualification}</span>}
                    {t.specialization && <span>· {t.specialization}</span>}
                    {t._count !== undefined && (
                      <span className="inline-flex items-center gap-1">
                        <BookOpen size={10} /> {t._count.assignments} assignment{t._count.assignments !== 1 ? 's' : ''}
                      </span>
                    )}
                    <span className={`inline-flex items-center gap-1 ${
                      t.user.status === 'active' ? 'text-green-400' : 'text-warm-muted/50'
                    }`}>
                      <span className={`inline-block h-1.5 w-1.5 rounded-full ${t.user.status === 'active' ? 'bg-green-400' : 'bg-gray-500'}`} />
                      {t.user.status}
                    </span>
                  </p>
                </div>
              </button>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                <button onClick={() => openEdit(t)} className="rounded-lg p-1.5 text-warm-muted hover:text-warm-cream hover:bg-warm-card-border/30 transition-colors" title="Edit teacher">
                  <Edit3 size={14} />
                </button>
                {t.user.status === 'active' ? (
                  <button onClick={() => promptDeactivate(t)} className="rounded-lg p-1.5 text-warm-muted hover:text-red/80 hover:bg-warm-card-border/30 transition-colors" title="Deactivate teacher">
                    <Trash2 size={14} />
                  </button>
                ) : (
                  <button onClick={() => promptReactivate(t)} className="rounded-lg p-1.5 text-warm-muted hover:text-green-400 hover:bg-warm-card-border/30 transition-colors" title="Reactivate teacher">
                    <span className="text-[13px]">↻</span>
                  </button>
                )}
                {(t._count?.assignments ?? 0) === 0 && t.user.status !== 'active' && (
                  <button onClick={() => promptDelete(t)} className="rounded-lg p-1.5 text-warm-muted hover:text-red/80 hover:bg-warm-card-border/30 transition-colors" title="Delete permanently">
                    <span className="text-[11px]">✕</span>
                  </button>
                )}
                <button onClick={() => router.push(`/admin/teachers/${t.id}`)} className="rounded-lg p-1.5 text-warm-muted hover:text-warm-cream hover:bg-warm-card-border/30 transition-colors" title="View details">
                  <ExternalLink size={14} />
                </button>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-warm-muted">
                {meta.total} teacher{meta.total !== 1 ? 's' : ''} · Page {meta.page} of {meta.totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  disabled={meta.page <= 1}
                  onClick={() => { setMeta(m => ({ ...m, page: m.page - 1 })); setLoading(true); }}
                  className="rounded-lg border border-warm-card-border px-3 py-1.5 text-xs text-warm-muted hover:text-warm-cream disabled:opacity-30 transition-colors"
                >
                  Previous
                </button>
                <button
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => { setMeta(m => ({ ...m, page: m.page + 1 })); setLoading(true); }}
                  className="rounded-lg border border-warm-card-border px-3 py-1.5 text-xs text-warm-muted hover:text-warm-cream disabled:opacity-30 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════
          CREATE MODAL
         ════════════════════════════════════════════ */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => { setShowCreate(false); resetCreateForm(); }}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-warm-card-border bg-[#24201e] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-warm-cream">Add Teacher Profile</h2>
              <button onClick={() => { setShowCreate(false); resetCreateForm(); }} className="text-warm-muted hover:text-warm-cream transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              {/* User identity fields — creates the User account automatically */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Full Name" required>
                  <Input value={cf.name} onChange={(v) => setCf(p => ({ ...p, name: v }))} placeholder="e.g. Ms. Fatima" />
                </Field>
                <Field label="Email">
                  <Input value={cf.email} onChange={(v) => setCf(p => ({ ...p, email: v }))} placeholder="e.g. fatima@school.com" />
                </Field>
              </div>
              <Field label="Username" required>
                <Input value={cf.username} onChange={(v) => setCf(p => ({ ...p, username: v }))} placeholder="e.g. fatima_teacher" />
              </Field>

              <hr className="border-warm-card-border" />
              <p className="text-[10px] font-medium tracking-wider text-warm-muted uppercase">Professional Details</p>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Employee ID">
                  <Input value={cf.employeeId} onChange={(v) => setCf(p => ({ ...p, employeeId: v }))} placeholder="e.g. TCH-001" />
                </Field>
                <Field label="Father Name">
                  <Input value={cf.fatherName} onChange={(v) => setCf(p => ({ ...p, fatherName: v }))} placeholder="e.g. Muhammad" />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Qualification">
                  <Input value={cf.qualification} onChange={(v) => setCf(p => ({ ...p, qualification: v }))} placeholder="e.g. M.Sc. Mathematics" />
                </Field>
                <Field label="Specialization">
                  <Input value={cf.specialization} onChange={(v) => setCf(p => ({ ...p, specialization: v }))} placeholder="e.g. Mathematics" />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Joining Date">
                  <Input type="date" value={cf.joiningDate} onChange={(v) => setCf(p => ({ ...p, joiningDate: v }))} />
                </Field>
                <Field label="Date of Birth">
                  <Input type="date" value={cf.dateOfBirth} onChange={(v) => setCf(p => ({ ...p, dateOfBirth: v }))} />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Phone">
                  <Input value={cf.phone} onChange={(v) => setCf(p => ({ ...p, phone: v }))} placeholder="e.g. +92 300 1234567" />
                </Field>
                <Field label="Emergency Contact">
                  <Input value={cf.emergencyContact} onChange={(v) => setCf(p => ({ ...p, emergencyContact: v }))} placeholder="e.g. +92 300 7654321" />
                </Field>
              </div>

              <Field label="Address">
                <Input value={cf.address} onChange={(v) => setCf(p => ({ ...p, address: v }))} placeholder="e.g. 123 School St, Islamabad" />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Salary">
                  <Input type="number" step="0.01" value={cf.salary} onChange={(v) => setCf(p => ({ ...p, salary: v }))} placeholder="e.g. 50000" />
                </Field>
                <Field label="Blood Group">
                  <Input value={cf.bloodGroup} onChange={(v) => setCf(p => ({ ...p, bloodGroup: v }))} placeholder="e.g. A+" />
                </Field>
                <Field label="Card ID">
                  <Input value={cf.cardId} onChange={(v) => setCf(p => ({ ...p, cardId: v }))} placeholder="National ID card number" />
                </Field>
                <Field label="Severe Disease">
                  <Input value={cf.severeDisease} onChange={(v) => setCf(p => ({ ...p, severeDisease: v }))} placeholder="Any severe medical condition" />
                </Field>
                <Field label="Gender">
                  <select value={cf.gender} onChange={(e) => setCf(p => ({ ...p, gender: e.target.value }))}
                    className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent transition-colors">
                    <option value="">— Select —</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </Field>
                <Field label="Experience">
                  <Input value={cf.experience} onChange={(v) => setCf(p => ({ ...p, experience: v }))} placeholder="e.g. 5 years" />
                </Field>
              </div>

              <Field label="Bio">
                <textarea value={cf.bio} onChange={(e) => setCf(p => ({ ...p, bio: e.target.value }))} placeholder="Short summary about the teacher" rows={3}
                  className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent transition-colors resize-none" />
              </Field>
            </div>

            {createError && <div className="mt-3 rounded-lg border border-red-900/30 bg-red-900/10 px-3 py-2"><p className="text-xs text-red-400">{createError}</p></div>}

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => { setShowCreate(false); resetCreateForm(); }} className="rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream transition-colors">Cancel</button>
              <button onClick={handleCreate} disabled={creating} className="rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] disabled:opacity-50 transition-colors">
                {creating ? 'Creating…' : 'Create Teacher'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════
          EDIT MODAL
         ════════════════════════════════════════════ */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setShowEdit(false)}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-warm-card-border bg-[#24201e] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-warm-cream">Edit Teacher Profile</h2>
              <button onClick={() => setShowEdit(false)} className="text-warm-muted hover:text-warm-cream transition-colors"><X size={16} /></button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Employee ID">
                  <Input value={ef.employeeId} onChange={(v) => setEf(p => ({ ...p, employeeId: v }))} />
                </Field>
                <Field label="Father Name">
                  <Input value={ef.fatherName} onChange={(v) => setEf(p => ({ ...p, fatherName: v }))} placeholder="e.g. Muhammad" />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Qualification">
                  <Input value={ef.qualification} onChange={(v) => setEf(p => ({ ...p, qualification: v }))} />
                </Field>
                <Field label="Specialization">
                  <Input value={ef.specialization} onChange={(v) => setEf(p => ({ ...p, specialization: v }))} />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Joining Date">
                  <Input type="date" value={ef.joiningDate} onChange={(v) => setEf(p => ({ ...p, joiningDate: v }))} />
                </Field>
                <Field label="Date of Birth">
                  <Input type="date" value={ef.dateOfBirth} onChange={(v) => setEf(p => ({ ...p, dateOfBirth: v }))} />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Phone">
                  <Input value={ef.phone} onChange={(v) => setEf(p => ({ ...p, phone: v }))} />
                </Field>
                <Field label="Emergency Contact">
                  <Input value={ef.emergencyContact} onChange={(v) => setEf(p => ({ ...p, emergencyContact: v }))} />
                </Field>
              </div>

              <Field label="Address">
                <Input value={ef.address} onChange={(v) => setEf(p => ({ ...p, address: v }))} />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Salary">
                  <Input type="number" step="0.01" value={ef.salary} onChange={(v) => setEf(p => ({ ...p, salary: v }))} />
                </Field>
                <Field label="Blood Group">
                  <Input value={ef.bloodGroup} onChange={(v) => setEf(p => ({ ...p, bloodGroup: v }))} />
                </Field>
                <Field label="Card ID">
                  <Input value={ef.cardId} onChange={(v) => setEf(p => ({ ...p, cardId: v }))} placeholder="National ID card number" />
                </Field>
                <Field label="Severe Disease">
                  <Input value={ef.severeDisease} onChange={(v) => setEf(p => ({ ...p, severeDisease: v }))} placeholder="Any severe medical condition" />
                </Field>
                <Field label="Gender">
                  <select value={ef.gender} onChange={(e) => setEf(p => ({ ...p, gender: e.target.value }))}
                    className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent transition-colors">
                    <option value="">— Select —</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </Field>
                <Field label="Experience">
                  <Input value={ef.experience} onChange={(v) => setEf(p => ({ ...p, experience: v }))} placeholder="e.g. 5 years" />
                </Field>
              </div>

              <Field label="Bio">
                <textarea value={ef.bio} onChange={(e) => setEf(p => ({ ...p, bio: e.target.value }))} placeholder="Short summary about the teacher" rows={3}
                  className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent transition-colors resize-none" />
              </Field>
            </div>

            {editError && <div className="mt-3 rounded-lg border border-red-900/30 bg-red-900/10 px-3 py-2"><p className="text-xs text-red-400">{editError}</p></div>}

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setShowEdit(false)} className="rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream transition-colors">Cancel</button>
              <button onClick={handleUpdate} disabled={editing} className="rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] disabled:opacity-50 transition-colors">
                {editing ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Modal (delete) ────────────────── */}
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
