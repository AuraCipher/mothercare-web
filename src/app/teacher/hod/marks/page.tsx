'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { TeacherAccessDenied, TeacherPageShell } from '@/components/teacher/teacher-page-shell';
import {
  TeacherAlert,
  TeacherBadge,
  TeacherButton,
  TeacherEmptyState,
  TeacherSection,
} from '@/components/teacher/teacher-ui';
import { useTeacherBootstrap } from '@/lib/teacher/use-teacher-bootstrap';
import { formatGroupLabel } from '@/lib/teacher/types';
import { api } from '@/lib/api';

type HodMarksRow = {
  id: string;
  subject: { id: string; name: string; code: string | null };
  group: { id: string; name: string; section: string | null };
  exam: {
    id: string;
    name: string;
    status: string;
    sessionName: string;
    examTypeName: string | null;
  };
  marksEntryCount: number;
  isDirectAssignment: boolean;
};

export default function TeacherHodMarksPage() {
  const { data } = useTeacherBootstrap();
  const [overview, setOverview] = useState<any>(null);
  const [rows, setRows] = useState<HodMarksRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [dept, marks] = await Promise.all([
        api.teacherHodDepartment(),
        api.teacherHodMarksSubjects(),
      ]);
      setOverview(dept.data);
      setRows(marks.data || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load department marks');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (data?.portal.isHod) load();
  }, [data?.portal.isHod, load]);

  if (!data) return null;
  if (!data.portal.isHod) return <TeacherAccessDenied message="Department view is for HOD teachers only." />;

  return (
    <TeacherPageShell
      title="Department marks"
      subtitle="All exam marks across your HOD subjects"
    >
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

      {overview?.subjects?.length > 0 && (
        <TeacherSection title="Your departments">
          <div className="teacher-grid-cards">
            {overview.subjects.map((s: any) => (
              <div
                key={s.id}
                className="teacher-card rounded-xl border border-warm-card-border bg-warm-card p-4"
              >
                <p className="text-sm font-medium text-warm-cream">{s.name}</p>
                <p className="mt-1 text-xs text-warm-muted">
                  {s.teacherCount} teacher(s) · {s.examSubjectCount} exam sheet(s)
                </p>
              </div>
            ))}
          </div>
        </TeacherSection>
      )}

      {loading ? (
        <p className="text-sm text-warm-muted">Loading…</p>
      ) : rows.length === 0 ? (
        <TeacherEmptyState
          title="No department exam sheets"
          body="When exams are configured for your department subjects, they will appear here."
        />
      ) : (
        <div className="teacher-grid-cards">
          {rows.map((row) => (
            <Link
              key={row.id}
              href={`/teacher/marks/${row.id}`}
              className="teacher-card teacher-quick-link rounded-xl border border-warm-card-border bg-warm-card p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="teacher-quick-link__title">{row.subject.name}</p>
                {row.isDirectAssignment ? (
                  <TeacherBadge tone="neutral">Your class</TeacherBadge>
                ) : (
                  <TeacherBadge tone="warning">HOD view</TeacherBadge>
                )}
              </div>
              <p className="teacher-quick-link__body">
                {formatGroupLabel(row.group)} · {row.exam.name}
              </p>
              <p className="mt-2 text-xs text-warm-muted">
                {row.exam.sessionName}
                {row.marksEntryCount > 0 ? ` · ${row.marksEntryCount} entries` : ''}
              </p>
            </Link>
          ))}
        </div>
      )}
    </TeacherPageShell>
  );
}
