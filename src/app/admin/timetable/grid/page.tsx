'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { CalendarDays, BookOpen, Plus, Trash2, X, Edit3, ArrowLeft } from 'lucide-react';
import { showToast } from '@/components/toast';

interface Slot {
  id: string; dayOfWeek: number | null; lectureNumber: number; startTime: string; endTime: string;
}

const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const ALL_DAYS = [1, 2, 3, 4, 5, 6];

function TimetableGridInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const timetableId = searchParams.get('id') || '';

  const [sections, setSections] = useState<any[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [dayConfigs, setDayConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSlotEditor, setShowSlotEditor] = useState(false);
  const [branchId, setBranchId] = useState('');
  const [newSlotStart, setNewSlotStart] = useState('08:00');
  const [newSlotEnd, setNewSlotEnd] = useState('08:40');

  const activeDays = new Set(dayConfigs.filter((d: any) => d.isActive).map((d: any) => d.dayOfWeek));

  useEffect(() => {
    const bId = localStorage.getItem('activeBranchId');
    const aId = localStorage.getItem('activeAYId');
    if (!bId || !aId || !timetableId) { setLoading(false); return; }
    setBranchId(bId);
    Promise.all([
      api.getSections(bId, aId),
      api.getTimetableSlots(bId, timetableId),
      api.getTimetableDays(bId, timetableId),
    ]).then(([secData, slotData, dayData]) => {
      setSections(secData.data || []);
      setSlots(slotData.data || []);
      const days = dayData.data || [];
      if (days.length === 0) {
        const defaults = ALL_DAYS.map(d => ({ dayOfWeek: d, isActive: true }));
        api.setTimetableDays(bId, timetableId, defaults).then(() => setDayConfigs(defaults));
      } else {
        setDayConfigs(days);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [timetableId]);

  const toggleDay = async (day: number) => {
    const newConfigs = dayConfigs.map((d: any) => d.dayOfWeek === day ? { ...d, isActive: !d.isActive } : d);
    setDayConfigs(newConfigs);
    await api.setTimetableDays(branchId, timetableId, newConfigs.map((d: any) => ({ dayOfWeek: d.dayOfWeek, isActive: d.isActive }))).catch(() => {});
  };

  const addRow = async () => {
    if (!branchId || !timetableId) { showToast('error', 'No timetable selected'); return; }
    try {
      await api.createTimetableSlot(branchId, timetableId, { startTime: newSlotStart, endTime: newSlotEnd });
      const data = await api.getTimetableSlots(branchId, timetableId);
      setSlots(data.data || []);
      showToast('success', 'Lecture added');
    } catch (e: any) { showToast('error', e.message || 'Failed to add'); }
  };

  const deleteSlot = async (slotId: string) => {
    if (!branchId || !timetableId) return;
    try { await api.deleteTimetableSlot(branchId, timetableId, slotId); setSlots(prev => prev.filter(s => s.id !== slotId)); showToast('success', 'Lecture removed'); }
    catch (e: any) { showToast('error', e.message || 'Failed to delete'); }
  };

  // Show slots with null dayOfWeek (all days) + slots matching active days
  const filteredSlots = slots.filter(s => s.dayOfWeek === null || activeDays.has(s.dayOfWeek));

  if (loading) return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="h-5 w-48 animate-pulse rounded bg-warm-card mb-6" />
      <div className="grid grid-cols-5 gap-3">{[1,2,3,4,5].map(i => <div key={i} className="h-24 rounded-xl bg-warm-card animate-pulse" />)}</div>
    </main>
  );

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <button onClick={() => router.push('/admin/timetable')} className="mb-4 flex items-center gap-1.5 text-xs text-warm-muted hover:text-warm-cream">
        <ArrowLeft size={13} /> Back
      </button>
      <div className="mb-6 flex items-center justify-between">
        <div><h1 className="mb-1 text-xl font-light text-warm-cream">Timetable</h1>
          <p className="text-sm text-warm-muted">{filteredSlots.length} lecture(s) · {activeDays.size} day(s) active</p>
        </div>
        <button onClick={() => setShowSlotEditor(!showSlotEditor)}
          className="flex items-center gap-1.5 rounded-lg bg-warm-accent px-3.5 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76]">
          {showSlotEditor ? <X size={14} /> : <Edit3 size={14} />}
          {showSlotEditor ? 'Done Editing' : 'Edit Lectures'}
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {ALL_DAYS.map(day => {
          const config = dayConfigs.find((d: any) => d.dayOfWeek === day);
          const isOn = config?.isActive ?? true;
          return (
            <button key={day} onClick={() => toggleDay(day)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${isOn ? 'bg-warm-accent text-[#1a1614]' : 'bg-warm-card border border-warm-card-border text-warm-muted/40 line-through hover:text-warm-muted'}`}>
              {DAY_NAMES[day]}
            </button>
          );
        })}
      </div>

      {showSlotEditor ? (
        <div>
          <div className="overflow-x-auto rounded-xl border border-warm-card-border">
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b bg-warm-card/50">
                <th className="px-4 py-3 text-[10px] uppercase text-warm-muted">Lecture</th>
                <th className="px-4 py-3 text-[10px] uppercase text-warm-muted">Start</th>
                <th className="px-4 py-3 text-[10px] uppercase text-warm-muted">End</th>
                <th />
              </tr></thead>
              <tbody>
                {filteredSlots.map(slot => (
                  <tr key={slot.id} className="border-b last:border-0 hover:bg-warm-card/30">
                    <td className="px-4 py-3 text-sm text-warm-cream">{slot.lectureNumber}</td>
                    <td className="px-4 py-3 text-sm text-warm-cream">{slot.startTime}</td>
                    <td className="px-4 py-3 text-sm text-warm-cream">{slot.endTime}</td>
                    <td className="px-4 py-3"><button onClick={() => deleteSlot(slot.id)} className="rounded p-1 text-warm-muted hover:text-red"><Trash2 size={13} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-warm-card-border bg-warm-card p-4">
            <div><label className="mb-1 block text-[10px] text-warm-muted">Start</label>
              <input type="time" value={newSlotStart} onChange={(e) => setNewSlotStart(e.target.value)}
                className="rounded-lg border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent [color-scheme:dark]" />
            </div>
            <div><label className="mb-1 block text-[10px] text-warm-muted">End</label>
              <input type="time" value={newSlotEnd} onChange={(e) => setNewSlotEnd(e.target.value)}
                className="rounded-lg border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent [color-scheme:dark]" />
            </div>
            <button onClick={addRow} className="flex items-center gap-1 rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76]">
              <Plus size={13} /> Add Lecture
            </button>
          </div>
        </div>
      ) : (
        sections.length === 0 ? (
          <div className="rounded-xl border border-warm-card-border bg-warm-card p-12 text-center"><CalendarDays size={40} className="mx-auto mb-4 text-warm-muted" /><p className="text-sm text-warm-muted">No classes yet.</p></div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {sections.map((sec: any) => (
              <div key={sec.id} onClick={() => router.push(`/admin/timetable/${sec.id}?id=${timetableId}`)}
                className="rounded-xl border border-warm-card-border bg-warm-card p-3 cursor-pointer hover:border-warm-accent/40 transition-colors">
                <div className="flex items-center gap-2 mb-2"><BookOpen size={13} className="text-warm-accent shrink-0" /><span className="text-sm font-medium text-warm-cream truncate">{sec.name}</span></div>
                {sec.section && <p className="text-xs text-warm-accent/80 mb-1">Section — {sec.section}</p>}
                <p className="text-[10px] text-warm-muted">{sec._count?.students || 0} students</p>
              </div>
            ))}
          </div>
        )
      )}
    </main>
  );
}

export default function TimetableGridPage() {
  return (
    <Suspense fallback={<div className="h-5 w-48 animate-pulse rounded bg-warm-card mb-6" />}>
      <TimetableGridInner />
    </Suspense>
  );
}
