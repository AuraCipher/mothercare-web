'use client';

import { useCallback, useEffect, useState } from 'react';
import { TeacherPageShell } from '@/components/teacher/teacher-page-shell';
import {
  TeacherAlert,
  TeacherButton,
  TeacherEmptyState,
} from '@/components/teacher/teacher-ui';
import { api } from '@/lib/api';

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export default function TeacherNotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.teacherNotifications({ limit: 50 });
      setItems(res.data?.items || []);
      setUnreadCount(res.data?.unreadCount ?? 0);
    } catch (e: any) {
      setError(e.message || 'Failed to load notifications');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markRead = async (id: string) => {
    setBusyId(id);
    try {
      await api.teacherMarkNotificationRead(id);
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      /* ignore */
    } finally {
      setBusyId(null);
    }
  };

  const markAllRead = async () => {
    try {
      await api.teacherMarkAllNotificationsRead();
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      /* ignore */
    }
  };

  return (
    <TeacherPageShell
      title="Notifications"
      subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
    >
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

      {unreadCount > 0 && (
        <div className="mb-4">
          <TeacherButton variant="secondary" onClick={markAllRead}>
            Mark all as read
          </TeacherButton>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-warm-muted">Loading…</p>
      ) : items.length === 0 ? (
        <TeacherEmptyState
          title="No notifications"
          body="School updates from chat channels will appear here when posted."
        />
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <li
              key={n.id}
              className={`teacher-card rounded-xl border p-4 ${
                n.isRead
                  ? 'border-warm-card-border bg-warm-card/60'
                  : 'border-warm-accent/30 bg-warm-card'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-warm-cream">{n.title}</p>
                  <p className="teacher-break-text mt-1 text-xs text-warm-muted">{n.body}</p>
                  <p className="mt-2 text-[10px] text-warm-muted/70">
                    {new Date(n.createdAt).toLocaleString()} · {n.type}
                  </p>
                </div>
                {!n.isRead && (
                  <button
                    type="button"
                    disabled={busyId === n.id}
                    onClick={() => markRead(n.id)}
                    className="shrink-0 rounded-md border border-warm-card-border px-2 py-1 text-[10px] text-warm-muted hover:text-warm-cream"
                  >
                    {busyId === n.id ? '…' : 'Mark read'}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </TeacherPageShell>
  );
}
