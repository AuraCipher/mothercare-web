'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { showToast } from '@/components/toast';
import { ChevronDown, ChevronRight, Lock, RefreshCw } from 'lucide-react';

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

interface ClassCurriculum {
  classId: string;
  name: string;
  section: string | null;
  subjects: { id: string; name: string; code: string | null }[];
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

  const [curriculum, setCurriculum] = useState<ClassCurriculum[]>([]);
  const [loadingCurriculum, setLoadingCurriculum] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<Record<string, Set<string>>>({});
  const [expandedPickerClassId, setExpandedPickerClassId] = useState<string | null>(null);

  const branchId = typeof window !== 'undefined' ? localStorage.getItem('activeBranchId') : null;
  const ayId = typeof window !== 'undefined' ? localStorage.getItem('activeAYId') : null;

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

  const loadCurriculum = useCallback(async () => {
    if (!branchId || !ayId) return;
    setLoadingCurriculum(true);
    try {
      const secRes = await api.getSections(branchId, ayId);
      const sections = (secRes.data || []).filter((s: any) => s.isActive !== false);
      const rows = await Promise.all(
        sections.map(async (sec: any) => {
          const subRes = await api.getSectionSubjects(branchId, sec.id);
          const subjects = (subRes.data || []).map((link: any) => ({
            id: link.subject?.id || link.subjectId,
            name: link.subject?.name || 'Subject',
            code: link.subject?.code ?? null,
          })).filter((s: any) => s.id);
          return {
            classId: sec.id,
            name: sec.name,
            section: sec.section ?? null,
            subjects,
          };
        }),
      );
      setCurriculum(rows);
      const initial: Record<string, Set<string>> = {};
      for (const row of rows) {
        initial[row.classId] = new Set(row.subjects.map((s) => s.id));
      }
      setSelectedSubjects(initial);
      if (rows.length > 0) setExpandedPickerClassId(rows[0].classId);
    } catch (e: any) {
      showToast('error', e.message || 'Failed to load class subjects');
    } finally {
      setLoadingCurriculum(false);
    }
  }, [branchId, ayId]);

  useEffect(() => {
    if (!loading && structure.length === 0 && !error) {
      loadCurriculum();
    }
  }, [loading, structure.length, error, loadCurriculum]);

  const buildSelections = () =>
    curriculum
      .map((c) => ({
        classId: c.classId,
        subjectIds: [...(selectedSubjects[c.classId] || [])],
      }))
      .filter((s) => s.subjectIds.length > 0);

  const togglePickerSubject = (classId: string, subjectId: string) => {
    setSelectedSubjects((prev) => {
      const next = { ...prev };
      const set = new Set(next[classId] || []);
      if (set.has(subjectId)) set.delete(subjectId);
      else set.add(subjectId);
      next[classId] = set;
      return next;
    });
  };

  const setPickerClassSubjects = (classId: string, subjectIds: string[], selected: boolean) => {
    setSelectedSubjects((prev) => {
      const next = { ...prev };
      const set = new Set(next[classId] || []);
      for (const id of subjectIds) {
        if (selected) set.add(id);
        else set.delete(id);
      }
      next[classId] = set;
      return next;
    });
  };

  const handleGenerate = async (withSelections: boolean) => {
    setGenerating(true);
    try {
      let selections: { classId: string; subjectIds: string[] }[] | undefined;
      if (withSelections) {
        selections = buildSelections();
        if (selections.length === 0) {
          showToast('error', 'Select at least one subject for any class');
          setGenerating(false);
          return;
        }
      }
      const res = await api.generateResultExamStructure(examId, selections ? { selections } : undefined);
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

  const setAllSubjectsForClass = async (row: StructureClass, include: boolean) => {
    if (!editable || togglingId) return;
    const targets = row.subjects.filter((s) => s.isActive !== include && !(include === false && s.hasMarks));
    if (targets.length === 0) return;
    setTogglingId(row.id);
    try {
      for (const sub of targets) {
        await api.updateResultStructureSubject(sub.id, { isActive: include });
      }
      loadStructure();
    } catch (e: any) {
      showToast('error', e.message || 'Failed to update subjects');
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
      <div className="space-y-3">
        <p className="text-[11px] text-warm-muted/70">
          Choose subjects per class for this exam. All subjects are selected by default — uncheck any you want to exclude.
        </p>
        {loadingCurriculum ? (
          <div className="space-y-2 py-2">
            <div className="h-10 animate-pulse rounded-lg bg-[#1a1614]" />
            <div className="h-10 animate-pulse rounded-lg bg-[#1a1614]" />
          </div>
        ) : curriculum.length === 0 ? (
          <p className="py-6 text-center text-xs text-warm-muted/50">No classes with subjects found. Add classes and subjects first.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-warm-card-border/60">
            {curriculum.map((row) => {
              const isOpen = expandedPickerClassId === row.classId;
              const selected = selectedSubjects[row.classId] || new Set<string>();
              const allSelected = row.subjects.length > 0 && row.subjects.every((s) => selected.has(s.id));
              return (
                <div key={row.classId} className="border-b border-warm-card-border/30 last:border-b-0">
                  <div className="flex items-center gap-2 bg-warm-card/20 px-3 py-2.5">
                    <button
                      type="button"
                      onClick={() => setExpandedPickerClassId((prev) => (prev === row.classId ? null : row.classId))}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    >
                      {isOpen ? <ChevronDown size={14} className="text-warm-muted" /> : <ChevronRight size={14} className="text-warm-muted" />}
                      <span className="truncate text-xs font-medium text-warm-cream">{classLabel(row)}</span>
                      <span className="text-[10px] text-warm-muted">{selected.size}/{row.subjects.length} subjects</span>
                    </button>
                    {editable && row.subjects.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setPickerClassSubjects(row.classId, row.subjects.map((s) => s.id), !allSelected)}
                        className="text-[10px] text-warm-accent hover:underline"
                      >
                        {allSelected ? 'Clear all' : 'Select all'}
                      </button>
                    )}
                  </div>
                  {isOpen && (
                    <div className="divide-y divide-warm-card-border/20 bg-[#1a1614]/40">
                      {row.subjects.map((sub) => (
                        <label
                          key={sub.id}
                          className={`flex cursor-pointer items-center justify-between px-4 py-2 pl-9 ${!selected.has(sub.id) ? 'opacity-50' : ''}`}
                        >
                          <div>
                            <p className="text-xs text-warm-cream">{sub.name}</p>
                            {sub.code && <p className="text-[10px] text-warm-muted/50">{sub.code}</p>}
                          </div>
                          <input
                            type="checkbox"
                            checked={selected.has(sub.id)}
                            disabled={!editable}
                            onChange={() => togglePickerSubject(row.classId, sub.id)}
                            className="h-3.5 w-3.5 rounded accent-warm-accent"
                          />
                        </label>
                      ))}
                      {row.subjects.length === 0 && (
                        <p className="px-4 py-3 text-center text-[11px] text-warm-muted/50">No subjects linked to this class.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {editable && curriculum.length > 0 && (
          <button
            type="button"
            onClick={() => handleGenerate(true)}
            disabled={generating}
            className="rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] disabled:opacity-50"
          >
            {generating ? 'Generating…' : 'Generate structure'}
          </button>
        )}
        {!editable && (
          <p className="text-[11px] text-warm-muted/60">
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
            Select subjects per class for this exam. Uncheck subjects to exclude from marks entry.
          </p>
          <button
            type="button"
            onClick={() => handleGenerate(false)}
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
                  {editable && row.subjects.length > 0 && (
                    <div className="flex justify-end gap-3 px-4 py-1.5 pl-9">
                      <button
                        type="button"
                        onClick={() => setAllSubjectsForClass(row, true)}
                        className="text-[10px] text-warm-accent hover:underline"
                      >
                        Select all
                      </button>
                      <button
                        type="button"
                        onClick={() => setAllSubjectsForClass(row, false)}
                        className="text-[10px] text-warm-muted hover:underline"
                      >
                        Clear all
                      </button>
                    </div>
                  )}
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
                            <span className="text-warm-muted">Include</span>
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
