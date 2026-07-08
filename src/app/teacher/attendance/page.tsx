'use client';

import { TeacherPageShell, TeacherStubNotice } from '@/components/teacher/teacher-page-shell';
import { useTeacherBootstrap } from '@/lib/teacher/use-teacher-bootstrap';
import { formatGroupLabel } from '@/lib/teacher/types';

export default function TeacherAttendancePage() {
  const { data } = useTeacherBootstrap();
  if (!data) return null;

  return (
    <TeacherPageShell title="Attendance" subtitle="Mark and review attendance for your classes">
      {data.assignments.length > 0 ? (
        <div className="space-y-2">
          {data.assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="teacher-split-row teacher-card rounded-xl border border-warm-card-border bg-warm-card px-4 py-3"
            >
              <div className="teacher-split-row__main">
                <p className="teacher-card__title text-sm text-warm-cream">{formatGroupLabel(assignment.group)}</p>
                <p className="teacher-break-text text-xs text-warm-muted">{assignment.subject.name}</p>
              </div>
              <span className="teacher-split-row__aside">Marking unavailable</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-8 text-center text-sm text-warm-muted">
          No classes to take attendance for.
        </div>
      )}
      <TeacherStubNotice feature="Daily attendance marking and history" />
    </TeacherPageShell>
  );
}
