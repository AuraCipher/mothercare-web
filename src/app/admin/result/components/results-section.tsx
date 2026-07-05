'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { showToast } from '@/components/toast';
import ConfirmModal from '@/components/confirm-modal';
import { Calculator, FileCheck, RefreshCw, Send, User } from 'lucide-react';

interface ResultsSectionProps {
  sessionId: string;
  readOnly?: boolean;
  resultCount?: number;
  reportCardCount?: number;
  onChanged?: () => void;
}

type Section = { id: string; name: string; section: string | null };

function classLabel(c: { name: string; section?: string | null }) {
  return c.section ? `${c.name} — ${c.section}` : c.name;
}

function pct(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return '—';
  return `${n.toFixed(1)}%`;
}

const gridSurface = 'bg-[#24201e]';
const gridHeaderSurface = 'bg-[#2a2624]';
const stickyLeftShadow = 'shadow-[2px_0_6px_rgba(0,0,0,0.35)]';

export default function ResultsSection({
  sessionId,
  readOnly = false,
  resultCount = 0,
  reportCardCount = 0,
  onChanged,
}: ResultsSectionProps) {
  const branchId = typeof window !== 'undefined' ? localStorage.getItem('activeBranchId') : null;
  const ayId = typeof window !== 'undefined' ? localStorage.getItem('activeAYId') : null;

  const [sections, setSections] = useState<Section[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [sheet, setSheet] = useState<any>(null);
  const [cards, setCards] = useState<any[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingSheet, setLoadingSheet] = useState(false);
  const [loadingCards, setLoadingCards] = useState(false);
  const [computing, setComputing] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const [studentModal, setStudentModal] = useState<any>(null);
  const [loadingStudent, setLoadingStudent] = useState(false);

  const [confirm, setConfirm] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    action: () => Promise<void>;
  }>({ open: false, title: '', message: '', confirmLabel: 'Confirm', action: async () => {} });

  useEffect(() => {
    if (!branchId || !ayId) return;
    setLoadingClasses(true);
    api.getSections(branchId, ayId)
      .then((res) => {
        const rows = (res.data || []).filter((s: any) => s.isActive !== false);
        setSections(rows);
        if (rows.length > 0) setSelectedClassId((prev) => prev || rows[0].id);
      })
      .catch(() => showToast('error', 'Failed to load classes'))
      .finally(() => setLoadingClasses(false));
  }, [branchId, ayId]);

  const loadClassData = useCallback(async (classId: string) => {
    if (!classId) return;
    setLoadingSheet(true);
    setLoadingCards(true);
    try {
      const [sheetRes, cardsRes] = await Promise.all([
        api.getClassResults(sessionId, classId),
        api.getClassReportCards(sessionId, classId),
      ]);
      setSheet(sheetRes.data);
      setCards(cardsRes.data || []);
    } catch (e: any) {
      setSheet(null);
      setCards([]);
      showToast('error', e.message || 'Failed to load class results');
    } finally {
      setLoadingSheet(false);
      setLoadingCards(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (selectedClassId) loadClassData(selectedClassId);
  }, [selectedClassId, loadClassData]);

  const runComputeResults = () => {
    setConfirm({
      open: true,
      title: 'Compute subject results?',
      message: 'Calculates weighted subject percentages for all published (Active) exams in this session. Existing results will be updated.',
      confirmLabel: 'Compute results',
      action: async () => {
        setComputing('results');
        try {
          const res = await api.computeResultSession(sessionId);
          showToast('success', `Computed ${res.data.studentCount} student results across ${res.data.classSubjectCount} class-subjects`);
          onChanged?.();
          if (selectedClassId) await loadClassData(selectedClassId);
        } catch (e: any) {
          showToast('error', e.message || 'Failed to compute results');
        } finally {
          setComputing(null);
        }
      },
    });
  };

  const runComputeReportCards = (scope: 'session' | 'class') => {
    setConfirm({
      open: true,
      title: scope === 'session' ? 'Compute all report cards?' : 'Compute class report cards?',
      message: 'Builds overall grades and class ranks from subject results. Run after computing subject results.',
      confirmLabel: 'Compute report cards',
      action: async () => {
        setComputing(scope === 'session' ? 'cards-session' : 'cards-class');
        try {
          if (scope === 'session') {
            const res = await api.computeReportCardsSession(sessionId);
            showToast('success', `Generated ${res.data.reportCardCount} report cards across ${res.data.classCount} classes`);
          } else if (selectedClassId) {
            const res = await api.computeReportCardsClass(sessionId, selectedClassId);
            showToast('success', `Generated ${res.data.length} report cards`);
          }
          onChanged?.();
          if (selectedClassId) await loadClassData(selectedClassId);
        } catch (e: any) {
          showToast('error', e.message || 'Failed to compute report cards');
        } finally {
          setComputing(null);
        }
      },
    });
  };

  const publishCard = async (cardId: string) => {
    setPublishingId(cardId);
    try {
      await api.publishReportCard(cardId);
      showToast('success', 'Report card published');
      onChanged?.();
      if (selectedClassId) await loadClassData(selectedClassId);
    } catch (e: any) {
      showToast('error', e.message || 'Failed to publish');
    } finally {
      setPublishingId(null);
    }
  };

  const publishAllDrafts = async () => {
    const drafts = cards.filter((c) => c.status === 'DRAFT');
    if (drafts.length === 0) {
      showToast('error', 'No draft report cards to publish');
      return;
    }
    setComputing('publish-all');
    let ok = 0;
    for (const card of drafts) {
      try {
        await api.publishReportCard(card.id);
        ok++;
      } catch {
        /* continue */
      }
    }
    setComputing(null);
    showToast(ok === drafts.length ? 'success' : 'error', `Published ${ok}/${drafts.length} report cards`);
    onChanged?.();
    if (selectedClassId) await loadClassData(selectedClassId);
  };

  const openStudentCard = async (studentId: string) => {
    setLoadingStudent(true);
    setStudentModal({});
    try {
      const res = await api.getStudentReportCard(studentId, sessionId);
      setStudentModal(res.data);
    } catch (e: any) {
      showToast('error', e.message || 'Report card not found');
      setStudentModal(null);
    } finally {
      setLoadingStudent(false);
    }
  };

  const subjects = sheet?.subjects || [];
  const rows = sheet?.students || [];

  return (
    <div className="space-y-4">
      <p className="text-[10px] text-warm-muted/60">
        Workflow: publish exams → enter marks → compute results → compute report cards → publish report cards.
      </p>

      {!readOnly && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={runComputeResults}
            disabled={!!computing}
            className="inline-flex items-center gap-1.5 rounded-lg bg-warm-accent px-3 py-1.5 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] disabled:opacity-50"
          >
            <Calculator size={13} />
            {computing === 'results' ? 'Computing…' : 'Compute results'}
          </button>
          <button
            type="button"
            onClick={() => runComputeReportCards('session')}
            disabled={!!computing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-warm-card-border px-3 py-1.5 text-xs text-warm-cream hover:border-warm-accent/40 disabled:opacity-50"
          >
            <FileCheck size={13} />
            {computing === 'cards-session' ? 'Computing…' : 'Compute all report cards'}
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-[11px] text-warm-muted">
          Class
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            disabled={loadingClasses || sections.length === 0}
            className="rounded-lg border border-warm-card-border bg-[#1a1614] px-2 py-1 text-xs text-warm-cream outline-none focus:border-warm-accent disabled:opacity-50"
          >
            {sections.map((s) => (
              <option key={s.id} value={s.id}>{classLabel(s)}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => selectedClassId && loadClassData(selectedClassId)}
          disabled={!selectedClassId || loadingSheet}
          className="inline-flex items-center gap-1 text-[10px] text-warm-muted hover:text-warm-cream disabled:opacity-50"
        >
          <RefreshCw size={11} className={loadingSheet ? 'animate-spin' : ''} /> Refresh
        </button>
        <span className="text-[10px] text-warm-muted/50">
          Session: {resultCount} results · {reportCardCount} report cards
        </span>
      </div>

      {!readOnly && selectedClassId && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => runComputeReportCards('class')}
            disabled={!!computing}
            className="rounded-lg border border-warm-card-border px-2.5 py-1 text-[10px] text-warm-muted hover:text-warm-cream disabled:opacity-50"
          >
            {computing === 'cards-class' ? '…' : 'Compute class report cards'}
          </button>
          <button
            type="button"
            onClick={publishAllDrafts}
            disabled={!!computing || cards.every((c) => c.status === 'PUBLISHED')}
            className="inline-flex items-center gap-1 rounded-lg border border-warm-card-border px-2.5 py-1 text-[10px] text-warm-muted hover:text-warm-cream disabled:opacity-50"
          >
            <Send size={11} />
            {computing === 'publish-all' ? 'Publishing…' : 'Publish all drafts'}
          </button>
        </div>
      )}

      {loadingSheet ? (
        <div className="h-24 animate-pulse rounded-lg bg-[#1a1614]" />
      ) : !sheet || rows.length === 0 ? (
        <p className="py-6 text-center text-xs text-warm-muted/50">
          No results for this class yet. Compute session results after marks are entered.
        </p>
      ) : (
        <div className={`overflow-hidden rounded-lg border border-warm-card-border/60 ${gridSurface}`}>
          <p className="border-b border-warm-card-border/30 px-3 py-2 text-[10px] font-medium text-warm-muted">
            Class result sheet — {classLabel(sheet.class)}
          </p>
          <div className="mcs-scrollbar-x mcs-scrollbar-y isolate max-h-[calc(11rem+2.75rem*8)] overflow-auto">
            <table className="w-max min-w-full border-separate border-spacing-0 text-left">
              <thead>
                <tr>
                  <th className={`sticky left-0 top-0 z-40 w-[120px] min-w-[120px] border-b border-warm-card-border/40 ${gridHeaderSurface} ${stickyLeftShadow} px-3 py-2 text-[10px] font-medium text-warm-muted`}>
                    Student
                  </th>
                  {subjects.map((sub: any) => (
                    <th
                      key={sub.id}
                      className={`sticky top-0 z-30 min-w-[72px] border-b border-l border-warm-card-border/30 ${gridHeaderSurface} px-2 py-2 text-center text-[10px] font-medium text-warm-cream`}
                    >
                      {sub.name}
                    </th>
                  ))}
                  <th className={`sticky top-0 z-30 min-w-[64px] border-b border-l border-warm-card-border/30 ${gridHeaderSurface} px-2 py-2 text-center text-[10px] text-warm-muted`}>
                    Overall
                  </th>
                  <th className={`sticky top-0 z-30 min-w-[48px] border-b border-l border-warm-card-border/30 ${gridHeaderSurface} px-2 py-2 text-center text-[10px] text-warm-muted`}>
                    Grade
                  </th>
                  <th className={`sticky top-0 z-30 min-w-[48px] border-b border-l border-warm-card-border/30 ${gridHeaderSurface} px-2 py-2 text-center text-[10px] text-warm-muted`}>
                    Rank
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row: any) => {
                  const bySubject = new Map(row.subjectResults.map((r: any) => [r.subjectId, r]));
                  return (
                    <tr key={row.student.id} className="h-11">
                      <td className={`sticky left-0 z-20 h-11 border-b border-warm-card-border/20 ${gridSurface} ${stickyLeftShadow} px-3 align-middle`}>
                        <button
                          type="button"
                          onClick={() => row.reportCard && openStudentCard(row.student.id)}
                          className={`flex max-w-[110px] items-center gap-1 truncate text-left text-xs ${row.reportCard ? 'text-warm-accent hover:underline' : 'text-warm-cream'}`}
                          title={row.reportCard ? 'View report card' : row.student.name}
                        >
                          {row.reportCard && <User size={11} className="shrink-0" />}
                          <span className="truncate">{row.student.name}</span>
                        </button>
                      </td>
                      {subjects.map((sub: any) => {
                        const sr = bySubject.get(sub.id) as { percentage: number; grade: string } | undefined;
                        return (
                          <td key={sub.id} className="h-11 border-b border-l border-warm-card-border/20 px-2 text-center align-middle text-[10px] text-warm-muted">
                            {sr ? (
                              <span title={sr.grade}>{pct(sr.percentage)}</span>
                            ) : (
                              '—'
                            )}
                          </td>
                        );
                      })}
                      <td className="h-11 border-b border-l border-warm-card-border/20 px-2 text-center align-middle text-[10px] text-warm-cream">
                        {row.reportCard ? pct(row.reportCard.overallPercentage) : '—'}
                      </td>
                      <td className="h-11 border-b border-l border-warm-card-border/20 px-2 text-center align-middle text-[10px] text-warm-accent">
                        {row.reportCard?.overallGrade ?? '—'}
                      </td>
                      <td className="h-11 border-b border-l border-warm-card-border/20 px-2 text-center align-middle text-[10px] text-warm-muted">
                        {row.reportCard?.classRank ?? '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loadingCards && cards.length > 0 && (
        <div className="rounded-lg border border-warm-card-border/60 overflow-hidden">
          <p className="border-b border-warm-card-border/30 bg-warm-card/20 px-3 py-2 text-[10px] font-medium text-warm-muted">
            Report cards ({cards.filter((c) => c.status === 'PUBLISHED').length}/{cards.length} published)
          </p>
          <div className="divide-y divide-warm-card-border/20">
            {cards.map((card) => (
              <div key={card.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-xs text-warm-cream">{card.student?.name}</p>
                  <p className="text-[10px] text-warm-muted">
                    {pct(card.overallPercentage)} · {card.overallGrade}
                    {card.classRank != null ? ` · Rank ${card.classRank}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded px-1.5 py-0.5 text-[9px] ${
                    card.status === 'PUBLISHED' ? 'bg-green-900/30 text-green-400' : 'bg-warm-card-border/40 text-warm-muted'
                  }`}>
                    {card.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => openStudentCard(card.studentId)}
                    className="text-[10px] text-warm-muted hover:text-warm-cream"
                  >
                    View
                  </button>
                  {!readOnly && card.status === 'DRAFT' && (
                    <button
                      type="button"
                      onClick={() => publishCard(card.id)}
                      disabled={publishingId === card.id}
                      className="rounded-lg bg-warm-accent/90 px-2 py-0.5 text-[10px] font-medium text-[#1a1614] hover:bg-warm-accent disabled:opacity-50"
                    >
                      {publishingId === card.id ? '…' : 'Publish'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {studentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setStudentModal(null)}>
          <div
            className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-xl border border-warm-card-border bg-[#24201e] p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {loadingStudent || !studentModal.student ? (
              <p className="text-center text-xs text-warm-muted">Loading…</p>
            ) : (
              <>
                <h3 className="text-sm font-medium text-warm-cream">{studentModal.student?.name}</h3>
                <p className="mt-1 text-[11px] text-warm-muted">
                  {studentModal.examSession?.name} · {pct(studentModal.overallPercentage)} · {studentModal.overallGrade}
                  {studentModal.classRank != null ? ` · Rank ${studentModal.classRank}` : ''}
                </p>
                <span className={`mt-2 inline-block rounded px-1.5 py-0.5 text-[9px] ${
                  studentModal.status === 'PUBLISHED' ? 'bg-green-900/30 text-green-400' : 'bg-warm-card-border/40 text-warm-muted'
                }`}>
                  {studentModal.status}
                </span>
                <div className="mt-4 space-y-1.5">
                  {(studentModal.subjectResults || []).map((sr: any) => (
                    <div key={sr.subjectId} className="flex justify-between text-xs">
                      <span className="text-warm-cream">{sr.subject?.name}</span>
                      <span className="text-warm-muted">{pct(sr.percentage)} · {sr.grade}</span>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setStudentModal(null)}
                  className="mt-5 w-full rounded-lg border border-warm-card-border py-2 text-xs text-warm-muted hover:text-warm-cream"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        confirmLabel={confirm.confirmLabel}
        onConfirm={async () => {
          await confirm.action();
          setConfirm((prev) => ({ ...prev, open: false }));
        }}
        onCancel={() => setConfirm((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
}
