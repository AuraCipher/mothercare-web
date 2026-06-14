'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { ArrowLeft, BookOpen, Plus, Trash2, CalendarDays, Edit3, X } from 'lucide-react';
import { showToast } from '@/components/toast';

interface Slot {
  id: string; dayOfWeek: number; lectureNumber: number; startTime: string; endTime: string;
}

const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function DatesheetPage() {
  const router = useRouter();
  const params = useParams();
  const datesheetId = params.id as string;
  const [branchId] = useState(() => localStorage.getItem('activeBranchId') || '');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);

  // Add form
  const [addDay, setAddDay] = useState(1);
  const [addStart, setAddStart] = useState('09:00');
  const [addEnd, setAddEnd] = useState('12:00');

  useEffect(() => {
    if (!branchId || !datesheetId) return;
    const ayId = localStorage.getItem('activeAYId');
    if (!ayId) return;
    loadAll(branchId, ayId);
  }, [datesheetId]);

  const loadAll = async (bId: string, aId: string) => {
    try {
      const [slotData, secData] = await Promise.all([
        api.getTimetableSlots(bId, datesheetId),
        api.getSections(bId, aId),
      ]);
      setSlots((slotData.data || []).filter((s: any) => s.dayOfWeek !== null));
      setSections(secData.data || []);
    } catch {} finally { setLoading(false); }
  };

  const addSlot = async () => {
    if (!branchId || !datesheetId) return;
    try {
      await api.createTimetableSlot(branchId, datesheetId, { dayOfWeek: addDay, startTime: addStart, endTime: addEnd });
      const data = await api.getTimetableSlots(branchId, datesheetId);
      setSlots((data.data || []).filter((s: any) => s.dayOfWeek !== null));
      showToast('success', 'Paper added');
    } catch (e: any) { showToast('error', e.message || 'Failed to add'); }
  };

  const removeSlot = async (slotId: string) => {
    if (!branchId || !datesheetId) return;
    try {
      await api.deleteTimetableSlot(branchId, datesheetId, slotId);
      setSlots(prev => prev.filter(s => s.id !== slotId));
      showToast('success', 'Paper removed');
    } catch (e: any) { showToast('error', e.message || 'Failed to remove'); }
  };

  if (loading) {
    return <main className="mx-auto max-w-5xl px-6 py-10"><div className="h-6 w-48 animate-pulse rounded bg-warm-card mb-6" />{[1,2,3].map(i => <div key={i} className="h-12 rounded-xl bg-warm-card animate-pulse mb-2" />)}</main>;
  }

  const sortedSlots = [...slots].sort((a, b) => (a.dayOfWeek - b.dayOfWeek) || (a.lectureNumber - b.lectureNumber));
  const sortedSections = [...sections].sort((a: any, b: any) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <button onClick={() => router.push('/admin/timetable')} className="mb-6 flex items-center gap-1.5 text-xs text-warm-muted hover:text-warm-cream">
        <ArrowLeft size={13} /> Back
      </button>

      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-xl font-light text-warm-cream">Date Sheet</h1>
        <button onClick={() => setShowEditor(!showEditor)}
          className="flex items-center gap-1.5 rounded-lg bg-warm-accent px-3.5 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] transition-colors">
          {showEditor ? <X size={14} /> : <Edit3 size={14} />}
          {showEditor ? 'Done Editing' : 'Edit Papers'}
        </button>
      </div>

      {/* ── Editor: Paper Schedule + Add Paper ─────────── */}
      {showEditor && (
        <div className="mb-10">
          {sortedSlots.length === 0 ? (
            <div className="rounded-xl border border-warm-card-border bg-warm-card p-8 text-center mb-4">
              <BookOpen size={24} className="mx-auto mb-2 text-warm-muted" />
              <p className="text-sm text-warm-muted">No papers yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-warm-card-border mb-4">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-warm-card-border bg-warm-card/50">
                    <th className="px-4 py-2.5 text-[10px] uppercase text-warm-muted">Day</th>
                    <th className="px-4 py-2.5 text-[10px] uppercase text-warm-muted">Paper</th>
                    <th className="px-4 py-2.5 text-[10px] uppercase text-warm-muted">Time</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {sortedSlots.map(slot => (
                    <tr key={slot.id} className="border-b border-warm-card-border last:border-0 hover:bg-warm-card/30">
                      <td className="px-4 py-3 text-sm text-warm-cream">{DAY_NAMES[slot.dayOfWeek]}</td>
                      <td className="px-4 py-3 text-sm text-warm-cream">{slot.lectureNumber}</td>
                      <td className="px-4 py-3 text-sm text-warm-cream">{slot.startTime} — {slot.endTime}</td>
                      <td className="px-4 py-3"><button onClick={() => removeSlot(slot.id)} className="rounded p-1 text-warm-muted hover:text-red"><Trash2 size={13} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Add Paper */}
          <div className="rounded-xl border border-warm-card-border bg-warm-card p-4">
            <h3 className="mb-3 text-xs font-medium text-warm-cream">Add Paper</h3>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="mb-1 block text-[10px] text-warm-muted">Day</label>
                <select value={addDay} onChange={(e) => setAddDay(Number(e.target.value))}
                  className="rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent">
                  {[1,2,3,4,5,6].map(d => <option key={d} value={d}>{DAY_NAMES[d]}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[10px] text-warm-muted">Start</label>
                <input type="time" value={addStart} onChange={(e) => setAddStart(e.target.value)}
                  className="rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent [color-scheme:dark]" />
              </div>
              <div>
                <label className="mb-1 block text-[10px] text-warm-muted">End</label>
                <input type="time" value={addEnd} onChange={(e) => setAddEnd(e.target.value)}
                  className="rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent [color-scheme:dark]" />
              </div>
              <button onClick={addSlot} className="flex items-center gap-1 rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76]">
                <Plus size={13} /> Add Paper
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Class/Section Cards ─────────────────────── */}
      <h2 className="mb-4 text-sm font-medium text-warm-cream">Classes</h2>
      {sortedSections.length === 0 ? (
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-8 text-center">
          <CalendarDays size={28} className="mx-auto mb-3 text-warm-muted" />
          <p className="text-sm text-warm-muted">No classes found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {sortedSections.map((sec: any) => (
            <div key={sec.id} onClick={() => router.push(`/admin/timetable/${sec.id}?id=${datesheetId}&src=datesheet`)}
              className="rounded-xl border border-warm-card-border bg-warm-card p-3 cursor-pointer hover:border-warm-accent/40 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen size={13} className="text-warm-accent shrink-0" />
                <span className="text-sm font-medium text-warm-cream truncate">{sec.name}</span>
              </div>
              {sec.section && <p className="text-xs text-warm-accent/80 mb-1">Section — {sec.section}</p>}
              <p className="text-[10px] text-warm-muted">{sec._count?.students || 0} students</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
