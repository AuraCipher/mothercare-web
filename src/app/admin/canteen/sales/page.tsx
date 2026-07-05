'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Minus, Plus, ShoppingCart, X } from 'lucide-react';
import { api } from '@/lib/api';
import { formatCanteenMoney, type CanteenProduct } from '@/lib/canteen';
import { showToast } from '@/components/toast';

type CartLine = { product: CanteenProduct; quantity: number };

type CreditPerson = {
  id: string;
  name: string;
  rollNumber?: string;
  phone?: string | null;
};

export default function CanteenSalesPage() {
  const router = useRouter();
  const [products, setProducts] = useState<CanteenProduct[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [creditOpen, setCreditOpen] = useState(false);
  const [personType, setPersonType] = useState<'STUDENT' | 'TEACHER' | 'STAFF'>('STUDENT');
  const [searchQ, setSearchQ] = useState('');
  const [persons, setPersons] = useState<CreditPerson[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<CreditPerson | null>(null);
  const [personIdField, setPersonIdField] = useState<'studentId' | 'userId'>('studentId');

  const loadProducts = useCallback(() => {
    setLoading(true);
    api.getCanteenProducts(true)
      .then((r) => setProducts(r.data || []))
      .catch((e) => showToast('error', e.message || 'Failed to load products'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const total = useMemo(
    () => cart.reduce((s, l) => s + Number(l.product.unitPrice) * l.quantity, 0),
    [cart],
  );

  const addToCart = (product: CanteenProduct) => {
    if (product.stockQuantity <= 0) {
      showToast('error', 'Out of stock');
      return;
    }
    setCart((prev) => {
      const existing = prev.find((l) => l.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) {
          showToast('error', 'Not enough stock');
          return prev;
        }
        return prev.map((l) =>
          l.product.id === product.id ? { ...l, quantity: l.quantity + 1 } : l,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const changeQty = (productId: string, delta: number) => {
    setCart((prev) => prev.flatMap((l) => {
      if (l.product.id !== productId) return [l];
      const next = l.quantity + delta;
      if (next <= 0) return [];
      if (next > l.product.stockQuantity) {
        showToast('error', 'Not enough stock');
        return [l];
      }
      return [{ ...l, quantity: next }];
    }));
  };

  const submitSale = async (paymentType: 'CASH' | 'CREDIT', creditPayload?: Record<string, string>) => {
    if (!cart.length) {
      showToast('error', 'Cart is empty');
      return;
    }
    setSubmitting(true);
    try {
      await api.postCanteenSale({
        paymentType,
        items: cart.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
        ...creditPayload,
      });
      showToast('success', paymentType === 'CASH' ? 'Cash sale recorded' : 'Credit sale recorded');
      setCart([]);
      setCreditOpen(false);
      setSelectedPerson(null);
      loadProducts();
    } catch (e: unknown) {
      showToast('error', e instanceof Error ? e.message : 'Sale failed');
    } finally {
      setSubmitting(false);
    }
  };

  const openCredit = () => {
    if (!cart.length) {
      showToast('error', 'Cart is empty');
      return;
    }
    setCreditOpen(true);
    setPersonType('STUDENT');
    setSelectedPerson(null);
    setSearchQ('');
  };

  useEffect(() => {
    if (!creditOpen) return;
    const idField = personType === 'STUDENT' ? 'studentId' : 'userId';
    setPersonIdField(idField);
    api.getCanteenCreditPersons(personType, searchQ || undefined)
      .then((r) => setPersons(r.data || []))
      .catch(() => setPersons([]));
  }, [creditOpen, personType, searchQ]);

  const confirmCredit = () => {
    if (!selectedPerson) {
      showToast('error', 'Select a person from this branch');
      return;
    }
    submitSale('CREDIT', {
      personType,
      [personIdField]: selectedPerson.id,
    });
  };

  const grouped = useMemo(() => {
    const map = new Map<string, CanteenProduct[]>();
    for (const p of products) {
      const cat = p.category?.name || 'Other';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(p);
    }
    return Array.from(map.entries());
  }, [products]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => router.push('/admin/canteen')}
          className="flex items-center gap-1 text-xs text-warm-muted hover:text-warm-cream"
        >
          <ChevronLeft size={14} /> Canteen
        </button>
        <h1 className="flex items-center gap-2 text-lg font-light text-warm-cream">
          <ShoppingCart size={20} className="text-green-400" /> Daily Sales
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="h-40 animate-pulse rounded-xl bg-warm-card" />
          ) : grouped.length === 0 ? (
            <p className="text-sm text-warm-muted">No active products. Add inventory first.</p>
          ) : (
            grouped.map(([cat, items]) => (
              <div key={cat}>
                <p className="mb-2 text-[10px] uppercase tracking-wide text-warm-muted/50">{cat}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {items.map((p) => {
                    const low = p.stockQuantity <= p.lowStockThreshold;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => addToCart(p)}
                        className={`rounded-lg border p-3 text-left transition-colors hover:border-warm-accent/50 ${
                          low ? 'border-red-500/40 bg-red-500/5' : 'border-warm-card-border bg-warm-card'
                        }`}
                      >
                        <p className="text-sm font-medium text-warm-cream truncate">{p.name}</p>
                        <p className="text-xs text-warm-accent">{formatCanteenMoney(p.unitPrice)}</p>
                        <p className={`text-[10px] mt-1 ${low ? 'text-red-400' : 'text-warm-muted/60'}`}>
                          Stock: {p.stockQuantity}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="rounded-xl border border-warm-card-border bg-warm-card p-4 h-fit sticky top-4">
          <h2 className="text-sm font-medium text-warm-cream mb-3">Cart</h2>
          {cart.length === 0 ? (
            <p className="text-xs text-warm-muted">Tap products to add</p>
          ) : (
            <ul className="space-y-2 mb-4 max-h-64 overflow-y-auto">
              {cart.map((l) => (
                <li key={l.product.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-warm-cream flex-1 truncate">{l.product.name}</span>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => changeQty(l.product.id, -1)} className="p-1 rounded border border-warm-card-border">
                      <Minus size={12} />
                    </button>
                    <span className="w-6 text-center">{l.quantity}</span>
                    <button type="button" onClick={() => changeQty(l.product.id, 1)} className="p-1 rounded border border-warm-card-border">
                      <Plus size={12} />
                    </button>
                  </div>
                  <span className="text-warm-muted w-16 text-right">
                    {formatCanteenMoney(Number(l.product.unitPrice) * l.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="border-t border-warm-card-border pt-3 mb-4 flex justify-between text-sm">
            <span className="text-warm-muted">Total</span>
            <span className="font-medium text-warm-cream">{formatCanteenMoney(total)}</span>
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              disabled={submitting || !cart.length}
              onClick={() => submitSale('CASH')}
              className="rounded-lg bg-warm-accent py-2.5 text-sm font-medium text-[#1a1614] disabled:opacity-50"
            >
              Cash
            </button>
            <button
              type="button"
              disabled={submitting || !cart.length}
              onClick={openCredit}
              className="rounded-lg border border-warm-card-border py-2.5 text-sm text-warm-cream hover:bg-warm-card/80 disabled:opacity-50"
            >
              Credit (Bakaya)
            </button>
          </div>
        </div>
      </div>

      {creditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-warm-card-border bg-[#1a1614] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-warm-cream">Credit sale — branch person only</h3>
              <button type="button" onClick={() => setCreditOpen(false)} className="text-warm-muted">
                <X size={18} />
              </button>
            </div>
            <div className="flex gap-2 mb-3">
              {(['STUDENT', 'TEACHER', 'STAFF'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setPersonType(t); setSelectedPerson(null); }}
                  className={`flex-1 rounded-lg py-1.5 text-xs ${
                    personType === t ? 'bg-warm-accent text-[#1a1614]' : 'border border-warm-card-border text-warm-muted'
                  }`}
                >
                  {t.charAt(0) + t.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
            <input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search name or roll…"
              className="w-full mb-3 rounded-lg border border-warm-card-border bg-warm-card px-3 py-2 text-xs text-warm-cream outline-none"
            />
            <ul className="max-h-48 overflow-y-auto space-y-1 mb-4">
              {persons.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedPerson(p)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-xs ${
                      selectedPerson?.id === p.id ? 'bg-warm-accent/20 text-warm-accent' : 'hover:bg-warm-card text-warm-cream'
                    }`}
                  >
                    {p.name}
                    {p.rollNumber ? ` · ${p.rollNumber}` : ''}
                  </button>
                </li>
              ))}
              {persons.length === 0 && (
                <li className="text-xs text-warm-muted py-2">No matches in this branch</li>
              )}
            </ul>
            <button
              type="button"
              disabled={submitting || !selectedPerson}
              onClick={confirmCredit}
              className="w-full rounded-lg bg-warm-accent py-2.5 text-sm font-medium text-[#1a1614] disabled:opacity-50"
            >
              Confirm credit · {formatCanteenMoney(total)}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
