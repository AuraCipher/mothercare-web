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

    if (!academicYearId) {
      try {
        const ayRes = await api.meAcademicYear();
        if (ayRes.success && ayRes.data?.id) {
          academicYearId = ayRes.data.id;
          localStorage.setItem('activeAYId', ayRes.data.id);
          if (ayRes.data.status) localStorage.setItem('activeAYStatus', ayRes.data.status);
          if (ayRes.data.branchId && !branchId) {
            branchId = ayRes.data.branchId;
            localStorage.setItem('activeBranchId', ayRes.data.branchId);
          }
          // #region agent log
          fetch('http://127.0.0.1:7275/ingest/ce52f613-123c-4e37-baf2-26dca66dcf5d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'062214'},body:JSON.stringify({sessionId:'062214',runId:'post-fix',hypothesisId:'H5',location:'use-teacher-bootstrap.tsx:load',message:'teacher scope via meAcademicYear',data:{ok:true,academicYearId:ayRes.data.id,branchId:ayRes.data.branchId},timestamp:Date.now()})}).catch(()=>{});
          // #endregion
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
