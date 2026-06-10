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
  createdAt: string;
  user: {
    id: string; name: string; email: string | null; phone: string | null;
    role: string; status: string;
  };
  _count?: { assignments: number };
}

interface UserOption {
  id: string; name: string; email: string | null;
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
  const [users, setUsers] = useState<UserOption[]>([]);

  // Create-user inline form (create User → then TeacherProfile)
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', username: '', password: '' });

  const [cf, setCf] = useState({ // create form fields
    userId: '', employeeId: '', qualification: '', specialization: '',
    joiningDate: '', salary: '', phone: '', emergencyContact: '',
    address: '', dateOfBirth: '', gender: '', bloodGroup: '',
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
    setCf({ userId: '', employeeId: '', qualification: '', specialization: '', joiningDate: '', salary: '', phone: '', emergencyContact: '', address: '', dateOfBirth: '', gender: '', bloodGroup: '' });
    setNewUser({ name: '', email: '', username: '', password: '' });
    setShowNewUserForm(false);
    setCreateError('');
  };

  const openCreate = async () => {
    resetCreateForm();
    setShowNewUserForm(false);
    setShowCreate(true);
    // Fetch available users with role=teacher
    try {
      const res = await api.getUsers({ role: 'teacher' });
      if (res.success) setUsers(res.data || []);
    } catch {}
  };

  // Step 1: Create a User with role=teacher, then auto-select them
  const handleCreateUser = async () => {
    if (!newUser.name.trim() || !newUser.username.trim() || !newUser.password.trim()) {
      setCreateError('Name, username, and password are required');
      return;
    }
    setCreatingUser(true);
    setCreateError('');
    try {
      const res = await api.createUser({
        name: newUser.name.trim(),
        username: newUser.username.trim(),
        password: newUser.password,
        email: newUser.email.trim() || undefined,
        role: 'teacher',
      });
      const userId = res.data?.id;
      if (userId) {
        // Add to users list and auto-select
        setUsers(prev => [...prev, { id: userId, name: newUser.name.trim(), email: newUser.email.trim() || null }]);
        setCf(p => ({ ...p, userId }));
        setShowNewUserForm(false);
        setNewUser({ name: '', email: '', username: '', password: '' });
        showToast('success', 'User account created. Now fill the teacher profile.');
      }
    } catch (e: any) {
      setCreateError(e.message || 'Failed to create user');
    } finally { setCreatingUser(false); }
  };

  const handleCreate = async () => {
    setCreateError('');
    if (!cf.userId) { setCreateError('Please select a user'); return; }

    setCreating(true);
    try {
      await api.createTeacher({
        userId: cf.userId,
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
      });
      setShowCreate(false);
      resetCreateForm();
      showToast('success', 'Teacher profile created');
      loadTeachers();
    } catch (e: any) {
      setCreateError(e.message || 'Failed to create teacher');
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
      });
      setShowEdit(false);
      showToast('success', 'Teacher profile updated');
      loadTeachers();
    } catch (e: any) {
      setEditError(e.message || 'Failed to update teacher');
    } finally { setEditing(false); }
  };

  // ─── Delete ──────────────────────────────────────────

  const promptDelete = (t: TeacherProfile) => {
    const count = t._count?.assignments ?? 0;
    const hasAssignments = count > 0;

    setConfirm({
      open: true,
      title: hasAssignments ? 'Cannot Delete Teacher' : `Delete "${t.user.name}"?`,
      message: hasAssignments
        ? `This teacher has ${count} active assignment(s). Remove all assignments before deleting the teacher profile.`
        : `"${t.user.name}" (${t.employeeId || 'no employee ID'}) will be deactivated. Their data will be preserved but login disabled.`,
      variant: hasAssignments ? 'warning' : 'danger',
      confirmLabel: hasAssignments ? 'Remove Assignments First' : 'Delete Teacher',
      action: hasAssignments
        ? async () => { setConfirm(p => ({ ...p, open: false })); }
        : async () => {
            try {
              await api.deleteTeacher(t.id);
              showToast('success', 'Teacher profile deactivated');
              loadTeachers();
            } catch (e: any) {
              showToast('error', e.message || 'Failed to delete teacher');
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
                <button onClick={() => promptDelete(t)} className="rounded-lg p-1.5 text-warm-muted hover:text-red/80 hover:bg-warm-card-border/30 transition-colors" title="Delete teacher">
                  <Trash2 size={14} />
                </button>
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
              {/* User selection */}
              <Field label="Select User" required>
                <select value={cf.userId} onChange={(e) => setCf(p => ({ ...p, userId: e.target.value }))}
                  className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent transition-colors">
                  <option value="">— Select a teacher user —</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name}{u.email ? ` (${u.email})` : ''}</option>
                  ))}
                </select>
                {/* Toggle to create new user */}
                {!showNewUserForm && (
                  <button onClick={() => setShowNewUserForm(true)} className="mt-1.5 text-[11px] text-warm-accent hover:underline">
                    + Create a new user account
                  </button>
                )}
              </Field>

              {/* ── Inline Create New User form ── */}
              {showNewUserForm && (
                <div className="rounded-lg border border-warm-accent/20 bg-warm-accent/5 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[11px] font-medium text-warm-cream">New Teacher User</p>
                    <button onClick={() => setShowNewUserForm(false)} className="text-[10px] text-warm-muted hover:text-warm-cream transition-colors">Cancel</button>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Full Name" required>
                        <Input value={newUser.name} onChange={(v) => setNewUser(p => ({ ...p, name: v }))} placeholder="e.g. Ms. Fatima" />
                      </Field>
                      <Field label="Email">
                        <Input value={newUser.email} onChange={(v) => setNewUser(p => ({ ...p, email: v }))} placeholder="e.g. fatima@school.com" />
                      </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Username" required>
                        <Input value={newUser.username} onChange={(v) => setNewUser(p => ({ ...p, username: v }))} placeholder="e.g. fatima_teacher" />
                      </Field>
                      <Field label="Password" required>
                        <Input type="password" value={newUser.password} onChange={(v) => setNewUser(p => ({ ...p, password: v }))} placeholder="Min 6 characters" />
                      </Field>
                    </div>
                    <button onClick={handleCreateUser} disabled={creatingUser}
                      className="w-full rounded-lg bg-warm-accent py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] disabled:opacity-50 transition-colors">
                      {creatingUser ? 'Creating user…' : 'Create User Account'}
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Field label="Employee ID">
                  <Input value={cf.employeeId} onChange={(v) => setCf(p => ({ ...p, employeeId: v }))} placeholder="e.g. TCH-001" />
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
              </div>
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
                <Field label="Gender">
                  <select value={ef.gender} onChange={(e) => setEf(p => ({ ...p, gender: e.target.value }))}
                    className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent transition-colors">
                    <option value="">— Select —</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
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
              </div>
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
