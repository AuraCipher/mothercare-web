'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { CalendarDays, BookOpen, Plus, Trash2, X, Save, Edit3 } from 'lucide-react';
import { showToast } from '@/components/toast';

interface Section {
  id: string; name: string; section: string | null; displayOrder: number; isActive: boolean;
  _count?: { students: number; members: number; groupSubjects?: number; teacherAssignments?: number };
}

interface Slot {
  id: string; dayOfWeek: number; lectureNumber: number; startTime: string; endTime: string;
}

const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function TimetablePage() {
  const router = useRouter();
  const [sections, setSections] = useState<Section[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSlotEditor, setShowSlotEditor] = useState(false);
  const [branchId, setBranchId] = useState('');
  const [ayId, setAyId] = useState('');

  useEffect(() => {
    const bId = localStorage.getItem('activeBranchId');
    const aId = localStorage.getItem('activeAYId');
    if (!bId || !aId) {
      setError('Select an academic year from the sidebar and press Go.');
      setLoading(false); return;
    }
    setBranchId(bId);
    setAyId(aId);
    Promise.all([
      api.getSections(bId, aId),
      api.getTimetableSlots(bId, aId),
    ]).then(([secData, slotData]) => {
      setSections(secData.data || []);
      setSlots(slotData.data || []);
    }).catch(() => setError('Failed to load data'))
    .finally(() => setLoading(false));
  }, []);

  // Already sorted by backend
  const sorted = sections;

  // ─── Slot Editor ────────────────────────────────

  const [editSlots, setEditSlots] = useState<Slot[]>([]);
  const [newSlotDay, setNewSlotDay] = useState(1);
  const [newSlotStart, setNewSlotStart] = useState('08:00');
  const [newSlotEnd, setNewSlotEnd] = useState('08:40');

  const openSlotEditor = () => {
    setEditSlots(slots.map(s => ({ ...s })));
    setShowSlotEditor(true);
  };

  const addRow = async () => {
    if (!branchId || !ayId) return;
    try {
      await api.createTimetableSlot(branchId, ayId, { dayOfWeek: newSlotDay, startTime: newSlotStart, endTime: newSlotEnd });
      const data = await api.getTimetableSlots(branchId, ayId);
      setSlots(data.data || []);
      setEditSlots(data.data?.map((s: any) => ({ ...s })) || []);
      showToast('success', 'Lecture added');
    } catch (e: any) {
      showToast('error', e.message || 'Failed to add');
    }
  };

  const deleteSlot = async (id: string) => {
    if (!branchId) return;
    try {
      await api.deleteTimetableSlot(branchId, id);
      setEditSlots(prev => prev.filter(s => s.id !== id));
      setSlots(prev => prev.filter(s => s.id !== id));
      showToast('success', 'Lecture removed');
    } catch (e: any) {
      showToast('error', e.message || 'Failed to delete');
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="mb-1 text-xl font-light text-warm-cream">Timetable</h1>
        <div className="grid grid-cols-5 gap-3 mt-8">
          {Array.from({ length: 10 }).map((_, i) => (<div key={i} className="h-24 rounded-xl bg-warm-card animate-pulse" />))}
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="mb-1 text-xl font-light text-warm-cream">Timetable</h1>
        <p className="text-sm text-warm-muted">{error}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-xl font-light text-warm-cream">Timetable</h1>
          <p className="text-sm text-warm-muted">
            {showSlotEditor
              ? `${editSlots.length} lecture(s) · Click a section card to assign subjects/teachers`
              : `${sorted.length} section(s) · ${slots.length} lecture(s) defined`}
          </p>
        </div>
        <button onClick={showSlotEditor ? () => setShowSlotEditor(false) : openSlotEditor}
          className="flex items-center gap-1.5 rounded-lg bg-warm-accent px-3.5 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] transition-colors">
          {showSlotEditor ? <X size={14} /> : <Edit3 size={14} />}
          {showSlotEditor ? 'Done Editing' : 'Edit Lectures'}
        </button>
      </div>

      {/* ── Slot Editor Mode ──────────────────────── */}
      {showSlotEditor ? (
        <div>
          <div className="overflow-x-auto rounded-xl border border-warm-card-border">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-warm-card-border bg-warm-card/50">
                  <th className="px-4 py-3 text-[10px] font-medium tracking-wider text-warm-muted uppercase">Day</th>
                  <th className="px-4 py-3 text-[10px] font-medium tracking-wider text-warm-muted uppercase">Lecture</th>
                  <th className="px-4 py-3 text-[10px] font-medium tracking-wider text-warm-muted uppercase">Start</th>
                  <th className="px-4 py-3 text-[10px] font-medium tracking-wider text-warm-muted uppercase">End</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {editSlots.map(slot => (
                  <tr key={slot.id} className="border-b border-warm-card-border hover:bg-warm-card/30">
                    <td className="px-4 py-3 text-sm text-warm-cream">{DAY_NAMES[slot.dayOfWeek]}</td>
                    <td className="px-4 py-3 text-sm text-warm-cream">{slot.lectureNumber}</td>
                    <td className="px-4 py-3 text-sm text-warm-cream">{slot.startTime}</td>
                    <td className="px-4 py-3 text-sm text-warm-cream">{slot.endTime}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => deleteSlot(slot.id)} className="rounded p-1 text-warm-muted hover:text-red transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add row */}
          <div className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-warm-card-border bg-warm-card p-4">
            <div>
              <label className="mb-1 block text-[10px] text-warm-muted">Day</label>
              <select value={newSlotDay} onChange={(e) => setNewSlotDay(Number(e.target.value))}
                className="rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent">
                {[1,2,3,4,5,6].map(d => <option key={d} value={d}>{DAY_NAMES[d]}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] text-warm-muted">Start</label>
              <input type="time" value={newSlotStart} onChange={(e) => setNewSlotStart(e.target.value)}
                className="rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent [color-scheme:dark]" />
            </div>
            <div>
              <label className="mb-1 block text-[10px] text-warm-muted">End</label>
              <input type="time" value={newSlotEnd} onChange={(e) => setNewSlotEnd(e.target.value)}
                className="rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent [color-scheme:dark]" />
            </div>
            <button onClick={addRow}
              className="flex items-center gap-1 rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] transition-colors">
              <Plus size={13} /> Add Lecture
            </button>
          </div>
        </div>
      ) : (
        /* ── Class/Section Grid ────────────────────── */
        sorted.length === 0 ? (
          <div className="rounded-xl border border-warm-card-border bg-warm-card p-12 text-center">
            <CalendarDays size={40} className="mx-auto mb-4 text-warm-muted" />
            <p className="text-sm text-warm-muted">No classes yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {sorted.map(sec => (
              <div key={sec.id}
                onClick={() => router.push(`/admin/timetable/${sec.id}`)}
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
        )
      )}
    </main>
  );
}
