'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnnouncementMedia } from '@/components/chat/announcement-media';
import { TeacherPageShell } from '@/components/teacher/teacher-page-shell';
import {
  TeacherAlert,
  TeacherBadge,
  TeacherButton,
  TeacherEmptyState,
} from '@/components/teacher/teacher-ui';
import { api } from '@/lib/api';
import { useTeacherBootstrap } from '@/lib/teacher/use-teacher-bootstrap';

type AnnouncementRow = {
  id: string;
  title: string;
  content: string | null;
  mediaUrl: string | null;
  mediaMimeType?: string | null;
  isPinned: boolean;
  createdAt: string;
  scope: 'school' | 'class' | 'teachers';
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

function scopeLabel(row: AnnouncementRow) {
  if (row.scope === 'school') return 'School-wide';
  if (row.scope === 'teachers') return 'Staff only';
  return row.group?.label || 'Class';
}

export default function TeacherAnnouncementsPage() {
  const { data: bootstrap } = useTeacherBootstrap();
  const [rows, setRows] = useState<AnnouncementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'pinned' | 'school' | 'class' | 'teachers'>('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.teacherAnnouncements();
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
    if (filter === 'teachers') return rows.filter((r) => r.scope === 'teachers');
    return rows;
  }, [rows, filter]);

  if (!bootstrap) return null;

  return (
    <TeacherPageShell
      title="Announcements"
      subtitle="School-wide, staff, and class updates for your assigned groups (read-only)"
    >
      <div className="teacher-action-row flex-wrap">
        {(
          [
            { id: 'all' as const, label: 'All' },
            { id: 'school' as const, label: 'School-wide' },
            { id: 'teachers' as const, label: 'Staff' },
            { id: 'class' as const, label: 'My classes' },
            { id: 'pinned' as const, label: 'Pinned' },
          ] as const
        ).map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setFilter(opt.id)}
            className={`teacher-btn ${filter === opt.id ? 'teacher-btn--primary' : 'teacher-btn--secondary'}`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {error && (
        <TeacherAlert
          tone="error"
          action={
            <TeacherButton variant="secondary" onClick={load}>
              Retry
            </TeacherButton>
          }
        >
          {error}
        </TeacherAlert>
      )}

      {loading ? (
        <p className="text-sm text-warm-muted">Loading announcements…</p>
      ) : filtered.length === 0 ? (
        <TeacherEmptyState
          title="No announcements"
          body={
            filter === 'pinned'
              ? 'No pinned announcements right now.'
              : filter === 'class'
                ? 'No class-specific announcements for your assigned groups.'
                : filter === 'teachers'
                  ? 'No staff-only announcements right now.'
                  : 'When administration posts updates in chat, they will appear here.'
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((row) => (
            <article
              key={row.id}
              className="teacher-card rounded-xl border border-warm-card-border bg-warm-card p-4"
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-medium text-warm-cream">{row.title}</h2>
                {row.isPinned && <TeacherBadge tone="accent">Pinned</TeacherBadge>}
                <TeacherBadge tone={row.scope === 'school' ? 'neutral' : row.scope === 'teachers' ? 'accent' : 'success'}>
                  {scopeLabel(row)}
                </TeacherBadge>
              </div>
              {row.content && row.content !== row.title && (
                <p className="teacher-break-text whitespace-pre-wrap text-sm text-warm-muted">{row.content}</p>
              )}
              <AnnouncementMedia mediaUrl={row.mediaUrl} mediaMimeType={row.mediaMimeType} />
              <p className="mt-2 text-xs text-warm-muted">
                {row.sender.name} · {formatWhen(row.createdAt)}
              </p>
            </article>
          ))}
        </div>
      )}
    </TeacherPageShell>
  );
}
