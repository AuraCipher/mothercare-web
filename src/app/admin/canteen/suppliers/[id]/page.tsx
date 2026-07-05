'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, Package, Plus, Truck, Wallet } from 'lucide-react';
import { api } from '@/lib/api';
import { formatCanteenDateTime, formatCanteenMoney, formatStockDisplay, unitsPerBoxOf } from '@/lib/canteen';
import { showToast } from '@/components/toast';

const fieldClass =
  'w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent';

type RestockLine = {
  productId: string;
  stockBoxes: string;
  stockUnits: string;
  unitCost: string;
  lineTotalPaid: string;
};

const emptyRestockLine = (): RestockLine => ({
  productId: '',
  stockBoxes: '',
  stockUnits: '',
  unitCost: '',
  lineTotalPaid: '',
});

function parseRestockQuantity(
  product: { unitsPerBox?: number | null } | undefined,
  stockBoxes: string,
  stockUnits: string,
): number | null {
  if (!product) return null;
  const upb = unitsPerBoxOf(product.unitsPerBox);
  const boxes = stockBoxes.trim() === '' ? 0 : Number(stockBoxes);
  const units = stockUnits.trim() === '' ? 0 : Number(stockUnits);

  if (upb > 1) {
    if (!Number.isInteger(boxes) || boxes < 0 || !Number.isInteger(units) || units < 0) return null;
    if (boxes === 0 && units === 0) return null;
    const total = boxes * upb + units;
    return total > 0 ? total : null;
  }

  if (stockUnits.trim() === '') return null;
  if (!Number.isInteger(units) || units <= 0) return null;
  return units;
}

function buildRestockItem(
  line: RestockLine,
  product: { id: string; unitsPerBox?: number | null },
) {
  const quantity = parseRestockQuantity(product, line.stockBoxes, line.stockUnits);
  if (quantity == null) return null;

  let unitCost: number;
  let lineTotal: number;

  if (line.lineTotalPaid.trim() !== '') {
    lineTotal = Number(line.lineTotalPaid);
    if (!Number.isFinite(lineTotal) || lineTotal < 0) return null;
    unitCost = lineTotal / quantity;
  } else if (line.unitCost.trim() !== '') {
    unitCost = Number(line.unitCost);
    if (!Number.isFinite(unitCost) || unitCost < 0) return null;
    lineTotal = quantity * unitCost;
  } else {
    return null;
  }

  return { productId: line.productId, quantity, unitCost, lineTotal };
}

function syncLineCosts(
  line: RestockLine,
  product: { unitsPerBox?: number | null } | undefined,
  source: 'unit' | 'total' | 'qty',
): RestockLine {
  const next = { ...line };
  const quantity = product ? parseRestockQuantity(product, line.stockBoxes, line.stockUnits) : null;
  if (!quantity) return next;

  if (source === 'unit' && line.unitCost.trim() !== '') {
    const unitCost = Number(line.unitCost);
    if (Number.isFinite(unitCost) && unitCost >= 0) {
      next.lineTotalPaid = String(Math.round(unitCost * quantity * 100) / 100);
    }
  } else if (source === 'total' && line.lineTotalPaid.trim() !== '') {
    const total = Number(line.lineTotalPaid);
    if (Number.isFinite(total) && total >= 0) {
      next.unitCost = String(Math.round((total / quantity) * 100) / 100);
    }
  } else if (source === 'qty') {
    if (line.lineTotalPaid.trim() !== '') {
      const total = Number(line.lineTotalPaid);
      if (Number.isFinite(total) && total >= 0) {
        next.unitCost = String(Math.round((total / quantity) * 100) / 100);
      }
    } else if (line.unitCost.trim() !== '') {
      const unitCost = Number(line.unitCost);
      if (Number.isFinite(unitCost) && unitCost >= 0) {
        next.lineTotalPaid = String(Math.round(unitCost * quantity * 100) / 100);
      }
    }
  }

  return next;
}

type SupplierDetail = {
  supplier: {
    id: string;
    name: string;
    contactNumber?: string | null;
    note?: string | null;
    balanceOwedToSupplier: number | string;
    balanceSupplierOwesUs: number | string;
  };
  stats: {
    totalPurchased: number;
    totalPaid: number;
    remainingOwed: number;
    theyOweUs: number;
    purchaseCount: number;
    paymentCount: number;
  };
  purchases: Array<{
    id: string;
    purchaseDate: string;
    totalCost: number | string;
    note?: string | null;
    items?: Array<{ quantity: number; unitCost: number | string; product?: { name: string } }>;
    createdBy?: { name: string } | null;
  }>;
  payments: Array<{
    id: string;
    paidAt: string;
    amount: number | string;
    direction: string;
    note?: string | null;
    createdBy?: { name: string } | null;
  }>;
};

export default function CanteenSupplierDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [detail, setDetail] = useState<SupplierDetail | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePanel, setActivePanel] = useState<'orders' | 'payments' | 'restock' | 'pay'>('orders');
  const [restockLines, setRestockLines] = useState<RestockLine[]>([emptyRestockLine()]);
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editProfile, setEditProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', contactNumber: '', note: '' });

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([api.getCanteenSupplierDetail(id), api.getCanteenProducts(false)])
      .then(([d, p]) => {
        setDetail(d.data);
        setProducts(p.data || []);
      })
      .catch((e) => showToast('error', e.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!detail?.supplier) return;
    setProfileForm({
      name: detail.supplier.name,
      contactNumber: detail.supplier.contactNumber || '',
      note: detail.supplier.note || '',
    });
  }, [detail?.supplier]);

  const saveProfile = async () => {
    if (!profileForm.name.trim()) {
      showToast('error', 'Supplier name is required');
      return;
    }
    setSubmitting(true);
    try {
      await api.patchCanteenSupplier(id, {
        name: profileForm.name.trim(),
        contactNumber: profileForm.contactNumber.trim() || null,
        note: profileForm.note.trim() || null,
      });
      showToast('success', 'Supplier updated');
      setEditProfile(false);
      load();
    } catch (e: unknown) {
      showToast('error', e instanceof Error ? e.message : 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const submitRestock = async () => {
    const items = restockLines
      .map((l) => {
        if (!l.productId || !productIds.has(l.productId)) return null;
        const product = activeProducts.find((p) => p.id === l.productId);
        const built = product ? buildRestockItem(l, product) : null;
        if (!built) return null;
        return { productId: built.productId, quantity: built.quantity, unitCost: built.unitCost };
      })
      .filter((l): l is { productId: string; quantity: number; unitCost: number } => l !== null);

    if (!items.length) {
      showToast('error', 'Select product, boxes and/or units, and unit cost');
      return;
    }

    const seen = new Set<string>();
    for (const item of items) {
      if (seen.has(item.productId)) {
        showToast('error', 'Same product cannot appear twice — combine quantities');
        return;
      }
      seen.add(item.productId);
    }

    setSubmitting(true);
    try {
      await api.createCanteenRestock({ supplierId: id, items, paidImmediately: false });
      showToast('success', 'Restock order recorded');
      setRestockLines([emptyRestockLine()]);
      load();
      setActivePanel('orders');
    } catch (e: unknown) {
      showToast('error', e instanceof Error ? e.message : 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const recordPayment = async (amount?: number) => {
    const paid = amount ?? Number(payAmount);
    if (!paid || paid <= 0) {
      showToast('error', 'Enter a valid amount');
      return;
    }
    setSubmitting(true);
    try {
      await api.postCanteenSupplierPayment(id, {
        amount: paid,
        direction: 'WE_PAID_SUPPLIER',
        note: payNote.trim() || undefined,
      });
      setPayAmount('');
      setPayNote('');
      showToast('success', 'Payment recorded');
      load();
      setActivePanel('payments');
    } catch (e: unknown) {
      showToast('error', e instanceof Error ? e.message : 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <main className="mx-auto max-w-5xl px-6 py-10"><div className="h-48 animate-pulse rounded-xl bg-warm-card" /></main>;
  }

  if (!detail) {
    return <main className="mx-auto max-w-5xl px-6 py-10"><p className="text-sm text-warm-muted">Supplier not found</p></main>;
  }

  const { supplier, stats, purchases, payments } = detail;
  const owed = stats.remainingOwed;
  const activeProducts = products.filter((p) => p.isActive !== false);
  const productIds = new Set(activeProducts.map((p) => p.id));
  const productMap = new Map(activeProducts.map((p) => [p.id, p]));

  const parsedRestockLines = restockLines.map((line) => {
    const product = line.productId ? productMap.get(line.productId) : undefined;
    const built = product ? buildRestockItem(line, product) : null;
    return { line, product, built };
  });

  const hasValidRestockLine = parsedRestockLines.some((r) => r.built != null);

  const orderGrandTotal = parsedRestockLines.reduce((sum, r) => sum + (r.built?.lineTotal ?? 0), 0);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <button type="button" onClick={() => router.push('/admin/canteen/suppliers')} className="mb-4 flex items-center gap-1 text-xs text-warm-muted hover:text-warm-cream">
        <ChevronLeft size={14} /> Suppliers
      </button>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-xl border border-warm-card-border bg-warm-card p-3">
            <Truck size={22} className="text-yellow-400" />
          </div>
          <div>
            <h1 className="text-xl font-light text-warm-cream">{supplier.name}</h1>
            <p className="mt-1 text-xs text-warm-muted">{supplier.contactNumber || 'No contact info'}</p>
            {supplier.note && (
              <p className="mt-2 text-xs text-warm-muted/80 max-w-lg whitespace-pre-wrap">{supplier.note}</p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setEditProfile((v) => !v)} className="inline-flex items-center gap-1.5 rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-cream hover:border-warm-accent/50">
            Edit details
          </button>
          <button type="button" onClick={() => setActivePanel('restock')} className="inline-flex items-center gap-1.5 rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614]">
            <Package size={14} /> New order
          </button>
          <button type="button" onClick={() => setActivePanel('pay')} className="inline-flex items-center gap-1.5 rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-cream hover:border-warm-accent/50">
            <Wallet size={14} /> Record payment
          </button>
        </div>
      </div>

      {editProfile && (
        <section className="mb-6 rounded-xl border border-warm-card-border bg-warm-card p-5 max-w-lg space-y-3">
          <h2 className="text-sm font-medium text-warm-cream">Supplier details</h2>
          <input value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} placeholder="Supplier name" className={fieldClass} />
          <input value={profileForm.contactNumber} onChange={(e) => setProfileForm({ ...profileForm, contactNumber: e.target.value })} placeholder="Contact info" className={fieldClass} />
          <textarea value={profileForm.note} onChange={(e) => setProfileForm({ ...profileForm, note: e.target.value })} placeholder="Note" rows={3} className={`${fieldClass} resize-none`} />
          <div className="flex gap-2">
            <button type="button" onClick={() => setEditProfile(false)} disabled={submitting} className="flex-1 rounded-lg border py-2 text-xs text-warm-muted">Cancel</button>
            <button type="button" onClick={saveProfile} disabled={submitting} className="flex-1 rounded-lg bg-warm-accent py-2 text-xs text-[#1a1614]">{submitting ? 'Saving…' : 'Save'}</button>
          </div>
        </section>
      )}

      <div className="mb-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total purchased', value: formatCanteenMoney(stats.totalPurchased), sub: `${stats.purchaseCount} orders` },
          { label: 'Total paid', value: formatCanteenMoney(stats.totalPaid), sub: `${stats.paymentCount} payments` },
          { label: 'We owe (remaining)', value: formatCanteenMoney(owed), warn: owed > 0 },
          { label: 'They owe us', value: formatCanteenMoney(stats.theyOweUs) },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-warm-card-border bg-warm-card px-4 py-3">
            <p className="text-[10px] uppercase tracking-wide text-warm-muted/60">{s.label}</p>
            <p className={`mt-1 text-lg font-medium ${s.warn ? 'text-amber-400' : 'text-warm-cream'}`}>{s.value}</p>
            {s.sub && <p className="text-[10px] text-warm-muted/50 mt-0.5">{s.sub}</p>}
          </div>
        ))}
      </div>

      <div className="mb-4 flex gap-2 border-b border-warm-card-border overflow-x-auto">
        {([
          ['orders', `Orders (${stats.purchaseCount})`],
          ['payments', `Payments (${stats.paymentCount})`],
          ['restock', 'New order'],
          ['pay', 'Pay'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActivePanel(key)}
            className={`px-4 py-2 text-xs border-b-2 -mb-px whitespace-nowrap transition-colors ${
              activePanel === key ? 'border-warm-accent text-warm-cream' : 'border-transparent text-warm-muted hover:text-warm-cream'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {activePanel === 'orders' && (
        <section className="rounded-xl border border-warm-card-border overflow-hidden">
          {purchases.length === 0 ? (
            <p className="p-6 text-sm text-warm-muted">No restock orders yet.</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-warm-card-border bg-warm-card/80 text-left text-warm-muted">
                  <th className="p-3">Date</th>
                  <th className="p-3">Items</th>
                  <th className="p-3">Recorded by</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((p) => (
                  <tr key={p.id} className="border-b border-warm-card-border/50">
                    <td className="p-3 text-warm-cream whitespace-nowrap">{formatCanteenDateTime(p.purchaseDate)}</td>
                    <td className="p-3 text-warm-muted">
                      {(p.items || []).map((i) => `${i.product?.name ?? 'Item'} ×${i.quantity}`).join(', ')}
                    </td>
                    <td className="p-3 text-warm-muted">{p.createdBy?.name || '—'}</td>
                    <td className="p-3 text-right font-medium text-warm-cream">{formatCanteenMoney(p.totalCost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {activePanel === 'payments' && (
        <section className="rounded-xl border border-warm-card-border overflow-hidden">
          {payments.length === 0 ? (
            <p className="p-6 text-sm text-warm-muted">No payments yet.</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-warm-card-border bg-warm-card/80 text-left text-warm-muted">
                  <th className="p-3">Date</th>
                  <th className="p-3">Direction</th>
                  <th className="p-3">Note</th>
                  <th className="p-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-warm-card-border/50">
                    <td className="p-3 text-warm-cream whitespace-nowrap">{formatCanteenDateTime(p.paidAt)}</td>
                    <td className="p-3 text-warm-muted">{p.direction === 'WE_PAID_SUPPLIER' ? 'We paid' : 'They paid us'}</td>
                    <td className="p-3 text-warm-muted">{p.note || '—'}</td>
                    <td className="p-3 text-right font-medium text-green-400">{formatCanteenMoney(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {activePanel === 'restock' && (
        <section className="rounded-xl border border-warm-card-border bg-warm-card p-5 space-y-4 max-w-2xl">
          <div>
            <h2 className="text-sm font-medium text-warm-cream">New restock order</h2>
            <p className="mt-1 text-[11px] text-warm-muted">Enter boxes and/or units, then unit cost or total paid for that product.</p>
          </div>
          {parsedRestockLines.map(({ line, product, built }, i) => {
            const touched = line.productId || line.stockBoxes || line.stockUnits || line.unitCost || line.lineTotalPaid;
            const productMissing = !!touched && (!line.productId || !productIds.has(line.productId));
            const qtyTouched = line.stockBoxes !== '' || line.stockUnits !== '';
            const qtyMissing = !!touched && line.productId && !qtyTouched;
            const costTouched = line.unitCost !== '' || line.lineTotalPaid !== '';
            const costMissing = !!touched && line.productId && qtyTouched && !costTouched;
            const qtyInvalid = qtyTouched && line.productId && !parseRestockQuantity(product, line.stockBoxes, line.stockUnits) && costTouched;
            const boxed = product && unitsPerBoxOf(product.unitsPerBox) > 1;

            const patchLine = (patch: Partial<RestockLine>, syncSource?: 'unit' | 'total' | 'qty') => {
              const next = [...restockLines];
              let updated = { ...next[i], ...patch };
              if (syncSource) {
                updated = syncLineCosts(updated, productMap.get(updated.productId), syncSource);
              }
              next[i] = updated;
              setRestockLines(next);
            };

            return (
              <div key={i} className="rounded-lg border border-warm-card-border/60 bg-[#1a1614]/40 p-3 space-y-2">
                <select
                  value={line.productId}
                  onChange={(e) => {
                    const next = [...restockLines];
                    next[i] = { ...emptyRestockLine(), productId: e.target.value };
                    setRestockLines(next);
                  }}
                  className={`${fieldClass} ${productMissing ? 'border-red-500/50' : ''}`}
                >
                  <option value="" disabled className="bg-[#1a1614] text-warm-muted">Select product…</option>
                  {activeProducts.map((p) => (
                    <option key={p.id} value={p.id} className="bg-[#1a1614]">{p.name}</option>
                  ))}
                </select>

                {product && boxed ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-1 block text-[10px] uppercase text-warm-muted/60">Boxes</label>
                      <input
                        value={line.stockBoxes}
                        onChange={(e) => patchLine({ stockBoxes: e.target.value }, 'qty')}
                        placeholder="0"
                        type="number"
                        min="0"
                        step="1"
                        className={fieldClass}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] uppercase text-warm-muted/60">Extra units</label>
                      <input
                        value={line.stockUnits}
                        onChange={(e) => patchLine({ stockUnits: e.target.value }, 'qty')}
                        placeholder="0"
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
                      value={line.stockUnits}
                      onChange={(e) => patchLine({ stockUnits: e.target.value }, 'qty')}
                      placeholder="Quantity"
                      type="number"
                      min="1"
                      step="1"
                      className={fieldClass}
                    />
                  </div>
                )}

                {product && boxed && (
                  <p className="text-[10px] text-warm-muted">1 box = {unitsPerBoxOf(product.unitsPerBox)} units</p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-[10px] uppercase text-warm-muted/60">Cost per unit (PKR)</label>
                    <input
                      value={line.unitCost}
                      onChange={(e) => patchLine({ unitCost: e.target.value }, 'unit')}
                      placeholder="Single piece"
                      type="number"
                      min="0"
                      step="0.01"
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] uppercase text-warm-muted/60">Total paid (PKR)</label>
                    <input
                      value={line.lineTotalPaid}
                      onChange={(e) => patchLine({ lineTotalPaid: e.target.value }, 'total')}
                      placeholder="For this product line"
                      type="number"
                      min="0"
                      step="0.01"
                      className={fieldClass}
                    />
                  </div>
                </div>

                {built && product && (
                  <div className="rounded-lg border border-warm-accent/20 bg-warm-accent/5 px-3 py-2.5 text-xs text-warm-cream">
                    <span className="font-medium text-warm-accent">{formatCanteenMoney(built.lineTotal)}</span>
                    {' '}paid for{' '}
                    <span className="font-medium">
                      {boxed
                        ? formatStockDisplay({
                          stockBoxes: line.stockBoxes.trim() === '' ? 0 : Number(line.stockBoxes),
                          stockUnits: line.stockUnits.trim() === '' ? 0 : Number(line.stockUnits),
                          unitsPerBox: product.unitsPerBox,
                        })
                        : `${built.quantity} unit${built.quantity === 1 ? '' : 's'}`}
                    </span>
                    <span className="text-warm-muted">
                      {' '}({built.quantity} units @ {formatCanteenMoney(built.unitCost)}/unit)
                    </span>
                  </div>
                )}

                {productMissing && <p className="text-[10px] text-red-400">Choose a product</p>}
                {qtyMissing && <p className="text-[10px] text-red-400">Enter boxes and/or units</p>}
                {costMissing && <p className="text-[10px] text-red-400">Enter cost per unit or total paid</p>}
                {qtyInvalid && <p className="text-[10px] text-red-400">Invalid quantity</p>}
              </div>
            );
          })}
          {activeProducts.length === 0 && (
            <p className="text-xs text-warm-muted">No products yet. Add products before restocking.</p>
          )}
          <button type="button" onClick={() => setRestockLines([...restockLines, emptyRestockLine()])} className="text-xs text-warm-accent inline-flex items-center gap-1">
            <Plus size={12} /> Add line
          </button>
          {orderGrandTotal > 0 && (
            <div className="flex items-center justify-between rounded-lg border border-warm-accent/30 bg-warm-accent/5 px-4 py-3">
              <span className="text-xs text-warm-muted">Order total</span>
              <span className="text-base font-medium text-warm-cream">{formatCanteenMoney(orderGrandTotal)}</span>
            </div>
          )}
          <button type="button" disabled={submitting || !hasValidRestockLine || activeProducts.length === 0} onClick={submitRestock} className="w-full rounded-lg bg-warm-accent py-2.5 text-xs font-medium text-[#1a1614] disabled:opacity-50">
            {submitting ? 'Saving…' : 'Save order'}
          </button>
        </section>
      )}

      {activePanel === 'pay' && (
        <section className="rounded-xl border border-warm-card-border bg-warm-card p-5 max-w-md">
          <h2 className="text-sm font-medium text-warm-cream mb-1">Pay supplier</h2>
          <p className="text-xs text-warm-muted mb-4">
            We owe: <span className="text-amber-400 font-medium">{formatCanteenMoney(owed)}</span>
          </p>
          <div className="space-y-3">
            <input value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="Amount (PKR)" type="number" min="0" className={fieldClass} />
            <input value={payNote} onChange={(e) => setPayNote(e.target.value)} placeholder="Note (optional)" className={fieldClass} />
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={submitting} onClick={() => recordPayment()} className="flex-1 rounded-lg bg-warm-accent py-2.5 text-xs font-medium text-[#1a1614] disabled:opacity-50">
                {submitting ? 'Saving…' : 'Save payment'}
              </button>
              {owed > 0 && (
                <button type="button" disabled={submitting} onClick={() => recordPayment(owed)} className="rounded-lg border border-warm-accent/50 px-4 py-2.5 text-xs text-warm-accent disabled:opacity-50">
                  Pay full {formatCanteenMoney(owed)}
                </button>
              )}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
