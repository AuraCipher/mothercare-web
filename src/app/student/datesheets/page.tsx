'use client';

import { useEffect, useState } from 'react';
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

type DatesheetEntry = {
  lectureNumber: number;
  startTime: string;
  endTime: string;
  dayOfWeek: number | null;
  subject: { id: string; name: string; code: string | null } | null;
  teacher: { id: string; name: string } | null;
  note: string | null;
};

type Datesheet = {
  id: string;
  name: string;
  entries: DatesheetEntry[];
};

export default function StudentDatesheetsPage() {
  const [datesheets, setDatesheets] = useState<Datesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .studentDatesheets()
      .then((res) => {
        if (res.success) setDatesheets(res.data || []);
        else setError(res.message || 'Failed to load datesheets');
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load datesheets'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <StudentPageShell
      title="Datesheets"
      subtitle="All active exam datesheets for your class"
    >
      {loading && (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-warm-card" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {!loading && !error && datesheets.length === 0 && (
        <div className="teacher-card rounded-xl border border-warm-card-border bg-warm-card p-8 text-center text-sm text-warm-muted">
          No active datesheets for your class.
        </div>
      )}

      <div className="space-y-6">
        {datesheets.map((ds) => (
          <section key={ds.id}>
            <h2 className="mb-2 text-sm font-medium text-warm-cream">{ds.name}</h2>
            {ds.entries.length === 0 ? (
              <p className="text-xs text-warm-muted">No entries for your class in this datesheet.</p>
            ) : (
              <ul className="teacher-card divide-y divide-warm-card-border rounded-xl border border-warm-card-border bg-warm-card">
                {ds.entries.map((entry, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="text-warm-cream">{entry.subject?.name || entry.note || '—'}</p>
                      <p className="text-xs text-warm-muted">
                        {entry.dayOfWeek != null ? DAY_LABELS[entry.dayOfWeek] || `Day ${entry.dayOfWeek}` : '—'}
                        {entry.teacher?.name ? ` · ${entry.teacher.name}` : ''}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-warm-muted">
                      {entry.startTime}–{entry.endTime}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </StudentPageShell>
  );
}
