'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DocsAuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/login?redirect=/docs');
      return;
    }
    const hasCookie = document.cookie.split(';').some((c) => c.trim().startsWith('token='));
    if (!hasCookie) {
      document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1a1614]">
        <p className="text-sm text-warm-muted">Loading documentation…</p>
      </div>
    );
  }

  return children;
}
