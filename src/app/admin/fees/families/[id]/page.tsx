'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { showToast } from '@/components/toast';
import { ArrowLeft, Users, CreditCard, History, Printer } from 'lucide-react';
import config from '@/config';
import FamilyPayModal from '@/components/fees/FamilyPayModal';
import { fetchAndPrintFamilyReceipt } from '@/lib/familyReceipt';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatPkr(paise: number) {
  return (paise / 100).toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function monthLabel(month: number, year: number) {
  return `${MONTHS[(month || 1) - 1]} ${year}`;
}

export default function FamilyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [family, setFamily] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [payOpen, setPayOpen] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const ayId = typeof window !== 'undefined' ? localStorage.getItem('activeAYId') : null;

  const loadFamily = useCallback(async () => {
    if (!token || !id || !ayId) return;
    setLoading(true);
    try {
      const res = await fetch(`${config.apiUrl}/admin/families/${id}?academicYearId=${ayId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setFamily(json.data);
      else showToast('error', json.message || 'Family not found');
    } catch {
      showToast('error', 'Failed to load family');
    } finally {
      setLoading(false);
    }
  }, [token, id, ayId]);

  useEffect(() => { loadFamily(); }, [loadFamily]);

  useEffect(() => {
    if (searchParams.get('pay') === '1' && family && !loading) {
      setPayOpen(true);
    }
  }, [searchParams, family, loading]);

  const printFamilyReceipt = async (familyPaymentId: string) => {
    if (!token) return;
    try {
      await fetchAndPrintFamilyReceipt(familyPaymentId, token, config.apiUrl, 'print');
    } catch {
      showToast('error', 'Could not load family receipt');
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <p className="text-xs text-warm-muted/50">Loading…</p>
      </main>
    );
  }

  if (!family) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <p className="text-xs text-warm-muted/50">Family not found</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <button
        onClick={() => router.push('/admin/fees/families')}
        className="mb-4 inline-flex items-center gap-1 text-[11px] text-warm-muted/60 hover:text-warm-cream"
      >
        <ArrowLeft size={12} /> Back to Families
      </button>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Users size={22} className="text-warm-accent" />
          <div>
            <h1 className="text-xl font-light text-warm-cream">{family.name}</h1>
            <p className="text-[11px] text-warm-muted/60">
              {[family.fatherName, family.phone].filter(Boolean).join(' · ') || 'No contact info'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setPayOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-warm-accent/20 px-4 py-2 text-xs text-warm-accent hover:bg-warm-accent/30 transition-colors"
        >
          <CreditCard size={14} /> Pay as Family
        </button>
      </div>

      <FamilyPayModal
        familyId={id}
        open={payOpen}
        onClose={() => setPayOpen(false)}
        token={token}
        ayId={ayId}
      />

      {/* Summary bar */}
      <div className="rounded-xl border border-warm-card-border bg-warm-card p-5 mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <p className="text-[10px] text-warm-muted/50 uppercase">Students</p>
          <p className="text-lg font-light text-warm-cream mt-1">{family.studentCount ?? 0}</p>
        </div>
        <div>
          <p className="text-[10px] text-warm-muted/50 uppercase">Total Due</p>
          <p className={`text-lg font-light mt-1 ${(family.totalDuePaise ?? 0) > 0 ? 'text-red-400' : 'text-green-400'}`}>
            {formatPkr(family.totalDuePaise ?? 0)} PKR
          </p>
        </div>
        <div>
          <p className="text-[10px] text-warm-muted/50 uppercase">Family Payments</p>
          <p className="text-lg font-light text-warm-cream mt-1">{family.payments?.length ?? 0}</p>
        </div>
        <div>
          <p className="text-[10px] text-warm-muted/50 uppercase">Status</p>
          <p className="text-lg font-light text-warm-cream mt-1">{family.isActive !== false ? 'Active' : 'Inactive'}</p>
        </div>
      </div>

      {/* Per-student dues */}
      <div className="rounded-xl border border-warm-card-border bg-warm-card p-5 mb-6">
        <h2 className="text-sm font-medium text-warm-cream mb-4">Student Dues</h2>
        {(family.students || []).length === 0 ? (
          <p className="text-xs text-warm-muted/50">No active students in this family</p>
        ) : (
          <div className="space-y-4">
            {(family.students || []).map((s: any) => {
              const cls = [s.group?.name, s.group?.section].filter(Boolean).join(' — ');
              const unpaidFees = (s.studentFees || []).filter((f: any) => (f.remainingPaise ?? 0) > 0);
              return (
                <div key={s.id} className="border-b border-warm-card-border/10 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <button
                      onClick={() => router.push(`/admin/fees/student/${s.id}`)}
                      className="text-xs text-warm-cream hover:text-warm-accent text-left"
                    >
                      {s.name}
                      <span className="text-warm-muted/50 ml-2">{cls}{s.rollNumber ? ` · ${s.rollNumber}` : ''}</span>
                    </button>
                    <span className={`text-xs font-medium shrink-0 ${(s.totalDuePaise ?? 0) > 0 ? 'text-red-400' : 'text-green-400/80'}`}>
                      {(s.totalDuePaise ?? 0) > 0 ? `${formatPkr(s.totalDuePaise)} PKR` : 'Clear'}
                    </span>
                  </div>
                  {unpaidFees.length > 0 && (
                    <div className="ml-2 space-y-1">
                      {unpaidFees.map((f: any) => (
                        <div key={f.id} className="flex justify-between text-[10px] text-warm-muted/60">
                          <span>{monthLabel(f.month, f.year)}</span>
                          <span>{formatPkr(f.remainingPaise)} PKR due</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Family payment history */}
      <div className="rounded-xl border border-warm-card-border bg-warm-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <History size={16} className="text-warm-muted/60" />
          <h2 className="text-sm font-medium text-warm-cream">Family Payment History</h2>
        </div>
        {(family.payments || []).length === 0 ? (
          <p className="text-xs text-warm-muted/50">No family payments yet</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[520px] space-y-2">
              {(family.payments || []).map((fp: any) => (
                <div key={fp.id} className="rounded-lg border border-warm-card-border/20 px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs text-warm-cream font-medium">{fp.receiptNumber}</p>
                      <p className="text-[10px] text-warm-muted/50">
                        {new Date(fp.paymentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        {fp.recordedBy?.name ? ` · ${fp.recordedBy.name}` : ''}
                      </p>
                    </div>
                    <p className="text-xs text-green-400">{formatPkr(fp.totalAmount)} PKR</p>
                    <button
                      onClick={() => printFamilyReceipt(fp.id)}
                      className="mt-1 inline-flex items-center gap-1 text-[10px] text-warm-accent hover:underline"
                    >
                      <Printer size={11} /> Print
                    </button>
                  </div>
                  {(fp.payments || []).length > 0 && (
                    <div className="mt-2 pt-2 border-t border-warm-card-border/10 space-y-0.5">
                      {fp.payments.map((p: any) => (
                        <div key={p.id} className="flex justify-between text-[10px] text-warm-muted/55">
                          <span>{p.student?.name}{p.studentFee ? ` — ${monthLabel(p.studentFee.month, p.studentFee.year)}` : ''}</span>
                          <span>{formatPkr(p.amount)} PKR</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
