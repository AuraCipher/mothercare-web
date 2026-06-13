'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { CalendarDays, FileText, Plus, X, Trash2 } from 'lucide-react';
import { showToast } from '@/components/toast';
import ConfirmModal from '@/components/confirm-modal';

interface TimetableGroup {
  name: string;
  type: 'timetable' | 'datesheet';
  slotCount: number;
}

export default function TimetableManagePage() {
  const router = useRouter();
  const [timetables, setTimetables] = useState<TimetableGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<'timetable' | 'datesheet'>('timetable');
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [confirm, setConfirm] = useState<{ open: boolean; title: string; message: string; variant: 'danger' | 'warning' | 'default'; confirmLabel: string; action: () => Promise<void> }>(
    { open: false, title: '', message: '', variant: 'danger', confirmLabel: 'Confirm', action: async () => {} }
  );

  const loadGroups = async () => {
    const bId = localStorage.getItem('activeBranchId');
    const aId = localStorage.getItem('activeAYId');
    if (!bId || !aId) { setLoading(false); return; }
    try {
      const slotsRes = await api.getTimetableSlots(bId, aId);
      const slots = slotsRes.data || [];
      const groups: TimetableGroup[] = [];
      const seen = new Set<string>();
      for (const s of slots) {
        const g = s.timetableGroup || 'default';
        if (!seen.has(g)) {
          seen.add(g);
          groups.push({
            name: g,
            type: g.toLowerCase().includes('exam') || g.toLowerCase().includes('datesheet') ? 'datesheet' : 'timetable',
            slotCount: slots.filter((x: any) => (x.timetableGroup || 'default') === g).length,
          });
        }
      }
      if (groups.length === 0) {
        groups.push({ name: 'default', type: 'timetable', slotCount: 0 });
      }
      setTimetables(groups);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadGroups(); }, []);

  const handleDelete = (group: TimetableGroup) => {
    setConfirm({
      open: true,
      title: `Delete "${group.name}"?`,
      message: group.slotCount > 0
        ? `This timetable has ${group.slotCount} slot(s). It will be deleted permanently if no section entries depend on it.`
        : `This timetable is empty and will be deleted permanently.`,
      variant: 'danger',
      confirmLabel: 'Delete',
      action: async () => {
        const bId = localStorage.getItem('activeBranchId');
        const aId = localStorage.getItem('activeAYId');
        if (!bId || !aId) return;
        try {
          await api.deleteTimetableGroup(bId, aId, group.name);
          showToast('success', `"${group.name}" deleted`);
          loadGroups();
        } catch (e: any) {
          showToast('error', e.message || 'Failed to delete');
        }
      },
    });
  };

  const handleCreate = async () => {
    if (!newName.trim()) { showToast('error', 'Name is required'); return; }
    const bId = localStorage.getItem('activeBranchId');
    const aId = localStorage.getItem('activeAYId');
    if (!bId || !aId) return;
    setCreating(true);
    try {
      const groupName = newName.trim().toLowerCase().replace(/\s+/g, '-');
      // Create day config for the new group (all days active)
      const allDays = [1,2,3,4,5,6].map(d => ({ dayOfWeek: d, isActive: true }));
      await api.setTimetableDays(bId, aId, groupName, allDays);
      showToast('success', `${createType === 'timetable' ? 'Timetable' : 'Datesheet'} created`);
      setShowCreateModal(false);
      setNewName('');
      loadGroups();
    } catch (e: any) {
      showToast('error', e.message || 'Failed to create');
    } finally { setCreating(false); }
  };

  const openCreate = (type: 'timetable' | 'datesheet') => {
    setCreateType(type);
    setNewName('');
    setShowCreateModal(true);
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="grid grid-cols-2 gap-8">
          {[1,2].map(i => <div key={i} className="h-64 rounded-xl bg-warm-card animate-pulse" />)}
        </div>
      </main>
    );
  }

  const timetableList = timetables.filter(t => t.type === 'timetable');
  const datesheetList = timetables.filter(t => t.type === 'datesheet');

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="mb-8 text-xl font-light text-warm-cream">Schedule Manager</h1>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* ── Time Tables Column ────────────────────── */}
        <div className="rounded-xl border border-warm-card-border bg-warm-card/30 p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <CalendarDays size={18} className="text-warm-accent" />
              <h2 className="text-sm font-medium text-warm-cream">Time Tables</h2>
            </div>
            <button onClick={() => openCreate('timetable')}
              className="flex items-center gap-1 rounded-lg bg-warm-accent px-3 py-1.5 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] transition-colors">
              <Plus size={13} /> Add New
            </button>
          </div>

          {timetableList.length === 0 ? (
            <div className="rounded-lg border border-dashed border-warm-card-border p-8 text-center">
              <p className="text-xs text-warm-muted">No timetables yet. Create one.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {timetableList.map(t => (
                <div key={t.name} className="flex items-center rounded-lg border border-warm-card-border bg-warm-card overflow-hidden hover:border-warm-accent/40 transition-colors">
                  <button onClick={() => router.push(`/admin/timetable/grid?group=${t.name}`)}
                    className="flex-1 flex items-center gap-2 p-3 text-left"
                  >
                    <CalendarDays size={15} className="text-warm-accent shrink-0" />
                    <span className="text-sm text-warm-cream capitalize">{t.name.replace(/-/g, ' ')}</span>
                  </button>
                  <div className="flex items-center gap-1 pr-2">
                    <span className="text-[10px] text-warm-muted">{t.slotCount} slot{t.slotCount !== 1 ? 's' : ''}</span>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(t); }}
                      className="rounded p-1.5 text-warm-muted hover:text-red hover:bg-warm-card-border/30 transition-colors" title="Delete timetable">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Date Sheets Column ────────────────────── */}
        <div className="rounded-xl border border-warm-card-border bg-warm-card/30 p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-warm-accent" />
              <h2 className="text-sm font-medium text-warm-cream">Date Sheets</h2>
            </div>
            <button onClick={() => openCreate('datesheet')}
              className="flex items-center gap-1 rounded-lg bg-warm-accent px-3 py-1.5 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] transition-colors">
              <Plus size={13} /> Add New
            </button>
          </div>

          {datesheetList.length === 0 ? (
            <div className="rounded-lg border border-dashed border-warm-card-border p-8 text-center">
              <p className="text-xs text-warm-muted">No datesheets yet. Create one.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {datesheetList.map(t => (
                <div key={t.name} className="flex items-center rounded-lg border border-warm-card-border bg-warm-card overflow-hidden hover:border-warm-accent/40 transition-colors">
                  <button onClick={() => router.push(`/admin/timetable/grid?group=${t.name}`)}
                    className="flex-1 flex items-center gap-2 p-3 text-left"
                  >
                    <FileText size={15} className="text-warm-accent shrink-0" />
                    <span className="text-sm text-warm-cream capitalize">{t.name.replace(/-/g, ' ')}</span>
                  </button>
                  <div className="flex items-center gap-1 pr-2">
                    <span className="text-[10px] text-warm-muted">{t.slotCount} slot{t.slotCount !== 1 ? 's' : ''}</span>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(t); }}
                      className="rounded p-1.5 text-warm-muted hover:text-red hover:bg-warm-card-border/30 transition-colors" title="Delete">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Create Modal ───────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setShowCreateModal(false)}>
          <div className="w-full max-w-sm rounded-xl border border-warm-card-border bg-[#24201e] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-warm-cream">
                New {createType === 'timetable' ? 'Time Table' : 'Date Sheet'}
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="text-warm-muted hover:text-warm-cream"><X size={16} /></button>
            </div>
            <input value={newName} onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Regular, Friday, Exam 2025"
              className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent transition-colors"
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
            <p className="mt-2 text-[10px] text-warm-muted/60">Give it a name. You can set up days and lectures later.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShowCreateModal(false)} className="rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream">Cancel</button>
              <button onClick={handleCreate} disabled={creating} className="rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] disabled:opacity-50">
                {creating ? 'Creating…' : `Create ${createType === 'timetable' ? 'Timetable' : 'Datesheet'}`}
              </button>
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
        onConfirm={async () => { await confirm.action(); setConfirm(prev => ({ ...prev, open: false })); }}
        onCancel={() => setConfirm(prev => ({ ...prev, open: false }))}
      />
    </main>
  );
}
