'use client';

import { useCallback, useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, Minus, PackagePlus, Plus, ShoppingCart, X } from 'lucide-react';
import { api } from '@/lib/api';
import { formatCanteenMoney, formatStockDisplay, totalStockUnits, type CanteenProduct } from '@/lib/canteen';
import { showToast } from '@/components/toast';
import {
  CreditAllocationSection,
  creditLinesAreValid,
  creditLinesToPayload,
  type CreditLine,
} from './credit-allocation';

type CartLine = { product: CanteenProduct; quantity: number };

const fieldClass =
  'w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent';

export default function CanteenSalesPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-6xl px-6 py-10"><div className="h-40 animate-pulse rounded-xl bg-warm-card" /></main>}>
      <CanteenSalesContent />
    </Suspense>
  );
}

function CanteenSalesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetAccountId = searchParams.get('accountId');
  const [products, setProducts] = useState<CanteenProduct[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [creditAmount, setCreditAmount] = useState('');
  const [creditLines, setCreditLines] = useState<CreditLine[]>([]);
  const [qtyDraft, setQtyDraft] = useState<Record<string, string>>({});
  const [presetAccount, setPresetAccount] = useState<{ id: string; displayName: string } | null>(null);

  const cartSignature = cart.map((l) => `${l.product.id}:${l.quantity}`).join('|');

  useEffect(() => {
    if (!cart.length) {
      setCashAmount('');
      setCreditAmount('');
      setCreditLines([]);
      return;
    }
    const productsTotal = cart.reduce((s, l) => s + Number(l.product.unitPrice) * l.quantity, 0);
    if (presetAccount) {
      setCashAmount('0');
      setCreditAmount(String(productsTotal));
    } else {
      setCashAmount(String(productsTotal));
      setCreditAmount('0');
    }
  }, [cartSignature, presetAccount?.id]);

  useEffect(() => {
    const credit = creditAmount.trim() === '' ? 0 : Number(creditAmount);
    if (credit <= 0) setCreditLines([]);
  }, [creditAmount]);

  const loadProducts = useCallback(() => {
    setLoading(true);
    api.getCanteenProducts(true)
      .then((r) => setProducts(r.data || []))
      .catch((e) => showToast('error', e.message || 'Failed to load products'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  useEffect(() => {
    if (!presetAccountId) {
      setPresetAccount(null);
      return;
    }
    api.getCanteenAccount(presetAccountId)
      .then((r) => {
        if (r.data) setPresetAccount({ id: r.data.id, displayName: r.data.displayName });
      })
      .catch(() => setPresetAccount(null));
  }, [presetAccountId]);

  const total = useMemo(
    () => cart.reduce((s, l) => s + Number(l.product.unitPrice) * l.quantity, 0),
    [cart],
  );

  const totalUnits = useMemo(
    () => cart.reduce((s, l) => s + l.quantity, 0),
    [cart],
  );

  const addToCart = (product: CanteenProduct) => {
    const onHand = totalStockUnits(product);
    if (onHand <= 0) {
      showToast('error', 'Out of stock');
      return;
    }
    setCart((prev) => {
      const existing = prev.find((l) => l.product.id === product.id);
      if (existing) {
        if (existing.quantity >= onHand) {
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

  const totalSales = useMemo(() => {
    const cash = cashAmount.trim() === '' ? 0 : Number(cashAmount);
    const credit = creditAmount.trim() === '' ? 0 : Number(creditAmount);
    if (!Number.isFinite(cash) || !Number.isFinite(credit)) return 0;
    return Math.round((cash + credit) * 100) / 100;
  }, [cashAmount, creditAmount]);

  const paymentMismatch = cart.length > 0 && Math.abs(totalSales - total) > 0.02;

  const setQty = (productId: string, raw: string) => {
    setQtyDraft((prev) => ({ ...prev, [productId]: raw }));
  };

  const commitQty = (productId: string, product: CanteenProduct) => {
    const raw = qtyDraft[productId];
    setQtyDraft((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
    if (raw === undefined) return;

    if (raw.trim() === '') {
      setCart((prev) => prev.filter((l) => l.product.id !== productId));
      return;
    }

    const next = Number(raw);
    if (!Number.isInteger(next) || next < 0) {
      showToast('error', 'Enter a whole number of units');
      return;
    }
    if (next === 0) {
      setCart((prev) => prev.filter((l) => l.product.id !== productId));
      return;
    }
    const onHand = totalStockUnits(product);
    if (next > onHand) {
      showToast('error', 'Not enough stock');
      return;
    }
    setCart((prev) => {
      const existing = prev.find((l) => l.product.id === productId);
      if (existing) {
        return prev.map((l) => (l.product.id === productId ? { ...l, quantity: next } : l));
      }
      return [...prev, { product, quantity: next }];
    });
  };

  const changeQty = (productId: string, delta: number) => {
    setQtyDraft((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
    setCart((prev) => prev.flatMap((l) => {
      if (l.product.id !== productId) return [l];
      const next = l.quantity + delta;
      if (next <= 0) return [];
      if (next > totalStockUnits(l.product)) {
        showToast('error', 'Not enough stock');
        return [l];
      }
      return [{ ...l, quantity: next }];
    }));
  };

  const creditTotal = creditAmount.trim() === '' ? 0 : Number(creditAmount);
  const creditInvalid = creditTotal > 0
    && !presetAccount
    && !creditLinesAreValid(creditLines, creditTotal);

  const postSale = async () => {
    if (!cart.length) {
      showToast('error', 'Add at least one product');
      return;
    }

    const cash = cashAmount.trim() === '' ? 0 : Number(cashAmount);
    const credit = creditAmount.trim() === '' ? 0 : Number(creditAmount);
    if (!Number.isFinite(cash) || !Number.isFinite(credit) || cash < 0 || credit < 0) {
      showToast('error', 'Enter valid cash and credit amounts');
      return;
    }
    if (cash === 0 && credit === 0) {
      showToast('error', 'Enter cash and/or credit amount');
      return;
    }
    if (Math.abs(cash + credit - total) > 0.02) {
      showToast('error', 'Cash + credit must equal products total');
      return;
    }
    if (credit > 0 && !presetAccount && !creditLinesAreValid(creditLines, credit)) {
      showToast('error', 'Assign credit amounts that add up to total credit');
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        items: cart.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
        cashAmount: cash,
        creditAmount: credit,
      };

      if (credit > 0) {
        if (presetAccount) {
          payload.accountId = presetAccount.id;
        } else {
          payload.creditAllocations = creditLinesToPayload(creditLines);
        }
      }

      await api.postCanteenSale(payload);
      showToast('success', "Today's sale recorded");
      setCart([]);
      setCashAmount('');
      setCreditAmount('');
      setCreditLines([]);
      setQtyDraft({});
      loadProducts();
    } catch (e: unknown) {
      showToast('error', e instanceof Error ? e.message : 'Sale failed');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmSale = () => {
    if (!cart.length) {
      showToast('error', 'Add at least one product');
      return;
    }
    postSale();
  };

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      p.name.toLowerCase().includes(q)
      || (p.category?.name || '').toLowerCase().includes(q),
    );
  }, [products, productSearch]);

  const groupedProducts = useMemo(() => {
    const map = new Map<string, CanteenProduct[]>();
    for (const p of filteredProducts) {
      const cat = p.category?.name || 'Other';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(p);
    }
    return Array.from(map.entries());
  }, [filteredProducts]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => router.push(presetAccount ? `/admin/canteen/accounts/${presetAccount.id}` : '/admin/canteen')}
          className="flex items-center gap-1 text-xs text-warm-muted hover:text-warm-cream"
        >
          <ChevronLeft size={14} /> {presetAccount ? 'Account' : 'Canteen'}
        </button>
        <h1 className="flex items-center gap-2 text-lg font-light text-warm-cream">
          <ShoppingCart size={20} className="text-green-400" /> Daily Sales
        </h1>
      </div>

      {presetAccount && (
        <div className="mb-4 rounded-lg border border-pink-500/30 bg-pink-500/10 px-4 py-3 text-xs text-warm-cream">
          Credit order for <span className="font-medium text-pink-300">{presetAccount.displayName}</span>
          {' '}— checkout will post to their account.
        </div>
      )}

      <section className="rounded-xl border border-warm-card-border bg-warm-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-warm-card-border px-4 py-3">
          <div>
            <h2 className="text-sm font-medium text-warm-cream">Today&apos;s sale</h2>
            <p className="text-[11px] text-warm-muted">
              {cart.length === 0
                ? 'No products added yet'
                : `${totalUnits} unit${totalUnits === 1 ? '' : 's'} · ${cart.length} product${cart.length === 1 ? '' : 's'}`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setProductsOpen(true); setProductSearch(''); }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:opacity-90"
          >
            <PackagePlus size={14} /> Add products
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm text-warm-muted">Tap &quot;Add products&quot; to build this sale.</p>
            <button
              type="button"
              onClick={() => { setProductsOpen(true); setProductSearch(''); }}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-cream hover:border-warm-accent/50"
            >
              <PackagePlus size={14} /> Select products
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-warm-card-border/60">
            {cart.map((l) => (
              <li key={l.product.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex h-10 min-w-10 items-center justify-center rounded-lg bg-warm-accent/15 px-2 text-sm font-semibold tabular-nums text-warm-accent">
                  {l.quantity}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-warm-cream truncate">
                    <span className="text-warm-muted">{l.quantity}×</span> {l.product.name}
                  </p>
                  <p className="text-[11px] text-warm-muted">
                    {formatCanteenMoney(l.product.unitPrice)} / unit
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => changeQty(l.product.id, -1)}
                    className="rounded-lg border border-warm-card-border p-1.5 text-warm-muted hover:text-warm-cream"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={14} />
                  </button>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={qtyDraft[l.product.id] ?? String(l.quantity)}
                    onChange={(e) => setQty(l.product.id, e.target.value)}
                    onBlur={() => commitQty(l.product.id, l.product)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitQty(l.product.id, l.product);
                    }}
                    className="w-12 rounded-lg border border-warm-card-border bg-[#1a1614] px-1 py-1.5 text-center text-xs text-warm-cream tabular-nums outline-none focus:border-warm-accent"
                    aria-label={`Units for ${l.product.name}`}
                  />
                  <button
                    type="button"
                    onClick={() => changeQty(l.product.id, 1)}
                    className="rounded-lg border border-warm-card-border p-1.5 text-warm-muted hover:text-warm-cream"
                    aria-label="Increase quantity"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <p className="w-20 text-right text-sm font-medium text-warm-cream tabular-nums">
                  {formatCanteenMoney(Number(l.product.unitPrice) * l.quantity)}
                </p>
              </li>
            ))}
          </ul>
        )}

        <div className="border-t border-warm-card-border bg-[#1a1614]/30 px-4 py-4 space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-warm-muted">Products total</span>
            <span className="font-medium text-warm-cream tabular-nums">{formatCanteenMoney(total)}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[10px] uppercase text-warm-muted/60">Total cash (PKR)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                placeholder="0"
                className={fieldClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] uppercase text-warm-muted/60">Total credit (PKR)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                placeholder="0"
                className={fieldClass}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-warm-card-border bg-warm-card px-3 py-2.5 text-sm">
            <span className="text-warm-muted">Total sales</span>
            <span className="text-lg font-medium text-warm-accent tabular-nums">{formatCanteenMoney(totalSales)}</span>
          </div>

          {paymentMismatch && (
            <p className="text-[11px] text-amber-400">
              Cash + credit must equal products total ({formatCanteenMoney(total)}).
            </p>
          )}

          {!presetAccount && creditTotal > 0 && Number.isFinite(creditTotal) && (
            <CreditAllocationSection
              creditTotal={creditTotal}
              lines={creditLines}
              onChange={setCreditLines}
            />
          )}

          <button
            type="button"
            disabled={submitting || !cart.length || paymentMismatch || totalSales <= 0 || creditInvalid}
            onClick={confirmSale}
            className="w-full rounded-lg bg-warm-accent py-2.5 text-sm font-medium text-[#1a1614] disabled:opacity-50"
          >
            {submitting ? 'Saving…' : "Confirm today's sales"}
          </button>
        </div>
      </section>

      {productsOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4">
          <div className="flex max-h-[90vh] w-full sm:max-w-2xl flex-col rounded-t-2xl sm:rounded-xl border border-warm-card-border bg-[#1a1614] shadow-xl">
            <div className="flex items-center justify-between border-b border-warm-card-border px-4 py-3">
              <div>
                <h3 className="text-sm font-medium text-warm-cream">Select products</h3>
                <p className="text-[11px] text-warm-muted">Tap a product to add — stays open for multiple items</p>
              </div>
              <button
                type="button"
                onClick={() => setProductsOpen(false)}
                className="rounded-lg p-1.5 text-warm-muted hover:text-warm-cream"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="border-b border-warm-card-border px-4 py-3">
              <input
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search products…"
                className={fieldClass}
                autoFocus
              />
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3">
              {loading ? (
                <div className="h-32 animate-pulse rounded-xl bg-warm-card" />
              ) : groupedProducts.length === 0 ? (
                <p className="py-8 text-center text-sm text-warm-muted">
                  {products.length === 0 ? 'No active products. Add inventory first.' : 'No products match your search.'}
                </p>
              ) : (
                <div className="space-y-4">
                  {groupedProducts.map(([cat, items]) => (
                    <div key={cat}>
                      <p className="mb-2 text-[10px] uppercase tracking-wide text-warm-muted/50">{cat}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {items.map((p) => {
                          const onHand = totalStockUnits(p);
                          const inCart = cart.find((l) => l.product.id === p.id)?.quantity ?? 0;
                          const low = onHand > 0 && onHand <= p.lowStockThreshold;
                          const out = onHand <= 0;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              disabled={out}
                              onClick={() => addToCart(p)}
                              className={`rounded-lg border p-3 text-left transition-colors disabled:opacity-40 ${
                                inCart > 0
                                  ? 'border-warm-accent/50 bg-warm-accent/10'
                                  : low
                                    ? 'border-red-500/40 bg-red-500/5 hover:border-red-500/60'
                                    : 'border-warm-card-border bg-warm-card hover:border-warm-accent/50'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-medium text-warm-cream truncate">{p.name}</p>
                                {inCart > 0 && (
                                  <span className="shrink-0 rounded-md bg-warm-accent px-1.5 py-0.5 text-[10px] font-semibold text-[#1a1614] tabular-nums">
                                    {inCart}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-warm-accent">{formatCanteenMoney(p.unitPrice)}</p>
                              <p className={`text-[10px] mt-1 ${low || out ? 'text-red-400' : 'text-warm-muted/60'}`}>
                                {out ? 'Out of stock' : `Stock: ${formatStockDisplay(p)}`}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-warm-card-border px-4 py-3 flex items-center justify-between gap-3">
              <p className="text-xs text-warm-muted">
                {cart.length > 0
                  ? `${totalUnits} units selected · ${formatCanteenMoney(total)}`
                  : 'Nothing selected yet'}
              </p>
              <button
                type="button"
                onClick={() => setProductsOpen(false)}
                className="rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
