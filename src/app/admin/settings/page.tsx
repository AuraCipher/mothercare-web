'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/settings/academic-years');
  }, [router]);

  return (
    <div className="flex items-center justify-center py-20">
      <p className="text-sm text-warm-muted">Redirecting…</p>
    </div>
  );
}
