'use client';

import { useState } from 'react';
import { showToast } from '@/components/toast';
import { Search, Users, Printer } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function FamilyPayPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [families, setFamilies] = useState<any[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<any>(null);
  const [payments, setPayments] = useState<Record<string, { amount: number; method: string; ref: string }>>({});
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<any>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const searchFamilies = async () => {
    if (!token || !searchQuery.trim()) return;
    try {
      const res = await fetch(`${API_URL}/admin/families?search=${encodeURIComponent(searchQuery)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setFamilies(json.success ? json.data : []);
    } catch { showToast('error', 'Search failed'); }
  };

  const selectFamily = (family: any) => {
    setSelectedFamily(family);
    const p: Record<string, any> = {};
    for (const s of family.students || []) {
      for (const f of s.studentFees || []) {
        const due = (f.netAmount - f.paidAmount) / 100;
        p[f.id] = { amount: due > 0 ? due : 0, method: 'CASH', ref: '' };
      }
    }
    setPayments(p);
    setReceipt(null);
  };

  const handleSubmit = async () => {
    if (!token || !selectedFamily) return;
    setSubmitting(true);
    const paymentList = Object.entries(payments)
      .filter(([, p]) => p.amount > 0)
      .map(([studentFeeId, p]) => ({
        studentFeeId, amount: Math.round(p.amount * 100), paymentMethod: p.method, reference: p.ref,
      }));

    try {
      const res = await fetch(`${API_URL}/admin/family-payments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ familyId: selectedFamily.id, payments: paymentList }),
      });
      const json = await res.json();
      if (json.success) {
        setReceipt(json.data);
        showToast('success', `Receipt: ${json.data.receiptNumber}`);
      } else showToast('error', json.message || 'Failed');
    } catch { showToast('error', 'Failed'); }
    finally { setSubmitting(false); }
  };

  const printReceipt = () => {
    if (!receipt) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>Receipt ${receipt.receiptNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #222; }
        h1 { font-size: 18px; margin-bottom: 4px; }
        .meta { font-size: 12px; color: #666; margin-bottom: 24px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 16px; }
        th { background: #f0f0f0; text-align: left; padding: 8px; border-bottom: 2px solid #ddd; }
        td { padding: 6px 8px; border-bottom: 1px solid #eee; }
        hr { border: none; border-top: 1px dashed #ccc; margin: 16px 0; }
        .section-title { font-size: 14px; font-weight: bold; margin-bottom: 8px; color: #333; }
        .total { font-size: 16px; margin-top: 16px; text-align: right; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      <h1>Mother Care School — Payment Receipt</h1>
      <div class="meta">Receipt: ${receipt.receiptNumber}<br>Date: ${new Date().toLocaleDateString()}<br>Family: ${receipt.familyPayment?.family?.fatherName || ''}</div>
      ${receipt.familyPayment?.payments?.map((p: any) => `
        <hr>
        <div class="section-title">${p.student?.name || 'Student'} — ${p.student?.group?.name || ''} ${p.student?.group?.section || ''}</div>
        <table><tr><th>Fee Head</th><th style="text-align:right">Amount</th></tr>
        <tr><td>Monthly Fee (${p.studentFee?.month || ''}/${p.studentFee?.year || ''})</td><td style="text-align:right">${((p.studentFee?.totalAmount || 0) / 100).toLocaleString()}</td></tr>
        <tr><td><strong>Paid</strong></td><td style="text-align:right"><strong>${(p.amount / 100).toLocaleString()}</strong></td></tr></table>
      `).join('')}
      <hr>
      <div class="total">Total Paid: <strong>${(receipt.totalAmount / 100).toLocaleString()} PKR</strong></div>
      <div class="meta" style="margin-top:24px">Payment Method: ${receipt.familyPayment?.payments?.[0]?.paymentMethod || 'CASH'}</div>
      </body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  };

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-xl font-light text-warm-cream mb-6">Family Combined Payment</h1>

      {/* Search */}
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

      {/* Family Results */}
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

      {/* Combined Payment Form */}
      {selectedFamily && !receipt && (
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-warm-cream flex items-center gap-2"><Users size={16} /> {selectedFamily.fatherName}</h2>
            <button onClick={() => setSelectedFamily(null)} className="text-xs text-warm-muted hover:text-warm-cream">Change</button>
          </div>

          {selectedFamily.students?.map((student: any) => {
            const fee = student.studentFees?.[0];
            if (!fee) return null;
            const p = payments[fee.id] || { amount: 0, method: 'CASH', ref: '' };
            return (
              <div key={student.id}>
                {selectedFamily.students.indexOf(student) > 0 && <hr className="border-warm-card-border/30 my-4" />}
                <div className="mb-3">
                  <p className="text-sm text-warm-cream font-medium">{student.name}</p>
                  <p className="text-[10px] text-warm-muted/60">{student.group?.name}{student.group?.section ? ` — ${student.group.section}` : ''} · Due: {((fee.netAmount - fee.paidAmount) / 100).toLocaleString()} PKR</p>
                </div>
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

          <div className="mt-6 flex items-center justify-between border-t border-warm-card-border/30 pt-4">
            <span className="text-sm text-warm-cream font-medium">Total: {Object.values(payments).reduce((s, p) => s + p.amount, 0).toLocaleString()} PKR</span>
            <button onClick={handleSubmit} disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-warm-accent px-6 py-2.5 text-sm font-medium text-[#1a1614] hover:bg-[#b39a76] disabled:opacity-50 transition-colors">
              {submitting ? 'Processing...' : 'Confirm & Generate Receipt'}
            </button>
          </div>
        </div>
      )}

      {/* Receipt Result */}
      {receipt && (
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-5 text-center">
          <p className="text-green-400 font-medium text-sm mb-2">✓ Payment Recorded</p>
          <p className="text-warm-cream text-lg font-light">Receipt: {receipt.receiptNumber}</p>
          <p className="text-xs text-warm-muted/60 mt-1">Total: {((receipt.totalAmount || 0) / 100).toLocaleString()} PKR</p>
          <button onClick={printReceipt}
            className="inline-flex items-center gap-1.5 rounded-lg bg-warm-accent px-5 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] transition-colors mt-4">
            <Printer size={14} /> Print Receipt
          </button>
        </div>
      )}
    </main>
  );
}
