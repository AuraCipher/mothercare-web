'use client';

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ChevronRight } from 'lucide-react';
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
  icon: Icon,
  badge,
}: {
  href: string;
  title: string;
  body: string;
  icon: LucideIcon;
  badge?: string;
}) {
  return (
    <Link href={href} className="teacher-quick-action">
      <span className="teacher-quick-action__icon" aria-hidden>
        <Icon size={20} strokeWidth={1.75} />
      </span>
      <span className="teacher-quick-action__content">
        <span className="teacher-quick-action__head">
          <span className="teacher-quick-action__title">{title}</span>
          {badge ? <span className="teacher-quick-action__badge">{badge}</span> : null}
        </span>
        <span className="teacher-quick-action__body">{body}</span>
      </span>
      <ChevronRight className="teacher-quick-action__arrow" size={16} aria-hidden />
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
