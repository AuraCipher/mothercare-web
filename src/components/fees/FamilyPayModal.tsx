'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save } from 'lucide-react';
import { showToast } from '@/components/toast';
import config from '@/config';
import { getFeeMonthDue } from '@/lib/feeAllocate';
import NumberStepper from '@/components/inputs/number-stepper';

type Props = {
  familyId: string;
  open: boolean;
  onClose: () => void;
  token: string | null;
  ayId: string | null;
};

export default function FamilyPayModal({ familyId, open, onClose, token, ayId }: Props) {
  const router = useRouter();
  const [family, setFamily] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState('CASH');
  const [payRef, setPayRef] = useState('');

  useEffect(() => {
    if (!open || !token || !familyId || !ayId) return;
    setPayAmount(0);
    setPayMethod('CASH');
    setPayRef('');
    setLoading(true);
    fetch(`${config.apiUrl}/admin/families/${familyId}?academicYearId=${ayId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(json => { if (json.success) setFamily(json.data); })
      .catch(() => showToast('error', 'Failed to load family fees'))
      .finally(() => setLoading(false));
  }, [open, token, familyId, ayId]);

  if (!open) return null;

  const students = family?.students || [];
  const totalRemainingPaise = students.reduce((sum: number, s: any) => {
    const fees = s.studentFees || [];
    return sum + fees.reduce((fs: number, f: any) => fs + (f.remainingPaise ?? getFeeMonthDue(f)), 0);
  }, 0);
  const totalRemainingPkr = totalRemainingPaise / 100;

  const handleGoToAllocate = () => {
    if (!familyId || payAmount <= 0) return;
    const amountPaise = Math.round(payAmount * 100);
    if (amountPaise > totalRemainingPaise) {
      showToast('error', `Amount exceeds total due (${totalRemainingPkr.toLocaleString()} PKR)`);
      return;
    }
    sessionStorage.setItem(`pendingFamilyPayment:${familyId}`, JSON.stringify({
      amountPaise, paymentMethod: payMethod, reference: payRef,
    }));
    onClose();
    router.push(`/admin/fees/families/${familyId}/allocate`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="rounded-xl border border-warm-card-border bg-[#24201e] p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        {loading ? (
          <p className="text-xs text-warm-muted/60 py-4 text-center">Loading family fees…</p>
        ) : (
          <>
            <h3 className="text-sm font-medium text-warm-cream mb-1">Family Payment</h3>
            <p className="text-xs text-warm-muted/50 mb-1">{family?.name || 'Family'}</p>
            <p className="text-xs text-warm-muted/50 mb-3">
              {students.length} student{students.length !== 1 ? 's' : ''} · Total due:{' '}
              <strong className="text-warm-accent">{totalRemainingPkr.toLocaleString()} PKR</strong>
            </p>

            {students.length > 0 && (
              <div className="rounded-lg bg-warm-card/40 p-3 mb-4 max-h-32 overflow-y-auto space-y-1">
                {students.map((s: any) => {
                  const due = (s.totalDuePaise ?? 0) / 100;
                  if (due <= 0) return null;
                  return (
                    <div key={s.id} className="flex justify-between text-[11px]">
                      <span className="text-warm-muted/70 truncate">{s.name}</span>
                      <span className="text-red-400/80 shrink-0 ml-2">{due.toLocaleString()} due</span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-warm-muted/60 uppercase tracking-wider mb-1">Amount (PKR)</label>
                <NumberStepper
                  value={payAmount || 0}
                  onChange={(n) => setPayAmount(Math.max(0, Math.min(n, totalRemainingPkr)))}
                  step={100}
                  containerClassName="inline-flex w-full items-center justify-between gap-2"
                  inputClassName="h-9 flex-1 rounded-lg border border-warm-card-border bg-[#1a1614] px-3 text-sm text-warm-cream text-center outline-none focus:border-warm-accent"
                />
              </div>
              <div>
                <label className="block text-[10px] text-warm-muted/60 uppercase tracking-wider mb-1">Method</label>
                <select
                  value={payMethod}
                  onChange={e => setPayMethod(e.target.value)}
                  className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent"
                >
                  <option value="CASH">Cash</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-warm-muted/60 uppercase tracking-wider mb-1">Cheque # / Transaction ID</label>
                <input
                  value={payRef}
                  onChange={e => setPayRef(e.target.value)}
                  className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent"
                  placeholder="Optional reference number"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={handleGoToAllocate}
                disabled={payAmount <= 0 || totalRemainingPaise <= 0}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-warm-accent py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] disabled:opacity-50 transition-colors"
              >
                <Save size={13} /> Next — Allocate
              </button>
              <button onClick={onClose} className="rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream transition-colors">
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
