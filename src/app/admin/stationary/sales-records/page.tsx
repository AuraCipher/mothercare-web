'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ReceiptText } from 'lucide-react';
import { api } from '@/lib/api';
import { showToast } from '@/components/toast';

export default function StationarySalesRecordsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  const load = () => api.getStationarySalesRecords(search).then((r) => setRows(r.data || [])).catch((e) => showToast('error', e.message));
  useEffect(() => { load(); }, []);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <button type="button" onClick={() => router.push('/admin/stationary')} className="mb-4 flex items-center gap-1 text-xs text-warm-muted hover:text-warm-cream"><ChevronLeft size={14} /> Stationary</button>
      <h1 className="flex items-center gap-2 text-xl font-light text-warm-cream">
        <ReceiptText size={20} className="text-warm-accent" />
        Stationary Sales Records
      </h1>
      <div className="my-4 flex gap-2">
        <input className="w-full rounded border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream" placeholder="Search student" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="rounded border border-warm-card-border px-3 py-2 text-xs text-warm-cream" onClick={load}>Search</button>
      </div>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.id} className="rounded border border-warm-card-border bg-warm-card p-3">
            <p className="text-xs text-warm-cream">{r.student?.name} - {new Date(r.createdAt).toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })}</p>
            <p className="text-[11px] text-warm-muted">Month row: {r.studentFee?.month}/{r.studentFee?.year}</p>
            <ul className="mt-1 list-disc pl-4 text-[11px] text-warm-muted">
              {(r.items || []).map((it: any) => <li key={it.id}>{it.productName}: {it.quantity} x {(it.unitPrice / 100).toFixed(2)}</li>)}
            </ul>
          </div>
        ))}
        {rows.length === 0 && <p className="text-xs text-warm-muted">No records found.</p>}
      </div>
    </main>
  );
}
