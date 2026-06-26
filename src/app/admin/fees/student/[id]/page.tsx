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
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState('CASH');
  const [payRef, setPayRef] = useState('');
  const [payFeeId, setPayFeeId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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

  const handlePay = async (studentFeeId: string) => {
    if (!token || payAmount <= 0) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/admin/payments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentFeeId, amount: Math.round(payAmount * 100), paymentMethod: payMethod, reference: payRef }),
      });
      const json = await res.json();
      if (json.success) { showToast('success', `Receipt: ${json.data.receiptNumber}`); setPayFeeId(null); loadData(); }
      else showToast('error', json.message || 'Failed');
    } catch { showToast('error', 'Failed'); }
    finally { setSaving(false); }
  };

  const printReceipt = (payment: any, studentFee: any) => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>Receipt ${payment.receiptNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #222; }
        h1 { font-size: 18px; margin-bottom: 4px; }
        h2 { font-size: 14px; font-weight: normal; color: #555; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { background: #f0f0f0; text-align: left; padding: 8px; border-bottom: 2px solid #ddd; }
        td { padding: 6px 8px; border-bottom: 1px solid #eee; }
        .total { font-size: 16px; margin-top: 16px; text-align: right; }
        .meta { font-size: 12px; color: #666; margin-bottom: 20px; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      <h1>Mother Care School — Payment Receipt</h1>
      <h2>Receipt: ${payment.receiptNumber}</h2>
      <div class="meta">
        Student: ${data?.name || ''} | ${data?.group?.name || ''} ${data?.group?.section || ''}<br>
        Date: ${new Date(payment.paymentDate || '').toLocaleDateString()}<br>
        Month: ${studentFee ? MONTHS[(studentFee.month || 1) - 1] + ' ' + (studentFee.year || '') : ''}
      </div>
      <table>
        <tr><th>Description</th><th style="text-align:right">Amount</th></tr>
        <tr><td>Monthly Fee</td><td style="text-align:right">${((studentFee?.totalAmount || 0) / 100).toLocaleString()}</td></tr>
        <tr><td><strong>Paid</strong></td><td style="text-align:right"><strong>${(payment.amount / 100).toLocaleString()}</strong></td></tr>
      </table>
      <div class="total">Total Paid: <strong>${(payment.amount / 100).toLocaleString()} PKR</strong></div>
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
      {/* Back */}
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
            <p className="text-[10px] text-warm-muted/50 uppercase">Custom Fee Active</p>
            <p className="text-xs text-warm-accent mt-0.5">{(data.customFeeAmount / 100).toLocaleString()} PKR (scholarship/discount applied)</p>
          </div>
        )}
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
              <th className="text-center px-3 py-3 text-[10px] text-warm-muted font-medium">Pay</th>
            </tr>
          </thead>
          <tbody>
            {data.studentFees?.map((sf: any) => {
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
                  <td className="px-3 py-3 text-center">
                    {due > 0 ? (
                      <button onClick={() => { setPayFeeId(sf.id); setPayAmount(due / 100); }}
                        className="rounded bg-warm-accent/20 px-2.5 py-1 text-[10px] text-warm-accent hover:bg-warm-accent/30 transition-colors">
                        Pay
                      </button>
                    ) : <span className="text-[10px] text-warm-muted/30">—</span>}
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
              <th className="text-left px-4 py-3 text-[10px] text-warm-muted font-medium">Month</th>
              <th className="text-right px-4 py-3 text-[10px] text-warm-muted font-medium">Amount</th>
              <th className="text-left px-4 py-3 text-[10px] text-warm-muted font-medium">Method</th>
              <th className="text-center px-3 py-3 text-[10px] text-warm-muted font-medium">Print</th>
            </tr>
          </thead>
          <tbody>
            {data.studentFees?.flatMap((sf: any) =>
              (sf.payments || []).map((p: any) => (
                <tr key={p.id} className="border-t border-warm-card-border/20 hover:bg-warm-card/20 transition-colors">
                  <td className="px-4 py-3 text-xs text-warm-muted">{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-xs text-warm-cream font-mono">{p.receiptNumber}</td>
                  <td className="px-4 py-3 text-xs text-warm-muted">{MONTHS[(sf.month || 1) - 1]} {sf.year}</td>
                  <td className="px-4 py-3 text-xs text-green-400 text-right">{(p.amount / 100).toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-warm-muted">{p.paymentMethod}</td>
                  <td className="px-3 py-3 text-center">
                    <button onClick={() => printReceipt(p, sf)}
                      className="p-1 text-warm-muted hover:text-warm-accent transition-colors">
                      <Printer size={13} />
                    </button>
                  </td>
                </tr>
              ))
            )}
            {(!data.studentFees || data.studentFees.every((sf: any) => !sf.payments?.length)) && (
              <tr><td colSpan={6} className="p-6 text-center text-xs text-warm-muted/40">No payments yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pay Modal */}
      {payFeeId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setPayFeeId(null)}>
          <div className="rounded-xl border border-warm-card-border bg-[#24201e] p-6 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-medium text-warm-cream mb-4">Record Payment</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-warm-muted/60 uppercase tracking-wider mb-1">Amount (PKR)</label>
                <input type="number" value={payAmount} onChange={e => setPayAmount(Number(e.target.value))} min={0}
                  className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" />
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
                  className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" placeholder="Cheque # / Transaction ID" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => handlePay(payFeeId)} disabled={saving || payAmount <= 0}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-warm-accent py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] disabled:opacity-50 transition-colors">
                <Save size={13} /> {saving ? 'Saving...' : 'Record Payment'}
              </button>
              <button onClick={() => setPayFeeId(null)} className="rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
