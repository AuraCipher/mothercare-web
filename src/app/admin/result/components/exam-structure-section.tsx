'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { showToast } from '@/components/toast';
import { ChevronDown, ChevronRight, Layers, Lock, RefreshCw } from 'lucide-react';

export interface StructureSubject {
  id: string;
  isActive: boolean;
  totalMarks: number | null;
  passingMarks: number | null;
  hasMarks: boolean;
  subject: { id: string; name: string; code: string | null };
}

export interface StructureClass {
  id: string;
  examId: string;
  classId: string;
  isActive: boolean;
  hasMarks: boolean;
  class: { id: string; name: string; section: string | null };
  subjects: StructureSubject[];
}

interface ExamStructureSectionProps {
  examId: string;
  readOnly?: boolean;
  examActive?: boolean;
  onStructureChange?: (classes: StructureClass[]) => void;
}

function classLabel(c: { name: string; section: string | null }) {
  return c.section ? `${c.name} — ${c.section}` : c.name;
}

export function structureSummary(classes: StructureClass[]): string {
  if (classes.length === 0) return 'Not generated yet';
  const activeClasses = classes.filter((c) => c.isActive).length;
  const activeSubjects = classes.reduce(
    (n, c) => n + c.subjects.filter((s) => s.isActive).length,
    0,
  );
  const totalSubjects = classes.reduce((n, c) => n + c.subjects.length, 0);
  return `${activeClasses}/${classes.length} classes · ${activeSubjects}/${totalSubjects} subjects active`;
}

export default function ExamStructureSection({
  examId,
  readOnly = false,
  examActive = false,
  onStructureChange,
}: ExamStructureSectionProps) {
  const [structure, setStructure] = useState<StructureClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [expandedClassId, setExpandedClassId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const editable = !readOnly && !examActive;

  const applyStructure = useCallback((rows: StructureClass[]) => {
    setStructure(rows);
    onStructureChange?.(rows);
  }, [onStructureChange]);

  const loadStructure = useCallback(() => {
    setLoading(true);
    setError('');
    api.getResultExamStructure(examId)
      .then((res) => applyStructure(res.data || []))
      .catch((e: any) => setError(e.message || 'Failed to load structure'))
      .finally(() => setLoading(false));
  }, [examId, applyStructure]);

  useEffect(() => {
    loadStructure();
  }, [loadStructure]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await api.generateResultExamStructure(examId);
      applyStructure(res.data || []);
      showToast(
        'success',
        structure.length === 0 ? 'Structure generated' : 'Structure synced with current classes',
      );
    } catch (e: any) {
      showToast('error', e.message || 'Failed to generate structure');
    } finally {
      setGenerating(false);
    }
  };

  const toggleClass = async (row: StructureClass) => {
    if (!editable || togglingId) return;
    const next = !row.isActive;
    if (!next && row.hasMarks) return;

    setTogglingId(row.id);
    try {
      await api.updateResultStructureClass(row.id, { isActive: next });
      loadStructure();
    } catch (e: any) {
      showToast('error', e.message || 'Failed to update class');
    } finally {
      setTogglingId(null);
    }
  };

  const toggleSubject = async (row: StructureSubject, classActive: boolean) => {
    if (!editable || !classActive || togglingId) return;
    const next = !row.isActive;
    if (!next && row.hasMarks) return;

    setTogglingId(row.id);
    try {
      await api.updateResultStructureSubject(row.id, { isActive: next });
      loadStructure();
    } catch (e: any) {
      showToast('error', e.message || 'Failed to update subject');
    } finally {
      setTogglingId(null);
    }
  };

  const sortedStructure = useMemo(
    () => [...structure].sort((a, b) => classLabel(a.class).localeCompare(classLabel(b.class))),
    [structure],
  );

  if (loading) {
    return (
      <div className="space-y-2 py-2">
        <div className="h-10 animate-pulse rounded-lg bg-[#1a1614]" />
        <div className="h-10 animate-pulse rounded-lg bg-[#1a1614]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-3 text-xs text-[#b39a76]">
        {error}
        <button
          type="button"
          onClick={loadStructure}
          className="ml-2 text-warm-accent hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (structure.length === 0) {
    return (
      <div className="py-6 text-center">
        <Layers size={28} className="mx-auto mb-2 text-warm-muted/40" />
        <p className="text-xs text-warm-muted">No structure yet. Generate classes and subjects from this academic year.</p>
        {editable && (
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="mt-4 rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] disabled:opacity-50"
          >
            {generating ? 'Generating…' : 'Generate Structure'}
          </button>
        )}
        {!editable && (
          <p className="mt-3 text-[11px] text-warm-muted/60">
            {examActive ? 'Set exam to Draft to configure structure.' : 'Read-only in archived year.'}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {editable && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] text-warm-muted/70">
            Uncheck classes or subjects to exclude them from marks entry. Items with marks cannot be disabled.
          </p>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-warm-card-border px-2.5 py-1 text-[10px] text-warm-muted hover:text-warm-cream disabled:opacity-50"
          >
            <RefreshCw size={12} className={generating ? 'animate-spin' : ''} />
            {generating ? 'Syncing…' : 'Sync classes'}
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-warm-card-border/60">
        {sortedStructure.map((row) => {
          const isOpen = expandedClassId === row.id;
          const activeSubjectCount = row.subjects.filter((s) => s.isActive).length;
                  const classLocked = row.hasMarks;
                  const classDisabled =
                    !editable ||
                    togglingId === row.id ||
                    (row.isActive && classLocked);

          return (
            <div
              key={row.id}
              className={`border-b border-warm-card-border/30 last:border-b-0 ${!row.isActive ? 'opacity-45' : ''}`}
            >
              <div className="flex items-center gap-2 bg-warm-card/20 px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => setExpandedClassId((prev) => (prev === row.id ? null : row.id))}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  {isOpen ? (
                    <ChevronDown size={14} className="shrink-0 text-warm-muted" />
                  ) : (
                    <ChevronRight size={14} className="shrink-0 text-warm-muted" />
                  )}
                  <span className="truncate text-xs font-medium text-warm-cream">
                    {classLabel(row.class)}
                  </span>
                  <span className="shrink-0 text-[10px] text-warm-muted">
                    {activeSubjectCount}/{row.subjects.length} subjects
                  </span>
                </button>

                {classLocked && (
                  <span title="Marks entered — cannot disable" className="text-warm-muted/50">
                    <Lock size={12} />
                  </span>
                )}

                <label
                  className={`flex shrink-0 items-center gap-1.5 text-[10px] ${classDisabled && !classLocked ? 'cursor-not-allowed opacity-50' : editable ? 'cursor-pointer' : ''}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={row.isActive}
                    disabled={classDisabled}
                    onChange={() => toggleClass(row)}
                    className="h-3.5 w-3.5 rounded accent-warm-accent"
                  />
                  <span className="text-warm-muted">Active</span>
                </label>
              </div>

              {isOpen && (
                <div className="divide-y divide-warm-card-border/20 bg-[#1a1614]/40">
                  {row.subjects.map((sub) => {
                    const subLocked = sub.hasMarks;
                    const subDisabled =
                      !editable ||
                      !row.isActive ||
                      togglingId === sub.id ||
                      (sub.isActive && subLocked);

                    return (
                      <div
                        key={sub.id}
                        className={`flex items-center justify-between px-4 py-2 pl-9 ${!sub.isActive ? 'opacity-50' : ''}`}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs text-warm-cream">{sub.subject.name}</p>
                          {sub.subject.code && (
                            <p className="text-[10px] text-warm-muted/50">{sub.subject.code}</p>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {subLocked && (
                            <span title="Marks entered — cannot disable" className="text-warm-muted/50">
                              <Lock size={11} />
                            </span>
                          )}
                          <label
                            className={`flex items-center gap-1.5 text-[10px] ${subDisabled && !subLocked ? 'cursor-not-allowed opacity-50' : editable && row.isActive ? 'cursor-pointer' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={sub.isActive}
                              disabled={subDisabled}
                              onChange={() => toggleSubject(sub, row.isActive)}
                              className="h-3.5 w-3.5 rounded accent-warm-accent"
                            />
                            <span className="text-warm-muted">Active</span>
                          </label>
                        </div>
                      </div>
                    );
                  })}
                  {row.subjects.length === 0 && (
                    <p className="px-4 py-3 text-center text-[11px] text-warm-muted/50">No subjects assigned to this class.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
