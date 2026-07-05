'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ChevronDown, ChevronRight, FileText } from 'lucide-react';
import { MiniProgressBar } from './collapsible-section';

export interface ExamListItem {
  id: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string | null;
  weightOverride: number | null;
  examType: { id: string; name: string; defaultWeight: number | null };
  _count: { examClasses: number };
}

interface ClassProgress {
  classId: string;
  className: string;
  section: string | null;
  total: number;
  filled: number;
  percent: number;
  isActive: boolean;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
}

function classLabel(c: { name: string; section: string | null }) {
  return c.section ? `${c.name} — ${c.section}` : c.name;
}

interface ExamListSectionProps {
  sessionId: string;
  exams: ExamListItem[];
  progressByExamId: Record<string, { total: number; filled: number; percent: number }>;
}

export default function ExamListSection({
  sessionId,
  exams,
  progressByExamId,
}: ExamListSectionProps) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [classExpandedId, setClassExpandedId] = useState<string | null>(null);
  const [classProgress, setClassProgress] = useState<Record<string, ClassProgress[]>>({});
  const [loadingClasses, setLoadingClasses] = useState<string | null>(null);

  const toggleExam = (examId: string) => {
    setExpandedId((prev) => (prev === examId ? null : examId));
    if (classExpandedId === examId) setClassExpandedId(null);
  };

  const toggleClassProgress = async (examId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (classExpandedId === examId) {
      setClassExpandedId(null);
      return;
    }
    setClassExpandedId(examId);
    if (classProgress[examId]) return;

    setLoadingClasses(examId);
    try {
      const res = await api.getResultExamStructure(examId);
      const rows: ClassProgress[] = (res.data || []).map((ec: any) => {
        const activeSubjects = (ec.subjects || []).filter((s: any) => s.isActive);
        const total = activeSubjects.length;
        const filled = activeSubjects.filter((s: any) => s.hasMarks).length;
        return {
          classId: ec.classId,
          className: ec.class?.name || 'Class',
          section: ec.class?.section ?? null,
          total,
          filled,
          percent: total > 0 ? Math.round((filled / total) * 100) : 0,
          isActive: ec.isActive,
        };
      });
      setClassProgress((prev) => ({ ...prev, [examId]: rows }));
    } catch {
      setClassProgress((prev) => ({ ...prev, [examId]: [] }));
    } finally {
      setLoadingClasses(null);
    }
  };

  if (exams.length === 0) {
    return (
      <p className="py-2 text-center text-xs text-warm-muted">
        No exams yet. Use Add Exam above to create one.
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      {exams.map((exam) => {
        const prog = progressByExamId[exam.id] ?? { total: 0, filled: 0, percent: 0 };
        const isOpen = expandedId === exam.id;
        const classesOpen = classExpandedId === exam.id;
        const classes = classProgress[exam.id];
        const effectiveWeight = exam.weightOverride ?? exam.examType?.defaultWeight;
        const dateStr = exam.endDate
          ? `${fmtDate(exam.startDate)} — ${fmtDate(exam.endDate)}`
          : fmtDate(exam.startDate);

        return (
          <div
            key={exam.id}
            className="rounded-lg border border-warm-card-border/50 bg-[#1a1614]/30 overflow-hidden"
          >
            <div className="flex items-center gap-1 px-2 py-2">
              <button
                type="button"
                onClick={() => toggleExam(exam.id)}
                className="shrink-0 p-1 text-warm-muted hover:text-warm-cream"
                aria-label={isOpen ? 'Collapse exam' : 'Expand exam'}
              >
                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              <button
                type="button"
                onClick={() => router.push(`/admin/result/sessions/${sessionId}/exams/${exam.id}`)}
                className="min-w-0 flex-1 text-left"
              >
                <div className="flex items-center gap-2">
                  <FileText size={13} className="shrink-0 text-warm-accent" />
                  <span className="truncate text-sm text-warm-cream">{exam.name}</span>
                  <span className={`shrink-0 rounded px-1 py-0.5 text-[9px] font-medium ${
                    exam.status === 'ACTIVE'
                      ? 'bg-green-900/30 text-green-400'
                      : 'bg-warm-card-border/40 text-warm-muted'
                  }`}>
                    {exam.status}
                  </span>
                </div>
                {!isOpen && (
                  <p className="mt-0.5 truncate pl-5 text-[10px] text-warm-muted">
                    {prog.percent}% marks · {exam.examType?.name} · {dateStr}
                  </p>
                )}
              </button>
            </div>

            {isOpen && (
              <div className="space-y-3 border-t border-warm-card-border/30 px-3 pb-3 pt-2">
                <p className="text-[11px] text-warm-muted">
                  {exam.examType?.name}
                  {effectiveWeight != null && ` · ${effectiveWeight}%`}
                  {' · '}{dateStr}
                  {exam._count.examClasses > 0 && ` · ${exam._count.examClasses} classes`}
                </p>
                <MiniProgressBar
                  percent={prog.percent}
                  label={`Marks ${prog.filled}/${prog.total} slots`}
                />
                <button
                  type="button"
                  onClick={(e) => toggleClassProgress(exam.id, e)}
                  className="flex w-full items-center gap-1 text-[10px] text-warm-muted hover:text-warm-cream"
                >
                  {classesOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  Per-class breakdown
                </button>
                {classesOpen && (
                  <div className="space-y-2 pl-1">
                    {loadingClasses === exam.id ? (
                      <div className="h-6 animate-pulse rounded bg-warm-card" />
                    ) : !classes?.length ? (
                      <p className="text-[10px] text-warm-muted">
                        Generate structure on the exam page first.
                      </p>
                    ) : (
                      classes.map((c) => (
                        <div key={c.classId} className={!c.isActive ? 'opacity-45' : ''}>
                          <MiniProgressBar
                            percent={c.percent}
                            label={classLabel(c)}
                          />
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
