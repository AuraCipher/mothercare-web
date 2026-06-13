'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { ArrowLeft, BookOpen, GraduationCap } from 'lucide-react';

interface Slot {
  id: string; dayOfWeek: number | null; lectureNumber: number; startTime: string; endTime: string;
}

interface Entry {
  id: string; slotId: string; groupId: string;
  slot: { dayOfWeek: number; startTime: string; endTime: string; lectureNumber: number };
  subject: { id: string; name: string; code: string } | null;
  teacher: { id: string; name: string } | null;
}


function SectionTimetableInner() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const sectionId = params.sectionId as string;
  const timetableId = searchParams.get('id') || '';

  const [branchId] = useState(() => localStorage.getItem('activeBranchId') || '');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [section, setSection] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!branchId || !sectionId || !timetableId) return;
    const ayId = localStorage.getItem('activeAYId');
    if (!ayId) return;

    Promise.all([
      api.getSections(branchId, ayId).then(d => {
        const sec = (d.data || []).find((s: any) => s.id === sectionId);
        setSection(sec);
      }),
      api.getTimetableSlots(branchId, timetableId),
      api.getSectionTimetable(branchId, sectionId),
    ]).then(([_, slotData, entryData]) => {
      setSlots(slotData.data || []);
      setEntries(entryData.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [sectionId, timetableId]);

  const getEntry = (slotId: string) => entries.find(e => e.slotId === slotId);

  if (loading) {
    return <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="h-6 w-48 animate-pulse rounded bg-warm-card mb-6" />
      {[1,2,3].map(i => <div key={i} className="h-12 rounded-xl bg-warm-card animate-pulse mb-2" />)}
    </main>;
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <button onClick={() => router.push(`/admin/timetable/grid?id=${timetableId}`)} className="mb-6 flex items-center gap-1.5 text-xs text-warm-muted hover:text-warm-cream transition-colors">
        <ArrowLeft size={13} /> Back to Timetable
      </button>

      <div className="mb-8">
        <h1 className="text-xl font-light text-warm-cream">
          {section?.name}{section?.section ? ` — ${section.section}` : ''}
        </h1>
        <p className="text-sm text-warm-muted mt-0.5">Timetable</p>
      </div>

      {slots.length === 0 ? (
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-10 text-center">
          <BookOpen size={28} className="mx-auto mb-3 text-warm-muted" />
          <p className="text-sm text-warm-muted">No lectures defined for this timetable.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-warm-card-border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-warm-card-border bg-warm-card/50">
                <th className="px-4 py-2.5 text-[10px] font-medium tracking-wider text-warm-muted uppercase">Lecture</th>
                <th className="px-4 py-2.5 text-[10px] font-medium tracking-wider text-warm-muted uppercase">Time</th>
                <th className="px-4 py-2.5 text-[10px] font-medium tracking-wider text-warm-muted uppercase">Subject</th>
                <th className="px-4 py-2.5 text-[10px] font-medium tracking-wider text-warm-muted uppercase">Teacher</th>
              </tr>
            </thead>
            <tbody>
              {slots.map(slot => {
                const entry = getEntry(slot.id);
                return (
                  <tr key={slot.id} className="border-b border-warm-card-border last:border-0 hover:bg-warm-card/30">
                    <td className="px-4 py-3 text-sm text-warm-cream">{slot.lectureNumber}</td>
                    <td className="px-4 py-3 text-sm text-warm-cream">{slot.startTime} — {slot.endTime}</td>
                    <td className="px-4 py-3 text-sm text-warm-cream">
                      {entry?.subject ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-warm-accent/10 px-2 py-0.5 text-[11px] text-warm-accent">
                          <BookOpen size={10} /> {entry.subject.name}
                        </span>
                      ) : <span className="text-xs text-warm-muted">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-warm-cream">
                      {entry?.teacher ? (
                        <span className="inline-flex items-center gap-1 text-xs text-warm-cream">
                          <GraduationCap size={11} className="text-warm-accent" /> {entry.teacher.name}
                        </span>
                      ) : <span className="text-xs text-warm-muted">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

export default function SectionTimetablePage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-4xl px-6 py-10"><div className="h-6 w-48 animate-pulse rounded bg-warm-card mb-6" /></main>}>
      <SectionTimetableInner />
    </Suspense>
  );
}
