'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, ShoppingCart, Wallet, User } from 'lucide-react';
import { api } from '@/lib/api';
import { formatCanteenDateTime, formatCanteenMoney } from '@/lib/canteen';
import { showToast } from '@/components/toast';

const fieldClass =
  'w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent';

type AccountDetail = {
  account: {
    id: string;
    displayName: string;
    displayPhone?: string | null;
    personType: string;
    runningBalance: number | string;
    student?: { rollNumber?: string | null } | null;
  };
  stats: {
    totalOrdered: number;
    totalPaid: number;
    remaining: number;
    orderCount: number;
    paymentCount: number;
  };
  sales: Array<{
    id: string;
    soldAt: string;
    totalAmount: number | string;
    items?: Array<{ quantity: number; product?: { name: string } }>;
    createdBy?: { name: string } | null;
  }>;
  payments: Array<{
    id: string;
    paidAt: string;
    amountPaid: number | string;
    note?: string | null;
    createdBy?: { name: string } | null;
  }>;
};

export default function CanteenAccountDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [detail, setDetail] = useState<AccountDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('');
  const [paying, setPaying] = useState(false);
  const [activePanel, setActivePanel] = useState<'orders' | 'payments' | 'pay'>('orders');

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    api.getCanteenAccountDetail(id)
      .then((r) => setDetail(r.data))
      .catch((e) => showToast('error', e.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const recordPayment = async (amount?: number) => {
    const paid = amount ?? Number(payAmount);
    if (!paid || paid <= 0) {
      showToast('error', 'Enter a valid amount');
      return;
    }
    setPaying(true);
    try {
      await api.postCanteenAccountPayment(id, {
        amountPaid: paid,
        note: payNote.trim() || undefined,
      });
      setPayAmount('');
      setPayNote('');
      showToast('success', 'Payment recorded');
      load();
      setActivePanel('payments');
    } catch (e: unknown) {
      showToast('error', e instanceof Error ? e.message : 'Failed');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="h-48 animate-pulse rounded-xl bg-warm-card" />
      </main>
    );
  }

  if (!detail) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <p className="text-sm text-warm-muted">Account not found</p>
      </main>
    );
  }

  const { account, stats, sales, payments } = detail;
  const remaining = stats.remaining;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <button
        type="button"
        onClick={() => router.push('/admin/canteen/accounts')}
        className="mb-4 flex items-center gap-1 text-xs text-warm-muted hover:text-warm-cream"
      >
        <ChevronLeft size={14} /> Credit accounts
      </button>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-xl border border-warm-card-border bg-warm-card p-3">
            <User size={22} className="text-pink-400" />
          </div>
          <div>
            <h1 className="text-xl font-light text-warm-cream">{account.displayName}</h1>
            <p className="mt-1 text-xs text-warm-muted">
              {account.personType}
              {account.student?.rollNumber ? ` · Roll ${account.student.rollNumber}` : ''}
              {account.displayPhone ? ` · ${account.displayPhone}` : ''}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => router.push(`/admin/canteen/sales?accountId=${id}`)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614]"
          >
            <ShoppingCart size={14} /> New order
          </button>
          <button
            type="button"
            onClick={() => setActivePanel('pay')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-cream hover:border-warm-accent/50"
          >
            <Wallet size={14} /> Record payment
          </button>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total credit orders', value: formatCanteenMoney(stats.totalOrdered), sub: `${stats.orderCount} orders` },
          { label: 'Total paid', value: formatCanteenMoney(stats.totalPaid), sub: `${stats.paymentCount} payments` },
          { label: 'Remaining (bakaya)', value: formatCanteenMoney(remaining), warn: remaining > 0 },
          {
            label: 'Balance check',
            value: formatCanteenMoney(stats.totalOrdered - stats.totalPaid),
            sub: 'ordered − paid',
          },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-warm-card-border bg-warm-card px-4 py-3">
            <p className="text-[10px] uppercase tracking-wide text-warm-muted/60">{s.label}</p>
            <p className={`mt-1 text-lg font-medium ${s.warn ? 'text-amber-400' : 'text-warm-cream'}`}>{s.value}</p>
            {s.sub && <p className="text-[10px] text-warm-muted/50 mt-0.5">{s.sub}</p>}
          </div>
        ))}
      </div>

      <div className="mb-4 flex gap-2 border-b border-warm-card-border">
        {([
          ['orders', `Orders (${stats.orderCount})`],
          ['payments', `Payments (${stats.paymentCount})`],
          ['pay', 'Pay'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActivePanel(key)}
            className={`px-4 py-2 text-xs border-b-2 -mb-px transition-colors ${
              activePanel === key
                ? 'border-warm-accent text-warm-cream'
                : 'border-transparent text-warm-muted hover:text-warm-cream'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {activePanel === 'orders' && (
        <section className="rounded-xl border border-warm-card-border overflow-hidden">
          {sales.length === 0 ? (
            <p className="p-6 text-sm text-warm-muted">No credit orders yet.</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-warm-card-border bg-warm-card/80 text-left text-warm-muted">
                  <th className="p-3">Date</th>
                  <th className="p-3">Items</th>
                  <th className="p-3">Recorded by</th>
                  <th className="p-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s) => (
                  <tr key={s.id} className="border-b border-warm-card-border/50">
                    <td className="p-3 text-warm-cream whitespace-nowrap">{formatCanteenDateTime(s.soldAt)}</td>
                    <td className="p-3 text-warm-muted">
                      {(s.items || []).map((i) => `${i.product?.name ?? 'Item'} ×${i.quantity}`).join(', ')}
                    </td>
                    <td className="p-3 text-warm-muted">{s.createdBy?.name || '—'}</td>
                    <td className="p-3 text-right font-medium text-amber-400">{formatCanteenMoney(s.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {activePanel === 'payments' && (
        <section className="rounded-xl border border-warm-card-border overflow-hidden">
          {payments.length === 0 ? (
            <p className="p-6 text-sm text-warm-muted">No payments recorded yet.</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-warm-card-border bg-warm-card/80 text-left text-warm-muted">
                  <th className="p-3">Date</th>
                  <th className="p-3">Note</th>
                  <th className="p-3">Recorded by</th>
                  <th className="p-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-warm-card-border/50">
                    <td className="p-3 text-warm-cream whitespace-nowrap">{formatCanteenDateTime(p.paidAt)}</td>
                    <td className="p-3 text-warm-muted">{p.note || '—'}</td>
                    <td className="p-3 text-warm-muted">{p.createdBy?.name || '—'}</td>
                    <td className="p-3 text-right font-medium text-green-400">{formatCanteenMoney(p.amountPaid)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {activePanel === 'pay' && (
        <section className="rounded-xl border border-warm-card-border bg-warm-card p-5 max-w-md">
          <h2 className="text-sm font-medium text-warm-cream mb-1">Record payment</h2>
          <p className="text-xs text-warm-muted mb-4">
            Remaining balance: <span className="text-amber-400 font-medium">{formatCanteenMoney(remaining)}</span>
          </p>
          <div className="space-y-3">
            <input
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              placeholder="Amount (PKR)"
              type="number"
              min="0"
              step="0.01"
              className={fieldClass}
            />
            <input
              value={payNote}
              onChange={(e) => setPayNote(e.target.value)}
              placeholder="Note (optional)"
              className={fieldClass}
            />
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                disabled={paying}
                onClick={() => recordPayment()}
                className="flex-1 rounded-lg bg-warm-accent py-2.5 text-xs font-medium text-[#1a1614] disabled:opacity-50"
              >
                {paying ? 'Saving…' : 'Save payment'}
              </button>
              {remaining > 0 && (
                <button
                  type="button"
                  disabled={paying}
                  onClick={() => recordPayment(remaining)}
                  className="rounded-lg border border-warm-accent/50 px-4 py-2.5 text-xs text-warm-accent disabled:opacity-50"
                >
                  Pay full {formatCanteenMoney(remaining)}
                </button>
              )}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
