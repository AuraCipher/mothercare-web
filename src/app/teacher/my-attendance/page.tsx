'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { TeacherPageLoading, TeacherPageShell } from '@/components/teacher/teacher-page-shell';

type AttendanceRow = {
  id: string;
  date: string;
  status: string;
  note?: string | null;
};

export default function TeacherMyAttendancePage() {
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.teacherMyAttendance();
        if (!res.success) throw new Error('Failed to load attendance');
        setRows((res.data as AttendanceRow[]) || []);
      } catch (e: any) {
        setError(e.message || 'Failed to load attendance');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <TeacherPageShell title="My Attendance" subtitle="Your staff attendance records">
        <TeacherPageLoading />
      </TeacherPageShell>
    );
  }

  return (
    <TeacherPageShell title="My Attendance" subtitle="Your staff attendance records">
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}
      {rows.length === 0 ? (
        <p className="text-sm text-warm-muted">No attendance records yet.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <div
              key={row.id}
              className="flex items-center justify-between rounded-lg border border-warm-card-border bg-warm-card px-4 py-3"
            >
              <div>
                <p className="text-sm text-warm-cream">
                  {new Date(row.date).toLocaleDateString(undefined, {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
                {row.note && <p className="mt-0.5 text-xs text-warm-muted">{row.note}</p>}
              </div>
              <span className="rounded-full bg-warm-accent/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-warm-accent">
                {row.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </TeacherPageShell>
  );
}
