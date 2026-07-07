'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { showToast } from '@/components/toast';

export default function StationaryProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [unitPrice, setUnitPrice] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([api.getStationaryProducts(false), api.getStationaryCategories()])
      .then(([p, c]) => {
        setProducts(p.data || []);
        setCategories(c.data || []);
      })
      .catch((e) => showToast('error', e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!name.trim() || !categoryId || Number(unitPrice) <= 0) return;
    await api.createStationaryProduct({ name: name.trim(), categoryId, unitPrice: Number(unitPrice) * 100 });
    setName('');
    setCategoryId('');
    setUnitPrice('');
    load();
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <button type="button" onClick={() => router.push('/admin/stationary')} className="mb-4 flex items-center gap-1 text-xs text-warm-muted hover:text-warm-cream"><ChevronLeft size={14} /> Stationary</button>
      <h1 className="text-xl font-light text-warm-cream">Stationary Products</h1>
      <div className="mb-4 mt-3 grid grid-cols-1 gap-2 md:grid-cols-4">
        <input className="rounded border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <select className="rounded border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">Category</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input className="rounded border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream" placeholder="Unit price PKR" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
        <button className="rounded bg-warm-accent px-3 py-2 text-xs text-[#1a1614]" onClick={create}><Plus size={12} className="mr-1 inline" /> Add</button>
      </div>
      {loading ? <div className="h-20 animate-pulse rounded bg-warm-card" /> : (
        <div className="overflow-x-auto rounded-xl border border-warm-card-border">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-warm-card-border"><th className="p-2 text-left">Name</th><th className="p-2 text-left">Category</th><th className="p-2 text-left">Unit Price</th><th className="p-2 text-left">Stock</th></tr></thead>
            <tbody>{products.map((p) => <tr key={p.id} className="border-b border-warm-card-border/50"><td className="p-2">{p.name}</td><td className="p-2">{p.category?.name}</td><td className="p-2">{(p.unitPrice / 100).toFixed(2)}</td><td className="p-2">{p.stockBundles} bundle, {p.stockUnits} unit</td></tr>)}</tbody>
          </table>
        </div>
      )}
    </main>
  );
}
