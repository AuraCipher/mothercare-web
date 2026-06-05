'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Plus, Trash2, ChevronDown, ChevronRight, GripVertical } from 'lucide-react';

interface Group {
  id: string;
  name: string;
  section: string | null;
  displayOrder: number;
  capacity: number;
  isActive: boolean;
  communityId: string;
  _count?: { members: number; students: number };
}

export default function ClassesPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');

  // Form state
  const [className, setClassName] = useState('');
  const [arrangement, setArrangement] = useState('');
  const [enableSections, setEnableSections] = useState(false);
  const [sectionInput, setSectionInput] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const data = await api.getGroups();
      setGroups((data as any).data || []);
    } catch { setError('Failed to load classes'); }
    finally { setLoading(false); }
  };

  // Group classes by name
  const grouped = groups.reduce<Record<string, Group[]>>((acc, g) => {
    if (!acc[g.name]) acc[g.name] = [];
    acc[g.name].push(g);
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

    if (enableSections && sectionInput.trim()) {
      const sections = sectionInput.split(',').map((s) => s.trim()).filter(Boolean);
      for (const section of sections) {
        await api.createGroup({ name: className.trim(), section, displayOrder: order }).catch(() => {});
      }
    } else {
      await api.createGroup({ name: className.trim(), displayOrder: order }).catch(() => {});
    }

    setShowForm(false);
    resetForm();
    loadGroups();
  };

  const resetForm = () => {
    setClassName('');
    setArrangement('');
    setEnableSections(false);
    setSectionInput('');
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    await api.deleteGroup(id).catch(() => {});
    loadGroups();
  };

  const toggleExpand = (name: string) => {
    setExpanded((prev) => ({ ...prev, [name]: !prev[name] }));
  };

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
          <h1 className="text-lg font-light text-warm-cream">Classes</h1>
          <p className="text-sm text-warm-muted">Manage class groups and sections.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1 rounded-lg bg-warm-accent px-3 py-1.5 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] transition-colors">
          <Plus size={14} /> Add Class
        </button>
      </div>
        {error && (
          <p className="mb-4 rounded-lg border border-red/20 bg-red/10 px-4 py-2 text-xs text-red">{error}</p>
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
                    <label className="mb-1 block text-xs text-warm-muted">Section names</label>
                    <input value={sectionInput} onChange={(e) => setSectionInput(e.target.value)} placeholder="A, B, CompSci, Arts" className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent" />
                    <p className="mt-0.5 text-[10px] text-warm-muted/60">Comma-separated list. Each section becomes its own group.</p>
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

        {/* Classes list */}
        {sortedClassNames.length === 0 ? (
          <div className="rounded-xl border border-warm-card-border bg-warm-card p-10 text-center">
            <p className="text-sm text-warm-muted">No classes yet.</p>
            <button onClick={() => setShowForm(true)} className="mt-3 text-xs text-warm-accent hover:text-[#b39a76]">Add your first class</button>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedClassNames.map((name) => {
              const sections = grouped[name];
              const hasSections = sections.length > 1 || sections[0].section !== null;
              const isExpanded = expanded[name] ?? true;
              const order = sections[0]?.displayOrder ?? 0;

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
                      <span className="text-[10px] text-warm-muted/60">{sections.length} section{sections.length > 1 ? 's' : ''}</span>
                      <button onClick={() => handleDelete(sections[0].id, name)} className="text-warm-muted/40 hover:text-red transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Sections (expandable) */}
                  {hasSections && isExpanded && (
                    <div className="border-t border-warm-card-border">
                      {sections.map((s) => (
                        <div key={s.id} className="flex items-center justify-between px-4 py-2 pl-12 border-b border-warm-card-border last:border-b-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-warm-muted">{s.section || '—'}</span>
                            <span className="text-[10px] text-warm-muted/40">({s._count?.students || 0} students)</span>
                          </div>
                          <button onClick={() => handleDelete(s.id, s.section || name)} className="text-warm-muted/30 hover:text-red transition-colors">
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
      </main>
  );
}
