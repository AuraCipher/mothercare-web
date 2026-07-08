'use client';

import { TeacherPageShell, TeacherStubNotice } from '@/components/teacher/teacher-page-shell';
import { useTeacherBootstrap } from '@/lib/teacher/use-teacher-bootstrap';

export default function TeacherProfilePage() {
  const { data } = useTeacherBootstrap();
  if (!data) return null;

  const { user, teacherProfile, branch, academicYear } = data;

  return (
    <TeacherPageShell title="My Profile" subtitle="Your account and school context">
      <div className="teacher-card rounded-xl border border-warm-card-border bg-warm-card p-4">
        <dl className="teacher-dl-grid text-sm">
          <div>
            <dt className="text-xs text-warm-muted">Name</dt>
            <dd className="text-warm-cream">{user.name}</dd>
          </div>
          <div>
            <dt className="text-xs text-warm-muted">Username</dt>
            <dd className="text-warm-cream">{user.username || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-warm-muted">Email</dt>
            <dd className="text-warm-cream">{user.email || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-warm-muted">Employee ID</dt>
            <dd className="text-warm-cream">{teacherProfile.employeeId || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-warm-muted">Branch</dt>
            <dd className="text-warm-cream">{branch.name}</dd>
          </div>
          <div>
            <dt className="text-xs text-warm-muted">Academic year</dt>
            <dd className="text-warm-cream">
              {academicYear.label} ({academicYear.status})
            </dd>
          </div>
          <div>
            <dt className="text-xs text-warm-muted">Assignments</dt>
            <dd className="text-warm-cream">{data.portal.assignmentCount}</dd>
          </div>
          <div>
            <dt className="text-xs text-warm-muted">Portal access</dt>
            <dd className="text-warm-cream">{data.portal.isReadOnly ? 'Read only' : 'Read & write'}</dd>
          </div>
        </dl>
      </div>
      <TeacherStubNotice feature="Profile photo, contact details, and password change" />
    </TeacherPageShell>
  );
}
