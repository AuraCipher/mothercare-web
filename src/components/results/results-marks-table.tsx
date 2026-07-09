'use client';

import { useMemo } from 'react';

export type ResultsTableRow = {
  marksEntryId: string;
  studentId?: string;
  studentName?: string;
  rollNumber?: string | null;
  sessionId: string;
  sessionName: string;
  examTypeId: string;
  examTypeName: string;
  examId: string;
  examName: string;
  subjectId: string;
  subjectName: string;
  groupLabel?: string;
  marksObtained: number | null;
  totalMarks: number | null;
  passingMarks: number | null;
  isAbsent: boolean;
  percentage: number | null;
  passed: boolean;
  hasMarks: boolean;
};

export type ResultsFilterOption = { id: string; name: string; rollNumber?: string | null };

export type ResultsFiltersMeta = {
  sessions: ResultsFilterOption[];
  examTypes: ResultsFilterOption[];
  subjects: ResultsFilterOption[];
  students?: ResultsFilterOption[];
};

export type ResultsFilterState = {
  sessionId: string;
  examTypeId: string;
  subjectId: string;
  studentId?: string;
};

const ALL = 'all';

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: ResultsFilterOption[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="results-filter block min-w-0">
      <span className="results-filter__label">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="results-filter__select mt-1 w-full min-w-0 rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream"
      >
        <option value={ALL}>All</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.rollNumber != null ? `${opt.name} (Roll ${opt.rollNumber || '—'})` : opt.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function marksCell(row: ResultsTableRow) {
  if (!row.hasMarks) return <span className="text-warm-muted">—</span>;
  if (row.isAbsent) return <span className="text-yellow-300">Absent</span>;
  if (row.marksObtained == null) return <span className="text-warm-muted">—</span>;
  const total = row.totalMarks ?? 100;
  return (
    <span className="font-medium text-warm-cream">
      {row.marksObtained}
      <span className="text-warm-muted"> / {total}</span>
    </span>
  );
}

interface ResultsMarksTableProps {
  rows: ResultsTableRow[];
  filterMeta: ResultsFiltersMeta;
  filterState: ResultsFilterState;
  onFilterChange: (next: ResultsFilterState) => void;
  showStudent?: boolean;
  showStudentFilter?: boolean;
  showGroup?: boolean;
  loading?: boolean;
  emptyMessage?: string;
}

export function ResultsMarksTable({
  rows,
  filterMeta,
  filterState,
  onFilterChange,
  showStudent = false,
  showStudentFilter = false,
  showGroup = false,
  loading = false,
  emptyMessage = 'No results match your filters.',
}: ResultsMarksTableProps) {
  const summary = useMemo(() => {
    const withMarks = rows.filter((r) => r.hasMarks);
    const passed = withMarks.filter((r) => r.passed).length;
    return { total: rows.length, withMarks: withMarks.length, passed };
  }, [rows]);

  return (
    <div className="results-marks-table space-y-4">
      <div className="results-filters-grid rounded-xl border border-warm-card-border bg-warm-card p-4">
        <FilterSelect
          label="Session"
          value={filterState.sessionId}
          options={filterMeta.sessions}
          onChange={(sessionId) =>
            onFilterChange({
              ...filterState,
              sessionId,
              examTypeId: ALL,
            })
          }
        />
        <FilterSelect
          label="Exam type"
          value={filterState.examTypeId}
          options={filterMeta.examTypes}
          onChange={(examTypeId) => onFilterChange({ ...filterState, examTypeId })}
        />
        <FilterSelect
          label="Subject"
          value={filterState.subjectId}
          options={filterMeta.subjects}
          onChange={(subjectId) => onFilterChange({ ...filterState, subjectId })}
        />
        {showStudentFilter && filterMeta.students && (
          <FilterSelect
            label="Student"
            value={filterState.studentId || ALL}
            options={filterMeta.students}
            onChange={(studentId) => onFilterChange({ ...filterState, studentId })}
          />
        )}
      </div>

      <div className="results-summary flex flex-wrap gap-3 text-xs text-warm-muted">
        <span>{summary.total} row{summary.total === 1 ? '' : 's'}</span>
        {summary.withMarks > 0 && (
          <span>
            {summary.passed}/{summary.withMarks} passed
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-warm-card" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-warm-card-border bg-warm-card/40 p-8 text-center text-sm text-warm-muted">
          {emptyMessage}
        </div>
      ) : (
        <div className="results-table-wrap overflow-x-auto rounded-xl border border-warm-card-border">
          <table className="results-table w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-warm-card-border bg-[#1a1614]/80">
                {showStudent && (
                  <>
                    <th className="results-table__th">Roll</th>
                    <th className="results-table__th">Student</th>
                  </>
                )}
                <th className="results-table__th">Session</th>
                <th className="results-table__th">Exam type</th>
                <th className="results-table__th">Exam</th>
                <th className="results-table__th">Subject</th>
                {showGroup && <th className="results-table__th">Class</th>}
                <th className="results-table__th text-right">Marks</th>
                <th className="results-table__th text-right">%</th>
                <th className="results-table__th text-center">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-card-border/60">
              {rows.map((row) => (
                <tr key={row.marksEntryId} className="results-table__row hover:bg-warm-card/30">
                  {showStudent && (
                    <>
                      <td className="results-table__td text-warm-muted">{row.rollNumber || '—'}</td>
                      <td className="results-table__td font-medium text-warm-cream">{row.studentName}</td>
                    </>
                  )}
                  <td className="results-table__td text-warm-muted">{row.sessionName}</td>
                  <td className="results-table__td text-warm-muted">{row.examTypeName}</td>
                  <td className="results-table__td text-warm-cream">{row.examName}</td>
                  <td className="results-table__td text-warm-cream">{row.subjectName}</td>
                  {showGroup && (
                    <td className="results-table__td text-warm-muted">{row.groupLabel || '—'}</td>
                  )}
                  <td className="results-table__td text-right">{marksCell(row)}</td>
                  <td className="results-table__td text-right text-warm-muted">
                    {row.percentage != null ? `${row.percentage}%` : '—'}
                  </td>
                  <td className="results-table__td text-center">
                    {!row.hasMarks ? (
                      <span className="results-pill results-pill--muted">—</span>
                    ) : row.passed ? (
                      <span className="results-pill results-pill--pass">Pass</span>
                    ) : (
                      <span className="results-pill results-pill--fail">Fail</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export const RESULTS_FILTER_ALL = ALL;
