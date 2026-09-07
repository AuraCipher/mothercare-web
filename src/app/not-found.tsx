'use client';

import Link from 'next/link';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-warm-base">
      <div className="flex flex-col items-center gap-6 px-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-warm-surface border border-warm-border">
          <FileQuestion size={36} className="text-warm-muted" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-warm-cream">Page not found</h1>
          <p className="max-w-sm text-sm leading-relaxed text-warm-muted">
            The page you are looking for does not exist or has been moved.
          </p>
        </div>

        <Link
          href="/admin"
          className="flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-500"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
