'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { showToast } from '@/components/toast';
import type { ExamType } from './exam-type-manager-modal';
import { X, Plus } from 'lucide-react';

interface CreateExamModalProps {
  sessionId: string;
  open: boolean;
  onClose: () => void;
  onCreated: (examId: string) => void;
}

const inputClass =
  'w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent transition-colors';

export default function CreateExamModal({ sessionId, open, onClose, onCreated }: CreateExamModalProps) {
  const [types, setTypes] = useState<ExamType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);

  const [name, setName] = useState('');
  const [examTypeId, setExamTypeId] = useState('');
  const [weightOverride, setWeightOverride] = useState('');
  const [useDateRange, setUseDateRange] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setName('');
    setExamTypeId('');
    setWeightOverride('');
    setUseDateRange(false);
    setStartDate('');
    setEndDate('');
    setError('');
    setLoadingTypes(true);
    api.getResultExamTypes(sessionId)
      .then((res) => setTypes(res.data || []))
      .catch((e: any) => setError(e.message || 'Failed to load exam types'))
      .finally(() => setLoadingTypes(false));
  }, [open, sessionId]);

  const handleTypeChange = (typeId: string) => {
    setExamTypeId(typeId);
    const t = types.find((x) => x.id === typeId);
    setWeightOverride(t?.defaultWeight != null ? String(t.defaultWeight) : '');
  };

  const handleCreate = async () => {
    if (!name.trim()) { setError('Exam name is required'); return; }
    if (!examTypeId) { setError('Select an exam type'); return; }
    if (!startDate) { setError('Start date is required'); return; }
    if (useDateRange && endDate && endDate < startDate) {
      setError('End date cannot be before start date');
      return;
    }
    const wRaw = weightOverride.trim();
    let weight: number | undefined;
    if (wRaw) {
      const w = Number(wRaw);
      if (isNaN(w) || w < 0 || w > 100) { setError('Weight must be between 0 and 100'); return; }
      weight = w;
    }

    setCreating(true);
    setError('');
    try {
      const res = await api.createResultExam(sessionId, {
        name: name.trim(),
        examTypeId,
        ...(weight !== undefined && { weightOverride: weight }),
        startDate,
        ...(useDateRange && endDate ? { endDate } : {}),
      }) as { data: { id: string } };
      showToast('success', 'Exam created');
      onClose();
      onCreated(res.data.id);
    } catch (e: any) {
      setError(e.message || 'Failed to create exam');
    } finally {
      setCreating(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl border border-warm-card-border bg-[#24201e] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium text-warm-cream">Create Exam</h2>
          <button type="button" onClick={onClose} className="text-warm-muted hover:text-warm-cream">
            <X size={16} />
          </button>
        </div>

        {loadingTypes ? (
          <div className="h-24 animate-pulse rounded-lg bg-warm-card" />
        ) : types.length === 0 ? (
          <p className="py-4 text-center text-xs text-warm-muted">
            Add exam types first using Manage Types.
          </p>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs text-warm-muted">Name *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mid Term Paper 1" className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-warm-muted">Exam type *</label>
              <select
                value={examTypeId}
                onChange={(e) => handleTypeChange(e.target.value)}
                className={inputClass}
              >
                <option value="">Select type…</option>
                {types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}{t.defaultWeight != null ? ` (${t.defaultWeight}%)` : ''}
                  </option>
                ))}
              </select>
            </div>
            {examTypeId && (
              <div>
                <label className="mb-1 block text-xs text-warm-muted">Weight % (override)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={weightOverride}
                  onChange={(e) => setWeightOverride(e.target.value)}
                  placeholder="From type default"
                  className={inputClass}
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="useDateRange"
                checked={useDateRange}
                onChange={(e) => setUseDateRange(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-warm-card-border bg-[#1a1614] text-warm-accent"
              />
              <label htmlFor="useDateRange" className="text-xs text-warm-muted">Date range (multiple days)</label>
            </div>
            <div className={useDateRange ? 'grid grid-cols-2 gap-3' : ''}>
              <div>
                <label className="mb-1 block text-xs text-warm-muted">{useDateRange ? 'Start date *' : 'Date *'}</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
              </div>
              {useDateRange && (
                <div>
                  <label className="mb-1 block text-xs text-warm-muted">End date</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} />
                </div>
              )}
            </div>
            {error && (
              <p className="rounded border border-red-900/30 bg-red-900/10 px-2 py-1.5 text-xs text-red-400">{error}</p>
            )}
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-warm-card-border py-2 text-xs text-warm-muted hover:text-warm-cream">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating}
                className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-warm-accent py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] disabled:opacity-50"
              >
                <Plus size={14} /> {creating ? 'Creating…' : 'Create & continue'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
