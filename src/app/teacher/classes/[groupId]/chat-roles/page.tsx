'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import {
  TeacherAccessDenied,
  TeacherPageShell,
} from '@/components/teacher/teacher-page-shell';
import { ClassStudentPermissionsPanel } from '@/components/chat/class-student-permissions-panel';
import { useTeacherBootstrap } from '@/lib/teacher/use-teacher-bootstrap';
import { canAccessGroup } from '@/lib/teacher/scope';
import { formatGroupLabel } from '@/lib/teacher/types';
import { api } from '@/lib/api';

export default function TeacherClassChatRolesPage() {
  const params = useParams();
  const groupId = typeof params.groupId === 'string' ? params.groupId : '';
  const { data } = useTeacherBootstrap();
  const [communityId, setCommunityId] = useState('');
  const [groupLabel, setGroupLabel] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isClassTeacher = data?.portal.classTeacherGroupIds.includes(groupId) ?? false;
  const isReadOnly = data?.portal.isReadOnly ?? false;

  useEffect(() => {
    if (!groupId || !data || !canAccessGroup(data.assignments, groupId) || !isClassTeacher) return;
    setLoading(true);
    setError('');
    Promise.all([api.teacherClassCommunity(groupId), api.teacherClassStudents(groupId)])
      .then(([communityRes, studentsRes]) => {
        if (!communityRes.success) {
          setError(communityRes.message || 'Unable to load class community');
          return;
        }
        setCommunityId(communityRes.data.id);
        setGroupLabel(communityRes.data.groupLabel);
        if (studentsRes.success) {
          setStudents(studentsRes.data.students || []);
        }
      })
      .catch(() => setError('Unable to load chat roles'))
      .finally(() => setLoading(false));
  }, [groupId, data, isClassTeacher]);

  if (!data) return null;
  if (!canAccessGroup(data.assignments, groupId)) return <TeacherAccessDenied />;
  if (!isClassTeacher) return <TeacherAccessDenied />;

  return (
    <TeacherPageShell
      title="Chat roles"
      subtitle={groupLabel || 'Class student permissions'}
    >
      <Link
        href={`/teacher/classes/${groupId}`}
        className="mb-4 inline-flex items-center gap-1 text-xs text-warm-muted hover:text-warm-cream"
      >
        <ArrowLeft size={12} /> Back to class
      </Link>

      {loading ? (
        <div className="h-40 animate-pulse rounded-xl border border-warm-card-border bg-warm-card" />
      ) : error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">
          {error}
        </div>
      ) : (
        <ClassStudentPermissionsPanel
          actor="teacher"
          communityId={communityId}
          students={students}
          readOnly={isReadOnly}
        />
      )}
    </TeacherPageShell>
  );
}
