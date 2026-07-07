'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Plus, Copy, Bell } from 'lucide-react';
import { api } from '@/lib/api';
import { showToast } from '@/components/toast';
import { useAyPermissions } from '@/hooks/use-ay-permissions';
import NumberStepper from '@/components/inputs/number-stepper';

const METHODS = ['CASH', 'CHEQUE', 'BANK_TRANSFER', 'ONLINE'] as const;

export default function UtilitiesPage() {
  const router = useRouter();
  const { canCreate, readOnly } = useAyPermissions('EXPENSES');
  const [bills, setBills] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    categoryId: '', providerName: '', providerId: '', amount: 0,
    paymentMethod: 'CASH', paymentKind: 'REGULAR' as 'REGULAR' | 'EXTRA',
    consumerNumber: '', billReference: '', periodStart: '', periodEnd: '', note: '',
    saveProvider: false, reminderDayOfMonth: '',
  });
  const [newCat, setNewCat] = useState('');

  const load = useCallback(async () => {
    const [b, c, p, r] = await Promise.all([
      api.getUtilityBills(),
      api.getUtilityCategories(),
      api.getUtilityProviders(),
      api.getUtilityReminders(),
    ]);
    if (b.success) setBills(b.data || []);
    if (c.success) setCategories(c.data || []);
    if (p.success) setProviders(p.data || []);
    if (r.success) setReminders(r.data || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!form.categoryId || !form.providerName.trim() || form.amount <= 0) {
      showToast('error', 'Category, provider, and amount are required');
      return;
    }
    setSaving(true);
    try {
      const res = await api.recordUtilityBill({
        ...form,
        providerId: form.providerId || undefined,
        saveProvider: form.saveProvider,
        reminderDayOfMonth: form.reminderDayOfMonth ? parseInt(form.reminderDayOfMonth, 10) : undefined,
      });
      if (res.success) {
        showToast('success', 'Utility bill recorded');
        setShowForm(false);
        load();
      }
    } catch (e: any) {
      showToast('error', e.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const duplicateBill = async (providerId: string) => {
    try {
      const res = await api.duplicateUtilityBill(providerId);
      if (res.success) {
        showToast('success', 'Bill duplicated from last payment');
        load();
      }
    } catch (e: any) {
      showToast('error', e.message || 'No previous bill to duplicate');
    }
  };

  const addCategory = async () => {
    if (!newCat.trim()) return;
    await api.createUtilityCategory(newCat.trim());
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
          <h1 className="text-xl font-light text-warm-cream">Utility Bills</h1>
          <p className="text-xs text-warm-muted">Electricity, water, gas, internet, and other utilities</p>
        </div>
        {canCreate && (
        <button type="button" onClick={() => setShowForm(true)} className="flex items-center gap-1 rounded-lg bg-warm-accent px-3 py-2 text-xs text-black">
          <Plus size={14} /> Record bill
        </button>
        )}
      </div>

      {readOnly && (
        <p className="mb-4 rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-3 py-2 text-[11px] text-yellow-300">
          Archived year — read-only. Recording utility bills requires archived create permission.
        </p>
      )}

      {reminders.length > 0 && (
        <div className="mb-4 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
          <p className="mb-2 flex items-center gap-1 text-xs font-medium text-blue-300"><Bell size={13} /> Bill reminders</p>
          <div className="flex flex-wrap gap-2">
            {reminders.map((p) => (
              <span key={p.id} className={`rounded-full border px-2 py-0.5 text-[10px] ${p.isDueSoon ? 'border-amber-500/40 text-amber-300' : 'border-warm-card-border text-warm-muted'}`}>
                {p.name} — day {p.reminderDayOfMonth}
                {p.typicalAmount != null && ` · ~${Number(p.typicalAmount).toLocaleString()}`}
              </span>
            ))}
          </div>
        </div>
      )}

      {providers.length > 0 && (
        <div className="mb-4 rounded-xl border border-warm-card-border bg-warm-card/40 p-4">
          <p className="mb-2 text-xs text-warm-muted">Saved providers — duplicate last bill</p>
          <div className="flex flex-wrap gap-2">
            {providers.map((p) => (
              <button key={p.id} type="button" disabled={!canCreate} onClick={() => duplicateBill(p.id)} className="flex items-center gap-1 rounded-lg border border-warm-card-border px-2 py-1 text-[10px] text-warm-muted hover:text-warm-cream disabled:opacity-40">
                <Copy size={11} /> {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6 rounded-xl border border-warm-card-border bg-warm-card p-4">
        <p className="mb-2 text-xs text-warm-muted">Categories</p>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <span key={c.id} className={`rounded-full border px-2 py-0.5 text-[10px] ${c.isActive ? 'border-warm-accent/40 text-warm-cream' : 'border-warm-card-border text-warm-muted line-through'}`}>{c.name}</span>
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
              <th className="px-3 py-2">Provider</th>
              <th className="px-3 py-2">Kind</th>
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2">Voucher</th>
            </tr>
          </thead>
          <tbody>
            {bills.map((b) => (
              <tr key={b.id} className="border-b border-warm-card-border/50">
                <td className="px-3 py-2 text-warm-muted">{new Date(b.paidAt).toLocaleDateString()}</td>
                <td className="px-3 py-2">{b.utilityDetail?.category?.name}</td>
                <td className="px-3 py-2 text-warm-cream">{b.utilityDetail?.providerName}</td>
                <td className="px-3 py-2">{b.utilityDetail?.paymentKind}</td>
                <td className="px-3 py-2">{Number(b.amount).toLocaleString()}</td>
                <td className="px-3 py-2">
                  <button type="button" onClick={() => router.push(`/admin/expenses/vouchers/${b.id}`)} className="text-warm-accent hover:underline">
                    {b.voucherNumber}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-warm-card-border bg-[#1a1614] p-5">
            <h2 className="mb-4 text-sm text-warm-cream">Record utility bill</h2>
            <div className="space-y-3">
              <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream">
                <option value="">Select category</option>
                {categories.filter((c) => c.isActive).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select value={form.providerId} onChange={(e) => {
                const p = providers.find((x) => x.id === e.target.value);
                setForm({
                  ...form,
                  providerId: e.target.value,
                  providerName: p?.name || form.providerName,
                  consumerNumber: p?.consumerNumber || form.consumerNumber,
                  amount: p?.typicalAmount ? Number(p.typicalAmount) : form.amount,
                });
              }} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream">
                <option value="">Saved provider (optional)</option>
                {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input value={form.providerName} onChange={(e) => setForm({ ...form, providerName: e.target.value })} placeholder="Provider name *" className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream" />
              <label className="flex items-center gap-2 text-xs text-warm-muted">
                <input type="checkbox" checked={form.saveProvider} onChange={(e) => setForm({ ...form, saveProvider: e.target.checked })} />
                Save as new provider for future bills
              </label>
              {form.saveProvider && (
                <input type="number" min={1} max={31} value={form.reminderDayOfMonth} onChange={(e) => setForm({ ...form, reminderDayOfMonth: e.target.value })} placeholder="Reminder day of month (1–31)" className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream" />
              )}
              <NumberStepper value={form.amount} onChange={(v: number) => setForm({ ...form, amount: v })} min={0} step={100} />
              <select value={form.paymentKind} onChange={(e) => setForm({ ...form, paymentKind: e.target.value as 'REGULAR' | 'EXTRA' })} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream">
                <option value="REGULAR">Regular bill</option>
                <option value="EXTRA">Extra payment</option>
              </select>
              <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream">
                {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <input value={form.consumerNumber} onChange={(e) => setForm({ ...form, consumerNumber: e.target.value })} placeholder="Consumer / account number" className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream" />
              <input value={form.billReference} onChange={(e) => setForm({ ...form, billReference: e.target.value })} placeholder="Bill reference" className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream" />
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
