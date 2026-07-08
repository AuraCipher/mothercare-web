'use client';

import { useEffect, useMemo, useState } from 'react';
import { AssignmentCard } from '@/components/teacher/assignment-card';
import { TeacherNoAssignmentsState, TeacherPageShell } from '@/components/teacher/teacher-page-shell';
import { useTeacherBootstrap } from '@/lib/teacher/use-teacher-bootstrap';
import { formatGroupLabel } from '@/lib/teacher/types';

type FilterMode = 'all' | 'class-teacher';

export default function TeacherMyClassesPage() {
  const { data } = useTeacherBootstrap();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterMode>('all');

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.assignments.filter((a) => {
      if (filter === 'class-teacher' && !a.isClassTeacher) return false;
      if (!q) return true;
      const haystack = [
        a.subject.name,
        a.subject.code,
        a.group.name,
        a.group.section,
        formatGroupLabel(a.group),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [data, search, filter]);

  if (!data) return null;

  return (
    <TeacherPageShell
      title="My Classes"
      subtitle={`${data.portal.assignmentCount} assignment${data.portal.assignmentCount === 1 ? '' : 's'} this year`}
    >
      {data.assignments.length === 0 ? (
        <TeacherNoAssignmentsState />
      ) : (
        <>
          <div className="teacher-card flex flex-col gap-3 rounded-xl border border-warm-card-border bg-warm-card p-4 sm:flex-row sm:items-center">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search class or subject…"
              className="min-w-0 flex-1 rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream"
            />
            <div className="flex gap-1 rounded-lg border border-warm-card-border p-1">
              {(
                [
                  { id: 'all' as const, label: 'All' },
                  { id: 'class-teacher' as const, label: 'Class teacher' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFilter(opt.id)}
                  className={`rounded-md px-3 py-1.5 text-xs ${
                    filter === opt.id
                      ? 'bg-warm-accent/15 text-warm-cream'
                      : 'text-warm-muted hover:text-warm-cream'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="text-center text-sm text-warm-muted">No assignments match your search.</p>
          ) : (
            <div className="teacher-grid-cards">
              {filtered.map((assignment) => (
                <AssignmentCard key={assignment.id} assignment={assignment} />
              ))}
            </div>
          )}
        </>
      )}
    </TeacherPageShell>
  );
}
