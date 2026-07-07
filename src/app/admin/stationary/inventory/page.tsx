'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { showToast } from '@/components/toast';

export default function StationaryInventoryPage() {
  const router = useRouter();
  const [rows, setRows] = useState<any[]>([]);
  const [productId, setProductId] = useState('');
  const [units, setUnits] = useState('0');
  const [bundles, setBundles] = useState('0');

  const load = () => api.getStationaryInventory().then((r) => setRows(r.data || [])).catch((e) => showToast('error', e.message));
  useEffect(() => { load(); }, []);

  const adjust = async () => {
    await api.adjustStationaryInventory({ productId, quantityUnits: Number(units), quantityBundles: Number(bundles) });
    setUnits('0');
    setBundles('0');
    load();
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <button type="button" onClick={() => router.push('/admin/stationary')} className="mb-4 flex items-center gap-1 text-xs text-warm-muted hover:text-warm-cream"><ChevronLeft size={14} /> Stationary</button>
      <h1 className="text-xl font-light text-warm-cream">Stationary Inventory</h1>
      <div className="my-4 grid grid-cols-1 gap-2 md:grid-cols-4">
        <select className="rounded border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream" value={productId} onChange={(e) => setProductId(e.target.value)}>
          <option value="">Select product</option>
          {rows.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <input className="rounded border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream" value={bundles} onChange={(e) => setBundles(e.target.value)} placeholder="Bundles (+/-)" />
        <input className="rounded border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream" value={units} onChange={(e) => setUnits(e.target.value)} placeholder="Units (+/-)" />
        <button className="rounded bg-warm-accent px-3 py-2 text-xs text-[#1a1614]" onClick={adjust}>Apply Adjustment</button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-warm-card-border">
        <table className="w-full text-xs">
          <thead><tr className="border-b border-warm-card-border"><th className="p-2 text-left">Product</th><th className="p-2 text-left">Stock Bundles</th><th className="p-2 text-left">Stock Units</th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r.id} className="border-b border-warm-card-border/50"><td className="p-2">{r.name}</td><td className="p-2">{r.stockBundles}</td><td className="p-2">{r.stockUnits}</td></tr>)}</tbody>
        </table>
      </div>
    </main>
  );
}
