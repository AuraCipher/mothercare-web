export type AnalyticsData = {
  filters: { sessionId: string | null; examId: string | null; classId: string | null; subjectId: string | null };
  summary: {
    marksTotal: number;
    marksFilled: number;
    marksPercent: number;
    resultCount: number;
    reportCardCount: number;
    passed: number;
    failed: number;
    passFailTotal: number;
    passRate: number;
    avgPercentage: number | null;
    passingMinPercent: number;
  };
  passFail: { passed: number; failed: number; pending: number };
  gradeBreakdown: { grade: string; count: number }[];
  subjectAvgs: { id: string; label: string; avg: number; passRate: number; count: number }[];
  sessionTrend: { id: string; label: string; marksPercent: number; passRate: number; avgPercent: number; passed: number; failed: number; total: number }[];
  examTrend: { id: string; label: string; marksPercent: number; passRate: number; avgPercent: number; passed: number; failed: number; total: number }[];
  classTrend: { id: string; label: string; marksPercent: number; passRate: number; avgPercent: number; passed: number; failed: number; total: number }[];
};

export type Section = { id: string; name: string; section: string | null };
export type Subject = { id: string; name: string; code?: string | null };
