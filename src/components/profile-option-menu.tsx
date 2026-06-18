'use client';

import { useEffect, useRef } from 'react';
import { Eye, Upload } from 'lucide-react';

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

interface ProfileOptionMenuProps {
  isOpen: boolean;
  onClose: () => void;
  items: MenuItem[];
}

export default function ProfileOptionMenu({ isOpen, onClose, items }: ProfileOptionMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Delay adding listener to avoid the same click that opened it
    requestAnimationFrame(() => document.addEventListener('click', handleClick));
    return () => document.removeEventListener('click', handleClick);
  }, [isOpen, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop for mobile — closes on tap */}
      <div className="fixed inset-0 z-40 sm:hidden" onClick={onClose} />

      {/* Menu — bottom sheet on mobile, dropdown on desktop */}
      <div ref={menuRef}
        className="absolute right-0 top-full mt-2 z-50 min-w-[180px] overflow-hidden rounded-xl border border-warm-card-border bg-[#2d2826] shadow-2xl
                   sm:origin-top-right sm:animate-in sm:fade-in sm:zoom-in-95
                   fixed bottom-0 left-0 right-0 sm:static sm:rounded-xl rounded-t-2xl rounded-b-none">
        <div className="sm:hidden flex items-center justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-warm-muted/30" />
        </div>
        <div className="py-1 sm:py-0">
          {items.map((item, i) => (
            <button key={i} onClick={() => { item.onClick(); onClose(); }}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm text-warm-cream hover:bg-warm-card transition-colors">
              <span className="text-warm-accent shrink-0">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

// Pre-built items for profile photo
export function viewPhotoItem(onClick: () => void): MenuItem {
  return { label: 'View Photo', icon: <Eye size={16} />, onClick };
}

export function uploadNewItem(onClick: () => void): MenuItem {
  return { label: 'Upload New', icon: <Upload size={16} />, onClick };
}
