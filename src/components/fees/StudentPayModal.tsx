'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save } from 'lucide-react';
import { showToast } from '@/components/toast';
import config from '@/config';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

type Props = {
  studentId: string;
  open: boolean;
  onClose: () => void;
  token: string | null;
  ayId: string | null;
};

export default function StudentPayModal({ studentId, open, onClose, token, ayId }: Props) {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState('CASH');
  const [payRef, setPayRef] = useState('');

  useEffect(() => {
    if (!open || !token || !studentId || !ayId) return;
    setPayAmount(0);
    setPayMethod('CASH');
    setPayRef('');
    setLoading(true);
    fetch(`${config.apiUrl}/admin/students/${studentId}/fee?academicYearId=${ayId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(json => { if (json.success) setData(json.data); })
      .catch(() => showToast('error', 'Failed to load student fees'))
      .finally(() => setLoading(false));
  }, [open, token, studentId, ayId]);

  if (!open) return null;

  const fees = data?.studentFees || [];
  const getExtraTotal = (sf: any) => (sf.extraItems || []).reduce((s: number, e: any) => s + e.amount, 0);
  const getMonthDue = (sf: any) => sf.netAmount + getExtraTotal(sf) - sf.paidAmount;
  const totalRemainingPaise = fees.reduce((s: number, f: any) => s + getMonthDue(f), 0);
  const totalRemainingPkr = totalRemainingPaise / 100;

  const handleGoToAllocate = () => {
    if (!studentId || payAmount <= 0) return;
    const amountPaise = Math.round(payAmount * 100);
    if (amountPaise > totalRemainingPaise) {
      showToast('error', `Amount exceeds total due (${totalRemainingPkr.toLocaleString()} PKR)`);
      return;
    }
    sessionStorage.setItem(`pendingPayment:${studentId}`, JSON.stringify({
      amountPaise, paymentMethod: payMethod, reference: payRef,
    }));
    onClose();
    router.push(`/admin/fees/student/${studentId}/allocate`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="rounded-xl border border-warm-card-border bg-[#24201e] p-6 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
        {loading ? (
          <p className="text-xs text-warm-muted/60 py-4 text-center">Loading fees...</p>
        ) : (
          <>
            <h3 className="text-sm font-medium text-warm-cream mb-1">Record Payment</h3>
            <p className="text-xs text-warm-muted/50 mb-1">{data?.name || 'Student'}</p>
            <p className="text-xs text-warm-muted/50 mb-4">
              Total remaining: <strong className="text-warm-accent">{totalRemainingPkr.toLocaleString()} PKR</strong>
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-warm-muted/60 uppercase tracking-wider mb-1">Amount (PKR)</label>
                <input type="number" value={payAmount || ''} onChange={e => setPayAmount(Math.max(0, Math.min(Number(e.target.value) || 0, totalRemainingPkr)))}
                  className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" />
                {payAmount > 0 && totalRemainingPkr > 0 && (
                  <p className="text-[10px] text-green-400/60 mt-1">{((payAmount / totalRemainingPkr) * 100).toFixed(0)}% of dues</p>
                )}
              </div>
              <div>
                <label className="block text-[10px] text-warm-muted/60 uppercase tracking-wider mb-1">Method</label>
                <select value={payMethod} onChange={e => setPayMethod(e.target.value)}
                  className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent">
                  <option value="CASH">Cash</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-warm-muted/60 uppercase tracking-wider mb-1">Cheque # / Transaction ID</label>
                <input value={payRef} onChange={e => setPayRef(e.target.value)}
                  className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" placeholder="Optional reference number" />
              </div>
              {payAmount > 0 && (
                <div className="rounded-lg bg-warm-card/50 p-3">
                  <p className="text-[10px] text-warm-muted/60 uppercase tracking-wider mb-1.5">Will Clear (oldest first)</p>
                  {(() => {
                    let remaining = payAmount * 100;
                    return [...fees].reverse().filter((f: any) => f.netAmount + getExtraTotal(f) - f.paidAmount > 0).map((f: any) => {
                      const due = getMonthDue(f);
                      const alloc = Math.min(remaining, due);
                      if (alloc <= 0) return null;
                      remaining -= alloc;
                      return (
                        <div key={f.id} className="flex justify-between text-xs mb-0.5">
                          <span className="text-warm-muted/70">{MONTHS[(f.month || 1) - 1]} {f.year}</span>
                          <span className="text-green-400">{(alloc / 100).toLocaleString()}</span>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={handleGoToAllocate} disabled={payAmount <= 0 || totalRemainingPaise <= 0}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-warm-accent py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] disabled:opacity-50 transition-colors">
                <Save size={13} /> Next
              </button>
              <button onClick={onClose} className="rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream transition-colors">Cancel</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
