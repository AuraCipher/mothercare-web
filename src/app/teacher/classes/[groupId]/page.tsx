'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  TeacherAccessDenied,
  TeacherPageShell,
  TeacherStubNotice,
} from '@/components/teacher/teacher-page-shell';
import { useTeacherBootstrap } from '@/lib/teacher/use-teacher-bootstrap';
import { assignmentsForGroup, canAccessGroup } from '@/lib/teacher/scope';
import { formatGroupLabel } from '@/lib/teacher/types';

export default function TeacherClassHubPage() {
  const params = useParams();
  const groupId = typeof params.groupId === 'string' ? params.groupId : '';
  const { data } = useTeacherBootstrap();
  if (!data) return null;

  if (!canAccessGroup(data.assignments, groupId)) {
    return <TeacherAccessDenied />;
  }

  const groupAssignments = assignmentsForGroup(data.assignments, groupId);
  const group = groupAssignments[0]?.group;
  if (!group) return <TeacherAccessDenied />;

  const isClassTeacher = data.portal.classTeacherGroupIds.includes(groupId);

  return (
    <TeacherPageShell
      title={formatGroupLabel(group)}
      subtitle={isClassTeacher ? 'You are the class teacher for this group' : 'Your subjects in this class'}
    >
      <div className="teacher-grid-cards">
        {groupAssignments.map((assignment) => (
          <Link
            key={assignment.id}
            href={`/teacher/subjects/${assignment.id}`}
            className="teacher-card rounded-xl border border-warm-card-border bg-warm-card p-4 hover:border-warm-cream/20"
          >
            <p className="teacher-card__title text-sm font-medium text-warm-cream">{assignment.subject.name}</p>
            <p className="teacher-break-text mt-1 text-xs text-warm-muted">
              {assignment.isClassTeacher ? 'Class teacher · ' : ''}
              {assignment.role}
            </p>
          </Link>
        ))}
      </div>

      <TeacherStubNotice feature="Class roster, announcements, and class-wide reports" />
    </TeacherPageShell>
  );
}
