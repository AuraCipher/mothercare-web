'use client';

import { useCallback, useEffect, useState } from 'react';
import { StudentPageShell } from '@/components/student/student-page-shell';
import { api } from '@/lib/api';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function statusBadge(status: string) {
  if (status === 'present') return 'bg-emerald-500/20 text-emerald-300';
  if (status === 'late') return 'bg-amber-500/20 text-amber-300';
  return 'bg-red-500/20 text-red-300';
}

export default function StudentAttendancePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.studentAttendance();
      if (res.success) setData(res.data);
      else setError(res.message || 'Failed to load attendance');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const summary = data?.summary;

  return (
    <StudentPageShell
      title="Attendance"
      subtitle="Your attendance record (read-only)"
    >
      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-warm-card" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {summary && (
        <div className="teacher-stat-grid mb-6">
          <div className="teacher-card rounded-xl border border-warm-card-border bg-warm-card p-4">
            <p className="text-xs text-warm-muted">Attendance rate</p>
            <p className="mt-1 text-lg text-warm-cream">{summary.percentage}%</p>
          </div>
          <div className="teacher-card rounded-xl border border-warm-card-border bg-warm-card p-4">
            <p className="text-xs text-warm-muted">Present</p>
            <p className="mt-1 text-lg text-emerald-300">{summary.present}</p>
          </div>
          <div className="teacher-card rounded-xl border border-warm-card-border bg-warm-card p-4">
            <p className="text-xs text-warm-muted">Absent / Late</p>
            <p className="mt-1 text-lg text-warm-cream">
              {summary.absent} / {summary.late}
            </p>
          </div>
        </div>
      )}

      {!loading && !error && data?.records?.length === 0 && (
        <div className="teacher-card rounded-xl border border-warm-card-border bg-warm-card p-8 text-center text-sm text-warm-muted">
          No attendance records yet.
        </div>
      )}

      {data?.records?.length > 0 && (
        <ul className="teacher-card divide-y divide-warm-card-border rounded-xl border border-warm-card-border bg-warm-card">
          {data.records.map((row: any, i: number) => (
            <li key={i} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <div>
                <p className="text-warm-cream">{formatDate(row.date)}</p>
                {row.note && <p className="text-xs text-warm-muted">{row.note}</p>}
              </div>
              <span className={`rounded px-2 py-0.5 text-xs capitalize ${statusBadge(row.status)}`}>
                {row.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </StudentPageShell>
  );
}
