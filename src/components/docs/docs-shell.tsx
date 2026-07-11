import Link from 'next/link';
import Image from 'next/image';
import type { ReactNode } from 'react';
import { Code2 } from 'lucide-react';
import { DocsSidebar } from './docs-sidebar';
import type { DocsNavItem } from '@/lib/docs/navigation';

type DocsShellProps = {
  title: string;
  subtitle?: string;
  nav: DocsNavItem[];
  variant: 'intro' | 'api';
  children: ReactNode;
};

export function DocsShell({ title, subtitle, nav, variant, children }: DocsShellProps) {
  return (
    <div className="min-h-screen bg-[#1a1614] text-warm-cream">
      <header className="sticky top-0 z-20 border-b border-warm-card-border bg-[#1a1614]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/docs" className="flex items-center gap-2 text-sm font-medium text-warm-cream">
              <Image src="/logo.png" alt="" width={20} height={20} className="rounded" />
              MCS Docs
            </Link>
            <span className="text-warm-muted/40">/</span>
            <span className="text-xs text-warm-muted uppercase tracking-wide">{variant === 'api' ? 'Technical' : 'User Guide'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={variant === 'api' ? '/docs/intro' : '/docs/api'}
              className="inline-flex items-center gap-1.5 rounded-lg border border-warm-card-border px-3 py-1.5 text-xs text-warm-muted transition-colors hover:border-warm-accent/40 hover:text-warm-cream"
            >
              <Code2 size={13} />
              {variant === 'api' ? 'User Guide' : 'API Docs'}
            </Link>
            <Link href="/login" className="text-xs text-warm-muted hover:text-warm-cream">Back to portal</Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 lg:grid-cols-[260px_1fr] sm:px-6">
        <DocsSidebar items={nav} />
        <main className="min-w-0">
          <div className="mb-8 border-b border-warm-card-border pb-6">
            <h1 className="text-2xl font-light tracking-tight text-warm-cream md:text-3xl">{title}</h1>
            {subtitle ? <p className="mt-2 max-w-2xl text-sm leading-relaxed text-warm-muted">{subtitle}</p> : null}
          </div>
          <article className="docs-prose">{children}</article>
        </main>
      </div>
    </div>
  );
}
