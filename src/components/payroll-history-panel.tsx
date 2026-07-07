'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { showToast } from '@/components/toast';
import { useAyPermissions } from '@/hooks/use-ay-permissions';
import NumberStepper from '@/components/inputs/number-stepper';

const METHODS = ['CASH', 'CHEQUE', 'BANK_TRANSFER', 'ONLINE'] as const;

type Props = {
  userId: string;
  payeeName?: string;
};

export default function PayrollHistoryPanel({ userId, payeeName }: Props) {
  const { canCreate } = useAyPermissions('EXPENSES');
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any | null>(null);
  const [payModal, setPayModal] = useState<{ month: string; kind: 'REGULAR' | 'EXTRA'; closingBalance: number; attendanceEarned: number } | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState('CASH');
  const [payNote, setPayNote] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getPayrollPayeeProfile(userId, 12);
      if (res.success) setProfile(res.data);
    } catch {
      showToast('error', 'Failed to load payment history');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const openPay = (month: string, closingBalance: number, attendanceEarned: number, kind: 'REGULAR' | 'EXTRA') => {
    setPayModal({ month, kind, closingBalance, attendanceEarned });
    setPayAmount(kind === 'REGULAR' ? Math.max(0, closingBalance) : 0);
    setPayMethod('CASH');
    setPayNote('');
  };

  const submitPay = async () => {
    if (!payModal || payAmount <= 0) return;
    setSaving(true);
    try {
      const res = await api.recordPayrollPayment({
        payeeUserId: userId,
        salaryMonth: payModal.month,
        amount: payAmount,
        paymentMethod: payMethod,
        paymentKind: payModal.kind,
        note: payNote || undefined,
      });
      if (res.success) {
        showToast('success', `Payment recorded (${(res as any).data?.voucherNumber || ''})`);
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

  if (loading) return <p className="text-xs text-warm-muted">Loading payments…</p>;
  if (!profile) return <p className="text-xs text-warm-muted">Not on payroll list for this branch.</p>;

  const name = payeeName || profile.payee?.name || 'Payee';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-warm-muted">
          {profile.payee?.payeeType} · Profile salary {Number(profile.payee?.profileSalary ?? 0).toLocaleString()}
        </p>
        <button type="button" onClick={load} className="rounded border border-warm-card-border p-1.5 text-warm-muted hover:text-warm-cream">
          <RefreshCw size={14} />
        </button>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-medium text-warm-cream">Monthly balances</h3>
        <div className="overflow-x-auto rounded-lg border border-warm-card-border">
          <table className="w-full min-w-[640px] text-left text-[11px]">
            <thead className="border-b border-warm-card-border bg-warm-card/50 text-warm-muted">
              <tr>
                <th className="px-2 py-1.5">Month</th>
                <th className="px-2 py-1.5">Earned</th>
                <th className="px-2 py-1.5">Opening</th>
                <th className="px-2 py-1.5">Paid</th>
                <th className="px-2 py-1.5">Balance</th>
                <th className="px-2 py-1.5">Missing att.</th>
                <th className="px-2 py-1.5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(profile.months || []).map((m: any) => (
                <tr key={m.salaryMonth} className="border-b border-warm-card-border/40">
                  <td className="px-2 py-1.5 text-warm-cream">{m.salaryMonth}</td>
                  <td className="px-2 py-1.5">{Number(m.attendanceEarned).toLocaleString()}</td>
                  <td className="px-2 py-1.5">{Number(m.openingBalance).toLocaleString()}</td>
                  <td className="px-2 py-1.5">{Number(m.totalPaid).toLocaleString()}</td>
                  <td className={`px-2 py-1.5 font-medium ${Number(m.closingBalance) < 0 ? 'text-red-400' : Number(m.closingBalance) > 0 ? 'text-amber-400' : 'text-green-400'}`}>
                    {Number(m.closingBalance).toLocaleString()}
                  </td>
                  <td className="px-2 py-1.5 text-warm-muted">{m.unmarkedDays ?? 0}</td>
                  <td className="px-2 py-1.5">
                    {canCreate ? (
                    <div className="flex gap-1">
                      <button type="button" onClick={() => openPay(m.salaryMonth, Number(m.closingBalance), Number(m.attendanceEarned), 'REGULAR')} className="rounded border border-warm-card-border px-1.5 py-0.5 text-[10px] hover:border-warm-accent/50">Pay</button>
                      <button type="button" onClick={() => openPay(m.salaryMonth, Number(m.closingBalance), Number(m.attendanceEarned), 'EXTRA')} className="rounded border border-warm-card-border px-1.5 py-0.5 text-[10px] hover:border-warm-accent/50">Extra</button>
                    </div>
                    ) : <span className="text-warm-muted">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-medium text-warm-cream">Payment history</h3>
        {(profile.payments || []).length === 0 ? (
          <p className="text-xs text-warm-muted">No payments recorded yet.</p>
        ) : (
          <div className="space-y-1">
            {profile.payments.map((p: any) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-warm-card-border/40 px-2 py-1.5 text-[11px]">
                <span className="text-warm-cream">{p.salaryMonth} · {p.voucherNumber}</span>
                <span className="text-warm-muted">{p.paymentKind} · {p.paymentMethod?.replace('_', ' ')}</span>
                <span className="font-medium text-warm-cream">{Number(p.amount).toLocaleString()}</span>
                <span className="text-warm-muted">{new Date(p.paidAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {payModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-warm-card-border bg-[#1a1614] p-5">
            <h2 className="mb-1 text-sm text-warm-cream">
              {payModal.kind === 'EXTRA' ? 'Extra payment' : 'Record payment'} — {name}
            </h2>
            <p className="mb-4 text-[11px] text-warm-muted">
              {payModal.month} · Balance: {payModal.closingBalance.toLocaleString()} · Earned: {payModal.attendanceEarned.toLocaleString()}
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
    </div>
  );
}
