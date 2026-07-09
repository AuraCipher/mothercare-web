'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { decodeJwtPayload } from '@/lib/teacher/auth-routing';
import { StudentBootstrapProvider } from '@/lib/student/use-student-bootstrap';
import { StudentPortalShell } from '@/components/student/student-portal-shell';
import '../teacher/teacher-portal.css';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname || '/student')}`);
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
    if (payload.role === 'teacher') {
      router.replace('/teacher');
      return;
    }
    if (payload.role !== 'student') {
      router.replace('/admin');
      return;
    }

    setAuthReady(true);
  }, [router, pathname]);

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1a1614]">
        <p className="text-sm text-warm-muted">Loading…</p>
      </div>
    );
  }

  return (
    <StudentBootstrapProvider>
      <StudentPortalShell>{children}</StudentPortalShell>
    </StudentBootstrapProvider>
  );
}
