'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ClipboardList, ChevronLeft, Calendar, FileText, Layers } from 'lucide-react';

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

function progressColor(pct: number) {
  if (pct >= 80) return 'bg-green-500';
  if (pct >= 40) return 'bg-yellow-500';
  return 'bg-warm-accent';
}

export default function ResultSessionPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const activeAYId = typeof window !== 'undefined' ? localStorage.getItem('activeAYId') : null;

  useEffect(() => {
    if (!activeAYId || !sessionId) {
      setLoading(false);
      return;
    }
    api.getResultSessionSummary(sessionId)
      .then((res) => setSummary(res.data))
      .catch((e: any) => setError(e.message || 'Failed to load session'))
      .finally(() => setLoading(false));
  }, [activeAYId, sessionId]);

  if (!activeAYId) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-10 text-center">
          <p className="text-sm text-warm-muted">No academic year selected.</p>
        </div>
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
        <ChevronLeft size={14} /> All sessions
      </button>

      {loading ? (
        <div className="space-y-3">
          <div className="h-24 rounded-xl bg-warm-card animate-pulse" />
          <div className="h-32 rounded-xl bg-warm-card animate-pulse" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-warm-card-border bg-warm-card px-4 py-3 text-xs text-[#b39a76]">
          {error}
        </div>
      ) : summary ? (
        <>
          <div className="mb-6">
            <h1 className="text-xl font-light text-warm-cream">{summary.session.name}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-warm-muted">
              <Calendar size={12} />
              {fmtDate(summary.session.startDate)} — {fmtDate(summary.session.endDate)}
            </p>
          </div>

          {/* Overall marks progress */}
          <div className="mb-4 rounded-xl border border-warm-card-border bg-warm-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-medium text-warm-cream">Marks entry progress</p>
              <span className="text-xs text-warm-muted">
                {summary.marksProgress.filled} / {summary.marksProgress.total} subject slots
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#1a1614]">
              <div
                className={`h-full rounded-full transition-all ${progressColor(summary.marksProgress.percent)}`}
                style={{ width: `${summary.marksProgress.percent}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-warm-muted">{summary.marksProgress.percent}% complete</p>
          </div>

          {/* Stats grid */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Types', value: summary.typeCount, icon: Layers },
              { label: 'Exams', value: summary.examCount, icon: FileText },
              { label: 'Results', value: summary.subjectResultCount, icon: ClipboardList },
              { label: 'Report cards', value: summary.reportCardCount, icon: ClipboardList },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-xl border border-warm-card-border bg-warm-card p-4">
                <Icon size={14} className="mb-2 text-warm-accent" />
                <p className="text-lg font-light text-warm-cream">{value}</p>
                <p className="text-[10px] uppercase tracking-wide text-warm-muted">{label}</p>
              </div>
            ))}
          </div>

          {/* Per-exam progress */}
          {summary.exams.length > 0 && (
            <div className="mb-6 rounded-xl border border-warm-card-border bg-warm-card p-5">
              <p className="mb-3 text-xs font-medium text-warm-cream">Exams in this session</p>
              <div className="space-y-3">
                {summary.exams.map((exam) => (
                  <div key={exam.id} className="rounded-lg border border-warm-card-border/60 bg-[#1a1614]/40 p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="text-sm text-warm-cream">{exam.name}</span>
                      <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                        exam.status === 'ACTIVE'
                          ? 'bg-green-900/30 text-green-400'
                          : 'bg-warm-card-border/50 text-warm-muted'
                      }`}>
                        {exam.status}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[#1a1614]">
                      <div
                        className={`h-full rounded-full ${progressColor(exam.marksProgress.percent)}`}
                        style={{ width: `${exam.marksProgress.percent}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[10px] text-warm-muted">
                      {exam.marksProgress.percent}% marks entered
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Phase 2 placeholder */}
          <div className="rounded-xl border border-dashed border-warm-card-border bg-warm-card/50 p-6 text-center">
            <p className="text-sm text-warm-muted">Exam types &amp; exam management</p>
            <p className="mt-1 text-xs text-warm-muted/60">Phase 2 — next step after your review</p>
          </div>
        </>
      ) : null}
    </main>
  );
}
