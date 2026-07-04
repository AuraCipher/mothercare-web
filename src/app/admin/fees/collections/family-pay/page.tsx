'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Legacy route — redirects to the Families hub.
 * `/admin/fees/collections/family-pay?familyId=…` → family detail with pay modal.
 */
export default function FamilyPayRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const familyId = searchParams.get('familyId');
    if (familyId) {
      router.replace(`/admin/fees/families/${familyId}?pay=1`);
    } else {
      router.replace('/admin/fees/families');
    }
  }, [router, searchParams]);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <p className="text-xs text-warm-muted/50">Redirecting to Families…</p>
    </main>
  );
}
