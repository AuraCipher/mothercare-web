'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  TeacherAccessDenied,
  TeacherPageShell,
  TeacherStubNotice,
} from '@/components/teacher/teacher-page-shell';
import { TeacherQuickLink } from '@/components/teacher/teacher-ui';
import { useTeacherBootstrap } from '@/lib/teacher/use-teacher-bootstrap';
import { assignmentById } from '@/lib/teacher/scope';
import { formatGroupLabel } from '@/lib/teacher/types';

const STUB_SECTIONS = ['Students', 'Materials'] as const;

export default function TeacherSubjectPage() {
  const params = useParams();
  const assignmentId = typeof params.assignmentId === 'string' ? params.assignmentId : '';
  const { data } = useTeacherBootstrap();
  if (!data) return null;

  const assignment = assignmentById(data.assignments, assignmentId);
  if (!assignment) return <TeacherAccessDenied />;

  const marksHref = `/teacher/marks?groupId=${assignment.groupId}&subjectId=${assignment.subjectId}`;

  return (
    <TeacherPageShell
      title={assignment.subject.name}
      subtitle={formatGroupLabel(assignment.group)}
    >
      <div className="teacher-action-row text-xs">
        <Link
          href={`/teacher/attendance?groupId=${assignment.groupId}`}
          className="teacher-btn teacher-btn--primary text-xs"
        >
          Mark attendance
        </Link>
        <Link href={marksHref} className="teacher-btn teacher-btn--secondary text-xs">
          Enter marks
        </Link>
        <Link
          href={`/teacher/classes/${assignment.groupId}`}
          className="teacher-btn teacher-btn--ghost text-xs"
        >
          ← Class hub
        </Link>
      </div>

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
        {STUB_SECTIONS.map((section) => (
          <div
            key={section}
            className="teacher-card rounded-xl border border-dashed border-warm-card-border bg-warm-card/40 p-4"
          >
            <p className="text-sm text-warm-cream">{section}</p>
            <p className="mt-1 text-xs text-warm-muted">Coming soon</p>
          </div>
        ))}
      </div>

      <TeacherStubNotice feature="Student list and learning materials" />
    </TeacherPageShell>
  );
}
