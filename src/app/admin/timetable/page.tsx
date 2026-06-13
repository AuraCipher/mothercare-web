'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { CalendarDays, BookOpen } from 'lucide-react';

interface Section {
  id: string; name: string; section: string | null; displayOrder: number; isActive: boolean;
  _count?: { students: number; members: number; groupSubjects?: number; teacherAssignments?: number };
}

export default function TimetablePage() {
  const router = useRouter();
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const bId = localStorage.getItem('activeBranchId');
    const ayId = localStorage.getItem('activeAYId');
    if (!bId || !ayId) {
      setError('Select an academic year from the sidebar and press Go.');
      setLoading(false);
      return;
    }

    api.getSections(bId, ayId)
      .then(d => setSections(d.data || []))
      .catch(() => setError('Failed to load classes'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="mb-1 text-xl font-light text-warm-cream">Timetable</h1>
        <p className="mb-8 text-sm text-warm-muted">Loading…</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-warm-card animate-pulse" />
          ))}
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="mb-1 text-xl font-light text-warm-cream">Timetable</h1>
        <p className="mb-8 text-sm text-warm-muted">{error}</p>
      </main>
    );
  }

  // Already sorted by backend (displayOrder ASC, section ASC)
  const sorted = sections;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8">
        <h1 className="mb-1 text-xl font-light text-warm-cream">Timetable</h1>
        <p className="text-sm text-warm-muted">{sorted.length} section{sorted.length !== 1 ? 's' : ''}</p>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-12 text-center">
          <CalendarDays size={40} className="mx-auto mb-4 text-warm-muted" />
          <p className="text-sm text-warm-muted">No classes yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {sorted.map(sec => (
            <div key={sec.id}
              onClick={() => router.push(`/admin/classes`)}
              className="rounded-xl border border-warm-card-border bg-warm-card p-3 cursor-pointer hover:border-warm-accent/40 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <BookOpen size={13} className="text-warm-accent shrink-0" />
                <span className="text-sm font-medium text-warm-cream truncate">{sec.name}</span>
              </div>
              {sec.section && (
                <p className="text-xs text-warm-accent/80 mb-1">Section — {sec.section}</p>
              )}
              <p className="text-[10px] text-warm-muted">
                {sec._count?.students !== undefined ? `${sec._count.students} student${sec._count.students !== 1 ? 's' : ''}` : ''}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
