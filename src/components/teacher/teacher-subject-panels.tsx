'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
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
}

interface TeacherSubjectTimetablePanelProps {
  groupId: string;
  subjectId: string;
}

export function TeacherSubjectTimetablePanel({ groupId, subjectId }: TeacherSubjectTimetablePanelProps) {
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api
      .teacherTimetable()
      .then((res) => {
        if (!res.success) {
          setError(res.message || 'Failed to load timetable');
          return;
        }
        const filtered = (res.data?.slots || []).filter(
          (s: TimetableSlot) => s.group.id === groupId && s.subject?.id === subjectId,
        );
        setSlots(filtered);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load timetable'))
      .finally(() => setLoading(false));
  }, [groupId, subjectId]);

  const byDay = useMemo(() => {
    const map = new Map<number, TimetableSlot[]>();
    for (const slot of slots) {
      for (const day of slot.activeDays) {
        if (!map.has(day)) map.set(day, []);
        map.get(day)!.push(slot);
      }
    }
    return [...map.entries()]
      .sort(([a], [b]) => a - b)
      .map(([day, daySlots]) => ({
        day,
        label: DAY_LABELS[day] || `Day ${day}`,
        slots: [...daySlots].sort((a, b) => a.lectureNumber - b.lectureNumber),
      }));
  }, [slots]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-warm-card" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="teacher-break-text rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
        {error}
      </div>
    );
  }

  if (byDay.length === 0) {
    return (
      <div className="teacher-card rounded-xl border border-warm-card-border bg-warm-card p-6 text-center text-sm text-warm-muted">
        No timetable slots for this subject in this class.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {byDay.map(({ day, label, slots: daySlots }) => (
        <section key={day} className="teacher-card rounded-xl border border-warm-card-border bg-warm-card p-4">
          <h3 className="text-sm font-medium text-warm-cream">{label}</h3>
          <ul className="mt-2 space-y-2">
            {daySlots.map((slot) => (
              <li
                key={`${day}-${slot.lectureNumber}`}
                className="rounded-lg border border-warm-card-border/60 bg-[#1a1614]/40 px-3 py-2 text-sm"
              >
                <p className="text-xs text-warm-muted">
                  Period {slot.lectureNumber} · {slot.startTime}–{slot.endTime}
                </p>
                <p className="text-warm-cream">{formatGroupLabel(slot.group)}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <Link href="/teacher/timetable" className="teacher-link text-xs">
        Open full timetable
      </Link>
    </div>
  );
}

type MarksRow = {
  examClassSubjectId: string;
  subject: { id: string; name: string };
  group: { id: string; name: string; section: string | null };
  exam: { name: string; status: string };
  session: { name: string };
  canWrite: boolean;
  marksEntryCount: number;
  locked: boolean;
};

interface TeacherSubjectMarksPanelProps {
  groupId: string;
  subjectId: string;
}

export function TeacherSubjectMarksPanel({ groupId, subjectId }: TeacherSubjectMarksPanelProps) {
  const [rows, setRows] = useState<MarksRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api
      .teacherMarksSubjects()
      .then((res) => {
        if (!res.success) {
          setError(res.message || 'Failed to load marks');
          return;
        }
        const filtered = (res.data || []).filter(
          (r: MarksRow) => r.group.id === groupId && r.subject.id === subjectId,
        );
        setRows(filtered);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load marks'))
      .finally(() => setLoading(false));
  }, [groupId, subjectId]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-warm-card" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="teacher-break-text rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
        {error}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="teacher-card rounded-xl border border-warm-card-border bg-warm-card p-6 text-center text-sm text-warm-muted">
        No exam mark sheets for this subject yet.
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {rows.map((row) => (
        <li
          key={row.examClassSubjectId}
          className="teacher-card flex min-w-0 items-center justify-between gap-3 rounded-xl border border-warm-card-border bg-warm-card p-4"
        >
          <div className="min-w-0">
            <p className="text-sm text-warm-cream">{row.exam.name}</p>
            <p className="text-xs text-warm-muted">
              {row.session.name} · {row.marksEntryCount} entered · {row.exam.status}
            </p>
          </div>
          <Link
            href={`/teacher/marks/${row.examClassSubjectId}`}
            className="shrink-0 rounded-lg border border-warm-accent/40 bg-warm-accent/10 px-3 py-1.5 text-xs text-warm-cream"
          >
            {row.canWrite && !row.locked ? 'Enter marks' : 'View'}
          </Link>
        </li>
      ))}
    </ul>
  );
}
