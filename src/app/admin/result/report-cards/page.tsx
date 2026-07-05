'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText, ChevronLeft, Download, Printer, RefreshCw, GraduationCap,
} from 'lucide-react';
import { api } from '@/lib/api';
import { showToast } from '@/components/toast';
import { buildExamReportCards, classLabel } from '@/lib/buildExamReportCards';
import {
  type ReportCardBundle,
  type ExamReportCard,
  downloadReportCardsCsv,
  printReportCards,
  renderSingleReportCardHtml,
  REPORT_CARD_PREVIEW_STYLES,
} from '@/lib/reportCardTemplate';

type Section = { id: string; name: string; section?: string | null };

type StudentOption = { id: string; name: string; rollNumber?: string | null };

const PLACEHOLDER = '';

function ReportCardPreview({ bundle, card }: { bundle: ReportCardBundle; card: ExamReportCard }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-warm-card-border/60 bg-[#e8e8e8] p-4 shadow-lg">
      <div
        className="mx-auto text-[#1c1917]"
        dangerouslySetInnerHTML={{ __html: renderSingleReportCardHtml(bundle, card) }}
      />
    </div>
  );
}

export default function ReportCardsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<{ id: string; name: string }[]>([]);
  const [exams, setExams] = useState<{ id: string; name: string }[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [sessionId, setSessionId] = useState(PLACEHOLDER);
  const [examId, setExamId] = useState(PLACEHOLDER);
  const [classId, setClassId] = useState(PLACEHOLDER);
  const [studentId, setStudentId] = useState(PLACEHOLDER);
  const [studentsInClass, setStudentsInClass] = useState<StudentOption[]>([]);
  const [bundle, setBundle] = useState<ReportCardBundle | null>(null);
  const [loading, setLoading] = useState(false);
  const [metaLoading, setMetaLoading] = useState(true);
  const [schoolName, setSchoolName] = useState('');
  const [schoolAddress, setSchoolAddress] = useState<string>();
  const [schoolPhone, setSchoolPhone] = useState<string>();
  const [academicYear, setAcademicYear] = useState<string>();

  const ayId = typeof window !== 'undefined' ? localStorage.getItem('activeAYId') : null;
  const branchId = typeof window !== 'undefined' ? localStorage.getItem('activeBranchId') : null;
  const ayName = typeof window !== 'undefined' ? localStorage.getItem('activeAYName') : null;

  useEffect(() => {
    if (ayName) setAcademicYear(ayName);
  }, [ayName]);

  useEffect(() => {
    if (!branchId) return;
    api.getBranch(branchId)
      .then((res) => {
        const b = res.data;
        if (b?.name) setSchoolName(b.name);
        if (b?.address) setSchoolAddress(b.address);
        if (b?.phone) setSchoolPhone(b.phone);
      })
      .catch(() => {});
  }, [branchId]);

  useEffect(() => {
    if (!ayId) {
      setMetaLoading(false);
      return;
    }
    api.getExamSessions()
      .then((res) => setSessions(res.data || []))
      .catch(() => showToast('error', 'Failed to load sessions'))
      .finally(() => setMetaLoading(false));
  }, [ayId]);

  useEffect(() => {
    if (!branchId || !ayId) return;
    api.getSections(branchId, ayId)
      .then((res) => setSections((res.data || []).filter((s: Section & { isActive?: boolean }) => s.isActive !== false)))
      .catch(() => {});
  }, [branchId, ayId]);

  useEffect(() => {
    if (!classId || !branchId || !ayId) {
      setStudentsInClass([]);
      setStudentId(PLACEHOLDER);
      return;
    }
    api.getStudents({ groupId: classId, branchId, academicYearId: ayId, limit: 500 })
      .then((res) => {
        const rows = (res.data || [])
          .filter((s: { isActive?: boolean }) => s.isActive !== false)
          .map((s: { id: string; name: string; rollNumber?: string | null }) => ({
            id: s.id,
            name: s.name,
            rollNumber: s.rollNumber,
          }))
          .sort((a, b) =>
            (a.rollNumber || a.name).localeCompare(b.rollNumber || b.name, undefined, { numeric: true }),
          );
        setStudentsInClass(rows);
      })
      .catch(() => setStudentsInClass([]));
    setStudentId(PLACEHOLDER);
  }, [classId, branchId, ayId]);

  const loadExams = useCallback(async (sid: string) => {
    if (!sid) {
      setExams([]);
      return;
    }
    try {
      const res = await api.getResultExams(sid);
      setExams((res.data || []).map((e: { id: string; name: string }) => ({ id: e.id, name: e.name })));
    } catch {
      setExams([]);
    }
  }, []);

  const handleSessionChange = (value: string) => {
    setSessionId(value);
    setExamId(PLACEHOLDER);
    setStudentId(PLACEHOLDER);
    setBundle(null);
    loadExams(value);
  };

  const handleExamChange = (value: string) => {
    setExamId(value);
    setBundle(null);
  };

  const handleClassChange = (value: string) => {
    setClassId(value);
    setStudentId(PLACEHOLDER);
    setBundle(null);
  };

  const handleStudentChange = (value: string) => {
    setStudentId(value);
    setBundle(null);
  };

  const canGenerate = Boolean(sessionId && examId && classId);

  const generateCards = async () => {
    if (!sessionId) {
      showToast('error', 'Select an exam session');
      return;
    }
    if (!examId) {
      showToast('error', 'Select an exam');
      return;
    }
    if (!classId) {
      showToast('error', 'Select a class');
      return;
    }
    if (!schoolName) {
      showToast('error', 'Branch details not loaded — select a branch and try again');
      return;
    }

    setLoading(true);
    setBundle(null);
    try {
      const examName = exams.find((e) => e.id === examId)?.name || 'Exam';
      const cards = await buildExamReportCards(
        sessionId,
        examId,
        classId,
        studentId || undefined,
        examName,
      );
      if (cards.length === 0) {
        showToast('error', studentId
          ? 'No marks found for this student in the selected exam'
          : 'No students or marks found for this class and exam');
        setLoading(false);
        return;
      }

      const sessionName = sessions.find((s) => s.id === sessionId)?.name || 'Session';
      const cls = sections.find((s) => s.id === classId);
      const classLbl = cls ? classLabel(cls.name, cls.section) : 'Class';
      const selectedStudent = studentId
        ? studentsInClass.find((s) => s.id === studentId)
        : null;
      const displayLabel = selectedStudent
        ? `${selectedStudent.name}${selectedStudent.rollNumber ? ` (${selectedStudent.rollNumber})` : ''} · ${classLbl}`
        : classLbl;

      setBundle({
        schoolName,
        schoolAddress,
        schoolPhone,
        academicYear,
        sessionName,
        examName,
        classLabel: displayLabel,
        generatedAt: new Date().toLocaleString(),
        cards,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to generate report cards';
      showToast('error', msg);
    } finally {
      setLoading(false);
    }
  };

  if (!ayId) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-10">
        <p className="text-sm text-warm-muted">Select an academic year from the sidebar to generate report cards.</p>
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
          <GraduationCap size={24} className="text-amber-400" />
          <div>
            <h1 className="text-xl font-light text-warm-cream">Report Cards</h1>
            <p className="mt-0.5 text-xs text-warm-muted">
              Class bulk or single-student exam report cards
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-warm-card-border bg-warm-card p-5 mb-6">
        <p className="mb-4 text-[10px] uppercase tracking-wide text-warm-muted/50">
          Session, exam &amp; class required · student optional (class bulk if empty)
        </p>

        {metaLoading ? (
          <div className="h-20 animate-pulse rounded-lg bg-[#1a1614]" />
        ) : sessions.length === 0 ? (
          <p className="text-sm text-warm-muted">No exam sessions yet. Create one from the hub.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
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
                onChange={(e) => handleExamChange(e.target.value)}
                className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent"
              >
                <option value="">Select exam…</option>
                {exams.map((e) => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-warm-muted/60 uppercase tracking-wider mb-1.5">Class</label>
              <select
                value={classId}
                onChange={(e) => handleClassChange(e.target.value)}
                className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent"
              >
                <option value="">Select class…</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>{classLabel(s.name, s.section)}</option>
                ))}
              </select>
            </div>

            <div className={!classId ? 'opacity-30 pointer-events-none' : ''}>
              <label className="block text-[10px] text-warm-muted/60 uppercase tracking-wider mb-1.5">Student</label>
              <select
                value={studentId}
                onChange={(e) => handleStudentChange(e.target.value)}
                className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent"
              >
                <option value="">All students (class bulk)</option>
                {studentsInClass.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.rollNumber ? `${s.rollNumber} — ` : ''}{s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={generateCards}
          disabled={loading || !canGenerate}
          className="inline-flex items-center gap-1.5 rounded-lg bg-warm-accent px-6 py-2.5 text-sm font-medium text-[#1a1614] hover:bg-[#b39a76] disabled:opacity-50 transition-colors"
        >
          {loading ? <RefreshCw size={15} className="animate-spin" /> : <FileText size={15} />}
          {loading ? 'Generating…' : studentId ? 'Generate Report Card' : 'Generate Report Cards'}
        </button>
      </div>

      {/* Output */}
      {bundle && (
        <div className="space-y-4">
          <style dangerouslySetInnerHTML={{ __html: REPORT_CARD_PREVIEW_STYLES }} />
          <div className="rounded-xl border border-warm-card-border bg-warm-card/70 px-5 py-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-medium text-warm-cream">
                {bundle.classLabel} · {bundle.examName}
              </h2>
              <p className="text-[10px] text-warm-muted/50 mt-0.5">
                {bundle.generatedAt} · {bundle.cards.length} {bundle.cards.length === 1 ? 'student' : 'students'} · {bundle.sessionName}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => downloadReportCardsCsv(bundle)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-warm-card-border px-3 py-1.5 text-xs text-warm-cream hover:bg-warm-card transition-colors"
              >
                <Download size={13} /> Download CSV
              </button>
              <button
                type="button"
                onClick={() => printReportCards(bundle)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-warm-card-border px-3 py-1.5 text-xs text-warm-cream hover:bg-warm-card transition-colors"
              >
                <Printer size={13} /> Print / Save PDF
              </button>
              <button
                type="button"
                onClick={generateCards}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-warm-card-border px-3 py-1.5 text-xs text-warm-muted hover:text-warm-cream transition-colors"
              >
                <RefreshCw size={13} /> Regenerate
              </button>
            </div>
          </div>

          <div className={`grid grid-cols-1 gap-8 ${bundle.cards.length > 1 ? '' : 'max-w-[220mm]'}`}>
            {bundle.cards.map((card) => (
              <ReportCardPreview key={card.studentId} bundle={bundle} card={card} />
            ))}
          </div>

          {bundle.cards.length === 0 && (
            <p className="py-10 text-center text-sm text-warm-muted">No report cards to display.</p>
          )}
        </div>
      )}
    </main>
  );
}
