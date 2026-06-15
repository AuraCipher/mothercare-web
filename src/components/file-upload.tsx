'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { showToast } from '@/components/toast';

interface FileUploadProps {
  value: string | null | undefined;  // current fileId
  onChange: (fileId: string | null) => void;
  accept?: string;
  maxSize?: number; // MB
  label?: string;
}

export default function FileUpload({ value, onChange, accept = 'image/*,.pdf', maxSize = 5, label = 'Upload Photo' }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    // Client size check
    if (file.size > maxSize * 1024 * 1024) {
      showToast('error', `File too large (max ${maxSize}MB)`);
      return;
    }

    // Show preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }

    // Upload
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          // No Content-Type — fetch sets it automatically for FormData
        },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed');

      onChange(data.data.id);
      showToast('success', 'Upload complete');
    } catch (e: any) {
      showToast('error', e.message || 'Upload failed');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }, [maxSize, onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleRemove = () => {
    onChange(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const displaySrc = preview || (value ? `/api/uploads/${value}` : null);

  return (
    <div>
      {displaySrc ? (
        <div className="relative inline-block">
          {preview || value ? (
            <img src={displaySrc} alt="Preview" className="w-24 h-24 rounded-lg object-cover border border-warm-card-border" />
          ) : (
            <div className="w-24 h-24 rounded-lg border border-warm-card-border bg-warm-card flex items-center justify-center">
              <FileText size={24} className="text-warm-muted" />
            </div>
          )}
          <button onClick={handleRemove} className="absolute -top-2 -right-2 rounded-full bg-red-500 p-0.5 text-white hover:bg-red-600 transition-colors">
            <X size={12} />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className="w-24 h-24 rounded-lg border-2 border-dashed border-warm-card-border bg-warm-card/30 flex flex-col items-center justify-center cursor-pointer hover:border-warm-accent transition-colors"
        >
          {uploading ? (
            <div className="animate-spin w-5 h-5 border-2 border-warm-accent border-t-transparent rounded-full" />
          ) : (
            <>
              <Upload size={18} className="text-warm-muted mb-1" />
              <span className="text-[9px] text-warm-muted text-center leading-tight px-1">{label}</span>
            </>
          )}
        </div>
      )}
      <input ref={inputRef} type="file" accept={accept} onChange={handleChange} className="hidden" />
    </div>
  );
}
