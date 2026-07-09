'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { TeacherPageLoading, TeacherPageShell } from '@/components/teacher/teacher-page-shell';
import {
  TeacherAlert,
  TeacherBadge,
  TeacherButton,
  TeacherEmptyState,
} from '@/components/teacher/teacher-ui';
import { useTeacherBootstrap } from '@/lib/teacher/use-teacher-bootstrap';
import { formatGroupLabel } from '@/lib/teacher/types';
import { useCallback, useEffect, useMemo, useState } from 'react';

type MarksSubjectRow = {
  examClassSubjectId: string;
  totalMarks: number | null;
  passingMarks: number | null;
  marksEntryCount: number;
  subject: { id: string; name: string; code: string | null };
  group: { id: string; name: string; section: string | null };
  exam: {
    id: string;
    name: string;
    status: string;
    examType: string;
  };
  session: { id: string; name: string };
  locked: boolean;
  canWrite: boolean;
  restrictReason?: string | null;
};

function rowBadge(row: MarksSubjectRow) {
  if (row.canWrite) return { tone: 'success' as const, label: 'Editable' };
  if (row.restrictReason === 'EXAM_ACTIVE') return { tone: 'warning' as const, label: 'Active exam' };
  if (row.restrictReason === 'ADMIN_RESTRICTED') return { tone: 'warning' as const, label: 'Restricted' };
  if (row.restrictReason === 'REPORT_CARDS_PUBLISHED') return { tone: 'warning' as const, label: 'Locked' };
  return { tone: 'neutral' as const, label: 'View only' };
}

function TeacherMarksContent() {
  const { data } = useTeacherBootstrap();
  const searchParams = useSearchParams();
  const filterGroupId = searchParams.get('groupId') || '';
  const filterSubjectId = searchParams.get('subjectId') || '';

  const [rows, setRows] = useState<MarksSubjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.teacherMarksSubjects();
      setRows(res.data || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load exam subjects');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      if (filterGroupId && row.group.id !== filterGroupId) return false;
      if (filterSubjectId && row.subject.id !== filterSubjectId) return false;
      return true;
    });
  }, [rows, filterGroupId, filterSubjectId]);

  if (!data) return null;

  return (
    <TeacherPageShell
      title="Marks"
      subtitle="Enter exam marks for your assigned subjects"
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link
          href="/teacher/results"
          className="rounded-lg border border-warm-accent/40 bg-warm-accent/10 px-3 py-2 text-xs text-warm-cream"
        >
          View results table
        </Link>
      </div>

      {data.portal.isHod && (
        <div className="mb-4">
          <Link
            href="/teacher/hod/marks"
            className="inline-flex rounded-lg border border-warm-accent/40 bg-warm-accent/10 px-3 py-2 text-xs text-warm-cream"
          >
            Department marks (HOD view)
          </Link>
        </div>
      )}

      {data.portal.isReadOnly && (
        <TeacherAlert tone="warning">Portal is read-only for this academic year.</TeacherAlert>
      )}

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

      {loading ? (
        <p className="text-sm text-warm-muted">Loading…</p>
      ) : filtered.length === 0 ? (
        <TeacherEmptyState
          title="No exam subjects"
          body={
            filterGroupId || filterSubjectId
              ? 'No marks sheets match this class or subject yet.'
              : 'When exams are set up for your classes, they will appear here.'
          }
        />
      ) : (
        <div className="teacher-grid-cards">
          {filtered.map((row) => {
            const badge = rowBadge(row);
            return (
            <Link
              key={row.examClassSubjectId}
              href={`/teacher/marks/${row.examClassSubjectId}`}
              className="teacher-card teacher-quick-link rounded-xl border border-warm-card-border bg-warm-card p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="teacher-quick-link__title">{row.subject.name}</p>
                <TeacherBadge tone={badge.tone}>{badge.label}</TeacherBadge>
              </div>
              <p className="teacher-quick-link__body">
                {formatGroupLabel(row.group)} · {row.exam.name}
              </p>
              <p className="mt-2 text-xs text-warm-muted">
                {row.session.name} · {row.exam.examType}
                {row.marksEntryCount > 0 ? ` · ${row.marksEntryCount} entries` : ''}
              </p>
            </Link>
            );
          })}
        </div>
      )}
    </TeacherPageShell>
  );
}

export default function TeacherMarksPage() {
  return (
    <Suspense fallback={<TeacherPageLoading />}>
      <TeacherMarksContent />
    </Suspense>
  );
}
