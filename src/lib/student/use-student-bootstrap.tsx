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
import type { StudentBootstrapData } from './types';

interface StudentBootstrapState {
  data: StudentBootstrapData | null;
  loading: boolean;
  error: string;
  reload: () => Promise<void>;
}

const StudentBootstrapContext = createContext<StudentBootstrapState | null>(null);

export function StudentBootstrapProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [data, setData] = useState<StudentBootstrapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/login?redirect=/student');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.studentBootstrap();
      if (res.success && res.data) {
        const payload = res.data as StudentBootstrapData;
        localStorage.setItem('activeBranchId', payload.branch.id);
        localStorage.setItem('activeAYId', payload.academicYear.id);
        localStorage.setItem('activeAYStatus', payload.academicYear.status);
        setData(payload);
      } else {
        setError(res.message || 'Failed to load student portal');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load student portal');
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
    <StudentBootstrapContext.Provider value={value}>{children}</StudentBootstrapContext.Provider>
  );
}

export function useStudentBootstrap() {
  const ctx = useContext(StudentBootstrapContext);
  if (!ctx) {
    throw new Error('useStudentBootstrap must be used within StudentBootstrapProvider');
  }
  return ctx;
}
