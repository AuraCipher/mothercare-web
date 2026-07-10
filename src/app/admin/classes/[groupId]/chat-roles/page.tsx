'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { ClassStudentPermissionsPanel } from '@/components/chat/class-student-permissions-panel';
import { api } from '@/lib/api';

export default function AdminClassChatRolesPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = typeof params.groupId === 'string' ? params.groupId : '';
  const [communityId, setCommunityId] = useState('');
  const [groupLabel, setGroupLabel] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isReadOnly = typeof window !== 'undefined' && localStorage.getItem('activeAYStatus') === 'ARCHIVED';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    if (!groupId) return;

    const branchId = localStorage.getItem('activeBranchId') || '';
    const academicYearId = localStorage.getItem('activeAYId') || '';

    setLoading(true);
    setError('');
    Promise.all([
      api.adminClassCommunityByGroup(groupId),
      api.getStudents({ groupId, branchId, academicYearId, limit: 500 }),
    ])
      .then(([communityRes, studentsRes]) => {
        if (!communityRes.success) {
          setError(communityRes.message || 'Unable to load class community');
          return;
        }
        setCommunityId(communityRes.data.id);
        setGroupLabel(communityRes.data.groupLabel);
        if (studentsRes.success) {
          setStudents(
            (studentsRes.data || []).map((s: any) => ({
              id: s.id,
              name: s.name,
              rollNumber: s.rollNumber,
            })),
          );
        }
      })
      .catch(() => setError('Unable to load chat roles'))
      .finally(() => setLoading(false));
  }, [groupId, router]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link
        href="/admin/classes"
        className="mb-4 inline-flex items-center gap-1 text-xs text-warm-muted hover:text-warm-cream"
      >
        <ArrowLeft size={12} /> Back to classes
      </Link>

      <div className="mb-6">
        <h1 className="text-lg font-light text-warm-cream">Chat roles</h1>
        <p className="text-sm text-warm-muted">
          {groupLabel || 'Class student permissions'} — admin override
        </p>
      </div>

      {loading ? (
        <div className="h-40 animate-pulse rounded-xl border border-warm-card-border bg-warm-card" />
      ) : error ? (
        <p className="rounded-lg border border-warm-card-border bg-warm-card px-4 py-3 text-xs text-[#b39a76]">
          {error}
        </p>
      ) : (
        <ClassStudentPermissionsPanel
          actor="admin"
          communityId={communityId}
          students={students}
          readOnly={isReadOnly}
        />
      )}
    </main>
  );
}
