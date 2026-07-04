'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { showToast } from '@/components/toast';
import { Search, Users, Printer, Download } from 'lucide-react';
import config from '@/config';
import { printReceipt as upgradedPrintReceipt, downloadReceipt } from '@/lib/receipt';
import type { ReceiptData } from '@/lib/receipt';
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function feeDuePaise(fee: { netAmount: number; paidAmount: number; extraItems?: { amount: number }[] }) {
  const extra = (fee.extraItems || []).reduce((s, e) => s + e.amount, 0);
  return Math.max(0, fee.netAmount + extra - fee.paidAmount);
}

export default function FamilyPayPage() {
  const searchParams = useSearchParams();
  const familyIdParam = searchParams.get('familyId');
  const [searchQuery, setSearchQuery] = useState('');
  const [families, setFamilies] = useState<any[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<any>(null);
  const [payments, setPayments] = useState<Record<string, { amount: number; method: string; ref: string }>>({});
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<any>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const ayId = typeof window !== 'undefined' ? localStorage.getItem('activeAYId') : null;

  const searchFamilies = async () => {
    if (!token || !searchQuery.trim() || !ayId) {
      if (!ayId) showToast('error', 'Select an academic year first');
      return;
    }
    try {
      const res = await fetch(`${config.apiUrl}/admin/families?search=${encodeURIComponent(searchQuery)}&academicYearId=${ayId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setFamilies(json.success ? json.data : []);
    } catch { showToast('error', 'Search failed'); }
  };

  const selectFamily = useCallback((family: any) => {
    setSelectedFamily(family);
    const p: Record<string, any> = {};
    for (const s of family.students || []) {
      for (const f of s.studentFees || []) {
        const due = feeDuePaise(f) / 100;
        p[f.id] = { amount: due > 0 ? due : 0, method: 'CASH', ref: '' };
      }
    }
    setPayments(p);
    setReceipt(null);
  }, []);

  useEffect(() => {
    if (!token || !ayId || !familyIdParam) return;
    (async () => {
      try {
        const res = await fetch(`${config.apiUrl}/admin/families/${familyIdParam}?academicYearId=${ayId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.success && json.data) {
          const mapped = {
            ...json.data,
            students: (json.data.students || []).map((s: any) => ({
              ...s,
              studentFees: (s.studentFees || []).filter((f: any) => (f.remainingPaise ?? 0) > 0),
            })).filter((s: any) => (s.studentFees?.length ?? 0) > 0),
          };
          if ((mapped.students?.length ?? 0) > 0) selectFamily(mapped);
        }
      } catch { /* ignore */ }
    })();
  }, [token, ayId, familyIdParam, selectFamily]);

  const handleSubmit = async () => {
    if (!token || !selectedFamily || !ayId) return;
    setSubmitting(true);
    const paymentList = Object.entries(payments)
      .filter(([, p]) => p.amount > 0)
      .map(([studentFeeId, p]) => ({
        studentFeeId, amount: Math.round(p.amount * 100), paymentMethod: p.method, reference: p.ref,
      }));

    try {
      const res = await fetch(`${config.apiUrl}/admin/family-payments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ familyId: selectedFamily.id, payments: paymentList, academicYearId: ayId }),
      });
      const json = await res.json();
      if (json.success) {
        setReceipt(json.data);
        showToast('success', `Receipt: ${json.data.receiptNumber}`);
      } else showToast('error', json.message || 'Failed');
    } catch { showToast('error', 'Failed'); }
    finally { setSubmitting(false); }
  };

  const buildReceiptData = (): ReceiptData | null => {
    if (!receipt) return null;
    const familyPayments = receipt.familyPayment?.payments || [];
    const firstPayment = familyPayments[0] || {};

    const allocations: { label: string; amountPaise: number }[] = [];
    for (const p of familyPayments) {
      allocations.push({
        label: `${p.student?.name || 'Student'} — ${p.student?.group?.name || ''} ${p.student?.group?.section || ''}`,
        amountPaise: p.amount || 0,
      });
    }

    const studentNames = familyPayments.map((p: any) => p.student?.name || '').filter(Boolean).join(', ');
    const fatherName = receipt.familyPayment?.family?.fatherName || '';

    return {
      receiptNumber: receipt.receiptNumber,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      paymentMethod: firstPayment.paymentMethod || 'CASH',
      reference: firstPayment.reference || undefined,
      totalPaidPaise: receipt.totalAmount || 0,
      balanceRemainingPaise: 0,
      studentName: studentNames || fatherName || 'Family Payment',
      studentClass: 'Family Combined',
      fatherName: fatherName || undefined,
      isFullyPaid: true,
      allocations,
    };
  };

  const fetchAndPrintReceipt = async (action: 'print' | 'download') => {
    let receiptData: ReceiptData | null = null;

    const firstPaymentId = receipt?.familyPayment?.payments?.[0]?.id;
    if (firstPaymentId && token) {
      try {
        const res = await fetch(`${config.apiUrl}/admin/payments/${firstPaymentId}/receipt`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            const snap = json.data;
            receiptData = {
              receiptNumber: snap.receiptNumber,
              date: new Date(snap.paymentDate || snap.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
              paymentMethod: snap.paymentMethod,
              reference: snap.reference || undefined,
              totalPaidPaise: snap.amountPaidPaise,
              balanceRemainingPaise: snap.balanceAfterPaise,
              studentName: snap.studentName,
              studentClass: 'Family Combined',
              fatherName: snap.fatherName || undefined,
              isFullyPaid: true,
              isFromSnapshot: true,
              snapshotCreatedAt: snap.createdAt,
              allocations: [{ label: snap.currentMonthLabel || 'Family Payment', amountPaise: snap.amountPaidPaise }],
            };
          }
        }
      } catch { /* fall through */ }
    }

    if (!receiptData) {
      receiptData = buildReceiptData();
    }
    if (!receiptData) return;

    if (action === 'print') upgradedPrintReceipt(receiptData);
    else downloadReceipt(receiptData);

    if (firstPaymentId && token) {
      try {
        await fetch(`${config.apiUrl}/admin/payments/${firstPaymentId}/print-receipt`, {
          method: 'POST', headers: { Authorization: `Bearer ${token}` },
        });
      } catch { /* non-critical */ }
    }
  };

  const handlePrint = () => fetchAndPrintReceipt('print');
  const handleDownload = () => fetchAndPrintReceipt('download');

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-xl font-light text-warm-cream mb-6">Family Combined Payment</h1>

      <div className="rounded-xl border border-warm-card-border bg-warm-card p-5 mb-6">
        <div className="flex items-center gap-3">
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchFamilies()}
            placeholder="Search by father name or phone..."
            className="flex-1 rounded-lg border border-warm-card-border bg-[#1a1614] px-4 py-2.5 text-sm text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent" />
          <button onClick={searchFamilies}
            className="inline-flex items-center gap-1.5 rounded-lg bg-warm-accent px-5 py-2.5 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] transition-colors">
            <Search size={14} /> Search
          </button>
        </div>
      </div>

      {families.length > 0 && !selectedFamily && (
        <div className="rounded-xl border border-warm-card-border overflow-hidden mb-6">
          <table className="w-full text-sm">
            <thead><tr className="bg-warm-card/70"><th className="text-left px-4 py-3 text-[10px] text-warm-muted font-medium">Father Name</th><th className="text-left px-4 py-3 text-[10px] text-warm-muted font-medium">Phone</th><th className="text-center px-4 py-3 text-[10px] text-warm-muted font-medium">Students</th><th className="text-center px-4 py-3 text-[10px] text-warm-muted font-medium w-20">Action</th></tr></thead>
            <tbody>
              {families.map(f => (
                <tr key={f.id} className="border-t border-warm-card-border/20 hover:bg-warm-card/20 transition-colors">
                  <td className="px-4 py-3 text-xs text-warm-cream">{f.fatherName || '—'}</td>
                  <td className="px-4 py-3 text-xs text-warm-muted">{f.phone || '—'}</td>
                  <td className="px-4 py-3 text-xs text-warm-muted text-center">{f.students?.length || 0}</td>
                  <td className="px-4 py-3 text-center"><button onClick={() => selectFamily(f)} className="text-xs text-warm-accent hover:underline">Select</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedFamily && !receipt && (
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-warm-cream flex items-center gap-2"><Users size={16} /> {selectedFamily.fatherName}</h2>
            <button onClick={() => setSelectedFamily(null)} className="text-xs text-warm-muted hover:text-warm-cream">Change</button>
          </div>

          {selectedFamily.students?.map((student: any) => {
            const fees = (student.studentFees || []) as any[];
            if (fees.length === 0) return null;
            return (
              <div key={student.id} className="mb-6 last:mb-0">
                <div className="mb-3">
                  <p className="text-sm text-warm-cream font-medium">{student.name}</p>
                  <p className="text-[10px] text-warm-muted/60">{student.group?.name}{student.group?.section ? ` — ${student.group.section}` : ''}</p>
                </div>
                {fees.map((fee: any) => {
                  const duePaise = feeDuePaise(fee);
                  const p = payments[fee.id] || { amount: 0, method: 'CASH', ref: '' };
                  const monthLabel = `${MONTHS[(fee.month || 1) - 1]} ${fee.year}`;
                  return (
                    <div key={fee.id} className="mb-4 pl-3 border-l border-warm-card-border/30">
                      <p className="text-[10px] text-warm-muted/60 mb-2">{monthLabel} · Due: {(duePaise / 100).toLocaleString()} PKR</p>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] text-warm-muted/60 uppercase tracking-wider mb-1">Amount</label>
                          <input type="number" value={p.amount} onChange={e => setPayments({...payments, [fee.id]: {...p, amount: Number(e.target.value)}})}
                            className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent" />
                        </div>
                        <div>
                          <label className="block text-[10px] text-warm-muted/60 uppercase tracking-wider mb-1">Method</label>
                          <select value={p.method} onChange={e => setPayments({...payments, [fee.id]: {...p, method: e.target.value}})}
                            className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent">
                            <option value="CASH">Cash</option>
                            <option value="CHEQUE">Cheque</option>
                            <option value="BANK_TRANSFER">Bank Transfer</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-warm-muted/60 uppercase tracking-wider mb-1">Ref</label>
                          <input value={p.ref} onChange={e => setPayments({...payments, [fee.id]: {...p, ref: e.target.value}})}
                            className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent" placeholder="Optional" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}

          <div className="mt-6 flex items-center justify-between border-t border-warm-card-border/30 pt-4">
            <span className="text-sm text-warm-cream font-medium">Total: {Object.values(payments).reduce((s, p) => s + p.amount, 0).toLocaleString()} PKR</span>
            <button onClick={handleSubmit} disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-warm-accent px-6 py-2.5 text-sm font-medium text-[#1a1614] hover:bg-[#b39a76] disabled:opacity-50 transition-colors">
              {submitting ? 'Processing...' : 'Confirm & Generate Receipt'}
            </button>
          </div>
        </div>
      )}

      {receipt && (
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-5 text-center">
          <p className="text-green-400 font-medium text-sm mb-2">✓ Payment Recorded</p>
          <p className="text-warm-cream text-lg font-light">Receipt: {receipt.receiptNumber}</p>
          <p className="text-xs text-warm-muted/60 mt-1">Total: {((receipt.totalAmount || 0) / 100).toLocaleString()} PKR</p>
          <button onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-lg bg-warm-accent px-5 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] transition-colors mt-4">
            <Printer size={14} /> Print Receipt
          </button>
          <button onClick={handleDownload}
            className="inline-flex items-center gap-1.5 rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream transition-colors">
            <Download size={14} /> Download
          </button>
        </div>
      )}
    </main>
  );
}
