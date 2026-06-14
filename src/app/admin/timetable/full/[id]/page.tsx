'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { ArrowLeft, BookOpen, RefreshCw, Trash2, Download, Printer } from 'lucide-react';
import { showToast } from '@/components/toast';
import * as XLSX from 'xlsx';

interface Slot {
  id: string; dayOfWeek?: number | null; lectureNumber: number; startTime: string; endTime: string;
}

interface Entry {
  id?: string; slotId: string; note?: string | null;
  subject: { id: string; name: string; code: string } | null;
  teacher: { id: string; name: string } | null;
}

interface Section {
  id: string; name: string; section: string | null; displayOrder: number;
}

interface Column {
  id: string;
  label: string;
  dayOfWeek?: number;
}

interface GeneratedTt {
  id: number;
  name: string;
  selectedSections: Section[];
  entriesBySection: Record<string, Entry[]>;
  isDatesheet: boolean;
  columns: Column[];
}

const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function FullTimetablePage() {
  const router = useRouter();
  const params = useParams();
  const timetableId = params.id as string;
  const [branchId] = useState(() => localStorage.getItem('activeBranchId') || '');
  const [ayId] = useState(() => localStorage.getItem('activeAYId') || '');

  const [sections, setSections] = useState<Section[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<GeneratedTt[]>([]);
  const [ttName, setTtName] = useState('Full Timetable');
  const [nextGenId, setNextGenId] = useState(1);
  const [isDatesheet, setIsDatesheet] = useState(false);
  const [columns, setColumns] = useState<Column[]>([]);

  const loadData = useCallback(async () => {
    if (!branchId || !ayId || !timetableId) return;
    try {
      const [secData, slotData] = await Promise.all([
        api.getSections(branchId, ayId),
        api.getTimetableSlots(branchId, timetableId),
      ]);
      const allSections = (secData.data || []).sort((a: any, b: any) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
      const allSlots: Slot[] = (slotData.data || []).sort((a: any, b: any) => a.lectureNumber - b.lectureNumber);
      const hasDays = allSlots.some((s: any) => s.dayOfWeek != null);
      const ds = hasDays;

      let cols: Column[];
      let filtered: Slot[];
      if (ds) {
        // Datesheet: group by dayOfWeek
        filtered = allSlots.filter((s: any) => s.dayOfWeek != null);
        const dayMap = new Map<number, Slot[]>();
        for (const s of filtered) {
          const d = s.dayOfWeek!;
          if (!dayMap.has(d)) dayMap.set(d, []);
          dayMap.get(d)!.push(s);
        }
        cols = Array.from(dayMap.entries())
          .sort(([a], [b]) => a - b)
          .map(([d]) => ({
            id: `day-${d}`,
            label: DAY_NAMES[d],
            dayOfWeek: d,
          }));
      } else {
        // Timetable: all-days slots
        filtered = allSlots.filter((s: any) => s.dayOfWeek === null);
        cols = filtered.map(s => ({
          id: s.id,
          label: `${s.startTime} — ${s.endTime}`,
        }));
      }

      setSections(allSections);
      setSlots(filtered);
      setIsDatesheet(ds);
      setColumns(cols);
      setSelectedIds(new Set(allSections.map((s: any) => s.id)));
    } catch {} finally { setLoading(false); }
  }, [branchId, ayId, timetableId]);

  useEffect(() => { loadData(); }, [loadData]);

  const toggleSection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleGenerate = async () => {
    const sel = sections.filter(s => selectedIds.has(s.id));
    if (sel.length === 0) { showToast('error', 'Select at least one class'); return; }
    setGenerating(true);
    try {
      const results = await Promise.all(
        sel.map(sec => api.getSectionTimetable(branchId, sec.id).then(d => ({ sectionId: sec.id, entries: d.data || [] }))),
      );
      const entriesBySection: Record<string, Entry[]> = {};
      for (const r of results) { entriesBySection[r.sectionId] = r.entries; }

      const gen: GeneratedTt = {
        id: nextGenId,
        name: ttName,
        selectedSections: sel,
        entriesBySection,
        isDatesheet,
        columns,
      };
      setGenerated(prev => [gen, ...prev]); // newest on top
      setNextGenId(prev => prev + 1);
      showToast('success', `Timetable generated for ${sel.length} class(es)`);
    } catch { showToast('error', 'Failed to generate timetable'); }
    finally { setGenerating(false); }
  };

  const getCell = (entries: Entry[], slotId: string) => {
    return entries.find(e => e.slotId === slotId);
  };

  const getDayEntries = (entries: Entry[], dayOfWeek: number, allSlots: Slot[]) => {
    const daySlotIds = allSlots.filter(s => s.dayOfWeek === dayOfWeek).map(s => s.id);
    return entries.filter(e => daySlotIds.includes(e.slotId));
  };

  const printTimetable = (gen: GeneratedTt) => {
    const rows = gen.selectedSections.map(sec => {
      const entries = gen.entriesBySection[sec.id] || [];
      const cells = gen.columns.map(col => {
        if (gen.isDatesheet && col.dayOfWeek) {
          const dayEntries = getDayEntries(entries, col.dayOfWeek, slots);
          if (dayEntries.length === 0) return '<td class="cell"></td>';
          return `<td class="cell">${dayEntries.map((e: Entry) => e.subject?.name || e.note || '—').join('<br/>')}</td>`;
        }
        const entry = getCell(entries, col.id);
        if (entry?.note === 'break') return '<td class="cell break">Break</td>';
        if (entry) {
          const subject = entry.subject?.name || entry.note || '';
          const teacher = entry.teacher?.name || '';
          const teacherHtml = teacher ? `<br/><span class="teacher">${teacher}</span>` : '';
          return `<td class="cell">${subject}${gen.isDatesheet ? '' : teacherHtml}</td>`;
        }
        return '<td class="cell"></td>';
      }).join('');
      const className = `${sec.name}${sec.section ? ` — ${sec.section}` : ''}`;
      return `<tr><td class="class-name">${className}</td>${cells}</tr>`;
    }).join('');

    const colHeaders = gen.columns.map(col =>
      `<th class="class-header">${col.label}</th>`
    ).join('');

    const printWin = window.open('', '_blank');
    if (!printWin) return;
    printWin.document.write(`
      <html>
        <head>
          <title>${gen.name}</title>
          <style>
            @page { margin: 0.2in; size: landscape; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 0; width: 100%; }
            h1 { text-align: center; font-size: 22px; margin: 30px 0 18px 0; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; table-layout: fixed; }
            th, td { border: 1px solid #555; padding: 8px 6px; text-align: center; word-wrap: break-word; }
            th { background: #e8e8e8; font-weight: 600; }
            .time-header { font-weight: 600; text-align: center; white-space: nowrap; width: 12%; }
            .class-header { font-weight: 600; text-align: center; padding: 8px 10px; }
            .cell { min-width: 60px; }
            .break { color: #999; font-style: italic; }
            .teacher { font-size: 9px; color: #555; }
            @media print { body { padding: 15px 0.5in 0 0.5in; } }
          </style>
        </head>
        <body>
          <h1>${gen.name}</h1>
          <table>
            <thead><tr><th>${gen.isDatesheet ? 'Class' : 'Time'}</th>${colHeaders}</tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <script>window.print();window.close();<${'/'}script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  const downloadExcel = (gen: GeneratedTt) => {
    const headerRow = [gen.isDatesheet ? 'Class' : 'Class', ...gen.columns.map(c => c.label)];
    const dataRows = gen.selectedSections.map(sec => {
      const entries = gen.entriesBySection[sec.id] || [];
      const row = [`${sec.name}${sec.section ? ` - ${sec.section}` : ''}`];
      for (const col of gen.columns) {
        if (gen.isDatesheet && col.dayOfWeek) {
          const dayEntries = getDayEntries(entries, col.dayOfWeek, slots);
          const subjects = dayEntries.map((e: Entry) => e.subject?.name || e.note || '—').join('\n');
          row.push(subjects || '');
        } else {
          const entry = getCell(entries, col.id);
          if (entry?.note === 'break') { row.push('Break'); }
          else if (entry) {
            const subject = entry.subject?.name || entry.note || '';
            const teacher = entry.teacher?.name || '';
            row.push(teacher ? `${subject} (${teacher})` : subject);
          } else { row.push(''); }
        }
      }
      return row;
    });

    const titleRow = [gen.name, ...gen.columns.map(() => '')];
    const titleWs = XLSX.utils.aoa_to_sheet([titleRow, headerRow, ...dataRows]);
    const mergeRange = { s: { r: 0, c: 0 }, e: { r: 0, c: gen.columns.length } };
    titleWs['!merges'] = [mergeRange as XLSX.Range];
    if (!titleWs['!rows']) titleWs['!rows'] = [];
    titleWs['!rows'][0] = { hpx: 30 };
    titleWs['!cols'] = [{ wch: 20 }, ...gen.columns.map(() => ({ wch: 22 }))];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, titleWs, gen.isDatesheet ? 'Date Sheet' : 'Timetable');
    XLSX.writeFile(wb, `${gen.name.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="h-6 w-48 animate-pulse rounded bg-warm-card mb-6" />
        <div className="flex flex-wrap gap-2 mb-6">{[1,2,3,4,5].map(i => <div key={i} className="h-8 w-24 animate-pulse rounded-lg bg-warm-card" />)}</div>
        <div className="h-64 animate-pulse rounded-xl bg-warm-card" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      {/* Back */}
      <button onClick={() => router.push('/admin/timetable')} className="mb-6 flex items-center gap-1.5 text-xs text-warm-muted hover:text-warm-cream transition-colors">
        <ArrowLeft size={13} /> Back
      </button>

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen size={20} className="text-warm-accent" />
          <input type="text" value={ttName} onChange={(e) => setTtName(e.target.value)}
            className="bg-transparent text-xl font-light text-warm-cream outline-none border-b border-transparent focus:border-warm-accent transition-colors" />
        </div>
        <button onClick={handleGenerate} disabled={generating || selectedIds.size === 0}
          className="flex items-center gap-1.5 rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] disabled:opacity-50 transition-colors">
          <RefreshCw size={14} className={generating ? 'animate-spin' : ''} />
          {generating ? 'Generating…' : 'Generate'}
        </button>
      </div>

      {/* Class toggle buttons */}
      <div className="mb-6">
        <h2 className="mb-3 text-xs font-medium text-warm-muted uppercase tracking-wider">Classes</h2>
        <div className="flex flex-wrap gap-2">
          {sections.map(sec => {
            const isOn = selectedIds.has(sec.id);
            return (
              <button key={sec.id} onClick={() => toggleSection(sec.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  isOn ? 'bg-warm-accent text-[#1a1614]' : 'bg-warm-card border border-warm-card-border text-warm-muted/40 line-through hover:text-warm-muted'
                }`}>
                {sec.name}{sec.section ? ` — ${sec.section}` : ''}
              </button>
            );
          })}
        </div>
      </div>

      {/* Generated timetables */}
      {generated.length === 0 && (
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-12 text-center">
          <BookOpen size={32} className="mx-auto mb-3 text-warm-muted" />
          <p className="text-sm text-warm-muted">Select classes above and click <strong>Generate</strong> to see the full timetable.</p>
        </div>
      )}

      {generated.map(gen => (
        <section key={gen.id} className="mb-8 overflow-x-auto rounded-xl border border-warm-card-border">
          {/* Timetable name header — editable + delete button */}
          <div className="flex items-center justify-between bg-warm-card/50 border-b border-warm-card-border px-4 py-2.5">
            <input type="text" value={gen.name} onChange={(e) => {
              const newName = e.target.value;
              setGenerated(prev => prev.map(g => g.id === gen.id ? { ...g, name: newName } : g));
            }}
              className="bg-transparent text-xs font-semibold text-warm-accent uppercase tracking-wider outline-none border-b border-transparent focus:border-warm-accent transition-colors" />
            <div className="flex items-center gap-1">
              <button onClick={() => downloadExcel(gen)}
                className="rounded p-1.5 text-warm-muted hover:text-warm-accent transition-colors" title="Download Excel">
                <Download size={13} />
              </button>
              <button onClick={() => printTimetable(gen)}
                className="rounded p-1.5 text-warm-muted hover:text-warm-accent transition-colors" title="Print">
                <Printer size={13} />
              </button>
              <button onClick={() => setGenerated(prev => prev.filter(g => g.id !== gen.id))}
                className="rounded p-1.5 text-warm-muted hover:text-red transition-colors" title="Delete">
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          {/* Matrix table */}
          <table className="w-full text-left text-xs border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-warm-card/30">
                <th className="sticky left-0 z-10 bg-warm-card/30 px-3 py-2.5 text-[10px] uppercase text-warm-muted border-r border-warm-card-border min-w-[120px]">
                  {gen.isDatesheet ? 'Day' : 'Class'}
                </th>
                {gen.columns.map(col => (
                  <th key={col.id} className="px-3 py-2.5 text-[10px] uppercase text-warm-muted text-center border-r border-warm-card-border last:border-r-0 min-w-[110px]">
                    <div className="text-warm-accent/80">{col.label}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gen.selectedSections.map((sec, idx) => (
                <tr key={sec.id} className={idx < gen.selectedSections.length - 1 ? 'border-b border-warm-card-border' : ''}>
                  {/* Fixed first column */}
                  <td className="sticky left-0 z-10 bg-warm-card/50 px-3 py-3 text-sm font-medium text-warm-cream border-r border-warm-card-border">
                    {sec.name}{sec.section ? <span className="text-warm-accent/70 ml-1">— {sec.section}</span> : ''}
                  </td>
                  {/* Cells */}
                  {gen.columns.map(col => {
                    const entries = gen.entriesBySection[sec.id] || [];
                    const dayEntries: Entry[] = gen.isDatesheet && col.dayOfWeek
                      ? getDayEntries(entries, col.dayOfWeek, slots)
                      : (() => { const e = getCell(entries, col.id); return e ? [e] : []; })();
                    return (
                      <td key={col.id} className="px-3 py-3 text-center border-r border-warm-card-border last:border-r-0 align-top">
                        {dayEntries.length === 0 ? (
                          <span className="text-warm-muted/20">—</span>
                        ) : (
                          dayEntries.map((entry, i) => (
                            <div key={i}>
                              {i > 0 && <hr className="border-warm-card-border/30 my-1" />}
                              {entry.note === 'break' ? (
                                <span className="text-warm-muted/50 italic text-[10px]">Break</span>
                              ) : (
                                <>
                                  <div className="font-medium text-warm-cream text-[11px] leading-tight">
                                    {entry.subject?.name || entry.note || '—'}
                                  </div>
                                  {!gen.isDatesheet && entry.teacher && (
                                    <div className="text-[10px] text-warm-accent/70 leading-tight mt-0.5">
                                      {entry.teacher.name}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          ))
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </main>
  );
}
