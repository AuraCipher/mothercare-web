'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { showToast } from '@/components/toast';
import { ClipboardList, Save } from 'lucide-react';
import type { StructureClass } from './exam-structure-section';

interface MarksEntrySectionProps {
  examId: string;
  readOnly?: boolean;
  examActive?: boolean;
  onProgressChange?: (summary: string) => void;
}

type StudentRow = {
  id: string;
  name: string;
  rollNumber: string | null;
};

type ColumnState = {
  linkId: string;
  subjectName: string;
  subjectCode: string | null;
  isActive: boolean;
  totalMarks: string;
  passingMarks: string;
  serverTotalMarks: number | null;
  serverPassingMarks: number | null;
  cells: Record<string, { marks: string; isAbsent: boolean; entryId: string | null }>;
};

const noSpinner =
  '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';

const cellInputClass =
  `w-16 rounded-lg border border-warm-card-border bg-[#1a1614] px-2 py-1.5 text-center text-xs text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent disabled:opacity-50 ${noSpinner}`;

const metaInputClass =
  `w-14 rounded-lg border border-warm-card-border bg-[#1a1614] px-2 py-1 text-center text-xs text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent disabled:opacity-50 ${noSpinner}`;

/** Opaque surfaces for sticky cells — transparent bg causes scroll overlap glitches */
const gridSurface = 'bg-[#24201e]';
const gridHeaderSurface = 'bg-[#2a2624]';
const stickyLeftShadow = 'shadow-[2px_0_6px_rgba(0,0,0,0.35)]';

function classLabel(c: { name: string; section: string | null }) {
  return c.section ? `${c.name} — ${c.section}` : c.name;
}

function isCellFilled(cell: { marks: string; isAbsent: boolean }) {
  return cell.isAbsent || cell.marks.trim() !== '';
}

function columnFilledCount(col: ColumnState, studentIds: string[]) {
  return studentIds.filter((id) => isCellFilled(col.cells[id] ?? { marks: '', isAbsent: false })).length;
}

export function marksProgressSummary(classes: StructureClass[]): string {
  const activeSubjects = classes
    .filter((c) => c.isActive)
    .flatMap((c) => c.subjects.filter((s) => s.isActive));
  if (activeSubjects.length === 0) return 'Generate structure first';
  const filled = activeSubjects.filter((s) => s.hasMarks).length;
  return `${filled}/${activeSubjects.length} subjects with marks`;
}

export default function MarksEntrySection({
  examId,
  readOnly = false,
  examActive = false,
  onProgressChange,
}: MarksEntrySectionProps) {
  const editable = !readOnly && !examActive;

  const [structure, setStructure] = useState<StructureClass[]>([]);
  const [structureLoading, setStructureLoading] = useState(true);
  const [structureError, setStructureError] = useState('');

  const [selectedClassId, setSelectedClassId] = useState('');
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [columns, setColumns] = useState<ColumnState[]>([]);
  const [gridLoading, setGridLoading] = useState(false);
  const [gridError, setGridError] = useState('');
  const [savingColumnId, setSavingColumnId] = useState<string | null>(null);

  const loadStructure = useCallback(() => {
    setStructureLoading(true);
    setStructureError('');
    api.getResultExamStructure(examId)
      .then((res) => {
        const rows: StructureClass[] = res.data || [];
        setStructure(rows);
        onProgressChange?.(marksProgressSummary(rows));
      })
      .catch((e: any) => setStructureError(e.message || 'Failed to load structure'))
      .finally(() => setStructureLoading(false));
  }, [examId, onProgressChange]);

  useEffect(() => {
    loadStructure();
  }, [loadStructure]);

  const classOptions = useMemo(() => {
    return structure
      .filter((c) => c.isActive && c.subjects.length > 0)
      .map((c) => ({
        classId: c.classId,
        label: classLabel(c.class),
        subjects: [...c.subjects]
          .sort((a, b) => a.subject.name.localeCompare(b.subject.name))
          .map((s) => ({
            linkId: s.id,
            subjectName: s.subject.name,
            isActive: s.isActive,
          })),
      }));
  }, [structure]);

  useEffect(() => {
    if (classOptions.length === 0) {
      setSelectedClassId('');
      return;
    }
    if (!selectedClassId || !classOptions.some((c) => c.classId === selectedClassId)) {
      setSelectedClassId(classOptions[0].classId);
    }
  }, [classOptions, selectedClassId]);

  const selectedClass = classOptions.find((c) => c.classId === selectedClassId);

  const loadGrid = useCallback(async (classId: string) => {
    const cls = structure.find((c) => c.classId === classId && c.isActive);
    if (!cls) return;

    const subjectRows = [...cls.subjects].sort((a, b) =>
      a.subject.name.localeCompare(b.subject.name),
    );
    if (subjectRows.length === 0) {
      setStudents([]);
      setColumns([]);
      return;
    }

    setGridLoading(true);
    setGridError('');
    try {
      const results = await Promise.allSettled(
        subjectRows.map((s) =>
          api.getResultMarksGrid(s.id).then((r) => ({ subject: s, grid: r.data })),
        ),
      );

      const loaded = results
        .map((result, index) => {
          const subject = subjectRows[index];
          if (result.status === 'fulfilled') {
            return { subject, grid: result.value.grid };
          }
          return { subject, grid: null };
        });

      const firstGrid = loaded.find((row) => row.grid)?.grid;
      const studentRows: StudentRow[] = (firstGrid?.students || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        rollNumber: s.rollNumber ?? null,
      }));
      setStudents(studentRows);

      setColumns(
        loaded.map(({ subject, grid }) => ({
          linkId: subject.id,
          subjectName: grid?.subject?.name || subject.subject.name,
          subjectCode: grid?.subject?.code ?? subject.subject.code ?? null,
          isActive: subject.isActive,
          totalMarks: grid?.totalMarks != null ? String(grid.totalMarks) : '',
          passingMarks: grid?.passingMarks != null ? String(grid.passingMarks) : '',
          serverTotalMarks: grid?.totalMarks ?? null,
          serverPassingMarks: grid?.passingMarks ?? null,
          cells: Object.fromEntries(
            (grid?.students || studentRows).map((s: any) => {
              const fromGrid = grid?.students?.find((g: any) => g.id === s.id);
              return [
                s.id,
                {
                  marks: fromGrid?.marksObtained != null ? String(fromGrid.marksObtained) : '',
                  isAbsent: fromGrid?.isAbsent ?? false,
                  entryId: fromGrid?.entryId ?? null,
                },
              ];
            }),
          ),
        })),
      );

      const failed = results.filter((r) => r.status === 'rejected').length;
      if (failed > 0) {
        showToast('error', `${failed} subject column${failed !== 1 ? 's' : ''} failed to load`);
      }
    } catch (e: any) {
      setGridError(e.message || 'Failed to load marks grid');
      setStudents([]);
      setColumns([]);
    } finally {
      setGridLoading(false);
    }
  }, [structure]);

  useEffect(() => {
    if (selectedClassId) loadGrid(selectedClassId);
  }, [selectedClassId, loadGrid]);

  const updateCell = (linkId: string, studentId: string, patch: Partial<{ marks: string; isAbsent: boolean }>) => {
    setColumns((prev) =>
      prev.map((col) => {
        if (col.linkId !== linkId) return col;
        const current = col.cells[studentId] ?? { marks: '', isAbsent: false, entryId: null };
        const next = { ...current, ...patch };
        if (patch.isAbsent) next.marks = '';
        return { ...col, cells: { ...col.cells, [studentId]: next } };
      }),
    );
  };

  const updateColumnMeta = (linkId: string, field: 'totalMarks' | 'passingMarks', value: string) => {
    setColumns((prev) =>
      prev.map((col) => (col.linkId === linkId ? { ...col, [field]: value } : col)),
    );
  };

  const saveColumn = async (col: ColumnState) => {
    if (!editable || savingColumnId) return;

    const total = Number(col.totalMarks.trim());
    if (!col.totalMarks.trim() || !Number.isInteger(total) || total <= 0) {
      showToast('error', 'Set total marks (positive integer) before saving');
      return;
    }

    let passing: number | undefined;
    if (col.passingMarks.trim()) {
      passing = Number(col.passingMarks.trim());
      if (!Number.isInteger(passing) || passing < 0) {
        showToast('error', 'Passing marks must be a non-negative integer');
        return;
      }
      if (passing > total) {
        showToast('error', 'Passing marks cannot exceed total marks');
        return;
      }
    }

    for (const s of students) {
      const cell = col.cells[s.id] ?? { marks: '', isAbsent: false, entryId: null };
      if (cell.isAbsent) continue;
      const raw = cell.marks.trim();
      if (raw === '') continue;
      const marksObtained = Number(raw);
      if (Number.isNaN(marksObtained) || marksObtained < 0) {
        showToast('error', 'Marks must be non-negative numbers');
        return;
      }
      if (marksObtained > total) {
        showToast('error', `Marks cannot exceed total (${total})`);
        return;
      }
    }

    const entries = students.map((s) => {
      const cell = col.cells[s.id] ?? { marks: '', isAbsent: false, entryId: null };
      if (cell.isAbsent) {
        return { studentId: s.id, marksObtained: null, isAbsent: true };
      }
      const raw = cell.marks.trim();
      const marksObtained = raw === '' ? null : Number(raw);
      return { studentId: s.id, marksObtained, isAbsent: false };
    });

    const payload: {
      totalMarks?: number;
      passingMarks?: number;
      entries: { studentId: string; marksObtained?: number | null; isAbsent?: boolean }[];
    } = {
      entries: entries.map(({ studentId, marksObtained, isAbsent }) => ({
        studentId,
        marksObtained,
        isAbsent,
      })),
    };

    if (col.serverTotalMarks == null || total !== col.serverTotalMarks) {
      payload.totalMarks = total;
      if (passing !== undefined) payload.passingMarks = passing;
    } else if (passing !== undefined && passing !== col.serverPassingMarks) {
      payload.totalMarks = total;
      payload.passingMarks = passing;
    }

    setSavingColumnId(col.linkId);
    try {
      const res = await api.saveResultMarks(col.linkId, payload);
      const grid = res.data;
      setColumns((prev) =>
        prev.map((c) => {
          if (c.linkId !== col.linkId) return c;
          return {
            ...c,
            totalMarks: grid.totalMarks != null ? String(grid.totalMarks) : c.totalMarks,
            passingMarks: grid.passingMarks != null ? String(grid.passingMarks) : c.passingMarks,
            serverTotalMarks: grid.totalMarks ?? null,
            serverPassingMarks: grid.passingMarks ?? null,
            cells: Object.fromEntries(
              (grid.students || []).map((s: any) => [
                s.id,
                {
                  marks: s.marksObtained != null ? String(s.marksObtained) : '',
                  isAbsent: s.isAbsent ?? false,
                  entryId: s.entryId ?? null,
                },
              ]),
            ),
          };
        }),
      );
      loadStructure();
      showToast('success', `${col.subjectName} marks saved`);
    } catch (e: any) {
      showToast('error', e.message || 'Failed to save marks');
    } finally {
      setSavingColumnId(null);
    }
  };

  if (structureLoading) {
    return (
      <div className="space-y-2 py-2">
        <div className="h-10 animate-pulse rounded-lg bg-[#1a1614]" />
        <div className="h-24 animate-pulse rounded-lg bg-[#1a1614]" />
      </div>
    );
  }

  if (structureError) {
    return (
      <div className="rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-3 text-xs text-[#b39a76]">
        {structureError}
        <button type="button" onClick={loadStructure} className="ml-2 text-warm-accent hover:underline">
          Retry
        </button>
      </div>
    );
  }

  if (classOptions.length === 0) {
    return (
      <div className="py-6 text-center">
        <ClipboardList size={28} className="mx-auto mb-2 text-warm-muted/40" />
        <p className="text-xs text-warm-muted">Generate structure and enable at least one class and subject to enter marks.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {!editable && (
        <p className="text-[11px] text-warm-muted/70">
          {examActive
            ? 'Exam is published — marks are read-only. Set to Draft to edit.'
            : 'Read-only in archived academic year.'}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-[11px] text-warm-muted">
          Class
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="rounded-lg border border-warm-card-border bg-[#1a1614] px-2 py-1 text-xs text-warm-cream outline-none focus:border-warm-accent"
          >
            {classOptions.map((c) => (
              <option key={c.classId} value={c.classId}>{c.label}</option>
            ))}
          </select>
        </label>
        {selectedClass && (
          <span className="text-[10px] text-warm-muted/60">
            {selectedClass.subjects.filter((s) => s.isActive).length}/{selectedClass.subjects.length} subjects active
          </span>
        )}
      </div>

      {gridLoading ? (
        <div className="h-32 animate-pulse rounded-lg bg-[#1a1614]" />
      ) : gridError ? (
        <div className="rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-3 text-xs text-[#b39a76]">
          {gridError}
          <button
            type="button"
            onClick={() => selectedClassId && loadGrid(selectedClassId)}
            className="ml-2 text-warm-accent hover:underline"
          >
            Retry
          </button>
        </div>
      ) : students.length === 0 ? (
        <p className="py-6 text-center text-xs text-warm-muted/50">No active students in this class.</p>
      ) : (
        <>
          <p className="text-[10px] text-warm-muted/60">
            Set Total and Pass per subject column, then enter marks. Missing subjects? Use Sync classes in Structure.
            The checkbox beside each mark is Absent — use it when the student did not sit that subject.
          </p>
          <div className={`overflow-hidden rounded-lg border border-warm-card-border/60 ${gridSurface}`}>
            <div
              className="mcs-scrollbar-x mcs-scrollbar-y isolate max-h-[calc(11rem+2.75rem*10)] overflow-auto"
            >
          <table className="w-max min-w-full border-separate border-spacing-0 text-left">
            <thead>
              <tr>
                <th
                  className={`sticky left-0 top-0 z-40 w-[128px] min-w-[128px] max-w-[128px] border-b border-warm-card-border/40 ${gridHeaderSurface} ${stickyLeftShadow} px-3 py-2 text-left text-[10px] font-medium text-warm-muted`}
                >
                  Student
                </th>
                {columns.map((col) => {
                  const filled = columnFilledCount(col, students.map((s) => s.id));
                  const complete = filled === students.length;
                  const colEditable = editable && col.isActive;
                  return (
                    <th
                      key={col.linkId}
                      className={`sticky top-0 z-30 min-w-[108px] border-b border-l border-warm-card-border/30 ${gridHeaderSurface} px-2 py-2 align-top ${!col.isActive ? 'opacity-45' : ''}`}
                    >
                      <div className="flex flex-col items-center gap-1.5 text-center">
                        <p className="w-full truncate text-[10px] font-medium text-warm-cream" title={col.subjectName}>
                          {col.subjectName}
                        </p>
                        {!col.isActive && (
                          <span className="text-[9px] text-warm-muted/60">Inactive</span>
                        )}
                        <div className="flex w-full items-center justify-center gap-2 text-[10px] text-warm-muted">
                          <label className="flex flex-col items-center gap-0.5">
                            <span>Total</span>
                            <input
                              type="number"
                              min={1}
                              inputMode="numeric"
                              value={col.totalMarks}
                              disabled={!colEditable}
                              onChange={(e) => updateColumnMeta(col.linkId, 'totalMarks', e.target.value)}
                              className={metaInputClass}
                              placeholder="—"
                            />
                          </label>
                          <label className="flex flex-col items-center gap-0.5">
                            <span>Pass</span>
                            <input
                              type="number"
                              min={0}
                              inputMode="numeric"
                              value={col.passingMarks}
                              disabled={!colEditable}
                              onChange={(e) => updateColumnMeta(col.linkId, 'passingMarks', e.target.value)}
                              className={metaInputClass}
                              placeholder="—"
                            />
                          </label>
                        </div>
                        <span className={`text-[10px] ${complete ? 'text-green-400/80' : 'text-warm-muted/60'}`}>
                          {filled}/{students.length}
                        </span>
                        {colEditable && (
                          <button
                            type="button"
                            onClick={() => saveColumn(col)}
                            disabled={savingColumnId === col.linkId}
                            className="inline-flex items-center gap-1 rounded-lg bg-warm-accent px-2.5 py-1 text-[10px] font-medium text-[#1a1614] hover:bg-[#b39a76] disabled:opacity-50"
                          >
                            <Save size={11} />
                            {savingColumnId === col.linkId ? '…' : 'Save'}
                          </button>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} className="h-11">
                  <td
                    className={`sticky left-0 z-20 h-11 w-[128px] min-w-[128px] max-w-[128px] border-b border-warm-card-border/20 ${gridSurface} ${stickyLeftShadow} px-3 align-middle text-xs text-warm-cream`}
                  >
                    <span className="block truncate">{student.name}</span>
                  </td>
                  {columns.map((col) => {
                    const cell = col.cells[student.id] ?? { marks: '', isAbsent: false, entryId: null };
                    const colEditable = editable && col.isActive;
                    return (
                      <td
                        key={col.linkId}
                        className={`h-11 border-b border-l border-warm-card-border/20 px-2 align-middle ${!col.isActive ? 'opacity-45' : ''}`}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <input
                            type="number"
                            min={0}
                            inputMode="numeric"
                            value={cell.marks}
                            disabled={!colEditable || cell.isAbsent}
                            onChange={(e) => updateCell(col.linkId, student.id, { marks: e.target.value })}
                            className={cellInputClass}
                            placeholder="—"
                          />
                          <label
                            className={`flex flex-col items-center gap-0.5 text-[9px] leading-none text-warm-muted ${colEditable ? 'cursor-pointer' : ''}`}
                            title="Absent — student did not sit this subject"
                          >
                            <input
                              type="checkbox"
                              checked={cell.isAbsent}
                              disabled={!colEditable}
                              onChange={(e) => updateCell(col.linkId, student.id, { isAbsent: e.target.checked })}
                              className="h-3.5 w-3.5 rounded accent-warm-accent"
                            />
                            <span>Abs</span>
                          </label>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
