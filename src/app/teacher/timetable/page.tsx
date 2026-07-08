'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { TeacherPageShell } from '@/components/teacher/teacher-page-shell';
import { api } from '@/lib/api';
import { formatGroupLabel } from '@/lib/teacher/types';

const DAY_LABELS: Record<number, string> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
  7: 'Sunday',
};

interface TimetableSlot {
  lectureNumber: number;
  startTime: string;
  endTime: string;
  activeDays: number[];
  group: { id: string; name: string; section: string | null };
  subject: { id: string; name: string; code: string | null } | null;
  note: string | null;
}

export default function TeacherTimetablePage() {
  const [data, setData] = useState<{ timetableName: string; slots: TimetableSlot[] } | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadTimetable = () => {
    setLoading(true);
    setError('');
    api
      .teacherTimetable()
      .then((res) => {
        if (res.success) setData(res.data);
        else setError(res.message || 'Failed to load timetable');
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load timetable'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTimetable();
  }, []);

  const byDay = useMemo(() => {
    if (!data?.slots.length) return [];
    const map = new Map<number, TimetableSlot[]>();
    for (const slot of data.slots) {
      for (const day of slot.activeDays) {
        if (!map.has(day)) map.set(day, []);
        map.get(day)!.push(slot);
      }
    }
    return [...map.entries()]
      .sort(([a], [b]) => a - b)
      .map(([day, slots]) => ({
        day,
        label: DAY_LABELS[day] || `Day ${day}`,
        slots: [...slots].sort((a, b) => a.lectureNumber - b.lectureNumber),
      }));
  }, [data]);

  return (
    <TeacherPageShell title="My Timetable" subtitle={data?.timetableName || 'Weekly teaching schedule'}>
      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-warm-card" />
          ))}
        </div>
      )}

      {error && (
        <div className="teacher-break-text rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <div className="teacher-split-row">
            <span className="teacher-split-row__main">{error}</span>
            <button
              type="button"
              onClick={loadTimetable}
              className="teacher-split-row__aside rounded border border-red-400/30 px-2 py-1 text-[11px] text-red-200"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {!loading && !error && byDay.length === 0 && (
        <div className="teacher-card rounded-xl border border-warm-card-border bg-warm-card p-8 text-center text-sm text-warm-muted">
          No timetable entries assigned yet.
        </div>
      )}

      {!loading && byDay.length > 0 && (
        <div className="space-y-4">
          {byDay.map(({ day, label, slots }) => (
            <section key={day} className="teacher-card min-w-0 rounded-xl border border-warm-card-border bg-warm-card p-4">
              <h2 className="text-sm font-medium text-warm-cream">{label}</h2>
              <div className="mt-3 space-y-2">
                {slots.map((slot) => (
                  <div
                    key={`${day}-${slot.lectureNumber}-${slot.group.id}`}
                    className="teacher-split-row rounded-lg border border-warm-card-border/60 bg-[#1a1614]/40 px-3 py-2.5"
                  >
                    <div className="teacher-split-row__main min-w-0">
                      <p className="text-xs text-warm-muted">
                        L{slot.lectureNumber} · {slot.startTime}–{slot.endTime}
                      </p>
                      <p className="teacher-card__title text-sm text-warm-cream">
                        {formatGroupLabel(slot.group)}
                      </p>
                      <p className="teacher-break-text text-xs text-warm-muted">
                        {slot.subject?.name || '—'}
                      </p>
                    </div>
                    <Link
                      href={`/teacher/classes/${slot.group.id}`}
                      className="teacher-split-row__aside shrink-0 text-warm-accent underline"
                    >
                      Class
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </TeacherPageShell>
  );
}
