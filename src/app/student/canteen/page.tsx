'use client';

import { useCallback, useEffect, useState } from 'react';
import { StudentPageShell } from '@/components/student/student-page-shell';
import { api } from '@/lib/api';
import { useStudentBootstrap } from '@/lib/student/use-student-bootstrap';
import { useRouter } from 'next/navigation';

function formatMoney(amount: number) {
  return `Rs ${amount.toLocaleString(undefined, { minimumFractionDigits: 0 })}`;
}

export default function StudentCanteenPage() {
  const router = useRouter();
  const { data: bootstrap } = useStudentBootstrap();
  const [account, setAccount] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (bootstrap && !bootstrap.features.showCanteen) {
      router.replace('/student');
    }
  }, [bootstrap, router]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.studentCanteen();
      if (res.success) setAccount(res.data);
      else setError(res.message || 'Failed to load canteen account');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load canteen account');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!bootstrap?.features.showCanteen) return null;

  return (
    <StudentPageShell
      title="Canteen"
      subtitle="Account balance and history (read-only — no top-up)"
    >
      {loading && (
        <div className="h-24 animate-pulse rounded-xl bg-warm-card" />
      )}

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {account && (
        <>
          <div className="teacher-card mb-6 rounded-xl border border-warm-card-border bg-warm-card p-4">
            <p className="text-xs text-warm-muted">Running balance</p>
            <p className="mt-1 text-2xl text-warm-cream">{formatMoney(account.runningBalance)}</p>
            <p className="mt-2 text-xs text-warm-muted">
              Contact school canteen staff for top-ups. Online payment is not available here.
            </p>
          </div>

          {account.sales?.length > 0 && (
            <section className="mb-6">
              <h2 className="mb-2 text-sm font-medium text-warm-cream">Recent purchases</h2>
              <ul className="teacher-card divide-y divide-warm-card-border rounded-xl border border-warm-card-border bg-warm-card">
                {account.sales.map((sale: any) => (
                  <li key={sale.id} className="flex justify-between px-4 py-3 text-sm">
                    <span className="text-warm-muted">
                      {new Date(sale.soldAt).toLocaleDateString()} · {sale.paymentType}
                    </span>
                    <span className="text-warm-cream">{formatMoney(sale.totalAmount)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {account.payments?.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-medium text-warm-cream">Recent payments</h2>
              <ul className="teacher-card divide-y divide-warm-card-border rounded-xl border border-warm-card-border bg-warm-card">
                {account.payments.map((p: any) => (
                  <li key={p.id} className="flex justify-between px-4 py-3 text-sm">
                    <span className="text-warm-muted">
                      {new Date(p.paidAt).toLocaleDateString()}
                      {p.note ? ` · ${p.note}` : ''}
                    </span>
                    <span className="text-emerald-300">{formatMoney(p.amountPaid)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </StudentPageShell>
  );
}
