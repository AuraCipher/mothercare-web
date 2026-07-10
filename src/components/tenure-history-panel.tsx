'use client';

import { useMemo, useState } from 'react';
import { LogIn, LogOut } from 'lucide-react';
import { showToast } from '@/components/toast';

export type TenureRecord = {
  id: string;
  sequence: number;
  joinedAt: string;
  leftAt?: string | null;
  endReason?: string | null;
  notes?: string | null;
};

export type TenureLeaveReason = { value: string; label: string };

const DEFAULT_LEAVE_REASONS: TenureLeaveReason[] = [
  { value: 'RESIGNED', label: 'Resigned' },
  { value: 'TERMINATED', label: 'Terminated' },
  { value: 'TRANSFERRED', label: 'Transferred' },
  { value: 'LEAVE', label: 'Leave of absence' },
  { value: 'OTHER', label: 'Other' },
];

type TenureHistoryPanelProps = {
  tenures: TenureRecord[];
  onRefresh: () => void;
  onRecordJoin: () => Promise<void>;
  onRecordLeave: (data: { endReason: string; notes?: string }) => Promise<void>;
  leaveReasons?: TenureLeaveReason[];
};

export default function TenureHistoryPanel({
  tenures,
  onRefresh,
  onRecordJoin,
  onRecordLeave,
  leaveReasons = DEFAULT_LEAVE_REASONS,
}: TenureHistoryPanelProps) {
  const [reason, setReason] = useState(leaveReasons[0]?.value ?? 'RESIGNED');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const openTenure = useMemo(
    () => [...tenures].reverse().find((t) => !t.leftAt) ?? null,
    [tenures],
  );
  const isActive = openTenure != null;

  const runAction = async (action: () => Promise<void>, successMessage: string) => {
    setSaving(true);
    try {
      await action();
      showToast('success', successMessage);
      setNote('');
      onRefresh();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Request failed';
      showToast('error', message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-warm-muted">
          {isActive
            ? 'Currently active at this branch. Record a leave when their tenure ends.'
            : 'No active tenure. Record a rejoin when they return to this branch.'}
        </p>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
            isActive
              ? 'bg-green-900/30 text-green-400 ring-1 ring-green-800/40'
              : 'bg-warm-card-border/40 text-warm-muted ring-1 ring-warm-card-border/60'
          }`}
        >
          {isActive ? 'Active' : 'Not on roll'}
        </span>
      </div>

      <div className="space-y-1.5">
        {tenures.length === 0 ? (
          <p className="text-xs text-warm-muted">No tenure events yet.</p>
        ) : (
          tenures.map((t) => (
            <div
              key={t.id}
              className="flex items-start justify-between gap-3 rounded-lg border border-warm-card-border/40 px-3 py-2 text-xs"
            >
              <div>
                <p className="font-medium text-warm-cream">
                  #{t.sequence} · Joined {new Date(t.joinedAt).toLocaleDateString()}
                  {t.leftAt
                    ? ` → Left ${new Date(t.leftAt).toLocaleDateString()}`
                    : ' → Present'}
                </p>
                {t.notes ? <p className="mt-0.5 text-warm-muted">{t.notes}</p> : null}
              </div>
              <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-warm-muted">
                {t.endReason || (t.leftAt ? '—' : 'Active')}
              </span>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-warm-card-border/40 pt-4">
        {isActive ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-warm-cream">
              <LogOut className="h-4 w-4 text-yellow-500/80" />
              Record leave
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <label className="flex flex-col gap-1 text-[10px] uppercase tracking-wide text-warm-muted sm:w-44">
                Reason
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={saving}
                  className="rounded-lg border border-warm-card-border bg-[#1a1614] px-2 py-2 text-xs normal-case tracking-normal text-warm-cream"
                >
                  {leaveReasons.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex min-w-0 flex-1 flex-col gap-1 text-[10px] uppercase tracking-wide text-warm-muted">
                Note (optional)
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  disabled={saving}
                  placeholder="e.g. end of contract, transferred to another campus"
                  className="rounded-lg border border-warm-card-border bg-[#1a1614] px-2 py-2 text-xs normal-case tracking-normal text-warm-cream placeholder:text-warm-muted/60"
                />
              </label>
              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  runAction(
                    () => onRecordLeave({ endReason: reason, notes: note.trim() || undefined }),
                    'Leave recorded',
                  )
                }
                className="shrink-0 rounded-lg bg-yellow-900/25 px-4 py-2 text-xs font-medium text-yellow-400 ring-1 ring-yellow-800/40 hover:bg-yellow-900/40 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Record leave'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-warm-cream">
              <LogIn className="h-4 w-4 text-green-500/80" />
              Record rejoin
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <label className="flex min-w-0 flex-1 flex-col gap-1 text-[10px] uppercase tracking-wide text-warm-muted">
                Note (optional)
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  disabled={saving}
                  placeholder="e.g. rehired for new academic year"
                  className="rounded-lg border border-warm-card-border bg-[#1a1614] px-2 py-2 text-xs normal-case tracking-normal text-warm-cream placeholder:text-warm-muted/60"
                />
              </label>
              <button
                type="button"
                disabled={saving}
                onClick={() => runAction(onRecordJoin, 'Rejoin recorded')}
                className="shrink-0 rounded-lg bg-green-900/25 px-4 py-2 text-xs font-medium text-green-400 ring-1 ring-green-800/40 hover:bg-green-900/40 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Record rejoin'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
