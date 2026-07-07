'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Wallet, Users, Zap, Receipt, FileText, ScrollText } from 'lucide-react';
import { api } from '@/lib/api';

const cards = [
  { href: '/admin/expenses/payroll', icon: Users, title: 'Pays', desc: 'Teacher & staff salary with attendance-based calculation' },
  { href: '/admin/expenses/utilities', icon: Zap, title: 'Utility Bills', desc: 'Electricity, water, gas, internet and more' },
  { href: '/admin/expenses/others', icon: Receipt, title: 'Others', desc: 'Maintenance, repairs, and miscellaneous expenses' },
  { href: '/admin/expenses/reports', icon: FileText, title: 'Reports & Export', desc: 'CSV export for payroll, utilities, and others' },
];

export default function ExpensesHubPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    api.getExpensesSummary().then((r) => {
      if (r.success) setSummary(r.data);
    }).catch(() => {});
  }, []);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <button type="button" onClick={() => router.push('/admin')} className="mb-4 flex items-center gap-1 text-xs text-warm-muted hover:text-warm-cream">
        <ChevronLeft size={14} /> Admin
      </button>
      <div className="mb-6 flex items-center gap-3">
        <Wallet size={22} className="text-warm-accent" />
        <div>
          <h1 className="text-xl font-light text-warm-cream">Payments</h1>
          <p className="text-xs text-warm-muted">Branch outgoing ledger — payroll, utilities, and other expenses</p>
        </div>
      </div>

      {summary && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Payroll', value: summary.byType?.PAYROLL?.total ?? 0 },
            { label: 'Utilities', value: summary.byType?.UTILITY?.total ?? 0 },
            { label: 'Others', value: summary.byType?.OTHER?.total ?? 0 },
            { label: 'Total', value: summary.grandTotal ?? 0 },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-warm-card-border bg-warm-card px-4 py-3">
              <p className="text-[10px] uppercase text-warm-muted/60">{s.label}</p>
              <p className="text-lg font-medium text-warm-cream">{Number(s.value).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <button key={c.href} type="button" onClick={() => router.push(c.href)} className="rounded-xl border border-warm-card-border bg-warm-card p-4 text-left hover:border-warm-accent/50">
              <Icon size={18} className="mb-2 text-warm-accent" />
              <p className="text-sm text-warm-cream">{c.title}</p>
              <p className="text-[11px] text-warm-muted">{c.desc}</p>
            </button>
          );
        })}
      </div>
    </main>
  );
}
