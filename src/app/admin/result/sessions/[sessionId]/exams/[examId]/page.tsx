'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { showToast } from '@/components/toast';
import ConfirmModal from '@/components/confirm-modal';
import CollapsibleSection from '../../../../components/collapsible-section';
import type { ExamType } from '../../../../components/exam-type-manager-modal';
import { ChevronLeft, FileText, Trash2 } from 'lucide-react';

const inputClass =
  'w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent transition-colors';

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
}

function toDateInput(d: string | null | undefined) {
  if (!d) return '';
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

export default function ExamDetailPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;
  const examId = params.examId as string;

  const [exam, setExam] = useState<any>(null);
  const [types, setTypes] = useState<ExamType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [examTypeId, setExamTypeId] = useState('');
  const [weightOverride, setWeightOverride] = useState('');
  const [useDateRange, setUseDateRange] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [publishing, setPublishing] = useState(false);

  const [confirm, setConfirm] = useState<{
    open: boolean;
    title: string;
    message: string;
    variant: 'danger' | 'warning' | 'default';
    confirmLabel: string;
    action: () => Promise<void>;
  }>({ open: false, title: '', message: '', variant: 'default', confirmLabel: 'Confirm', action: async () => {} });

  const isReadOnly = typeof window !== 'undefined' && localStorage.getItem('activeAYStatus') === 'ARCHIVED';
  const isActive = exam?.status === 'ACTIVE';

  const populateForm = useCallback((e: any) => {
    setName(e.name);
    setExamTypeId(e.examTypeId);
    setWeightOverride(
      e.weightOverride != null
        ? String(e.weightOverride)
        : e.examType?.defaultWeight != null
          ? String(e.examType.defaultWeight)
          : '',
    );
    setUseDateRange(!!e.endDate);
    setStartDate(toDateInput(e.startDate));
    setEndDate(toDateInput(e.endDate));
  }, []);

  const loadExam = useCallback(() => {
    setLoading(true);
    setError('');
    Promise.all([
      api.getResultExam(examId),
      api.getResultExamTypes(sessionId),
    ])
      .then(([examRes, typesRes]) => {
        setExam(examRes.data);
        setTypes(typesRes.data || []);
        populateForm(examRes.data);
      })
      .catch((e: any) => setError(e.message || 'Failed to load exam'))
      .finally(() => setLoading(false));
  }, [examId, sessionId, populateForm]);

  useEffect(() => {
    loadExam();
  }, [loadExam]);

  const handleTypeChange = (typeId: string) => {
    setExamTypeId(typeId);
    const t = types.find((x) => x.id === typeId);
    if (exam && exam.examTypeId !== typeId) {
      setWeightOverride(t?.defaultWeight != null ? String(t.defaultWeight) : '');
    }
  };

  const buildPayload = () => {
    const wRaw = weightOverride.trim();
    let weight: number | null | undefined = undefined;
    if (wRaw) {
      const w = Number(wRaw);
      if (isNaN(w) || w < 0 || w > 100) throw new Error('Weight must be between 0 and 100');
      const t = types.find((x) => x.id === examTypeId);
      weight = w === (t?.defaultWeight ?? null) ? null : w;
    } else {
      weight = null;
    }
    return {
      name: name.trim(),
      examTypeId,
      weightOverride: weight,
      startDate,
      endDate: useDateRange && endDate ? endDate : null,
    };
  };

  const handleSave = async () => {
    if (!name.trim()) { setSaveError('Exam name is required'); return; }
    if (!startDate) { setSaveError('Start date is required'); return; }
    setSaving(true);
    setSaveError('');
    try {
      const payload = buildPayload();
      const res = await api.updateResultExam(examId, payload);
      setExam(res.data);
      populateForm(res.data);
      showToast('success', 'Exam updated');
    } catch (e: any) {
      setSaveError(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const res = await api.updateResultExam(examId, { status: 'ACTIVE' });
      setExam(res.data);
      showToast('success', 'Exam published (Active)');
    } catch (e: any) {
      showToast('error', e.message || 'Cannot publish exam');
    } finally {
      setPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    setPublishing(true);
    try {
      const res = await api.updateResultExam(examId, { status: 'DRAFT' });
      setExam(res.data);
      showToast('success', 'Exam set to Draft');
    } catch (e: any) {
      showToast('error', e.message || 'Cannot unpublish');
    } finally {
      setPublishing(false);
    }
  };

  const promptDelete = () => {
    setConfirm({
      open: true,
      title: `Delete "${exam?.name}"?`,
      message: 'This exam will be permanently removed. Exams with classes assigned cannot be deleted.',
      variant: 'danger',
      confirmLabel: 'Delete',
      action: async () => {
        try {
          await api.deleteResultExam(examId);
          showToast('success', 'Exam deleted');
          router.push(`/admin/result/sessions/${sessionId}`);
        } catch (e: any) {
          showToast('error', e.message || 'Failed to delete');
        }
      },
    });
  };

  const detailsSubtitle = exam
    ? `${exam.examType?.name ?? 'Type'} · ${exam.weightOverride ?? exam.examType?.defaultWeight ?? '—'}% · ${exam.endDate ? `${fmtDate(exam.startDate)} – ${fmtDate(exam.endDate)}` : fmtDate(exam.startDate)}`
    : undefined;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <button
        type="button"
        onClick={() => router.push(`/admin/result/sessions/${sessionId}`)}
        className="mb-4 flex items-center gap-1 text-xs text-warm-muted transition-colors hover:text-warm-cream"
      >
        <ChevronLeft size={14} /> Back to session
      </button>

      {loading ? (
        <div className="space-y-2">
          <div className="h-12 animate-pulse rounded-xl bg-warm-card" />
          <div className="h-12 animate-pulse rounded-xl bg-warm-card" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-warm-card-border bg-warm-card px-4 py-3 text-xs text-[#b39a76]">{error}</div>
      ) : exam ? (
        <div className="space-y-2">
          <div className="mb-2 flex flex-wrap items-start justify-between gap-2 px-1">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <FileText size={16} className="shrink-0 text-warm-accent" />
                <h1 className="truncate text-lg font-light text-warm-cream">{exam.name}</h1>
                <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-medium ${
                  isActive ? 'bg-green-900/30 text-green-400' : 'bg-warm-card-border/50 text-warm-muted'
                }`}>
                  {exam.status}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-warm-muted">{exam.examSession?.name}</p>
            </div>
            {!isReadOnly && (
              <div className="flex shrink-0 items-center gap-1.5">
                {isActive ? (
                  <button
                    type="button"
                    onClick={handleUnpublish}
                    disabled={publishing}
                    className="rounded-lg border border-warm-card-border px-2.5 py-1 text-[10px] text-warm-muted hover:text-warm-cream disabled:opacity-50"
                  >
                    Set Draft
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePublish}
                    disabled={publishing}
                    className="rounded-lg bg-green-800/40 px-2.5 py-1 text-[10px] font-medium text-green-400 hover:bg-green-800/60 disabled:opacity-50"
                  >
                    {publishing ? '…' : 'Publish'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={promptDelete}
                  className="rounded-lg p-1.5 text-warm-muted hover:text-red-400"
                  title="Delete"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            )}
          </div>

          {isActive && (
            <p className="px-1 text-[11px] text-green-400/90">
              Published — marks are read-only until set back to Draft.
            </p>
          )}

          <CollapsibleSection
            title="Exam details"
            subtitle={detailsSubtitle}
            defaultOpen={false}
          >
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-[10px] text-warm-muted">Name *</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isReadOnly || isActive}
                  className={`${inputClass} disabled:opacity-60`}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[10px] text-warm-muted">Type</label>
                  <select
                    value={examTypeId}
                    onChange={(e) => handleTypeChange(e.target.value)}
                    disabled={isReadOnly || isActive}
                    className={`${inputClass} disabled:opacity-60`}
                  >
                    {types.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] text-warm-muted">Weight %</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={weightOverride}
                    onChange={(e) => setWeightOverride(e.target.value)}
                    disabled={isReadOnly || isActive}
                    className={`${inputClass} disabled:opacity-60`}
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-[10px] text-warm-muted">
                <input
                  type="checkbox"
                  checked={useDateRange}
                  onChange={(e) => setUseDateRange(e.target.checked)}
                  disabled={isReadOnly || isActive}
                  className="h-3 w-3 rounded"
                />
                Date range
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[10px] text-warm-muted">Start</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    disabled={isReadOnly || isActive}
                    className={`${inputClass} disabled:opacity-60`}
                  />
                </div>
                {useDateRange && (
                  <div>
                    <label className="mb-1 block text-[10px] text-warm-muted">End</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      disabled={isReadOnly || isActive}
                      className={`${inputClass} disabled:opacity-60`}
                    />
                  </div>
                )}
              </div>
              {saveError && <p className="text-xs text-red-400">{saveError}</p>}
              {!isReadOnly && !isActive && (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-lg bg-warm-accent px-3 py-1.5 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              )}
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title="Structure"
            subtitle="Classes & subjects — generate on exam setup"
            defaultOpen={false}
          >
            <p className="text-center text-xs text-warm-muted py-4">
              Phase 4 — generate and configure class/subject structure here.
            </p>
          </CollapsibleSection>

          <ConfirmModal
            open={confirm.open}
            title={confirm.title}
            message={confirm.message}
            variant={confirm.variant}
            confirmLabel={confirm.confirmLabel}
            onConfirm={async () => {
              await confirm.action();
              setConfirm((prev) => ({ ...prev, open: false }));
            }}
            onCancel={() => setConfirm((prev) => ({ ...prev, open: false }))}
          />
        </div>
      ) : null}
    </main>
  );
}
