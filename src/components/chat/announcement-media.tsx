'use client';

import { useAuthenticatedFileUrl } from '@/hooks/use-authenticated-file-url';

function extractUploadFileId(mediaUrl: string | null | undefined): string | null {
  if (!mediaUrl) return null;
  const match = mediaUrl.match(/\/api\/uploads\/([^/?#]+)/);
  return match?.[1] ?? null;
}

export function AnnouncementMedia({
  mediaUrl,
  mediaMimeType,
}: {
  mediaUrl: string | null;
  mediaMimeType?: string | null;
}) {
  const fileId = extractUploadFileId(mediaUrl);
  const { url, error } = useAuthenticatedFileUrl(fileId);
  const isImage = mediaMimeType?.startsWith('image/') ?? false;

  if (!mediaUrl) return null;

  if (isImage) {
    if (error) {
      return <p className="mt-2 text-xs text-warm-muted">Could not load image</p>;
    }
    if (!url) {
      return <div className="mt-2 h-32 animate-pulse rounded-lg bg-warm-card-border/40" />;
    }
    return (
      <img
        src={url}
        alt=""
        className="mt-3 max-h-64 w-full rounded-lg border border-warm-card-border object-cover"
      />
    );
  }

  if (fileId && url) {
    return (
      <a
        href={url}
        download
        className="mt-2 inline-block text-xs text-warm-cream underline"
      >
        View attachment
      </a>
    );
  }

  return (
    <a
      href={mediaUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 inline-block text-xs text-warm-cream underline"
    >
      View attachment
    </a>
  );
}
