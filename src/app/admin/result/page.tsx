'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ClipboardList, ChevronRight, Calendar, Plus } from 'lucide-react';
import ExamSessionModal from './components/exam-session-modal';

interface ExamSession {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  _count: { examTypes: number; exams: number };
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ResultGradeHubPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const activeAYId = typeof window !== 'undefined' ? localStorage.getItem('activeAYId') : null;
  const isReadOnly = typeof window !== 'undefined' && localStorage.getItem('activeAYStatus') === 'ARCHIVED';

  const loadSessions = () => {
    if (!activeAYId) return;
    setLoading(true);
    setError('');
    api.getExamSessions()
      .then((res) => setSessions(res.data || []))
      .catch((e: any) => setError(e.message || 'Failed to load exam sessions'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!activeAYId) {
      setLoading(false);
      return;
    }
    loadSessions();
  }, [activeAYId]);

  if (!activeAYId) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-10 text-center">
          <ClipboardList size={32} className="mx-auto mb-3 text-warm-muted" />
          <p className="text-sm text-warm-muted">No academic year selected.</p>
          <p className="mt-1 text-xs text-warm-muted/60">Select a year from the sidebar and press Go.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-light text-warm-cream">Result &amp; Grade</h1>
          <p className="mt-1 text-xs text-warm-muted">
            Select an exam session to manage types, exams, marks entry, and report cards.
          </p>
        </div>
        {!isReadOnly && (
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-warm-accent px-3 py-1.5 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76]"
          >
            <Plus size={14} /> Add session
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-warm-card" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-warm-card-border bg-warm-card px-4 py-3 text-xs text-[#b39a76]">
          {error}
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-10 text-center">
          <ClipboardList size={28} className="mx-auto mb-3 text-warm-muted" />
          <p className="text-sm text-warm-muted">No exam sessions for this academic year.</p>
          {!isReadOnly && (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="mt-4 rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76]"
            >
              Create first session
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => router.push(`/admin/result/sessions/${s.id}`)}
              className="flex w-full items-center justify-between rounded-xl border border-warm-card-border bg-warm-card p-4 text-left transition-colors hover:border-warm-accent/40 hover:bg-warm-card/80"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-warm-accent/10">
                  <ClipboardList size={18} className="text-warm-accent" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-warm-cream">{s.name}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-warm-muted">
                    <Calendar size={12} className="shrink-0" />
                    {fmtDate(s.startDate)} — {fmtDate(s.endDate)}
                  </p>
                  <p className="mt-1 text-[11px] text-warm-muted/80">
                    {s._count.exams} exam{s._count.exams !== 1 ? 's' : ''}
                    {' · '}
                    {s._count.examTypes} type{s._count.examTypes !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <ChevronRight size={18} className="shrink-0 text-warm-muted" />
            </button>
          ))}
        </div>
      )}

      <ExamSessionModal
        open={createOpen}
        mode="create"
        onClose={() => setCreateOpen(false)}
        onSaved={(session) => {
          loadSessions();
          router.push(`/admin/result/sessions/${session.id}`);
        }}
      />
    </main>
  );
}
