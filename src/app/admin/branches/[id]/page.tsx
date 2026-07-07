'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Building2, Calendar, Plus, ArrowLeft, CheckCircle, Archive, ExternalLink, ChevronDown, ChevronRight, Trash2, X } from 'lucide-react';
import ConfirmModal from '@/components/confirm-modal';
import { showToast } from '@/components/toast';

interface BranchDetail {
  id: string;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  _count: { academicYears: number; branchMembers: number };
  academicYears: { id: string; status: string }[];
}

interface AcademicYear {
  id: string;
  status: 'BUILD_STAGE' | 'ACTIVE' | 'ARCHIVED';
  branch: { id: string; name: string; code: string };
  calendar: { id: string; label: string };
  _count: { groups: number; students: number; members: number };
}

interface CalendarItem {
  id: string;
  label: string;
  isCurrent: boolean;
  startDate: string;
  endDate: string;
}

const statusConfig: Record<string, { color: string; dot: string; label: string }> = {
  BUILD_STAGE: { color: 'text-yellow-400 bg-yellow-900/30 border-yellow-700/30', dot: 'bg-yellow-400', label: 'Building' },
  ACTIVE: { color: 'text-green-400 bg-green-900/30 border-green-700/30', dot: 'bg-green-400', label: 'Active' },
  ARCHIVED: { color: 'text-gray-400 bg-gray-700/30 border-gray-600/30', dot: 'bg-gray-400', label: 'Archived' },
};

export default function BranchDetailPage() {
  const router = useRouter();
  const params = useParams();
  const branchId = params.id as string;

  const [branch, setBranch] = useState<BranchDetail | null>(null);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [expandedAy, setExpandedAy] = useState<string | null>(null);

  // Create AY modal
  const [showCreateAy, setShowCreateAy] = useState(false);
  const [calendars, setCalendars] = useState<CalendarItem[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState('');
  const [creatingAy, setCreatingAy] = useState(false);
  const [createAyError, setCreateAyError] = useState('');

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
    loadData();
  }, [branchId]);

  const loadData = async () => {
    try {
      const [branchData, ayData] = await Promise.all([
        api.getBranch(branchId),
        api.getAcademicYears(branchId, statusFilter || undefined),
      ]);
      setBranch(branchData.data);
      setAcademicYears(ayData.data || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load branch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (branchId) {
      api.getAcademicYears(branchId, statusFilter || undefined)
        .then((d) => setAcademicYears(d.data || []))
        .catch(() => {});
    }
  }, [statusFilter, branchId]);

  // ─── Create AY ────────────────────────────────────────────

  const openCreateAy = async () => {
    try {
      const calData = await api.getCalendars();
      setCalendars(calData.data || []);
      setSelectedCalendarId('');
      setCreateAyError('');
      setShowCreateAy(true);
    } catch {
      setCreateAyError('Failed to load calendars');
    }
  };

  const handleCreateAy = async () => {
    if (!selectedCalendarId) {
      setCreateAyError('Please select a calendar');
      return;
    }
    setCreatingAy(true);
    try {
      await api.createAcademicYear(branchId, { calendarId: selectedCalendarId });
      setShowCreateAy(false);
      showToast('success', 'Academic year created');
      loadData();
    } catch (e: any) {
      setCreateAyError(e.message || 'Failed to create academic year');
    } finally {
      setCreatingAy(false);
    }
  };

  // ─── Publish AY ────────────────────────────────────────────

  const promptPublish = (ay: AcademicYear) => {
    setConfirm({
      open: true,
      title: 'Publish Academic Year?',
      message: `"${ay.calendar.label}" will become the ACTIVE year for ${ay.branch.name}. Only one year can be active at a time.`,
      variant: 'default',
      confirmLabel: 'Publish',
      action: async () => {
        try {
          await api.publishAcademicYear(branchId, ay.id);
          showToast('success', `"${ay.calendar.label}" is now ACTIVE`);
          loadData();
        } catch (e: any) {
          showToast('error', e.message || 'Failed to publish');
        }
      },
    });
  };

  // ─── Archive AY ────────────────────────────────────────────

  const promptArchive = (ay: AcademicYear) => {
    setConfirm({
      open: true,
      title: 'Archive Academic Year?',
      message: `"${ay.calendar.label}" will be archived. Students and data will be preserved but the year will be closed.`,
      variant: 'warning',
      confirmLabel: 'Archive',
      action: async () => {
        try {
          await api.archiveAcademicYear(branchId, ay.id);
          showToast('success', `"${ay.calendar.label}" archived`);
          loadData();
        } catch (e: any) {
          showToast('error', e.message || 'Failed to archive');
        }
      },
    });
  };

  // ─── Delete AY ─────────────────────────────────────────────

  const promptDeleteAy = (ay: AcademicYear) => {
    setConfirm({
      open: true,
      title: 'Delete Academic Year?',
      message: `Permanently delete ${ay.calendar.label}? This action cannot be undone. All associated data (groups, enrollments) will be removed.`,
      variant: 'danger',
      confirmLabel: 'Delete',
      action: async () => {
        try {
          await api.deleteAcademicYear(branchId, ay.id, ay.calendar.label);
          showToast('success', 'Academic year deleted');
          loadData();
        } catch (e: any) {
          showToast('error', e.message || 'Failed to delete');
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

  if (loading && !branch) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8 h-6 w-48 rounded bg-warm-card animate-pulse" />
        <div className="h-32 rounded-xl bg-warm-card animate-pulse mb-6" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-warm-card animate-pulse" />
          ))}
        </div>
      </main>
    );
  }

  if (!branch && !loading) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10 text-center">
        <p className="text-sm text-warm-muted">Branch not found.</p>
        <button onClick={() => router.push('/admin/branches')} className="mt-3 text-xs text-warm-accent hover:text-[#b39a76] transition-colors">← Back to branches</button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      {/* Back link */}
      <button onClick={() => router.push('/admin/branches')} className="mb-6 flex items-center gap-1.5 text-xs text-warm-muted hover:text-warm-cream transition-colors">
        <ArrowLeft size={13} /> Back to branches
      </button>

      {/* Branch info card */}
      <div className="mb-8 rounded-xl border border-warm-card-border bg-warm-card p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Building2 size={24} className="text-warm-accent" />
            <div>
              <h1 className="text-xl font-light text-warm-cream">{branch!.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[11px] font-mono text-warm-muted/50 uppercase">{branch!.code}</span>
                {branch!.isActive ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-900/30 px-2 py-0.5 text-[10px] text-green-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400" /> Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-700/30 px-2 py-0.5 text-[10px] text-gray-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-400" /> Inactive
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right text-xs text-warm-muted/70">
            <p>{branch!._count.academicYears} academic years</p>
            <p>{branch!._count.branchMembers} members</p>
          </div>
        </div>
        {(branch!.address || branch!.phone || branch!.email) && (
          <div className="mt-4 flex flex-wrap gap-4 border-t border-warm-card-border pt-4 text-xs text-warm-muted/70">
            {branch!.address && <span>📍 {branch!.address}</span>}
            {branch!.phone && <span>📞 {branch!.phone}</span>}
            {branch!.email && <span>✉️ {branch!.email}</span>}
          </div>
        )}
      </div>

      {/* Academic Years section */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-medium text-warm-cream">Academic Years</h2>
          <div className="flex gap-1">
            {['', 'ACTIVE', 'BUILD_STAGE', 'ARCHIVED'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 text-[10px] rounded-md transition-colors ${
                  statusFilter === s
                    ? 'bg-warm-accent/15 text-warm-accent border border-warm-accent/30'
                    : 'text-warm-muted hover:text-warm-cream border border-transparent'
                }`}
              >
                {s || 'All'}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={openCreateAy}
          className="flex items-center gap-1.5 rounded-lg bg-warm-accent px-3 py-1.5 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] transition-colors"
        >
          <Plus size={13} /> New Year
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-warm-card-border bg-warm-card px-4 py-2 text-xs text-[#b39a76]">{error}</p>
      )}

      {/* AY List */}
      {academicYears.length === 0 ? (
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-10 text-center">
          <Calendar size={28} className="mx-auto mb-2 text-warm-accent/50" />
          <p className="text-sm text-warm-muted">No academic years found.</p>
          <p className="text-xs text-warm-muted/60 mt-1">Create a new academic year linked to a calendar.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {academicYears.map((ay) => (
            <div key={ay.id} className="rounded-xl border border-warm-card-border bg-warm-card overflow-hidden transition-colors hover:bg-warm-card/80">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <button onClick={() => setExpandedAy(expandedAy === ay.id ? null : ay.id)} className="text-warm-muted hover:text-warm-cream transition-colors">
                    {expandedAy === ay.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                  <Calendar size={14} className="text-warm-accent shrink-0" />
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-warm-cream">{ay.calendar.label}</span>
                    {statusBadge(ay.status)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-warm-muted/60 hidden sm:block">
                    {ay._count.groups} groups · {ay._count.students} students
                  </span>
                  <div className="flex items-center gap-1">
                    {ay.status === 'BUILD_STAGE' && (
                      <button
                        onClick={() => promptPublish(ay)}
                        className="rounded-lg p-1.5 text-green-400 hover:bg-green-900/30 transition-colors"
                        title="Publish"
                      >
                        <CheckCircle size={14} />
                      </button>
                    )}
                    {ay.status === 'ACTIVE' && (
                      <button
                        onClick={() => promptArchive(ay)}
                        className="rounded-lg p-1.5 text-warm-muted hover:text-warm-cream hover:bg-warm-card-border/30 transition-colors"
                        title="Archive"
                      >
                        <Archive size={14} />
                      </button>
                    )}
                    {ay.status === 'ARCHIVED' && (
                      <button
                        onClick={() => promptDeleteAy(ay)}
                        className="rounded-lg p-1.5 text-warm-muted hover:text-red/80 hover:bg-warm-card-border/30 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => router.push(`/admin/academic-years/${ay.id}`)}
                      className="rounded-lg p-1.5 text-warm-muted hover:text-warm-cream hover:bg-warm-card-border/30 transition-colors"
                      title="View details"
                    >
                      <ExternalLink size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {expandedAy === ay.id && (
                <div className="border-t border-warm-card-border px-4 py-3 pl-12">
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div><p className="text-warm-muted/60">Groups</p><p className="text-warm-cream">{ay._count.groups}</p></div>
                    <div><p className="text-warm-muted/60">Students</p><p className="text-warm-cream">{ay._count.students}</p></div>
                    <div><p className="text-warm-muted/60">Members</p><p className="text-warm-cream">{ay._count.members}</p></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Create AY Modal ──────────────────────────────────── */}
      {showCreateAy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setShowCreateAy(false)}>
          <div className="w-full max-w-md rounded-xl border border-warm-card-border bg-[#24201e] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-warm-cream">New Academic Year</h2>
              <button onClick={() => setShowCreateAy(false)} className="text-warm-muted hover:text-warm-cream transition-colors">
                <X size={16} />
              </button>
            </div>

            {calendars.length === 0 ? (
              <p className="text-xs text-warm-muted">No calendars available. Create a calendar first via the API.</p>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-warm-muted">Select a calendar for this academic year:</p>
                {calendars.map((cal) => (
                  <label
                    key={cal.id}
                    className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                      selectedCalendarId === cal.id
                        ? 'border-warm-accent/50 bg-warm-accent/10'
                        : 'border-warm-card-border hover:bg-warm-card'
                    }`}
                  >
                    <input
                      type="radio"
                      name="calendar"
                      checked={selectedCalendarId === cal.id}
                      onChange={() => setSelectedCalendarId(cal.id)}
                      className="h-3.5 w-3.5 text-warm-accent accent-warm-accent"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-warm-cream">{cal.label}</span>
                        {cal.isCurrent && (
                          <span className="text-[10px] text-warm-accent">(Current)</span>
                        )}
                      </div>
                      <p className="text-[10px] text-warm-muted/60">
                        {new Date(cal.startDate).toLocaleDateString()} — {new Date(cal.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {createAyError && (
              <div className="mt-3 rounded-lg border border-red-900/30 bg-red-900/10 px-3 py-2">
                <p className="text-xs text-red-400">{createAyError}</p>
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setShowCreateAy(false)} className="rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream transition-colors">Cancel</button>
              <button onClick={handleCreateAy} disabled={creatingAy || !selectedCalendarId} className="rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] disabled:opacity-50 transition-colors">
                {creatingAy ? 'Creating…' : 'Create Year'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Modal ───────────────────────────────────── */}
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
