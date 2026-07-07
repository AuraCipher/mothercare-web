'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { showToast } from '@/components/toast';
import { ArrowLeft, Save, Printer, Download, ChevronDown } from 'lucide-react';
import config from '@/config';
import { printReceipt as upgradedPrintReceipt, downloadReceipt, receiptDataFromSnapshot } from '@/lib/receipt';
import {
  buildAllocateItemsForStudent,
  isAllocateItemPaid,
  isAllocateItemSelectable,
  itemStickerPaise,
  type AllocateItem,
} from '@/lib/feeAllocate';

type Item = AllocateItem;

export default function AllocatePaymentPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const ayId = typeof window !== 'undefined' ? localStorage.getItem('activeAYId') : null;

  const [pending, setPending] = useState<{ amountPaise: number; paymentMethod: string; reference: string } | null>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [currentMonthOpen, setCurrentMonthOpen] = useState(true);

  // ─── Load the pending payment (amount/method/reference from Step 0) ──
  useEffect(() => {
    const raw = sessionStorage.getItem(`pendingPayment:${studentId}`);
    if (!raw) {
      showToast('error', 'No pending payment found — start from the student page');
      router.replace(`/admin/fees/student/${studentId}`);
      return;
    }
    setPending(JSON.parse(raw));
  }, [studentId]);

  // ─── Load student fee data ────────────────────────────────────────
  useEffect(() => {
    if (!token || !studentId || !ayId) return;
    fetch(`${config.apiUrl}/admin/students/${studentId}/fee?academicYearId=${ayId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(json => { if (json.success) setData(json.data); })
      .finally(() => setLoading(false));
  }, [studentId, token, ayId]);

  const { currentMonthItems, previousItems, currentMonthLabel } = useMemo(() => {
    if (!data) return { currentMonthItems: [] as Item[], previousItems: [] as Item[], currentMonthLabel: '' };
    return buildAllocateItemsForStudent(studentId, data.name || 'Student', data.studentFees || []);
  }, [data, studentId]);

  const isItemPaid = isAllocateItemPaid;
  const isItemSelectable = isAllocateItemSelectable;

  // All selectable items (exclude already-paid heads/extras)
  const selectableItems: Item[] = useMemo(
    () => [...previousItems, ...currentMonthItems.filter(isItemSelectable)],
    [previousItems, currentMonthItems],
  );

  const amountToPay = pending?.amountPaise || 0;

  // ─── Auto-select on load — only unpaid heads/months ─────────────────
  useEffect(() => {
    if (selectableItems.length === 0 || !pending) return;
    const auto = new Set<string>();
    let running = 0;
    for (const item of selectableItems) {
      if (running >= amountToPay) break;
      auto.add(item.key);
      running += item.duePaise;
    }
    setChecked(auto);
  }, [selectableItems.length, pending?.amountPaise]);

  // ─── Funded amount per checked item ──────────────────────────────────
  const { fundedByKey, selectedDueSum, fundedTotal } = useMemo(() => {
    const funded = new Map<string, number>();
    let running = 0;
    let dueSum = 0;
    for (const item of selectableItems) {
      if (!checked.has(item.key)) continue;
      dueSum += item.duePaise;
      const room = Math.max(0, amountToPay - running);
      const thisFunded = Math.min(item.duePaise, room);
      funded.set(item.key, thisFunded);
      running += thisFunded;
    }
    return { fundedByKey: funded, selectedDueSum: dueSum, fundedTotal: running };
  }, [selectableItems, checked, amountToPay]);

  const capReached = selectedDueSum >= amountToPay;
  const canSubmit = fundedTotal >= amountToPay && amountToPay > 0;

  const toggle = (item: Item) => {
    if (isItemPaid(item)) return;
    if (checked.has(item.key)) {
      const next = new Set(checked);
      next.delete(item.key);
      setChecked(next);
      return;
    }
    if (capReached) {
      showToast('error', `Already covers ${(amountToPay / 100).toLocaleString()} PKR — uncheck something first`);
      return;
    }
    const next = new Set(checked);
    next.add(item.key);
    setChecked(next);
  };

  const handleSubmit = async () => {
    if (!token || !canSubmit || !pending) return;
    setSubmitting(true);
    try {
      const previousMonths = previousItems
        .filter(i => checked.has(i.key))
        .map(i => ({ studentFeeId: i.studentFeeId, amountPaise: fundedByKey.get(i.key) || 0 }));
      const headItems = currentMonthItems.filter(i => i.kind === 'head' && checked.has(i.key));
      const extraItems = currentMonthItems.filter(i => i.kind === 'extra' && checked.has(i.key));
      const currentStudentFeeId = headItems[0]?.studentFeeId || extraItems[0]?.studentFeeId;

      const headAmounts = new Map<string, { feeHeadId?: string; headName: string; amountPaise: number }>();
      for (const h of headItems) {
        if (h.kind !== 'head') continue;
        const hk = h.feeHeadId || `name:${h.headName}`;
        const prev = headAmounts.get(hk);
        const add = fundedByKey.get(h.key) || 0;
        if (prev) prev.amountPaise += add;
        else headAmounts.set(hk, { feeHeadId: h.feeHeadId, headName: h.headName, amountPaise: add });
      }

      const payload: any = {
        studentId,
        amountPaidPaise: amountToPay,
        paymentMethod: pending.paymentMethod,
        reference: pending.reference || undefined,
        previousMonths,
      };
      if (currentStudentFeeId) {
        payload.currentMonth = {
          studentFeeId: currentStudentFeeId,
          heads: [...headAmounts.values()].filter((h) => h.amountPaise > 0),
          extras: extraItems
            .filter((e) => e.kind === 'extra')
            .map((e) => ({ feeExtraItemId: e.feeExtraItemId, amountPaise: fundedByKey.get(e.key) || 0 }))
            .filter((e) => e.amountPaise > 0),
        };
      }

      const res = await fetch(`${config.apiUrl}/admin/payments/allocate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        sessionStorage.removeItem(`pendingPayment:${studentId}`);
        setResult(json.data);
        showToast('success', `Receipt: ${json.data.receiptNumber}`);
      } else {
        showToast('error', json.message || 'Payment failed');
      }
    } catch {
      showToast('error', 'Payment failed');
    } finally {
      setSubmitting(false);
    }
  };

  const fetchAndPrint = async (action: 'print' | 'download') => {
    if (!result || !token) return;
    const paymentId = result.payments?.[0]?.id;
    if (!paymentId) return;
    try {
      const res = await fetch(`${config.apiUrl}/admin/payments/${paymentId}/receipt`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (!json.success) { showToast('error', 'Receipt not available'); return; }
      const snap = json.data;
      const receiptData = receiptDataFromSnapshot(snap);
      if (action === 'print') upgradedPrintReceipt(receiptData); else downloadReceipt(receiptData);
    } catch {
      showToast('error', 'Failed to load receipt');
    }
  };

  if (loading || !pending) {
    return <div className="p-8 text-center text-warm-muted/50 text-sm">Loading...</div>;
  }

  if (result) {
    return (
      <div className="max-w-lg mx-auto p-6">
        <div className="rounded-xl border border-warm-card-border bg-[#24201e] p-6">
          <h3 className="text-sm font-medium text-green-400 mb-2">✓ Payment Recorded</h3>
          <p className="text-xs text-warm-muted/70 mb-4">Receipt: {result.receiptNumber} · {(result.totalAmount / 100).toLocaleString()} PKR</p>
          <div className="flex gap-2">
            <button onClick={() => fetchAndPrint('print')} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-warm-accent py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] transition-colors">
              <Printer size={13} /> Print Receipt
            </button>
            <button onClick={() => fetchAndPrint('download')} className="rounded-lg border border-warm-card-border px-3 py-2 text-xs text-warm-muted hover:text-warm-cream transition-colors">
              <Download size={13} className="inline mr-1" /> Download
            </button>
          </div>
          <button onClick={() => router.push(`/admin/fees/student/${studentId}`)} className="w-full mt-3 rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream transition-colors">
            Back to Student
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-xs text-warm-muted hover:text-warm-cream mb-4 transition-colors">
        <ArrowLeft size={14} /> Back
      </button>

      <h2 className="text-sm font-medium text-warm-cream mb-1">Allocate Payment</h2>
      <p className="text-xs text-warm-muted/50 mb-5">
        Paying <strong className="text-warm-accent">{(amountToPay / 100).toLocaleString()} PKR</strong> via {pending.paymentMethod}
        {pending.reference ? ` · Ref: ${pending.reference}` : ''}
      </p>

      {selectableItems.length === 0 && currentMonthItems.every(isItemPaid) && previousItems.length === 0 ? (
        <div className="rounded-xl border border-warm-card-border p-6 text-center text-xs text-warm-muted/40">No dues found for this student.</div>
      ) : (
        <div className="rounded-xl border border-warm-card-border overflow-hidden mb-5">

          {/* ── Current Month (collapsible parent) ────────── */}
          {currentMonthItems.length > 0 && (
            <>
              <button
                onClick={() => setCurrentMonthOpen(o => !o)}
                className="flex items-center justify-between w-full px-4 py-3 border-b border-warm-card-border/20 bg-warm-card/20 hover:bg-warm-card/40 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <ChevronDown size={14} className={`text-warm-muted transition-transform duration-200 ${currentMonthOpen ? '' : '-rotate-90'}`} />
                  <span className="text-xs font-medium text-warm-cream">{currentMonthLabel}</span>
                  <span className="text-[10px] text-warm-accent/70">Current month</span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-warm-muted/60">
                    {currentMonthItems.filter(i => !isItemPaid(i)).reduce((s, i) => s + i.duePaise, 0) / 100} due
                  </p>
                </div>
              </button>

              {/* Collapsible sub-rows */}
              {currentMonthOpen && currentMonthItems.map(item => {
                const isPaid = isItemPaid(item);
                const isChecked = !isPaid && checked.has(item.key);
                const funded = fundedByKey.get(item.key) || 0;
                const isPartial = isChecked && funded > 0 && funded < item.duePaise;
                const disabled = isPaid || (!isChecked && capReached);
                return (
                  <div
                    key={item.key}
                    className={`flex items-center justify-between px-4 py-2.5 pl-8 border-b border-warm-card-border/10 last:border-b-0 transition-colors ${
                      isPaid ? 'opacity-60' : disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-warm-card/10'
                    }`}
                    onClick={() => { if (!disabled || isChecked) toggle(item); }}
                  >
                    <div className="flex items-center gap-2.5">
                      {isPaid ? (
                        <span className="w-4 h-4 rounded bg-green-900/30 text-green-400 text-[10px] flex items-center justify-center">✓</span>
                      ) : (
                        <input type="checkbox" checked={isChecked} onChange={() => {}} className="accent-warm-accent scale-90" />
                      )}
                      <div>
                        <p className={`text-xs ${isPaid ? 'text-warm-muted/50 line-through' : 'text-warm-cream'}`}>{item.label}</p>
                        <p className="text-[10px] text-warm-muted/30">
                          {isPaid ? 'Paid' : item.kind === 'head' ? 'Fee head' : 'Extra'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {isPaid ? (
                        <p className="text-[10px] text-green-400/70">{(itemStickerPaise(item) / 100).toLocaleString()} paid</p>
                      ) : (
                        <>
                          <p className="text-xs text-warm-muted/60">{(item.duePaise / 100).toLocaleString()} due</p>
                          {isChecked && (
                            <p className={`text-[10px] ${isPartial ? 'text-yellow-400' : 'text-green-400'}`}>
                              {(funded / 100).toLocaleString()} applied{isPartial ? ` · ${((item.duePaise - funded) / 100).toLocaleString()} remains` : ''}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* ── Previous Months ──────────────────────────── */}
          {previousItems.length > 0 && (
            <div className="border-t border-warm-card-border/20">
              {previousItems.map(item => {
                const isChecked = checked.has(item.key);
                const funded = fundedByKey.get(item.key) || 0;
                const isPartial = isChecked && funded > 0 && funded < item.duePaise;
                const disabled = !isChecked && capReached;
                return (
                  <div
                    key={item.key}
                    className={`flex items-center justify-between px-4 py-3 border-b border-warm-card-border/10 last:border-b-0 transition-colors ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-warm-card/20'}`}
                    onClick={() => { if (!disabled || isChecked) toggle(item); }}
                  >
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={isChecked} onChange={() => {}} className="accent-warm-accent" />
                      <div>
                        <p className="text-xs text-warm-cream">{item.label}</p>
                        <p className="text-[10px] text-warm-muted/40">Previous month</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-warm-muted/60">{(item.duePaise / 100).toLocaleString()} due</p>
                      {isChecked && (
                        <p className={`text-[10px] ${isPartial ? 'text-yellow-400' : 'text-green-400'}`}>
                          {(funded / 100).toLocaleString()} applied{isPartial ? ` · ${((item.duePaise - funded) / 100).toLocaleString()} remains` : ''}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="rounded-xl bg-warm-card/50 p-4 mb-5 flex justify-between items-center">
        <div>
          <p className="text-[10px] text-warm-muted/60 uppercase tracking-wider">Selected</p>
          <p className="text-sm text-warm-cream">{(fundedTotal / 100).toLocaleString()} / {(amountToPay / 100).toLocaleString()} PKR</p>
        </div>
        {!canSubmit && <p className="text-[11px] text-yellow-400/80">Select more to cover the full amount</p>}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!canSubmit || submitting}
        className={`w-full inline-flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-medium transition-colors ${canSubmit ? 'bg-warm-accent text-[#1a1614] hover:bg-[#b39a76]' : 'bg-warm-accent/30 text-[#1a1614]/50 cursor-not-allowed'}`}
      >
        <Save size={13} /> {submitting ? 'Processing...' : 'Confirm Payment'}
      </button>
    </div>
  );
}
