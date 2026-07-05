'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { showToast } from '@/components/toast';
import { X } from 'lucide-react';

export interface ExamSessionFormValues {
  id?: string;
  name: string;
  startDate: string;
  endDate: string;
}

interface ExamSessionModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  initial?: ExamSessionFormValues | null;
  onClose: () => void;
  onSaved: (session: any) => void;
}

const inputClass =
  'w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent transition-colors';

function toDateInput(d: string) {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

export default function ExamSessionModal({
  open,
  mode,
  initial,
  onClose,
  onSaved,
}: ExamSessionModalProps) {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    if (mode === 'edit' && initial) {
      setName(initial.name);
      setStartDate(toDateInput(initial.startDate));
      setEndDate(toDateInput(initial.endDate));
    } else {
      setName('');
      setStartDate('');
      setEndDate('');
    }
  }, [open, mode, initial]);

  const handleSave = async () => {
    if (!name.trim()) { setError('Session name is required'); return; }
    if (!startDate) { setError('Start date is required'); return; }
    if (!endDate) { setError('End date is required'); return; }
    if (endDate < startDate) { setError('End date cannot be before start date'); return; }

    setSaving(true);
    setError('');
    try {
      if (mode === 'create') {
        const res = await api.createExamSession({ name: name.trim(), startDate, endDate });
        showToast('success', 'Exam session created');
        onSaved(res.data);
      } else if (initial?.id) {
        const res = await api.updateExamSession(initial.id, {
          name: name.trim(),
          startDate,
          endDate,
        });
        showToast('success', 'Session updated');
        onSaved(res.data);
      }
      onClose();
    } catch (e: any) {
      setError(e.message || 'Failed to save session');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl border border-warm-card-border bg-[#24201e] p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium text-warm-cream">
            {mode === 'create' ? 'New exam session' : 'Rename session'}
          </h2>
          <button type="button" onClick={onClose} className="text-warm-muted hover:text-warm-cream">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-[10px] text-warm-muted">Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              placeholder="e.g. Mid Term 2026"
              autoFocus
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[10px] text-warm-muted">Start *</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-[10px] text-warm-muted">End *</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} />
            </div>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-warm-card-border px-3 py-1.5 text-xs text-warm-muted hover:text-warm-cream"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-warm-accent px-3 py-1.5 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] disabled:opacity-50"
          >
            {saving ? 'Saving…' : mode === 'create' ? 'Create' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
