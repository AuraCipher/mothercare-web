'use client';

import { useEffect, useState, Fragment } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { mergeFeeHeadBreakdown } from '@/lib/feeAllocate';
import { showToast } from '@/components/toast';
import { api } from '@/lib/api';
import { Printer, Download, ArrowLeft, Save, Plus, ChevronDown, ChevronRight, Trash2, Users } from 'lucide-react';
import config from '@/config';
import { printReceipt as upgradedPrintReceipt, downloadReceipt, receiptDataFromSnapshot } from '@/lib/receipt';
import type { ReceiptData, ReceiptMonthSection } from '@/lib/receipt';
import { fetchAndPrintFamilyReceipt } from '@/lib/familyReceipt';
import FamilyPayModal from '@/components/fees/FamilyPayModal';
import NumberStepper from '@/components/inputs/number-stepper';
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function StudentFeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState('CASH');
  const [payRef, setPayRef] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<any>(null);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [addExtraModal, setAddExtraModal] = useState<any>(null);
  const [addItemType, setAddItemType] = useState<'EXTRA_DUE' | 'STATIONARY'>('EXTRA_DUE');
  const [addExtraName, setAddExtraName] = useState('');
  const [addExtraAmt, setAddExtraAmt] = useState(0);
  const [stationaryCatalog, setStationaryCatalog] = useState<any[]>([]);
  const [stationaryQty, setStationaryQty] = useState<Record<string, number>>({});
  const [showFamilyPay, setShowFamilyPay] = useState(false);
  const [showCarryModal, setShowCarryModal] = useState(false);
  const [carrySources, setCarrySources] = useState<any[]>([]);
  const [carrySourceId, setCarrySourceId] = useState('');
  const [carryTargetId, setCarryTargetId] = useState('');
  const [carryNotes, setCarryNotes] = useState('');
  const [carrying, setCarrying] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const ayId = typeof window !== 'undefined' ? localStorage.getItem('activeAYId') : null;
  const isAyArchived = typeof window !== 'undefined' && localStorage.getItem('activeAYStatus') === 'ARCHIVED';

  const loadData = async () => {
    if (!token || !params.id || !ayId) return;
    try {
      const res = await fetch(`${config.apiUrl}/admin/students/${params.id}/fee?academicYearId=${ayId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [params.id, ayId]);
  useEffect(() => {
    if (!addExtraModal || addItemType !== 'STATIONARY') return;
    api.getFeeStationaryCatalog().then((r) => setStationaryCatalog(r.data || [])).catch(() => {});
  }, [addExtraModal, addItemType]);

  const fees = data?.studentFees || [];
  const getExtraTotal = (sf: any) => (sf.extraItems || []).reduce((s: number, e: any) => s + e.amount, 0);
  const getMonthDue = (sf: any) => sf.netAmount + getExtraTotal(sf) - sf.paidAmount;
  const totalRemainingPaise = fees.reduce((s: number, f: any) => s + getMonthDue(f), 0);
  const totalRemainingPkr = totalRemainingPaise / 100;

  const openPayModal = () => {
    setPayAmount(0);
    setPayMethod('CASH');
    setPayRef('');
    setLastReceipt(null);
    setShowPayModal(true);
  };

  const openCarryModal = async () => {
    if (!params.id) return;
    try {
      const res = await api.getFeeCarryForwardSources(String(params.id));
      setCarrySources(res.data || []);
      setCarrySourceId(res.data?.[0]?.id || '');
      const target = fees.find((f: any) => getMonthDue(f) > 0);
      setCarryTargetId(target?.id || '');
      setShowCarryModal(true);
    } catch (e: any) {
      showToast('error', e.message || 'Failed to load old dues');
    }
  };

  const handleGoToAllocate = () => {
    if (!params.id || payAmount <= 0) return;
    const amountPaise = Math.round(payAmount * 100);
    if (amountPaise > totalRemainingPaise) {
      showToast('error', `Amount exceeds total due (${totalRemainingPkr.toLocaleString()} PKR)`);
      return;
    }
    sessionStorage.setItem(`pendingPayment:${params.id}`, JSON.stringify({
      amountPaise, paymentMethod: payMethod, reference: payRef,
    }));
    router.push(`/admin/fees/student/${params.id}/allocate`);
  };

  const handleWaterfallPay = async () => {
    if (!token || !params.id || payAmount <= 0) return;
    const amountPaise = Math.round(payAmount * 100);
    if (amountPaise > totalRemainingPaise) {
      showToast('error', `Amount exceeds total due (${totalRemainingPkr.toLocaleString()} PKR)`);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${config.apiUrl}/admin/payments/waterfall`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: params.id,
          amount: amountPaise,
          paymentMethod: payMethod,
          reference: payRef,
        }),
      });
      const json = await res.json();
      if (json.success) {
        // Compute remaining after payment
        const newTotalRemaining = Math.max(0, totalRemainingPaise - amountPaise);
        setLastReceipt({ ...json.data, newRemainingPaise: newTotalRemaining });
        showToast('success', `Receipt: ${json.data.receiptNumber} · ${json.data.monthsCovered} month(s) covered`);
        loadData();
      } else showToast('error', json.message || 'Failed');
    } catch { showToast('error', 'Failed'); }
    finally { setSaving(false); }
  };

  const buildReceiptData = (payment: any, studentFee?: any, remainingOverride?: number): ReceiptData => {
    const isWaterfall = payment.allocations !== undefined && payment.allocations.length > 0;
    const remaining = remainingOverride ?? 0;
    const studentName = data?.name || '';
    const studentClass = [data?.group?.name, data?.group?.section].filter(Boolean).join(' — ') || '—';
    const studentRoll = data?.rollNumber || undefined;
    const father = data?.parents?.find((p: any) => p.parent?.relation === 'Father');
    const fatherName = father?.parent?.user?.name || father?.parent?.phone || undefined;

    // Build allocations for display
    const allocations: { label: string; amountPaise: number }[] = [];
    if (isWaterfall) {
      for (const a of payment.allocations || []) {
        const sf = data?.studentFees?.find((f: any) => f.id === a.studentFeeId);
        const label = sf ? MONTHS[(sf.month || 1) - 1] + ' ' + (sf.year || '') : 'Allocation';
        allocations.push({ label, amountPaise: a.amount });
      }
    } else if (studentFee) {
      allocations.push({
        label: MONTHS[(studentFee.month || 1) - 1] + ' ' + (studentFee.year || ''),
        amountPaise: payment.amount,
      });
    }

    // Build a map: feeId → amount paid in THIS transaction
    const paidInThisTx: Record<string, number> = {};
    for (const a of payment.allocations || []) {
      paidInThisTx[a.studentFeeId] = (paidInThisTx[a.studentFeeId] || 0) + a.amount;
    }
    if (!isWaterfall && studentFee?.id) {
      paidInThisTx[studentFee.id] = (paidInThisTx[studentFee.id] || 0) + (payment.amount || 0);
    }

    // Sort fees newest-first; latest paid fee = current month
    const allFees: any[] = data?.studentFees || [];
    const sortedFees = [...allFees].sort((a: any, b: any) => (b.year - a.year) || (b.month - a.month));

    let currentMonthFee: any = null;
    let previousTotalPaise = 0;

    // Latest fee that was paid in this transaction = current month
    for (const sf of sortedFees) {
      if (paidInThisTx[sf.id]) {
        currentMonthFee = sf;
        break;
      }
    }
    // Fallback: if no fee was paid (edge case), use the latest fee overall
    if (!currentMonthFee && studentFee) currentMonthFee = studentFee;

    // Compute previous balance: what other fees owed BEFORE this payment
    for (const sf of allFees) {
      if (sf.id === currentMonthFee?.id) continue;
      const extraTotal = getExtraTotal(sf);
      // What was paid toward this fee BEFORE today's transaction
      const paidBefore = sf.paidAmount - (paidInThisTx[sf.id] || 0);
      const dueBefore = Math.max(0, sf.netAmount + extraTotal - paidBefore);
      if (dueBefore > 0) previousTotalPaise += dueBefore;
    }

    // Current month section with per-head breakdown
    let currentMonthSection: ReceiptMonthSection | undefined;
    if (currentMonthFee) {
      const cmTotal = currentMonthFee.netAmount + getExtraTotal(currentMonthFee);
      currentMonthSection = {
        label: MONTHS[(currentMonthFee.month || 1) - 1] + ' ' + (currentMonthFee.year || ''),
        breakdown: mergeFeeHeadBreakdown(currentMonthFee.feeHeadBreakdown).map((fh) => ({
          name: fh.name,
          amountPaise: fh.amount || 0,
          dueBeforePaise: fh.amount || 0,
          paidPaise: 0,
          remainingPaise: fh.amount || 0,
        })),
        extraItems: (currentMonthFee.extraItems || []).map((ei: any) => ({
          name: ei.name,
          amountPaise: ei.amount || 0,
        })),
        totalPaise: cmTotal,
        paidPaise: payment.totalAmount || payment.amount,
      };
    }

    const totalDuePaise = (currentMonthSection?.totalPaise || 0) + previousTotalPaise;

    const receiptData: ReceiptData = {
      receiptNumber: payment.receiptNumber,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      paymentMethod: payment.paymentMethod || 'CASH',
      reference: payment.reference || undefined,
      totalPaidPaise: payment.totalAmount || payment.amount,
      balanceRemainingPaise: Math.max(0, remaining),
      studentName,
      studentClass,
      studentRoll,
      fatherName,
      isFullyPaid: remaining <= 0,
      currentMonth: currentMonthSection,
      previousBalancePaise: previousTotalPaise > 0 ? previousTotalPaise : undefined,
      totalDuePaise: totalDuePaise > 0 ? totalDuePaise : undefined,
      allocations,
    };
    return receiptData;
  };

  const fetchAndPrintReceipt = async (payment: any, studentFee?: any, remainingOverride?: number, action: 'print' | 'download' = 'print') => {
    const paymentId = payment?.id;
    const familyPaymentId = payment?.familyPayment?.id || payment?.familyPaymentId;

    if (familyPaymentId && token) {
      try {
        await fetchAndPrintFamilyReceipt(familyPaymentId, token, config.apiUrl, action);
        return;
      } catch { /* fall through to individual receipt */ }
    }

    let receiptData: ReceiptData | null = null;

    // Try to fetch snapshot from backend
    if (paymentId && token) {
      try {
        const res = await fetch(`${config.apiUrl}/admin/payments/${paymentId}/receipt`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            receiptData = receiptDataFromSnapshot(json.data);
          }
        }
      } catch { /* snapshot fetch failed — fall through to live computation */ }
    }

    // Fallback to live computation if no snapshot
    if (!receiptData) {
      receiptData = buildReceiptData(payment, studentFee, remainingOverride);
    }

    // Execute print/download
    if (action === 'print') {
      upgradedPrintReceipt(receiptData);
    } else {
      downloadReceipt(receiptData);
    }

    // Track the event asynchronously
    if (paymentId && token) {
      try {
        await fetch(`${config.apiUrl}/admin/payments/${paymentId}/print-receipt`, {
          method: 'POST', headers: { Authorization: `Bearer ${token}` },
        });
        await fetch(`${config.apiUrl}/admin/payments/${paymentId}/audit-log`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: action === 'print' ? 'REPRINTED' : 'DOWNLOADED' }),
        });
      } catch { /* tracking failure is non-critical */ }
    }
  };

  const handlePrint = (payment: any, studentFee?: any, remainingOverride?: number) => {
    fetchAndPrintReceipt(payment, studentFee, remainingOverride, 'print');
  };

  const handleDownload = (payment: any, studentFee?: any, remainingOverride?: number) => {
    fetchAndPrintReceipt(payment, studentFee, remainingOverride, 'download');
  };

  if (loading) return <main className="mx-auto max-w-4xl px-6 py-10"><div className="h-48 animate-pulse rounded-xl bg-warm-card" /></main>;
  if (!data) return <main className="mx-auto max-w-4xl px-6 py-10"><p className="text-sm text-warm-muted">Student not found</p></main>;

  const father = data.parents?.find((p: any) => p.parent?.relation === 'Father');
  const fatherName = father?.parent?.user?.name || father?.parent?.phone || '—';

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <button onClick={() => router.push('/admin/fees/collections')} className="inline-flex items-center gap-1 text-xs text-warm-accent hover:underline mb-4">
        <ArrowLeft size={13} /> Back to Collections
      </button>

      {isAyArchived && (
        <div className="mb-4 rounded-lg border border-yellow-600/30 bg-yellow-900/10 px-4 py-3 text-xs text-yellow-400">
          This academic year is archived. New payments cannot be recorded.
        </div>
      )}

      {/* Student Info */}
      <div className="rounded-xl border border-warm-card-border bg-warm-card p-5 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div><p className="text-[10px] text-warm-muted/50 uppercase">Name</p><p className="text-sm text-warm-cream mt-1">{data.name}</p></div>
          <div><p className="text-[10px] text-warm-muted/50 uppercase">Roll</p><p className="text-sm text-warm-muted mt-1">{data.rollNumber || '—'}</p></div>
          <div><p className="text-[10px] text-warm-muted/50 uppercase">Class</p><p className="text-sm text-warm-muted mt-1">{data.group?.name || ''}{data.group?.section ? ` — ${data.group.section}` : ''}</p></div>
          <div><p className="text-[10px] text-warm-muted/50 uppercase">Father</p><p className="text-sm text-warm-muted mt-1">{fatherName}</p></div>
        </div>
        {data.family && (
          <div className="mt-3 pt-3 border-t border-warm-card-border/30">
            <p className="text-[10px] text-warm-muted/50 uppercase">Family</p>
            <button
              onClick={() => router.push(`/admin/fees/families/${data.family.id}`)}
              className="mt-0.5 inline-flex items-center gap-1 text-xs text-purple-300 hover:text-purple-200 transition-colors"
            >
              <Users size={12} /> {data.family.name}
            </button>
          </div>
        )}
        {data.customFeeAmount && (
          <div className="mt-3 pt-3 border-t border-warm-card-border/30">
            <p className="text-[10px] text-warm-muted/50 uppercase">Custom Fee</p>
            <p className="text-xs text-warm-accent mt-0.5">{(data.customFeeAmount / 100).toLocaleString()} PKR</p>
          </div>
        )}
        <div className="mt-4 pt-4 border-t border-warm-card-border/30 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-warm-muted/50 uppercase">Total Remaining</p>
            <p className="text-2xl font-light text-warm-accent">{totalRemainingPkr.toLocaleString()} PKR</p>
          </div>
          {totalRemainingPaise > 0 && !isAyArchived && (
            <div className="flex flex-wrap gap-2 justify-end">
              <button onClick={openCarryModal}
                className="inline-flex items-center gap-1.5 rounded-lg border border-warm-card-border px-4 py-2.5 text-xs text-warm-muted hover:text-warm-cream transition-colors">
                Carry Old Dues
              </button>
              {data.family?.id && (
                <button onClick={() => setShowFamilyPay(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-900/20 px-4 py-2.5 text-xs text-purple-300 hover:bg-purple-900/35 transition-colors">
                  <Users size={14} /> Pay via Family
                </button>
              )}
              <button onClick={openPayModal}
                className="inline-flex items-center gap-1.5 rounded-lg bg-warm-accent px-6 py-2.5 text-sm font-medium text-[#1a1614] hover:bg-[#b39a76] transition-colors">
                <Save size={15} /> Pay Now
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Fee History (newest first) — expandable */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-warm-cream">Fee History</h2>
        <button onClick={() => setAddExtraModal(fees[0] || null)}
          className="inline-flex items-center gap-1 rounded-lg bg-warm-accent/20 px-3 py-1.5 text-xs text-warm-accent hover:bg-warm-accent/30 transition-colors">
          <Plus size={13} /> Add Item
        </button>
      </div>
      <div className="rounded-xl border border-warm-card-border overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead><tr className="bg-warm-card/70">
            <th className="w-6 px-2 py-3"></th>
            <th className="text-left px-2 py-3 text-[10px] text-warm-muted font-medium">Month</th>
            <th className="text-left px-2 py-3 text-[10px] text-warm-muted font-medium">Name</th>
            <th className="text-right px-3 py-3 text-[10px] text-warm-muted font-medium">Fee</th>
            <th className="text-right px-3 py-3 text-[10px] text-warm-muted font-medium">Paid</th>
            <th className="text-right px-3 py-3 text-[10px] text-warm-muted font-medium">Due</th>
            <th className="text-center px-3 py-3 text-[10px] text-warm-muted font-medium">Status</th>
            <th className="text-center px-3 py-3 text-[10px] text-warm-muted font-medium w-16">Action</th>
          </tr></thead>
          <tbody>
            {fees.map((sf: any) => {
              const extraTotal = getExtraTotal(sf);
              const due = getMonthDue(sf);
              const isExpanded = expandedMonths.has(sf.id);
              const extraItems = sf.extraItems || [];
              const toggleExpand = () => {
                const next = new Set(expandedMonths);
                if (isExpanded) next.delete(sf.id); else next.add(sf.id);
                setExpandedMonths(next);
              };
              return (
                <Fragment key={sf.id}>
                  {/* Parent row — totals */}
                  <tr className="border-t border-warm-card-border/20 hover:bg-warm-card/20 transition-colors cursor-pointer" onClick={toggleExpand}>
                    <td className="px-2 py-3 text-warm-muted/50">{isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}</td>
                    <td className="px-2 py-3 text-xs text-warm-cream font-medium">{MONTHS[(sf.month || 1) - 1]} {sf.year}</td>
                    <td className="px-2 py-3 text-xs text-warm-muted/50">Total</td>
                    <td className="px-3 py-3 text-xs text-warm-muted text-right">{(sf.netAmount / 100).toLocaleString()}{extraTotal > 0 ? <span className="text-orange-400"> +{(extraTotal / 100).toLocaleString()}</span> : ''}</td>
                    <td className="px-3 py-3 text-xs text-green-400 text-right">{(sf.paidAmount / 100).toLocaleString()}</td>
                    <td className="px-3 py-3 text-xs text-red-400 text-right font-medium">{due > 0 ? (due / 100).toLocaleString() : '0'}</td>
                    <td className="px-3 py-3 text-xs text-center">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        sf.status === 'PAID' ? 'bg-green-900/20 text-green-400' :
                        sf.status === 'PARTIAL' ? 'bg-yellow-900/20 text-yellow-400' :
                        'bg-red-900/20 text-red-400'
                      }`}>{sf.status}</span>
                    </td>
                    <td className="px-3 py-3 text-xs text-center">
                      <button onClick={(e) => { e.stopPropagation(); setAddExtraModal(sf); }}
                        className="rounded bg-warm-accent/20 px-2 py-1 text-[10px] text-warm-accent hover:bg-warm-accent/30 transition-colors">
                        <Plus size={11} />
                      </button>
                    </td>
                  </tr>
                  {/* Expanded rows — individual items */}
                  {isExpanded && (
                    <>
                      {/* Fee head breakdown rows */}
                      {mergeFeeHeadBreakdown(sf.feeHeadBreakdown).map((fh: any, fhi: number) => (
                        <tr key={`fh-${fhi}`} className="bg-warm-card/30 border-t border-warm-card-border/10">
                          <td className="px-2 py-2"></td>
                          <td className="px-2 py-2 text-[10px] text-warm-muted/40"></td>
                          <td className="px-2 py-2 text-[11px] text-warm-muted/70">{fh.name}</td>
                          <td className="px-3 py-2 text-[11px] text-warm-muted text-right">{(fh.amount / 100).toLocaleString()}</td>
                          <td colSpan={4}></td>
                        </tr>
                      ))}
                      {/* Fallback for old records without breakdown */}
                      {(!sf.feeHeadBreakdown || !Array.isArray(sf.feeHeadBreakdown) || sf.feeHeadBreakdown.length === 0) && (
                        <tr className="bg-warm-card/30 border-t border-warm-card-border/10">
                          <td className="px-2 py-2"></td>
                          <td className="px-2 py-2 text-[10px] text-warm-muted/40"></td>
                          <td className="px-2 py-2 text-[11px] text-warm-muted/70">Base Fee</td>
                          <td className="px-3 py-2 text-[11px] text-warm-muted text-right">{(sf.netAmount / 100).toLocaleString()}</td>
                          <td colSpan={4}></td>
                        </tr>
                      )}
                      {/* Extra items */}
                      {extraItems.map((ei: any) => (
                        <tr key={ei.id} className="bg-warm-card/30 border-t border-warm-card-border/5">
                          <td className="px-2 py-2"></td>
                          <td className="px-2 py-2 text-[10px] text-warm-muted/40"></td>
                          <td className="px-2 py-2 text-[11px] text-orange-400/80">{ei.name}</td>
                          <td className="px-3 py-2 text-[11px] text-orange-400/80 text-right">+{(ei.amount / 100).toLocaleString()}</td>
                          <td colSpan={3}></td>
                          <td className="px-3 py-2 text-center">
                            <button onClick={async () => {
                              if (!token) return;
                              try {
                                const res = await fetch(`${config.apiUrl}/admin/student-fees/${sf.id}/extra-items/${ei.id}`, {
                                  method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
                                });
                                const json = await res.json();
                                if (json.success) { showToast('success', 'Removed'); loadData(); }
                              } catch { showToast('error', 'Failed'); }
                            }} className="p-0.5 text-warm-muted/40 hover:text-red-400 transition-colors">
                              <Trash2 size={11} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Payment History — grouped into cards. A single waterfall/family
          payment spans multiple StudentFee rows, each getting its own
          Payment row with a "-N" suffix on a shared base receipt number.
          Group by that base so one transaction renders as one card: a
          parent line (total, date, receipt, print/download) with one
          child line per month it covered. */}
      <h2 className="text-sm font-medium text-warm-cream mb-3">Payment History</h2>
      <div className="rounded-xl border border-warm-card-border overflow-x-auto mb-6">
        <div className="min-w-[680px]">
        <div className="grid grid-cols-[100px_180px_minmax(100px,1fr)_100px_90px_80px] gap-x-4 bg-warm-card/70 px-4 py-3">
          <div className="text-[10px] text-warm-muted font-medium">Date</div>
          <div className="text-[10px] text-warm-muted font-medium">Receipt</div>
          <div className="text-[10px] text-warm-muted font-medium">Month</div>
          <div className="text-[10px] text-warm-muted font-medium text-right pr-1">Amount</div>
          <div className="text-[10px] text-warm-muted font-medium pl-1">Method</div>
          <div className="text-[10px] text-warm-muted font-medium text-center">Print</div>
        </div>

        {(() => {
          // Base receipt number strips only a trailing allocation index
          // (RCP-YYYYMM-XXXX-N -> RCP-YYYYMM-XXXX). A plain base receipt
          // has exactly 3 hyphen-separated segments; don't touch it.
          const baseOf = (rn: string) => {
            const parts = (rn || '').split('-');
            if (parts.length === 4 && /^\d+$/.test(parts[3])) return parts.slice(0, 3).join('-');
            return rn;
          };

          const pairs = fees.flatMap((sf: any) =>
            (sf.payments || []).map((p: any) => ({ payment: p, fee: sf }))
          );

          const groupsMap = new Map<string, { payment: any; fee: any }[]>();
          for (const pair of pairs) {
            const key = baseOf(pair.payment.receiptNumber);
            if (!groupsMap.has(key)) groupsMap.set(key, []);
            groupsMap.get(key)!.push(pair);
          }

          const groups = Array.from(groupsMap.entries()).map(([base, items]) => {
            // The receipt snapshot is attached to the FIRST allocation the
            // backend creates for a multi-month payment — suffix "-1",
            // corresponding to the oldest month in the waterfall. For a
            // single (non-waterfall) payment there's no suffix at all, so
            // that lone payment carries the snapshot itself.
            const primary = items.find(it => it.payment.receiptNumber === `${base}-1`) || items[0];
            const totalAmount = items.reduce((s, it) => s + it.payment.amount, 0);
            const latestCreatedAt = items.reduce(
              (max, it) => (new Date(it.payment.createdAt) > new Date(max) ? it.payment.createdAt : max),
              items[0].payment.createdAt,
            );
            const sorted = [...items].sort((a, b) => (b.fee.year - a.fee.year) || (b.fee.month - a.fee.month));
            const familyPayment = items.find(it => it.payment.familyPayment)?.payment.familyPayment;
            return { base, items: sorted, primary, totalAmount, date: latestCreatedAt, familyPayment };
          }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

          if (groups.length === 0) {
            return <div className="p-6 text-center text-xs text-warm-muted/40">No payments yet</div>;
          }

          return groups.map(group => (
            <div key={group.base} className="border-t border-warm-card-border/20">
              {/* Parent row — one line per payment transaction */}
              <div className="grid grid-cols-[100px_180px_minmax(100px,1fr)_100px_90px_80px] gap-x-4 px-4 py-3 items-center hover:bg-warm-card/20 transition-colors">
                <div className="text-xs text-warm-muted">{new Date(group.date).toLocaleDateString()}</div>
                <div className="text-xs text-warm-cream font-mono">
                  {group.familyPayment ? group.familyPayment.receiptNumber : group.base}
                </div>
                <div className="text-xs text-warm-muted/50">
                  {group.familyPayment ? (
                    <span className="inline-flex items-center gap-1 text-purple-300/80">
                      Via family
                      {group.items.length > 1 ? ` · ${group.items.length} lines` : ` · ${MONTHS[(group.items[0].fee.month || 1) - 1]} ${group.items[0].fee.year}`}
                    </span>
                  ) : group.items.length > 1 ? (
                    `${group.items.length} months`
                  ) : (
                    `${MONTHS[(group.items[0].fee.month || 1) - 1]} ${group.items[0].fee.year}`
                  )}
                </div>
                <div className="text-xs text-green-400 text-right font-medium pr-1">{(group.totalAmount / 100).toLocaleString()}</div>
                <div className="text-xs text-warm-muted pl-1">{group.primary.payment.paymentMethod}</div>
                <div className="flex items-center justify-center gap-1">
                  <button onClick={() => handlePrint(group.primary.payment, group.primary.fee, totalRemainingPaise)} className="p-1 text-warm-muted hover:text-warm-accent transition-colors" title="Print Receipt">
                    <Printer size={13} />
                  </button>
                  <button onClick={() => handleDownload(group.primary.payment, group.primary.fee, totalRemainingPaise)} className="p-1 text-warm-muted hover:text-warm-accent transition-colors" title="Download Receipt">
                    <Download size={13} />
                  </button>
                </div>
              </div>

              {/* Child rows — per-month breakdown, only when the payment spans more than one month */}
              {group.items.length > 1 && group.items.map(({ payment: p, fee: sf }) => (
                <div key={p.id} className="grid grid-cols-[100px_180px_minmax(100px,1fr)_100px_90px_80px] gap-x-4 px-4 py-2 items-center bg-warm-card/10 border-t border-warm-card-border/10">
                  <div></div>
                  <div className="pl-4 text-[10px] text-warm-muted/40 font-mono">{p.receiptNumber}</div>
                  <div className="text-[11px] text-warm-muted/70">{MONTHS[(sf.month || 1) - 1]} {sf.year}</div>
                  <div className="text-[11px] text-green-400/70 text-right pr-1">{(p.amount / 100).toLocaleString()}</div>
                  <div></div>
                  <div></div>
                </div>
              ))}
            </div>
          ));
        })()}
        </div>
      </div>

      {/* Add Item Modal */}
      {addExtraModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setAddExtraModal(null)}>
          <div className="rounded-xl border border-warm-card-border bg-[#24201e] p-6 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-medium text-warm-cream mb-4">Add Item</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-warm-muted/60 uppercase tracking-wider mb-1">Month</label>
                <select value={addExtraModal?.id || ''} onChange={e => {
                  const sf: any = fees.find((f: any) => f.id === e.target.value);
                  setAddExtraModal(sf || true);
                }} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent">
                  <option value="">Select month...</option>
                  {fees.map((sf: any) => (
                    <option key={sf.id} value={sf.id}>{MONTHS[(sf.month || 1) - 1]} {sf.year}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-warm-muted/60 uppercase tracking-wider mb-1">Type</label>
                <select value={addItemType} onChange={(e) => setAddItemType(e.target.value as any)} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream">
                  <option value="EXTRA_DUE">Extra Due</option>
                  <option value="STATIONARY">Stationary</option>
                </select>
              </div>
              {addItemType === 'EXTRA_DUE' ? (
                <>
              <div>
                <label className="block text-[10px] text-warm-muted/60 uppercase tracking-wider mb-1">Name</label>
                <input value={addExtraName} onChange={e => setAddExtraName(e.target.value)}
                  className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" placeholder="e.g., Lab Charges, Late Fee" />
              </div>
              <div>
                <label className="block text-[10px] text-warm-muted/60 uppercase tracking-wider mb-1">Amount (PKR)</label>
                <NumberStepper value={addExtraAmt} onChange={(n) => setAddExtraAmt(Math.max(0, n))} step={50} containerClassName="inline-flex w-full items-center justify-between gap-2" inputClassName="h-9 flex-1 rounded border border-warm-card-border bg-[#1a1614] px-3 text-sm text-warm-cream text-center" />
              </div>
                </>
              ) : (
                <div className="max-h-56 overflow-y-auto rounded border border-warm-card-border/40 p-2">
                  {stationaryCatalog.map((c: any) => (
                    <div key={c.categoryId} className="mb-2">
                      <p className="text-[10px] text-warm-muted/70">{c.categoryName}</p>
                      {(c.products || []).map((p: any) => (
                        <label key={p.id} className="mt-1 flex items-center justify-between text-xs text-warm-cream">
                          <span>{p.name} ({(p.unitPricePaise / 100).toLocaleString()} PKR)</span>
                          <NumberStepper value={stationaryQty[p.id] || 0} onChange={(n) => setStationaryQty((prev) => ({ ...prev, [p.id]: Math.max(0, n) }))} />
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={async () => {
                if (!token || !addExtraModal?.id) { showToast('error', 'Select month'); return; }
                try {
                  if (addItemType === 'EXTRA_DUE') {
                    if (!addExtraName || addExtraAmt <= 0) { showToast('error', 'Fill all fields'); return; }
                    const res = await fetch(`${config.apiUrl}/admin/student-fees/${addExtraModal.id}/extra-items`, {
                      method: 'POST',
                      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                      body: JSON.stringify({ name: addExtraName, amount: Math.round(addExtraAmt * 100) }),
                    });
                    const json = await res.json();
                    if (!json.success) throw new Error(json.message || 'Failed');
                  } else {
                    const items = Object.entries(stationaryQty).filter(([, q]) => Number(q) > 0).map(([productId, quantity]) => ({ productId, quantity: Number(quantity) }));
                    if (!items.length) { showToast('error', 'Select stationary quantity'); return; }
                    await api.assignStationaryToStudentFee({ studentId: String(params.id), studentFeeId: addExtraModal.id, items });
                  }
                  showToast('success', 'Item added');
                  setAddExtraModal(null); setAddExtraName(''); setAddExtraAmt(0); setStationaryQty({}); setAddItemType('EXTRA_DUE'); loadData();
                } catch { showToast('error', 'Failed'); }
              }} className="flex-1 rounded-lg bg-warm-accent py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] transition-colors">Add</button>
              <button onClick={() => setAddExtraModal(null)} className="rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Pay Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowPayModal(false)}>
          <div className="rounded-xl border border-warm-card-border bg-[#24201e] p-6 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            {lastReceipt ? (
              <>
                <h3 className="text-sm font-medium text-green-400 mb-2">✓ Payment Recorded</h3>
                <p className="text-xs text-warm-muted/70 mb-1">Receipt: {lastReceipt.receiptNumber}</p>
                <p className="text-xs text-warm-muted/70 mb-3">{lastReceipt.monthsCovered} month(s) covered · {(lastReceipt.totalAmount / 100).toLocaleString()} PKR</p>
                <div className="space-y-1 mb-4">
                  {lastReceipt.allocations?.map((a: any) => {
                    const sf = data?.studentFees?.find((f: any) => f.id === a.studentFeeId);
                    const label = sf ? MONTHS[(sf.month || 1) - 1] + ' ' + (sf.year || '') : '';
                    return <div key={a.id} className="flex justify-between text-xs"><span className="text-warm-muted/70">{label}</span><span className="text-green-400">{(a.amount / 100).toLocaleString()}</span></div>;
                  })}
                  <div className="flex justify-between text-xs pt-2 border-t border-warm-card-border/30 mt-2">
                    <span className="text-warm-muted/70">Remaining</span>
                    <span className={lastReceipt.newRemainingPaise > 0 ? 'text-red-400' : 'text-green-400'}>{lastReceipt.newRemainingPaise > 0 ? (lastReceipt.newRemainingPaise / 100).toLocaleString() + ' PKR' : '0 PKR ✅'}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handlePrint(lastReceipt, undefined, lastReceipt.newRemainingPaise)} className="flex-1 rounded-lg bg-warm-accent py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] transition-colors">
                    <Printer size={13} className="inline mr-1" /> Print Receipt
                  </button>
                  <button onClick={() => handleDownload(lastReceipt, undefined, lastReceipt.newRemainingPaise)} className="rounded-lg border border-warm-card-border px-3 py-2 text-xs text-warm-muted hover:text-warm-cream transition-colors">
                    <Download size={13} className="inline mr-1" /> Download
                  </button>
                  <button onClick={() => { setShowPayModal(false); setLastReceipt(null); }} className="rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream transition-colors">Close</button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-sm font-medium text-warm-cream mb-1">Record Payment</h3>
                <p className="text-xs text-warm-muted/50 mb-4">Total remaining: <strong className="text-warm-accent">{totalRemainingPkr.toLocaleString()} PKR</strong></p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] text-warm-muted/60 uppercase tracking-wider mb-1">Amount (PKR)</label>
                    <NumberStepper value={payAmount || 0} onChange={(n) => setPayAmount(Math.max(0, Math.min(n, totalRemainingPkr)))} step={100} containerClassName="inline-flex w-full items-center justify-between gap-2" inputClassName="h-9 flex-1 rounded-lg border border-warm-card-border bg-[#1a1614] px-3 text-sm text-warm-cream text-center outline-none focus:border-warm-accent" />
                    {payAmount > 0 && <p className="text-[10px] text-green-400/60 mt-1">{((payAmount / totalRemainingPkr) * 100).toFixed(0)}% of dues</p>}
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
                        return [...fees].reverse().filter((f: any) => f.netAmount - f.paidAmount > 0).map((f: any) => {
                          const due = f.netAmount - f.paidAmount;
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
                  <button onClick={handleGoToAllocate} disabled={payAmount <= 0}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-warm-accent py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] disabled:opacity-50 transition-colors">
                    <Save size={13} /> Next
                  </button>
                  <button onClick={() => setShowPayModal(false)} className="rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream transition-colors">Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {data.family?.id && (
        <FamilyPayModal
          familyId={data.family.id}
          open={showFamilyPay}
          onClose={() => setShowFamilyPay(false)}
          token={token}
          ayId={ayId}
        />
      )}

      {showCarryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowCarryModal(false)}>
          <div className="rounded-xl border border-warm-card-border bg-[#24201e] p-6 w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-medium text-warm-cream mb-4">Carry Forward Outstanding Fee</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-warm-muted/60 uppercase tracking-wider mb-1">From Archived Due</label>
                <select value={carrySourceId} onChange={(e) => setCarrySourceId(e.target.value)} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream">
                  <option value="">Select archived due...</option>
                  {carrySources.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.ayLabel} · {MONTHS[(s.month || 1) - 1]} {s.year} · {(s.remaining / 100).toLocaleString()} PKR</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-warm-muted/60 uppercase tracking-wider mb-1">To Current AY Month</label>
                <select value={carryTargetId} onChange={(e) => setCarryTargetId(e.target.value)} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream">
                  <option value="">Select target month...</option>
                  {fees.map((f: any) => <option key={f.id} value={f.id}>{MONTHS[(f.month || 1) - 1]} {f.year}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-warm-muted/60 uppercase tracking-wider mb-1">Notes</label>
                <input value={carryNotes} onChange={(e) => setCarryNotes(e.target.value)} placeholder="Optional note"
                  className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream" />
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <button
                disabled={!carrySourceId || !carryTargetId || carrying}
                onClick={async () => {
                  setCarrying(true);
                  try {
                    await api.carryForwardFee({ fromStudentFeeId: carrySourceId, toStudentFeeId: carryTargetId, notes: carryNotes || undefined });
                    showToast('success', 'Outstanding fee carried forward');
                    setShowCarryModal(false);
                    setCarryNotes('');
                    loadData();
                  } catch (e: any) {
                    showToast('error', e.message || 'Carry forward failed');
                  } finally {
                    setCarrying(false);
                  }
                }}
                className="flex-1 rounded-lg bg-warm-accent py-2 text-xs font-medium text-[#1a1614] disabled:opacity-50"
              >
                {carrying ? 'Processing…' : 'Carry Forward'}
              </button>
              <button onClick={() => setShowCarryModal(false)} className="rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
