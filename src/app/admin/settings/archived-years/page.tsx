'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Archive, ArchiveRestore, Calendar, Eye, Search, Trash2,
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

export default function ArchivedYearsPage() {
  const router = useRouter();
  const [branchId, setBranchId] = useState('');
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
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
    loadArchived(bId);
  }, []);

  const loadArchived = (bId: string) => {
    setLoading(true);
    api.getAcademicYears(bId, 'ARCHIVED')
      .then((d) => setYears(d.data || []))
      .catch(() => showToast('error', 'Failed to load archived years'))
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
          loadArchived(branchId);
        } catch (e: any) {
          showToast('error', e.message || 'Failed to restore');
        }
      },
    });
  };

  const handleDelete = (ay: AcademicYear) => {
    setConfirm({
      open: true,
      title: 'Permanently delete archived year?',
      message: `"${ay.calendar.label}" and its linked academic data will be permanently removed. This cannot be undone. Only use if the year was created by mistake or is empty.`,
      variant: 'danger',
      confirmLabel: 'Delete permanently',
      action: async () => {
        try {
          await api.deleteAcademicYear(branchId, ay.id);
          showToast('success', 'Archived year deleted');
          if (localStorage.getItem('activeAYId') === ay.id) {
            localStorage.removeItem('activeAYId');
            localStorage.removeItem('activeAYStatus');
          }
          loadArchived(branchId);
        } catch (e: any) {
          showToast('error', e.message || 'Failed to delete');
        }
      },
    });
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
          <li><strong className="text-warm-cream">Restore to on hold</strong> — returns to ON_HOLD when you still have an ACTIVE year (rare; paused operational year).</li>
          <li><strong className="text-warm-cream">Delete permanently</strong> — only for empty/mistake years; removes all linked AY data.</li>
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
                <button
                  type="button"
                  onClick={() => openInSwitcher(ay)}
                  title="Select in year switcher and open dashboard"
                  className="flex items-center gap-1 rounded-lg border border-warm-card-border px-2.5 py-1.5 text-[10px] text-warm-muted hover:border-warm-accent/40 hover:text-warm-cream"
                >
                  <Eye size={12} /> Open
                </button>
                <button
                  type="button"
                  onClick={() => handleRestore(ay, 'BUILD_STAGE')}
                  className="flex items-center gap-1 rounded-lg border border-warm-card-border px-2.5 py-1.5 text-[10px] text-warm-muted hover:border-green-500/40 hover:text-green-400"
                >
                  <ArchiveRestore size={12} /> Restore setup
                </button>
                <button
                  type="button"
                  onClick={() => handleRestore(ay, 'ON_HOLD')}
                  className="rounded-lg border border-warm-card-border px-2.5 py-1.5 text-[10px] text-warm-muted hover:border-blue-500/40 hover:text-blue-400"
                >
                  On hold
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(ay)}
                  className="rounded-lg border border-warm-card-border p-1.5 text-warm-muted hover:border-red-500/40 hover:text-red-400"
                  title="Delete permanently"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
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
