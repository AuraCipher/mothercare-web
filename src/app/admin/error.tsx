'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, ArrowLeft } from 'lucide-react';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Admin error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1a1614]">
      <div className="flex flex-col items-center gap-6 px-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-red-900/20 border border-red-900/30">
          <AlertTriangle size={36} className="text-red-400" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-warm-cream">Admin panel error</h1>
          <p className="max-w-sm text-sm leading-relaxed text-warm-muted">
            Something went wrong in the admin panel. Please try again.
          </p>
          {error.digest && (
            <p className="text-xs text-warm-muted/50">Error ID: {error.digest}</p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={reset}
            className="flex items-center gap-2 rounded-lg bg-warm-accent px-5 py-2.5 text-sm font-medium text-[#1a1614] transition-colors hover:bg-[#b39a76]"
          >
            <RotateCcw size={16} />
            Try again
          </button>
          <Link
            href="/admin"
            className="flex items-center gap-2 rounded-lg border border-warm-card-border px-5 py-2.5 text-sm font-medium text-warm-cream transition-colors hover:bg-warm-card"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
