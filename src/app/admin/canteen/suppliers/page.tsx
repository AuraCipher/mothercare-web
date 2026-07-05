'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Plus, Truck } from 'lucide-react';
import { api } from '@/lib/api';
import { formatCanteenMoney } from '@/lib/canteen';
import { showToast } from '@/components/toast';

export default function CanteenSuppliersPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addSupplier, setAddSupplier] = useState(false);
  const [supplierName, setSupplierName] = useState('');
  const [restockFor, setRestockFor] = useState<string | null>(null);
  const [restockLines, setRestockLines] = useState<{ productId: string; quantity: string; unitCost: string }[]>([
    { productId: '', quantity: '1', unitCost: '' },
  ]);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([api.getCanteenSuppliers(), api.getCanteenProducts(false)])
      .then(([s, p]) => {
        setSuppliers(s.data || []);
        setProducts(p.data || []);
      })
      .catch((e) => showToast('error', e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveSupplier = async () => {
    if (!supplierName.trim()) return;
    try {
      await api.createCanteenSupplier({ name: supplierName.trim() });
      setAddSupplier(false);
      setSupplierName('');
      load();
      showToast('success', 'Supplier added');
    } catch (e: unknown) {
      showToast('error', e instanceof Error ? e.message : 'Failed');
    }
  };

  const submitRestock = async () => {
    if (!restockFor) return;
    const items = restockLines
      .filter((l) => l.productId && l.quantity && l.unitCost)
      .map((l) => ({
        productId: l.productId,
        quantity: Number(l.quantity),
        unitCost: Number(l.unitCost),
      }));
    if (!items.length) {
      showToast('error', 'Add at least one line');
      return;
    }
    try {
      await api.createCanteenRestock({
        supplierId: restockFor,
        items,
        paidImmediately: false,
      });
      showToast('success', 'Restock recorded');
      setRestockFor(null);
      load();
    } catch (e: unknown) {
      showToast('error', e instanceof Error ? e.message : 'Failed');
    }
  };

  const paySupplier = async (supplierId: string, amount: number) => {
    try {
      await api.postCanteenSupplierPayment(supplierId, {
        amount,
        direction: 'WE_PAID_SUPPLIER',
      });
      showToast('success', 'Payment logged');
      load();
    } catch (e: unknown) {
      showToast('error', e instanceof Error ? e.message : 'Failed');
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <button type="button" onClick={() => router.push('/admin/canteen')} className="mb-4 flex items-center gap-1 text-xs text-warm-muted hover:text-warm-cream">
        <ChevronLeft size={14} /> Canteen
      </button>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-xl font-light text-warm-cream">
          <Truck size={22} className="text-yellow-400" /> Suppliers
        </h1>
        <button type="button" onClick={() => setAddSupplier(true)} className="inline-flex items-center gap-1 rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614]">
          <Plus size={14} /> Add supplier
        </button>
      </div>

      {loading ? (
        <div className="h-32 animate-pulse rounded-xl bg-warm-card" />
      ) : (
        <div className="space-y-3">
          {suppliers.map((s) => (
            <div key={s.id} className="rounded-xl border border-warm-card-border bg-warm-card p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-warm-cream">{s.name}</p>
                <p className="text-xs text-warm-muted mt-1">
                  We owe: {formatCanteenMoney(s.balanceOwedToSupplier)}
                  {Number(s.balanceSupplierOwesUs) > 0 && ` · They owe: ${formatCanteenMoney(s.balanceSupplierOwesUs)}`}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setRestockFor(s.id)} className="rounded-lg border border-warm-card-border px-3 py-1.5 text-xs text-warm-cream">
                  Restock
                </button>
                {Number(s.balanceOwedToSupplier) > 0 && (
                  <button
                    type="button"
                    onClick={() => paySupplier(s.id, Number(s.balanceOwedToSupplier))}
                    className="rounded-lg bg-warm-accent/20 px-3 py-1.5 text-xs text-warm-accent"
                  >
                    Pay full balance
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {addSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-xl border border-warm-card-border bg-[#1a1614] p-5 space-y-3">
            <input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder="Supplier name" className="w-full rounded-lg border border-warm-card-border bg-warm-card px-3 py-2 text-xs text-warm-cream" />
            <div className="flex gap-2">
              <button type="button" onClick={() => setAddSupplier(false)} className="flex-1 rounded-lg border py-2 text-xs text-warm-muted">Cancel</button>
              <button type="button" onClick={saveSupplier} className="flex-1 rounded-lg bg-warm-accent py-2 text-xs text-[#1a1614]">Save</button>
            </div>
          </div>
        </div>
      )}

      {restockFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-xl border border-warm-card-border bg-[#1a1614] p-5 my-8 space-y-3">
            <h3 className="text-sm font-medium text-warm-cream">Restock purchase</h3>
            {restockLines.map((line, i) => (
              <div key={i} className="grid grid-cols-3 gap-2">
                <select value={line.productId} onChange={(e) => {
                  const next = [...restockLines];
                  next[i].productId = e.target.value;
                  setRestockLines(next);
                }} className="col-span-1 rounded border border-warm-card-border bg-[#1a1614] px-2 py-1.5 text-xs text-warm-cream outline-none focus:border-warm-accent">
                  <option value="" className="bg-[#1a1614] text-warm-cream">Product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id} className="bg-[#1a1614] text-warm-cream">{p.name}</option>
                  ))}
                </select>
                <input value={line.quantity} onChange={(e) => { const n = [...restockLines]; n[i].quantity = e.target.value; setRestockLines(n); }} placeholder="Qty" className="rounded border border-warm-card-border bg-[#1a1614] px-2 py-1.5 text-xs text-warm-cream" />
                <input value={line.unitCost} onChange={(e) => { const n = [...restockLines]; n[i].unitCost = e.target.value; setRestockLines(n); }} placeholder="Cost" className="rounded border border-warm-card-border bg-[#1a1614] px-2 py-1.5 text-xs text-warm-cream" />
              </div>
            ))}
            <button type="button" onClick={() => setRestockLines([...restockLines, { productId: '', quantity: '1', unitCost: '' }])} className="text-xs text-warm-accent">+ Line</button>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setRestockFor(null)} className="flex-1 rounded-lg border py-2 text-xs text-warm-muted">Cancel</button>
              <button type="button" onClick={submitRestock} className="flex-1 rounded-lg bg-warm-accent py-2 text-xs text-[#1a1614]">Save restock</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
