'use client';

import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  subtitle?: string;
  badge?: string | number;
  defaultOpen?: boolean;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function CollapsibleSection({
  title,
  subtitle,
  badge,
  defaultOpen = false,
  actions,
  children,
  className = '',
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`rounded-xl border border-warm-card-border bg-warm-card overflow-hidden ${className}`}>
      <div className="flex items-center gap-2 px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          aria-expanded={open}
        >
          {open ? (
            <ChevronDown size={16} className="shrink-0 text-warm-muted" />
          ) : (
            <ChevronRight size={16} className="shrink-0 text-warm-muted" />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-warm-cream">{title}</span>
              {badge !== undefined && badge !== '' && (
                <span className="rounded bg-warm-accent/10 px-1.5 py-0.5 text-[10px] text-warm-accent">
                  {badge}
                </span>
              )}
            </div>
            {!open && subtitle && (
              <p className="mt-0.5 truncate text-[11px] text-warm-muted">{subtitle}</p>
            )}
          </div>
        </button>
        {actions && (
          <div className="flex shrink-0 items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {actions}
          </div>
        )}
      </div>
      {open && (
        <div className="border-t border-warm-card-border/60 px-4 py-4">
          {children}
        </div>
      )}
    </div>
  );
}

export function MiniProgressBar({ percent, label }: { percent: number; label?: string }) {
  const color = percent >= 80 ? 'bg-green-500' : percent >= 40 ? 'bg-yellow-500' : 'bg-warm-accent';
  return (
    <div>
      {label && (
        <div className="mb-1 flex justify-between text-[10px] text-warm-muted">
          <span>{label}</span>
          <span>{percent}%</span>
        </div>
      )}
      <div className="h-1.5 overflow-hidden rounded-full bg-[#1a1614]">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
