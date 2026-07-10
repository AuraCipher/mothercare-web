'use client';

import Link from 'next/link';
import {
  Bell,
  CalendarDays,
  ClipboardCheck,
  PenLine,
  TableProperties,
  Users,
} from 'lucide-react';
import { AssignmentCard } from '@/components/teacher/assignment-card';
import { TeacherNoAssignmentsState, TeacherPageShell } from '@/components/teacher/teacher-page-shell';
import {
  TeacherQuickLink,
  TeacherSection,
  TeacherStatCard,
} from '@/components/teacher/teacher-ui';
import { useTeacherBootstrap } from '@/lib/teacher/use-teacher-bootstrap';
import { formatGroupLabel } from '@/lib/teacher/types';
import { api } from '@/lib/api';
import { useEffect, useMemo, useState } from 'react';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TeacherHomePage() {
  const { data } = useTeacherBootstrap();
  const [todaySlots, setTodaySlots] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!data) return;
    api.teacherTimetable().then((res) => {
      if (!res.success) return;
      const day = new Date().getDay();
      const slots = (res.data?.slots || []).filter((s: any) =>
        (s.activeDays || []).includes(day),
      );
      setTodaySlots(slots.slice(0, 4));
    }).catch(() => {});
    api.teacherAnnouncements().then((res) => {
      if (res.success) setAnnouncements((res.data || []).slice(0, 3));
    }).catch(() => {});
    api.teacherNotifications({ limit: 1 }).then((res) => {
      if (res.success) setUnreadCount(res.data?.unreadCount ?? 0);
    }).catch(() => {});
  }, [data]);

  const preview = useMemo(() => data?.assignments.slice(0, 3) ?? [], [data]);
  const classCount = useMemo(
    () => new Set(data?.assignments.map((a) => a.groupId) ?? []).size,
    [data],
  );
  const todayLabel = DAY_NAMES[new Date().getDay()];

  if (!data) return null;

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
        {unreadCount > 0 && (
          <TeacherStatCard label="Notifications" value={unreadCount} hint="Unread" />
        )}
      </div>

      {todaySlots.length > 0 && (
        <TeacherSection
          title={`Today — ${todayLabel}`}
          action={
            <Link href="/teacher/timetable" className="teacher-link text-xs">
              Full timetable
            </Link>
          }
        >
          <ul className="teacher-card divide-y divide-warm-card-border rounded-xl border border-warm-card-border bg-warm-card">
            {todaySlots.map((slot, i) => (
              <li key={i} className="flex items-center justify-between gap-2 px-4 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="truncate text-warm-cream">
                    {slot.subject?.name || 'Period'} · {formatGroupLabel(slot.group)}
                  </p>
                  <p className="text-xs text-warm-muted">
                    P{slot.lectureNumber} · {slot.startTime}–{slot.endTime}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </TeacherSection>
      )}

      {announcements.length > 0 && (
        <TeacherSection
          title="Announcements"
          action={
            <Link href="/teacher/announcements" className="teacher-link text-xs">
              See all
            </Link>
          }
        >
          <ul className="space-y-2">
            {announcements.map((a) => (
              <li
                key={a.id}
                className="teacher-card rounded-xl border border-warm-card-border bg-warm-card p-3"
              >
                <p className="text-sm text-warm-cream">{a.title}</p>
                <p className="teacher-break-text mt-1 line-clamp-2 text-xs text-warm-muted">
                  {a.content}
                </p>
              </li>
            ))}
          </ul>
        </TeacherSection>
      )}

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
        <TeacherNoAssignmentsState />
      )}

      <TeacherSection title="Quick actions">
        <div className="teacher-quick-actions">
          <TeacherQuickLink
            href="/teacher/timetable"
            title="My timetable"
            body="Weekly schedule and periods"
            icon={CalendarDays}
          />
          <TeacherQuickLink
            href="/teacher/attendance"
            title="Attendance"
            body={
              data.portal.teachersCanMarkAttendance
                ? 'Mark and review class attendance'
                : 'View attendance (marking disabled by branch)'
            }
            icon={ClipboardCheck}
          />
          <TeacherQuickLink
            href="/teacher/results"
            title="Results"
            body="Read-only marks table with session, exam, and subject filters"
            icon={TableProperties}
          />
          <TeacherQuickLink
            href="/teacher/marks"
            title="Marks"
            body="Enter exam marks for your subjects"
            icon={PenLine}
          />
          {data.portal.isHod && (
            <TeacherQuickLink
              href="/teacher/hod/marks"
              title="Department marks"
              body="HOD view — all subjects in your department"
              icon={Users}
            />
          )}
          <TeacherQuickLink
            href="/teacher/notifications"
            title="Notifications"
            body={
              unreadCount > 0
                ? `${unreadCount} unread notification(s)`
                : 'School alerts and messages'
            }
            icon={Bell}
            badge={unreadCount > 0 ? `${unreadCount} new` : undefined}
          />
        </div>
      </TeacherSection>
    </TeacherPageShell>
  );
}
