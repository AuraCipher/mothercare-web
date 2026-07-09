'use client';

import { useEffect, useMemo, useState } from 'react';
import { StudentPageShell } from '@/components/student/student-page-shell';
import { api } from '@/lib/api';

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
  dayOfWeek: number | null;
  subject: { id: string; name: string; code: string | null } | null;
  teacher: { id: string; name: string } | null;
  note: string | null;
}

export default function StudentTimetablePage() {
  const [data, setData] = useState<{
    timetableName: string;
    groupLabel?: string;
    slots: TimetableSlot[];
  } | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadTimetable = () => {
    setLoading(true);
    setError('');
    api
      .studentTimetable()
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
      const day = slot.dayOfWeek ?? 0;
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(slot);
    }
    return [...map.entries()]
      .sort(([a], [b]) => (a === 0 ? 99 : a) - (b === 0 ? 99 : b))
      .map(([day, slots]) => ({
        day,
        label: day === 0 ? 'All days' : DAY_LABELS[day] || `Day ${day}`,
        slots: [...slots].sort((a, b) => a.lectureNumber - b.lectureNumber),
      }));
  }, [data]);

  return (
    <StudentPageShell
      title="Class Timetable"
      subtitle={data?.timetableName || 'Weekly schedule'}
    >
      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-warm-card" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {!loading && !error && byDay.length === 0 && (
        <div className="teacher-card rounded-xl border border-warm-card-border bg-warm-card p-8 text-center text-sm text-warm-muted">
          No timetable published for your class yet.
        </div>
      )}

      {!loading && byDay.length > 0 && (
        <div className="space-y-6">
          {byDay.map(({ day, label, slots }) => (
            <section key={day}>
              <h2 className="mb-2 text-sm font-medium text-warm-cream">{label}</h2>
              <ul className="teacher-card divide-y divide-warm-card-border rounded-xl border border-warm-card-border bg-warm-card">
                {slots.map((slot, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="text-warm-cream">{slot.subject?.name || '—'}</p>
                      <p className="text-xs text-warm-muted">
                        {slot.teacher?.name || '—'} · P{slot.lectureNumber}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-warm-muted">
                      {slot.startTime}–{slot.endTime}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </StudentPageShell>
  );
}
