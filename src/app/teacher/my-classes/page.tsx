'use client';

import { AssignmentCard } from '@/components/teacher/assignment-card';
import { TeacherPageShell } from '@/components/teacher/teacher-page-shell';
import { useTeacherBootstrap } from '@/lib/teacher/use-teacher-bootstrap';

export default function TeacherMyClassesPage() {
  const { data } = useTeacherBootstrap();
  if (!data) return null;

  return (
    <TeacherPageShell
      title="My Classes"
      subtitle={`${data.portal.assignmentCount} assignment${data.portal.assignmentCount === 1 ? '' : 's'} this year`}
    >
      {data.assignments.length > 0 ? (
        <div className="teacher-grid-cards">
          {data.assignments.map((assignment) => (
            <AssignmentCard key={assignment.id} assignment={assignment} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-8 text-center text-sm text-warm-muted">
          No classes assigned yet. Contact school administration.
        </div>
      )}
    </TeacherPageShell>
  );
}
