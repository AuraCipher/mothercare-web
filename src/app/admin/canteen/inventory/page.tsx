'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Boxes, ChevronLeft } from 'lucide-react';
import { api } from '@/lib/api';
import {
  formatStockDisplay,
  totalStockUnits,
  type CanteenProduct,
} from '@/lib/canteen';
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
  const [stockBoxes, setStockBoxes] = useState('');
  const [stockUnits, setStockUnits] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.getCanteenProducts(false)
      .then((r) => setProducts(r.data || []))
      .catch((e) => showToast('error', e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const refresh = () => load();
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') refresh();
    });
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [load]);

  const activeProducts = useMemo(
    () => products.filter((p) => p.isActive),
    [products],
  );

  const stats = useMemo(() => {
    const low = activeProducts.filter((p) => {
      const total = totalStockUnits(p);
      return total > 0 && total <= p.lowStockThreshold;
    });
    const out = activeProducts.filter((p) => totalStockUnits(p) <= 0);
    return { total: activeProducts.length, low: low.length, out: out.length };
  }, [activeProducts]);

  const filtered = useMemo(() => {
    if (filter === 'low') {
      return activeProducts.filter((p) => {
        const total = totalStockUnits(p);
        return total > 0 && total <= p.lowStockThreshold;
      });
    }
    if (filter === 'out') {
      return activeProducts.filter((p) => totalStockUnits(p) <= 0);
    }
    return activeProducts;
  }, [activeProducts, filter]);

  const openStockEdit = (p: CanteenProduct) => {
    setEditing(p);
    setStockBoxes(String(p.stockBoxes));
    setStockUnits(String(p.stockUnits));
  };

  const saveStock = async () => {
    if (!editing) return;
    const boxes = Number(stockBoxes);
    const units = Number(stockUnits);
    if (!Number.isInteger(boxes) || boxes < 0 || !Number.isInteger(units) || units < 0) {
      showToast('error', 'Boxes and units must be whole numbers ≥ 0');
      return;
    }
    setSaving(true);
    try {
      await api.patchCanteenProduct(editing.id, { stockBoxes: boxes, stockUnits: units });
      showToast('success', 'Stock updated');
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

  const boxed = editing && editing.unitsPerBox != null && editing.unitsPerBox > 1;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <button type="button" onClick={() => router.push('/admin/canteen')} className="mb-4 flex items-center gap-1 text-xs text-warm-muted hover:text-warm-cream">
        <ChevronLeft size={14} /> Canteen
      </button>

      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-xl font-light text-warm-cream">
          <Boxes size={22} className="text-blue-400" /> Inventory
        </h1>
        <p className="mt-1 text-xs text-warm-muted">Stock as boxes + loose units per product</p>
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
                <th className="p-3">Total units</th>
                <th className="p-3">Status</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const total = totalStockUnits(p);
                const out = total <= 0;
                const low = !out && total <= p.lowStockThreshold;
                return (
                  <tr key={p.id} className={`border-b border-warm-card-border/50 ${low || out ? 'bg-red-500/5' : ''}`}>
                    <td className="p-3 text-warm-cream">{p.name}</td>
                    <td className="p-3 text-warm-muted">{p.category?.name}</td>
                    <td className={`p-3 font-medium ${out ? 'text-red-400' : low ? 'text-amber-400' : 'text-warm-cream'}`}>
                      {formatStockDisplay(p)}
                    </td>
                    <td className="p-3 text-warm-muted">{total}</td>
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
                      <button type="button" onClick={() => openStockEdit(p)} className="text-warm-accent hover:underline">
                        Edit stock
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
            <h3 className="text-sm font-medium text-warm-cream">Edit stock — {editing.name}</h3>
            <p className="text-[11px] text-warm-muted">
              {editing.category?.name}
              {editing.unitsPerBox != null && editing.unitsPerBox > 1
                ? ` · 1 box = ${editing.unitsPerBox} units`
                : ''}
            </p>
            {boxed ? (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-[10px] uppercase text-warm-muted/60">Boxes</label>
                  <input
                    value={stockBoxes}
                    onChange={(e) => setStockBoxes(e.target.value)}
                    type="number"
                    min="0"
                    step="1"
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] uppercase text-warm-muted/60">Extra units</label>
                  <input
                    value={stockUnits}
                    onChange={(e) => setStockUnits(e.target.value)}
                    type="number"
                    min="0"
                    step="1"
                    className={fieldClass}
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="mb-1 block text-[10px] uppercase text-warm-muted/60">Units</label>
                <input
                  value={stockUnits}
                  onChange={(e) => setStockUnits(e.target.value)}
                  type="number"
                  min="0"
                  step="1"
                  className={fieldClass}
                />
              </div>
            )}
            <p className="text-[11px] text-warm-muted">
              Preview: {formatStockDisplay({
                stockBoxes: boxed ? Number(stockBoxes) || 0 : 0,
                stockUnits: Number(stockUnits) || 0,
                unitsPerBox: editing.unitsPerBox,
              })}
            </p>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setEditing(null)} disabled={saving} className="flex-1 rounded-lg border border-warm-card-border py-2 text-xs text-warm-muted disabled:opacity-50">Cancel</button>
              <button type="button" onClick={saveStock} disabled={saving} className="flex-1 rounded-lg bg-warm-accent py-2 text-xs font-medium text-[#1a1614] disabled:opacity-50">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
