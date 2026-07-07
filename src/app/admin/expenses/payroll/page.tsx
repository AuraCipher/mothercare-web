'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Plus, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { showToast } from '@/components/toast';
import NumberStepper from '@/components/inputs/number-stepper';

const METHODS = ['CASH', 'CHEQUE', 'BANK_TRANSFER', 'ONLINE'] as const;

export default function PayrollPage() {
  const router = useRouter();
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payModal, setPayModal] = useState<any | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState<string>('CASH');
  const [payKind, setPayKind] = useState<'REGULAR' | 'EXTRA'>('REGULAR');
  const [payNote, setPayNote] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getPayrollList(month);
      if (res.success) setRows(res.data || []);
    } catch {
      showToast('error', 'Failed to load payroll');
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => { load(); }, [load]);

  const openPay = (row: any, kind: 'REGULAR' | 'EXTRA') => {
    setPayModal(row);
    setPayKind(kind);
    const suggested = kind === 'REGULAR'
      ? Math.max(0, Number(row.closingBalance ?? row.remainingToPay ?? 0))
      : 0;
    setPayAmount(suggested);
    setPayMethod('CASH');
    setPayNote('');
  };

  const submitPay = async () => {
    if (!payModal || payAmount <= 0) return;
    setSaving(true);
    try {
      const res = await api.recordPayrollPayment({
        payeeUserId: payModal.userId,
        salaryMonth: month,
        amount: payAmount,
        paymentMethod: payMethod,
        paymentKind: payKind,
        note: payNote || undefined,
      });
      if (res.success) {
        showToast('success', `Payment recorded (${res.data?.voucherNumber || ''})`);
        setPayModal(null);
        load();
      } else {
        showToast('error', (res as any).message || 'Failed');
      }
    } catch (e: any) {
      showToast('error', e.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <button type="button" onClick={() => router.push('/admin/expenses')} className="mb-4 flex items-center gap-1 text-xs text-warm-muted hover:text-warm-cream">
        <ChevronLeft size={14} /> Payments
      </button>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-light text-warm-cream">Pays</h1>
          <p className="text-xs text-warm-muted">Attendance-based salary · partial payments · balance carries forward</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream" />
          <button type="button" onClick={load} className="rounded-lg border border-warm-card-border p-2 text-warm-muted hover:text-warm-cream">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-warm-muted">Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-warm-card-border">
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead className="border-b border-warm-card-border bg-warm-card/60 text-warm-muted">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Profile salary</th>
                <th className="px-3 py-2">Earned</th>
                <th className="px-3 py-2">Opening</th>
                <th className="px-3 py-2">Paid</th>
                <th className="px-3 py-2">Balance</th>
                <th className="px-3 py-2">Missing att.</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.userId} className="border-b border-warm-card-border/50">
                  <td className="px-3 py-2 text-warm-cream">{r.name}</td>
                  <td className="px-3 py-2 text-warm-muted">{r.payeeType} · {r.branchRole}</td>
                  <td className="px-3 py-2">{Number(r.profileSalary).toLocaleString()}</td>
                  <td className="px-3 py-2">{Number(r.attendanceEarned ?? 0).toLocaleString()}</td>
                  <td className="px-3 py-2">{Number(r.openingBalance ?? 0).toLocaleString()}</td>
                  <td className="px-3 py-2">{Number(r.totalPaid ?? 0).toLocaleString()}</td>
                  <td className={`px-3 py-2 font-medium ${Number(r.closingBalance) < 0 ? 'text-red-400' : Number(r.closingBalance) > 0 ? 'text-amber-400' : 'text-green-400'}`}>
                    {Number(r.closingBalance ?? 0).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-warm-muted">{r.unmarkedDays ?? 0} unmarked</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <button type="button" onClick={() => openPay(r, 'REGULAR')} className="rounded border border-warm-card-border px-2 py-1 text-[10px] hover:border-warm-accent/50">Pay</button>
                      <button type="button" onClick={() => openPay(r, 'EXTRA')} className="rounded border border-warm-card-border px-2 py-1 text-[10px] hover:border-warm-accent/50">Extra</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {payModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-warm-card-border bg-[#1a1614] p-5">
            <h2 className="mb-1 text-sm text-warm-cream">{payKind === 'EXTRA' ? 'Extra payment' : 'Record payment'} — {payModal.name}</h2>
            <p className="mb-4 text-[11px] text-warm-muted">
              Balance: {Number(payModal.closingBalance ?? 0).toLocaleString()} · Earned: {Number(payModal.attendanceEarned ?? 0).toLocaleString()}
            </p>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-warm-muted">Amount</label>
                <NumberStepper value={payAmount} onChange={setPayAmount} min={0} step={100} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-warm-muted">Method</label>
                <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream">
                  {METHODS.map((m) => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-warm-muted">Note</label>
                <input value={payNote} onChange={(e) => setPayNote(e.target.value)} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream" />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setPayModal(null)} className="rounded-lg border border-warm-card-border px-3 py-2 text-xs text-warm-muted">Cancel</button>
              <button type="button" disabled={saving} onClick={submitPay} className="flex items-center gap-1 rounded-lg bg-warm-accent px-3 py-2 text-xs text-black disabled:opacity-50">
                <Plus size={14} /> {saving ? 'Saving…' : 'Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
