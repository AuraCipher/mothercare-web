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

export function TeacherAccessDenied({
  backHref = '/teacher/my-classes',
  message = 'You are not assigned to this class or subject.',
}: {
  backHref?: string;
  message?: string;
}) {
  return (
    <div className="teacher-page">
      <div className="rounded-xl border border-warm-card-border bg-warm-card p-6 text-center sm:p-8">
        <p className="teacher-break-text text-sm text-warm-cream">{message}</p>
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

export function TeacherFrozenState({ reason }: { reason?: string }) {
  return (
    <div className="teacher-page flex min-h-[50vh] items-center justify-center">
      <div className="max-w-md rounded-xl border border-warm-card-border bg-warm-card p-8 text-center">
        <p className="text-lg font-light text-warm-cream">Portal access frozen</p>
        <p className="teacher-break-text mt-3 text-sm text-warm-muted">
          {reason || 'Your teacher portal access has been paused by school administration.'}
        </p>
        <p className="mt-4 text-xs text-warm-muted">You can still sign out from the menu.</p>
      </div>
    </div>
  );
}

export function TeacherNoAssignmentsState() {
  return (
    <div className="rounded-xl border border-dashed border-warm-card-border bg-warm-card/50 p-8 text-center">
      <p className="text-sm text-warm-cream">No classes assigned</p>
      <p className="teacher-break-text mt-2 text-xs text-warm-muted">
        Contact school administration to assign you to classes for this academic year.
      </p>
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
  if (data.portal.isFrozen) {
    return <TeacherFrozenState reason={data.portal.freezeReason} />;
  }

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
