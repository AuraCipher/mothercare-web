'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3, ChevronLeft, Calculator, FileCheck, RefreshCw, TrendingUp, ArrowRight,
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

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ResultAnalyticsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<{ id: string; name: string; startDate: string; endDate: string }[]>([]);
  const [summaries, setSummaries] = useState<SessionSummary[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
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
  const isReadOnly = typeof window !== 'undefined' && localStorage.getItem('activeAYStatus') === 'ARCHIVED';

  const loadData = useCallback(async () => {
    if (!ayId) return;
    setLoading(true);
    try {
      const res = await api.getExamSessions();
      const list = res.data || [];
      setSessions(list);
      if (list.length > 0) {
        setSelectedSessionId((prev) => prev || list[0].id);
      }
      const summaryRows = await Promise.all(
        list.map(async (s: { id: string }) => {
          try {
            const r = await api.getResultSessionSummary(s.id);
            return r.data as SessionSummary;
          } catch {
            return null;
          }
        }),
      );
      setSummaries(summaryRows.filter(Boolean) as SessionSummary[]);
    } catch (e: any) {
      showToast('error', e.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [ayId]);

  useEffect(() => {
    if (!ayId) {
      setLoading(false);
      return;
    }
    loadData();
  }, [ayId, loadData]);

  const totals = useMemo(() => {
    return summaries.reduce(
      (acc, s) => ({
        exams: acc.exams + s.examCount,
        results: acc.results + s.subjectResultCount,
        reportCards: acc.reportCards + s.reportCardCount,
        marksTotal: acc.marksTotal + s.marksProgress.total,
        marksFilled: acc.marksFilled + s.marksProgress.filled,
      }),
      { exams: 0, results: 0, reportCards: 0, marksTotal: 0, marksFilled: 0 },
    );
  }, [summaries]);

  const marksPercent = totals.marksTotal > 0
    ? Math.round((totals.marksFilled / totals.marksTotal) * 100)
    : 0;

  const selectedSummary = summaries.find((s) => s.session.id === selectedSessionId);

  const runComputeResults = () => {
    if (!selectedSessionId) return;
    setConfirm({
      open: true,
      title: 'Compute subject results?',
      message: 'Calculates weighted subject percentages for all published exams in this session.',
      confirmLabel: 'Compute results',
      action: async () => {
        setComputing('results');
        try {
          const res = await api.computeResultSession(selectedSessionId);
          showToast('success', `Computed ${res.data.studentCount} student results`);
          await loadData();
        } catch (e: any) {
          showToast('error', e.message || 'Failed to compute results');
        } finally {
          setComputing(null);
        }
      },
    });
  };

  const runComputeReportCards = () => {
    if (!selectedSessionId) return;
    setConfirm({
      open: true,
      title: 'Compute all report cards?',
      message: 'Builds overall grades and class ranks from subject results.',
      confirmLabel: 'Compute report cards',
      action: async () => {
        setComputing('cards');
        try {
          const res = await api.computeReportCardsSession(selectedSessionId);
          showToast('success', `Generated ${res.data.reportCardCount} report cards`);
          await loadData();
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
        <p className="text-sm text-warm-muted">Select an academic year from the sidebar to view result analytics.</p>
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
          <BarChart3 size={22} className="text-warm-accent" />
          <div>
            <h1 className="text-xl font-light text-warm-cream">Result Analytics</h1>
            <p className="mt-0.5 text-xs text-warm-muted">Marks progress, KPIs &amp; compute workflow</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadData()}
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
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-warm-card" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-10 text-center">
          <p className="text-sm text-warm-muted">No exam sessions yet. Create a session from the hub.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-xl border border-warm-card-border bg-warm-card p-5">
            <h2 className="mb-4 text-sm font-medium text-warm-cream">Academic year overview</h2>
            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <div>
                <p className="text-[10px] uppercase text-warm-muted/50">Sessions</p>
                <p className="mt-1 text-lg font-light text-warm-cream">{sessions.length}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-warm-muted/50">Exams</p>
                <p className="mt-1 text-lg font-light text-warm-cream">{totals.exams}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-warm-muted/50">Results</p>
                <p className="mt-1 text-lg font-light text-cyan-400">{totals.results}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-warm-muted/50">Report cards</p>
                <p className="mt-1 text-lg font-light text-orange-400">{totals.reportCards}</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-[10px] text-warm-muted">
                <span>Marks entry progress</span>
                <span>{marksPercent}% ({totals.marksFilled}/{totals.marksTotal})</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-warm-card-border/20">
                <div
                  className="h-full rounded-full bg-warm-accent/80 transition-all"
                  style={{ width: `${Math.min(marksPercent, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {!isReadOnly && (
            <div className="rounded-xl border border-warm-card-border bg-warm-card p-5">
              <h2 className="mb-3 text-sm font-medium text-warm-cream">Compute for session</h2>
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-[11px] text-warm-muted">
                  Session
                  <select
                    value={selectedSessionId}
                    onChange={(e) => setSelectedSessionId(e.target.value)}
                    className="rounded-lg border border-warm-card-border bg-[#1a1614] px-2 py-1 text-xs text-warm-cream outline-none focus:border-warm-accent"
                  >
                    {sessions.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </label>
                {selectedSummary && (
                  <span className="text-[10px] text-warm-muted/60">
                    {selectedSummary.marksProgress.percent}% marks · {selectedSummary.subjectResultCount} results · {selectedSummary.reportCardCount} cards
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={runComputeResults}
                  disabled={!!computing || !selectedSessionId}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-warm-accent px-3 py-1.5 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] disabled:opacity-50"
                >
                  <Calculator size={13} />
                  {computing === 'results' ? 'Computing…' : 'Compute results'}
                </button>
                <button
                  type="button"
                  onClick={runComputeReportCards}
                  disabled={!!computing || !selectedSessionId}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-warm-card-border px-3 py-1.5 text-xs text-warm-cream hover:border-warm-accent/40 disabled:opacity-50"
                >
                  <FileCheck size={13} />
                  {computing === 'cards' ? 'Computing…' : 'Compute report cards'}
                </button>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-warm-card-border bg-warm-card p-5">
            <h2 className="mb-4 text-sm font-medium text-warm-cream">Per session</h2>
            <div className="space-y-3">
              {sessions.map((s) => {
                const sum = summaries.find((x) => x.session.id === s.id);
                const pct = sum?.marksProgress.percent ?? 0;
                return (
                  <div key={s.id} className="rounded-lg border border-warm-card-border/40 bg-[#1a1614]/40 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-medium text-warm-cream">{s.name}</p>
                        <p className="text-[10px] text-warm-muted">{fmtDate(s.startDate)} — {fmtDate(s.endDate)}</p>
                      </div>
                      <div className="flex gap-3 text-[10px] text-warm-muted">
                        <span>{sum?.examCount ?? 0} exams</span>
                        <span>{sum?.subjectResultCount ?? 0} results</span>
                        <span>{sum?.reportCardCount ?? 0} cards</span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="mb-0.5 flex justify-between text-[9px] text-warm-muted/60">
                        <span>Marks</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-warm-card-border/20">
                        <div className="h-full rounded-full bg-cyan-500/60" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
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
