'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ResultsMarksTable,
  RESULTS_FILTER_ALL,
  type ResultsFilterState,
  type ResultsFiltersMeta,
  type ResultsTableRow,
} from '@/components/results/results-marks-table';
import { StudentPageShell } from '@/components/student/student-page-shell';
import { api } from '@/lib/api';

const EMPTY_META: ResultsFiltersMeta = {
  sessions: [],
  examTypes: [],
  subjects: [],
};

export default function StudentResultsPage() {
  const [rows, setRows] = useState<ResultsTableRow[]>([]);
  const [filterMeta, setFilterMeta] = useState<ResultsFiltersMeta>(EMPTY_META);
  const [filterState, setFilterState] = useState<ResultsFilterState>({
    sessionId: RESULTS_FILTER_ALL,
    examTypeId: RESULTS_FILTER_ALL,
    subjectId: RESULTS_FILTER_ALL,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.studentResultsTable({
        sessionId: filterState.sessionId !== RESULTS_FILTER_ALL ? filterState.sessionId : undefined,
        examTypeId: filterState.examTypeId !== RESULTS_FILTER_ALL ? filterState.examTypeId : undefined,
        subjectId: filterState.subjectId !== RESULTS_FILTER_ALL ? filterState.subjectId : undefined,
      });
      if (res.success && res.data) {
        setRows((res.data.rows as ResultsTableRow[]) || []);
        setFilterMeta({
          sessions: (res.data.filters?.sessions as ResultsFiltersMeta['sessions']) || [],
          examTypes: (res.data.filters?.examTypes as ResultsFiltersMeta['examTypes']) || [],
          subjects: (res.data.filters?.subjects as ResultsFiltersMeta['subjects']) || [],
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

  return (
    <StudentPageShell
      title="Results"
      subtitle="Published exam results only (read-only)"
    >
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <ResultsMarksTable
        rows={rows}
        filterMeta={filterMeta}
        filterState={filterState}
        onFilterChange={setFilterState}
        loading={loading}
        showStudent={false}
      />

      {!loading && rows.length === 0 && !error && (
        <p className="mt-4 text-center text-sm text-warm-muted">
          No published results yet. Results appear after report cards are published.
        </p>
      )}
    </StudentPageShell>
  );
}
