'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  GraduationCap, Search, BookOpen, ExternalLink, ArrowLeft, RotateCcw,
} from 'lucide-react';
import { showToast } from '@/components/toast';
import ConfirmModal from '@/components/confirm-modal';

interface DeactivatedTeacher {
  id: string;
  userId: string;
  employeeId: string | null;
  qualification: string | null;
  specialization: string | null;
  user: {
    id: string; name: string; email: string | null; phone: string | null;
    role: string; status: string;
  };
  _count?: { assignments: number };
}

/**
 * Separate archive for deactivated teachers — kept apart from the active
 * Teachers list so the two never mix. Lists ?status=inactive only.
 * (Static route wins over [id], so /deactivated never collides with a profile.)
 */
export default function DeactivatedTeachersPage() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<DeactivatedTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  const [confirm, setConfirm] = useState<{
    open: boolean; title: string; message: string;
    variant: 'danger' | 'warning' | 'default';
    confirmLabel: string; action: () => Promise<void>;
  }>({ open: false, title: '', message: '', variant: 'default', confirmLabel: 'Confirm', action: async () => {} });

  useEffect(() => { loadTeachers(); }, []);

  const loadTeachers = (page: number = meta.page) => {
    const params: { search?: string; page?: number; limit?: number; status: 'inactive' } = {
      status: 'inactive',
      page,
      limit: meta.limit,
    };
    if (search) params.search = search;

    api.getTeachers(params).then(d => {
      if (d.success) {
        setTeachers(d.data || []);
        setMeta(d.meta);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  };

  const goToPage = (p: number) => {
    setMeta(m => ({ ...m, page: p }));
    setLoading(true);
    loadTeachers(p);
  };

  const handleSearch = () => {
    setLoading(true);
    setMeta(m => ({ ...m, page: 1 }));
    loadTeachers(1);
  };

  const promptReactivate = (t: DeactivatedTeacher) => {
    setConfirm({
      open: true,
      title: `Reactivate "${t.user.name}"?`,
      message: `Their login and branch access will be restored. Past assignments remain as history.`,
      variant: 'default',
      confirmLabel: 'Reactivate',
      action: async () => {
        try {
          await api.reactivateTeacher(t.id);
          showToast('success', `"${t.user.name}" reactivated`);
          loadTeachers();
        } catch (e: unknown) {
          showToast('error', e instanceof Error ? e.message : 'Failed to reactivate');
        }
      },
    });
  };

  const promptDelete = (t: DeactivatedTeacher) => {
    if ((t._count?.assignments ?? 0) > 0) {
      showToast('error', 'Cannot delete: teacher has assignment history. Keep them deactivated instead.');
      return;
    }
    setConfirm({
      open: true,
      title: `Permanently Delete "${t.user.name}"?`,
      message: `This teacher has no teaching history. They will be permanently removed. This cannot be undone.`,
      variant: 'danger',
      confirmLabel: 'Delete Permanently',
      action: async () => {
        try {
          await api.deleteTeacher(t.id);
          showToast('success', 'Teacher deleted permanently');
          loadTeachers();
        } catch (e: unknown) {
          showToast('error', e instanceof Error ? e.message : 'Failed to delete');
        }
      },
    });
  };

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Link
        href="/admin/teachers"
        className="mb-6 inline-flex items-center gap-1.5 text-xs text-warm-muted hover:text-warm-cream transition-colors"
      >
        <ArrowLeft size={13} /> Back to Teachers
      </Link>

      {/* Header */}
      <div className="mb-6">
        <h1 className="mb-1 text-xl font-light text-warm-cream">Deactivated Teachers</h1>
        <p className="text-sm text-warm-muted">
          Login disabled, history preserved. Reactivate anyone to restore their access.
        </p>
      </div>

      {/* Search */}
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
          <p className="text-sm text-warm-muted">No deactivated teachers.</p>
          <Link href="/admin/teachers" className="mt-4 inline-block text-xs text-warm-accent hover:underline">
            Back to active teachers
          </Link>
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
                    <span className="inline-flex items-center gap-1 text-warm-muted/50">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-gray-500" />
                      inactive
                    </span>
                  </p>
                </div>
              </button>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                <button
                  onClick={() => promptReactivate(t)}
                  className="flex items-center gap-1.5 rounded-lg border border-green-900/30 bg-green-900/10 px-3 py-1.5 text-[11px] text-green-400 hover:bg-green-900/20 transition-colors"
                  title="Reactivate teacher"
                >
                  <RotateCcw size={12} /> Reactivate
                </button>
                {(t._count?.assignments ?? 0) === 0 && (
                  <button onClick={() => promptDelete(t)} className="rounded-lg p-1.5 text-warm-muted hover:text-red-400 hover:bg-warm-card-border/30 transition-colors" title="Delete permanently">
                    <span className="text-[11px]">✕</span>
                  </button>
                )}
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
                {meta.total} deactivated teacher{meta.total !== 1 ? 's' : ''} · Page {meta.page} of {meta.totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  disabled={meta.page <= 1}
                  onClick={() => goToPage(meta.page - 1)}
                  className="rounded-lg border border-warm-card-border px-3 py-1.5 text-xs text-warm-muted hover:text-warm-cream disabled:opacity-30 transition-colors"
                >
                  Previous
                </button>
                <button
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => goToPage(meta.page + 1)}
                  className="rounded-lg border border-warm-card-border px-3 py-1.5 text-xs text-warm-muted hover:text-warm-cream disabled:opacity-30 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
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
