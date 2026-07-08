'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useTeacherBootstrap } from '@/lib/teacher/use-teacher-bootstrap';

export function TeacherPageLoading() {
  return (
    <div className="teacher-page space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-16 animate-pulse rounded-xl bg-warm-card" />
      ))}
    </div>
  );
}

export function TeacherPageError({ message }: { message: string }) {
  return (
    <div className="teacher-page">
      <div className="teacher-break-text rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
        {message}
      </div>
    </div>
  );
}

export function TeacherAccessDenied({ backHref = '/teacher/my-classes' }: { backHref?: string }) {
  return (
    <div className="teacher-page">
      <div className="rounded-xl border border-warm-card-border bg-warm-card p-6 text-center sm:p-8">
        <p className="teacher-break-text text-sm text-warm-cream">
          You are not assigned to this class or subject.
        </p>
        <Link
          href={backHref}
          className="mt-4 inline-block text-xs text-warm-muted underline hover:text-warm-cream"
        >
          Back to my classes
        </Link>
      </div>
    </div>
  );
}

export function TeacherStubNotice({ feature }: { feature: string }) {
  return (
    <div className="teacher-break-text rounded-lg border border-dashed border-warm-card-border bg-warm-card/50 px-4 py-3 text-xs text-warm-muted">
      {feature} — full workflow coming in a later phase.
    </div>
  );
}

interface TeacherPageShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function TeacherPageShell({ title, subtitle, children }: TeacherPageShellProps) {
  const { data, loading, error } = useTeacherBootstrap();

  if (loading) return <TeacherPageLoading />;
  if (error) return <TeacherPageError message={error} />;
  if (!data) return null;

  return (
    <div className="teacher-page space-y-5 sm:space-y-6">
      <div className="min-w-0">
        <h1 className="teacher-page__title text-lg font-light text-warm-cream sm:text-xl">{title}</h1>
        {subtitle ? (
          <p className="teacher-page__subtitle mt-1 text-sm text-warm-muted">{subtitle}</p>
        ) : (
          <p className="teacher-page__subtitle mt-1 text-sm text-warm-muted">
            {data.branch.name} · {data.academicYear.label} · {data.user.name}
          </p>
        )}
      </div>

      {children}
    </div>
  );
}
