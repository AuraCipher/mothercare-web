'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { decodeJwtPayload } from '@/lib/teacher/auth-routing';

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname || '/teacher')}`);
      return;
    }

    const payload = decodeJwtPayload(token);
    if (!payload) {
      localStorage.removeItem('token');
      document.cookie = 'token=; path=/; max-age=0';
      router.replace('/login');
      return;
    }

    if (payload.role === 'super_admin') {
      router.replace('/ceo');
      return;
    }
    if (payload.role !== 'teacher') {
      router.replace('/admin');
    }
  }, [router, pathname]);

  return (
    <div className="min-h-screen bg-[#1a1614]">
      <header className="border-b border-warm-card-border bg-warm-card/80 px-6 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <span className="text-sm font-medium text-warm-cream">MCS Teacher Portal</span>
          <button
            type="button"
            className="text-xs text-warm-muted hover:text-warm-cream"
            onClick={() => {
              localStorage.removeItem('token');
              document.cookie = 'token=; path=/; max-age=0';
              router.replace('/login');
            }}
          >
            Log out
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl">{children}</main>
    </div>
  );
}
