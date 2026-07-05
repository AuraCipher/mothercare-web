'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, ChevronLeft, Calculator, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { showToast } from '@/components/toast';
import ResultsSection from '../components/results-section';

export default function ResultReportsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<{ id: string; name: string }[]>([]);
  const [sessionId, setSessionId] = useState('');
  const [resultCount, setResultCount] = useState(0);
  const [reportCardCount, setReportCardCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const ayId = typeof window !== 'undefined' ? localStorage.getItem('activeAYId') : null;
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
    if (!id) return;
    try {
      const res = await api.getResultSessionSummary(id);
      setResultCount(res.data.subjectResultCount ?? 0);
      setReportCardCount(res.data.reportCardCount ?? 0);
    } catch {
      setResultCount(0);
      setReportCardCount(0);
    }
  }, []);

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

  if (!ayId) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <p className="text-sm text-warm-muted">Select an academic year from the sidebar to generate result reports.</p>
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
          <TrendingUp size={22} className="text-orange-400" />
          <div>
            <h1 className="text-xl font-light text-warm-cream">Result Reports</h1>
            <p className="mt-0.5 text-xs text-warm-muted">
              Class result sheets &amp; report cards ·{' '}
              <button
                type="button"
                onClick={() => router.push('/admin/result/analytics')}
                className="text-warm-accent hover:underline"
              >
                Analytics
              </button>
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => router.push('/admin/result/compute')}
          className="inline-flex items-center gap-1 rounded-lg border border-warm-card-border px-2.5 py-1.5 text-[10px] text-warm-muted hover:text-warm-cream"
        >
          <Calculator size={11} /> Compute results <ArrowRight size={10} />
        </button>
      </div>

      {loading ? (
        <div className="h-32 animate-pulse rounded-xl bg-warm-card" />
      ) : sessions.length === 0 ? (
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-10 text-center">
          <p className="text-sm text-warm-muted">No exam sessions yet. Create a session from the hub.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-5">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-[11px] text-warm-muted">
              Exam session
              <select
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                className="rounded-lg border border-warm-card-border bg-[#1a1614] px-2 py-1 text-xs text-warm-cream outline-none focus:border-warm-accent"
              >
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </label>
          </div>

          {sessionId && (
            <ResultsSection
              sessionId={sessionId}
              readOnly={isReadOnly}
              resultCount={resultCount}
              reportCardCount={reportCardCount}
              hideComputeActions
              onChanged={() => loadSummary(sessionId)}
            />
          )}
        </div>
      )}
    </main>
  );
}
