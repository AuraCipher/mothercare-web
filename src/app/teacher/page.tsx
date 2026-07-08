'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { decodeJwtPayload } from '@/lib/teacher/auth-routing';

type Bootstrap = {
  user: { name: string };
  academicYear: { label: string; status: string };
  branch: { name: string };
  portal: { isReadOnly: boolean; assignmentCount: number };
  assignments: Array<{ group: { name: string; section: string | null }; subject: { name: string } }>;
};

export default function TeacherHomePage() {
  const router = useRouter();
  const [data, setData] = useState<Bootstrap | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/login?redirect=/teacher');
      return;
    }

    async function load() {
      let branchId = localStorage.getItem('activeBranchId');
      let academicYearId = localStorage.getItem('activeAYId');

      if (!branchId) {
        const payload = decodeJwtPayload(token!);
        branchId = payload?.branchIds?.[0] || null;
        if (branchId) localStorage.setItem('activeBranchId', branchId);
      }

      if (!academicYearId && branchId) {
        try {
          const ayRes = await api.meAcademicYear();
          if (ayRes.success && ayRes.data?.id) {
            academicYearId = ayRes.data.id;
            localStorage.setItem('activeAYId', ayRes.data.id);
            if (ayRes.data.status) localStorage.setItem('activeAYStatus', ayRes.data.status);
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
        if (res.success) setData(res.data);
        else setError(res.message || 'Failed to load teacher portal');
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load teacher portal');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router]);

  if (loading) {
    return (
      <div className="space-y-3 p-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-warm-card animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const ayBanner =
    data.academicYear.status === 'BUILD_STAGE'
      ? 'School is preparing the new academic year.'
      : data.academicYear.status === 'ARCHIVED'
        ? 'This academic year has ended. Read-only mode.'
        : data.academicYear.status === 'ON_HOLD'
          ? 'Academic year is paused. View only.'
          : null;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-light text-warm-cream">Teacher Portal</h1>
        <p className="mt-1 text-sm text-warm-muted">
          {data.branch.name} · {data.academicYear.label} · {data.user.name}
        </p>
      </div>

      {ayBanner && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
          {ayBanner}
        </div>
      )}

      <div className="rounded-xl border border-warm-card-border bg-warm-card p-4">
        <p className="text-xs text-warm-muted uppercase tracking-wide">My assignments</p>
        <p className="mt-1 text-2xl font-light text-warm-cream">{data.portal.assignmentCount}</p>
        {data.portal.isReadOnly && (
          <p className="mt-2 text-xs text-warm-muted">Portal is read-only for this academic year.</p>
        )}
      </div>

      {data.assignments.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {data.assignments.map((a) => (
            <div
              key={`${a.group.name}-${a.subject.name}`}
              className="rounded-xl border border-warm-card-border bg-warm-card p-4"
            >
              <p className="text-sm font-medium text-warm-cream">
                {a.group.name}
                {a.group.section ? ` — ${a.group.section}` : ''}
              </p>
              <p className="text-xs text-warm-muted mt-0.5">{a.subject.name}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-8 text-center text-sm text-warm-muted">
          No classes assigned yet. Contact school administration.
        </div>
      )}
    </div>
  );
}
