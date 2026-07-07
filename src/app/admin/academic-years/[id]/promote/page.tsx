'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ArrowLeft, Check, ChevronRight, Plus, X } from 'lucide-react';
import { showToast } from '@/components/toast';
import ConfirmModal from '@/components/confirm-modal';

type Step = 1 | 2 | 3 | 4;

export function getPromotionCarryValidation(carryOptions: Record<string, boolean>) {
  const selectedCarryCount = Object.entries(carryOptions).filter(([k, v]) => k !== 'datesheets' && !!v).length;
  const invalidCarryConfig =
    (!!carryOptions.students && !carryOptions.classes)
    || (!!carryOptions.teacherAssignments && (!carryOptions.classes || !carryOptions.subjects))
    || (!!carryOptions.timetableGrid && (!carryOptions.classes || !carryOptions.subjects));
  return { selectedCarryCount, invalidCarryConfig };
}

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
  const [useExistingTarget, setUseExistingTarget] = useState(true);
  const [showCreateAyModal, setShowCreateAyModal] = useState(false);
  const [newAyLabel, setNewAyLabel] = useState('');
  const [newAyStartDate, setNewAyStartDate] = useState('');
  const [newAyEndDate, setNewAyEndDate] = useState('');
  const [creatingAy, setCreatingAy] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);

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
        if (preRes.data?.inProgressRun) {
          const existing = preRes.data.inProgressRun;
          setRun(existing);
          setRunId(existing.id);
          if (existing.phase === 'DRAFT') setStep(2);
          else if (existing.phase === 'SNAPSHOT_DONE') setStep(3);
          else if (existing.phase === 'APPLIED') setStep(4);
        }
        const items: Record<string, boolean> = {};
        (preRes.data.acknowledgements || []).forEach((_: string, i: number) => { items[`a${i}`] = false; });
        setAck(items);
      }
      if ((calRes as any).success) setCalendars((calRes as any).data || []);
    }).catch((e) => showToast('error', e.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [sourceAyId, router]);

  const allAcked = Object.values(ack).every(Boolean);
  const { selectedCarryCount, invalidCarryConfig } = getPromotionCarryValidation(carryOptions);

  const startRun = async () => {
    if (selectedCarryCount === 0) {
      showToast('error', 'Select at least one carry option');
      return;
    }
    if (invalidCarryConfig) {
      showToast('error', 'Carry dependencies are invalid. Enable required base options.');
      return;
    }
    setBusy(true);
    try {
      const res = await api.startBatchPromotion(branchId, sourceAyId, {
        targetAcademicYearId: useExistingTarget ? (targetAyId || undefined) : undefined,
        calendarId: useExistingTarget ? undefined : calendarId,
        carryOptions,
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

  const createBuildStageAy = async () => {
    if (!newAyLabel.trim() || !newAyStartDate || !newAyEndDate) {
      showToast('error', 'Label, start date and end date are required');
      return;
    }
    if (new Date(newAyStartDate) >= new Date(newAyEndDate)) {
      showToast('error', 'End date must be after start date');
      return;
    }
    setCreatingAy(true);
    try {
      const calRes = await api.createCalendar({
        label: newAyLabel.trim(),
        startDate: newAyStartDate,
        endDate: newAyEndDate,
      });
      if (!calRes.success || !calRes.data?.id) {
        throw new Error('Failed to create calendar');
      }
      const ayRes = await api.createAcademicYear(branchId, {
        calendarId: calRes.data.id,
        previousAcademicYearId: sourceAyId,
      });
      if (!ayRes.success || !ayRes.data?.id) {
        throw new Error('Failed to create academic year');
      }
      setPre((prev: any) => ({
        ...prev,
        buildYears: [{ ...ayRes.data, calendar: calRes.data }, ...(prev?.buildYears || [])],
      }));
      setTargetAyId(ayRes.data.id);
      setUseExistingTarget(true);
      setShowCreateAyModal(false);
      setNewAyLabel('');
      setNewAyStartDate('');
      setNewAyEndDate('');
      showToast('success', 'BUILD_STAGE academic year created');
    } catch (e: any) {
      showToast('error', e.message || 'Failed to create academic year');
    } finally {
      setCreatingAy(false);
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
      <div className="mt-3 rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-[11px] text-blue-200">
        Target year remains <strong>BUILD_STAGE</strong> for preview and data checks. Nothing goes live until you click Publish.
      </div>

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
          {pre?.inProgressRun && (
            <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-3 text-xs text-blue-200">
              Existing promotion run found for this branch:
              <span className="ml-1 font-medium">{pre.inProgressRun.sourceAy?.calendar?.label} → {pre.inProgressRun.targetAy?.calendar?.label}</span>
              <span className="ml-1">({pre.inProgressRun.phase})</span>
              <button
                onClick={() => {
                  setRun(pre.inProgressRun);
                  setRunId(pre.inProgressRun.id);
                  if (pre.inProgressRun.phase === 'DRAFT') setStep(2);
                  else if (pre.inProgressRun.phase === 'SNAPSHOT_DONE') setStep(3);
                  else if (pre.inProgressRun.phase === 'APPLIED') setStep(4);
                }}
                className="ml-3 rounded border border-blue-400/40 px-2 py-0.5 text-[11px] hover:bg-blue-500/20"
              >
                Continue existing
              </button>
            </div>
          )}
          <div className="rounded-lg border border-warm-card-border/60 bg-warm-card/25 p-3">
            <p className="mb-2 text-xs text-warm-muted">Choose target setup method</p>
            <div className="flex flex-wrap gap-3 text-xs">
              <label className="flex items-center gap-2 text-warm-cream">
                <input
                  type="radio"
                  checked={useExistingTarget}
                  onChange={() => setUseExistingTarget(true)}
                />
                Use existing BUILD_STAGE year
              </label>
              <label className="flex items-center gap-2 text-warm-cream">
                <input
                  type="radio"
                  checked={!useExistingTarget}
                  onChange={() => setUseExistingTarget(false)}
                />
                Create new BUILD_STAGE year from calendar
              </label>
            </div>
          </div>
          <div>
            {useExistingTarget ? (
              <>
                <p className="mb-2 text-xs text-warm-muted">Select existing BUILD_STAGE year</p>
                <select
                  value={targetAyId}
                  onChange={(e) => { setTargetAyId(e.target.value); }}
                  className="w-full rounded-lg border border-warm-card-border bg-warm-card px-3 py-2 text-xs text-warm-cream"
                >
                  <option value="">Select target BUILD_STAGE year…</option>
                  {(pre?.buildYears || []).map((ay: any) => (
                    <option key={ay.id} value={ay.id}>{ay.calendar?.label} (BUILD_STAGE)</option>
                  ))}
                </select>
                {(pre?.buildYears || []).length === 0 && (
                  <div className="mt-2 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-2 text-[11px] text-yellow-300">
                    No BUILD_STAGE year exists yet.
                    <button
                      onClick={() => setShowCreateAyModal(true)}
                      className="ml-2 inline-flex items-center gap-1 rounded border border-yellow-500/40 px-2 py-0.5 text-[10px] hover:bg-yellow-500/10"
                    >
                      <Plus size={11} /> Create AY
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <p className="mb-2 text-xs text-warm-muted">Select calendar to create new BUILD_STAGE year</p>
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
                <p className="mt-1 text-[11px] text-warm-muted">
                  If selected calendar already exists in this branch as BUILD_STAGE, it will reuse that year.
                </p>
              </>
            )}
          </div>
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
                {key === 'classes' && 'Classes/sections skeleton + order mapping'}
                {key === 'students' && 'Promote active students (+1); highest class graduates; lowest stays empty'}
                {key === 'subjects' && 'Subjects and class-subject links'}
                {key === 'teacherAssignments' && 'Teacher assignments as initial setup (not attendance history)'}
                {key === 'timetableGrid' && 'Timetable structure as initial setup (datesheets remain empty)'}
                {key === 'feeStructures' && 'Fee structure templates only (not paid/outstanding transactions)'}
                {key === 'attendance' && 'Attendance records history'}
                {key === 'examsResults' && 'Exam sessions/results history'}
                {key === 'announcementsMessages' && 'Announcements/messages history'}
                {key === 'datesheets' && 'Datesheets (always disabled for carry)'}
              </label>
            ))}
            {selectedCarryCount === 0 && (
              <p className="text-[11px] text-yellow-300">At least one carry option should be selected.</p>
            )}
            {!!carryOptions.students && !carryOptions.classes && (
              <p className="text-[11px] text-red-300">Students carry requires classes.</p>
            )}
            {!!carryOptions.teacherAssignments && (!carryOptions.classes || !carryOptions.subjects) && (
              <p className="text-[11px] text-red-300">Teacher assignments require classes + subjects.</p>
            )}
            {!!carryOptions.timetableGrid && (!carryOptions.classes || !carryOptions.subjects) && (
              <p className="text-[11px] text-red-300">Timetable requires classes + subjects.</p>
            )}
          </div>
          <ul className="rounded-lg border border-warm-card-border/50 bg-warm-card/30 p-3 text-[11px] text-warm-muted">
            {(pre?.fixedStudentRules || []).map((r: string) => <li key={r}>• {r}</li>)}
          </ul>
          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted">Back</button>
            <button
              disabled={busy || invalidCarryConfig || selectedCarryCount === 0 || (useExistingTarget ? !targetAyId : !calendarId)}
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
          <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-3 py-2 text-[11px] text-yellow-200">
            BUILD_STAGE preview mode: operations continue in old ACTIVE year until publish.
          </div>
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
            <button disabled={busy || run.phase !== 'APPLIED'} onClick={() => setShowPublishConfirm(true)} className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-xs font-medium text-white disabled:opacity-40">
              <Check size={14} /> Publish new year
            </button>
          )}
        </div>
      )}

      {showCreateAyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setShowCreateAyModal(false)}>
          <div className="w-full max-w-md rounded-xl border border-warm-card-border bg-[#24201e] p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium text-warm-cream">Create BUILD_STAGE Year</h3>
              <button onClick={() => setShowCreateAyModal(false)} className="text-warm-muted hover:text-warm-cream"><X size={15} /></button>
            </div>
            <div className="space-y-3">
              <input
                placeholder="Label e.g. 2026-2027"
                value={newAyLabel}
                onChange={(e) => setNewAyLabel(e.target.value)}
                className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream"
              />
              <div className="grid grid-cols-2 gap-2">
                <input type="date" value={newAyStartDate} onChange={(e) => setNewAyStartDate(e.target.value)} className="rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream [color-scheme:dark]" />
                <input type="date" value={newAyEndDate} onChange={(e) => setNewAyEndDate(e.target.value)} className="rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream [color-scheme:dark]" />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShowCreateAyModal(false)} className="rounded-lg border border-warm-card-border px-3 py-2 text-xs text-warm-muted">Cancel</button>
              <button onClick={createBuildStageAy} disabled={creatingAy} className="rounded-lg bg-warm-accent px-3 py-2 text-xs font-medium text-[#1a1614] disabled:opacity-50">
                {creatingAy ? 'Creating…' : 'Create AY'}
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal
        open={showPublishConfirm}
        title="Publish Academic Year?"
        message="Publish new year and archive the current ACTIVE year?"
        confirmLabel="Publish"
        cancelLabel="Cancel"
        variant="warning"
        loading={busy}
        onConfirm={() => {
          setShowPublishConfirm(false);
          void doPublish();
        }}
        onCancel={() => setShowPublishConfirm(false)}
      />
    </div>
  );
}
