'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { BookOpen, Plus, X, Edit3, Trash2, Link2, Check } from 'lucide-react';
import { showToast } from '@/components/toast';
import ConfirmModal from '@/components/confirm-modal';

interface Subject {
  id: string;
  academicYearId: string;
  name: string;
  code: string | null;
  description: string | null;
  totalMarks: number;
  passingMarks: number;
  isElective: boolean;
  hodId: string | null;
  hod: { id: string; name: string } | null;
  _count: { groupSubjects: number; teacherAssignments: number };
}

export default function SubjectsPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [branchId, setBranchId] = useState('');

  // AY context
  const activeAYId = typeof window !== 'undefined' ? localStorage.getItem('activeAYId') : null;

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [cf, setCf] = useState({ name: '', code: '', description: '', totalMarks: '100', passingMarks: '50', isElective: false, hodId: '' });

  // Edit modal
  const [showEdit, setShowEdit] = useState(false);
  const [editId, setEditId] = useState('');
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState('');
  const [ef, setEf] = useState({ name: '', code: '', description: '', totalMarks: '100', passingMarks: '50', isElective: false, hodId: '' });

  // Delete confirm
  const [confirm, setConfirm] = useState<{
    open: boolean; title: string; message: string;
    variant: 'danger' | 'warning' | 'default';
    confirmLabel: string; action: () => Promise<void>;
  }>({ open: false, title: '', message: '', variant: 'default', confirmLabel: 'Confirm', action: async () => {} });

  useEffect(() => {
    const bId = localStorage.getItem('activeBranchId');
    if (!bId) { setError('No branch selected'); setLoading(false); return; }
    setBranchId(bId);
    loadSubjects(bId);
  }, []);

  const loadSubjects = (bId: string) => {
    if (!activeAYId) {
      setError('Select an academic year from the sidebar first, then press Go.');
      setLoading(false);
      return;
    }
    api.getSubjects(bId, activeAYId)
      .then(d => setSubjects(d.data || []))
      .catch(() => setError('Failed to load subjects'))
      .finally(() => setLoading(false));
  };

  // ─── Create ──────────────────────────────────────────

  const resetCreate = () => {
    setCf({ name: '', code: '', description: '', totalMarks: '100', passingMarks: '50', isElective: false, hodId: '' });
    setCreateError('');
  };

  const handleCreate = async () => {
    if (!cf.name.trim()) { setCreateError('Subject name is required'); return; }
    setCreating(true);
    try {
      await api.createSubject(branchId, activeAYId!, {
        name: cf.name.trim(),
        code: cf.code.trim() || undefined,
        description: cf.description.trim() || undefined,
        totalMarks: Number(cf.totalMarks),
        passingMarks: Number(cf.passingMarks),
        isElective: cf.isElective,
        hodId: cf.hodId || undefined,
      });
      setShowCreate(false);
      resetCreate();
      showToast('success', 'Subject created');
      loadSubjects(branchId);
    } catch (e: any) {
      setCreateError(e.message || 'Failed to create');
    } finally { setCreating(false); }
  };

  // ─── Edit ────────────────────────────────────────────

  const openEdit = (s: Subject) => {
    setEditId(s.id);
    setEf({
      name: s.name,
      code: s.code || '',
      description: s.description || '',
      totalMarks: String(s.totalMarks),
      passingMarks: String(s.passingMarks),
      isElective: s.isElective,
      hodId: s.hodId || '',
    });
    setEditError('');
    setShowEdit(true);
  };

  const handleUpdate = async () => {
    if (!ef.name.trim()) { setEditError('Subject name cannot be empty'); return; }
    setEditing(true);
    try {
      await api.updateSubject(branchId, editId, {
        name: ef.name.trim(),
        code: ef.code.trim() || undefined,
        description: ef.description.trim() || undefined,
        totalMarks: Number(ef.totalMarks),
        passingMarks: Number(ef.passingMarks),
        isElective: ef.isElective,
        hodId: ef.hodId || null,
      });
      setShowEdit(false);
      showToast('success', 'Subject updated');
      loadSubjects(branchId);
    } catch (e: any) {
      setEditError(e.message || 'Failed to update');
    } finally { setEditing(false); }
  };

  // ─── Delete ──────────────────────────────────────────

  const promptDelete = (s: Subject) => {
    const hasLinks = s._count.groupSubjects > 0 || s._count.teacherAssignments > 0;
    setConfirm({
      open: true,
      title: hasLinks ? 'Cannot Delete Subject' : `Delete "${s.name}"?`,
      message: hasLinks
        ? `"${s.name}" is linked to ${s._count.groupSubjects} class(es) and ${s._count.teacherAssignments} teacher assignment(s). Unlink first.`
        : `"${s.name}" will be permanently removed from this academic year.`,
      variant: hasLinks ? 'warning' : 'danger',
      confirmLabel: hasLinks ? 'Got it' : 'Delete',
      action: hasLinks
        ? async () => {}
        : async () => {
            try {
              await api.deleteSubject(branchId, s.id);
              showToast('success', 'Subject deleted');
              loadSubjects(branchId);
            } catch (e: any) {
              showToast('error', e.message || 'Failed to delete');
            }
          },
    });
  };

  // ─── Link to Classes ───────────────────────────────

  const [linkSubjectId, setLinkSubjectId] = useState<string | null>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
  const [linking, setLinking] = useState(false);

  const openLinkModal = async (s: Subject) => {
    setLinkSubjectId(s.id);
    setSelectedGroupIds(new Set());
    if (!activeAYId) return;
    try {
      // Fetch existing linked groups
      const subjectData = await api.getSubject(branchId, s.id);
      const linkedIds = subjectData.data?.groupSubjects?.map((gs: any) => gs.group.id) || [];
      setSelectedGroupIds(new Set(linkedIds));

      // Fetch all sections for this AY
      const secData = await api.getSections(branchId, activeAYId);
      setSections(secData.data || []);
    } catch {}
  };

  const toggleGroup = (groupId: string) => {
    setSelectedGroupIds(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId); else next.add(groupId);
      return next;
    });
  };

  const handleSaveLinks = async () => {
    if (!linkSubjectId) return;
    setLinking(true);
    try {
      // Get currently linked groups from the subject data we already fetched
      const subjectData = await api.getSubject(branchId, linkSubjectId);
      const currentLinked: string[] = subjectData.data?.groupSubjects?.map((gs: any) => gs.group.id) || [];

      // Unlink removed
      for (const gid of currentLinked) {
        if (!selectedGroupIds.has(gid)) {
          await api.unlinkSubjectGroup(branchId, linkSubjectId, gid).catch(() => {});
        }
      }
      // Link new
      const toAdd = Array.from(selectedGroupIds).filter(gid => !currentLinked.includes(gid));
      if (toAdd.length > 0) {
        await api.linkSubjectGroups(branchId, linkSubjectId, toAdd);
      }
      setLinkSubjectId(null);
      showToast('success', 'Links updated');
      loadSubjects(branchId);
    } catch (e: any) {
      showToast('error', e.message || 'Failed to update links');
    } finally { setLinking(false); }
  };

  // ─── Render ──────────────────────────────────────────

  if (!activeAYId) {
    return (
      <div className="rounded-xl border border-warm-card-border bg-warm-card p-10 text-center">
        <BookOpen size={32} className="mx-auto mb-3 text-warm-muted" />
        <p className="text-sm text-warm-muted">No academic year selected.</p>
        <p className="mt-1 text-xs text-warm-muted/60">Select a year from the sidebar and press Go.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl bg-warm-card animate-pulse" />)}</div>;
  }

  if (error) {
    return <div className="rounded-lg border border-warm-card-border bg-warm-card px-4 py-3 text-xs text-[#b39a76]">{error}</div>;
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium text-warm-cream">Subjects</h2>
          <p className="text-xs text-warm-muted mt-0.5">Manage subjects for the selected academic year.</p>
        </div>
        <button onClick={() => { resetCreate(); setShowCreate(true); }}
          className="flex items-center gap-1.5 rounded-lg bg-warm-accent px-3.5 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] transition-colors">
          <Plus size={14} /> Add Subject
        </button>
      </div>

      {subjects.length === 0 ? (
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-10 text-center">
          <BookOpen size={28} className="mx-auto mb-3 text-warm-muted" />
          <p className="text-sm text-warm-muted">No subjects yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {subjects.map(s => {
            const hasLinks = s._count.groupSubjects > 0 || s._count.teacherAssignments > 0;
            return (
              <div key={s.id} className="flex items-center justify-between rounded-xl border border-warm-card-border bg-warm-card p-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-warm-accent/10">
                    <BookOpen size={16} className="text-warm-accent" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-warm-cream">{s.name}</span>
                      {s.code && <span className="text-[10px] font-mono text-warm-muted/60">{s.code}</span>}
                      {s.hod && <span className="text-[10px] text-warm-accent">HOD: {s.hod.name}</span>}
                    </div>
                    <p className="text-xs text-warm-muted mt-0.5">
                      {s.totalMarks} marks · {s.passingMarks} passing
                      {s.isElective ? ' · Elective' : ''}
                      {s._count.groupSubjects > 0 && ` · ${s._count.groupSubjects} class(es)`}
                      {s._count.teacherAssignments > 0 && ` · ${s._count.teacherAssignments} assignment(s)`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-3">
                  <button onClick={() => openLinkModal(s)} title="Link to classes" className="rounded-lg p-1.5 text-warm-muted hover:text-warm-cream hover:bg-warm-card-border/30 transition-colors">
                    <Link2 size={14} />
                  </button>
                  <button onClick={() => openEdit(s)} title="Edit" className="rounded-lg p-1.5 text-warm-muted hover:text-warm-cream hover:bg-warm-card-border/30 transition-colors">
                    <Edit3 size={14} />
                  </button>
                  <button onClick={() => promptDelete(s)} title={hasLinks ? 'Linked to classes' : 'Delete'}
                    className={`rounded-lg p-1.5 transition-colors ${hasLinks ? 'text-warm-muted/30 cursor-not-allowed' : 'text-warm-muted hover:text-red/80 hover:bg-warm-card-border/30'}`}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create Modal ──────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => { setShowCreate(false); resetCreate(); }}>
          <div className="w-full max-w-md rounded-xl border border-warm-card-border bg-[#24201e] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-warm-cream">Add Subject</h2>
              <button onClick={() => { setShowCreate(false); resetCreate(); }} className="text-warm-muted hover:text-warm-cream transition-colors"><X size={16} /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-warm-muted">Name *</label>
                  <input value={cf.name} onChange={(e) => setCf(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Mathematics" className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent transition-colors" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-warm-muted">Code</label>
                  <input value={cf.code} onChange={(e) => setCf(p => ({ ...p, code: e.target.value }))} placeholder="e.g. MATH" className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent transition-colors uppercase" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-warm-muted">Description</label>
                <input value={cf.description} onChange={(e) => setCf(p => ({ ...p, description: e.target.value }))} placeholder="e.g. Algebra, Geometry" className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-warm-muted">Total Marks</label>
                  <input type="number" value={cf.totalMarks} onChange={(e) => setCf(p => ({ ...p, totalMarks: e.target.value }))} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent transition-colors" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-warm-muted">Passing Marks</label>
                  <input type="number" value={cf.passingMarks} onChange={(e) => setCf(p => ({ ...p, passingMarks: e.target.value }))} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent transition-colors" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="createElective" checked={cf.isElective} onChange={(e) => setCf(p => ({ ...p, isElective: e.target.checked }))} className="h-3.5 w-3.5 rounded border-warm-card-border bg-[#1a1614] text-warm-accent focus:ring-warm-accent" />
                <label htmlFor="createElective" className="text-xs text-warm-muted">This is an elective subject</label>
              </div>
            </div>
            {createError && <div className="mt-3 rounded-lg border border-red-900/30 bg-red-900/10 px-3 py-2"><p className="text-xs text-red-400">{createError}</p></div>}
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => { setShowCreate(false); resetCreate(); }} className="rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream transition-colors">Cancel</button>
              <button onClick={handleCreate} disabled={creating} className="rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] disabled:opacity-50 transition-colors">
                {creating ? 'Creating…' : 'Create Subject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ────────────────────────────────── */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setShowEdit(false)}>
          <div className="w-full max-w-md rounded-xl border border-warm-card-border bg-[#24201e] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-warm-cream">Edit Subject</h2>
              <button onClick={() => setShowEdit(false)} className="text-warm-muted hover:text-warm-cream transition-colors"><X size={16} /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-warm-muted">Name *</label>
                  <input value={ef.name} onChange={(e) => setEf(p => ({ ...p, name: e.target.value }))} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent transition-colors" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-warm-muted">Code</label>
                  <input value={ef.code} onChange={(e) => setEf(p => ({ ...p, code: e.target.value }))} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent transition-colors uppercase" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-warm-muted">Description</label>
                <input value={ef.description} onChange={(e) => setEf(p => ({ ...p, description: e.target.value }))} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-warm-muted">Total Marks</label>
                  <input type="number" value={ef.totalMarks} onChange={(e) => setEf(p => ({ ...p, totalMarks: e.target.value }))} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent transition-colors" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-warm-muted">Passing Marks</label>
                  <input type="number" value={ef.passingMarks} onChange={(e) => setEf(p => ({ ...p, passingMarks: e.target.value }))} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent transition-colors" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="editElective" checked={ef.isElective} onChange={(e) => setEf(p => ({ ...p, isElective: e.target.checked }))} className="h-3.5 w-3.5 rounded border-warm-card-border bg-[#1a1614] text-warm-accent focus:ring-warm-accent" />
                <label htmlFor="editElective" className="text-xs text-warm-muted">This is an elective subject</label>
              </div>
              <div>
                <label className="mb-1 block text-xs text-warm-muted">Head of Department (User ID)</label>
                <input value={ef.hodId} onChange={(e) => setEf(p => ({ ...p, hodId: e.target.value }))} placeholder="Leave empty to clear" className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent transition-colors" />
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

      {/* ── Link to Classes Modal ────────────────────────── */}
      {linkSubjectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setLinkSubjectId(null)}>
          <div className="w-full max-w-md rounded-xl border border-warm-card-border bg-[#24201e] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-warm-cream">Link to Classes</h2>
              <button onClick={() => setLinkSubjectId(null)} className="text-warm-muted hover:text-warm-cream transition-colors"><X size={16} /></button>
            </div>
            <p className="mb-3 text-xs text-warm-muted">Select which classes teach this subject:</p>
            {sections.length === 0 ? (
              <p className="text-xs text-warm-muted">No classes/sections found for this academic year.</p>
            ) : (
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {sections.map((sec: any) => (
                  <label key={sec.id} className="flex items-center gap-2.5 rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 cursor-pointer hover:border-warm-accent/50 transition-colors">
                    <input type="checkbox" checked={selectedGroupIds.has(sec.id)} onChange={() => toggleGroup(sec.id)} className="h-3.5 w-3.5 rounded border-warm-card-border bg-[#1a1614] text-warm-accent focus:ring-warm-accent" />
                    <span className="text-sm text-warm-cream">{sec.name}{sec.section ? ` · ${sec.section}` : ''}</span>
                  </label>
                ))}
              </div>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setLinkSubjectId(null)} className="rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream transition-colors">Cancel</button>
              <button onClick={handleSaveLinks} disabled={linking} className="rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] disabled:opacity-50 transition-colors">
                {linking ? 'Saving…' : 'Save Links'}
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
    </div>
  );
}
