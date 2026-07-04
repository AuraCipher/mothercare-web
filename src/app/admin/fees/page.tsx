'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DollarSign, Users, FileText, Calendar, BarChart3, ArrowRight, TrendingUp } from 'lucide-react';
import config from '@/config';
import { buildFeeScopeQuery, formatPkr } from '@/lib/feeAnalytics';

export default function FeesDashboardPage() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<any>(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const ayId = typeof window !== 'undefined' ? localStorage.getItem('activeAYId') : null;

  useEffect(() => {
    if (!token || !ayId) return;
    const now = new Date();
    fetch(`${config.apiUrl}/admin/fees/analytics${buildFeeScopeQuery({
      period: 'monthly',
      month: String(now.getMonth() + 1),
      year: String(now.getFullYear()),
    })}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(j => { if (j.success) setAnalytics(j.data); })
      .catch(() => {});
  }, [ayId, token]);

  const summary = analytics?.summary;

  const cards = [
    { icon: DollarSign, label: 'Fee Heads', desc: 'Manage what to charge', href: '/admin/fees/heads', color: 'text-green-400' },
    { icon: Users, label: 'Fee Structures', desc: 'Set amounts per class', href: '/admin/fees/structures', color: 'text-blue-400' },
    { icon: Calendar, label: 'Generate Fees', desc: 'Create monthly fees', href: '/admin/fees/generate', color: 'text-yellow-400' },
    { icon: FileText, label: 'Collections', desc: 'Record payments & dues', href: '/admin/fees/collections', color: 'text-pink-400' },
    { icon: Users, label: 'Families', desc: 'Group siblings & pay together', href: '/admin/fees/families', color: 'text-purple-400' },
    { icon: BarChart3, label: 'Analytics', desc: 'Charts, trends & KPIs', href: '/admin/fees/analytics', color: 'text-cyan-400' },
    { icon: TrendingUp, label: 'Reports', desc: 'Generate & export printable reports', href: '/admin/fees/reports', color: 'text-orange-400' },
  ];

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8 flex items-center gap-3">
        <DollarSign size={24} className="text-warm-accent" />
        <h1 className="text-xl font-light text-warm-cream">Fees & Payments</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
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
          <button onClick={() => router.push('/admin/fees/analytics')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream transition-colors">
            <BarChart3 size={13} /> View Analytics
          </button>
          <button onClick={() => router.push('/admin/fees/reports')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream transition-colors">
            <TrendingUp size={13} /> Export Reports
          </button>
        </div>
      </div>

      {summary && (
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-warm-cream">This Month</h2>
            <button onClick={() => router.push('/admin/fees/analytics')} className="text-[10px] text-warm-accent hover:underline">
              Full Analytics →
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-4">
            <div><p className="text-[10px] text-warm-muted/50 uppercase">Total Due</p><p className="text-lg font-light text-warm-cream mt-1">{formatPkr(summary.totalDue)}</p></div>
            <div><p className="text-[10px] text-warm-muted/50 uppercase">Collected</p><p className="text-lg font-light text-green-400 mt-1">{formatPkr(summary.totalCollected)}</p></div>
            <div><p className="text-[10px] text-warm-muted/50 uppercase">Pending</p><p className="text-lg font-light text-red-400 mt-1">{summary.pendingCount} students</p></div>
            <div><p className="text-[10px] text-warm-muted/50 uppercase">Rate</p><p className="text-lg font-light text-warm-accent mt-1">{summary.collectionRate}%</p></div>
          </div>
          <div className="w-full h-2 bg-warm-card-border/20 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-green-500/70 transition-all" style={{ width: `${Math.min(summary.collectionRate, 100)}%` }} />
          </div>
        </div>
      )}

      {analytics?.topDefaulters?.length > 0 && (
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-warm-cream">Top Defaulters</h2>
            <button onClick={() => router.push('/admin/fees/reports')} className="text-[10px] text-warm-accent hover:underline">View All</button>
          </div>
          <div className="space-y-2.5">
            {analytics.topDefaulters.slice(0, 5).map((d: any) => (
              <div key={d.id} className="flex items-center justify-between border-b border-warm-card-border/5 pb-2 last:border-0">
                <span className="text-xs text-warm-muted/70">{d.studentName}</span>
                <span className="text-xs text-red-400 font-medium">{formatPkr(d.pending)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
