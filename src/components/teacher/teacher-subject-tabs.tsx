'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { id: 'students', label: 'Students' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'marks', label: 'Marks' },
  { id: 'timetable', label: 'Timetable' },
] as const;

export type TeacherSubjectTab = (typeof TABS)[number]['id'];

interface TeacherSubjectTabsProps {
  groupId: string;
  subjectId: string;
  assignmentId: string;
  active: TeacherSubjectTab;
}

export function TeacherSubjectTabs({
  groupId,
  subjectId,
  assignmentId,
  active,
}: TeacherSubjectTabsProps) {
  const pathname = usePathname();
  const base = `/teacher/subjects/${assignmentId}`;

  const hrefFor = (tab: TeacherSubjectTab) => {
    if (tab === 'students') return base;
    if (tab === 'attendance') return `/teacher/attendance?groupId=${groupId}`;
    if (tab === 'marks') return `/teacher/marks?groupId=${groupId}&subjectId=${subjectId}`;
    return `/teacher/timetable`;
  };

  return (
    <div className="teacher-subject-tabs mb-4 flex flex-wrap gap-1 rounded-lg border border-warm-card-border bg-warm-card/40 p-1">
      {TABS.map((tab) => {
        const isActive =
          tab.id === active ||
          (tab.id === 'students' && pathname === base);
        return (
          <Link
            key={tab.id}
            href={hrefFor(tab.id)}
            className={`rounded-md px-3 py-1.5 text-xs transition-colors ${
              isActive
                ? 'bg-warm-accent/15 text-warm-cream'
                : 'text-warm-muted hover:text-warm-cream'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
