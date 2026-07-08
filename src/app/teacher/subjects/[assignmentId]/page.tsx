'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  TeacherAccessDenied,
  TeacherPageShell,
} from '@/components/teacher/teacher-page-shell';
import { TeacherQuickLink } from '@/components/teacher/teacher-ui';
import { TeacherSubjectTabs } from '@/components/teacher/teacher-subject-tabs';
import { useTeacherBootstrap } from '@/lib/teacher/use-teacher-bootstrap';
import { assignmentById } from '@/lib/teacher/scope';
import { formatGroupLabel } from '@/lib/teacher/types';
import { api } from '@/lib/api';

export default function TeacherSubjectPage() {
  const params = useParams();
  const assignmentId = typeof params.assignmentId === 'string' ? params.assignmentId : '';
  const { data } = useTeacherBootstrap();
  const [students, setStudents] = useState<any[]>([]);
  const [showParentContacts, setShowParentContacts] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentsError, setStudentsError] = useState('');

  const assignment = data ? assignmentById(data.assignments, assignmentId) : undefined;
  const rosterPreview = useMemo(() => students.slice(0, 8), [students]);

  useEffect(() => {
    if (!assignment) return;
    setLoadingStudents(true);
    setStudentsError('');
    api
      .teacherClassStudents(assignment.groupId)
      .then((res) => {
        if (res.success) {
          setStudents(res.data.students || []);
          setShowParentContacts(!!res.data.showParentContacts);
        } else setStudentsError(res.message || 'Unable to load students');
      })
      .catch(() => {
        setStudents([]);
        setStudentsError('Unable to load students');
      })
      .finally(() => setLoadingStudents(false));
  }, [assignment?.groupId]);

  if (!data) return null;
  if (!assignment) return <TeacherAccessDenied />;

  const marksHref = `/teacher/marks?groupId=${assignment.groupId}&subjectId=${assignment.subjectId}`;
  const classHubHref = `/teacher/classes/${assignment.groupId}`;

  return (
    <TeacherPageShell
      title={assignment.subject.name}
      subtitle={formatGroupLabel(assignment.group)}
    >
      <TeacherSubjectTabs
        active="students"
        assignmentId={assignment.id}
        groupId={assignment.groupId}
        subjectId={assignment.subjectId}
      />

      <div className="teacher-card rounded-xl border border-warm-card-border bg-warm-card p-4">
        <dl className="teacher-dl-grid text-sm">
          <div>
            <dt className="text-xs text-warm-muted">Class</dt>
            <dd className="text-warm-cream">{formatGroupLabel(assignment.group)}</dd>
          </div>
          <div>
            <dt className="text-xs text-warm-muted">Subject code</dt>
            <dd className="text-warm-cream">{assignment.subject.code || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-warm-muted">Role</dt>
            <dd className="text-warm-cream">
              {assignment.isClassTeacher ? 'Class teacher' : assignment.role}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-warm-muted">Portal mode</dt>
            <dd className="text-warm-cream">{data.portal.isReadOnly ? 'Read only' : 'Read & write'}</dd>
          </div>
        </dl>
      </div>

      <div className="teacher-grid-cards">
        <TeacherQuickLink
          href={marksHref}
          title="Marks"
          body="View and enter exam marks for this subject"
        />
        <TeacherQuickLink
          href={`/teacher/attendance?groupId=${assignment.groupId}`}
          title="Attendance"
          body="Daily attendance for this class"
        />
        <TeacherQuickLink
          href={classHubHref}
          title="Class hub"
          body="Full roster and all class subjects"
        />
        <div className="teacher-card rounded-xl border border-dashed border-warm-card-border bg-warm-card/40 p-4">
          <p className="text-sm text-warm-cream">Materials</p>
          <p className="mt-1 text-xs text-warm-muted">Coming soon</p>
        </div>
      </div>

      <div className="teacher-card rounded-xl border border-warm-card-border bg-warm-card p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-warm-cream">Students ({students.length})</h2>
          <Link href={classHubHref} className="teacher-link text-xs">
            Open class hub
          </Link>
        </div>

        {showParentContacts && (
          <p className="mb-3 text-[11px] text-warm-muted">
            Parent contact numbers are visible per school policy.
          </p>
        )}

        {loadingStudents ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-warm-card/60" />
            ))}
          </div>
        ) : studentsError ? (
          <div className="teacher-break-text rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {studentsError}
          </div>
        ) : students.length === 0 ? (
          <p className="text-sm text-warm-muted">No active students in this class.</p>
        ) : (
          <>
            <ul className="divide-y divide-warm-card-border">
              {rosterPreview.map((s) => (
                <li key={s.id} className="flex min-w-0 items-center justify-between gap-2 py-2.5">
                  <div className="min-w-0">
                    <p className="teacher-card__title truncate text-sm text-warm-cream">{s.name}</p>
                    <p className="text-xs text-warm-muted">Roll {s.rollNumber || '—'}</p>
                    {showParentContacts && s.parentContacts?.length > 0 && (
                      <p className="mt-1 text-[11px] text-warm-muted">
                        {s.parentContacts.map((p: any, i: number) => (
                          <span key={i}>
                            {i > 0 ? ' · ' : ''}
                            {p.relation}: {p.phone || p.whatsapp || '—'}
                          </span>
                        ))}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            {students.length > rosterPreview.length && (
              <p className="mt-2 text-xs text-warm-muted">
                Showing {rosterPreview.length} of {students.length} students.
              </p>
            )}
          </>
        )}
      </div>
    </TeacherPageShell>
  );
}
