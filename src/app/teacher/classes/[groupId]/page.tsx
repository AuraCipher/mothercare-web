'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  TeacherAccessDenied,
  TeacherPageShell,
} from '@/components/teacher/teacher-page-shell';
import { useTeacherBootstrap } from '@/lib/teacher/use-teacher-bootstrap';
import { assignmentsForGroup, canAccessGroup } from '@/lib/teacher/scope';
import { formatGroupLabel } from '@/lib/teacher/types';
import { api } from '@/lib/api';

export default function TeacherClassHubPage() {
  const params = useParams();
  const groupId = typeof params.groupId === 'string' ? params.groupId : '';
  const { data } = useTeacherBootstrap();
  const [students, setStudents] = useState<any[]>([]);
  const [showParentContacts, setShowParentContacts] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentsError, setStudentsError] = useState('');

  useEffect(() => {
    if (!groupId || !data || !canAccessGroup(data.assignments, groupId)) return;
    setLoadingStudents(true);
    setStudentsError('');
    api
      .teacherClassStudents(groupId)
      .then((res) => {
        if (res.success) {
          setStudents(res.data.students || []);
          setShowParentContacts(!!res.data.showParentContacts);
        } else setStudentsError(res.message || 'Unable to load students');
      })
      .catch(() => {
        setStudents([]);
        setStudentsError('Unable to load students');
      })
      .finally(() => setLoadingStudents(false));
  }, [groupId, data]);

  if (!data) return null;

  if (!canAccessGroup(data.assignments, groupId)) {
    return <TeacherAccessDenied />;
  }

  const groupAssignments = assignmentsForGroup(data.assignments, groupId);
  const group = groupAssignments[0]?.group;
  if (!group) return <TeacherAccessDenied />;

  const isClassTeacher = data.portal.classTeacherGroupIds.includes(groupId);

  return (
    <TeacherPageShell
      title={formatGroupLabel(group)}
      subtitle={isClassTeacher ? 'You are the class teacher for this group' : 'Your subjects in this class'}
    >
      <div className="teacher-action-row">
        <Link
          href={`/teacher/attendance?groupId=${groupId}`}
          className="rounded-lg border border-warm-accent/40 bg-warm-accent/10 px-3 py-2 text-xs text-warm-cream"
        >
          Mark attendance
        </Link>
        <Link
          href="/teacher/announcements"
          className="rounded-lg border border-warm-card-border px-3 py-2 text-xs text-warm-muted hover:text-warm-cream"
        >
          Announcements
        </Link>
      </div>

      <div className="teacher-grid-cards">
        {groupAssignments.map((assignment) => (
          <Link
            key={assignment.id}
            href={`/teacher/subjects/${assignment.id}`}
            className="teacher-card rounded-xl border border-warm-card-border bg-warm-card p-4 hover:border-warm-cream/20"
          >
            <p className="teacher-card__title text-sm font-medium text-warm-cream">{assignment.subject.name}</p>
            <p className="teacher-break-text mt-1 text-xs text-warm-muted">
              {assignment.isClassTeacher ? 'Class teacher · ' : ''}
              {assignment.role}
            </p>
          </Link>
        ))}
      </div>

      <div className="teacher-card rounded-xl border border-warm-card-border bg-warm-card p-4">
        <div className="mb-3 flex min-w-0 items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-warm-cream">Students ({students.length})</h2>
          {showParentContacts && (
            <span className="text-[10px] text-warm-muted">Parent contacts enabled</span>
          )}
        </div>
        {loadingStudents ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-warm-card/60" />
            ))}
          </div>
        ) : studentsError ? (
          <div className="teacher-break-text rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {studentsError}
          </div>
        ) : students.length === 0 ? (
          <p className="text-sm text-warm-muted">No active students in this class.</p>
        ) : (
          <ul className="divide-y divide-warm-card-border">
            {students.map((s) => (
              <li key={s.id} className="flex min-w-0 items-center justify-between gap-2 py-2.5">
                <div className="min-w-0">
                  <p className="teacher-card__title truncate text-sm text-warm-cream">{s.name}</p>
                  <p className="text-xs text-warm-muted">Roll {s.rollNumber || '—'}</p>
                  {showParentContacts && s.parentContacts?.length > 0 && (
                    <p className="mt-1 text-[11px] text-warm-muted">
                      {s.parentContacts.map((p: any, i: number) => (
                        <span key={i}>
                          {i > 0 ? ' · ' : ''}
                          {p.relation}: {p.phone || p.whatsapp || '—'}
                        </span>
                      ))}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </TeacherPageShell>
  );
}
