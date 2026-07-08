'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export type TeacherSubjectTab = 'students' | 'attendance' | 'marks' | 'timetable';

const TABS: { id: TeacherSubjectTab; label: string }[] = [
  { id: 'students', label: 'Students' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'marks', label: 'Marks' },
  { id: 'timetable', label: 'Timetable' },
];

interface TeacherSubjectTabsProps {
  assignmentId: string;
  active: TeacherSubjectTab;
}

export function TeacherSubjectTabs({ assignmentId, active }: TeacherSubjectTabsProps) {
  const base = `/teacher/subjects/${assignmentId}`;

  return (
    <div className="teacher-subject-tabs mb-4 flex flex-wrap gap-1 rounded-lg border border-warm-card-border bg-warm-card/40 p-1">
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        const href = tab.id === 'students' ? base : `${base}?tab=${tab.id}`;
        return (
          <Link
            key={tab.id}
            href={href}
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

export function useSubjectTab(): TeacherSubjectTab {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');
  if (tab === 'attendance' || tab === 'marks' || tab === 'timetable') return tab;
  return 'students';
}

export function attendanceStatusLabel(status: string | null | undefined) {
  if (!status) return '—';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function attendanceStatusClass(status: string | null | undefined) {
  if (status === 'present' || status === 'function') return 'text-green-400';
  if (status === 'absent') return 'text-red-300';
  if (status === 'late') return 'text-yellow-300';
  if (status === 'leave') return 'text-blue-300';
  return 'text-warm-muted';
}
