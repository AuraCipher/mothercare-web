'use client';

import { useEffect, useState } from 'react';
import config from '@/config';

/** Fetch a protected upload with Bearer auth and expose a blob URL for <img> / Lightbox. */
export function useAuthenticatedFileUrl(fileId: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!fileId) {
      setUrl(null);
      setError(false);
      return;
    }

    let revoked: string | null = null;
    let cancelled = false;
    setError(false);

    const token = localStorage.getItem('token');
    if (!token) {
      setUrl(null);
      setError(true);
      return;
    }

    fetch(`${config.apiUrl}/api/uploads/${fileId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load file');
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        const objectUrl = URL.createObjectURL(blob);
        revoked = objectUrl;
        setUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) {
          setUrl(null);
          setError(true);
        }
      });

    return () => {
      cancelled = true;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [fileId]);

  return { url, error };
}
