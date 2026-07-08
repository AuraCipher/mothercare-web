'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { decodeJwtPayload } from '@/lib/teacher/auth-routing';
import type { TeacherBootstrapData } from './types';

interface TeacherBootstrapState {
  data: TeacherBootstrapData | null;
  loading: boolean;
  error: string;
  reload: () => Promise<void>;
}

const TeacherBootstrapContext = createContext<TeacherBootstrapState | null>(null);

export function TeacherBootstrapProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [data, setData] = useState<TeacherBootstrapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/login?redirect=/teacher');
      return;
    }

    setLoading(true);
    setError('');

    let branchId = localStorage.getItem('activeBranchId');
    let academicYearId = localStorage.getItem('activeAYId');

    if (!branchId) {
      const payload = decodeJwtPayload(token);
      branchId = payload?.branchIds?.[0] || null;
      if (branchId) localStorage.setItem('activeBranchId', branchId);
    }

    if (!academicYearId && branchId) {
      try {
        const ayRes = await api.getAcademicYears(branchId);
        if (ayRes.success && ayRes.data?.length) {
          const active = ayRes.data.find((ay: { status: string }) => ay.status === 'ACTIVE');
          if (active?.id) {
            academicYearId = active.id;
            localStorage.setItem('activeAYId', active.id);
            if (active.status) localStorage.setItem('activeAYStatus', active.status);
          }
        }
      } catch {
        /* handled below */
      }
    }

    if (!branchId || !academicYearId) {
      setError('No active branch or academic year. Contact school administration.');
      setLoading(false);
      return;
    }

    try {
      const res = await api.teacherBootstrap();
      if (res.success) setData(res.data as TeacherBootstrapData);
      else setError(res.message || 'Failed to load teacher portal');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load teacher portal');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const value = useMemo(
    () => ({ data, loading, error, reload: load }),
    [data, loading, error, load],
  );

  return (
    <TeacherBootstrapContext.Provider value={value}>{children}</TeacherBootstrapContext.Provider>
  );
}

export function useTeacherBootstrap() {
  const ctx = useContext(TeacherBootstrapContext);
  if (!ctx) {
    throw new Error('useTeacherBootstrap must be used within TeacherBootstrapProvider');
  }
  return ctx;
}
