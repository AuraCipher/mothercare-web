'use client';

import { useAuthenticatedFileUrl } from '@/hooks/use-authenticated-file-url';

interface AvatarImageProps {
  fileId: string | null | undefined;
  alt?: string;
  className?: string;
  fallback?: string;
}

export default function AvatarImage({ fileId, alt = '', className = '', fallback }: AvatarImageProps) {
  const { url, error } = useAuthenticatedFileUrl(fileId);

  if (!url || error) {
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
      src={url}
      alt={alt}
      className={className}
      onError={() => {}}
      style={{ objectFit: 'cover' }}
    />
  );
}
