'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ComputeRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/result/report-cards');
  }, [router]);
  return null;
}
