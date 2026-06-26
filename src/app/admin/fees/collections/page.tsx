'use client';

import { useEffect, useState } from 'react';
import { showToast } from '@/components/toast';
import { DollarSign, Users, Search } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function CollectionsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [fees, setFees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payModal, setPayModal] = useState<any>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState('CASH');
  const [payRef, setPayRef] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const loadFees = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/student-fees?month=${month + 1}&year=${year}&status=UNPAID,PARTIAL`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setFees(json.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadFees(); }, [month, year]);

  const handlePay = async () => {
    if (!token || !payModal) return;
    try {
      const res = await fetch(`${API_URL}/admin/payments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentFeeId: payModal.id, amount: Math.round(payAmount * 100), paymentMethod: payMethod, reference: payRef }),
      });
      const json = await res.json();
      if (json.success) { showToast('success', `Receipt: ${json.data.receiptNumber}`); setPayModal(null); loadFees(); }
      else showToast('error', json.message || 'Failed');
    } catch { showToast('error', 'Failed'); }
  };

  const openPay = (fee: any) => {
    const due = (fee.netAmount - fee.paidAmount) / 100;
    setPayModal(fee);
    setPayAmount(due);
    setPayMethod('CASH');
    setPayRef('');
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-light text-warm-cream">Collections</h1>
        <div className="flex items-center gap-3">
          <select value={month} onChange={e => setMonth(Number(e.target.value))}
            className="rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent">
            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <input type="number" value={year} onChange={e => setYear(Number(e.target.value))}
            className="rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent w-20" />
          <button onClick={loadFees} className="rounded-lg border border-warm-card-border px-3 py-2 text-xs text-warm-muted hover:text-warm-cream transition-colors"><Search size={13} /></button>
        </div>
      </div>

      <div className="rounded-xl border border-warm-card-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-warm-card/70">
              <th className="text-left px-4 py-3 text-[10px] text-warm-muted font-medium">Student</th>
              <th className="text-left px-4 py-3 text-[10px] text-warm-muted font-medium">Class</th>
              <th className="text-right px-4 py-3 text-[10px] text-warm-muted font-medium">Fee</th>
              <th className="text-right px-4 py-3 text-[10px] text-warm-muted font-medium">Paid</th>
              <th className="text-right px-4 py-3 text-[10px] text-warm-muted font-medium">Due</th>
              <th className="text-center px-4 py-3 text-[10px] text-warm-muted font-medium">Status</th>
              <th className="text-center px-4 py-3 text-[10px] text-warm-muted font-medium w-24">Action</th>
            </tr>
          </thead>
          <tbody>
            {fees.map(f => {
              const due = (f.netAmount - f.paidAmount) / 100;
              return (
                <tr key={f.id} className="border-t border-warm-card-border/20 hover:bg-warm-card/20 transition-colors">
                  <td className="px-4 py-3 text-xs text-warm-cream">{f.student?.name || 'Unknown'}</td>
                  <td className="px-4 py-3 text-xs text-warm-muted/60">{f.group?.name || f.groupId || '—'}</td>
                  <td className="px-4 py-3 text-xs text-warm-muted text-right">{(f.netAmount / 100).toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-green-400 text-right">{(f.paidAmount / 100).toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-red-400 text-right font-medium">{due.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                      f.status === 'PAID' ? 'bg-green-900/20 text-green-400' :
                      f.status === 'PARTIAL' ? 'bg-yellow-900/20 text-yellow-400' :
                      'bg-red-900/20 text-red-400'
                    }`}>{f.status}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => openPay(f)}
                      className="inline-flex items-center gap-1 rounded-lg bg-warm-accent/20 px-3 py-1.5 text-xs text-warm-accent hover:bg-warm-accent/30 transition-colors">
                      <DollarSign size={12} /> Pay
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {fees.length === 0 && <div className="p-8 text-center text-xs text-warm-muted/40">No pending fees for this month</div>}
      </div>

      {/* Pay Modal */}
      {payModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setPayModal(null)}>
          <div className="rounded-xl border border-warm-card-border bg-[#24201e] p-6 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-medium text-warm-cream mb-1">{payModal.student?.name}</h3>
            <p className="text-[10px] text-warm-muted/50 mb-4">Due: {(payModal.netAmount - payModal.paidAmount) / 100} PKR</p>
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
                <label className="block text-[10px] text-warm-muted/60 uppercase tracking-wider mb-1">Reference (optional)</label>
                <input value={payRef} onChange={e => setPayRef(e.target.value)}
                  className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" placeholder="Cheque # / Transaction ID" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={handlePay} className="flex-1 rounded-lg bg-warm-accent py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] transition-colors">Record Payment</button>
              <button onClick={() => setPayModal(null)} className="rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
