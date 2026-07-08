'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { TeacherAttendancePanel } from '@/components/teacher/teacher-attendance-panel';
import { TeacherPageLoading, TeacherPageShell } from '@/components/teacher/teacher-page-shell';
import { useTeacherBootstrap } from '@/lib/teacher/use-teacher-bootstrap';

function TeacherAttendanceContent() {
  const searchParams = useSearchParams();
  const initialGroupId = searchParams.get('groupId') || undefined;
  const { data } = useTeacherBootstrap();
  if (!data) return null;

  return (
    <TeacherPageShell title="Attendance" subtitle="Mark daily attendance for your classes">
      <TeacherAttendancePanel
        assignments={data.assignments}
        classTeacherGroupIds={data.portal.classTeacherGroupIds}
        readOnly={data.portal.isReadOnly}
        canMark={data.portal.teachersCanMarkAttendance}
        initialGroupId={initialGroupId}
      />
    </TeacherPageShell>
  );
}

export default function TeacherAttendancePage() {
  return (
    <Suspense fallback={<TeacherPageLoading />}>
      <TeacherAttendanceContent />
    </Suspense>
  );
}
