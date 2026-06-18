'use client';

import { useEffect, useRef, useState } from 'react';
import { Eye, Download, Pencil, Trash2 } from 'lucide-react';
import RenameModal from '@/components/rename-modal';
import ConfirmModal from '@/components/confirm-modal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface DocActionMenuProps {
  fileId: string;
  fileName: string;
  onRename: (newName: string) => Promise<void>;
  onDelete: () => void;
}

export default function DocActionMenu({ fileId, fileName, onRename, onDelete }: DocActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    requestAnimationFrame(() => document.addEventListener('click', handleClick));
    return () => document.removeEventListener('click', handleClick);
  }, [open]);

  const handleRename = (newName: string) => {
    onRename(newName).catch(() => {});
    setRenameOpen(false);
  };

  const handleDeleteConfirm = () => {
    onDelete();
    setDeleteOpen(false);
  };

  const handleDownload = () => {
    const token = localStorage.getItem('token');
    fetch(`${API_URL}/api/uploads/${fileId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => {});
    setOpen(false);
  };

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button onClick={() => setOpen(!open)}
        className="rounded p-1 text-warm-muted hover:text-warm-cream hover:bg-warm-card/50 transition-colors opacity-0 group-hover:opacity-100"
        title="Actions">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div ref={menuRef}
            className="absolute right-0 bottom-full mb-1 z-50 min-w-[150px] overflow-hidden rounded-lg border border-warm-card-border bg-[#2d2826] shadow-xl">
            <button onClick={() => { window.open(`/documents/${fileId}`, '_blank'); setOpen(false); }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-warm-cream hover:bg-warm-card transition-colors">
              <Eye size={13} className="text-warm-accent" /> View
            </button>
            <button onClick={handleDownload}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-warm-cream hover:bg-warm-card transition-colors">
              <Download size={13} className="text-warm-accent" /> Download
            </button>
            <button onClick={() => { setRenameOpen(true); setOpen(false); }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-warm-cream hover:bg-warm-card transition-colors">
              <Pencil size={13} className="text-warm-accent" /> Rename
            </button>
            <button onClick={() => { setDeleteOpen(true); setOpen(false); }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-red-400 hover:bg-warm-card transition-colors">
              <Trash2 size={13} /> Delete
            </button>
          </div>
        </>
      )}

      <RenameModal open={renameOpen} currentName={fileName}
        onConfirm={handleRename} onCancel={() => setRenameOpen(false)} />

      <ConfirmModal open={deleteOpen} title="Delete file"
        message="This will permanently delete the file and remove it from disk. This action cannot be undone."
        confirmLabel="Delete" variant="danger"
        onConfirm={handleDeleteConfirm} onCancel={() => setDeleteOpen(false)} />
    </div>
  );
}
