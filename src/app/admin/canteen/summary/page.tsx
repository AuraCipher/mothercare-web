'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, ChevronLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { formatCanteenMoney } from '@/lib/canteen';
import { showToast } from '@/components/toast';

export default function CanteenSummaryPage() {
  const router = useRouter();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [summary, setSummary] = useState<any>(null);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getCanteenSummary(date), api.getCanteenSales(date)])
      .then(([s, list]) => {
        setSummary(s.data);
        setSales(list.data || []);
      })
      .catch((e) => showToast('error', e.message))
      .finally(() => setLoading(false));
  }, [date]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <button type="button" onClick={() => router.push('/admin/canteen')} className="mb-4 flex items-center gap-1 text-xs text-warm-muted hover:text-warm-cream">
        <ChevronLeft size={14} /> Canteen
      </button>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-xl font-light text-warm-cream">
          <BarChart3 size={22} className="text-cyan-400" /> Daily Summary
        </h1>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-warm-card-border bg-warm-card px-3 py-2 text-xs text-warm-cream"
        />
      </div>

      {loading ? (
        <div className="h-32 animate-pulse rounded-xl bg-warm-card" />
      ) : summary && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total', value: summary.totalSales },
              { label: 'Cash', value: summary.cashTotal },
              { label: 'Credit', value: summary.creditTotal },
              { label: 'Transactions', value: summary.saleCount },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-warm-card-border bg-warm-card px-4 py-3">
                <p className="text-[10px] uppercase text-warm-muted/60">{s.label}</p>
                <p className="text-lg font-medium text-warm-cream">{s.value}</p>
              </div>
            ))}
          </div>

          <h2 className="text-sm font-medium text-warm-cream mb-2">Items sold</h2>
          <div className="overflow-x-auto rounded-xl border border-warm-card-border mb-6">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-warm-card-border bg-warm-card/80 text-left text-warm-muted">
                  <th className="p-3">Product</th>
                  <th className="p-3">Qty</th>
                  <th className="p-3">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {(summary.itemsSoldBreakdown || []).map((row: any, i: number) => (
                  <tr key={i} className="border-b border-warm-card-border/50">
                    <td className="p-3 text-warm-cream">{row.productName}</td>
                    <td className="p-3">{row.qtySold}</td>
                    <td className="p-3">{formatCanteenMoney(row.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="text-sm font-medium text-warm-cream mb-2">Sales log</h2>
          <ul className="space-y-2">
            {sales.map((s) => (
              <li key={s.id} className="rounded-lg border border-warm-card-border bg-warm-card/50 px-4 py-2 text-xs flex justify-between">
                <span className="text-warm-cream">
                  {new Date(s.soldAt).toLocaleTimeString()} · {s.paymentType}
                  {s.account ? ` · ${s.account.displayName}` : ''}
                </span>
                <span>{formatCanteenMoney(s.totalAmount)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
