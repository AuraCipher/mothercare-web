'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnnouncementMedia } from '@/components/chat/announcement-media';
import { StudentPageShell } from '@/components/student/student-page-shell';
import { api } from '@/lib/api';

type AnnouncementRow = {
  id: string;
  title: string;
  content: string | null;
  mediaUrl: string | null;
  mediaMimeType?: string | null;
  isPinned: boolean;
  createdAt: string;
  scope: 'school' | 'class';
  group: { id: string; label: string } | null;
  sender: { id: string; name: string; role: string };
};

function formatWhen(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function StudentAnnouncementsPage() {
  const [rows, setRows] = useState<AnnouncementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'pinned' | 'school' | 'class'>('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.studentAnnouncements();
      setRows(res.data || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load announcements');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (filter === 'pinned') return rows.filter((r) => r.isPinned);
    if (filter === 'school') return rows.filter((r) => r.scope === 'school');
    if (filter === 'class') return rows.filter((r) => r.scope === 'class');
    return rows;
  }, [rows, filter]);

  return (
    <StudentPageShell
      title="Announcements"
      subtitle="School-wide and class updates (read-only)"
    >
      <div className="teacher-action-row mb-4 flex-wrap">
        {(
          [
            { id: 'all' as const, label: 'All' },
            { id: 'school' as const, label: 'School-wide' },
            { id: 'class' as const, label: 'My class' },
            { id: 'pinned' as const, label: 'Pinned' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`rounded-lg px-3 py-1.5 text-xs ${
              filter === tab.id
                ? 'bg-warm-cream text-[#1a1614]'
                : 'border border-warm-card-border text-warm-muted'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-warm-card" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="teacher-card rounded-xl border border-warm-card-border bg-warm-card p-8 text-center text-sm text-warm-muted">
          No announcements yet.
        </div>
      )}

      <ul className="space-y-3">
        {filtered.map((row) => (
          <li
            key={row.id}
            className="teacher-card rounded-xl border border-warm-card-border bg-warm-card p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-medium text-warm-cream">{row.title}</h3>
                  {row.isPinned && (
                    <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-200">
                      Pinned
                    </span>
                  )}
                  <span className="rounded bg-warm-card-border/40 px-1.5 py-0.5 text-[10px] text-warm-muted">
                    {row.scope === 'school' ? 'School-wide' : row.group?.label || 'Class'}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-warm-muted">
                  {row.sender.name} · {formatWhen(row.createdAt)}
                </p>
              </div>
            </div>
            {row.content && row.content !== row.title && (
              <p className="teacher-break-text mt-3 whitespace-pre-wrap text-sm text-warm-muted">
                {row.content}
              </p>
            )}
            <AnnouncementMedia mediaUrl={row.mediaUrl} mediaMimeType={row.mediaMimeType} />
          </li>
        ))}
      </ul>
    </StudentPageShell>
  );
}
