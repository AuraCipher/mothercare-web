'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { TeacherPageLoading, TeacherPageShell } from '@/components/teacher/teacher-page-shell';

type PayrollRow = {
  salaryMonth?: string;
  outgoingPayment?: {
    amount?: number;
    paidAt?: string;
    paymentMethod?: string;
    voucherNumber?: string;
  };
};

function formatAmount(paise?: number) {
  if (paise == null) return '—';
  return `Rs ${Math.round(paise / 100).toLocaleString()}`;
}

export default function TeacherMyPayrollPage() {
  const [rows, setRows] = useState<PayrollRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.teacherMyPayroll();
        if (!res.success) throw new Error('Failed to load payroll');
        setRows((res.data as PayrollRow[]) || []);
      } catch (e: any) {
        setError(e.message || 'Failed to load payroll');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <TeacherPageShell title="My Payroll" subtitle="Salary payments received">
        <TeacherPageLoading />
      </TeacherPageShell>
    );
  }

  return (
    <TeacherPageShell title="My Payroll" subtitle="Salary payments received">
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}
      {rows.length === 0 ? (
        <p className="text-sm text-warm-muted">No payroll records yet.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((row, index) => {
            const payment = row.outgoingPayment ?? {};
            return (
              <div
                key={`${row.salaryMonth ?? 'row'}-${index}`}
                className="rounded-lg border border-warm-card-border bg-warm-card px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-warm-cream">{row.salaryMonth || 'Salary'}</p>
                  <p className="text-sm font-semibold text-warm-accent">{formatAmount(payment.amount)}</p>
                </div>
                <p className="mt-1 text-xs text-warm-muted">
                  {[
                    payment.paidAt
                      ? new Date(payment.paidAt).toLocaleDateString(undefined, {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : null,
                    payment.paymentMethod?.replaceAll('_', ' '),
                    payment.voucherNumber ? `Voucher ${payment.voucherNumber}` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </TeacherPageShell>
  );
}
