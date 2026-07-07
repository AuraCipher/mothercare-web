'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Archive, ArchiveRestore, Calendar, Eye, Search, Trash2, History,
} from 'lucide-react';
import { api } from '@/lib/api';
import { showToast } from '@/components/toast';
import ConfirmModal from '@/components/confirm-modal';

interface AcademicYear {
  id: string;
  branchId: string;
  status: string;
  calendar: { id: string; label: string };
  _count: { groups: number; students: number; members: number };
  createdAt: string;
}

type DeletePreview = {
  label: string;
  canDelete: boolean;
  counts: Record<string, number>;
};

export default function ArchivedYearsPage() {
  const router = useRouter();
  const [branchId, setBranchId] = useState('');
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AcademicYear | null>(null);
  const [deletePreview, setDeletePreview] = useState<DeletePreview | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [confirm, setConfirm] = useState<{
    open: boolean; title: string; message: string;
    variant: 'danger' | 'warning' | 'default';
    confirmLabel: string; action: () => Promise<void>;
  }>({ open: false, title: '', message: '', variant: 'default', confirmLabel: 'Confirm', action: async () => {} });

  useEffect(() => {
    const bId = localStorage.getItem('activeBranchId');
    if (!bId) {
      setLoading(false);
      return;
    }
    setBranchId(bId);
    loadAll(bId);
  }, []);

  const loadAll = (bId: string) => {
    setLoading(true);
    Promise.all([
      api.getAcademicYears(bId, 'ARCHIVED'),
      api.getAcademicYearAuditLogs(bId, { limit: 30 }),
    ])
      .then(([yearsRes, logsRes]) => {
        setYears(yearsRes.data || []);
        setAuditLogs(logsRes.data || []);
      })
      .catch(() => showToast('error', 'Failed to load archive data'))
      .finally(() => setLoading(false));
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return years;
    return years.filter((y) => y.calendar.label.toLowerCase().includes(q));
  }, [years, search]);

  const openInSwitcher = (ay: AcademicYear) => {
    localStorage.setItem('activeAYId', ay.id);
    localStorage.setItem('activeAYStatus', 'ARCHIVED');
    showToast('success', `Switched to ${ay.calendar.label} — use modules to view or edit (if permitted)`);
    router.push('/admin');
  };

  const handleRestore = (ay: AcademicYear, target: 'BUILD_STAGE' | 'ON_HOLD') => {
    const label = target === 'BUILD_STAGE' ? 'Setup mode (BUILD_STAGE)' : 'On hold (ON_HOLD)';
    setConfirm({
      open: true,
      title: 'Restore from archive?',
      message: `"${ay.calendar.label}" will leave the archive bucket and return to ${label}. You can edit its data again (subject to permissions).`,
      variant: 'warning',
      confirmLabel: 'Restore',
      action: async () => {
        try {
          await api.unarchiveAcademicYear(branchId, ay.id, target);
          showToast('success', `Restored to ${label}`);
          loadAll(branchId);
        } catch (e: any) {
          showToast('error', e.message || 'Failed to restore');
        }
      },
    });
  };

  const openDeleteModal = async (ay: AcademicYear) => {
    setDeleteTarget(ay);
    setDeleteConfirmText('');
    try {
      const res = await api.getAcademicYearDeletePreview(branchId, ay.id);
      if (res.success) setDeletePreview(res.data);
    } catch (e: any) {
      showToast('error', e.message || 'Failed to load delete preview');
      setDeleteTarget(null);
    }
  };

  const submitDelete = async () => {
    if (!deleteTarget || !deletePreview) return;
    if (deleteConfirmText.trim() !== deletePreview.label) {
      showToast('error', `Type "${deletePreview.label}" exactly to confirm`);
      return;
    }
    setDeleting(true);
    try {
      await api.deleteAcademicYear(branchId, deleteTarget.id, deleteConfirmText.trim());
      showToast('success', 'Archived year deleted permanently');
      if (localStorage.getItem('activeAYId') === deleteTarget.id) {
        localStorage.removeItem('activeAYId');
        localStorage.removeItem('activeAYStatus');
      }
      setDeleteTarget(null);
      setDeletePreview(null);
      loadAll(branchId);
    } catch (e: any) {
      showToast('error', e.message || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  if (!branchId && !loading) {
    return (
      <div className="rounded-lg border border-warm-card-border bg-warm-card px-4 py-3 text-xs text-warm-muted">
        Select a branch from the sidebar first.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Archive size={16} className="text-yellow-400" />
            <h2 className="text-sm font-medium text-warm-cream">Archive bucket</h2>
          </div>
          <p className="max-w-xl text-xs text-warm-muted">
            Closed academic years live here. Open one in the year switcher to view or backfill records, restore to setup mode to edit freely, or delete if the year was a mistake.
          </p>
        </div>
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-warm-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search year label…"
            className="rounded-lg border border-warm-card-border bg-[#1a1614] py-2 pl-8 pr-3 text-xs text-warm-cream outline-none focus:border-warm-accent"
          />
        </div>
      </div>

      <div className="mb-4 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-4 py-3 text-[11px] text-warm-muted">
        <p className="font-medium text-yellow-400/90">How to remove from archive</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li><strong className="text-warm-cream">Restore to setup</strong> — returns year to BUILD_STAGE for historical data entry or corrections.</li>
          <li><strong className="text-warm-cream">Restore to on hold</strong> — returns to ON_HOLD when you still have an ACTIVE year.</li>
          <li><strong className="text-warm-cream">Delete permanently</strong> — type the year label to confirm; removes all linked AY data.</li>
        </ul>
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-warm-card" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-10 text-center">
          <Calendar size={28} className="mx-auto mb-3 text-warm-muted" />
          <p className="text-sm text-warm-muted">{search ? 'No archived years match your search.' : 'No archived academic years yet.'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((ay) => (
            <div key={ay.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-yellow-500/20 bg-warm-card p-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-yellow-900/20">
                  <Archive size={16} className="text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-warm-cream">{ay.calendar.label}</p>
                  <p className="text-xs text-warm-muted">
                    {ay._count.groups} sections · {ay._count.students} students · archived{' '}
                    {new Date(ay.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button type="button" onClick={() => openInSwitcher(ay)} className="flex items-center gap-1 rounded-lg border border-warm-card-border px-2.5 py-1.5 text-[10px] text-warm-muted hover:border-warm-accent/40 hover:text-warm-cream">
                  <Eye size={12} /> Open
                </button>
                <button type="button" onClick={() => handleRestore(ay, 'BUILD_STAGE')} className="flex items-center gap-1 rounded-lg border border-warm-card-border px-2.5 py-1.5 text-[10px] text-warm-muted hover:border-green-500/40 hover:text-green-400">
                  <ArchiveRestore size={12} /> Restore setup
                </button>
                <button type="button" onClick={() => handleRestore(ay, 'ON_HOLD')} className="rounded-lg border border-warm-card-border px-2.5 py-1.5 text-[10px] text-warm-muted hover:border-blue-500/40 hover:text-blue-400">
                  On hold
                </button>
                <button type="button" onClick={() => openDeleteModal(ay)} className="rounded-lg border border-warm-card-border p-1.5 text-warm-muted hover:border-red-500/40 hover:text-red-400" title="Delete permanently">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <section className="mt-8">
        <div className="mb-3 flex items-center gap-2">
          <History size={14} className="text-warm-muted" />
          <h3 className="text-sm font-medium text-warm-cream">Archive audit log</h3>
        </div>
        {auditLogs.length === 0 ? (
          <p className="text-xs text-warm-muted">No archive actions recorded yet.</p>
        ) : (
          <div className="space-y-1 rounded-xl border border-warm-card-border bg-warm-card/30 p-3">
            {auditLogs.map((log) => (
              <div key={log.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-warm-card-border/30 py-2 text-[11px] last:border-0">
                <span className="text-warm-cream">{log.academicYear?.calendar?.label || log.academicYearId}</span>
                <span className="text-warm-muted">{log.action}{log.fromStatus ? ` · ${log.fromStatus} → ${log.toStatus || '—'}` : ''}</span>
                <span className="text-warm-muted">{log.performedBy?.name || 'System'} · {new Date(log.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {deleteTarget && deletePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => { setDeleteTarget(null); setDeletePreview(null); }}>
          <div className="w-full max-w-md rounded-xl border border-red-500/30 bg-[#24201e] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-2 text-sm font-medium text-red-400">Permanently delete archived year?</h3>
            <p className="mb-3 text-xs text-warm-muted">
              This removes <strong className="text-warm-cream">{deletePreview.label}</strong> and all linked academic-year data. Cannot be undone.
            </p>
            <div className="mb-4 rounded-lg border border-warm-card-border bg-[#1a1614] p-3 text-[11px] text-warm-muted">
              <p className="mb-1 font-medium text-warm-cream">Data to be removed:</p>
              <ul className="grid grid-cols-2 gap-1">
                {Object.entries(deletePreview.counts).map(([k, v]) => (
                  <li key={k}>{k}: <span className="text-warm-cream">{v}</span></li>
                ))}
              </ul>
            </div>
            <label className="mb-1 block text-xs text-warm-muted">Type <span className="font-mono text-warm-cream">{deletePreview.label}</span> to confirm</label>
            <input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="mb-4 w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-red-500/50"
              placeholder={deletePreview.label}
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setDeleteTarget(null); setDeletePreview(null); }} className="rounded-lg border border-warm-card-border px-3 py-2 text-xs text-warm-muted">Cancel</button>
              <button
                type="button"
                disabled={deleting || deleteConfirmText.trim() !== deletePreview.label}
                onClick={submitDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white disabled:opacity-40"
              >
                {deleting ? 'Deleting…' : 'Delete permanently'}
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
        onConfirm={async () => { await confirm.action(); setConfirm((p) => ({ ...p, open: false })); }}
        onCancel={() => setConfirm((p) => ({ ...p, open: false }))}
      />
    </div>
  );
}
