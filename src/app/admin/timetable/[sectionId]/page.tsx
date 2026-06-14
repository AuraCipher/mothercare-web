'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { ArrowLeft, BookOpen, GraduationCap } from 'lucide-react';
import { showToast } from '@/components/toast';

interface Slot {
  id: string; dayOfWeek: number | null; lectureNumber: number; startTime: string; endTime: string;
}

interface Entry {
  id?: string; slotId: string; note?: string | null;
  subject: { id: string; name: string; code: string } | null;
  teacher: { id: string; name: string } | null;
}

function SectionTimetableInner() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const sectionId = params.sectionId as string;
  const timetableId = searchParams.get('id') || '';
  const src = searchParams.get('src') || '';
  const isTimetable = src !== 'datesheet';

  const [branchId] = useState(() => localStorage.getItem('activeBranchId') || '');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [section, setSection] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!branchId || !sectionId || !timetableId) return;
    const ayId = localStorage.getItem('activeAYId');
    if (!ayId) return;

    Promise.all([
      api.getSections(branchId, ayId).then(d => setSection((d.data || []).find((s: any) => s.id === sectionId))),
      api.getTimetableSlots(branchId, timetableId),
      api.getSectionTimetable(branchId, sectionId),
      ...(isTimetable ? [
        api.getSubjects(branchId, ayId),
        api.getUsers({ role: 'teacher' }),
      ] : []),
    ]).then((results: any) => {
      const slotData = results[1];
      const entryData = results[2];
      const allSlots = slotData.data || [];
      setSlots(isTimetable ? allSlots.filter((s: any) => s.dayOfWeek === null) : allSlots.filter((s: any) => s.dayOfWeek !== null));
      setEntries(entryData.data || []);
      if (results[3]) setSubjects(results[3].data || []);
      if (results[4]) setTeachers(results[4].data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [sectionId, timetableId, src]);

  const getEntry = (slotId: string) => entries.find((e: any) => e.slotId === slotId);

  const updateEntry = async (slotId: string, field: string, value: string | null) => {
    const current = getEntry(slotId) || { slotId, subject: null, teacher: null };
    const data: any = {};
    if (field === 'subjectId' && value === '__break__') {
      data.subjectId = null; data.teacherId = null; data.note = 'break';
    } else if (field === 'subjectId') {
      data.subjectId = value; data.teacherId = current.teacher?.id || null; data.note = null;
    } else if (field === 'note') {
      data.note = value;
    } else {
      data.subjectId = current.subject?.id || null; data.teacherId = value;
    }
    try {
      await api.upsertTimetableEntry(branchId, sectionId, slotId, data);
      // Reload entries
      const entryData = await api.getSectionTimetable(branchId, sectionId);
      setEntries(entryData.data || []);
    } catch (e: any) {
      showToast('error', e.message || 'Failed to update');
    }
  };

  if (loading) {
    return <main className="mx-auto max-w-4xl px-6 py-10"><div className="h-6 w-48 animate-pulse rounded bg-warm-card mb-6" />{[1,2,3].map(i => <div key={i} className="h-12 rounded-xl bg-warm-card animate-pulse mb-2" />)}</main>;
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <button onClick={() => router.push(src === 'datesheet' ? `/admin/timetable/datesheet/${timetableId}` : `/admin/timetable/grid?id=${timetableId}`)} className="mb-6 flex items-center gap-1.5 text-xs text-warm-muted hover:text-warm-cream transition-colors">
        <ArrowLeft size={13} /> Back
      </button>

      <div className="mb-8">
        <h1 className="text-xl font-light text-warm-cream">{section?.name}{section?.section ? ` — ${section.section}` : ''}</h1>
        <p className="text-sm text-warm-muted mt-0.5">{isTimetable ? 'Timetable' : 'Date Sheet'}</p>
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
                <th className="px-4 py-2.5 text-[10px] uppercase text-warm-muted">Lecture</th>
                <th className="px-4 py-2.5 text-[10px] uppercase text-warm-muted">Time</th>
                <th className="px-4 py-2.5 text-[10px] uppercase text-warm-muted">Subject</th>
                {isTimetable && (
                  <th className="px-4 py-2.5 text-[10px] uppercase text-warm-muted">Teacher</th>
                )}
              </tr>
            </thead>
            <tbody>
              {slots.map(slot => {
                const entry = getEntry(slot.id);
                const isBreak = entry?.note === 'break';
                return (
                  <tr key={slot.id} className="border-b border-warm-card-border last:border-0 hover:bg-warm-card/30">
                    <td className="px-4 py-3 text-sm text-warm-cream">{slot.lectureNumber}</td>
                    <td className="px-4 py-3 text-sm text-warm-cream">{slot.startTime} — {slot.endTime}</td>
                    <td className="px-4 py-3">
                      {isTimetable ? (
                        <select value={entry?.note === 'break' ? '__break__' : entry?.subject?.id || ''} onChange={(e) => updateEntry(slot.id, 'subjectId', e.target.value || null)}
                          className="rounded border border-warm-card-border bg-[#1a1614] px-2 py-1 text-xs text-warm-cream outline-none focus:border-warm-accent w-full">
                          <option value="">—</option>
                          <option value="__break__">🕐 Break</option>
                          {subjects.map((s: any) => (
                            <option key={s.id} value={s.id}>{s.name}{s.code ? ` (${s.code})` : ''}</option>
                          ))}
                        </select>
                      ) : (
                        <input type="text" value={entry?.note || ''} onChange={(e) => updateEntry(slot.id, 'note', e.target.value)}
                          placeholder="Subject"
                          className="rounded border border-warm-card-border bg-[#1a1614] px-2 py-1 text-xs text-warm-cream outline-none focus:border-warm-accent w-full placeholder:text-warm-muted/40"
                          onBlur={(e) => updateEntry(slot.id, 'note', e.target.value)}
                        />
                      )}
                    </td>
                    {isTimetable && (
                      <td className="px-4 py-3">
                        <select value={entry?.teacher?.id || ''} onChange={(e) => updateEntry(slot.id, 'teacher', e.target.value || null)}
                          disabled={isBreak}
                          className={`rounded border border-warm-card-border bg-[#1a1614] px-2 py-1 text-xs outline-none focus:border-warm-accent w-full ${isBreak ? 'text-warm-muted/50 cursor-not-allowed' : 'text-warm-cream'}`}>
                          <option value="">—</option>
                          {teachers.map((t: any) => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      </td>
                    )}
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
