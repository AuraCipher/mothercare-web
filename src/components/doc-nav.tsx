'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { FileText, Plus, X } from 'lucide-react';
import { showToast } from '@/components/toast';
import DocActionMenu from '@/components/doc-action-menu';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface UploadItem {
  id: string;
  name: string;
  type: string;
  size: number;
  progress: number;
  done: boolean;
  fileId?: string;
}

function DocCard({ icon, name, type, progress, showCheck, fileId, onDelete, onRename }: { icon: string; name: string; type: string; progress: number; showCheck?: boolean; fileId?: string; onDelete?: () => void; onRename?: (newName: string) => Promise<void> }) {
  return (
    <div className="rounded-xl border border-warm-card-border bg-warm-card p-4 group">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-lg shrink-0">{icon}</span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-warm-cream truncate">{name}</p>
            <p className="text-xs text-warm-muted">{type}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {showCheck && fileId ? (
            <DocActionMenu fileId={fileId} fileName={name}
              onRename={onRename || (async () => {})}
              onDelete={onDelete || (() => {})} />
          ) : showCheck ? (
            <span className="text-green-400 text-xs font-medium">✓</span>
          ) : null}
        </div>
      </div>
      {progress < 100 && (
        <div className="mt-3 h-1.5 rounded-full bg-warm-card-border/30 overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${progress > 80 ? 'bg-warm-accent' : 'bg-warm-accent/80'}`}
            style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}

export default function DocNav() {
  const pathname = usePathname();
  const profileMatch = pathname.match(/\/admin\/(students|teachers)\/([^/]+)/);
  const entityType = profileMatch ? (profileMatch[1] === 'teachers' ? 'teacher' : 'student') : null;
  const entityId = profileMatch ? profileMatch[2] : null;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch existing docs from backend on mount
  useEffect(() => {
    if (!entityType || !entityId) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${API_URL}/api/uploads?entityType=${entityType}&entityId=${entityId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(result => {
        if (result.success && Array.isArray(result.data)) {
          setUploads(prev => {
            // Keep browser-original names for files uploaded this session
            const prevNames = new Map(prev.filter(u => u.fileId).map(u => [u.fileId, u.name]));
            return result.data.map((f: any) => ({
              id: f.id,
              name: prevNames.get(f.id) || f.originalName,
              type: f.mimeType,
              size: f.size,
              progress: 100,
              done: true,
              fileId: f.id,
            }));
          });
        }
      })
      .catch(() => {});
  }, [entityType, entityId]);

  const handleUpload = useCallback(async (file: File) => {
    const isImage = file.type.startsWith('image/');
    const fileType = isImage ? 'Picture' : 'Document';

    // Add to list with 0 progress using a temp id
    const tempId = Math.random().toString(36).slice(2, 10);
    setUploads(prev => [...prev, { id: tempId, name: file.name, type: `${fileType} · ${file.name.split('.').pop()?.toUpperCase() || 'FILE'}`, size: file.size, progress: 0, done: false }]);

    let tick: ReturnType<typeof setInterval> | undefined;
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('purpose', 'document');
      if (entityType) formData.append('entityType', entityType);
      if (entityId) formData.append('entityId', entityId);

      // Simulate progress up to 80% while upload is in flight
      let progress = 0;
      tick = setInterval(() => {
        if (progress < 80) { progress += 10; setUploads(prev => prev.map(u => u.id === tempId ? { ...u, progress } : u)); }
      }, 200);

      const res = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      clearInterval(tick);

      if (res.ok) {
        const result = await res.json().catch(() => ({}));
        const data = result.data;
        // Replace temp entry with real file data from server
        setUploads(prev => prev.map(u => u.id === tempId ? {
          ...u, id: data?.id || tempId, progress: 100, done: true, fileId: data?.id,
        } : u));
        showToast('success', 'File uploaded');
      } else {
        setUploads(prev => prev.filter(u => u.id !== tempId));
        const msg = await res.json().then(d => d.message).catch(() => 'Upload failed');
        showToast('error', msg);
      }
    } catch (e: any) {
      if (tick) clearInterval(tick);
      setUploads(prev => prev.filter(u => u.id !== tempId));
      showToast('error', e.message || 'Upload failed');
    }
    if (inputRef.current) inputRef.current.value = '';
  }, [entityType, entityId]);

  const handleRename = useCallback(async (fileId: string, newName: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/uploads/${fileId}/rename`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalName: newName }),
      });
      if (res.ok) {
        const result = await res.json();
        setUploads(prev => prev.map(u => u.fileId === fileId ? { ...u, name: result.data.originalName } : u));
        showToast('success', 'File renamed');
      } else {
        const msg = await res.json().then(d => d.message).catch(() => 'Rename failed');
        showToast('error', msg);
        throw new Error(msg);
      }
    } catch {
      showToast('error', 'Rename failed');
      throw new Error('Rename failed');
    }
  }, []);

  const handleDelete = useCallback(async (fileId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/uploads/${fileId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setUploads(prev => prev.filter(u => u.fileId !== fileId));
        showToast('success', 'File deleted');
      } else {
        showToast('error', 'Failed to delete file');
      }
    } catch {
      showToast('error', 'Failed to delete file');
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  }, [handleUpload]);

  const activeUploads = uploads.filter(u => !u.done);
  const completedUploads = uploads.filter(u => u.done);

  return (
    <>
      <button onClick={() => setDrawerOpen(true)}
        className="rounded-lg p-1.5 text-warm-muted hover:bg-warm-card hover:text-warm-cream transition-colors"
        title="Documents">
        <FileText size={15} />
      </button>

      <div className={`fixed inset-0 z-50 transition-all duration-300 ease-out ${drawerOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div className={`absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-300 ease-out ${drawerOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setDrawerOpen(false)} />
        <div className={`absolute right-0 top-0 h-full w-80 bg-[#24201e] border-l border-warm-card-border shadow-2xl transition-transform duration-300 ease-out ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex items-center justify-between border-b border-warm-card-border px-5 py-4">
            <h2 className="text-sm font-medium text-warm-cream">Documents</h2>
            <button onClick={() => setDrawerOpen(false)} className="rounded-lg p-1 text-warm-muted hover:text-warm-cream transition-colors">
              <X size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Upload area */}
            <div onClick={() => inputRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-warm-card-border bg-warm-card/30 py-10 px-6 cursor-pointer hover:border-warm-accent transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warm-accent/10 mb-3">
                <Plus size={20} className="text-warm-accent" />
              </div>
              <p className="text-sm font-medium text-warm-cream">Paste or upload</p>
            </div>
            <input ref={inputRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />

            {/* In Progress */}
            {activeUploads.length > 0 && (
              <>
                <p className="text-[10px] font-medium tracking-wider text-warm-muted uppercase">Uploading</p>
                {activeUploads.map(u => <DocCard key={u.id} icon={u.progress > 0 ? (u.name.match(/\.(png|jpg|jpeg|webp)$/i) ? '🖼️' : '📄') : '📄'} name={u.name} type={u.type} progress={u.progress} />)}
              </>
            )}

            {/* Uploaded */}
            {completedUploads.length > 0 && (
              <>
                <p className="text-[10px] font-medium tracking-wider text-warm-muted uppercase">Uploaded</p>
                {completedUploads.map(u => <DocCard key={u.id} icon={u.name.match(/\.(png|jpg|jpeg|webp)$/i) ? '🖼️' : '📄'} name={u.name} type={u.type} progress={100} showCheck fileId={u.fileId}
                  onDelete={() => u.fileId && handleDelete(u.fileId)}
                  onRename={(newName) => u.fileId ? handleRename(u.fileId, newName) : Promise.resolve()} />)}
              </>
            )}

            {uploads.length === 0 && (
              <p className="text-xs text-warm-muted/50 text-center pt-4">No documents yet. Tap above to upload.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
