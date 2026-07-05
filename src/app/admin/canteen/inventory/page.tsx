'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Boxes, ChevronLeft, Truck } from 'lucide-react';
import { api } from '@/lib/api';
import { type CanteenProduct } from '@/lib/canteen';
import { showToast } from '@/components/toast';

const fieldClass =
  'w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent';

type StockFilter = 'all' | 'low' | 'out';

export default function CanteenInventoryPage() {
  const router = useRouter();
  const [products, setProducts] = useState<CanteenProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StockFilter>('all');
  const [editing, setEditing] = useState<CanteenProduct | null>(null);
  const [lowThreshold, setLowThreshold] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.getCanteenProducts(false)
      .then((r) => setProducts(r.data || []))
      .catch((e) => showToast('error', e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const activeProducts = useMemo(
    () => products.filter((p) => p.isActive),
    [products],
  );

  const stats = useMemo(() => {
    const low = activeProducts.filter((p) => p.stockQuantity > 0 && p.stockQuantity <= p.lowStockThreshold);
    const out = activeProducts.filter((p) => p.stockQuantity <= 0);
    return { total: activeProducts.length, low: low.length, out: out.length };
  }, [activeProducts]);

  const filtered = useMemo(() => {
    const base = activeProducts;
    if (filter === 'low') {
      return base.filter((p) => p.stockQuantity > 0 && p.stockQuantity <= p.lowStockThreshold);
    }
    if (filter === 'out') {
      return base.filter((p) => p.stockQuantity <= 0);
    }
    return base;
  }, [activeProducts, filter]);

  const openThresholdEdit = (p: CanteenProduct) => {
    setEditing(p);
    setLowThreshold(String(p.lowStockThreshold));
  };

  const saveThreshold = async () => {
    if (!editing) return;
    const value = Number(lowThreshold);
    if (!Number.isFinite(value) || value < 0) {
      showToast('error', 'Enter a valid threshold');
      return;
    }
    setSaving(true);
    try {
      await api.patchCanteenProduct(editing.id, { lowStockThreshold: value });
      showToast('success', 'Low-stock threshold updated');
      setEditing(null);
      load();
    } catch (e: unknown) {
      showToast('error', e instanceof Error ? e.message : 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const filterBtn = (id: StockFilter, label: string) => (
    <button
      type="button"
      onClick={() => setFilter(id)}
      className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
        filter === id
          ? 'border-warm-accent bg-warm-accent/10 text-warm-cream'
          : 'border-warm-card-border text-warm-muted hover:text-warm-cream'
      }`}
    >
      {label}
    </button>
  );

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <button type="button" onClick={() => router.push('/admin/canteen')} className="mb-4 flex items-center gap-1 text-xs text-warm-muted hover:text-warm-cream">
        <ChevronLeft size={14} /> Canteen
      </button>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-light text-warm-cream">
            <Boxes size={22} className="text-blue-400" /> Inventory
          </h1>
          <p className="mt-1 text-xs text-warm-muted">Stock on hand — updated by restock purchases & sales</p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/admin/canteen/suppliers')}
          className="inline-flex items-center gap-1 rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-cream hover:border-warm-accent/50"
        >
          <Truck size={14} /> Restock via Suppliers
        </button>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          { label: 'Active products', value: stats.total },
          { label: 'Low stock', value: stats.low, warn: stats.low > 0 },
          { label: 'Out of stock', value: stats.out, warn: stats.out > 0 },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-warm-card-border bg-warm-card px-4 py-3">
            <p className="text-[10px] uppercase text-warm-muted/60">{s.label}</p>
            <p className={`text-lg font-medium ${s.warn ? 'text-red-400' : 'text-warm-cream'}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {filterBtn('all', 'All')}
        {filterBtn('low', `Low stock (${stats.low})`)}
        {filterBtn('out', `Out of stock (${stats.out})`)}
      </div>

      {loading ? (
        <div className="h-32 animate-pulse rounded-xl bg-warm-card" />
      ) : filtered.length === 0 ? (
        <p className="text-sm text-warm-muted">
          {filter === 'all' ? 'No active products. Add products from the Products page.' : 'Nothing in this filter.'}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-warm-card-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-warm-card-border bg-warm-card/80 text-left text-warm-muted">
                <th className="p-3">Product</th>
                <th className="p-3">Category</th>
                <th className="p-3">Stock</th>
                <th className="p-3">Low at</th>
                <th className="p-3">Status</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const out = p.stockQuantity <= 0;
                const low = !out && p.stockQuantity <= p.lowStockThreshold;
                return (
                  <tr key={p.id} className={`border-b border-warm-card-border/50 ${low || out ? 'bg-red-500/5' : ''}`}>
                    <td className="p-3 text-warm-cream">{p.name}</td>
                    <td className="p-3 text-warm-muted">{p.category?.name}</td>
                    <td className={`p-3 font-medium ${out ? 'text-red-400' : low ? 'text-amber-400' : 'text-warm-cream'}`}>
                      {p.stockQuantity}
                    </td>
                    <td className="p-3 text-warm-muted">{p.lowStockThreshold}</td>
                    <td className="p-3">
                      {out ? (
                        <span className="text-red-400">Out of stock</span>
                      ) : low ? (
                        <span className="text-amber-400">Low</span>
                      ) : (
                        <span className="text-green-400/80">OK</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <button type="button" onClick={() => openThresholdEdit(p)} className="text-warm-accent hover:underline">
                        Edit alert
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-xl border border-warm-card-border bg-[#1a1614] p-5 space-y-3">
            <h3 className="text-sm font-medium text-warm-cream">Low-stock alert — {editing.name}</h3>
            <p className="text-[11px] text-warm-muted">
              Current stock: <span className="text-warm-cream">{editing.stockQuantity}</span>
            </p>
            <input
              value={lowThreshold}
              onChange={(e) => setLowThreshold(e.target.value)}
              placeholder="Alert when stock falls to or below"
              type="number"
              min="0"
              className={fieldClass}
            />
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setEditing(null)} disabled={saving} className="flex-1 rounded-lg border border-warm-card-border py-2 text-xs text-warm-muted disabled:opacity-50">Cancel</button>
              <button type="button" onClick={saveThreshold} disabled={saving} className="flex-1 rounded-lg bg-warm-accent py-2 text-xs font-medium text-[#1a1614] disabled:opacity-50">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
