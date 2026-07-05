'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { resolveCanteenAccess, type CanteenAccessLevel } from '@/lib/canteen';

function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(atob(parts[1]));
  } catch {
    return null;
  }
}

const STAFF_BLOCKED = [
  '/admin/canteen/products',
  '/admin/canteen/inventory',
  '/admin/canteen/suppliers',
];

export default function CanteenLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [access, setAccess] = useState<CanteenAccessLevel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const branchId = localStorage.getItem('activeBranchId');
    if (!token || !branchId) {
      router.push('/admin');
      return;
    }

    const payload = decodeJwtPayload(token);
    if (!payload) {
      router.push('/login');
      return;
    }

    if (payload.role === 'super_admin') {
      router.replace('/ceo');
      return;
    }

    (async () => {
      try {
        const permRes = await api.mePermissions(branchId);
        if (permRes.data?.isRestricted) {
          const canteen = permRes.data.permissions.find((p) => p.module === 'CANTEEN');
          if (!canteen?.canRead) {
            router.replace('/admin');
            return;
          }
          const level: CanteenAccessLevel =
            canteen.canUpdate || canteen.canDelete ? 'admin' : 'sales';
          setAccess(level);
          if (level === 'sales' && STAFF_BLOCKED.some((p) => pathname.startsWith(p))) {
            router.replace('/admin/canteen/sales');
          }
          return;
        }

        const res = await api.meBranches();
        const members = res.data || [];
        const member = members.find((m: { branch: { id: string } }) => m.branch.id === branchId);
        const level = resolveCanteenAccess(payload.role, member?.role);
        if (!level) {
          router.replace('/admin');
          return;
        }
        setAccess(level);

        if (level === 'sales' && STAFF_BLOCKED.some((p) => pathname.startsWith(p))) {
          router.replace('/admin/canteen/sales');
        }
      } catch {
        router.replace('/admin');
      } finally {
        setLoading(false);
      }
    })();
  }, [pathname, router]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-warm-muted">Loading canteen…</p>
      </div>
    );
  }

  if (!access) return null;

  return (
    <div data-canteen-access={access}>
      {children}
    </div>
  );
}
