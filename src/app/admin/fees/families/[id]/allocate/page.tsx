'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { showToast } from '@/components/toast';
import { ArrowLeft, Save, ChevronDown } from 'lucide-react';
import config from '@/config';
import {
  type AllocateItem,
  buildAllocateItemsForStudent,
  buildStudentAllocatePayloads,
} from '@/lib/feeAllocate';

export default function FamilyAllocatePage() {
  const { id: familyId } = useParams<{ id: string }>();
  const router = useRouter();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const ayId = typeof window !== 'undefined' ? localStorage.getItem('activeAYId') : null;

  const [pending, setPending] = useState<{ amountPaise: number; paymentMethod: string; reference: string } | null>(null);
  const [family, setFamily] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [openStudents, setOpenStudents] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(`pendingFamilyPayment:${familyId}`);
    if (!raw) {
      showToast('error', 'No pending payment — start from the family page');
      router.replace(`/admin/fees/families/${familyId}`);
      return;
    }
    setPending(JSON.parse(raw));
  }, [familyId, router]);

  useEffect(() => {
    if (!token || !familyId || !ayId) return;
    fetch(`${config.apiUrl}/admin/families/${familyId}?academicYearId=${ayId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          setFamily(json.data);
          setOpenStudents(new Set((json.data.students || []).map((s: any) => s.id)));
        }
      })
      .finally(() => setLoading(false));
  }, [familyId, token, ayId]);

  const studentBlocks = useMemo(() => {
    if (!family) return [];
    return (family.students || []).map((s: any) => {
      const { currentMonthItems, previousItems, currentMonthLabel } = buildAllocateItemsForStudent(
        s.id, s.name, s.studentFees || [],
      );
      return { student: s, currentMonthItems, previousItems, currentMonthLabel };
    }).filter(b => b.previousItems.length > 0 || b.currentMonthItems.some(i => !i.isPaid && i.duePaise > 0));
  }, [family]);

  const allItems: AllocateItem[] = useMemo(
    () => studentBlocks.flatMap(b => [...b.previousItems, ...b.currentMonthItems.filter(i => !i.isPaid && i.duePaise > 0)]),
    [studentBlocks],
  );

  const selectableItems = allItems;

  const amountToPay = pending?.amountPaise || 0;

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

  const toggle = useCallback((item: AllocateItem) => {
    if (item.isPaid || item.duePaise <= 0) return;
    setChecked(prev => {
      if (prev.has(item.key)) {
        const next = new Set(prev);
        next.delete(item.key);
        return next;
      }
      if (selectedDueSum >= amountToPay && !prev.has(item.key)) {
        showToast('error', `Already covers ${(amountToPay / 100).toLocaleString()} PKR — uncheck something first`);
        return prev;
      }
      const next = new Set(prev);
      next.add(item.key);
      return next;
    });
  }, [amountToPay, selectedDueSum]);

  const handleSubmit = async () => {
    if (!token || !canSubmit || !pending || !familyId) return;
    setSubmitting(true);
    try {
      const students = buildStudentAllocatePayloads(allItems, checked, fundedByKey);
      const res = await fetch(`${config.apiUrl}/admin/family-payments/allocate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyId,
          academicYearId: ayId,
          amountPaidPaise: amountToPay,
          paymentMethod: pending.paymentMethod,
          reference: pending.reference || undefined,
          students,
        }),
      });
      const json = await res.json();
      if (json.success) {
        sessionStorage.removeItem(`pendingFamilyPayment:${familyId}`);
        setResult(json.data);
        showToast('success', `Family receipt: ${json.data.receiptNumber}`);
      } else {
        showToast('error', json.message || 'Payment failed');
      }
    } catch {
      showToast('error', 'Payment failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !pending) {
    return <div className="p-8 text-center text-warm-muted/50 text-sm">Loading…</div>;
  }

  if (result) {
    return (
      <div className="max-w-lg mx-auto p-6">
        <div className="rounded-xl border border-warm-card-border bg-[#24201e] p-6">
          <h3 className="text-sm font-medium text-green-400 mb-2">✓ Family Payment Recorded</h3>
          <p className="text-xs text-warm-muted/70 mb-1">Receipt: {result.receiptNumber}</p>
          <p className="text-xs text-warm-muted/70 mb-4">
            {(result.totalAmount / 100).toLocaleString()} PKR · {result.paymentCount} payment line{result.paymentCount !== 1 ? 's' : ''}
          </p>
          {(result.payments || []).length > 0 && (
            <div className="rounded-lg bg-warm-card/40 p-3 mb-4 space-y-1">
              {result.payments.map((p: any) => (
                <div key={p.id} className="flex justify-between text-[11px] text-warm-muted/70">
                  <span>{p.receiptNumber}</span>
                  <span>{(p.amount / 100).toLocaleString()} PKR</span>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => router.push(`/admin/fees/families/${familyId}`)}
            className="w-full rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream transition-colors"
          >
            Back to Family
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

      <h2 className="text-sm font-medium text-warm-cream mb-1">Allocate Family Payment</h2>
      <p className="text-xs text-warm-muted/50 mb-1">{family?.name}</p>
      <p className="text-xs text-warm-muted/50 mb-5">
        Paying <strong className="text-warm-accent">{(amountToPay / 100).toLocaleString()} PKR</strong> via {pending.paymentMethod}
        {pending.reference ? ` · Ref: ${pending.reference}` : ''}
      </p>

      {studentBlocks.length === 0 ? (
        <div className="rounded-xl border border-warm-card-border p-6 text-center text-xs text-warm-muted/40">No dues found for this family.</div>
      ) : (
        <div className="rounded-xl border border-warm-card-border overflow-hidden mb-5 space-y-0">
          {studentBlocks.map(block => {
            const isOpen = openStudents.has(block.student.id);
            const studentDue = [...block.previousItems, ...block.currentMonthItems.filter(i => !i.isPaid)]
              .reduce((s, i) => s + i.duePaise, 0);
            return (
              <div key={block.student.id} className="border-b border-warm-card-border/20 last:border-b-0">
                <button
                  onClick={() => setOpenStudents(prev => {
                    const next = new Set(prev);
                    if (next.has(block.student.id)) next.delete(block.student.id);
                    else next.add(block.student.id);
                    return next;
                  })}
                  className="flex items-center justify-between w-full px-4 py-3 bg-warm-card/20 hover:bg-warm-card/40 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <ChevronDown size={14} className={`text-warm-muted transition-transform ${isOpen ? '' : '-rotate-90'}`} />
                    <span className="text-xs font-medium text-warm-cream">{block.student.name}</span>
                  </div>
                  <span className="text-[11px] text-warm-muted/60">{(studentDue / 100).toLocaleString()} due</span>
                </button>

                {isOpen && (
                  <>
                    {block.currentMonthItems.length > 0 && (
                      <div className="px-4 py-2 text-[10px] text-warm-accent/70 uppercase tracking-wider bg-warm-card/10">
                        {block.currentMonthLabel} — current month
                      </div>
                    )}
                    {block.currentMonthItems.map(item => {
                      const isPaid = item.isPaid || item.duePaise <= 0;
                      const isChecked = !isPaid && checked.has(item.key);
                      const funded = fundedByKey.get(item.key) || 0;
                      const isPartial = isChecked && funded > 0 && funded < item.duePaise;
                      const disabled = isPaid || (!isChecked && capReached);
                      return (
                        <div
                          key={item.key}
                          className={`flex items-center justify-between px-4 py-2.5 pl-10 border-b border-warm-card-border/10 ${disabled && !isChecked ? 'opacity-40' : 'cursor-pointer hover:bg-warm-card/10'}`}
                          onClick={() => { if (!disabled || isChecked) toggle(item); }}
                        >
                          <div className="flex items-center gap-2.5">
                            {isPaid ? (
                              <span className="w-4 h-4 rounded bg-green-900/30 text-green-400 text-[10px] flex items-center justify-center">✓</span>
                            ) : (
                              <input type="checkbox" checked={isChecked} readOnly className="accent-warm-accent scale-90" />
                            )}
                            <p className={`text-xs ${isPaid ? 'text-warm-muted/50 line-through' : 'text-warm-cream'}`}>{item.label}</p>
                          </div>
                          <div className="text-right">
                            {!isPaid && <p className="text-xs text-warm-muted/60">{(item.duePaise / 100).toLocaleString()} due</p>}
                            {isChecked && (
                              <p className={`text-[10px] ${isPartial ? 'text-yellow-400' : 'text-green-400'}`}>
                                {(funded / 100).toLocaleString()} applied
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {block.previousItems.map(item => {
                      const isChecked = checked.has(item.key);
                      const funded = fundedByKey.get(item.key) || 0;
                      const isPartial = isChecked && funded > 0 && funded < item.duePaise;
                      const disabled = !isChecked && capReached;
                      return (
                        <div
                          key={item.key}
                          className={`flex items-center justify-between px-4 py-2.5 pl-10 border-b border-warm-card-border/10 ${disabled ? 'opacity-40' : 'cursor-pointer hover:bg-warm-card/10'}`}
                          onClick={() => { if (!disabled || isChecked) toggle(item); }}
                        >
                          <div className="flex items-center gap-2.5">
                            <input type="checkbox" checked={isChecked} readOnly className="accent-warm-accent scale-90" />
                            <div>
                              <p className="text-xs text-warm-cream">{item.label}</p>
                              <p className="text-[10px] text-warm-muted/40">Previous month</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-warm-muted/60">{(item.duePaise / 100).toLocaleString()} due</p>
                            {isChecked && (
                              <p className={`text-[10px] ${isPartial ? 'text-yellow-400' : 'text-green-400'}`}>
                                {(funded / 100).toLocaleString()} applied
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
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
        <Save size={13} /> {submitting ? 'Processing…' : 'Confirm Family Payment'}
      </button>
    </div>
  );
}
