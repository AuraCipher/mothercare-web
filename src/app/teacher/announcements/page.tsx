'use client';

import { TeacherPageShell, TeacherStubNotice } from '@/components/teacher/teacher-page-shell';

export default function TeacherAnnouncementsPage() {
  return (
    <TeacherPageShell
      title="Announcements"
      subtitle="School and class updates for your assigned classes"
    >
      <div className="teacher-card rounded-xl border border-warm-card-border bg-warm-card p-4">
        <p className="text-sm text-warm-cream">Read updates from administration and class notices.</p>
        <p className="mt-1 text-xs text-warm-muted">
          Phase D started: announcements module scaffold is now available in navigation.
        </p>
      </div>
      <TeacherStubNotice feature="Announcements feed and filters" />
    </TeacherPageShell>
  );
}
