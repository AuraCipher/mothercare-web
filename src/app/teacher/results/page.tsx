'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ResultsMarksTable,
  RESULTS_FILTER_ALL,
  type ResultsFilterState,
  type ResultsFiltersMeta,
  type ResultsTableRow,
} from '@/components/results/results-marks-table';
import { TeacherPageShell } from '@/components/teacher/teacher-page-shell';
import { TeacherAlert, TeacherButton } from '@/components/teacher/teacher-ui';
import { api } from '@/lib/api';
import { useTeacherBootstrap } from '@/lib/teacher/use-teacher-bootstrap';

const EMPTY_META: ResultsFiltersMeta = {
  sessions: [],
  examTypes: [],
  subjects: [],
  students: [],
};

export default function TeacherResultsPage() {
  const { data } = useTeacherBootstrap();
  const [rows, setRows] = useState<ResultsTableRow[]>([]);
  const [filterMeta, setFilterMeta] = useState<ResultsFiltersMeta>(EMPTY_META);
  const [filterState, setFilterState] = useState<ResultsFilterState>({
    sessionId: RESULTS_FILTER_ALL,
    examTypeId: RESULTS_FILTER_ALL,
    subjectId: RESULTS_FILTER_ALL,
    studentId: RESULTS_FILTER_ALL,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.teacherMarksTable({
        sessionId: filterState.sessionId !== RESULTS_FILTER_ALL ? filterState.sessionId : undefined,
        examTypeId: filterState.examTypeId !== RESULTS_FILTER_ALL ? filterState.examTypeId : undefined,
        subjectId: filterState.subjectId !== RESULTS_FILTER_ALL ? filterState.subjectId : undefined,
        studentId: filterState.studentId !== RESULTS_FILTER_ALL ? filterState.studentId : undefined,
      });
      if (res.success) {
        setRows(res.data.rows || []);
        setFilterMeta({
          sessions: res.data.filters?.sessions || [],
          examTypes: res.data.filters?.examTypes || [],
          subjects: res.data.filters?.subjects || [],
          students: res.data.filters?.students || [],
        });
      } else {
        setError(res.message || 'Failed to load results');
        setRows([]);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load results');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [filterState]);

  useEffect(() => {
    load();
  }, [load]);

  if (!data) return null;

  return (
    <TeacherPageShell
      title="Results"
      subtitle="Read-only marks and exam results for your classes"
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link
          href="/teacher/marks"
          className="rounded-lg border border-warm-card-border px-3 py-2 text-xs text-warm-muted hover:text-warm-cream"
        >
          Enter marks
        </Link>
      </div>

      {error && (
        <TeacherAlert
          tone="error"
          action={
            <TeacherButton variant="secondary" onClick={load}>
              Retry
            </TeacherButton>
          }
        >
          {error}
        </TeacherAlert>
      )}

      <ResultsMarksTable
        rows={rows}
        filterMeta={filterMeta}
        filterState={filterState}
        onFilterChange={setFilterState}
        showStudent
        showStudentFilter
        showGroup
        loading={loading}
        emptyMessage="No exam marks recorded yet for your assigned classes."
      />
    </TeacherPageShell>
  );
}
