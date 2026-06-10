'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Calendar, ArrowLeft, Building2, Users, BookOpen, CheckCircle, Archive } from 'lucide-react';
import ConfirmModal from '@/components/confirm-modal';
import { showToast } from '@/components/toast';

interface AcademicYearDetail {
  id: string;
  status: 'BUILD_STAGE' | 'ACTIVE' | 'ARCHIVED';
  branch: { id: string; name: string; code: string };
  calendar: { id: string; label: string; startDate: string; endDate: string };
  previousAcademicYear: { id: string; status: string } | null;
  nextAcademicYears: { id: string; status: string }[];
  members: { id: string; user: { id: string; name: string; role: string } }[];
  groups: { id: string; name: string; section: string | null; displayOrder: number; _count: { members: number; students: number } }[];
  _count: { groups: number; students: number; members: number; subjects: number };
}

const statusConfig: Record<string, { color: string; dot: string; label: string }> = {
  BUILD_STAGE: { color: 'text-yellow-400 bg-yellow-900/30 border-yellow-700/30', dot: 'bg-yellow-400', label: 'Building' },
  ACTIVE: { color: 'text-green-400 bg-green-900/30 border-green-700/30', dot: 'bg-green-400', label: 'Active' },
  ARCHIVED: { color: 'text-gray-400 bg-gray-700/30 border-gray-600/30', dot: 'bg-gray-400', label: 'Archived' },
};

export default function AcademicYearDetailPage() {
  const router = useRouter();
  const params = useParams();
  const ayId = params.id as string;

  const [ay, setAy] = useState<AcademicYearDetail | null>(null);
  const [branchId, setBranchId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Confirm modal
  const [confirm, setConfirm] = useState<{
    open: boolean;
    title: string;
    message: string;
    variant: 'danger' | 'warning' | 'default';
    confirmLabel: string;
    action: () => Promise<void>;
  }>({ open: false, title: '', message: '', variant: 'default', confirmLabel: 'Confirm', action: async () => {} });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    const bId = localStorage.getItem('activeBranchId');
    if (bId) setBranchId(bId);
    loadAy();
  }, [ayId]);

  const loadAy = async () => {
    try {
      const bId = localStorage.getItem('activeBranchId');
      if (!bId) { setError('No branch selected'); return; }
      const data = await api.getAcademicYear(bId, ayId);
      setAy(data.data);
    } catch (e: any) {
      setError(e.message || 'Failed to load academic year');
    } finally {
      setLoading(false);
    }
  };

  const promptPublish = () => {
    if (!ay) return;
    setConfirm({
      open: true,
      title: 'Publish Academic Year?',
      message: `"${ay.calendar.label}" will become the ACTIVE year for ${ay.branch.name}. Only one year can be active per branch.`,
      variant: 'default',
      confirmLabel: 'Publish',
      action: async () => {
        try {
          await api.publishAcademicYear(branchId, ayId);
          showToast('success', `"${ay.calendar.label}" is now ACTIVE`);
          loadAy();
        } catch (e: any) {
          showToast('error', e.message || 'Failed to publish');
        }
      },
    });
  };

  const promptArchive = () => {
    if (!ay) return;
    setConfirm({
      open: true,
      title: 'Archive Academic Year?',
      message: `"${ay.calendar.label}" will be archived. Data is preserved but the year is closed.`,
      variant: 'warning',
      confirmLabel: 'Archive',
      action: async () => {
        try {
          await api.archiveAcademicYear(branchId, ayId);
          showToast('success', `"${ay.calendar.label}" archived`);
          loadAy();
        } catch (e: any) {
          showToast('error', e.message || 'Failed to archive');
        }
      },
    });
  };

  const statusBadge = (status: string) => {
    const cfg = statusConfig[status] || statusConfig.ARCHIVED;
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${cfg.color}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
        {cfg.label}
      </span>
    );
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8 h-6 w-48 rounded bg-warm-card animate-pulse" />
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 rounded-xl bg-warm-card animate-pulse" />)}
        </div>
        <div className="h-40 rounded-xl bg-warm-card animate-pulse" />
      </main>
    );
  }

  if (!ay) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10 text-center">
        <p className="text-sm text-warm-muted">Academic year not found.</p>
        <button onClick={() => router.back()} className="mt-3 text-xs text-warm-accent hover:text-[#b39a76] transition-colors">← Go back</button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      {/* Back link */}
      <button
        onClick={() => router.push(`/admin/branches/${ay.branch.id}`)}
        className="mb-6 flex items-center gap-1.5 text-xs text-warm-muted hover:text-warm-cream transition-colors"
      >
        <ArrowLeft size={13} /> Back to {ay.branch.name}
      </button>

      {error && (
        <p className="mb-4 rounded-lg border border-warm-card-border bg-warm-card px-4 py-2 text-xs text-[#b39a76]">{error}</p>
      )}

      {/* Header card */}
      <div className="mb-8 rounded-xl border border-warm-card-border bg-warm-card p-5">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Calendar size={24} className="text-warm-accent" />
            <div>
              <h1 className="text-xl font-light text-warm-cream">{ay.calendar.label}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {statusBadge(ay.status)}
                <span className="text-xs text-warm-muted/70">
                  {new Date(ay.calendar.startDate).toLocaleDateString()} — {new Date(ay.calendar.endDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {ay.status === 'BUILD_STAGE' && (
              <button
                onClick={promptPublish}
                className="flex items-center gap-1.5 rounded-lg bg-green-600/20 px-3.5 py-2 text-xs font-medium text-green-400 hover:bg-green-600/30 border border-green-700/30 transition-colors"
              >
                <CheckCircle size={13} /> Publish Year
              </button>
            )}
            {ay.status === 'ACTIVE' && (
              <button
                onClick={promptArchive}
                className="flex items-center gap-1.5 rounded-lg bg-warm-accent/15 px-3.5 py-2 text-xs font-medium text-warm-accent hover:bg-warm-accent/25 border border-warm-accent/30 transition-colors"
              >
                <Archive size={13} /> Archive Year
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4 border-t border-warm-card-border pt-4 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-warm-muted/70">
            <Building2 size={13} className="text-warm-accent" />
            {ay.branch.name}
          </div>
          {ay.previousAcademicYear && (
            <div className="flex items-center gap-1.5 text-xs text-warm-muted/70">
              Previous: {statusBadge(ay.previousAcademicYear.status)}
            </div>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="mb-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-4">
          <BookOpen size={15} className="mb-2 text-warm-accent" />
          <p className="text-lg font-light text-warm-cream">{ay._count.groups}</p>
          <p className="text-xs text-warm-muted">Groups</p>
        </div>
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-4">
          <Users size={15} className="mb-2 text-warm-accent" />
          <p className="text-lg font-light text-warm-cream">{ay._count.students}</p>
          <p className="text-xs text-warm-muted">Students</p>
        </div>
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-4">
          <Users size={15} className="mb-2 text-warm-accent" />
          <p className="text-lg font-light text-warm-cream">{ay._count.members}</p>
          <p className="text-xs text-warm-muted">Members</p>
        </div>
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-4">
          <BookOpen size={15} className="mb-2 text-warm-accent" />
          <p className="text-lg font-light text-warm-cream">{ay._count.subjects}</p>
          <p className="text-xs text-warm-muted">Subjects</p>
        </div>
      </div>

      {/* Groups list */}
      <div className="mb-8">
        <h2 className="mb-3 text-sm font-medium text-warm-cream">Groups</h2>
        {ay.groups.length === 0 ? (
          <div className="rounded-xl border border-warm-card-border bg-warm-card p-8 text-center">
            <BookOpen size={24} className="mx-auto mb-2 text-warm-accent/50" />
            <p className="text-sm text-warm-muted">No groups yet.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {ay.groups.map((g) => (
              <div key={g.id} className="flex items-center justify-between rounded-lg border border-warm-card-border bg-warm-card px-4 py-2.5 hover:bg-warm-card/80 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-warm-muted/50 w-5 text-right font-mono">{g.displayOrder}</span>
                  <span className="text-sm text-warm-cream">{g.name}</span>
                  {g.section && <span className="text-xs text-warm-muted/60">({g.section})</span>}
                </div>
                <div className="flex items-center gap-3 text-[10px] text-warm-muted/60">
                  <span>{g._count.members} members</span>
                  <span>{g._count.students} students</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Members list */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-warm-cream">Members</h2>
        {ay.members.length === 0 ? (
          <div className="rounded-xl border border-warm-card-border bg-warm-card p-8 text-center">
            <Users size={24} className="mx-auto mb-2 text-warm-accent/50" />
            <p className="text-sm text-warm-muted">No members yet.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {ay.members.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-lg border border-warm-card-border bg-warm-card px-4 py-2.5 hover:bg-warm-card/80 transition-colors">
                <span className="text-sm text-warm-cream">{m.user.name}</span>
                <span className="text-[10px] text-warm-muted capitalize">{m.user.role.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        variant={confirm.variant}
        confirmLabel={confirm.confirmLabel}
        onConfirm={async () => {
          await confirm.action();
          setConfirm((prev) => ({ ...prev, open: false }));
        }}
        onCancel={() => setConfirm((prev) => ({ ...prev, open: false }))}
      />
    </main>
  );
}
