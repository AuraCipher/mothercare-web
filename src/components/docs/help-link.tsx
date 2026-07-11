'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CircleHelp } from 'lucide-react';
import { docsPathForAppRoute } from '@/lib/docs/page-help';

type DocsHelpLinkProps = {
  href?: string;
  className?: string;
};

/** Contextual ? icon — links to the user-guide page for the current module. */
export function DocsHelpLink({ href, className = '' }: DocsHelpLinkProps) {
  const pathname = usePathname();
  const target = href ?? docsPathForAppRoute(pathname);
  if (!target) return null;

  return (
    <Link
      href={target}
      title="How to use this page"
      aria-label="Open documentation for this page"
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full border border-warm-card-border bg-warm-card/60 text-warm-muted transition-colors hover:border-warm-accent/50 hover:text-warm-accent ${className}`}
    >
      <CircleHelp size={16} />
    </Link>
  );
}
