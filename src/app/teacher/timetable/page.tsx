'use client';

import { TeacherPageShell, TeacherStubNotice } from '@/components/teacher/teacher-page-shell';

export default function TeacherTimetablePage() {
  return (
    <TeacherPageShell title="My Timetable" subtitle="Your weekly teaching schedule">
      <div className="space-y-2">
        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
          <div
            key={day}
            className="teacher-split-row teacher-card rounded-xl border border-warm-card-border bg-warm-card px-4 py-3"
          >
            <span className="teacher-split-row__main text-sm text-warm-cream">{day}</span>
            <span className="teacher-split-row__aside">No slots loaded</span>
          </div>
        ))}
      </div>
      <TeacherStubNotice feature="Timetable synced from school schedule" />
    </TeacherPageShell>
  );
}
