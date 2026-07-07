'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Boxes } from 'lucide-react';
import { api } from '@/lib/api';
import { showToast } from '@/components/toast';

const fieldClass =
  'w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent';

type StockFilter = 'all' | 'low' | 'out';

function totalStockUnits(p: any) {
  const perBundle = Number(p.unitsPerBundle || 1);
  return Number(p.stockBundles || 0) * perBundle + Number(p.stockUnits || 0);
}

function formatStockDisplay(p: any) {
  const perBundle = Number(p.unitsPerBundle || 1);
  if (perBundle <= 1) return `${Number(p.stockUnits || 0)} units`;
  return `${Number(p.stockBundles || 0)} bundles + ${Number(p.stockUnits || 0)} units`;
}

export default function StationaryInventoryPage() {
  const router = useRouter();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StockFilter>('all');
  const [editing, setEditing] = useState<any | null>(null);
  const [stockBundles, setStockBundles] = useState('');
  const [stockUnits, setStockUnits] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.getStationaryInventory()
      .then((r) => setRows(r.data || []))
      .catch((e) => showToast('error', e.message))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, []);

  const activeRows = useMemo(() => rows.filter((p) => p.isActive), [rows]);

  const stats = useMemo(() => {
    const low = activeRows.filter((p) => {
      const total = totalStockUnits(p);
      return total > 0 && total <= p.lowStockThreshold;
    });
    const out = activeRows.filter((p) => totalStockUnits(p) <= 0);
    return { total: activeRows.length, low: low.length, out: out.length };
  }, [activeRows]);

  const filtered = useMemo(() => {
    if (filter === 'low') {
      return activeRows.filter((p) => {
        const total = totalStockUnits(p);
        return total > 0 && total <= p.lowStockThreshold;
      });
    }
    if (filter === 'out') {
      return activeRows.filter((p) => totalStockUnits(p) <= 0);
    }
    return activeRows;
  }, [activeRows, filter]);

  const openStockEdit = (p: any) => {
    setEditing(p);
    setStockBundles(String(p.stockBundles || 0));
    setStockUnits(String(p.stockUnits || 0));
  };

  const saveStock = async () => {
    if (!editing) return;
    const bundles = Number(stockBundles);
    const units = Number(stockUnits);
    if (!Number.isInteger(bundles) || bundles < 0 || !Number.isInteger(units) || units < 0) {
      showToast('error', 'Bundles and units must be whole numbers >= 0');
      return;
    }
    setSaving(true);
    try {
      await api.adjustStationaryInventory({
        productId: editing.id,
        quantityBundles: bundles - Number(editing.stockBundles || 0),
        quantityUnits: units - Number(editing.stockUnits || 0),
      });
      showToast('success', 'Stock updated');
      setEditing(null);
      load();
    } catch (e: unknown) {
      showToast('error', e instanceof Error ? e.message : 'Failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <button type="button" onClick={() => router.push('/admin/stationary')} className="mb-4 flex items-center gap-1 text-xs text-warm-muted hover:text-warm-cream"><ChevronLeft size={14} /> Stationary</button>
      <h1 className="flex items-center gap-2 text-xl font-light text-warm-cream">
        <Boxes size={20} className="text-warm-accent" />
        Stationary Inventory
      </h1>

      <p className="mt-1 text-xs text-warm-muted">Stock as bundles + loose units per product</p>

      <div className="mb-6 mt-4 grid grid-cols-3 gap-3">
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
        <button type="button" onClick={() => setFilter('all')} className={`rounded-lg border px-3 py-1.5 text-xs ${filter === 'all' ? 'border-warm-accent bg-warm-accent/10 text-warm-cream' : 'border-warm-card-border text-warm-muted'}`}>All</button>
        <button type="button" onClick={() => setFilter('low')} className={`rounded-lg border px-3 py-1.5 text-xs ${filter === 'low' ? 'border-warm-accent bg-warm-accent/10 text-warm-cream' : 'border-warm-card-border text-warm-muted'}`}>Low stock ({stats.low})</button>
        <button type="button" onClick={() => setFilter('out')} className={`rounded-lg border px-3 py-1.5 text-xs ${filter === 'out' ? 'border-warm-accent bg-warm-accent/10 text-warm-cream' : 'border-warm-card-border text-warm-muted'}`}>Out of stock ({stats.out})</button>
      </div>

      {loading ? (
        <div className="h-20 animate-pulse rounded bg-warm-card" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-warm-card-border">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-warm-card-border"><th className="p-2 text-left">Product</th><th className="p-2 text-left">Category</th><th className="p-2 text-left">Stock</th><th className="p-2 text-left">Total units</th><th className="p-2 text-left">Status</th><th className="p-2" /></tr></thead>
            <tbody>{filtered.map((r) => {
              const total = totalStockUnits(r);
              const out = total <= 0;
              const low = !out && total <= r.lowStockThreshold;
              return (
                <tr key={r.id} className="border-b border-warm-card-border/50">
                  <td className="p-2">{r.name}</td>
                  <td className="p-2">{r.category?.name}</td>
                  <td className="p-2">{formatStockDisplay(r)}</td>
                  <td className="p-2">{total}</td>
                  <td className="p-2">{out ? <span className="text-red-400">Out of stock</span> : low ? <span className="text-amber-400">Low</span> : <span className="text-green-400/80">OK</span>}</td>
                  <td className="p-2 text-right"><button onClick={() => openStockEdit(r)} className="text-warm-accent">Edit stock</button></td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-xl border border-warm-card-border bg-[#1a1614] p-5 space-y-3">
            <h3 className="text-sm font-medium text-warm-cream">Edit stock - {editing.name}</h3>
            <p className="text-[11px] text-warm-muted">{editing.category?.name} {editing.unitsPerBundle > 1 ? `· 1 bundle = ${editing.unitsPerBundle} units` : ''}</p>
            {editing.unitsPerBundle > 1 ? (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-[10px] uppercase text-warm-muted/60">Bundles</label>
                  <input value={stockBundles} onChange={(e) => setStockBundles(e.target.value)} type="number" min="0" step="1" className={fieldClass} />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] uppercase text-warm-muted/60">Extra units</label>
                  <input value={stockUnits} onChange={(e) => setStockUnits(e.target.value)} type="number" min="0" step="1" className={fieldClass} />
                </div>
              </div>
            ) : (
              <div>
                <label className="mb-1 block text-[10px] uppercase text-warm-muted/60">Units</label>
                <input value={stockUnits} onChange={(e) => setStockUnits(e.target.value)} type="number" min="0" step="1" className={fieldClass} />
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setEditing(null)} disabled={saving} className="flex-1 rounded-lg border border-warm-card-border py-2 text-xs text-warm-muted disabled:opacity-50">Cancel</button>
              <button type="button" onClick={saveStock} disabled={saving} className="flex-1 rounded-lg bg-warm-accent py-2 text-xs font-medium text-[#1a1614] disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
