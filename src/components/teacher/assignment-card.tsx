'use client';

import Link from 'next/link';
import type { TeacherAssignment } from '@/lib/teacher/types';
import { formatGroupLabel } from '@/lib/teacher/types';

interface AssignmentCardProps {
  assignment: TeacherAssignment;
  showClassLink?: boolean;
}

export function AssignmentCard({ assignment, showClassLink = true }: AssignmentCardProps) {
  return (
    <div className="teacher-card rounded-xl border border-warm-card-border bg-warm-card p-4">
      <div className="min-w-0">
        <p className="teacher-card__title text-sm font-medium text-warm-cream">
          {formatGroupLabel(assignment.group)}
        </p>
        <p className="teacher-break-text mt-0.5 text-xs text-warm-muted">{assignment.subject.name}</p>
        {assignment.isClassTeacher && (
          <span className="mt-2 inline-block rounded bg-warm-cream/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-warm-cream">
            Class teacher
          </span>
        )}
      </div>
      <div className="teacher-action-row mt-4">
        <Link
          href={`/teacher/subjects/${assignment.id}`}
          className="rounded-lg border border-warm-card-border px-3 py-1.5 text-xs text-warm-cream hover:bg-warm-cream/5"
        >
          Open subject
        </Link>
        {showClassLink && (
          <Link
            href={`/teacher/classes/${assignment.groupId}`}
            className="rounded-lg border border-warm-card-border px-3 py-1.5 text-xs text-warm-muted hover:text-warm-cream"
          >
            Class hub
          </Link>
        )}
      </div>
    </div>
  );
}
