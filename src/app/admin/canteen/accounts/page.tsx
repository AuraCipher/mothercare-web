'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { formatCanteenMoney, type CanteenAccount } from '@/lib/canteen';
import { showToast } from '@/components/toast';

export default function CanteenAccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<CanteenAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.getCanteenAccounts()
      .then((r) => setAccounts(r.data || []))
      .catch((e) => showToast('error', e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <button type="button" onClick={() => router.push('/admin/canteen')} className="mb-4 flex items-center gap-1 text-xs text-warm-muted hover:text-warm-cream">
        <ChevronLeft size={14} /> Canteen
      </button>

      <h1 className="mb-6 flex items-center gap-2 text-xl font-light text-warm-cream">
        <Users size={22} className="text-pink-400" /> Credit Accounts (Bakaya)
      </h1>

      <p className="mb-4 text-xs text-warm-muted">Linked branch students, teachers & staff only. Created on first credit sale or manually by admin.</p>

      {loading ? (
        <div className="h-32 animate-pulse rounded-xl bg-warm-card" />
      ) : accounts.length === 0 ? (
        <p className="text-sm text-warm-muted">No credit accounts yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-warm-card-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-warm-card-border bg-warm-card/80 text-left text-warm-muted">
                <th className="p-3">Name</th>
                <th className="p-3">Type</th>
                <th className="p-3">Balance</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.id} className="border-b border-warm-card-border/50">
                  <td className="p-3 text-warm-cream">{a.displayName}</td>
                  <td className="p-3 text-warm-muted">{a.personType}</td>
                  <td className="p-3 font-medium text-amber-400">{formatCanteenMoney(a.runningBalance)}</td>
                  <td className="p-3 text-right">
                    <button type="button" onClick={() => router.push(`/admin/canteen/accounts/${a.id}`)} className="text-warm-accent hover:underline">
                      View details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
