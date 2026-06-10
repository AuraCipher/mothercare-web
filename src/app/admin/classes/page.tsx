'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Plus, Trash2, ChevronDown, ChevronRight, GripVertical } from 'lucide-react';
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

  // Branch + AY context
  const [branchId, setBranchId] = useState<string>('');
  const [ayId, setAyId] = useState<string>('');

  // Form state
  const [className, setClassName] = useState('');
  const [arrangement, setArrangement] = useState('');
  const [enableSections, setEnableSections] = useState(false);
  const [sectionList, setSectionList] = useState<string[]>([]);
  const [sectionInput, setSectionInput] = useState('');

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

    // Load active academic year for this branch
    api.getAcademicYears(activeBranchId, 'ACTIVE')
      .then(d => {
        const activeAy = d.data?.[0];
        if (!activeAy) {
          setError('No active academic year found. Create and publish one first.');
          setLoading(false);
          return;
        }
        setAyId(activeAy.id);
        // Load sections scoped under this AY
        api.getSections(activeBranchId, activeAy.id)
          .then(res => setSections(res.data || []))
          .catch(() => setError('Failed to load sections'))
          .finally(() => setLoading(false));
      })
      .catch(() => {
        setError('Failed to load academic year');
        setLoading(false);
      });
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

  const promptDelete = (id: string, name: string) => {
    setConfirm({
      open: true,
      title: `Delete "${name}"?`,
      message: `This will deactivate this section. Students currently assigned will be preserved.`,
      variant: 'danger',
      confirmLabel: 'Delete',
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

  const toggleExpand = (name: string) => {
    setExpanded((prev) => ({ ...prev, [name]: !prev[name] }));
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
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1 rounded-lg bg-warm-accent px-3 py-1.5 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] transition-colors">
          <Plus size={14} /> Add Class
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
                    <span className="text-[10px] text-warm-muted/60">
                      {sectionsForClass.length} section{sectionsForClass.length > 1 ? 's' : ''}
                    </span>
                    <button onClick={() => promptDelete(sectionsForClass[0].id, name)} className="text-warm-muted/40 hover:text-red transition-colors">
                      <Trash2 size={13} />
                    </button>
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
                        <button onClick={() => promptDelete(s.id, s.section || name)} className="text-warm-muted/30 hover:text-red transition-colors">
                          <Trash2 size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
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
