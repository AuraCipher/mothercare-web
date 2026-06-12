'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Plus, Trash2, ChevronDown, ChevronRight, GripVertical, BookOpen, Link2, X, Check, Edit3 } from 'lucide-react';
import { showToast } from '@/components/toast';
import ConfirmModal from '@/components/confirm-modal';

interface Section {
  id: string;
  name: string;
  section: string | null;
  displayOrder: number;
  capacity: number;
  isActive: boolean;
  _count?: { members: number; students: number };
}

export default function ClassesPage() {
  const router = useRouter();
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');
  const isReadOnly = localStorage.getItem('activeAYStatus') === 'ARCHIVED';

  // Branch + AY context
  const [branchId, setBranchId] = useState<string>('');
  const [ayId, setAyId] = useState<string>('');

  // Subject link modal (per-section)
  const [linkClassName, setLinkClassName] = useState<string | null>(null);
  const [linkSections, setLinkSections] = useState<any[]>([]);
  const [allSubjects, setAllSubjects] = useState<any[]>([]);
  const [sectionSubjectMap, setSectionSubjectMap] = useState<Record<string, Set<string>>>({});
  const [linkExpanded, setLinkExpanded] = useState<Record<string, boolean>>({});
  const [savingLinks, setSavingLinks] = useState(false);

  // Form state
  const [className, setClassName] = useState('');
  const [arrangement, setArrangement] = useState('');
  const [enableSections, setEnableSections] = useState(false);
  const [sectionList, setSectionList] = useState<string[]>([]);
  const [sectionInput, setSectionInput] = useState('');

  // Edit modal
  const [showEditForm, setShowEditForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState('');
  const [editClassName, setEditClassName] = useState('');
  const [editArrangement, setEditArrangement] = useState('');
  const [editSections, setEditSections] = useState<any[]>([]); // existing sections being edited
  const [editNewSections, setEditNewSections] = useState<string[]>([]);
  const [editSectionInput, setEditSectionInput] = useState('');

  // Confirm modal
  const [confirm, setConfirm] = useState<{
    open: boolean; title: string; message: string;
    variant: 'danger' | 'warning' | 'default';
    confirmLabel: string; action: () => Promise<void>;
  }>({ open: false, title: '', message: '', variant: 'danger', confirmLabel: 'Confirm', action: async () => {} });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }

    const activeBranchId = localStorage.getItem('activeBranchId');
    if (!activeBranchId) {
      setError('No branch selected. Select a branch from the sidebar.');
      setLoading(false);
      return;
    }
    setBranchId(activeBranchId);

    // Use AY from localStorage (sidebar dropdown) or fall back to ACTIVE
    const storedAyId = localStorage.getItem('activeAYId');
    if (storedAyId) {
      setAyId(storedAyId);
      api.getSections(activeBranchId, storedAyId)
        .then(res => setSections(res.data || []))
        .catch(() => setError('Failed to load sections'))
        .finally(() => setLoading(false));
    } else {
      api.getAcademicYears(activeBranchId, 'ACTIVE')
        .then(d => {
          const activeAy = d.data?.[0];
          if (!activeAy) {
            setError('No active academic year found. Create and publish one first.');
            setLoading(false);
            return;
          }
          setAyId(activeAy.id);
          api.getSections(activeBranchId, activeAy.id)
            .then(res => setSections(res.data || []))
            .catch(() => setError('Failed to load sections'))
            .finally(() => setLoading(false));
        })
        .catch(() => {
          setError('Failed to load academic year');
          setLoading(false);
        });
    }
  }, []);

  // Group sections by class name
  const grouped = sections.reduce<Record<string, Section[]>>((acc, s) => {
    if (!acc[s.name]) acc[s.name] = [];
    acc[s.name].push(s);
    return acc;
  }, {});

  const sortedClassNames = Object.keys(grouped).sort((a, b) => {
    const orderA = grouped[a][0]?.displayOrder ?? 0;
    const orderB = grouped[b][0]?.displayOrder ?? 0;
    return orderA - orderB;
  });

  const handleCreate = async () => {
    if (!className.trim() || !arrangement) return;

    const order = parseInt(arrangement, 10);
    if (isNaN(order)) return;

    try {
      if (enableSections && sectionList.length > 0) {
        for (const section of sectionList) {
          await api.createSection(branchId, ayId, { name: className.trim(), section, displayOrder: order });
        }
      } else {
        await api.createSection(branchId, ayId, { name: className.trim(), displayOrder: order });
      }
      setShowForm(false);
      resetForm();
      showToast('success', 'Class created');
      const res = await api.getSections(branchId, ayId);
      setSections(res.data || []);
    } catch (e: any) {
      showToast('error', e.message || 'Failed to create class');
    }
  };

  const resetForm = () => {
    setClassName('');
    setArrangement('');
    setEnableSections(false);
    setSectionList([]);
    setSectionInput('');
  };

  // ─── Edit ──────────────────────────────────────────

  const openEdit = (name: string) => {
    const classSections = grouped[name];
    if (!classSections || classSections.length === 0) return;
    setEditClassName(name);
    setEditArrangement(String(classSections[0].displayOrder));
    setEditSections(classSections);
    setEditNewSections([]);
    setEditSectionInput('');
    setEditError('');
    setShowEditForm(true);
  };

  const handleUpdate = async () => {
    if (!editClassName.trim() || !editArrangement) {
      setEditError('Class name and arrangement are required');
      return;
    }
    const order = parseInt(editArrangement, 10);
    if (isNaN(order)) { setEditError('Invalid arrangement number'); return; }
    setEditing(true);
    try {
      // Update existing sections
      for (const sec of editSections) {
        await api.updateSection(branchId, sec.id, {
          name: editClassName.trim(),
          displayOrder: order,
          section: sec.section || undefined,
        });
      }
      // Create new sections
      for (const s of editNewSections) {
        await api.createSection(branchId, ayId, { name: editClassName.trim(), section: s, displayOrder: order });
      }
      setShowEditForm(false);
      showToast('success', 'Class updated');
      const res = await api.getSections(branchId, ayId);
      setSections(res.data || []);
    } catch (e: any) {
      setEditError(e.message || 'Failed to update');
    } finally { setEditing(false); }
  };

  // Delete a single section (checks for subject links, students, teachers)
  const promptDeleteSection = (id: string, name: string) => {
    setConfirm({
      open: true,
      title: `Delete Section "${name}"?`,
      message: `This section will be deactivated. It will be blocked if subjects, students, or teachers depend on it.`,
      variant: 'danger',
      confirmLabel: 'Delete Section',
      action: async () => {
        try {
          await api.deleteSection(branchId, id);
          showToast('success', 'Section deactivated');
          const res = await api.getSections(branchId, ayId);
          setSections(res.data || []);
        } catch (e: any) {
          showToast('error', e.message || 'Failed to delete');
        }
      },
    });
  };

  // Delete an entire class (all sections under this class name)
  const promptDeleteClass = (className: string) => {
    const classSections = sections.filter(s => s.name === className);
    const deps = classSections.filter(s => (s._count?.students ?? 0) > 0);
    const totalSubjects = classSections.reduce((sum, s) => sum + (s._count?.subjectLinks ?? 0), 0);

    if (deps.length > 0 || totalSubjects > 0) {
      showToast('error', `Cannot delete "${className}": sections have students or subject links. Remove dependencies first.`);
      return;
    }

    setConfirm({
      open: true,
      title: `Delete Entire Class "${className}"?`,
      message: `This will delete all ${classSections.length} section(s) under "${className}". This cannot be undone.`,
      variant: 'danger',
      confirmLabel: `Delete All ${classSections.length} Sections`,
      action: async () => {
        try {
          for (const sec of classSections) {
            await api.deleteSection(branchId, sec.id).catch(() => {});
          }
          showToast('success', `"${className}" deleted`);
          const res = await api.getSections(branchId, ayId);
          setSections(res.data || []);
        } catch (e: any) {
          showToast('error', e.message || 'Failed to delete');
        }
      },
    });
  };

  const toggleExpand = (name: string) => {
    setExpanded((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  // ─── Subject linking ─────────────────────────────

  const openSubjectLink = async (className: string) => {
    setLinkClassName(className);
    if (!ayId) return;
    try {
      const subjData = await api.getSubjects(branchId, ayId);
      setAllSubjects(subjData.data || []);

      // Find all sections with this class name
      const classSections = sections.filter(s => s.name === className);
      setLinkSections(classSections);

      // Load linked subjects for each section
      const map: Record<string, Set<string>> = {};
      const exp: Record<string, boolean> = {};
      for (const sec of classSections) {
        try {
          const linked = await api.getSectionSubjects(branchId, sec.id);
          map[sec.id] = new Set((linked.data || []).map((s: any) => s.id));
        } catch { map[sec.id] = new Set(); }
        exp[sec.id] = true; // start expanded
      }
      setSectionSubjectMap(map);
      setLinkExpanded(exp);
    } catch {}
  };

  const toggleSectionSubject = (sectionId: string, subjectId: string) => {
    setSectionSubjectMap(prev => {
      const next = { ...prev };
      const set = new Set(next[sectionId] || []);
      if (set.has(subjectId)) set.delete(subjectId); else set.add(subjectId);
      next[sectionId] = set;
      return next;
    });
  };

  const handleSaveSubjectLinks = async () => {
    if (!linkClassName || linkSections.length === 0) return;
    setSavingLinks(true);
    try {
      for (const sec of linkSections) {
        const selectedIds = sectionSubjectMap[sec.id] || new Set();
        // Link each selected subject to this section
        for (const subjectId of selectedIds) {
          await api.linkSubjectGroups(branchId, subjectId, [sec.id]).catch(() => {});
        }
      }
      setLinkClassName(null);
      showToast('success', 'Subjects linked');
    } catch (e: any) {
      showToast('error', e.message || 'Failed to update');
    } finally { setSavingLinks(false); }
  };

  // ─── Render ──────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1a1614]">
        <p className="text-sm text-warm-muted">Loading…</p>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      {/* Sub-header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-light text-warm-cream">Classes / Sections</h1>
          <p className="text-sm text-warm-muted">Manage class groups and their sections.</p>
        </div>
        <button onClick={() => setShowForm(true)} disabled={isReadOnly} className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${isReadOnly ? 'bg-warm-card-border/30 text-warm-muted/50 cursor-not-allowed' : 'bg-warm-accent text-[#1a1614] hover:bg-[#b39a76]'}`}>
          <Plus size={14} /> {isReadOnly ? 'Read Only' : 'Add Class'}
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-warm-card-border bg-warm-card px-4 py-2 text-xs text-[#b39a76]">{error}</p>
      )}

      {/* Create form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-md rounded-xl border border-warm-card-border bg-[#24201e] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-sm font-medium text-warm-cream">Add Class</h2>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs text-warm-muted">Class Name</label>
                <input value={className} onChange={(e) => setClassName(e.target.value)} placeholder="e.g. Class 1" className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent" />
              </div>

              <div>
                <label className="mb-1 block text-xs text-warm-muted">Class Arrangement</label>
                <input type="number" value={arrangement} onChange={(e) => setArrangement(e.target.value)} placeholder="e.g. 4" className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent" />
                <p className="mt-0.5 text-[10px] text-warm-muted/60">Determines the order in which classes appear (1 = Playgroup, 13 = Class 10).</p>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="enableSections" checked={enableSections} onChange={(e) => setEnableSections(e.target.checked)} className="h-3.5 w-3.5 rounded border-warm-card-border bg-[#1a1614] text-warm-accent focus:ring-warm-accent" />
                <label htmlFor="enableSections" className="text-xs text-warm-cream">Enable sections for this class</label>
              </div>

              {enableSections && (
                <div>
                  <label className="mb-1 block text-xs text-warm-muted">Sections</label>
                  <div className="flex flex-wrap gap-1.5 mb-1.5">
                    {sectionList.map((s, i) => (
                      <span key={i} className="inline-flex items-center gap-1 rounded-md border border-warm-accent/30 bg-warm-accent/10 px-2 py-0.5 text-xs text-warm-accent">
                        {s}
                        <button onClick={() => setSectionList(sectionList.filter((_, j) => j !== i))} className="text-warm-accent/60 hover:text-warm-accent transition-colors">
                          <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2}><path d="M4 4l8 8M12 4l-8 8"/></svg>
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    value={sectionInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val.endsWith(',') || val.endsWith('，')) {
                        const tag = val.slice(0, -1).trim();
                        if (tag && !sectionList.includes(tag)) setSectionList([...sectionList, tag]);
                        setSectionInput('');
                      } else {
                        setSectionInput(val);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const tag = sectionInput.trim();
                        if (tag && !sectionList.includes(tag)) setSectionList([...sectionList, tag]);
                        setSectionInput('');
                      }
                      if (e.key === 'Backspace' && sectionInput === '' && sectionList.length > 0) {
                        setSectionList(sectionList.slice(0, -1));
                      }
                    }}
                    placeholder={sectionList.length === 0 ? 'Type and press Enter — e.g. A' : 'Add another…'}
                    className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent" />
                  <p className="mt-0.5 text-[10px] text-warm-muted/60">Press Enter or comma to add each section.</p>
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => { setShowForm(false); resetForm(); }} className="rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream transition-colors">Cancel</button>
              <button onClick={handleCreate} className="rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] transition-colors">Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Sections list */}
      {sortedClassNames.length === 0 ? (
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-10 text-center">
          <p className="text-sm text-warm-muted">No classes yet.</p>
          <button onClick={() => setShowForm(true)} className="mt-3 text-xs text-warm-accent hover:text-[#b39a76]">Add your first class</button>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedClassNames.map((name) => {
            const sectionsForClass = grouped[name];
            const hasSections = sectionsForClass.length > 1 || sectionsForClass[0].section !== null;
            const isExpanded = expanded[name] ?? true;
            const order = sectionsForClass[0]?.displayOrder ?? 0;

            return (
              <div key={name} className="rounded-xl border border-warm-card-border bg-warm-card overflow-hidden">
                {/* Class header */}
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    {hasSections && (
                      <button onClick={() => toggleExpand(name)} className="text-warm-muted hover:text-warm-cream transition-colors">
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                    )}
                    <GripVertical size={14} className="text-warm-muted/40" />
                    <div>
                      <span className="text-sm text-warm-cream">{name}</span>
                      <span className="ml-2 text-[10px] text-warm-muted/60">Arr. {order}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openSubjectLink(name)} title="Link subjects"
                      className="rounded p-1 text-warm-muted/40 hover:text-warm-accent transition-colors">
                      <BookOpen size={12} />
                    </button>
                    <span className="text-[10px] text-warm-muted/60">
                      {sectionsForClass.length} section{sectionsForClass.length > 1 ? 's' : ''}
                    </span>
                    {!isReadOnly && (
                      <>
                        <button onClick={() => openEdit(name)} className="rounded p-1 text-warm-muted/40 hover:text-warm-cream transition-colors" title="Edit class">
                          <Edit3 size={12} />
                        </button>
                        <button onClick={() => promptDeleteClass(name)} className="text-warm-muted/40 hover:text-red transition-colors" title="Delete entire class">
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Sections (expandable) */}
                {hasSections && isExpanded && (
                  <div className="border-t border-warm-card-border">
                    {sectionsForClass.map((s) => (
                      <div key={s.id} className="flex items-center justify-between px-4 py-2 pl-12 border-b border-warm-card-border last:border-b-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-warm-muted">{s.section || '—'}</span>
                          <span className="text-[10px] text-warm-muted/40">({s._count?.students || 0} students)</span>
                        </div>
                        {!isReadOnly && (
                          <button onClick={() => promptDeleteSection(s.id, s.section || name)} className="text-warm-muted/30 hover:text-red transition-colors">
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Edit Class Modal ──────────────────────────── */}
      {showEditForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setShowEditForm(false)}>
          <div className="w-full max-w-md rounded-xl border border-warm-card-border bg-[#24201e] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-warm-cream">Edit Class</h2>
              <button onClick={() => setShowEditForm(false)} className="text-warm-muted hover:text-warm-cream transition-colors"><X size={16} /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-warm-muted">Class Name</label>
                  <input value={editClassName} onChange={(e) => setEditClassName(e.target.value)} placeholder="e.g. Class 1" className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-warm-muted">Arrangement</label>
                  <input type="number" value={editArrangement} onChange={(e) => setEditArrangement(e.target.value)} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" />
                </div>
              </div>
              {editSections.length > 0 && (
                <div>
                  <label className="mb-1 block text-xs text-warm-muted">Existing Sections</label>
                  <div className="flex flex-wrap gap-1.5">
                    {editSections.map((s) => (
                      <span key={s.id} className="inline-flex items-center gap-1 rounded-md border border-warm-accent/30 bg-warm-accent/10 px-2 py-0.5 text-xs text-warm-accent">
                        {s.section || '(no section)'}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className="mb-1 block text-xs text-warm-muted">Add New Sections</label>
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {editNewSections.map((s, i) => (
                    <span key={i} className="inline-flex items-center gap-1 rounded-md border border-warm-accent/30 bg-warm-accent/10 px-2 py-0.5 text-xs text-warm-accent">
                      {s}
                      <button onClick={() => setEditNewSections(editNewSections.filter((_, j) => j !== i))} className="text-warm-accent/60 hover:text-warm-accent transition-colors">
                        <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2}><path d="M4 4l8 8M12 4l-8 8"/></svg>
                      </button>
                    </span>
                  ))}
                </div>
                <input value={editSectionInput} onChange={(e) => setEditSectionInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const tag = editSectionInput.trim();
                      if (tag && !editNewSections.includes(tag)) setEditNewSections([...editNewSections, tag]);
                      setEditSectionInput('');
                    }
                  }}
                  placeholder="Type and press Enter to add"
                  className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent" />
              </div>
            </div>
            {editError && <div className="mt-3 rounded-lg border border-red-900/30 bg-red-900/10 px-3 py-2"><p className="text-xs text-red-400">{editError}</p></div>}
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setShowEditForm(false)} className="rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream transition-colors">Cancel</button>
              <button onClick={handleUpdate} disabled={editing} className="rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] disabled:opacity-50 transition-colors">
                {editing ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Link Subjects Modal (per-section) ──────────── */}
      {linkClassName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setLinkClassName(null)}>
          <div className="w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-xl border border-warm-card-border bg-[#24201e] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-warm-cream">Link Subjects — {linkClassName}</h2>
              <button onClick={() => setLinkClassName(null)} className="text-warm-muted hover:text-warm-cream transition-colors"><X size={16} /></button>
            </div>

            {linkSections.length > 1 && (
              <div className="mb-4 flex gap-2">
                <button onClick={() => {
                  const allExp = Object.fromEntries(linkSections.map(s => [s.id, true]));
                  setLinkExpanded(allExp);
                }} className="rounded-lg border border-warm-card-border px-2.5 py-1 text-[10px] text-warm-muted hover:text-warm-cream transition-colors">Expand All</button>
                <button onClick={() => {
                  const allCollapsed = Object.fromEntries(linkSections.map(s => [s.id, false]));
                  setLinkExpanded(allCollapsed);
                }} className="rounded-lg border border-warm-card-border px-2.5 py-1 text-[10px] text-warm-muted hover:text-warm-cream transition-colors">Collapse All</button>
              </div>
            )}

            {allSubjects.length === 0 ? (
              <p className="text-xs text-warm-muted">No subjects found. Create subjects first.</p>
            ) : (
              <div className="space-y-3">
                {linkSections.map(sec => {
                  const isExpanded = linkExpanded[sec.id] ?? true;
                  const checkedSet = sectionSubjectMap[sec.id] || new Set();
                  return (
                    <div key={sec.id} className="rounded-lg border border-warm-card-border overflow-hidden">
                      <button
                        onClick={() => setLinkExpanded(prev => ({ ...prev, [sec.id]: !prev[sec.id] }))}
                        className="flex w-full items-center justify-between bg-warm-card/50 px-3 py-2 text-xs text-warm-cream hover:bg-warm-card/80 transition-colors"
                      >
                        <span>{linkSections.length > 1 ? `${linkClassName} — Section ${sec.section || '(default)'}` : linkClassName}</span>
                        <span className="text-warm-muted">{isExpanded ? '▲' : '▼'}</span>
                      </button>
                      {isExpanded && (
                        <div className="p-2 space-y-1">
                          {allSubjects.map((subj: any) => (
                            <label key={subj.id} className="flex items-center gap-2.5 rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-1.5 cursor-pointer hover:border-warm-accent/50 transition-colors text-xs">
                              <input type="checkbox" checked={checkedSet.has(subj.id)} onChange={() => toggleSectionSubject(sec.id, subj.id)} className="h-3 w-3 rounded border-warm-card-border bg-[#1a1614] text-warm-accent focus:ring-warm-accent" />
                              <span className="text-warm-cream">{subj.name}{subj.code ? ` (${subj.code})` : ''}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setLinkClassName(null)} className="rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream transition-colors">Cancel</button>
              <button onClick={handleSaveSubjectLinks} disabled={savingLinks} className="rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] disabled:opacity-50 transition-colors">
                {savingLinks ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm modal */}
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
