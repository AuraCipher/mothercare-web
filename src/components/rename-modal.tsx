'use client';

import { useEffect, useRef, useState } from 'react';
import { Pencil, X } from 'lucide-react';

interface RenameModalProps {
  open: boolean;
  currentName: string;
  onConfirm: (newName: string) => void;
  onCancel: () => void;
}

export default function RenameModal({ open, currentName, onConfirm, onCancel }: RenameModalProps) {
  const [value, setValue] = useState(currentName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setValue(currentName);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [open, currentName]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onCancel();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onCancel]);

  if (!open) return null;

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== currentName) {
      onConfirm(trimmed);
    } else {
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape') onCancel();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onCancel}>
      <div
        className="w-full max-w-sm rounded-xl border border-warm-card-border bg-[#24201e] p-6 shadow-2xl animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Icon */}
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border-warm-accent/40 bg-warm-accent/10">
          <Pencil size={20} className="text-warm-accent" />
        </div>

        {/* Title */}
        <h2 className="mb-4 text-center text-sm font-medium text-warm-cream">Rename file</h2>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none placeholder:text-warm-muted/50 focus:border-warm-accent/50 transition-colors"
        />

        {/* Actions */}
        <div className="mt-5 flex gap-2">
          <button onClick={onCancel}
            className="flex-1 rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit}
            className="flex-1 rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] transition-colors">
            Rename
          </button>
        </div>
      </div>
    </div>
  );
}
