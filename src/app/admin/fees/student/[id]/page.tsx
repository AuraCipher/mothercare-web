'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { showToast } from '@/components/toast';
import { Printer, ArrowLeft, Save } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
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

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const loadData = async () => {
    if (!token || !params.id) return;
    try {
      const res = await fetch(`${API_URL}/admin/students/${params.id}/fee`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [params.id]);

  // Compute totals
  const fees = data?.studentFees || [];
  const totalDue = fees.reduce((s: number, f: any) => s + (f.netAmount - f.paidAmount), 0);

  const openPayModal = () => {
    setPayAmount(totalDue / 100);
    setPayMethod('CASH');
    setPayRef('');
    setLastReceipt(null);
    setShowPayModal(true);
  };

  const handleWaterfallPay = async () => {
    if (!token || !params.id || payAmount <= 0) return;
    if (payAmount * 100 > totalDue) {
      showToast('error', `Amount exceeds total due (${(totalDue / 100).toLocaleString()} PKR)`);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/admin/payments/waterfall`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: params.id,
          amount: Math.round(payAmount * 100),
          paymentMethod: payMethod,
          reference: payRef,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setLastReceipt(json.data);
        showToast('success', `Receipt: ${json.data.receiptNumber} · ${json.data.monthsCovered} month(s) covered`);
        loadData();
      } else showToast('error', json.message || 'Failed');
    } catch { showToast('error', 'Failed'); }
    finally { setSaving(false); }
  };

  const printReceipt = (payment: any, studentFee?: any) => {
    const win = window.open('', '_blank');
    if (!win) return;
    const isWaterfall = payment.amount === undefined && payment.allocations;
    win.document.write(`
      <html><head><title>Receipt ${isWaterfall ? payment.receiptNumber : payment.receiptNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #222; }
        h1 { font-size: 18px; margin-bottom: 4px; }
        h2 { font-size: 14px; font-weight: normal; color: #555; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 16px; }
        th { background: #f0f0f0; text-align: left; padding: 8px; border-bottom: 2px solid #ddd; }
        td { padding: 6px 8px; border-bottom: 1px solid #eee; }
        .total { font-size: 16px; margin-top: 16px; text-align: right; }
        .meta { font-size: 12px; color: #666; margin-bottom: 20px; }
        hr { border: none; border-top: 1px dashed #ccc; margin: 12px 0; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      <h1>Mother Care School — Payment Receipt</h1>
      <h2>Receipt: ${isWaterfall ? payment.receiptNumber : payment.receiptNumber}</h2>
      <div class="meta">
        Student: ${data?.name || ''} | ${data?.group?.name || ''} ${data?.group?.section || ''}<br>
        Date: ${new Date().toLocaleDateString()}<br>
      </div>
      ${isWaterfall ? `
        <table>
          <tr><th>Month</th><th style="text-align:right">Allocated</th></tr>
          ${payment.allocations?.map((a: any) => {
            const sf = data?.studentFees?.find((f: any) => f.id === a.studentFeeId);
            const label = sf ? MONTHS[(sf.month || 1) - 1] + ' ' + (sf.year || '') : '';
            return `<tr><td>${label}</td><td style="text-align:right">${(a.amount / 100).toLocaleString()}</td></tr>`;
          }).join('')}
        </table>
        <div class="total">Total Paid: <strong>${(payment.totalAmount / 100).toLocaleString()} PKR</strong></div>
      ` : `
        <table>
          <tr><th>Description</th><th style="text-align:right">Amount</th></tr>
          <tr><td>Monthly Fee (${studentFee ? MONTHS[(studentFee.month || 1) - 1] + ' ' + (studentFee.year || '') : ''})</td><td style="text-align:right">${((studentFee?.totalAmount || 0) / 100).toLocaleString()}</td></tr>
          <tr><td><strong>Paid</strong></td><td style="text-align:right"><strong>${(payment.amount / 100).toLocaleString()}</strong></td></tr>
        </table>
        <div class="total">Total Paid: <strong>${(payment.amount / 100).toLocaleString()} PKR</strong></div>
      `}
      <div class="meta" style="margin-top:20px">Method: ${payment.paymentMethod || 'CASH'} | Received by: Admin</div>
      </body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  };

  if (loading) return <main className="mx-auto max-w-4xl px-6 py-10"><div className="h-48 animate-pulse rounded-xl bg-warm-card" /></main>;
  if (!data) return <main className="mx-auto max-w-4xl px-6 py-10"><p className="text-sm text-warm-muted">Student not found</p></main>;

  const father = data.parents?.find((p: any) => p.parent?.relation === 'Father' || p.parent?.relation === 'Father');
  const fatherName = father?.parent?.user?.name || father?.parent?.phone || '—';

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <button onClick={() => router.push('/admin/fees/collections')} className="inline-flex items-center gap-1 text-xs text-warm-accent hover:underline mb-4">
        <ArrowLeft size={13} /> Back to Collections
      </button>

      {/* Student Info */}
      <div className="rounded-xl border border-warm-card-border bg-warm-card p-5 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div><p className="text-[10px] text-warm-muted/50 uppercase">Name</p><p className="text-sm text-warm-cream mt-1">{data.name}</p></div>
          <div><p className="text-[10px] text-warm-muted/50 uppercase">Roll</p><p className="text-sm text-warm-muted mt-1">{data.rollNumber || '—'}</p></div>
          <div><p className="text-[10px] text-warm-muted/50 uppercase">Class</p><p className="text-sm text-warm-muted mt-1">{data.group?.name || ''}{data.group?.section ? ` — ${data.group.section}` : ''}</p></div>
          <div><p className="text-[10px] text-warm-muted/50 uppercase">Father</p><p className="text-sm text-warm-muted mt-1">{fatherName}</p></div>
        </div>
        {data.customFeeAmount && (
          <div className="mt-3 pt-3 border-t border-warm-card-border/30">
            <p className="text-[10px] text-warm-muted/50 uppercase">Custom Fee</p>
            <p className="text-xs text-warm-accent mt-0.5">{(data.customFeeAmount / 100).toLocaleString()} PKR (scholarship/discount)</p>
          </div>
        )}
        {/* Total Due + Pay button */}
        <div className="mt-4 pt-4 border-t border-warm-card-border/30 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-warm-muted/50 uppercase">Total Remaining</p>
            <p className="text-2xl font-light text-warm-accent">{(totalDue / 100).toLocaleString()} PKR</p>
          </div>
          {totalDue > 0 && (
            <button onClick={openPayModal}
              className="inline-flex items-center gap-1.5 rounded-lg bg-warm-accent px-6 py-2.5 text-sm font-medium text-[#1a1614] hover:bg-[#b39a76] transition-colors">
              <Save size={15} /> Pay Now
            </button>
          )}
        </div>
      </div>

      {/* Fee History */}
      <h2 className="text-sm font-medium text-warm-cream mb-3">Fee History</h2>
      <div className="rounded-xl border border-warm-card-border overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-warm-card/70">
              <th className="text-left px-4 py-3 text-[10px] text-warm-muted font-medium">Month</th>
              <th className="text-right px-4 py-3 text-[10px] text-warm-muted font-medium">Fee</th>
              <th className="text-right px-4 py-3 text-[10px] text-warm-muted font-medium">Paid</th>
              <th className="text-right px-4 py-3 text-[10px] text-warm-muted font-medium">Due</th>
              <th className="text-center px-3 py-3 text-[10px] text-warm-muted font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {fees.map((sf: any) => {
              const due = sf.netAmount - sf.paidAmount;
              return (
                <tr key={sf.id} className="border-t border-warm-card-border/20 hover:bg-warm-card/20 transition-colors">
                  <td className="px-4 py-3 text-xs text-warm-cream">{MONTHS[(sf.month || 1) - 1]} {sf.year}</td>
                  <td className="px-4 py-3 text-xs text-warm-muted text-right">{(sf.netAmount / 100).toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-green-400 text-right">{(sf.paidAmount / 100).toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-red-400 text-right font-medium">{due > 0 ? (due / 100).toLocaleString() : '0'}</td>
                  <td className="px-3 py-3 text-xs text-center">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      sf.status === 'PAID' ? 'bg-green-900/20 text-green-400' :
                      sf.status === 'PARTIAL' ? 'bg-yellow-900/20 text-yellow-400' :
                      'bg-red-900/20 text-red-400'
                    }`}>{sf.status}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Payment History */}
      <h2 className="text-sm font-medium text-warm-cream mb-3">Payment History</h2>
      <div className="rounded-xl border border-warm-card-border overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-warm-card/70">
              <th className="text-left px-4 py-3 text-[10px] text-warm-muted font-medium">Date</th>
              <th className="text-left px-4 py-3 text-[10px] text-warm-muted font-medium">Receipt</th>
              <th className="text-left px-4 py-3 text-[10px] text-warm-muted font-medium">Allocation</th>
              <th className="text-right px-4 py-3 text-[10px] text-warm-muted font-medium">Amount</th>
              <th className="text-left px-4 py-3 text-[10px] text-warm-muted font-medium">Method</th>
              <th className="text-center px-3 py-3 text-[10px] text-warm-muted font-medium">Print</th>
            </tr>
          </thead>
          <tbody>
            {fees.flatMap((sf: any) =>
              (sf.payments || []).map((p: any) => (
                <tr key={p.id} className="border-t border-warm-card-border/20 hover:bg-warm-card/20 transition-colors">
                  <td className="px-4 py-3 text-xs text-warm-muted">{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-xs text-warm-cream font-mono">{p.receiptNumber}</td>
                  <td className="px-4 py-3 text-xs text-warm-muted">{MONTHS[(sf.month || 1) - 1]} {sf.year}</td>
                  <td className="px-4 py-3 text-xs text-green-400 text-right">{(p.amount / 100).toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-warm-muted">{p.paymentMethod}</td>
                  <td className="px-3 py-3 text-center">
                    <button onClick={() => printReceipt(p, sf)} className="p-1 text-warm-muted hover:text-warm-accent transition-colors">
                      <Printer size={13} />
                    </button>
                  </td>
                </tr>
              ))
            )}
            {fees.every((sf: any) => !sf.payments?.length) && (
              <tr><td colSpan={6} className="p-6 text-center text-xs text-warm-muted/40">No payments yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Waterfall Pay Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowPayModal(false)}>
          <div className="rounded-xl border border-warm-card-border bg-[#24201e] p-6 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            {lastReceipt ? (
              <>
                <h3 className="text-sm font-medium text-green-400 mb-2">✓ Payment Recorded</h3>
                <p className="text-xs text-warm-muted/70 mb-1">Receipt: {lastReceipt.receiptNumber}</p>
                <p className="text-xs text-warm-muted/70 mb-4">{lastReceipt.monthsCovered} month(s) covered · {(lastReceipt.totalAmount / 100).toLocaleString()} PKR</p>
                <div className="space-y-1 mb-4">
                  {lastReceipt.allocations?.map((a: any) => {
                    const sf = data?.studentFees?.find((f: any) => f.id === a.studentFeeId);
                    const label = sf ? MONTHS[(sf.month || 1) - 1] + ' ' + (sf.year || '') : '';
                    return <div key={a.id} className="flex justify-between text-xs"><span className="text-warm-muted/70">{label}</span><span className="text-green-400">{(a.amount / 100).toLocaleString()}</span></div>;
                  })}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => printReceipt(lastReceipt)} className="flex-1 rounded-lg bg-warm-accent py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] transition-colors">
                    <Printer size={13} className="inline mr-1" /> Print Receipt
                  </button>
                  <button onClick={() => { setShowPayModal(false); setLastReceipt(null); }} className="rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream transition-colors">Close</button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-sm font-medium text-warm-cream mb-1">Record Payment</h3>
                <p className="text-xs text-warm-muted/50 mb-4">Total remaining: <strong className="text-warm-accent">{(totalDue / 100).toLocaleString()} PKR</strong></p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] text-warm-muted/60 uppercase tracking-wider mb-1">Pay Amount (PKR)</label>
                    <input type="number" value={payAmount || ''} onChange={e => {
                      const val = Number(e.target.value);
                      if (val * 100 > totalDue) return;
                      setPayAmount(val);
                    }} min={0} max={totalDue / 100} step={100}
                      className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" />
                    {payAmount * 100 > totalDue && <p className="text-[10px] text-red-400 mt-1">Exceeds remaining balance</p>}
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
                    <label className="block text-[10px] text-warm-muted/60 uppercase tracking-wider mb-1">Reference</label>
                    <input value={payRef} onChange={e => setPayRef(e.target.value)}
                      className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" placeholder="Optional" />
                  </div>
                  {/* Waterfall preview */}
                  {payAmount > 0 && (
                    <div className="rounded-lg bg-warm-card/50 p-3">
                      <p className="text-[10px] text-warm-muted/60 uppercase tracking-wider mb-1.5">Will Clear (oldest first)</p>
                      {(() => {
                        let remaining = payAmount * 100;
                        return fees.filter((f: any) => f.netAmount - f.paidAmount > 0).map((f: any) => {
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
                  <button onClick={handleWaterfallPay} disabled={saving || payAmount <= 0 || payAmount * 100 > totalDue}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-warm-accent py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] disabled:opacity-50 transition-colors">
                    <Save size={13} /> {saving ? 'Processing...' : `Pay ${payAmount.toLocaleString()} PKR`}
                  </button>
                  <button onClick={() => setShowPayModal(false)} className="rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream transition-colors">Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
