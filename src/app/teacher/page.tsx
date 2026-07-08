'use client';

import Link from 'next/link';
import { AssignmentCard } from '@/components/teacher/assignment-card';
import { TeacherPageShell } from '@/components/teacher/teacher-page-shell';
import {
  TeacherQuickLink,
  TeacherSection,
  TeacherStatCard,
} from '@/components/teacher/teacher-ui';
import { useTeacherBootstrap } from '@/lib/teacher/use-teacher-bootstrap';

export default function TeacherHomePage() {
  const { data } = useTeacherBootstrap();
  if (!data) return null;

  const preview = data.assignments.slice(0, 3);
  const classCount = new Set(data.assignments.map((a) => a.groupId)).size;

  return (
    <TeacherPageShell title="Teacher Portal" subtitle="Your classes and daily tools">
      <div className="teacher-stat-grid">
        <TeacherStatCard label="Assignments" value={data.portal.assignmentCount} />
        <TeacherStatCard label="Classes" value={classCount} />
        <TeacherStatCard
          label="Portal mode"
          value={data.portal.isReadOnly ? 'Read only' : 'Active'}
          hint={data.portal.isReadOnly ? 'This academic year cannot be edited' : undefined}
        />
      </div>

      {preview.length > 0 ? (
        <TeacherSection
          title="Recent classes"
          action={
            <Link href="/teacher/my-classes" className="teacher-link text-xs">
              See all
            </Link>
          }
        >
          <div className="teacher-grid-cards">
            {preview.map((assignment) => (
              <AssignmentCard key={assignment.id} assignment={assignment} />
            ))}
          </div>
        </TeacherSection>
      ) : (
        <div className="teacher-card rounded-xl border border-warm-card-border bg-warm-card p-6 text-center text-sm text-warm-muted sm:p-8">
          No classes assigned yet. Contact school administration.
        </div>
      )}

      <TeacherSection title="Quick actions">
        <div className="teacher-grid-cards">
          <TeacherQuickLink
            href="/teacher/timetable"
            title="My timetable"
            body="Weekly schedule and periods"
          />
          <TeacherQuickLink
            href="/teacher/attendance"
            title="Attendance"
            body="Mark and review class attendance"
          />
          <TeacherQuickLink
            href="/teacher/marks"
            title="Marks"
            body="Enter exam marks for your subjects"
          />
        </div>
      </TeacherSection>
    </TeacherPageShell>
  );
}
