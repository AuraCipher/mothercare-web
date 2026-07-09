'use client';

import { useCallback, useEffect, useState } from 'react';
import { StudentPageShell } from '@/components/student/student-page-shell';
import { api } from '@/lib/api';

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatMoney(paise: number) {
  return `Rs ${(paise / 100).toLocaleString(undefined, { minimumFractionDigits: 0 })}`;
}

function statusColor(status: string) {
  if (status === 'PAID') return 'text-emerald-300';
  if (status === 'PARTIAL') return 'text-amber-300';
  if (status === 'OVERPAID') return 'text-sky-300';
  return 'text-red-300';
}

export default function StudentFeesPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.studentFees();
      if (res.success) setData(res.data);
      else setError(res.message || 'Failed to load fees');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load fees');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <StudentPageShell
      title="Fees"
      subtitle="Your fee ledger and receipts (read-only)"
    >
      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-warm-card" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {data?.summary && (
        <div className="teacher-stat-grid mb-6">
          <div className="teacher-card rounded-xl border border-warm-card-border bg-warm-card p-4">
            <p className="text-xs text-warm-muted">Balance due</p>
            <p className="mt-1 text-lg text-warm-cream">
              {formatMoney(data.summary.balanceDuePaise)}
            </p>
          </div>
          <div className="teacher-card rounded-xl border border-warm-card-border bg-warm-card p-4">
            <p className="text-xs text-warm-muted">Total paid</p>
            <p className="mt-1 text-lg text-warm-cream">
              {formatMoney(data.summary.totalPaidPaise)}
            </p>
          </div>
          <div className="teacher-card rounded-xl border border-warm-card-border bg-warm-card p-4">
            <p className="text-xs text-warm-muted">Unpaid months</p>
            <p className="mt-1 text-lg text-warm-cream">{data.summary.unpaidCount}</p>
          </div>
        </div>
      )}

      {!loading && !error && data?.months?.length === 0 && (
        <div className="teacher-card rounded-xl border border-warm-card-border bg-warm-card p-8 text-center text-sm text-warm-muted">
          No fee records for this academic year.
        </div>
      )}

      <div className="space-y-4">
        {(data?.months || []).map((month: any) => (
          <div
            key={month.id}
            className="teacher-card rounded-xl border border-warm-card-border bg-warm-card p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-medium text-warm-cream">
                  {MONTH_NAMES[month.month]} {month.year}
                </h3>
                <p className={`mt-0.5 text-xs ${statusColor(month.status)}`}>{month.status}</p>
              </div>
              <div className="text-right text-xs text-warm-muted">
                <p>Paid: {formatMoney(month.paidAmount)}</p>
                {month.dueAmount > 0 && <p className="text-red-300">Due: {formatMoney(month.dueAmount)}</p>}
              </div>
            </div>

            {month.extraItems?.length > 0 && (
              <ul className="mt-3 space-y-1 border-t border-warm-card-border pt-3 text-xs text-warm-muted">
                {month.extraItems.map((item: any) => (
                  <li key={item.id} className="flex justify-between">
                    <span>{item.name}</span>
                    <span>{formatMoney(item.amount)}</span>
                  </li>
                ))}
              </ul>
            )}

            {month.payments?.length > 0 && (
              <div className="mt-3 border-t border-warm-card-border pt-3">
                <p className="mb-2 text-[11px] uppercase tracking-wide text-warm-muted">Receipts</p>
                <ul className="space-y-1 text-xs">
                  {month.payments.map((p: any) => (
                    <li key={p.id} className="flex justify-between text-warm-muted">
                      <span>
                        {new Date(p.createdAt).toLocaleDateString()}
                        {p.receiptNumber ? ` · #${p.receiptNumber}` : ''}
                      </span>
                      <span className="text-emerald-300">{formatMoney(p.amount)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </StudentPageShell>
  );
}
