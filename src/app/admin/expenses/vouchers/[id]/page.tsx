'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Ban } from 'lucide-react';
import { api } from '@/lib/api';
import { showToast } from '@/components/toast';
import { useAyPermissions } from '@/hooks/use-ay-permissions';

export default function VoucherDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { canDelete } = useAyPermissions('EXPENSES');
  const [voucher, setVoucher] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [voidOpen, setVoidOpen] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [voiding, setVoiding] = useState(false);

  const load = () => {
    setLoading(true);
    api.getExpenseVoucher(id)
      .then((r) => { if (r.success) setVoucher(r.data); })
      .catch((e) => showToast('error', e.message || 'Voucher not found'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const submitVoid = async () => {
    if (!voidReason.trim()) {
      showToast('error', 'Void reason is required');
      return;
    }
    setVoiding(true);
    try {
      await api.voidExpenseVoucher(id, voidReason.trim());
      showToast('success', 'Voucher voided');
      setVoidOpen(false);
      load();
    } catch (e: any) {
      showToast('error', e.message || 'Failed to void');
    } finally {
      setVoiding(false);
    }
  };

  if (loading) return <main className="mx-auto max-w-3xl px-6 py-10"><p className="text-sm text-warm-muted">Loading…</p></main>;
  if (!voucher) return <main className="mx-auto max-w-3xl px-6 py-10"><p className="text-sm text-warm-muted">Voucher not found.</p></main>;

  const detail = voucher.payrollDetail || voucher.utilityDetail || voucher.otherDetail;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <button type="button" onClick={() => router.back()} className="mb-4 flex items-center gap-1 text-xs text-warm-muted hover:text-warm-cream">
        <ArrowLeft size={14} /> Back
      </button>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-light text-warm-cream">{voucher.voucherNumber}</h1>
          <p className="mt-1 text-xs text-warm-muted">{voucher.type} · {voucher.status}</p>
        </div>
        {voucher.status === 'PAID' && canDelete && (
          <button type="button" onClick={() => setVoidOpen(true)} className="flex items-center gap-1 rounded-lg border border-red-500/40 px-3 py-2 text-xs text-red-400 hover:bg-red-900/10">
            <Ban size={14} /> Void
          </button>
        )}
      </div>

      <div className="space-y-3 rounded-xl border border-warm-card-border bg-warm-card p-5 text-sm">
        <Row label="Amount" value={Number(voucher.amount).toLocaleString()} />
        <Row label="Method" value={voucher.paymentMethod?.replace('_', ' ')} />
        <Row label="Paid at" value={new Date(voucher.paidAt).toLocaleString()} />
        <Row label="Recorded by" value={voucher.recordedBy?.name || '—'} />
        {voucher.reference && <Row label="Reference" value={voucher.reference} />}
        {voucher.note && <Row label="Note" value={voucher.note} />}

        {voucher.payrollDetail && (
          <>
            <hr className="border-warm-card-border" />
            <Row label="Payee" value={voucher.payrollDetail.payee?.name} />
            <Row label="Salary month" value={voucher.payrollDetail.salaryMonth} />
            <Row label="Payment kind" value={voucher.payrollDetail.paymentKind} />
            <Row label="Attendance earned" value={Number(voucher.payrollDetail.attendanceEarned ?? 0).toLocaleString()} />
          </>
        )}

        {voucher.utilityDetail && (
          <>
            <hr className="border-warm-card-border" />
            <Row label="Category" value={voucher.utilityDetail.category?.name} />
            <Row label="Provider" value={voucher.utilityDetail.providerName} />
            <Row label="Consumer #" value={voucher.utilityDetail.consumerNumber || '—'} />
            <Row label="Bill ref" value={voucher.utilityDetail.billReference || '—'} />
          </>
        )}

        {voucher.otherDetail && (
          <>
            <hr className="border-warm-card-border" />
            <Row label="Category" value={voucher.otherDetail.category?.name} />
            <Row label="Payee" value={voucher.otherDetail.payeeName} />
            <Row label="Description" value={voucher.otherDetail.description || '—'} />
          </>
        )}

        {voucher.status === 'VOID' && (
          <>
            <hr className="border-warm-card-border" />
            <Row label="Voided at" value={voucher.voidedAt ? new Date(voucher.voidedAt).toLocaleString() : '—'} />
            <Row label="Voided by" value={voucher.voidedBy?.name || '—'} />
            <Row label="Reason" value={voucher.voidReason || '—'} />
          </>
        )}
      </div>

      {voidOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setVoidOpen(false)}>
          <div className="w-full max-w-sm rounded-xl border border-warm-card-border bg-[#24201e] p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-2 text-sm text-warm-cream">Void voucher?</h3>
            <p className="mb-3 text-xs text-warm-muted">Payroll balances will be recalculated if applicable.</p>
            <label className="mb-1 block text-xs text-warm-muted">Void reason *</label>
            <input value={voidReason} onChange={(e) => setVoidReason(e.target.value)} className="mb-4 w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream" placeholder="Why is this payment being voided?" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setVoidOpen(false)} className="rounded-lg border border-warm-card-border px-3 py-2 text-xs text-warm-muted">Cancel</button>
              <button type="button" disabled={voiding} onClick={submitVoid} className="rounded-lg bg-red-600 px-3 py-2 text-xs text-white disabled:opacity-50">Void</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Row({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex justify-between gap-4 text-xs">
      <span className="text-warm-muted">{label}</span>
      <span className="text-right text-warm-cream">{value ?? '—'}</span>
    </div>
  );
}
