'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ChevronLeft, Calendar, Settings2, Plus } from 'lucide-react';
import ExamTypeManagerModal from '../../components/exam-type-manager-modal';
import CreateExamModal from '../../components/create-exam-modal';
import ExamListSection, { type ExamListItem } from '../../components/exam-list-section';
import ResultsSection from '../../components/results-section';
import CollapsibleSection, { MiniProgressBar } from '../../components/collapsible-section';

interface SessionSummary {
  session: { id: string; name: string; startDate: string; endDate: string };
  typeCount: number;
  examCount: number;
  subjectResultCount: number;
  reportCardCount: number;
  marksProgress: { total: number; filled: number; percent: number };
  exams: {
    id: string;
    name: string;
    status: string;
    marksProgress: { total: number; filled: number; percent: number };
  }[];
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ResultSessionPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [exams, setExams] = useState<ExamListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typesModalOpen, setTypesModalOpen] = useState(false);
  const [createExamOpen, setCreateExamOpen] = useState(false);

  const activeAYId = typeof window !== 'undefined' ? localStorage.getItem('activeAYId') : null;
  const isReadOnly = typeof window !== 'undefined' && localStorage.getItem('activeAYStatus') === 'ARCHIVED';

  const loadData = useCallback((silent = false) => {
    if (!activeAYId || !sessionId) return;
    if (!silent) {
      setLoading(true);
      setError('');
    }
    Promise.all([
      api.getResultSessionSummary(sessionId),
      api.getResultExams(sessionId),
    ])
      .then(([summaryRes, examsRes]) => {
        setSummary(summaryRes.data);
        setExams(examsRes.data || []);
      })
      .catch((e: any) => {
        if (!silent) setError(e.message || 'Failed to load session');
      })
      .finally(() => {
        if (!silent) setLoading(false);
      });
  }, [activeAYId, sessionId]);

  useEffect(() => {
    if (!activeAYId || !sessionId) {
      setLoading(false);
      return;
    }
    loadData();
  }, [activeAYId, sessionId, loadData]);

  const progressByExamId = Object.fromEntries(
    (summary?.exams ?? []).map((e) => [e.id, e.marksProgress]),
  );

  if (!activeAYId) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-10 text-center">
          <p className="text-sm text-warm-muted">No academic year selected.</p>
        </div>
      </main>
    );
  }

  const overviewSubtitle = summary
    ? `${summary.marksProgress.percent}% marks · ${summary.examCount} exams · ${summary.subjectResultCount} results`
    : undefined;

  const examsSubtitle = summary
    ? exams.length === 0
      ? 'No exams yet'
      : `${exams.length} exam${exams.length !== 1 ? 's' : ''} · ${summary.marksProgress.percent}% session progress`
    : undefined;

  const resultsSubtitle = summary
    ? `${summary.subjectResultCount} results · ${summary.reportCardCount} report cards`
    : 'Compute after marks are entered';

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <button
        type="button"
        onClick={() => router.push('/admin/result')}
        className="mb-4 flex items-center gap-1 text-xs text-warm-muted transition-colors hover:text-warm-cream"
      >
        <ChevronLeft size={14} /> All sessions
      </button>

      {loading ? (
        <div className="space-y-2">
          <div className="h-14 animate-pulse rounded-xl bg-warm-card" />
          <div className="h-12 animate-pulse rounded-xl bg-warm-card" />
          <div className="h-12 animate-pulse rounded-xl bg-warm-card" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-warm-card-border bg-warm-card px-4 py-3 text-xs text-[#b39a76]">
          {error}
        </div>
      ) : summary ? (
        <div className="space-y-2">
          {/* Compact header */}
          <div className="mb-2 flex flex-wrap items-start justify-between gap-3 px-1">
            <div className="min-w-0">
              <h1 className="text-lg font-light text-warm-cream">{summary.session.name}</h1>
              <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-warm-muted">
                <Calendar size={11} />
                {fmtDate(summary.session.startDate)} — {fmtDate(summary.session.endDate)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setTypesModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-warm-card-border px-3 py-1.5 text-xs text-warm-cream hover:border-warm-accent/40"
            >
              <Settings2 size={13} className="text-warm-accent" />
              Types
              {summary.typeCount > 0 && (
                <span className="text-[10px] text-warm-muted">({summary.typeCount})</span>
              )}
            </button>
          </div>

          <CollapsibleSection
            title="Overview"
            subtitle={overviewSubtitle}
            defaultOpen={false}
          >
            <div className="space-y-4">
              <MiniProgressBar
                percent={summary.marksProgress.percent}
                label={`Session marks ${summary.marksProgress.filled}/${summary.marksProgress.total} slots`}
              />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { label: 'Types', value: summary.typeCount },
                  { label: 'Exams', value: summary.examCount },
                  { label: 'Results', value: summary.subjectResultCount },
                  { label: 'Report cards', value: summary.reportCardCount },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-lg border border-warm-card-border/50 bg-[#1a1614]/40 px-3 py-2">
                    <p className="text-base font-light text-warm-cream">{value}</p>
                    <p className="text-[9px] uppercase tracking-wide text-warm-muted">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title="Exams"
            subtitle={examsSubtitle}
            badge={exams.length || undefined}
            defaultOpen={false}
            actions={
              !isReadOnly ? (
                <button
                  type="button"
                  onClick={() => setCreateExamOpen(true)}
                  className="flex items-center gap-1 rounded-lg bg-warm-accent px-2.5 py-1 text-[10px] font-medium text-[#1a1614] hover:bg-[#b39a76]"
                >
                  <Plus size={12} /> Add
                </button>
              ) : undefined
            }
          >
            <ExamListSection
              sessionId={sessionId}
              exams={exams}
              progressByExamId={progressByExamId}
            />
          </CollapsibleSection>

          <CollapsibleSection
            title="Results & report cards"
            subtitle={resultsSubtitle}
            defaultOpen={false}
          >
            <ResultsSection
              sessionId={sessionId}
              readOnly={isReadOnly}
              resultCount={summary.subjectResultCount}
              reportCardCount={summary.reportCardCount}
              onChanged={() => loadData(true)}
            />
          </CollapsibleSection>

          <ExamTypeManagerModal
            sessionId={sessionId}
            open={typesModalOpen}
            readOnly={isReadOnly}
            onClose={() => setTypesModalOpen(false)}
            onChanged={() => loadData(true)}
          />

          <CreateExamModal
            sessionId={sessionId}
            open={createExamOpen}
            onClose={() => setCreateExamOpen(false)}
            onCreated={(examId) => {
              loadData(true);
              router.push(`/admin/result/sessions/${sessionId}/exams/${examId}`);
            }}
          />
        </div>
      ) : null}
    </main>
  );
}
