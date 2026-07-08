'use client';

import Link from 'next/link';
import { AssignmentCard } from '@/components/teacher/assignment-card';
import { TeacherPageShell } from '@/components/teacher/teacher-page-shell';
import { useTeacherBootstrap } from '@/lib/teacher/use-teacher-bootstrap';

export default function TeacherHomePage() {
  const { data } = useTeacherBootstrap();
  if (!data) return null;

  const preview = data.assignments.slice(0, 3);

  return (
    <TeacherPageShell title="Teacher Portal">
      <div className="teacher-card rounded-xl border border-warm-card-border bg-warm-card p-4">
        <p className="text-xs uppercase tracking-wide text-warm-muted">My assignments</p>
        <p className="mt-1 text-2xl font-light text-warm-cream">{data.portal.assignmentCount}</p>
        {data.portal.isReadOnly && (
          <p className="mt-2 text-xs text-warm-muted">Portal is read-only for this academic year.</p>
        )}
        {data.assignments.length > 0 && (
          <Link
            href="/teacher/my-classes"
            className="mt-3 inline-block text-xs text-warm-muted underline hover:text-warm-cream"
          >
            View all classes →
          </Link>
        )}
      </div>

      {preview.length > 0 ? (
        <div>
          <div className="mb-3 flex min-w-0 items-center justify-between gap-2">
            <h2 className="min-w-0 text-sm font-medium text-warm-cream">Recent classes</h2>
            <Link href="/teacher/my-classes" className="shrink-0 text-xs text-warm-muted hover:text-warm-cream">
              See all
            </Link>
          </div>
          <div className="teacher-grid-cards">
            {preview.map((assignment) => (
              <AssignmentCard key={assignment.id} assignment={assignment} />
            ))}
          </div>
        </div>
      ) : (
        <div className="teacher-card rounded-xl border border-warm-card-border bg-warm-card p-6 text-center text-sm text-warm-muted sm:p-8">
          No classes assigned yet. Contact school administration.
        </div>
      )}

      <div className="teacher-grid-cards">
        <Link
          href="/teacher/timetable"
          className="teacher-card rounded-xl border border-warm-card-border bg-warm-card p-4 hover:border-warm-cream/20"
        >
          <p className="text-sm text-warm-cream">My timetable</p>
          <p className="teacher-break-text mt-1 text-xs text-warm-muted">Weekly schedule</p>
        </Link>
        <Link
          href="/teacher/attendance"
          className="teacher-card rounded-xl border border-warm-card-border bg-warm-card p-4 hover:border-warm-cream/20"
        >
          <p className="text-sm text-warm-cream">Attendance</p>
          <p className="teacher-break-text mt-1 text-xs text-warm-muted">Mark and review class attendance</p>
        </Link>
      </div>
    </TeacherPageShell>
  );
}
