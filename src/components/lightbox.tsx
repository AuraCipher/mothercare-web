'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useAuthenticatedFileUrl } from '@/hooks/use-authenticated-file-url';

interface LightboxProps {
  isOpen: boolean;
  onClose: () => void;
  fileId: string | null | undefined;
  alt?: string;
}

export default function Lightbox({ isOpen, onClose, fileId, alt = '' }: LightboxProps) {
  const { url } = useAuthenticatedFileUrl(isOpen ? fileId : null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white/80 hover:text-white hover:bg-black/70 transition-colors"
      >
        <X size={20} />
      </button>
      {url ? (
        <img
          src={url}
          alt={alt}
          className="relative max-h-[85vh] max-w-[92vw] rounded-xl object-contain shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <p className="relative text-sm text-white/70">Loading…</p>
      )}
    </div>
  );
}
