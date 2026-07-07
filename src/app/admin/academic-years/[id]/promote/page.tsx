'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ArrowLeft, Check, ChevronRight } from 'lucide-react';
import { showToast } from '@/components/toast';

type Step = 1 | 2 | 3 | 4;

export default function BatchPromotionPage() {
  const router = useRouter();
  const params = useParams();
  const sourceAyId = params.id as string;

  const [branchId, setBranchId] = useState('');
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(true);
  const [pre, setPre] = useState<any>(null);
  const [ack, setAck] = useState<Record<string, boolean>>({});
  const [targetAyId, setTargetAyId] = useState('');
  const [calendarId, setCalendarId] = useState('');
  const [calendars, setCalendars] = useState<any[]>([]);
  const [carryOptions, setCarryOptions] = useState<Record<string, boolean>>({});
  const [runId, setRunId] = useState('');
  const [run, setRun] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const b = localStorage.getItem('activeBranchId');
    if (!b) { router.push('/admin/settings/academic-years'); return; }
    setBranchId(b);
    Promise.all([
      api.getPromotionPreconditions(b, sourceAyId),
      api.getCalendars?.() ?? Promise.resolve({ success: true, data: [] }),
    ]).then(([preRes, calRes]) => {
      if (preRes.success) {
        setPre(preRes.data);
        setCarryOptions(preRes.data.defaultCarryOptions || {});
        const items: Record<string, boolean> = {};
        (preRes.data.acknowledgements || []).forEach((_: string, i: number) => { items[`a${i}`] = false; });
        setAck(items);
      }
      if ((calRes as any).success) setCalendars((calRes as any).data || []);
    }).catch((e) => showToast('error', e.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [sourceAyId, router]);

  const allAcked = Object.values(ack).every(Boolean);

  const startRun = async () => {
    setBusy(true);
    try {
      const res = await api.startBatchPromotion(branchId, sourceAyId, {
        targetAcademicYearId: targetAyId || undefined,
        calendarId: targetAyId ? undefined : calendarId,
        carryOptions,
        previousAcademicYearId: sourceAyId,
      });
      if (!res.success) throw new Error((res as any).message);
      setRunId(res.data.id);
      setRun(res.data);
      setStep(3);
      showToast('success', 'Promotion run started');
    } catch (e: any) {
      showToast('error', e.message || 'Failed to start');
    } finally {
      setBusy(false);
    }
  };

  const doSnapshot = async () => {
    setBusy(true);
    try {
      const res = await api.snapshotBatchPromotion(branchId, sourceAyId, runId);
      if (!res.success) throw new Error((res as any).message);
      setRun(res.data);
      showToast('success', 'Snapshot created');
    } catch (e: any) {
      showToast('error', e.message || 'Snapshot failed');
    } finally {
      setBusy(false);
    }
  };

  const doApply = async () => {
    setBusy(true);
    try {
      const res = await api.applyBatchPromotion(branchId, sourceAyId, runId);
      if (!res.success) throw new Error((res as any).message);
      setRun(res.data);
      setStep(4);
      showToast('success', 'Carry options applied to BUILD_STAGE year');
    } catch (e: any) {
      showToast('error', e.message || 'Apply failed');
    } finally {
      setBusy(false);
    }
  };

  const doPublish = async () => {
    if (!confirm('Publish new year and archive the current ACTIVE year?')) return;
    setBusy(true);
    try {
      const res = await api.publishBatchPromotion(branchId, sourceAyId, runId);
      if (!res.success) throw new Error((res as any).message);
      showToast('success', 'Academic year published');
      router.push(`/admin/academic-years/${run?.targetAcademicYearId || res.data.targetAcademicYearId}`);
    } catch (e: any) {
      showToast('error', e.message || 'Publish failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-sm text-warm-muted">Loading promotion wizard…</div>;
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <button onClick={() => router.back()} className="mb-4 flex items-center gap-2 text-xs text-warm-muted hover:text-warm-cream">
        <ArrowLeft size={14} /> Back
      </button>
      <h1 className="text-lg font-medium text-warm-cream">Batch Promotion</h1>
      <p className="mt-1 text-xs text-warm-muted">
        From <strong>{pre?.source?.calendar?.label}</strong> — current year stays ACTIVE until publish.
      </p>

      {step === 1 && (
        <div className="mt-6 space-y-4 rounded-xl border border-warm-card-border bg-warm-card/20 p-5">
          <h2 className="text-sm font-medium text-warm-cream">Step 1 — Confirm</h2>
          <ul className="space-y-2">
            {(pre?.acknowledgements || []).map((text: string, i: number) => (
              <li key={i}>
                <label className="flex items-start gap-2 text-xs text-warm-cream">
                  <input
                    type="checkbox"
                    checked={!!ack[`a${i}`]}
                    onChange={(e) => setAck((prev) => ({ ...prev, [`a${i}`]: e.target.checked }))}
                    className="mt-0.5 rounded"
                  />
                  {text}
                </label>
              </li>
            ))}
          </ul>
          <button
            disabled={!allAcked}
            onClick={() => setStep(2)}
            className="flex items-center gap-2 rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] disabled:opacity-40"
          >
            Continue <ChevronRight size={14} />
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="mt-6 space-y-4 rounded-xl border border-warm-card-border bg-warm-card/20 p-5">
          <h2 className="text-sm font-medium text-warm-cream">Step 2 — Target year & carry options</h2>
          <div>
            <p className="mb-2 text-xs text-warm-muted">Pick existing BUILD_STAGE year or create new</p>
            <select
              value={targetAyId}
              onChange={(e) => { setTargetAyId(e.target.value); setCalendarId(''); }}
              className="w-full rounded-lg border border-warm-card-border bg-warm-card px-3 py-2 text-xs text-warm-cream"
            >
              <option value="">— Create new year —</option>
              {(pre?.buildYears || []).map((ay: any) => (
                <option key={ay.id} value={ay.id}>{ay.calendar?.label} (BUILD)</option>
              ))}
            </select>
          </div>
          {!targetAyId && (
            <select
              value={calendarId}
              onChange={(e) => setCalendarId(e.target.value)}
              className="w-full rounded-lg border border-warm-card-border bg-warm-card px-3 py-2 text-xs text-warm-cream"
            >
              <option value="">Select calendar label…</option>
              {calendars.map((c: any) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          )}
          <div className="space-y-2">
            <p className="text-xs font-medium text-warm-muted">Carry into new year (defaults recommended)</p>
            {Object.entries(carryOptions).map(([key, on]) => (
              <label key={key} className="flex items-center gap-2 text-xs text-warm-cream">
                <input
                  type="checkbox"
                  checked={!!on}
                  disabled={key === 'datesheets'}
                  onChange={(e) => setCarryOptions((prev) => ({ ...prev, [key]: e.target.checked }))}
                />
                {key}
              </label>
            ))}
          </div>
          <ul className="rounded-lg border border-warm-card-border/50 bg-warm-card/30 p-3 text-[11px] text-warm-muted">
            {(pre?.fixedStudentRules || []).map((r: string) => <li key={r}>• {r}</li>)}
          </ul>
          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted">Back</button>
            <button
              disabled={busy || (!targetAyId && !calendarId)}
              onClick={startRun}
              className="rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] disabled:opacity-40"
            >
              Start promotion
            </button>
          </div>
        </div>
      )}

      {step >= 3 && run && (
        <div className="mt-6 space-y-4 rounded-xl border border-warm-card-border bg-warm-card/20 p-5">
          <h2 className="text-sm font-medium text-warm-cream">Step 3 — Build stage</h2>
          <p className="text-xs text-warm-muted">Phase: <strong>{run.phase}</strong></p>
          <div className="flex flex-wrap gap-2">
            <button disabled={busy || run.phase !== 'DRAFT'} onClick={doSnapshot} className="rounded-lg border border-warm-card-border px-3 py-2 text-xs text-warm-cream disabled:opacity-40">
              Create snapshot
            </button>
            <button disabled={busy || run.phase !== 'SNAPSHOT_DONE'} onClick={doApply} className="rounded-lg border border-warm-card-border px-3 py-2 text-xs text-warm-cream disabled:opacity-40">
              Apply carry options
            </button>
          </div>
          {step === 4 && (
            <button disabled={busy || run.phase !== 'APPLIED'} onClick={doPublish} className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-xs font-medium text-white disabled:opacity-40">
              <Check size={14} /> Publish new year
            </button>
          )}
        </div>
      )}
    </div>
  );
}
