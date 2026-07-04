'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { showToast } from '@/components/toast';
import { Search, Users, Plus, ArrowRight } from 'lucide-react';
import config from '@/config';
import { FEE_STATUS_OPTIONS, type FeeStatusFilter } from '@/lib/feeStatusFilter';

function formatPkr(paise: number) {
  return (paise / 100).toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export default function FamiliesPage() {
  const router = useRouter();
  const [families, setFamilies] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FeeStatusFilter>('');
  const [loading, setLoading] = useState(true);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const ayId = typeof window !== 'undefined' ? localStorage.getItem('activeAYId') : null;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const loadFamilies = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (ayId) params.set('academicYearId', ayId);
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (statusFilter) params.set('feeStatus', statusFilter);

      const res = await fetch(`${config.apiUrl}/admin/families?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setFamilies(json.data);
      else showToast('error', json.message || 'Failed to load families');
    } catch {
      showToast('error', 'Failed to load families');
    } finally {
      setLoading(false);
    }
  }, [token, ayId, debouncedSearch, statusFilter]);

  useEffect(() => { loadFamilies(); }, [loadFamilies]);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Users size={22} className="text-warm-accent" />
          <div>
            <h1 className="text-xl font-light text-warm-cream">Families</h1>
            <p className="text-[11px] text-warm-muted/60">Group siblings for combined fee management</p>
          </div>
        </div>
        <button
          onClick={() => router.push('/admin/fees/families/new')}
          className="inline-flex items-center gap-1.5 rounded-lg bg-warm-accent/20 px-4 py-2 text-xs text-warm-accent hover:bg-warm-accent/30 transition-colors"
        >
          <Plus size={14} /> New Family
        </button>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-muted/40" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by family name, father, phone, or student…"
            className="w-full rounded-lg border border-warm-card-border bg-warm-card py-2.5 pl-9 pr-3 text-xs text-warm-cream placeholder:text-warm-muted/40 focus:border-warm-accent/50 focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as FeeStatusFilter)}
          className="rounded-lg border border-warm-card-border bg-warm-card px-3 py-2.5 text-xs text-warm-cream outline-none focus:border-warm-accent/50"
        >
          {FEE_STATUS_OPTIONS.map(opt => (
            <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-xs text-warm-muted/50">Loading…</p>
      ) : families.length === 0 ? (
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-8 text-center">
          <p className="text-sm text-warm-muted/70">No families found</p>
          <button
            onClick={() => router.push('/admin/fees/families/new')}
            className="mt-3 text-xs text-warm-accent hover:underline"
          >
            Create your first family
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {families.map(f => (
            <button
              key={f.id}
              onClick={() => router.push(`/admin/fees/families/${f.id}`)}
              className="w-full text-left rounded-xl border border-warm-card-border bg-warm-card p-4 hover:border-warm-accent/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-warm-cream">{f.name}</p>
                  <p className="text-[11px] text-warm-muted/60 mt-0.5">
                    {[f.fatherName, f.phone].filter(Boolean).join(' · ') || 'No contact info'}
                  </p>
                  <p className="text-[10px] text-warm-muted/45 mt-1">
                    {f.studentCount ?? 0} student{(f.studentCount ?? 0) !== 1 ? 's' : ''}
                    {(f.paymentCount ?? 0) > 0 && ` · ${f.paymentCount} family payment${f.paymentCount !== 1 ? 's' : ''}`}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  {(f.totalDuePaise ?? 0) > 0 ? (
                    <p className="text-sm text-red-400">{formatPkr(f.totalDuePaise)} PKR due</p>
                  ) : (
                    <p className="text-sm text-green-400/80">All clear</p>
                  )}
                  <ArrowRight size={14} className="inline-block mt-1 text-warm-muted/40" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </main>
  );
}
