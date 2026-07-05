'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { formatCanteenMoney } from '@/lib/canteen';
import { showToast } from '@/components/toast';

export default function CanteenAccountDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [account, setAccount] = useState<any>(null);
  const [sales, setSales] = useState<any[]>([]);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([api.getCanteenAccount(id), api.getCanteenAccountSales(id)])
      .then(([a, s]) => {
        setAccount(a.data);
        setSales(s.data || []);
      })
      .catch((e) => showToast('error', e.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const settle = async () => {
    const paid = Number(amount);
    if (!paid || paid <= 0) {
      showToast('error', 'Enter a valid amount');
      return;
    }
    try {
      await api.postCanteenAccountPayment(id, { amountPaid: paid });
      setAmount('');
      load();
      showToast('success', 'Payment recorded');
    } catch (e: unknown) {
      showToast('error', e instanceof Error ? e.message : 'Failed');
    }
  };

  if (loading) {
    return <main className="mx-auto max-w-4xl px-6 py-10"><div className="h-32 animate-pulse rounded-xl bg-warm-card" /></main>;
  }

  if (!account) {
    return <main className="mx-auto max-w-4xl px-6 py-10"><p className="text-sm text-warm-muted">Account not found</p></main>;
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <button type="button" onClick={() => router.push('/admin/canteen/accounts')} className="mb-4 flex items-center gap-1 text-xs text-warm-muted hover:text-warm-cream">
        <ChevronLeft size={14} /> Accounts
      </button>

      <div className="rounded-xl border border-warm-card-border bg-warm-card p-5 mb-6">
        <h1 className="text-lg font-light text-warm-cream">{account.displayName}</h1>
        <p className="text-xs text-warm-muted mt-1">{account.personType} · {account.displayPhone || '—'}</p>
        <p className="text-2xl font-medium text-amber-400 mt-3">{formatCanteenMoney(account.runningBalance)}</p>

        <div className="mt-4 flex flex-wrap gap-2 items-end">
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Payment amount"
            type="number"
            className="rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream w-32"
          />
          <button type="button" onClick={settle} className="rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614]">
            Record payment
          </button>
        </div>
      </div>

      <h2 className="text-sm font-medium text-warm-cream mb-3">Purchase history</h2>
      <ul className="space-y-2">
        {sales.map((s) => (
          <li key={s.id} className="rounded-lg border border-warm-card-border bg-warm-card/50 px-4 py-3 text-xs">
            <div className="flex justify-between text-warm-cream">
              <span>{new Date(s.soldAt).toLocaleString()}</span>
              <span>{formatCanteenMoney(s.totalAmount)}</span>
            </div>
            <p className="text-warm-muted mt-1">
              {(s.items || []).map((i: any) => `${i.product?.name} ×${i.quantity}`).join(', ')}
            </p>
          </li>
        ))}
        {sales.length === 0 && <li className="text-warm-muted text-xs">No sales yet</li>}
      </ul>
    </main>
  );
}
