'use client';

import { useEffect, useState } from 'react';
import { FileText, Download, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { showToast } from '@/components/toast';
import { api } from '@/lib/api';
import { classLabel, downloadCsv } from '@/lib/feeAnalytics';

type ReportType = 'standard' | 'fail-list' | 'class-summary';

const ALL_EXAMS = '';
type OutcomeFilter = '' | 'passed' | 'failed';

const PASSING_MIN = 40;
const FAIL_GRADES = new Set(['D', 'E', 'F']);

const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  standard: 'Student Results',
  'fail-list': 'Fail List',
  'class-summary': 'Class Summary',
};

const OUTCOME_LABELS: Record<OutcomeFilter, string> = {
  '': 'All',
  passed: 'Passed',
  failed: 'Failed',
};

type Section = { id: string; name: string; section?: string | null };

type ReportRow = {
  roll: string;
  name: string;
  section: string;
  subjectCells?: string[];
  overall?: string;
  grade?: string;
  rank?: string;
  failCount?: number;
  studentCount?: number;
  passRate?: number;
  avgPercent?: number;
  passed?: number;
  failed?: number;
};

type ReportData = {
  title: string;
  generatedAt: string;
  total: number;
  reportType: ReportType;
  showSection: boolean;
  subjectHeaders: string[];
  summary: {
    students: number;
    results: number;
    passed: number;
    failed: number;
    passRate: number;
    avgPercent: number | null;
    reportCards: number;
  };
  rows: ReportRow[];
  headers: string[];
};

function isPassing(pct: number, grade: string) {
  if (FAIL_GRADES.has(grade)) return false;
  return pct >= PASSING_MIN;
}

function pctStr(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return '—';
  return `${n.toFixed(1)}%`;
}

function studentPasses(row: {
  subjectResults?: { percentage: number; grade: string }[];
  reportCard?: { overallPercentage: number; overallGrade: string } | null;
}) {
  const srs = row.subjectResults || [];
  if (srs.length === 0) return null;
  if (srs.some((r) => !isPassing(r.percentage, r.grade))) return false;
  return true;
}

function studentFailCount(row: { subjectResults?: { percentage: number; grade: string }[] }) {
  return (row.subjectResults || []).filter((r) => !isPassing(r.percentage, r.grade)).length;
}

function marksEntryPass(
  obtained: number | null,
  isAbsent: boolean,
  totalMarks: number | null,
  passingMarks: number | null,
) {
  const total = totalMarks ?? 100;
  const passing = passingMarks ?? Math.round(total * 0.4);
  const score = isAbsent ? 0 : (obtained ?? 0);
  return score >= passing;
}

function marksEntryPct(obtained: number | null, isAbsent: boolean, totalMarks: number | null) {
  const total = totalMarks ?? 100;
  const score = isAbsent ? 0 : (obtained ?? 0);
  return total > 0 ? Math.round((score / total) * 1000) / 10 : 0;
}

function formatMarksCell(
  obtained: number | null,
  isAbsent: boolean,
  totalMarks: number | null,
  passingMarks: number | null,
) {
  if (obtained == null && !isAbsent) return '—';
  const total = totalMarks ?? 100;
  const score = isAbsent ? 0 : (obtained ?? 0);
  const pass = marksEntryPass(obtained, isAbsent, totalMarks, passingMarks);
  const label = isAbsent ? 'AB' : `${score}/${total}`;
  return `${label} (${pass ? 'P' : 'F'})`;
}

export default function ResultReportsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<{ id: string; name: string }[]>([]);
  const [examsInSession, setExamsInSession] = useState<{ id: string; name: string }[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [sessionId, setSessionId] = useState('');
  const [examId, setExamId] = useState(ALL_EXAMS);
  const [classId, setClassId] = useState('');
  const [reportType, setReportType] = useState<ReportType>('standard');
  const [outcomeFilter, setOutcomeFilter] = useState<OutcomeFilter>('');
  const [failThreshold, setFailThreshold] = useState(40);
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);

  const branchId = typeof window !== 'undefined' ? localStorage.getItem('activeBranchId') : null;
  const ayId = typeof window !== 'undefined' ? localStorage.getItem('activeAYId') : null;

  useEffect(() => {
    if (!ayId) return;
    api.getExamSessions()
      .then((res) => setSessions(res.data || []))
      .catch(() => showToast('error', 'Failed to load exam sessions'));
  }, [ayId]);

  useEffect(() => {
    if (!branchId || !ayId) return;
    api.getSections(branchId, ayId)
      .then((res) => setSections((res.data || []).filter((s: Section & { isActive?: boolean }) => s.isActive !== false)))
      .catch(() => {});
  }, [branchId, ayId]);

  useEffect(() => {
    if (!sessionId) {
      setExamsInSession([]);
      setExamId(ALL_EXAMS);
      return;
    }
    api.getResultExams(sessionId)
      .then((res) => {
        setExamsInSession((res.data || []).map((e: { id: string; name: string }) => ({ id: e.id, name: e.name })));
      })
      .catch(() => setExamsInSession([]));
    setExamId(ALL_EXAMS);
  }, [sessionId]);

  const handleSessionChange = (value: string) => {
    setSessionId(value);
    setExamId(ALL_EXAMS);
    setReport(null);
  };

  const sessionName = sessions.find((s) => s.id === sessionId)?.name || 'Session';
  const examName = examId ? (examsInSession.find((e) => e.id === examId)?.name || 'Exam') : null;
  const className = classId
    ? (() => {
        const g = sections.find((s) => s.id === classId);
        return g ? classLabel(g.name, g.section) : 'Selected Class';
      })()
    : 'All Classes';

  const generateReport = async () => {
    if (!ayId) {
      showToast('error', 'Select an academic year');
      return;
    }
    if (!sessionId) {
      showToast('error', 'Select an exam session');
      return;
    }

    setLoading(true);
    setReport(null);

    try {
      const showSection = !classId;
      const sfLabel = outcomeFilter ? OUTCOME_LABELS[outcomeFilter] : '';
      const examLabel = examName ? ` · ${examName}` : '';
      const typeLabel = reportType === 'standard' && examId ? 'Exam Marks Sheet' : REPORT_TYPE_LABELS[reportType];
      const title = `${className} · ${typeLabel}${sfLabel ? ` · ${sfLabel}` : ''} · ${sessionName}${examLabel}`;

      if (reportType === 'class-summary') {
        const res = await api.getResultAnalytics({
          sessionId,
          examId: examId || undefined,
          classId: classId || undefined,
        });
        const data = res.data;
        const trend = data?.classTrend || [];
        let rows: ReportRow[] = trend.map((t: {
          label: string;
          passRate: number;
          avgPercent: number;
          passed: number;
          failed: number;
          total: number;
        }) => ({
          roll: '—',
          name: t.label,
          section: t.label,
          studentCount: t.total,
          passRate: t.passRate,
          avgPercent: t.avgPercent,
          passed: t.passed,
          failed: t.failed,
        }));

        if (outcomeFilter === 'passed') {
          rows = rows.filter((r) => (r.passRate ?? 0) >= failThreshold);
        } else if (outcomeFilter === 'failed') {
          rows = rows.filter((r) => (r.passRate ?? 0) < failThreshold);
        }

        const summary = data?.summary || {};
        setReport({
          title,
          generatedAt: new Date().toLocaleString(),
          total: rows.length,
          reportType,
          showSection: false,
          subjectHeaders: [],
          summary: {
            students: summary.passFailTotal ?? 0,
            results: summary.resultCount ?? 0,
            passed: summary.passed ?? 0,
            failed: summary.failed ?? 0,
            passRate: summary.passRate ?? 0,
            avgPercent: summary.avgPercentage ?? null,
            reportCards: summary.reportCardCount ?? 0,
          },
          rows,
          headers: ['Class', 'Results', 'Passed', 'Failed', 'Pass Rate', 'Avg %'],
        });
        setLoading(false);
        return;
      }

      if (examId) {
        const structureRes = await api.getResultExamStructure(examId);
        const structure = (structureRes.data || []).filter((ec: { isActive: boolean; classId: string }) => {
          if (!ec.isActive) return false;
          if (classId) return ec.classId === classId;
          return true;
        });

        const subjectHeaderSet = new Map<string, string>();
        const subjectIds: string[] = [];
        type StudentAcc = {
          roll: string;
          name: string;
          section: string;
          subjectCells: Map<string, string>;
          failCount: number;
          entryCount: number;
          pctSum: number;
        };
        const studentMap = new Map<string, StudentAcc>();

        for (const ec of structure) {
          const sectionLabel = classLabel(ec.class.name, ec.class.section);
          for (const sub of ec.subjects) {
            if (!sub.isActive) continue;
            if (!subjectHeaderSet.has(sub.subject.id)) {
              subjectHeaderSet.set(sub.subject.id, sub.subject.name);
              subjectIds.push(sub.subject.id);
            }
            const gridRes = await api.getResultMarksGrid(sub.id);
            const grid = gridRes.data;
            if (!grid?.students) continue;
            for (const st of grid.students) {
              const key = showSection ? `${ec.classId}:${st.id}` : st.id;
              if (!studentMap.has(key)) {
                studentMap.set(key, {
                  roll: st.rollNumber || '—',
                  name: st.name || '',
                  section: sectionLabel,
                  subjectCells: new Map(),
                  failCount: 0,
                  entryCount: 0,
                  pctSum: 0,
                });
              }
              const acc = studentMap.get(key)!;
              const pass = marksEntryPass(st.marksObtained, st.isAbsent, grid.totalMarks, grid.passingMarks);
              const pct = marksEntryPct(st.marksObtained, st.isAbsent, grid.totalMarks);
              if (st.marksObtained != null || st.isAbsent) {
                acc.entryCount += 1;
                acc.pctSum += pct;
                if (!pass) acc.failCount += 1;
              }
              acc.subjectCells.set(
                sub.subject.id,
                formatMarksCell(st.marksObtained, st.isAbsent, grid.totalMarks, grid.passingMarks),
              );
            }
          }
        }

        const subjectHeaders = subjectIds.map((id) => subjectHeaderSet.get(id)!);
        const allRows: ReportRow[] = [];
        let totalPassed = 0;
        let totalFailed = 0;
        let totalEntries = 0;
        let pctSum = 0;

        for (const acc of studentMap.values()) {
          const studentPass = acc.entryCount > 0 && acc.failCount === 0;
          if (outcomeFilter === 'passed' && !studentPass) continue;
          if (outcomeFilter === 'failed' && studentPass) continue;
          if (reportType === 'fail-list' && acc.failCount === 0) continue;

          totalEntries += acc.entryCount;
          totalFailed += acc.failCount;
          totalPassed += acc.entryCount - acc.failCount;
          pctSum += acc.pctSum;

          const subjectCells = subjectIds.map((id) => acc.subjectCells.get(id) ?? '—');
          const avgPct = acc.entryCount > 0 ? Math.round((acc.pctSum / acc.entryCount) * 10) / 10 : null;

          if (reportType === 'fail-list') {
            allRows.push({
              roll: acc.roll,
              name: acc.name,
              section: acc.section,
              failCount: acc.failCount,
              overall: avgPct != null ? `${avgPct}%` : '—',
              grade: acc.failCount > 0 ? 'Fail' : 'Pass',
            });
          } else {
            allRows.push({
              roll: acc.roll,
              name: acc.name,
              section: acc.section,
              subjectCells,
              overall: avgPct != null ? `${avgPct}%` : '—',
              grade: studentPass ? 'Pass' : acc.entryCount > 0 ? 'Fail' : '—',
              rank: '—',
            });
          }
        }

        if (reportType === 'fail-list') {
          allRows.sort((a, b) => (b.failCount ?? 0) - (a.failCount ?? 0));
        }

        const passRate = totalEntries > 0 ? Math.round((totalPassed / totalEntries) * 1000) / 10 : 0;
        const avgPercent = totalEntries > 0 ? Math.round((pctSum / totalEntries) * 10) / 10 : null;

        let headers: string[] = [];
        if (reportType === 'standard') {
          headers = showSection
            ? ['Roll', 'Class', 'Name', ...subjectHeaders, 'Avg %', 'Outcome']
            : ['Roll', 'Name', ...subjectHeaders, 'Avg %', 'Outcome'];
        } else {
          headers = showSection
            ? ['Roll', 'Class', 'Name', 'Failed Subjects', 'Avg %', 'Outcome']
            : ['Roll', 'Name', 'Failed Subjects', 'Avg %', 'Outcome'];
        }

        setReport({
          title,
          generatedAt: new Date().toLocaleString(),
          total: allRows.length,
          reportType,
          showSection,
          subjectHeaders,
          summary: {
            students: allRows.length,
            results: totalEntries,
            passed: totalPassed,
            failed: totalFailed,
            passRate,
            avgPercent,
            reportCards: 0,
          },
          rows: allRows,
          headers,
        });
        setLoading(false);
        return;
      }

      const targetClasses = classId
        ? sections.filter((s) => s.id === classId)
        : sections;

      const allRows: ReportRow[] = [];
      const sheetsByClass: { cls: Section; sheet: any }[] = [];
      let totalResults = 0;
      let totalPassed = 0;
      let totalFailed = 0;
      let totalReportCards = 0;
      let pctSum = 0;
      let pctCount = 0;

      for (const cls of targetClasses) {
        const sheetRes = await api.getClassResults(sessionId, cls.id);
        const sheet = sheetRes.data;
        if (!sheet) continue;
        sheetsByClass.push({ cls, sheet });
      }

      for (const { cls, sheet } of sheetsByClass) {
        const sectionLabel = classLabel(cls.name, cls.section);
        const students = sheet.students || [];

        for (const row of students) {
          const pass = studentPasses(row);
          const fails = studentFailCount(row);
          totalResults += (row.subjectResults || []).length;
          for (const sr of row.subjectResults || []) {
            if (isPassing(sr.percentage, sr.grade)) totalPassed += 1;
            else totalFailed += 1;
            pctSum += sr.percentage;
            pctCount += 1;
          }
          if (row.reportCard) totalReportCards += 1;

          if (outcomeFilter === 'passed' && pass !== true) continue;
          if (outcomeFilter === 'failed' && pass !== false) continue;

          if (reportType === 'fail-list') {
            if (fails === 0) continue;
            allRows.push({
              roll: row.student?.rollNumber || '—',
              name: row.student?.name || '',
              section: sectionLabel,
              failCount: fails,
              overall: row.reportCard ? pctStr(row.reportCard.overallPercentage) : '—',
              grade: row.reportCard?.overallGrade ?? '—',
            });
          } else {
            // Session-level: one row per student — no per-subject columns
            allRows.push({
              roll: row.student?.rollNumber || '—',
              name: row.student?.name || '',
              section: sectionLabel,
              overall: row.reportCard ? pctStr(row.reportCard.overallPercentage) : '—',
              grade: row.reportCard?.overallGrade ?? '—',
              rank: row.reportCard?.classRank != null ? String(row.reportCard.classRank) : '—',
            });
          }
        }
      }

      if (reportType === 'fail-list') {
        allRows.sort((a, b) => (b.failCount ?? 0) - (a.failCount ?? 0));
      }

      const passRate = totalResults > 0 ? Math.round((totalPassed / totalResults) * 1000) / 10 : 0;
      const avgPercent = pctCount > 0 ? Math.round((pctSum / pctCount) * 10) / 10 : null;

      let headers: string[] = [];
      if (reportType === 'standard') {
        headers = showSection
          ? ['Roll', 'Class', 'Name', 'Overall', 'Grade', 'Rank']
          : ['Roll', 'Name', 'Overall', 'Grade', 'Rank'];
      } else {
        headers = showSection
          ? ['Roll', 'Class', 'Name', 'Failed Subjects', 'Overall', 'Grade']
          : ['Roll', 'Name', 'Failed Subjects', 'Overall', 'Grade'];
      }

      setReport({
        title,
        generatedAt: new Date().toLocaleString(),
        total: allRows.length,
        reportType,
        showSection,
        subjectHeaders: [],
        summary: {
          students: allRows.length,
          results: totalResults,
          passed: totalPassed,
          failed: totalFailed,
          passRate,
          avgPercent,
          reportCards: totalReportCards,
        },
        rows: allRows,
        headers,
      });
    } catch {
      showToast('error', 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (!report) return;
    const csvRows = report.rows.map((r) => {
      if (report.reportType === 'class-summary') {
        return [
          r.name,
          r.studentCount ?? 0,
          r.passed ?? 0,
          r.failed ?? 0,
          `${r.passRate ?? 0}%`,
          r.avgPercent != null ? `${r.avgPercent}%` : '—',
        ];
      }
      if (report.reportType === 'fail-list') {
        const tail = report.headers.includes('Avg %')
          ? [r.failCount ?? 0, r.overall ?? '—', r.grade ?? '—']
          : [r.failCount ?? 0, r.overall ?? '—', r.grade ?? '—'];
        return report.showSection
          ? [r.roll, r.section, r.name, ...tail]
          : [r.roll, r.name, ...tail];
      }
      const tail = report.headers.slice(report.headers.length - (report.headers.includes('Rank') ? 3 : 2));
      const tailValues = tail.map((h) => {
        if (h === 'Overall' || h === 'Avg %') return r.overall ?? '—';
        if (h === 'Grade' || h === 'Outcome') return r.grade ?? '—';
        if (h === 'Rank') return r.rank ?? '—';
        return '';
      });
      const prefix = report.showSection
        ? [r.roll, r.section, r.name]
        : [r.roll, r.name];
      return [...prefix, ...(r.subjectCells || []), ...tailValues];
    });
    downloadCsv(
      (report.title || 'result-report').replace(/[^a-z0-9]/gi, '_') + '.csv',
      report.headers,
      csvRows,
    );
  };

  const downloadPDF = () => {
    if (!report) return;
    const win = window.open('', '_blank');
    if (!win) return;

    const th = report.headers.map((h) => `<th>${h}</th>`).join('');
    const tr = report.rows.map((r) => {
      if (report.reportType === 'class-summary') {
        return `<tr><td>${r.name}</td><td>${r.studentCount ?? 0}</td><td>${r.passed ?? 0}</td><td>${r.failed ?? 0}</td><td class="pct">${r.passRate ?? 0}%</td><td>${r.avgPercent != null ? r.avgPercent + '%' : '—'}</td></tr>`;
      }
      if (report.reportType === 'fail-list') {
        const cells = report.showSection
          ? `<td>${r.roll}</td><td>${r.section}</td><td>${r.name}</td><td>${r.failCount ?? 0}</td><td>${r.overall ?? '—'}</td><td>${r.grade ?? '—'}</td>`
          : `<td>${r.roll}</td><td>${r.name}</td><td>${r.failCount ?? 0}</td><td>${r.overall ?? '—'}</td><td>${r.grade ?? '—'}</td>`;
        return `<tr>${cells}</tr>`;
      }
      const cells = report.showSection
        ? `<td>${r.roll}</td><td>${r.section}</td><td>${r.name}</td>${(r.subjectCells || []).map((c) => `<td>${c}</td>`).join('')}<td>${r.overall ?? '—'}</td><td>${r.grade ?? '—'}</td><td>${r.rank ?? '—'}</td>`
        : `<td>${r.roll}</td><td>${r.name}</td>${(r.subjectCells || []).map((c) => `<td>${c}</td>`).join('')}<td>${r.overall ?? '—'}</td><td>${r.grade ?? '—'}</td><td>${r.rank ?? '—'}</td>`;
      return `<tr>${cells}</tr>`;
    }).join('');

    win.document.write(`
      <html><head><title>${report.title}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #222; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        .meta { font-size: 12px; color: #666; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th { background: #f0f0f0; text-align: left; padding: 8px; border-bottom: 2px solid #ddd; }
        td { padding: 6px 8px; border-bottom: 1px solid #eee; }
        .pct { font-weight: bold; }
        .summary { margin-bottom: 20px; font-size: 13px; }
        .summary span { margin-right: 16px; }
        .green { color: #16a34a; } .red { color: #dc2626; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      <h1>${report.title}</h1>
      <div class="meta">Generated: ${report.generatedAt} · ${report.total} records</div>
      <div class="summary">
        <span>Pass rate: <strong>${report.summary.passRate}%</strong></span>
        <span class="green">Passed: ${report.summary.passed}</span>
        <span class="red">Failed: ${report.summary.failed}</span>
        ${report.summary.avgPercent != null ? `<span>Avg: <strong>${report.summary.avgPercent}%</strong></span>` : ''}
        <span>Report cards: ${report.summary.reportCards}</span>
      </div>
      <table><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table>
      </body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  };

  const renderCell = (r: ReportRow, header: string) => {
    if (report?.reportType === 'class-summary') {
      if (header === 'Class') return r.name;
      if (header === 'Results') return r.studentCount ?? 0;
      if (header === 'Passed') return <span className="text-green-400">{r.passed ?? 0}</span>;
      if (header === 'Failed') return <span className="text-red-400">{r.failed ?? 0}</span>;
      if (header === 'Pass Rate') return `${r.passRate ?? 0}%`;
      if (header === 'Avg %') return r.avgPercent != null ? `${r.avgPercent}%` : '—';
    }
    if (report?.reportType === 'fail-list') {
      if (header === 'Roll') return r.roll;
      if (header === 'Class') return r.section;
      if (header === 'Name') return r.name;
      if (header === 'Failed Subjects') return <span className="text-red-400">{r.failCount ?? 0}</span>;
      if (header === 'Overall' || header === 'Avg %') return r.overall;
      if (header === 'Grade' || header === 'Outcome') return r.grade;
    }
    if (header === 'Roll') return r.roll;
    if (header === 'Class') return r.section;
    if (header === 'Name') return r.name;
    if (header === 'Overall') return r.overall;
    if (header === 'Grade') return r.grade;
    if (header === 'Outcome') return r.grade;
    if (header === 'Avg %') return r.overall;
    if (header === 'Rank') return r.rank;
    const idx = report?.subjectHeaders.indexOf(header) ?? -1;
    if (idx >= 0) return r.subjectCells?.[idx] ?? '—';
    return '';
  };

  if (!ayId) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-10">
        <p className="text-sm text-warm-muted">Select an academic year from the sidebar to generate result reports.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex items-center gap-3">
        <FileText size={22} className="text-warm-accent" />
        <div>
          <h1 className="text-xl font-light text-warm-cream">Result Reports</h1>
          <p className="text-xs text-warm-muted/60">
            Generate printable reports ·{' '}
            <button type="button" onClick={() => router.push('/admin/result/analytics')} className="text-warm-accent hover:underline">
              View Analytics
            </button>
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-warm-card-border bg-warm-card p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-[10px] text-warm-muted/60 uppercase tracking-wider mb-1.5">Exam Session</label>
            <select
              value={sessionId}
              onChange={(e) => handleSessionChange(e.target.value)}
              className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent"
            >
              <option value="">Select session…</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className={!sessionId ? 'opacity-30 pointer-events-none' : ''}>
            <label className="block text-[10px] text-warm-muted/60 uppercase tracking-wider mb-1.5">Exam</label>
            <select
              value={examId}
              onChange={(e) => { setExamId(e.target.value); setReport(null); }}
              className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent"
            >
              <option value="">All exams (session results)</option>
              {examsInSession.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>

          <div className={reportType === 'class-summary' ? 'opacity-30 pointer-events-none' : ''}>
            <label className="block text-[10px] text-warm-muted/60 uppercase tracking-wider mb-1.5">Class</label>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent"
            >
              <option value="">All Classes</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>{classLabel(s.name, s.section)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-warm-muted/60 uppercase tracking-wider mb-1.5">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportType)}
              className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent"
            >
              {(Object.keys(REPORT_TYPE_LABELS) as ReportType[]).map((t) => (
                <option key={t} value={t}>
                  {t === 'standard' && examId ? 'Exam Marks Sheet' : REPORT_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={'mb-4' + (reportType === 'fail-list' ? ' opacity-30 pointer-events-none' : '')}>
          <label className="block text-[10px] text-warm-muted/60 uppercase tracking-wider mb-1.5">Filter by Outcome</label>
          <div className="flex flex-wrap gap-1">
            {(['', 'passed', 'failed'] as OutcomeFilter[]).map((opt) => (
              <button
                key={opt || 'all'}
                type="button"
                onClick={() => setOutcomeFilter(opt)}
                className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
                  outcomeFilter === opt
                    ? 'bg-warm-accent text-[#1a1614] font-medium'
                    : 'border border-warm-card-border text-warm-muted hover:text-warm-cream'
                }`}
              >
                {OUTCOME_LABELS[opt]}
              </button>
            ))}
          </div>
        </div>

        {reportType === 'fail-list' && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[10px] text-warm-muted/60 uppercase tracking-wider">Students with failed subjects</span>
          </div>
        )}

        {reportType === 'class-summary' && outcomeFilter && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[10px] text-warm-muted/60 uppercase tracking-wider">
              {outcomeFilter === 'passed' ? 'At or above' : 'Below'}
            </span>
            <input
              type="number"
              value={failThreshold}
              onChange={(e) => setFailThreshold(Number(e.target.value))}
              min={0}
              max={100}
              className="w-16 rounded-lg border border-warm-card-border bg-[#1a1614] px-2 py-1.5 text-xs text-warm-cream text-center outline-none focus:border-warm-accent"
            />
            <span className="text-[10px] text-warm-muted/60">% threshold</span>
          </div>
        )}

        <p className="mb-4 text-[10px] text-warm-muted/50">
          Passing: {PASSING_MIN}% or above · Grades D/E/F count as fail
          {examId
            ? ' · Subject columns shown for the selected exam only'
            : ' · All exams shows overall results per student (no subject columns)'}
        </p>

        <button
          type="button"
          onClick={generateReport}
          disabled={loading || !sessionId}
          className="inline-flex items-center gap-1.5 rounded-lg bg-warm-accent px-6 py-2.5 text-sm font-medium text-[#1a1614] hover:bg-[#b39a76] disabled:opacity-50 transition-colors"
        >
          {loading ? <RefreshCw size={15} className="animate-spin" /> : <FileText size={15} />}
          {loading ? 'Generating…' : 'Generate Report'}
        </button>
      </div>

      {/* Report output — only after generate */}
      {report && (
        <div className="rounded-xl border border-warm-card-border overflow-hidden">
          <div className="bg-warm-card/70 px-5 py-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-medium text-warm-cream">{report.title}</h2>
              <p className="text-[10px] text-warm-muted/50 mt-0.5">{report.generatedAt} · {report.total} records</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={downloadCSV}
                className="inline-flex items-center gap-1.5 rounded-lg border border-warm-card-border px-3 py-1.5 text-xs text-warm-cream hover:bg-warm-card transition-colors"
              >
                CSV
              </button>
              <button
                type="button"
                onClick={downloadPDF}
                className="inline-flex items-center gap-1.5 rounded-lg border border-warm-card-border px-3 py-1.5 text-xs text-warm-cream hover:bg-warm-card transition-colors"
              >
                <Download size={13} /> Download / Print
              </button>
              <button
                type="button"
                onClick={generateReport}
                className="inline-flex items-center gap-1.5 rounded-lg border border-warm-card-border px-3 py-1.5 text-xs text-warm-muted hover:text-warm-cream transition-colors"
              >
                <RefreshCw size={13} /> Regenerate
              </button>
            </div>
          </div>

          <div className="px-5 py-3 border-t border-warm-card-border/30 flex flex-wrap gap-4 text-xs text-warm-muted/70">
            <span>Pass rate: <span className="text-warm-accent font-medium">{report.summary.passRate}%</span></span>
            <span>Passed: <span className="text-green-400">{report.summary.passed}</span></span>
            <span>Failed: <span className="text-red-400">{report.summary.failed}</span></span>
            {report.summary.avgPercent != null && (
              <span>Avg: <span className="text-warm-cream font-medium">{report.summary.avgPercent}%</span></span>
            )}
            <span>Report cards: <span className="text-warm-cream">{report.summary.reportCards}</span></span>
          </div>

          <div className="overflow-x-auto border-t border-warm-card-border/30 max-h-[32rem] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-warm-card/90 backdrop-blur-sm">
                <tr>
                  {report.headers.map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-[10px] text-warm-muted font-medium whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.rows.map((r, i) => (
                  <tr key={i} className="border-t border-warm-card-border/20 hover:bg-warm-card/20 transition-colors">
                    {report.headers.map((h) => (
                      <td key={h} className="px-4 py-2 text-xs text-warm-cream whitespace-nowrap">
                        {renderCell(r, h)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {report.rows.length === 0 && (
              <div className="p-8 text-center text-xs text-warm-muted/40">No records match this report criteria</div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
