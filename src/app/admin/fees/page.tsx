'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DollarSign, Users, FileText, Calendar, Printer, BarChart, ArrowRight } from 'lucide-react';
import config from '@/config';

export default function FeesDashboardPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<any>(null);
  const [defaulters, setDefaulters] = useState<any[]>([]);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const ayId = typeof window !== 'undefined' ? localStorage.getItem('activeAYId') : null;

  useEffect(() => {
    if (!token || !ayId) return;
    const now = new Date();
    const m = now.getMonth() + 1;
    const y = now.getFullYear();
    const ayParam = `&academicYearId=${ayId}`;
    fetch(`${config.apiUrl}/admin/fees/summary?month=${m}&year=${y}${ayParam}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()).then(j => { if (j.success) setSummary(j.data); }).catch(() => {});
    fetch(`${config.apiUrl}/admin/fees/defaulter?month=${m}&year=${y}${ayParam}&take=5`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()).then(j => { if (j.success) setDefaulters(j.data.slice(0, 5)); }).catch(() => {});
  }, [ayId]);

  const cards = [
    { icon: DollarSign, label: 'Fee Heads', desc: 'Manage what to charge', href: '/admin/fees/heads', color: 'text-green-400' },
    { icon: Users, label: 'Fee Structures', desc: 'Set amounts per class', href: '/admin/fees/structures', color: 'text-blue-400' },
    { icon: Calendar, label: 'Generate Fees', desc: 'Create monthly fees', href: '/admin/fees/generate', color: 'text-yellow-400' },
    { icon: FileText, label: 'Collections', desc: 'Record payments & dues', href: '/admin/fees/collections', color: 'text-pink-400' },
    { icon: Printer, label: 'Family Pay', desc: 'Pay for siblings together', href: '/admin/fees/collections/family-pay', color: 'text-purple-400' },
    { icon: BarChart, label: 'Reports', desc: 'Collection stats & defaulters', href: '/admin/fees/reports', color: 'text-cyan-400' },
  ];

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8 flex items-center gap-3">
        <DollarSign size={24} className="text-warm-accent" />
        <h1 className="text-xl font-light text-warm-cream">Fees & Payments</h1>
      </div>

      {/* All 6 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
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

      {/* Quick Actions — most used */}
      <div className="rounded-xl border border-warm-card-border bg-warm-card p-5 mb-6">
        <h2 className="text-sm font-medium text-warm-cream mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => router.push('/admin/fees/collections')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-warm-accent/20 px-4 py-2 text-xs text-warm-accent hover:bg-warm-accent/30 transition-colors">
            <FileText size={13} /> Record Payment <ArrowRight size={12} />
          </button>
          <button onClick={() => router.push('/admin/fees/generate')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream transition-colors">
            <Calendar size={13} /> Generate Monthly Fees
          </button>
          <button onClick={() => router.push('/admin/fees/collections/family-pay')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream transition-colors">
            <Printer size={13} /> Combined Family Pay
          </button>
          <button onClick={() => router.push('/admin/fees/reports')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream transition-colors">
            <BarChart size={13} /> View Reports
          </button>
        </div>
      </div>

      {/* This Month Summary */}
      {summary && (
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-5 mb-6">
          <h2 className="text-sm font-medium text-warm-cream mb-4">This Month Summary</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div><p className="text-[10px] text-warm-muted/50 uppercase">Total Due</p><p className="text-lg font-light text-warm-cream mt-1">{(summary.totalDue / 100).toLocaleString()}</p></div>
            <div><p className="text-[10px] text-warm-muted/50 uppercase">Collected</p><p className="text-lg font-light text-green-400 mt-1">{(summary.totalCollected / 100).toLocaleString()}</p></div>
            <div><p className="text-[10px] text-warm-muted/50 uppercase">Pending</p><p className="text-lg font-light text-red-400 mt-1">{summary.pendingCount} students</p></div>
            <div><p className="text-[10px] text-warm-muted/50 uppercase">Rate</p><p className="text-lg font-light text-warm-accent mt-1">{summary.collectionRate}%</p></div>
          </div>
        </div>
      )}

      {/* Top Defaulters */}
      {defaulters.length > 0 && (
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-warm-cream">Top Defaulters</h2>
            <button onClick={() => router.push('/admin/fees/reports')} className="text-[10px] text-warm-accent hover:underline">View All</button>
          </div>
          <div className="space-y-2.5">
            {defaulters.map((f: any) => {
              const due = ((f.netAmount - f.paidAmount) / 100).toLocaleString();
              return (
                <div key={f.id} className="flex items-center justify-between border-b border-warm-card-border/5 pb-2 last:border-0">
                  <span className="text-xs text-warm-muted/70">{f.student?.name}</span>
                  <span className="text-xs text-red-400 font-medium">{due} PKR</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}
