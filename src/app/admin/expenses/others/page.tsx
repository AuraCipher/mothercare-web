'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { showToast } from '@/components/toast';
import { useAyPermissions } from '@/hooks/use-ay-permissions';
import NumberStepper from '@/components/inputs/number-stepper';

const METHODS = ['CASH', 'CHEQUE', 'BANK_TRANSFER', 'ONLINE'] as const;

export default function OthersPage() {
  const router = useRouter();
  const { canCreate, readOnly } = useAyPermissions('EXPENSES');
  const [payments, setPayments] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    categoryId: '', payeeName: '', amount: 0, description: '',
    paymentMethod: 'CASH', paymentKind: 'REGULAR' as 'REGULAR' | 'EXTRA', note: '',
  });
  const [newCat, setNewCat] = useState('');

  const load = useCallback(async () => {
    const [p, c] = await Promise.all([api.getOtherPayments(), api.getOtherCategories()]);
    if (p.success) setPayments(p.data || []);
    if (c.success) setCategories(c.data || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!form.categoryId || !form.payeeName.trim() || form.amount <= 0) {
      showToast('error', 'Category, payee, and amount are required');
      return;
    }
    setSaving(true);
    try {
      const res = await api.recordOtherPayment(form);
      if (res.success) {
        showToast('success', 'Payment recorded');
        setShowForm(false);
        load();
      }
    } catch (e: any) {
      showToast('error', e.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const addCategory = async () => {
    if (!newCat.trim()) return;
    await api.createOtherCategory(newCat.trim());
    setNewCat('');
    load();
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <button type="button" onClick={() => router.push('/admin/expenses')} className="mb-4 flex items-center gap-1 text-xs text-warm-muted hover:text-warm-cream">
        <ChevronLeft size={14} /> Payments
      </button>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-light text-warm-cream">Other Payments</h1>
          <p className="text-xs text-warm-muted">Maintenance, repairs, transport, and miscellaneous</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => router.push('/admin/expenses/reports')} className="rounded-lg border border-warm-card-border px-2 py-2 text-[10px] text-warm-muted hover:text-warm-cream">
            Reports
          </button>
          {canCreate && (
          <button type="button" onClick={() => setShowForm(true)} className="flex items-center gap-1 rounded-lg bg-warm-accent px-3 py-2 text-xs text-black">
            <Plus size={14} /> Record payment
          </button>
          )}
        </div>
      </div>

      {readOnly && (
        <p className="mb-4 rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-3 py-2 text-[11px] text-yellow-300">
          Archived year — read-only. Recording other payments requires archived create permission.
        </p>
      )}

      <div className="mb-6 rounded-xl border border-warm-card-border bg-warm-card p-4">
        <p className="mb-2 text-xs text-warm-muted">Categories</p>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <span key={c.id} className="rounded-full border border-warm-accent/40 px-2 py-0.5 text-[10px] text-warm-cream">{c.name}</span>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="New category" className="rounded border border-warm-card-border bg-[#1a1614] px-2 py-1 text-xs text-warm-cream" />
          <button type="button" onClick={addCategory} className="rounded border border-warm-card-border px-2 py-1 text-xs text-warm-muted">Add</button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-warm-card-border">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-warm-card-border bg-warm-card/60 text-warm-muted">
            <tr>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2">Payee</th>
              <th className="px-3 py-2">Kind</th>
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2">Voucher</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-b border-warm-card-border/50">
                <td className="px-3 py-2 text-warm-muted">{new Date(p.paidAt).toLocaleDateString()}</td>
                <td className="px-3 py-2">{p.otherDetail?.category?.name}</td>
                <td className="px-3 py-2 text-warm-cream">{p.otherDetail?.payeeName}</td>
                <td className="px-3 py-2">{p.otherDetail?.paymentKind}</td>
                <td className="px-3 py-2">{Number(p.amount).toLocaleString()}</td>
                <td className="px-3 py-2">
                  <button type="button" onClick={() => router.push(`/admin/expenses/vouchers/${p.id}`)} className="text-warm-accent hover:underline">
                    {p.voucherNumber}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-warm-card-border bg-[#1a1614] p-5">
            <h2 className="mb-4 text-sm text-warm-cream">Record other payment</h2>
            <div className="space-y-3">
              <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream">
                <option value="">Select category</option>
                {categories.filter((c) => c.isActive).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input value={form.payeeName} onChange={(e) => setForm({ ...form, payeeName: e.target.value })} placeholder="Payee name *" className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream" />
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream" />
              <NumberStepper value={form.amount} onChange={(v: number) => setForm({ ...form, amount: v })} min={0} step={100} />
              <select value={form.paymentKind} onChange={(e) => setForm({ ...form, paymentKind: e.target.value as 'REGULAR' | 'EXTRA' })} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream">
                <option value="REGULAR">Regular</option>
                <option value="EXTRA">Extra payment</option>
              </select>
              <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream">
                {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-warm-card-border px-3 py-2 text-xs text-warm-muted">Cancel</button>
              <button type="button" disabled={saving} onClick={submit} className="rounded-lg bg-warm-accent px-3 py-2 text-xs text-black">{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
