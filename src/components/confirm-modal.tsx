'use client';

import { AlertTriangle, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      // Focus the confirm button when modal opens
      setTimeout(() => confirmRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onCancel();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onCancel]);

  if (!open) return null;

  const accentColor =
    variant === 'danger'
      ? 'border-red-900/40 bg-red-900/10 text-red-400'
      : variant === 'warning'
        ? 'border-yellow-900/40 bg-yellow-900/10 text-yellow-400'
        : 'border-warm-accent/40 bg-warm-accent/10 text-warm-accent';

  const iconColor =
    variant === 'danger' ? 'text-red-400' : variant === 'warning' ? 'text-yellow-400' : 'text-warm-accent';

  const buttonBg =
    variant === 'danger'
      ? 'bg-red-600 hover:bg-red-500 text-white'
      : variant === 'warning'
        ? 'bg-yellow-600 hover:bg-yellow-500 text-white'
        : 'bg-warm-accent hover:bg-[#b39a76] text-[#1a1614]';

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-warm-card-border bg-[#24201e] p-6 shadow-2xl animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
      >
        {/* Icon */}
        <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${accentColor}`}>
          <AlertTriangle size={22} className={iconColor} />
        </div>

        {/* Title */}
        <h2 id="confirm-title" className="mb-2 text-center text-sm font-medium text-warm-cream">
          {title}
        </h2>

        {/* Message */}
        <p className="mb-6 text-center text-xs leading-relaxed text-warm-muted">
          {message}
        </p>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 rounded-lg px-4 py-2 text-xs font-medium transition-colors disabled:opacity-50 ${buttonBg}`}
          >
            {loading ? 'Processing…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
