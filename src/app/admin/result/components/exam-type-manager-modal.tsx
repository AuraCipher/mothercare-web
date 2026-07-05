'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { showToast } from '@/components/toast';
import ConfirmModal from '@/components/confirm-modal';
import { X, Plus, Edit3, Trash2, Check, Layers } from 'lucide-react';

export interface ExamType {
  id: string;
  name: string;
  defaultWeight: number | null;
}

interface ExamTypeManagerModalProps {
  sessionId: string;
  open: boolean;
  readOnly?: boolean;
  onClose: () => void;
  onChanged?: () => void;
}

const inputClass =
  'w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent transition-colors';

export default function ExamTypeManagerModal({
  sessionId,
  open,
  readOnly = false,
  onClose,
  onChanged,
}: ExamTypeManagerModalProps) {
  const [types, setTypes] = useState<ExamType[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [addName, setAddName] = useState('');
  const [addWeight, setAddWeight] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const [confirm, setConfirm] = useState<{
    open: boolean;
    title: string;
    message: string;
    variant: 'danger' | 'warning' | 'default';
    confirmLabel: string;
    action: () => Promise<void>;
  }>({ open: false, title: '', message: '', variant: 'default', confirmLabel: 'Confirm', action: async () => {} });

  const loadTypes = useCallback(() => {
    setLoading(true);
    setLoadError('');
    api.getResultExamTypes(sessionId)
      .then((res) => setTypes(res.data || []))
      .catch((e: any) => setLoadError(e.message || 'Failed to load types'))
      .finally(() => setLoading(false));
  }, [sessionId]);

  useEffect(() => {
    if (open) {
      setEditId(null);
      setAddName('');
      setAddWeight('');
      setAddError('');
      setEditError('');
      loadTypes();
    }
  }, [open, loadTypes]);

  const parseWeight = (raw: string): number | undefined => {
    const trimmed = raw.trim();
    if (!trimmed) return undefined;
    const w = Number(trimmed);
    if (isNaN(w) || w < 0 || w > 100) throw new Error('Weight must be between 0 and 100');
    return w;
  };

  const handleAdd = async () => {
    if (!addName.trim()) {
      setAddError('Type name is required');
      return;
    }
    setAdding(true);
    setAddError('');
    try {
      const defaultWeight = parseWeight(addWeight);
      await api.createResultExamType(sessionId, {
        name: addName.trim(),
        ...(defaultWeight !== undefined && { defaultWeight }),
      });
      setAddName('');
      setAddWeight('');
      showToast('success', 'Exam type added');
      loadTypes();
      onChanged?.();
    } catch (e: any) {
      setAddError(e.message || 'Failed to add type');
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (t: ExamType) => {
    setEditId(t.id);
    setEditName(t.name);
    setEditWeight(t.defaultWeight != null ? String(t.defaultWeight) : '');
    setEditError('');
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditError('');
  };

  const handleSaveEdit = async () => {
    if (!editId || !editName.trim()) {
      setEditError('Type name is required');
      return;
    }
    setSaving(true);
    setEditError('');
    try {
      const trimmed = editWeight.trim();
      const defaultWeight = trimmed === '' ? null : parseWeight(editWeight);
      await api.updateResultExamType(sessionId, editId, {
        name: editName.trim(),
        defaultWeight,
      });
      setEditId(null);
      showToast('success', 'Exam type updated');
      loadTypes();
      onChanged?.();
    } catch (e: any) {
      setEditError(e.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const promptDelete = (t: ExamType) => {
    setConfirm({
      open: true,
      title: `Delete "${t.name}"?`,
      message: 'This exam type will be permanently removed. Types linked to exams cannot be deleted.',
      variant: 'danger',
      confirmLabel: 'Delete',
      action: async () => {
        try {
          await api.deleteResultExamType(sessionId, t.id);
          showToast('success', 'Exam type deleted');
          if (editId === t.id) setEditId(null);
          loadTypes();
          onChanged?.();
        } catch (e: any) {
          showToast('error', e.message || 'Failed to delete');
        }
      },
    });
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
        <div
          className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-xl border border-warm-card-border bg-[#24201e] shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-warm-card-border px-6 py-4">
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-warm-accent" />
              <h2 className="text-sm font-medium text-warm-cream">Manage Exam Types</h2>
            </div>
            <button type="button" onClick={onClose} className="text-warm-muted transition-colors hover:text-warm-cream">
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {!readOnly && (
              <div className="mb-4 rounded-lg border border-warm-card-border/60 bg-[#1a1614]/50 p-3">
                <p className="mb-2 text-[10px] uppercase tracking-wide text-warm-muted">Add type</p>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div className="min-w-0 flex-1">
                    <label className="mb-1 block text-[10px] text-warm-muted">Name *</label>
                    <input
                      value={addName}
                      onChange={(e) => setAddName(e.target.value)}
                      placeholder="e.g. Mid Term"
                      className={inputClass}
                      onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    />
                  </div>
                  <div className="w-full sm:w-24">
                    <label className="mb-1 block text-[10px] text-warm-muted">Weight %</label>
                    <input
                      value={addWeight}
                      onChange={(e) => setAddWeight(e.target.value)}
                      placeholder="40"
                      type="number"
                      min={0}
                      max={100}
                      className={inputClass}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAdd}
                    disabled={adding}
                    className="flex shrink-0 items-center justify-center gap-1 rounded-lg bg-warm-accent px-3 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] disabled:opacity-50"
                  >
                    <Plus size={14} /> {adding ? 'Adding…' : 'Add'}
                  </button>
                </div>
                {addError && (
                  <p className="mt-2 rounded border border-red-900/30 bg-red-900/10 px-2 py-1.5 text-xs text-red-400">
                    {addError}
                  </p>
                )}
              </div>
            )}

            {loading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="h-12 animate-pulse rounded-lg bg-warm-card" />
                ))}
              </div>
            ) : loadError ? (
              <p className="text-xs text-[#b39a76]">{loadError}</p>
            ) : types.length === 0 ? (
              <p className="py-6 text-center text-xs text-warm-muted">No exam types yet. Add types before creating exams.</p>
            ) : (
              <div className="space-y-2">
                {types.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-lg border border-warm-card-border bg-warm-card p-3"
                  >
                    {editId === t.id && !readOnly ? (
                      <div className="space-y-2">
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className={inputClass}
                            autoFocus
                          />
                          <input
                            value={editWeight}
                            onChange={(e) => setEditWeight(e.target.value)}
                            placeholder="Weight %"
                            type="number"
                            min={0}
                            max={100}
                            className={`${inputClass} sm:w-24`}
                          />
                        </div>
                        {editError && (
                          <p className="text-xs text-red-400">{editError}</p>
                        )}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleSaveEdit}
                            disabled={saving}
                            className="flex items-center gap-1 rounded-lg bg-warm-accent px-2.5 py-1.5 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] disabled:opacity-50"
                          >
                            <Check size={12} /> {saving ? 'Saving…' : 'Save'}
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="rounded-lg border border-warm-card-border px-2.5 py-1.5 text-xs text-warm-muted hover:text-warm-cream"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm text-warm-cream">{t.name}</p>
                          <p className="text-[11px] text-warm-muted">
                            Default weight: {t.defaultWeight != null ? `${t.defaultWeight}%` : '—'}
                          </p>
                        </div>
                        {!readOnly && (
                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              onClick={() => startEdit(t)}
                              title="Edit"
                              className="rounded-lg p-1.5 text-warm-muted transition-colors hover:bg-warm-card-border/30 hover:text-warm-cream"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => promptDelete(t)}
                              title="Delete"
                              className="rounded-lg p-1.5 text-warm-muted transition-colors hover:bg-warm-card-border/30 hover:text-red-400"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-warm-card-border px-6 py-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-lg border border-warm-card-border py-2 text-xs text-warm-muted transition-colors hover:text-warm-cream"
            >
              Close
            </button>
          </div>
        </div>
      </div>

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
    </>
  );
}
