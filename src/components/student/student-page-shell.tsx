'use client';

import type { ReactNode } from 'react';
import { useStudentBootstrap } from '@/lib/student/use-student-bootstrap';

export function StudentPageLoading() {
  return (
    <div className="teacher-page space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-16 animate-pulse rounded-xl bg-warm-card" />
      ))}
    </div>
  );
}

export function StudentPageShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const { data, loading, error } = useStudentBootstrap();

  if (loading && !data) return <StudentPageLoading />;

  if (error && !data) {
    return (
      <div className="teacher-page">
        <div className="teacher-break-text rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="teacher-page">
      <header className="mb-6">
        <h1 className="text-xl font-light text-warm-cream sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-warm-muted">{subtitle}</p>}
        {data?.student.groupLabel && (
          <p className="mt-1 text-xs text-warm-muted">
            {data.student.groupLabel}
            {data.student.rollNumber ? ` · Roll ${data.student.rollNumber}` : ''}
          </p>
        )}
      </header>
      {children}
    </div>
  );
}
