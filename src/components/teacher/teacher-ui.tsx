'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';

export function TeacherSection({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="teacher-section">
      <div className="teacher-section__head">
        <h2 className="teacher-section__title">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function TeacherStatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="teacher-stat-card">
      <p className="teacher-stat-card__label">{label}</p>
      <p className="teacher-stat-card__value">{value}</p>
      {hint && <p className="teacher-stat-card__hint">{hint}</p>}
    </div>
  );
}

export function TeacherBadge({
  tone = 'neutral',
  children,
}: {
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'accent';
  children: ReactNode;
}) {
  return <span className={`teacher-badge teacher-badge--${tone}`}>{children}</span>;
}

export function TeacherAlert({
  tone,
  children,
  action,
}: {
  tone: 'error' | 'success' | 'warning' | 'info';
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className={`teacher-alert teacher-alert--${tone}`}>
      <div className="teacher-alert__body">{children}</div>
      {action}
    </div>
  );
}

export function TeacherEmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <div className="teacher-empty">
      <p className="teacher-empty__title">{title}</p>
      {body && <p className="teacher-empty__body">{body}</p>}
    </div>
  );
}

export function TeacherQuickLink({
  href,
  title,
  body,
}: {
  href: string;
  title: string;
  body: string;
}) {
  return (
    <Link href={href} className="teacher-quick-link">
      <p className="teacher-quick-link__title">{title}</p>
      <p className="teacher-quick-link__body">{body}</p>
    </Link>
  );
}

export function TeacherButton({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled,
  className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`teacher-btn teacher-btn--${variant} ${className}`.trim()}
    >
      {children}
    </button>
  );
}
