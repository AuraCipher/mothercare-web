'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export default function ErrorBanner({ message, onRetry, className = '' }: ErrorBannerProps) {
  return (
    <div
      className={`flex items-center gap-3 rounded-lg border border-red-900/30 bg-red-900/10 px-4 py-3 ${className}`}
      role="alert"
    >
      <AlertTriangle size={16} className="shrink-0 text-red-400" />
      <span className="flex-1 text-sm text-red-300">{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 rounded-md bg-red-900/20 px-3 py-1.5 text-xs font-medium text-red-300 transition-colors hover:bg-red-900/30"
        >
          <RefreshCw size={12} />
          Retry
        </button>
      )}
    </div>
  );
}
