'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Plus, MapPin, Users, ArrowRight, Calendar } from 'lucide-react';

interface Branch {
  id: string; name: string; code: string; address?: string; phone?: string; email?: string;
  isActive: boolean; createdAt: string;
  _count?: { academicYears: number; branchMembers: number };
}

export default function CeoBranches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getBranches().then(d => {
      if (d.success) setBranches(d.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-xl font-light text-warm-cream">Branches</h1>
          <p className="text-sm text-warm-muted">All school campuses managed by you.</p>
        </div>
        <a href="/admin/branches"
          className="flex items-center gap-1.5 rounded-lg bg-warm-accent px-4 py-2 text-sm font-medium text-[#1a1614] transition-colors hover:bg-[#b39a76]">
          <Plus size={15} /> Add Branch
        </a>
      </div>

      {loading && <p className="text-sm text-warm-muted">Loading…</p>}

      {!loading && branches.length === 0 && (
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-8 text-center">
          <MapPin size={28} className="mx-auto mb-3 text-warm-muted" />
          <p className="text-sm text-warm-muted">No branches yet.</p>
        </div>
      )}

      <div className="space-y-3">
        {branches.map(b => (
          <a key={b.id} href={`/admin/branches/${b.id}`}
            className="flex items-center justify-between rounded-xl border border-warm-card-border bg-warm-card p-4 transition-colors hover:bg-warm-card/80">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warm-accent/10">
                <MapPin size={18} className="text-warm-accent" />
              </div>
              <div>
                <p className="text-sm font-medium text-warm-cream">{b.name}</p>
                <p className="text-xs text-warm-muted">{b.code}{b.address ? ` · ${b.address.substring(0, 40)}` : ''}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden text-right text-xs text-warm-muted md:block">
                {b._count?.branchMembers ?? '—'} staff
              </div>
              <ArrowRight size={14} className="text-warm-muted" />
            </div>
          </a>
        ))}
      </div>
    </main>
  );
}
