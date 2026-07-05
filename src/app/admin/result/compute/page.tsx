'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calculator, ChevronLeft, FileCheck, RefreshCw, BarChart3, TrendingUp, ArrowRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { showToast } from '@/components/toast';
import ConfirmModal from '@/components/confirm-modal';

type SessionSummary = {
  session: { id: string; name: string };
  examCount: number;
  subjectResultCount: number;
  reportCardCount: number;
  marksProgress: { total: number; filled: number; percent: number };
};

type Section = { id: string; name: string; section: string | null };

function classLabel(c: { name: string; section?: string | null }) {
  return c.section ? `${c.name} — ${c.section}` : c.name;
}

export default function ResultComputePage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<{ id: string; name: string }[]>([]);
  const [sessionId, setSessionId] = useState('');
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [classId, setClassId] = useState('');
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    action: () => Promise<void>;
  }>({ open: false, title: '', message: '', confirmLabel: 'Confirm', action: async () => {} });

  const ayId = typeof window !== 'undefined' ? localStorage.getItem('activeAYId') : null;
  const branchId = typeof window !== 'undefined' ? localStorage.getItem('activeBranchId') : null;
  const isReadOnly = typeof window !== 'undefined' && localStorage.getItem('activeAYStatus') === 'ARCHIVED';

  const loadSessions = useCallback(async () => {
    if (!ayId) return;
    setLoading(true);
    try {
      const res = await api.getExamSessions();
      const list = res.data || [];
      setSessions(list);
      if (list.length > 0) {
        setSessionId((prev) => prev || list[0].id);
      }
    } catch (e: any) {
      showToast('error', e.message || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, [ayId]);

  const loadSummary = useCallback(async (id: string) => {
    if (!id) {
      setSummary(null);
      return;
    }
    try {
      const res = await api.getResultSessionSummary(id);
      setSummary(res.data as SessionSummary);
    } catch {
      setSummary(null);
    }
  }, []);

  useEffect(() => {
    if (!branchId || !ayId) return;
    api.getSections(branchId, ayId)
      .then((res) => setSections((res.data || []).filter((s: Section & { isActive?: boolean }) => s.isActive !== false)))
      .catch(() => {});
  }, [branchId, ayId]);

  useEffect(() => {
    if (!ayId) {
      setLoading(false);
      return;
    }
    loadSessions();
  }, [ayId, loadSessions]);

  useEffect(() => {
    if (sessionId) loadSummary(sessionId);
  }, [sessionId, loadSummary]);

  const runComputeResults = () => {
    if (!sessionId) return;
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
          await loadSummary(sessionId);
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
          } else if (classId) {
            const res = await api.computeReportCardsClass(sessionId, classId);
            showToast('success', `Generated ${res.data.length} report cards`);
          }
          await loadSummary(sessionId);
        } catch (e: any) {
          showToast('error', e.message || 'Failed to compute report cards');
        } finally {
          setComputing(null);
        }
      },
    });
  };

  if (!ayId) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <p className="text-sm text-warm-muted">Select an academic year from the sidebar to compute results.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <button
        type="button"
        onClick={() => router.push('/admin/result')}
        className="mb-4 flex items-center gap-1 text-xs text-warm-muted transition-colors hover:text-warm-cream"
      >
        <ChevronLeft size={14} /> Result &amp; Grade
      </button>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Calculator size={22} className="text-green-400" />
          <div>
            <h1 className="text-xl font-light text-warm-cream">Compute Results</h1>
            <p className="mt-0.5 text-xs text-warm-muted">
              Generate subject results &amp; report cards after marks entry
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { loadSessions(); if (sessionId) loadSummary(sessionId); }}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-lg border border-warm-card-border px-2.5 py-1.5 text-[10px] text-warm-muted hover:text-warm-cream disabled:opacity-50"
          >
            <RefreshCw size={11} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/result/reports')}
            className="inline-flex items-center gap-1 rounded-lg border border-warm-card-border px-2.5 py-1.5 text-[10px] text-warm-muted hover:text-warm-cream"
          >
            <TrendingUp size={11} /> Reports <ArrowRight size={10} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-40 animate-pulse rounded-xl bg-warm-card" />
      ) : sessions.length === 0 ? (
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-10 text-center">
          <p className="text-sm text-warm-muted">No exam sessions yet. Create a session from the hub.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-xl border border-warm-card-border bg-warm-card p-5">
            <p className="mb-4 text-[10px] text-warm-muted/60">
              Workflow: publish exams → enter marks → compute results → compute report cards → publish from Reports.
            </p>

            <label className="mb-4 flex flex-wrap items-center gap-2 text-[11px] text-warm-muted">
              Exam session
              <select
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                className="rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent min-w-[180px]"
              >
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </label>

            {summary && (
              <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: 'Exams', value: summary.examCount },
                  { label: 'Marks', value: `${summary.marksProgress.percent}%` },
                  { label: 'Results', value: summary.subjectResultCount },
                  { label: 'Report cards', value: summary.reportCardCount },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-lg border border-warm-card-border/40 bg-[#1a1614]/40 px-3 py-2">
                    <p className="text-base font-light text-warm-cream">{value}</p>
                    <p className="text-[9px] uppercase tracking-wide text-warm-muted">{label}</p>
                  </div>
                ))}
              </div>
            )}

            {isReadOnly ? (
              <p className="text-xs text-warm-muted">This academic year is archived — computing is disabled.</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <h2 className="mb-2 text-xs font-medium text-warm-cream">Session-wide</h2>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={runComputeResults}
                      disabled={!!computing || !sessionId}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-warm-accent px-3 py-1.5 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] disabled:opacity-50"
                    >
                      <Calculator size={13} />
                      {computing === 'results' ? 'Computing…' : 'Compute results'}
                    </button>
                    <button
                      type="button"
                      onClick={() => runComputeReportCards('session')}
                      disabled={!!computing || !sessionId}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-warm-card-border px-3 py-1.5 text-xs text-warm-cream hover:border-warm-accent/40 disabled:opacity-50"
                    >
                      <FileCheck size={13} />
                      {computing === 'cards-session' ? 'Computing…' : 'Compute all report cards'}
                    </button>
                  </div>
                </div>

                <div>
                  <h2 className="mb-2 text-xs font-medium text-warm-cream">Per class</h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={classId}
                      onChange={(e) => setClassId(e.target.value)}
                      className="rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent min-w-[160px]"
                    >
                      <option value="">Select class…</option>
                      {sections.map((s) => (
                        <option key={s.id} value={s.id}>{classLabel(s)}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => runComputeReportCards('class')}
                      disabled={!!computing || !sessionId || !classId}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-warm-card-border px-3 py-1.5 text-xs text-warm-muted hover:text-warm-cream disabled:opacity-50"
                    >
                      <FileCheck size={13} />
                      {computing === 'cards-class' ? 'Computing…' : 'Compute class report cards'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-warm-card-border bg-warm-card p-5">
            <h2 className="mb-2 text-sm font-medium text-warm-cream">Next steps</h2>
            <p className="mb-3 text-[11px] text-warm-muted">
              After computing, view and publish report cards from Reports, or explore trends in Analytics.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => router.push('/admin/result/reports')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-warm-card-border px-3 py-1.5 text-xs text-warm-muted hover:text-warm-cream"
              >
                <TrendingUp size={13} /> View reports
              </button>
              <button
                type="button"
                onClick={() => router.push('/admin/result/analytics')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-warm-card-border px-3 py-1.5 text-xs text-warm-muted hover:text-warm-cream"
              >
                <BarChart3 size={13} /> View analytics
              </button>
            </div>
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
    </main>
  );
}
