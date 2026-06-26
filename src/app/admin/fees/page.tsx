'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DollarSign, Users, FileText, Calendar } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function FeesDashboardPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<any>(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    if (!token) return;
    const now = new Date();
    fetch(`${API_URL}/admin/fees/summary?month=${now.getMonth() + 1}&year=${now.getFullYear()}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()).then(j => { if (j.success) setSummary(j.data); }).catch(() => {});
  }, []);

  const cards = [
    { icon: DollarSign, label: 'Fee Heads', desc: 'Manage what to charge', href: '/admin/fees/heads', color: 'text-green-400' },
    { icon: Users, label: 'Fee Structures', desc: 'Set amounts per class', href: '/admin/fees/structures', color: 'text-blue-400' },
    { icon: Calendar, label: 'Generate Fees', desc: 'Create monthly fees', href: '/admin/fees/generate', color: 'text-yellow-400' },
    { icon: FileText, label: 'Collections', desc: 'Record payments & due list', href: '/admin/fees/collections', color: 'text-pink-400' },
  ];

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8 flex items-center gap-3">
        <DollarSign size={24} className="text-warm-accent" />
        <h1 className="text-xl font-light text-warm-cream">Fees & Payments</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(c => {
          const Icon = c.icon;
          return (
            <button key={c.href} onClick={() => router.push(c.href)}
              className="text-left rounded-xl border border-warm-card-border bg-warm-card p-4 hover:border-warm-accent/50 transition-colors">
              <Icon size={20} className={c.color + ' mb-2'} />
              <p className="text-sm font-medium text-warm-cream">{c.label}</p>
              <p className="text-[11px] text-warm-muted/60">{c.desc}</p>
            </button>
          );
        })}
      </div>

      {summary && (
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-5">
          <h2 className="text-sm font-medium text-warm-cream mb-4">This Month Summary</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div><p className="text-[10px] text-warm-muted/50 uppercase">Total Due</p><p className="text-lg font-light text-warm-cream mt-1">{(summary.totalDue / 100).toLocaleString()}</p></div>
            <div><p className="text-[10px] text-warm-muted/50 uppercase">Collected</p><p className="text-lg font-light text-green-400 mt-1">{(summary.totalCollected / 100).toLocaleString()}</p></div>
            <div><p className="text-[10px] text-warm-muted/50 uppercase">Pending</p><p className="text-lg font-light text-red-400 mt-1">{summary.pendingCount}</p></div>
            <div><p className="text-[10px] text-warm-muted/50 uppercase">Rate</p><p className="text-lg font-light text-warm-accent mt-1">{summary.collectionRate}%</p></div>
          </div>
        </div>
      )}
    </main>
  );
}
