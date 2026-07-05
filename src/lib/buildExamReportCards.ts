import { api } from '@/lib/api';
import {
  type ExamReportCard,
  type SubjectMarkRow,
  computeCompetitionRanks,
  lookupGrade,
  marksPassed,
  marksPercentage,
} from '@/lib/reportCardTemplate';

function classLabel(name: string, section?: string | null) {
  return section ? `${name} — ${section}` : name;
}

export async function buildExamReportCards(
  sessionId: string,
  examId: string,
  classId: string,
): Promise<ExamReportCard[]> {
  const structureRes = await api.getResultExamStructure(examId);
  const classBlock = (structureRes.data || []).find(
    (ec: { classId: string; isActive: boolean }) => ec.classId === classId && ec.isActive,
  );
  if (!classBlock) return [];

  type Acc = {
    studentId: string;
    name: string;
    rollNumber: string;
    admissionNumber?: string | null;
    className: string;
    classSection: string | null;
    subjects: SubjectMarkRow[];
  };

  const studentMap = new Map<string, Acc>();

  for (const sub of classBlock.subjects || []) {
    if (!sub.isActive) continue;
    const gridRes = await api.getResultMarksGrid(sub.id);
    const grid = gridRes.data;
    if (!grid?.students) continue;

    const totalMarks = grid.totalMarks ?? 100;
    const passingMarks = grid.passingMarks ?? Math.round(totalMarks * 0.4);
    const subjectName = grid.subject?.name || sub.subject?.name || 'Subject';

    for (const st of grid.students) {
      if (!studentMap.has(st.id)) {
        studentMap.set(st.id, {
          studentId: st.id,
          name: st.name,
          rollNumber: st.rollNumber || '—',
          admissionNumber: st.admissionNumber,
          className: grid.className || classBlock.class?.name || '',
          classSection: grid.classSection ?? classBlock.class?.section ?? null,
          subjects: [],
        });
      }
      const hasEntry = st.marksObtained != null || st.isAbsent;
      const pct = marksPercentage(st.marksObtained, st.isAbsent, totalMarks);
      const grade = lookupGrade(pct);
      const passed = marksPassed(st.marksObtained, st.isAbsent, totalMarks, passingMarks);

      if (hasEntry) {
        studentMap.get(st.id)!.subjects.push({
          subjectName,
          marksObtained: st.marksObtained,
          totalMarks,
          passingMarks,
          isAbsent: st.isAbsent,
          percentage: pct,
          grade,
          passed,
        });
      }
    }
  }

  const cards: ExamReportCard[] = Array.from(studentMap.values()).map((acc) => {
    const withMarks = acc.subjects.filter((s) => s.marksObtained != null || s.isAbsent);
    const overallPercentage = withMarks.length > 0
      ? Math.round((withMarks.reduce((s, r) => s + r.percentage, 0) / withMarks.length) * 10) / 10
      : 0;
    const overallGrade = withMarks.length > 0 ? lookupGrade(overallPercentage) : '—';
    const passed = withMarks.length > 0 && withMarks.every((s) => s.passed);
    return {
      ...acc,
      subjects: acc.subjects.sort((a, b) => a.subjectName.localeCompare(b.subjectName)),
      overallPercentage,
      overallGrade,
      classRank: 0,
      passed,
    };
  });

  cards.sort((a, b) => (a.rollNumber).localeCompare(b.rollNumber, undefined, { numeric: true }));

  const ranked = cards.filter((c) => c.subjects.length > 0);
  const ranks = computeCompetitionRanks(ranked.map((c) => c.overallPercentage));
  ranked.forEach((c, i) => { c.classRank = ranks[i]; });

  return cards;
}

export { classLabel };
