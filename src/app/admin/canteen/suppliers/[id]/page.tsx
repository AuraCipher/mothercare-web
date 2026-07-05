'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, Package, Plus, Truck, Wallet } from 'lucide-react';
import { api } from '@/lib/api';
import { formatCanteenDateTime, formatCanteenMoney } from '@/lib/canteen';
import { showToast } from '@/components/toast';

const fieldClass =
  'w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent';

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
  const [restockLines, setRestockLines] = useState([{ productId: '', quantity: '1', unitCost: '' }]);
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
      .filter((l) => l.productId && l.quantity && l.unitCost)
      .map((l) => ({
        productId: l.productId,
        quantity: Number(l.quantity),
        unitCost: Number(l.unitCost),
      }));
    if (!items.length) {
      showToast('error', 'Add at least one product line');
      return;
    }
    setSubmitting(true);
    try {
      await api.createCanteenRestock({ supplierId: id, items, paidImmediately: false });
      showToast('success', 'Restock order recorded');
      setRestockLines([{ productId: '', quantity: '1', unitCost: '' }]);
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
        <section className="rounded-xl border border-warm-card-border bg-warm-card p-5 space-y-3 max-w-lg">
          <h2 className="text-sm font-medium text-warm-cream">New restock order</h2>
          {restockLines.map((line, i) => (
            <div key={i} className="grid grid-cols-3 gap-2">
              <select
                value={line.productId}
                onChange={(e) => {
                  const next = [...restockLines];
                  next[i].productId = e.target.value;
                  setRestockLines(next);
                }}
                className={`col-span-1 ${fieldClass}`}
              >
                <option value="" className="bg-[#1a1614]">Product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#1a1614]">{p.name}</option>
                ))}
              </select>
              <input value={line.quantity} onChange={(e) => { const n = [...restockLines]; n[i].quantity = e.target.value; setRestockLines(n); }} placeholder="Qty" className={fieldClass} />
              <input value={line.unitCost} onChange={(e) => { const n = [...restockLines]; n[i].unitCost = e.target.value; setRestockLines(n); }} placeholder="Unit cost" className={fieldClass} />
            </div>
          ))}
          <button type="button" onClick={() => setRestockLines([...restockLines, { productId: '', quantity: '1', unitCost: '' }])} className="text-xs text-warm-accent inline-flex items-center gap-1">
            <Plus size={12} /> Add line
          </button>
          <button type="button" disabled={submitting} onClick={submitRestock} className="w-full rounded-lg bg-warm-accent py-2.5 text-xs font-medium text-[#1a1614] disabled:opacity-50">
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
