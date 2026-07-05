'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, ChevronLeft, RefreshCw, TrendingUp, ArrowRight, GraduationCap } from 'lucide-react';
import { api } from '@/lib/api';
import { showToast } from '@/components/toast';
import {
  ResultLineChart, ResultBarChart, ResultGradeBarChart, ResultHorizontalBars,
  ResultPassFailChart, ResultPassFailTrendChart, ResultStackedPassFailChart, gradeColor,
} from '@/components/result/ResultCharts';
import type { AnalyticsData, Section, Subject } from './types';

const ALL = 'all';
type TrendView = 'session' | 'exam' | 'class';

function classLabel(c: { name: string; section?: string | null }) {
  return c.section ? `${c.name} — ${c.section}` : c.name;
}

function truncateLabel(name: string, max = 12) {
  return name.length > max ? `${name.slice(0, max - 1)}…` : name;
}

const selectClass =
  'rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent min-w-[140px]';

export default function ResultAnalyticsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<{ id: string; name: string; startDate: string; endDate: string }[]>([]);
  const [examsInSession, setExamsInSession] = useState<{ id: string; name: string }[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [classSubjects, setClassSubjects] = useState<Subject[]>([]);

  const [sessionFilter, setSessionFilter] = useState(ALL);
  const [examFilter, setExamFilter] = useState(ALL);
  const [classFilter, setClassFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [trendView, setTrendView] = useState<TrendView>('session');

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);

  const ayId = typeof window !== 'undefined' ? localStorage.getItem('activeAYId') : null;
  const branchId = typeof window !== 'undefined' ? localStorage.getItem('activeBranchId') : null;

  const loadSessions = useCallback(async () => {
    if (!ayId) return;
    try {
      const res = await api.getExamSessions();
      setSessions(res.data || []);
    } catch (e: any) {
      showToast('error', e.message || 'Failed to load sessions');
    }
  }, [ayId]);

  const loadExams = useCallback(async (sessionId: string) => {
    if (!sessionId || sessionId === ALL) {
      setExamsInSession([]);
      return;
    }
    try {
      const res = await api.getResultExams(sessionId);
      setExamsInSession((res.data || []).map((e: { id: string; name: string }) => ({ id: e.id, name: e.name })));
    } catch {
      setExamsInSession([]);
    }
  }, []);

  const loadAnalytics = useCallback(async () => {
    if (!ayId) return;
    setLoading(true);
    try {
      const res = await api.getResultAnalytics({
        sessionId: sessionFilter !== ALL ? sessionFilter : undefined,
        examId: examFilter !== ALL ? examFilter : undefined,
        classId: classFilter || undefined,
        subjectId: subjectFilter || undefined,
      });
      setData(res.data as AnalyticsData);
    } catch (e: any) {
      showToast('error', e.message || 'Failed to load analytics');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [ayId, sessionFilter, examFilter, classFilter, subjectFilter]);

  useEffect(() => {
    if (!branchId || !ayId) return;
    api.getSections(branchId, ayId)
      .then((res) => setSections((res.data || []).filter((s: Section & { isActive?: boolean }) => s.isActive !== false)))
      .catch(() => {});
  }, [branchId, ayId]);

  useEffect(() => {
    if (!branchId || !classFilter) {
      setClassSubjects([]);
      return;
    }
    api.getSectionSubjects(branchId, classFilter)
      .then((res) => {
        const rows = (res.data || []).map((gs: { subject: Subject }) => gs.subject).filter(Boolean);
        setClassSubjects(rows);
      })
      .catch(() => setClassSubjects([]));
  }, [branchId, classFilter]);

  useEffect(() => {
    if (!ayId) {
      setLoading(false);
      return;
    }
    loadSessions();
  }, [ayId, loadSessions]);

  useEffect(() => {
    if (sessionFilter !== ALL) loadExams(sessionFilter);
    else setExamsInSession([]);
  }, [sessionFilter, loadExams]);

  useEffect(() => {
    if (!ayId) return;
    loadAnalytics();
  }, [ayId, loadAnalytics]);

  useEffect(() => {
    if (sessionFilter === ALL) setTrendView('session');
    else if (examFilter !== ALL) setTrendView('exam');
  }, [sessionFilter, examFilter]);

  const handleSessionChange = (value: string) => {
    setSessionFilter(value);
    setExamFilter(ALL);
    setSubjectFilter('');
    setTrendView(value === ALL ? 'session' : 'exam');
  };

  const handleClassChange = (value: string) => {
    setClassFilter(value);
    setSubjectFilter('');
  };

  const summary = data?.summary;
  const showExamFilter = sessionFilter !== ALL && examsInSession.length > 0;

  const subjectOptions = useMemo(() => {
    if (classFilter && classSubjects.length > 0) return classSubjects;
    if (data?.subjectAvgs?.length) {
      return data.subjectAvgs.map((s) => ({ id: s.id, name: s.label }));
    }
    return [];
  }, [classFilter, classSubjects, data]);

  const activeTrend = useMemo(() => {
    if (!data) return [];
    if (trendView === 'session') return data.sessionTrend;
    if (trendView === 'exam') return data.examTrend;
    return data.classTrend;
  }, [data, trendView]);

  const marksTrend = useMemo(() => {
    return activeTrend.map((t) => ({
      label: truncateLabel(t.label),
      marksPercent: t.marksPercent,
      secondary: t.passRate,
    }));
  }, [activeTrend]);

  const passFailTrend = useMemo(() => {
    return activeTrend.map((t) => ({
      label: truncateLabel(t.label),
      passRate: t.passRate,
      avgPercent: t.avgPercent,
      marksPercent: t.marksPercent,
    }));
  }, [activeTrend]);

  const stackedPassFail = useMemo(() => {
    return activeTrend
      .filter((t) => t.total > 0)
      .map((t) => ({ label: truncateLabel(t.label, 10), passed: t.passed, failed: t.failed }));
  }, [activeTrend]);

  const classMarksBars = useMemo(() => {
    return (data?.classTrend ?? []).map((t) => ({ label: t.label, pct: t.marksPercent }));
  }, [data]);

  if (!ayId) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-10">
        <p className="text-sm text-warm-muted">Select an academic year from the sidebar to view result analytics.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
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
            <p className="mt-0.5 text-xs text-warm-muted">Pass/fail, grading, trends across sessions, exams &amp; classes</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadAnalytics()}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-lg border border-warm-card-border px-2.5 py-1.5 text-[10px] text-warm-muted hover:text-warm-cream disabled:opacity-50"
          >
            <RefreshCw size={11} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/result/report-cards')}
            className="inline-flex items-center gap-1 rounded-lg border border-warm-card-border px-2.5 py-1.5 text-[10px] text-warm-muted hover:text-warm-cream"
          >
            <GraduationCap size={11} /> Report Cards <ArrowRight size={10} />
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

      {/* Filters */}
      <div className="mb-6 rounded-xl border border-warm-card-border bg-warm-card p-4 space-y-3">
        <p className="text-[10px] uppercase tracking-wide text-warm-muted/50">Filters</p>
        <div className="flex flex-wrap items-center gap-2">
          <select value={sessionFilter} onChange={(e) => handleSessionChange(e.target.value)} className={selectClass}>
            <option value={ALL}>All sessions</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          {showExamFilter && (
            <select value={examFilter} onChange={(e) => setExamFilter(e.target.value)} className={selectClass}>
              <option value={ALL}>All exams</option>
              {examsInSession.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          )}

          <select value={classFilter} onChange={(e) => handleClassChange(e.target.value)} className={selectClass}>
            <option value="">All classes</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>{classLabel(s)}</option>
            ))}
          </select>

          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            disabled={subjectOptions.length === 0}
            className={`${selectClass} disabled:opacity-50`}
          >
            <option value="">All subjects</option>
            {subjectOptions.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <span className="mr-1 self-center text-[10px] text-warm-muted/50">Trend by:</span>
          {([
            { id: 'session' as const, label: 'Sessions', show: sessionFilter === ALL },
            { id: 'exam' as const, label: 'Exams', show: sessionFilter !== ALL && examFilter === ALL },
            { id: 'class' as const, label: 'Classes', show: true },
          ]).filter((t) => t.show).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTrendView(t.id)}
              className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
                trendView === t.id
                  ? 'bg-warm-accent font-medium text-[#1a1614]'
                  : 'border border-warm-card-border text-warm-muted hover:text-warm-cream'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {summary && (
          <p className="text-[10px] text-warm-muted/60">
            Passing threshold: {summary.passingMinPercent}% · Grades D/E/F count as fail
          </p>
        )}
      </div>

      {loading && !data ? (
        <div className="space-y-4">
          <div className="h-28 animate-pulse rounded-xl bg-warm-card" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="h-48 animate-pulse rounded-xl bg-warm-card" />
            <div className="h-48 animate-pulse rounded-xl bg-warm-card" />
          </div>
        </div>
      ) : summary ? (
        <div className={`space-y-6 ${loading ? 'opacity-70' : ''}`}>
          {/* KPI row */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { label: 'Marks entry', value: `${summary.marksPercent}%`, color: 'text-cyan-400' },
              { label: 'Pass rate', value: `${summary.passRate}%`, color: 'text-green-400' },
              { label: 'Passed', value: String(summary.passed), color: 'text-green-400' },
              { label: 'Failed', value: String(summary.failed), color: 'text-red-400' },
              { label: 'Avg %', value: summary.avgPercentage != null ? `${summary.avgPercentage}%` : '—', color: 'text-warm-accent' },
              { label: 'Results', value: String(summary.resultCount), color: 'text-warm-cream' },
            ].map((k) => (
              <div key={k.label} className="rounded-xl border border-warm-card-border bg-warm-card p-4">
                <p className="text-[10px] uppercase tracking-wide text-warm-muted/50">{k.label}</p>
                <p className={`mt-1 text-lg font-light ${k.color}`}>{k.value}</p>
              </div>
            ))}
          </div>

          {/* Marks progress bar */}
          <div className="rounded-xl border border-warm-card-border bg-warm-card p-5">
            <div className="mb-1 flex justify-between text-[10px] text-warm-muted">
              <span>Marks entry progress</span>
              <span>{summary.marksPercent}% ({summary.marksFilled}/{summary.marksTotal} slots)</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-warm-card-border/20">
              <div className="h-full rounded-full bg-cyan-500/80 transition-all" style={{ width: `${Math.min(summary.marksPercent, 100)}%` }} />
            </div>
          </div>

          {/* Pass/fail + grade */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-warm-card-border bg-warm-card p-5">
              <ResultPassFailChart
                passed={data!.passFail.passed}
                failed={data!.passFail.failed}
                pending={data!.passFail.pending}
                title="Pass / Fail breakdown"
                subtitle={subjectFilter ? 'Filtered subject results' : 'Subject-level results (all filters)'}
              />
            </div>
            {data!.gradeBreakdown.length > 0 && (
              <div className="rounded-xl border border-warm-card-border bg-warm-card p-5">
                <ResultGradeBarChart data={data!.gradeBreakdown} title="Grade distribution" />
              </div>
            )}
          </div>

          {/* Trend charts */}
          {passFailTrend.length > 0 && (
            <div className="rounded-xl border border-warm-card-border bg-warm-card p-5">
              <ResultPassFailTrendChart
                data={passFailTrend}
                title={`${trendView === 'session' ? 'Session' : trendView === 'exam' ? 'Exam' : 'Class'} — pass rate & average trend`}
                subtitle="Green = pass rate · dashed = average %"
                height={300}
              />
            </div>
          )}

          {marksTrend.length > 0 && (
            <div className="rounded-xl border border-warm-card-border bg-warm-card p-5">
              <ResultLineChart
                data={marksTrend}
                title={`${trendView === 'session' ? 'Session' : trendView === 'exam' ? 'Exam' : 'Class'} — marks entry trend`}
                subtitle="Marks slot completion % · dashed = pass rate"
                height={260}
                primaryLabel="Marks %"
                secondaryLabel="Pass rate %"
                showSecondary
              />
            </div>
          )}

          {stackedPassFail.length > 0 && (
            <div className="rounded-xl border border-warm-card-border bg-warm-card p-5">
              <ResultStackedPassFailChart
                data={stackedPassFail}
                title={`${trendView === 'session' ? 'Session' : trendView === 'exam' ? 'Exam' : 'Class'} — pass vs fail count`}
                subtitle="Stacked student/result counts"
              />
            </div>
          )}

          {/* Detail charts grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {data!.subjectAvgs.length > 0 && (
              <div className="rounded-xl border border-warm-card-border bg-warm-card p-5">
                <ResultBarChart
                  data={data!.subjectAvgs.map((s) => ({
                    label: truncateLabel(s.label, 10),
                    value: s.avg,
                    color: gradeColor(s.avg >= 80 ? 'A' : s.avg >= 60 ? 'B' : s.avg >= 40 ? 'C' : 'F'),
                  }))}
                  title="Subject averages"
                  subtitle="Average % per subject"
                  valueSuffix="%"
                />
              </div>
            )}

            {data!.subjectAvgs.length > 0 && (
              <div className="rounded-xl border border-warm-card-border bg-warm-card p-5">
                <ResultBarChart
                  data={data!.subjectAvgs.map((s) => ({
                    label: truncateLabel(s.label, 10),
                    value: s.passRate,
                    color: s.passRate >= 80 ? '#22c55e' : s.passRate >= 50 ? '#eab308' : '#ef4444',
                  }))}
                  title="Subject pass rates"
                  subtitle="% of students passing per subject"
                  valueSuffix="%"
                />
              </div>
            )}

            {classMarksBars.length > 0 && trendView !== 'class' && (
              <div className="rounded-xl border border-warm-card-border bg-warm-card p-5 lg:col-span-2">
                <ResultHorizontalBars
                  data={classMarksBars}
                  title="Marks entry by class"
                  subtitle="Completion % per class for current filters"
                />
              </div>
            )}

            {trendView === 'class' && data!.classTrend.length > 0 && (
              <div className="rounded-xl border border-warm-card-border bg-warm-card p-5 lg:col-span-2">
                <ResultHorizontalBars
                  data={data!.classTrend.map((t) => ({ label: t.label, pct: t.passRate }))}
                  title="Pass rate by class"
                  subtitle="Student pass % per class"
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-10 text-center">
          <p className="text-sm text-warm-muted">No analytics data available.</p>
          <p className="mt-2 text-xs text-warm-muted/60">
            Run <code className="rounded bg-[#1a1614] px-1 py-0.5">npm run prisma:seed:result</code> in the backend, or create sessions and compute results.
          </p>
        </div>
      )}
    </main>
  );
}
