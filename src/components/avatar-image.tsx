'use client';

import { useState, useEffect } from 'react';
import config from '@/config';

interface AvatarImageProps {
  fileId: string | null | undefined;
  alt?: string;
  className?: string;
  fallback?: string; // initial letters to show when no image
}

export default function AvatarImage({ fileId, alt = '', className = '', fallback }: AvatarImageProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!fileId) { setSrc(null); return; }
    setError(false); // reset error state for new fileId
    const token = localStorage.getItem('token');
    setSrc(`${config.apiUrl}/api/uploads/${fileId}`);
  }, [fileId]);

  if (!src || error) {
    return (
      <div className={`flex items-center justify-center bg-warm-card border border-warm-card-border text-warm-muted ${className}`}>
        {fallback ? (
          <span className="text-xs font-medium">{fallback}</span>
        ) : (
          <span className="text-[10px]">No Photo</span>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
      style={{ objectFit: 'cover' }}
    />
  );
}
