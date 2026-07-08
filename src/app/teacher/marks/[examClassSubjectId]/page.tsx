'use client';

import { TeacherMarksGridPanel } from '@/components/teacher/teacher-marks-grid-panel';
import { TeacherPageShell } from '@/components/teacher/teacher-page-shell';
import { useTeacherBootstrap } from '@/lib/teacher/use-teacher-bootstrap';
import { useParams } from 'next/navigation';

export default function TeacherMarksDetailPage() {
  const params = useParams();
  const examClassSubjectId =
    typeof params.examClassSubjectId === 'string' ? params.examClassSubjectId : '';
  const { data } = useTeacherBootstrap();
  if (!data) return null;

  return (
    <TeacherPageShell title="Enter marks" subtitle="Exam marks for your class">
      <TeacherMarksGridPanel examClassSubjectId={examClassSubjectId} />
    </TeacherPageShell>
  );
}
