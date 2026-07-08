'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
  isPinned: boolean;
  createdAt: string;
  scope: 'school';
  sender: { id: string; name: string; role: string };
};

function formatWhen(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function TeacherAnnouncementsPage() {
  const { data: bootstrap } = useTeacherBootstrap();
  const [rows, setRows] = useState<AnnouncementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'pinned'>('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.teacherAnnouncements();
      setRows(res.data || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load announcements');
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
    return rows;
  }, [rows, filter]);

  if (!bootstrap) return null;

  if (bootstrap.portal.isFrozen) {
    return (
      <TeacherPageShell title="Announcements" subtitle="School updates">
        <TeacherAlert tone="warning">
          {bootstrap.portal.freezeReason || 'Portal access is frozen.'}
        </TeacherAlert>
      </TeacherPageShell>
    );
  }

  return (
    <TeacherPageShell title="Announcements" subtitle="School updates for your branch and academic year">
      <div className="teacher-action-row">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`teacher-btn ${filter === 'all' ? 'teacher-btn--primary' : 'teacher-btn--secondary'}`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setFilter('pinned')}
          className={`teacher-btn ${filter === 'pinned' ? 'teacher-btn--primary' : 'teacher-btn--secondary'}`}
        >
          Pinned
        </button>
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
              : 'When administration posts updates, they will appear here.'
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
                <TeacherBadge tone="neutral">School-wide</TeacherBadge>
              </div>
              {row.content && (
                <p className="teacher-break-text text-sm text-warm-muted">{row.content}</p>
              )}
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
