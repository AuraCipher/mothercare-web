'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  UtensilsCrossed, ShoppingCart, Tag, Boxes, Truck, Users, BarChart3, ChevronLeft,
} from 'lucide-react';
import { api } from '@/lib/api';
import { resolveCanteenAccess, type CanteenAccessLevel } from '@/lib/canteen';

function decodeJwt(token: string) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

export default function CanteenHubPage() {
  const router = useRouter();
  const [access, setAccess] = useState<CanteenAccessLevel | null>(null);
  const [summary, setSummary] = useState<any>(null);

  const branchId = typeof window !== 'undefined' ? localStorage.getItem('activeBranchId') : null;

  useEffect(() => {
    if (!branchId) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    const payload = decodeJwt(token);

    api.meBranches().then((res) => {
      const member = (res.data || []).find((m: any) => m.branch.id === branchId);
      const level = resolveCanteenAccess(payload?.role, member?.role);
      setAccess(level);
      if (level === 'sales') {
        router.replace('/admin/canteen/sales');
      }
    }).catch(() => {});

    api.getCanteenSummary().then((r) => {
      if (r.success) setSummary(r.data);
    }).catch(() => {});
  }, [branchId, router]);

  const adminCards = [
    { icon: ShoppingCart, label: 'Daily Sales', desc: 'Record cash & credit sales', href: '/admin/canteen/sales', color: 'text-green-400' },
    { icon: BarChart3, label: 'Daily Summary', desc: "Today's sales breakdown", href: '/admin/canteen/summary', color: 'text-cyan-400' },
    { icon: Users, label: 'Credit Accounts', desc: 'Bakaya balances & settlement', href: '/admin/canteen/accounts', color: 'text-pink-400' },
    { icon: Tag, label: 'Products', desc: 'Catalog, categories & pricing', href: '/admin/canteen/products', color: 'text-violet-400' },
    { icon: Boxes, label: 'Inventory', desc: 'Stock levels & low-stock alerts', href: '/admin/canteen/inventory', color: 'text-blue-400' },
    { icon: Truck, label: 'Suppliers', desc: 'Restock & supplier payments', href: '/admin/canteen/suppliers', color: 'text-yellow-400' },
  ];

  if (!branchId) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <p className="text-sm text-warm-muted">Select a branch from the sidebar to open canteen.</p>
      </main>
    );
  }

  if (access === 'sales') {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <p className="text-sm text-warm-muted">Redirecting to sales…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <button
        type="button"
        onClick={() => router.push('/admin')}
        className="mb-4 flex items-center gap-1 text-xs text-warm-muted hover:text-warm-cream"
      >
        <ChevronLeft size={14} /> Admin
      </button>

      <div className="mb-8 flex items-center gap-3">
        <UtensilsCrossed size={24} className="text-warm-accent" />
        <div>
          <h1 className="text-xl font-light text-warm-cream">Canteen</h1>
          <p className="text-xs text-warm-muted">Branch ledger — no fee system link</p>
        </div>
      </div>

      {summary && (
        <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Today total', value: summary.totalSales },
            { label: 'Cash', value: summary.cashTotal },
            { label: 'Credit', value: summary.creditTotal },
            { label: 'Sales', value: summary.saleCount },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-warm-card-border bg-warm-card px-4 py-3">
              <p className="text-[10px] uppercase text-warm-muted/60">{s.label}</p>
              <p className="text-lg font-medium text-warm-cream">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {adminCards.map((c) => {
          const Icon = c.icon;
          return (
            <button
              key={c.href}
              type="button"
              onClick={() => router.push(c.href)}
              className="text-left rounded-xl border border-warm-card-border bg-warm-card p-4 hover:border-warm-accent/50 transition-colors"
            >
              <Icon size={20} className={`${c.color} mb-2`} />
              <p className="text-sm font-medium text-warm-cream">{c.label}</p>
              <p className="text-[11px] text-warm-muted/60">{c.desc}</p>
            </button>
          );
        })}
      </div>
    </main>
  );
}
