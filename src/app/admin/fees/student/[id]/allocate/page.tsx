'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { showToast } from '@/components/toast';
import { ArrowLeft, Save, Printer, Download } from 'lucide-react';
import config from '@/config';
import { printReceipt as upgradedPrintReceipt, downloadReceipt } from '@/lib/receipt';
import type { ReceiptData } from '@/lib/receipt';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ─── Selectable item shapes ──────────────────────────────────────────
// One flat, fixed-order list drives both auto-select and manual
// checkbox behavior. Order is the contract: previous months oldest →
// newest, then current-month fee heads in structure order, then
// current-month extras in creation order. This exact order is used both
// to decide what gets auto-checked on load AND to decide which checked
// item absorbs the shortfall when checked total exceeds the amount
// being paid (whichever item crosses the cap, in this order, is the one
// that gets partially funded — never split across two items).
type Item =
  | { kind: 'previousMonth'; key: string; studentFeeId: string; label: string; duePaise: number }
  | { kind: 'head'; key: string; studentFeeId: string; feeHeadId?: string; headName: string; label: string; duePaise: number }
  | { kind: 'extra'; key: string; studentFeeId: string; feeExtraItemId: string; label: string; duePaise: number };

export default function AllocatePaymentPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const [pending, setPending] = useState<{ amountPaise: number; paymentMethod: string; reference: string } | null>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

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
    if (!token || !studentId) return;
    fetch(`${config.apiUrl}/admin/students/${studentId}/fee`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(json => { if (json.success) setData(json.data); })
      .finally(() => setLoading(false));
  }, [studentId, token]);

  // ─── Build the fixed-order item list ──────────────────────────────
  const items: Item[] = useMemo(() => {
    if (!data) return [];
    const fees = (data.studentFees || []) as any[];
    const getExtra = (f: any) => (f.extraItems || []).reduce((s: number, e: any) => s + e.amount, 0);
    const getDue = (f: any) => f.netAmount + getExtra(f) - f.paidAmount;

    const withDue = fees.filter(f => getDue(f) > 0);
    if (withDue.length === 0) return [];

    // Current month = most recent open month. Previous months = every
    // other open month, oldest → newest (matches waterfall's own order).
    const sorted = [...withDue].sort((a, b) => (a.year - b.year) || (a.month - b.month));
    const currentFee = sorted[sorted.length - 1];
    const previousFees = sorted.slice(0, -1);

    const list: Item[] = [];
    for (const f of previousFees) {
      list.push({
        kind: 'previousMonth',
        key: `prev:${f.id}`,
        studentFeeId: f.id,
        label: `${MONTHS[(f.month || 1) - 1]} ${f.year}`,
        duePaise: getDue(f),
      });
    }

    // Current month heads, in structure order (as stored in feeHeadBreakdown)
    const breakdown = (currentFee.feeHeadBreakdown as any[]) || [];
    for (const h of breakdown) {
      if ((h.amount || 0) <= 0) continue;
      list.push({
        kind: 'head',
        key: `head:${currentFee.id}:${h.feeHeadId || h.name}`,
        studentFeeId: currentFee.id,
        feeHeadId: h.feeHeadId,
        headName: h.name,
        label: h.name,
        duePaise: h.amount,
      });
    }

    // Current month extras, in creation order
    const extras = [...(currentFee.extraItems || [])].sort(
      (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    for (const e of extras) {
      list.push({
        kind: 'extra',
        key: `extra:${currentFee.id}:${e.id}`,
        studentFeeId: currentFee.id,
        feeExtraItemId: e.id,
        label: e.name,
        duePaise: e.amount,
      });
    }
    return list;
  }, [data]);

  const amountToPay = pending?.amountPaise || 0;

  // ─── Auto-select on load: walk fixed order, stop once cumulative due
  // reaches amountToPay. The item that crosses the line is still
  // checked — it just gets partially funded (computed below), never
  // left unchecked. ──────────────────────────────────────────────────
  useEffect(() => {
    if (items.length === 0 || !pending) return;
    const auto = new Set<string>();
    let running = 0;
    for (const item of items) {
      if (running >= amountToPay) break;
      auto.add(item.key);
      running += item.duePaise;
    }
    setChecked(auto);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, pending?.amountPaise]);

  // ─── Funded amount per checked item — fixed-order walk, cumulative
  // capped at amountToPay. Whichever checked item crosses the cap (in
  // list order, not click order) absorbs the shortfall alone. ─────────
  const { fundedByKey, selectedDueSum, fundedTotal } = useMemo(() => {
    const funded = new Map<string, number>();
    let running = 0;
    let dueSum = 0;
    for (const item of items) {
      if (!checked.has(item.key)) continue;
      dueSum += item.duePaise;
      const room = Math.max(0, amountToPay - running);
      const thisFunded = Math.min(item.duePaise, room);
      funded.set(item.key, thisFunded);
      running += thisFunded;
    }
    return { fundedByKey: funded, selectedDueSum: dueSum, fundedTotal: running };
  }, [items, checked, amountToPay]);

  const capReached = selectedDueSum >= amountToPay;
  const canSubmit = fundedTotal >= amountToPay && amountToPay > 0;

  const toggle = (item: Item) => {
    if (checked.has(item.key)) {
      const next = new Set(checked);
      next.delete(item.key);
      setChecked(next);
      return;
    }
    if (capReached) {
      showToast('error', `Selected amount already covers ${(amountToPay / 100).toLocaleString()} PKR — uncheck something first to add ${item.label}`);
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
      const previousMonths = items
        .filter(i => i.kind === 'previousMonth' && checked.has(i.key))
        .map(i => ({ studentFeeId: (i as any).studentFeeId, amountPaise: fundedByKey.get(i.key) || 0 }));
      const headItems = items.filter(i => i.kind === 'head' && checked.has(i.key)) as any[];
      const extraItems = items.filter(i => i.kind === 'extra' && checked.has(i.key)) as any[];
      const currentStudentFeeId = headItems[0]?.studentFeeId || extraItems[0]?.studentFeeId;

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
          heads: headItems.map(h => ({ feeHeadId: h.feeHeadId, headName: h.headName, amountPaise: fundedByKey.get(h.key) || 0 })),
          extras: extraItems.map(e => ({ feeExtraItemId: e.feeExtraItemId, amountPaise: fundedByKey.get(e.key) || 0 })),
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
      const normalizeItems = (arr: any[]) => (arr || []).map((h: any) => ({ name: h.name, amountPaise: h.amountPaise ?? h.amount ?? 0 }));
      const heads = normalizeItems(snap.currentMonthHeads);
      const extras = normalizeItems(snap.currentMonthExtras);
      const allocations = Array.isArray(snap.allocations) && snap.allocations.length > 0
        ? snap.allocations
        : snap.currentMonthLabel
          ? [{ label: snap.currentMonthLabel, amountPaise: snap.amountPaidPaise }]
          : [];
      const receiptData: ReceiptData = {
        receiptNumber: snap.receiptNumber,
        date: new Date(snap.paymentDate || snap.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        paymentMethod: snap.paymentMethod,
        reference: snap.reference || undefined,
        totalPaidPaise: snap.amountPaidPaise,
        balanceRemainingPaise: snap.balanceAfterPaise,
        studentName: snap.studentName,
        studentClass: snap.studentClass,
        studentRoll: snap.studentRoll || undefined,
        fatherName: snap.fatherName || undefined,
        isFullyPaid: snap.isFullyPaid,
        isFromSnapshot: true,
        snapshotCreatedAt: snap.createdAt,
        snapshotPrintCount: snap.printCount,
        currentMonth: {
          label: snap.currentMonthLabel,
          breakdown: heads,
          extraItems: extras,
          totalPaise: heads.reduce((s: number, h: any) => s + h.amountPaise, 0),
          paidPaise: snap.amountPaidPaise,
        },
        previousBalancePaise: snap.previousBalancePaise,
        totalDuePaise: snap.totalDuePaise,
        allocations,
      };
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

      {items.length === 0 ? (
        <div className="rounded-xl border border-warm-card-border p-6 text-center text-xs text-warm-muted/40">No dues found for this student.</div>
      ) : (
        <div className="rounded-xl border border-warm-card-border overflow-hidden mb-5">
          {items.map(item => {
            const isChecked = checked.has(item.key);
            const funded = fundedByKey.get(item.key) || 0;
            const isPartial = isChecked && funded > 0 && funded < item.duePaise;
            const disabled = !isChecked && capReached;
            return (
              <label
                key={item.key}
                className={`flex items-center justify-between px-4 py-3 border-t border-warm-card-border/20 first:border-t-0 transition-colors ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-warm-card/20'}`}
                onClick={(e) => { e.preventDefault(); if (!disabled || isChecked) toggle(item); }}
              >
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={isChecked} readOnly className="accent-warm-accent" />
                  <div>
                    <p className="text-xs text-warm-cream">{item.label}</p>
                    <p className="text-[10px] text-warm-muted/40">
                      {item.kind === 'previousMonth' ? 'Previous month' : item.kind === 'head' ? 'Current month · fee head' : 'Current month · extra'}
                    </p>
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
              </label>
            );
          })}
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
