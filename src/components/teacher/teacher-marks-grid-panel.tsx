'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  TeacherAlert,
  TeacherButton,
  TeacherBadge,
  TeacherEmptyState,
} from '@/components/teacher/teacher-ui';
import { formatGroupLabel } from '@/lib/teacher/types';

type StudentRow = {
  id: string;
  name: string;
  rollNumber: string | null;
  marksObtained: number | null;
  isAbsent: boolean;
  entryId: string | null;
};

type GridData = {
  totalMarks: number | null;
  passingMarks: number | null;
  subject: { id: string; name: string; code: string | null };
  className: string;
  classSection: string | null;
  examName: string;
  examStatus: string;
  students: StudentRow[];
  locked: boolean;
  canWrite: boolean;
  restrictReason?: string | null;
};

function restrictLabel(reason: string | null | undefined) {
  if (reason === 'EXAM_ACTIVE') return 'Exam is Active — teachers locked';
  if (reason === 'ADMIN_RESTRICTED') return 'Restricted by admin';
  if (reason === 'REPORT_CARDS_PUBLISHED') return 'Report cards published';
  if (reason === 'READ_ONLY_YEAR') return 'Read-only year';
  return 'View only';
}

const noSpinner =
  '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';

export function TeacherMarksGridPanel({ examClassSubjectId }: { examClassSubjectId: string }) {
  const [grid, setGrid] = useState<GridData | null>(null);
  const [totalMarks, setTotalMarks] = useState('');
  const [passingMarks, setPassingMarks] = useState('');
  const [cells, setCells] = useState<Record<string, { marks: string; isAbsent: boolean }>>({});
  const [serverHash, setServerHash] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.teacherMarksGrid(examClassSubjectId);
      const data = res.data as GridData;
      setGrid(data);
      setTotalMarks(data.totalMarks != null ? String(data.totalMarks) : '');
      setPassingMarks(data.passingMarks != null ? String(data.passingMarks) : '');
      const nextCells = Object.fromEntries(
        data.students.map((s) => [
          s.id,
          {
            marks: s.marksObtained != null ? String(s.marksObtained) : '',
            isAbsent: s.isAbsent,
          },
        ]),
      );
      setCells(nextCells);
      setServerHash(
        JSON.stringify({
          totalMarks: data.totalMarks,
          passingMarks: data.passingMarks,
          cells: nextCells,
        }),
      );
    } catch (e: any) {
      setError(e.message || 'Failed to load marks');
      setGrid(null);
    } finally {
      setLoading(false);
    }
  }, [examClassSubjectId]);

  useEffect(() => {
    load();
  }, [load]);

  const dirty = useMemo(() => {
    if (!grid) return false;
    return (
      serverHash !==
      JSON.stringify({
        totalMarks: totalMarks.trim() ? Number(totalMarks) : null,
        passingMarks: passingMarks.trim() ? Number(passingMarks) : null,
        cells,
      })
    );
  }, [grid, serverHash, totalMarks, passingMarks, cells]);

  const editable = Boolean(grid?.canWrite);

  const updateCell = (studentId: string, patch: Partial<{ marks: string; isAbsent: boolean }>) => {
    setCells((prev) => {
      const current = prev[studentId] ?? { marks: '', isAbsent: false };
      const next = { ...current, ...patch };
      if (patch.isAbsent) next.marks = '';
      return { ...prev, [studentId]: next };
    });
  };

  const save = async () => {
    if (!grid || !editable || saving) return;

    const total = Number(totalMarks.trim());
    if (!totalMarks.trim() || !Number.isInteger(total) || total <= 0) {
      setError('Set total marks (positive integer) before saving');
      return;
    }

    let passing: number | undefined;
    if (passingMarks.trim()) {
      passing = Number(passingMarks.trim());
      if (!Number.isInteger(passing) || passing < 0) {
        setError('Passing marks must be a non-negative integer');
        return;
      }
      if (passing > total) {
        setError('Passing marks cannot exceed total marks');
        return;
      }
    }

    for (const s of grid.students) {
      const cell = cells[s.id] ?? { marks: '', isAbsent: false };
      if (cell.isAbsent) continue;
      const raw = cell.marks.trim();
      if (raw === '') continue;
      const marksObtained = Number(raw);
      if (Number.isNaN(marksObtained) || marksObtained < 0) {
        setError('Marks must be non-negative numbers');
        return;
      }
      if (marksObtained > total) {
        setError(`Marks cannot exceed total (${total})`);
        return;
      }
    }

    const entries = grid.students.map((s) => {
      const cell = cells[s.id] ?? { marks: '', isAbsent: false };
      if (cell.isAbsent) {
        return { studentId: s.id, marksObtained: null, isAbsent: true };
      }
      const raw = cell.marks.trim();
      return {
        studentId: s.id,
        marksObtained: raw === '' ? null : Number(raw),
        isAbsent: false,
      };
    });

    const payload: {
      totalMarks?: number;
      passingMarks?: number;
      entries: typeof entries;
    } = { entries };

    if (grid.totalMarks == null || total !== grid.totalMarks) {
      payload.totalMarks = total;
      if (passing !== undefined) payload.passingMarks = passing;
    } else if (passing !== undefined && passing !== grid.passingMarks) {
      payload.totalMarks = total;
      payload.passingMarks = passing;
    }

    setSaving(true);
    setError('');
    try {
      const res = await api.teacherSaveMarks(examClassSubjectId, payload);
      const data = res.data as GridData;
      setGrid((prev) => (prev ? { ...prev, ...data, locked: prev.locked, canWrite: prev.canWrite } : prev));
      setTotalMarks(data.totalMarks != null ? String(data.totalMarks) : '');
      setPassingMarks(data.passingMarks != null ? String(data.passingMarks) : '');
      const nextCells = Object.fromEntries(
        data.students.map((s) => [
          s.id,
          {
            marks: s.marksObtained != null ? String(s.marksObtained) : '',
            isAbsent: s.isAbsent,
          },
        ]),
      );
      setCells(nextCells);
      setServerHash(
        JSON.stringify({
          totalMarks: data.totalMarks,
          passingMarks: data.passingMarks,
          cells: nextCells,
        }),
      );
    } catch (e: any) {
      setError(e.message || 'Failed to save marks');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-warm-muted">Loading marks…</p>;
  }

  if (!grid) {
    return (
      <TeacherAlert
        tone="error"
        action={
          <TeacherButton variant="secondary" onClick={load}>
            Retry
          </TeacherButton>
        }
      >
        {error || 'Marks not found'}
      </TeacherAlert>
    );
  }

  const groupLabel = formatGroupLabel({ name: grid.className, section: grid.classSection });

  return (
    <div className="space-y-4">
      <div className="teacher-action-row items-center">
        <Link href="/teacher/marks" className="teacher-btn teacher-btn--ghost text-xs">
          ← All marks
        </Link>
        {grid.locked && (
          <TeacherBadge tone="warning">{restrictLabel(grid.restrictReason)}</TeacherBadge>
        )}
        {!grid.locked && grid.examStatus && (
          <TeacherBadge tone={grid.examStatus === 'ACTIVE' ? 'accent' : 'neutral'}>
            {grid.examStatus}
          </TeacherBadge>
        )}
      </div>

      <div className="teacher-card rounded-xl border border-warm-card-border bg-warm-card p-4">
        <p className="text-sm text-warm-cream">{grid.examName}</p>
        <p className="teacher-break-text mt-1 text-xs text-warm-muted">
          {groupLabel} · {grid.subject.name}
          {grid.subject.code ? ` (${grid.subject.code})` : ''}
        </p>
      </div>

      {error && (
        <TeacherAlert
          tone="error"
          action={
            <TeacherButton variant="secondary" onClick={() => setError('')}>
              Dismiss
            </TeacherButton>
          }
        >
          {error}
        </TeacherAlert>
      )}

      <div className="teacher-marks-meta">
        <label className="teacher-field">
          <span className="teacher-field__label">Total marks</span>
          <input
            type="number"
            min={1}
            disabled={!editable}
            value={totalMarks}
            onChange={(e) => setTotalMarks(e.target.value)}
            className={`teacher-field__input ${noSpinner}`}
          />
        </label>
        <label className="teacher-field">
          <span className="teacher-field__label">Passing marks</span>
          <input
            type="number"
            min={0}
            disabled={!editable}
            value={passingMarks}
            onChange={(e) => setPassingMarks(e.target.value)}
            className={`teacher-field__input ${noSpinner}`}
          />
        </label>
      </div>

      {grid.students.length === 0 ? (
        <TeacherEmptyState title="No students" body="This class has no active students." />
      ) : (
        <div className="teacher-marks-list">
          {grid.students.map((student) => {
            const cell = cells[student.id] ?? { marks: '', isAbsent: false };
            return (
              <div key={student.id} className="teacher-marks-row">
                <div className="teacher-marks-row__info">
                  <p className="teacher-marks-row__name">{student.name}</p>
                  <p className="teacher-marks-row__roll">
                    {student.rollNumber ? `Roll ${student.rollNumber}` : 'No roll #'}
                  </p>
                </div>
                <label className="teacher-marks-row__absent">
                  <input
                    type="checkbox"
                    disabled={!editable}
                    checked={cell.isAbsent}
                    onChange={(e) => updateCell(student.id, { isAbsent: e.target.checked })}
                  />
                  <span>Absent</span>
                </label>
                <input
                  type="number"
                  min={0}
                  disabled={!editable || cell.isAbsent}
                  placeholder="—"
                  value={cell.marks}
                  onChange={(e) => updateCell(student.id, { marks: e.target.value })}
                  className={`teacher-marks-row__marks ${noSpinner}`}
                  aria-label={`Marks for ${student.name}`}
                />
              </div>
            );
          })}
        </div>
      )}

      {editable && (
        <div className="teacher-action-row">
          <TeacherButton onClick={save} disabled={saving || !dirty}>
            {saving ? 'Saving…' : 'Save marks'}
          </TeacherButton>
          {dirty && !saving && (
            <span className="self-center text-xs text-warm-muted">Unsaved changes</span>
          )}
        </div>
      )}

      {!editable && (
        <p className="text-xs text-warm-muted">
          {restrictLabel(grid.restrictReason)}
          {grid.restrictReason === 'EXAM_ACTIVE' &&
            ' Set the exam to Draft in admin to allow teacher entry.'}
        </p>
      )}
    </div>
  );
}
