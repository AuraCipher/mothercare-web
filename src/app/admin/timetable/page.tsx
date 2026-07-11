'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { CalendarDays, FileText, Plus, X, Trash2, Edit3, MoreVertical, Power, PowerOff, LayoutGrid } from 'lucide-react';
import { showToast } from '@/components/toast';
import ConfirmModal from '@/components/confirm-modal';

interface TimetableItem {
  id: string; name: string; type: string; slotCount: number; activeDays: number;
}

export default function TimetableManagePage() {
  const router = useRouter();
  const [items, setItems] = useState<TimetableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<'timetable' | 'datesheet'>('timetable');
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<TimetableItem | null>(null);
  const [renameName, setRenameName] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [confirm, setConfirm] = useState<any>({ open: false });

  const loadItems = async () => {
    const bId = localStorage.getItem('activeBranchId');
    const aId = localStorage.getItem('activeAYId');
    if (!bId || !aId) { setLoading(false); return; }
    try {
      const res = await api.getTimetables(bId, aId);
      setItems(res.data || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadItems(); }, []);

  const handleCreate = async () => {
    if (!newName.trim()) { showToast('error', 'Name is required'); return; }
    const bId = localStorage.getItem('activeBranchId');
    const aId = localStorage.getItem('activeAYId');
    if (!bId || !aId) return;
    setCreating(true);
    try {
      await api.createTimetable(bId, aId, { name: newName.trim(), type: createType });
      showToast('success', `${createType === 'timetable' ? 'Timetable' : 'Datesheet'} created`);
      setShowCreateModal(false); setNewName('');
      loadItems();
    } catch (e: any) { showToast('error', e.message || 'Failed to create'); }
    finally { setCreating(false); }
  };

  const handleRename = async () => {
    if (!renameTarget || !renameName.trim()) return;
    const bId = localStorage.getItem('activeBranchId');
    if (!bId) return;
    setRenaming(true);
    try {
      await api.renameTimetable(bId, renameTarget.id, renameName.trim());
      setRenameTarget(null);
      showToast('success', `Renamed to "${renameName.trim()}"`);
      loadItems();
    } catch (e: any) { showToast('error', e.message || 'Failed to rename'); }
    finally { setRenaming(false); }
  };

  const handleDelete = (item: TimetableItem) => {
    setConfirm({
      open: true,
      title: `Delete "${item.name}"?`,
      message: item.slotCount > 0 ? `This has ${item.slotCount} slot(s). Will be deleted if no entries depend on it.` : 'Empty timetable. Will be deleted permanently.',
      variant: 'danger',
      confirmLabel: 'Delete',
      action: async () => {
        const bId = localStorage.getItem('activeBranchId');
        if (!bId) return;
        try {
          await api.deleteTimetable(bId, item.id);
          showToast('success', `"${item.name}" deleted`);
          loadItems();
        } catch (e: any) { showToast('error', e.message || 'Failed to delete'); }
      },
    });
  };

  const toggleActive = async (item: TimetableItem, activate: boolean) => {
    const bId = localStorage.getItem('activeBranchId');
    if (!bId) return;
    const days = [1,2,3,4,5,6].map(d => ({ dayOfWeek: d, isActive: activate }));
    try {
      await api.setTimetableDays(bId, item.id, days);
      showToast('success', `"${item.name}" ${activate ? 'activated' : 'deactivated'}`);
      loadItems();
    } catch (e: any) { showToast('error', e.message || 'Failed to update'); }
  };

  const timetables = items.filter(i => i.type === 'timetable');
  const datesheets = items.filter(i => i.type === 'datesheet');

  if (loading) {
    return <main className="mx-auto max-w-5xl px-6 py-10"><div className="grid grid-cols-2 gap-8">{[1,2].map(i => <div key={i} className="h-64 rounded-xl bg-warm-card animate-pulse" />)}</div></main>;
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="mb-8 text-xl font-light text-warm-cream">Schedule Manager</h1>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Time Tables */}
        <div className="rounded-xl border border-warm-card-border bg-warm-card/30 p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <CalendarDays size={18} className="text-warm-accent" />
              <h2 className="text-sm font-medium text-warm-cream">Time Tables</h2>
            </div>
            <button onClick={() => { setCreateType('timetable'); setNewName(''); setShowCreateModal(true); }}
              className="flex items-center gap-1 rounded-lg bg-warm-accent px-3 py-1.5 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76]">
              <Plus size={13} /> Add New
            </button>
          </div>
          {timetables.length === 0 ? (
            <div className="rounded-lg border border-dashed border-warm-card-border p-8 text-center"><p className="text-xs text-warm-muted">No timetables yet.</p></div>
          ) : (
            <div className="space-y-2">
              {timetables.map(t => {
                const isActive = t.activeDays > 0;
                return (
                  <div key={t.id} className="relative flex items-center rounded-lg border border-warm-card-border bg-warm-card hover:border-warm-accent/40 transition-colors">
                    <button onClick={() => router.push(`/admin/timetable/grid?id=${t.id}`)}
                      className="flex-1 flex items-center gap-2 p-3 text-left">
                      <CalendarDays size={15} className="text-warm-accent shrink-0" />
                      <div className="min-w-0">
                        <span className="text-sm text-warm-cream capitalize block truncate">{t.name}</span>
                        <span className={`text-[10px] ${isActive ? 'text-green-400' : 'text-warm-muted/50'}`}>{isActive ? 'Active' : 'Inactive'}</span>
                      </div>
                    </button>
                    <span className="text-[10px] text-warm-muted shrink-0">{t.slotCount} slot{t.slotCount !== 1 ? 's' : ''}</span>
                    <div className="relative pr-2">
                      <button onClick={(e) => { e.stopPropagation(); setDropdownOpen(dropdownOpen === t.id ? null : t.id); }}
                        className="rounded p-1.5 text-warm-muted hover:text-warm-cream"><MoreVertical size={13} /></button>
                      {dropdownOpen === t.id && (
                        <div className="absolute right-0 top-full mt-1 z-50 w-40 rounded-lg border border-warm-card-border bg-[#2d2826] py-1 shadow-xl" onClick={() => setDropdownOpen(null)}>
                          <button onClick={() => router.push(`/admin/timetable/full/${t.id}`)}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-warm-muted hover:text-warm-cream hover:bg-warm-card/50"><LayoutGrid size={12} /> Full View</button>
                          <button onClick={() => { setRenameTarget(t); setRenameName(t.name); }}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-warm-muted hover:text-warm-cream hover:bg-warm-card/50"><Edit3 size={12} /> Rename</button>
                          <button onClick={() => toggleActive(t, !isActive)}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-warm-muted hover:text-warm-cream hover:bg-warm-card/50">
                            {isActive ? <PowerOff size={12} /> : <Power size={12} />} {isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button onClick={() => handleDelete(t)}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-warm-muted hover:text-red hover:bg-warm-card/50"><Trash2 size={12} /> Delete</button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Date Sheets */}
        <div className="rounded-xl border border-warm-card-border bg-warm-card/30 p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-warm-accent" />
              <h2 className="text-sm font-medium text-warm-cream">Date Sheets</h2>
            </div>
            <button onClick={() => { setCreateType('datesheet'); setNewName(''); setShowCreateModal(true); }}
              className="flex items-center gap-1 rounded-lg bg-warm-accent px-3 py-1.5 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76]">
              <Plus size={13} /> Add New
            </button>
          </div>
          {datesheets.length === 0 ? (
            <div className="rounded-lg border border-dashed border-warm-card-border p-8 text-center"><p className="text-xs text-warm-muted">No datesheets yet.</p></div>
          ) : (
            <div className="space-y-2">
              {datesheets.map(t => {
                const isActive = t.activeDays > 0;
                return (
                  <div key={t.id} className="relative flex items-center rounded-lg border border-warm-card-border bg-warm-card hover:border-warm-accent/40 transition-colors">
                    <button onClick={() => router.push(`/admin/timetable/datesheet/${t.id}`)}
                      className="flex-1 flex items-center gap-2 p-3 text-left">
                      <FileText size={15} className="text-warm-accent shrink-0" />
                      <div className="min-w-0">
                        <span className="text-sm text-warm-cream capitalize block truncate">{t.name}</span>
                        <span className={`text-[10px] ${isActive ? 'text-green-400' : 'text-warm-muted/50'}`}>{isActive ? 'Active' : 'Inactive'}</span>
                      </div>
                    </button>
                    <span className="text-[10px] text-warm-muted shrink-0">{t.slotCount} slot{t.slotCount !== 1 ? 's' : ''}</span>
                    <div className="relative pr-2">
                      <button onClick={(e) => { e.stopPropagation(); setDropdownOpen(dropdownOpen === t.id ? null : t.id); }}
                        className="rounded p-1.5 text-warm-muted hover:text-warm-cream"><MoreVertical size={13} /></button>
                      {dropdownOpen === t.id && (
                        <div className="absolute right-0 top-full mt-1 z-50 w-40 rounded-lg border border-warm-card-border bg-[#2d2826] py-1 shadow-xl" onClick={() => setDropdownOpen(null)}>
                          <button onClick={() => router.push(`/admin/timetable/full/${t.id}`)}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-warm-muted hover:text-warm-cream hover:bg-warm-card/50"><LayoutGrid size={12} /> Full View</button>
                          <button onClick={() => { setRenameTarget(t); setRenameName(t.name); }}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-warm-muted hover:text-warm-cream hover:bg-warm-card/50"><Edit3 size={12} /> Rename</button>
                          <button onClick={() => toggleActive(t, !isActive)}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-warm-muted hover:text-warm-cream hover:bg-warm-card/50">
                            {isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button onClick={() => handleDelete(t)}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-warm-muted hover:text-red hover:bg-warm-card/50"><Trash2 size={12} /> Delete</button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setShowCreateModal(false)}>
          <div className="w-full max-w-sm rounded-xl border border-warm-card-border bg-[#24201e] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-warm-cream">New {createType === 'timetable' ? 'Timetable' : 'Date Sheet'}</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-warm-muted hover:text-warm-cream"><X size={16} /></button>
            </div>
            <input value={newName} onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Regular, Friday, Exam 2025"
              className="w-full rounded-lg border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent"
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()} autoFocus />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShowCreateModal(false)} className="rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream">Cancel</button>
              <button onClick={handleCreate} disabled={creating} className="rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] disabled:opacity-50">
                {creating ? 'Creating…' : `Create`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {renameTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setRenameTarget(null)}>
          <div className="w-full max-w-sm rounded-xl border border-warm-card-border bg-[#24201e] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-warm-cream">Rename &ldquo;{renameTarget.name}&rdquo;</h2>
              <button onClick={() => setRenameTarget(null)} className="text-warm-muted hover:text-warm-cream"><X size={16} /></button>
            </div>
            <input value={renameName} onChange={(e) => setRenameName(e.target.value)}
              className="w-full rounded-lg border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent"
              onKeyDown={(e) => e.key === 'Enter' && handleRename()} autoFocus />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setRenameTarget(null)} className="rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream">Cancel</button>
              <button onClick={handleRename} disabled={renaming} className="rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] disabled:opacity-50">
                {renaming ? 'Renaming…' : 'Rename'}
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
        onConfirm={async () => { await confirm.action(); setConfirm({ open: false }); }}
        onCancel={() => setConfirm({ open: false })}
      />
    </main>
  );
}
