'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Calendar, Plus, X, Check, Archive, Trash2,
} from 'lucide-react';
import { showToast } from '@/components/toast';
import ConfirmModal from '@/components/confirm-modal';

interface AcademicYear {
  id: string;
  branchId: string;
  calendarId: string;
  status: 'BUILD_STAGE' | 'ACTIVE' | 'ARCHIVED';
  previousAcademicYearId: string | null;
  createdAt: string;
  calendar: { id: string; label: string };
  branch: { id: string; name: string; code: string };
  _count: { groups: number; students: number; members: number };
}

export default function AcademicYearsPage() {
  const [branchId, setBranchId] = useState('');
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [label, setLabel] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [previousAYId, setPreviousAYId] = useState('');
  const [directToArchived, setDirectToArchived] = useState(false);

  // Confirm modal
  const [confirm, setConfirm] = useState<{
    open: boolean; title: string; message: string;
    variant: 'danger' | 'warning' | 'default';
    confirmLabel: string; action: () => Promise<void>;
  }>({ open: false, title: '', message: '', variant: 'default', confirmLabel: 'Confirm', action: async () => {} });

  useEffect(() => {
    const activeBranchId = localStorage.getItem('activeBranchId');
    if (!activeBranchId) {
      setError('No branch selected. Select a branch from the sidebar.');
      setLoading(false);
      return;
    }
    setBranchId(activeBranchId);
    loadYears(activeBranchId);
  }, []);

  const loadYears = (bId: string) => {
    setLoading(true);
    api.getAcademicYears(bId)
      .then(d => setYears(d.data || []))
      .catch(() => setError('Failed to load academic years'))
      .finally(() => setLoading(false));
  };

  const openCreate = async () => {
    setLabel(''); setStartDate(''); setEndDate('');
    setPreviousAYId('');
    setDirectToArchived(false);
    setCreateError('');
    setShowCreate(true);
  };

  const handleCreate = async () => {
    if (!label.trim() || !startDate || !endDate) {
      setCreateError('Label, start date, and end date are required');
      return;
    }
    setCreating(true);
    try {
      // Auto-create a calendar, then link the AY to it
      const calRes = await api.createCalendar({ label: label.trim(), startDate, endDate });
      const calendarId = (calRes as any).data?.id;
      if (!calendarId) throw new Error('Failed to create calendar');

      await api.createAcademicYear(branchId, {
        calendarId,
        previousAcademicYearId: previousAYId || undefined,
        directToArchived,
      });
      setShowCreate(false);
      showToast('success', 'Academic year created');
      loadYears(branchId);
    } catch (e: any) {
      setCreateError(e.message || 'Failed to create');
    } finally { setCreating(false); }
  };

  const handlePublish = (ay: AcademicYear) => {
    setConfirm({
      open: true,
      title: 'Publish Academic Year?',
      message: `"${ay.calendar.label}" will become the active academic year.`,
      variant: 'default',
      confirmLabel: 'Publish',
      action: async () => {
        try {
          await api.publishAcademicYear(branchId, ay.id);
          showToast('success', 'Academic year published');
          loadYears(branchId);
        } catch (e: any) {
          showToast('error', e.message || 'Failed to publish');
        }
      },
    });
  };

  const handlePause = (ay: AcademicYear) => {
    setConfirm({
      open: true,
      title: 'Pause Academic Year?',
      message: `"${ay.calendar.label}" will be paused. It can be resumed later. Use this for breaks between terms.`,
      variant: 'default',
      confirmLabel: 'Pause',
      action: async () => {
        try {
          await api.pauseAcademicYear(branchId, ay.id);
          showToast('success', 'Academic year paused');
          loadYears(branchId);
        } catch (e: any) {
          showToast('error', e.message || 'Failed to pause');
        }
      },
    });
  };

  const handleResume = (ay: AcademicYear) => {
    setConfirm({
      open: true,
      title: 'Resume Academic Year?',
      message: `"${ay.calendar.label}" will become ACTIVE again.`,
      variant: 'default',
      confirmLabel: 'Resume',
      action: async () => {
        try {
          await api.resumeAcademicYear(branchId, ay.id);
          showToast('success', 'Academic year resumed');
          loadYears(branchId);
        } catch (e: any) {
          showToast('error', e.message || 'Failed to resume');
        }
      },
    });
  };

  const handleArchive = (ay: AcademicYear) => {
    setConfirm({
      open: true,
      title: 'Archive Academic Year?',
      message: `"${ay.calendar.label}" will be archived and become read-only.`,
      variant: 'warning',
      confirmLabel: 'Archive',
      action: async () => {
        try {
          await api.archiveAcademicYear(branchId, ay.id);
          showToast('success', 'Academic year archived');
          loadYears(branchId);
        } catch (e: any) {
          showToast('error', e.message || 'Failed to archive');
        }
      },
    });
  };

  const handleDelete = (ay: AcademicYear) => {
    setConfirm({
      open: true,
      title: 'Delete Academic Year?',
      message: `"${ay.calendar.label}" will be permanently deleted. Only years in BUILD_STAGE can be deleted.`,
      variant: 'danger',
      confirmLabel: 'Delete',
      action: async () => {
        try {
          await api.deleteAcademicYear(branchId, ay.id);
          showToast('success', 'Academic year deleted');
          loadYears(branchId);
        } catch (e: any) {
          showToast('error', e.message || 'Failed to delete');
        }
      },
    });
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      BUILD_STAGE: 'border-gray-500/30 bg-gray-500/10 text-gray-400',
      ACTIVE: 'border-green-500/30 bg-green-500/10 text-green-400',
      ON_HOLD: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
      ARCHIVED: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
    };
    const dotColors: Record<string, string> = {
      ACTIVE: 'bg-green-400', ON_HOLD: 'bg-blue-400', ARCHIVED: 'bg-yellow-400',
    };
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${colors[status]}`}>
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${dotColors[status] || 'bg-gray-400'}`} />
        {status.replace('_', ' ')}
      </span>
    );
  };

  if (loading) {
    return <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl bg-warm-card animate-pulse" />)}</div>;
  }

  if (error) {
    return <div className="rounded-lg border border-warm-card-border bg-warm-card px-4 py-3 text-xs text-[#b39a76]">{error}</div>;
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium text-warm-cream">Academic Years</h2>
          <p className="text-xs text-warm-muted mt-0.5">Create and manage school years. Each year has its own classes, sections, subjects, and enrollments.</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-1.5 rounded-lg bg-warm-accent px-3.5 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] transition-colors">
          <Plus size={14} /> New Year
        </button>
      </div>

      {years.length === 0 ? (
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-10 text-center">
          <Calendar size={28} className="mx-auto mb-3 text-warm-muted" />
          <p className="text-sm text-warm-muted">No academic years yet.</p>
          <p className="mt-1 text-xs text-warm-muted/60">Create your first academic year to start organizing classes and sections.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {years.map(ay => {
            const isBuild = ay.status === 'BUILD_STAGE';
            const isActive = ay.status === 'ACTIVE';
            const isOnHold = ay.status === 'ON_HOLD';
            return (
              <div key={ay.id} className="flex items-center justify-between rounded-xl border border-warm-card-border bg-warm-card p-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    isActive ? 'bg-green-900/20' : isOnHold ? 'bg-blue-900/20' : ay.status === 'ARCHIVED' ? 'bg-yellow-900/20' : 'bg-gray-800/30'
                  }`}>
                    <Calendar size={16} className={`${
                      isActive ? 'text-green-400' : isOnHold ? 'text-blue-400' : ay.status === 'ARCHIVED' ? 'text-yellow-400' : 'text-warm-muted'
                    }`} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-warm-cream">{ay.calendar.label}</span>
                      {statusBadge(ay.status)}
                    </div>
                    <p className="text-xs text-warm-muted mt-0.5">
                      {ay._count.groups} section{ay._count.groups !== 1 ? 's' : ''} · {ay._count.students} student{ay._count.students !== 1 ? 's' : ''} · {ay._count.members} member{ay._count.members !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-3">
                  {isBuild && (
                    <>
                      <button onClick={() => handlePublish(ay)} title="Publish" className="rounded-lg p-1.5 text-warm-muted hover:text-green-400 hover:bg-green-900/20 transition-colors"><Check size={15} /></button>
                      <button onClick={() => handleDelete(ay)} title="Delete" className="rounded-lg p-1.5 text-warm-muted hover:text-red/80 hover:bg-red-900/20 transition-colors"><Trash2 size={15} /></button>
                    </>
                  )}
                  {isActive && (
                    <>
                      <button onClick={() => handlePause(ay)} title="Pause" className="rounded-lg p-1.5 text-warm-muted hover:text-blue-400 hover:bg-blue-900/20 transition-colors"><span className="text-[11px] font-bold">⏸</span></button>
                      <button onClick={() => handleArchive(ay)} title="Archive" className="rounded-lg p-1.5 text-warm-muted hover:text-yellow-400 hover:bg-yellow-900/20 transition-colors"><Archive size={15} /></button>
                    </>
                  )}
                  {isOnHold && (
                    <button onClick={() => handleResume(ay)} title="Resume" className="rounded-lg p-1.5 text-warm-muted hover:text-green-400 hover:bg-green-900/20 transition-colors"><span className="text-[11px] font-bold">▶</span></button>
                  )}
                  {ay.status === 'ARCHIVED' && <span className="text-[10px] text-warm-muted/50 italic">Read only</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-md rounded-xl border border-warm-card-border bg-[#24201e] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-warm-cream">New Academic Year</h2>
              <button onClick={() => setShowCreate(false)} className="text-warm-muted hover:text-warm-cream transition-colors"><X size={16} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs text-warm-muted">Label</label>
                <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. 2025-2026" className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-warm-muted">Start Date</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent transition-colors [color-scheme:dark]" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-warm-muted">End Date</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent transition-colors [color-scheme:dark]" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="directToArchived" checked={directToArchived} onChange={(e) => setDirectToArchived(e.target.checked)} className="h-3.5 w-3.5 rounded border-warm-card-border bg-[#1a1614] text-warm-accent focus:ring-warm-accent" />
                <label htmlFor="directToArchived" className="text-xs text-warm-muted">This is a historical year — bypass BUILD_STAGE limit (you can add data, then Archive when done)</label>
              </div>
              <div>
                <label className="mb-1 block text-xs text-warm-muted">Previous Academic Year (optional)</label>
                <select value={previousAYId} onChange={(e) => setPreviousAYId(e.target.value)}
                  className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent transition-colors">
                  <option value="">— None (first year) —</option>
                  {years.filter(y => y.status !== 'ARCHIVED').map(y => (
                    <option key={y.id} value={y.id}>{y.calendar.label}</option>
                  ))}
                </select>
                <p className="mt-1 text-[10px] text-warm-muted/60">Link to the previous year to enable year-end promotion.</p>
              </div>
            </div>
            {createError && <div className="mt-3 rounded-lg border border-red-900/30 bg-red-900/10 px-3 py-2"><p className="text-xs text-red-400">{createError}</p></div>}
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setShowCreate(false)} className="rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream transition-colors">Cancel</button>
              <button onClick={handleCreate} disabled={creating} className="rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] disabled:opacity-50 transition-colors">
                {creating ? 'Creating…' : 'Create Year'}
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
    </div>
  );
}
