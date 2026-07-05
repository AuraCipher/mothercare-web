import { downloadCsv } from '@/lib/feeAnalytics';

export type SubjectMarkRow = {
  subjectName: string;
  testName: string;
  marksObtained: number | null;
  totalMarks: number;
  passingMarks: number;
  isAbsent: boolean;
  percentage: number;
  grade: string;
  passed: boolean;
};

export type ExamReportCard = {
  studentId: string;
  name: string;
  rollNumber: string;
  admissionNumber?: string | null;
  className: string;
  classSection: string | null;
  subjects: SubjectMarkRow[];
  totalMarksSum: number;
  marksObtainedSum: number;
  overallPercentage: number;
  overallGrade: string;
  classRank: number;
  passed: boolean;
};

export type ReportCardBundle = {
  schoolName: string;
  schoolAddress?: string;
  schoolPhone?: string;
  academicYear?: string;
  sessionName: string;
  examName: string;
  classLabel: string;
  generatedAt: string;
  cards: ExamReportCard[];
};

const GRADE_BANDS = [
  { min: 90, max: 100, label: 'A+' },
  { min: 80, max: 89.99, label: 'A' },
  { min: 70, max: 79.99, label: 'B+' },
  { min: 60, max: 69.99, label: 'B' },
  { min: 50, max: 59.99, label: 'C+' },
  { min: 40, max: 49.99, label: 'C' },
  { min: 30, max: 39.99, label: 'D' },
  { min: 20, max: 29.99, label: 'E' },
  { min: 0, max: 19.99, label: 'F' },
];

export function lookupGrade(percentage: number): string {
  for (const band of GRADE_BANDS) {
    if (percentage >= band.min && percentage <= band.max) return band.label;
  }
  return percentage >= 40 ? 'C' : 'F';
}

export function marksPercentage(
  obtained: number | null,
  isAbsent: boolean,
  totalMarks: number,
): number {
  if (totalMarks <= 0) return 0;
  const score = isAbsent ? 0 : (obtained ?? 0);
  return Math.round((score / totalMarks) * 1000) / 10;
}

export function marksPassed(
  obtained: number | null,
  isAbsent: boolean,
  totalMarks: number,
  passingMarks: number,
): boolean {
  const passing = passingMarks > 0 ? passingMarks : Math.round(totalMarks * 0.4);
  const score = isAbsent ? 0 : (obtained ?? 0);
  return score >= passing;
}

export function computeCompetitionRanks(percentages: number[]): number[] {
  const indexed = percentages.map((p, i) => ({ p, i }));
  indexed.sort((a, b) => b.p - a.p);
  const ranks: number[] = new Array(percentages.length);
  let currentRank = 1;
  let skipCount = 0;
  for (let i = 0; i < indexed.length; i++) {
    if (i > 0 && indexed[i].p < indexed[i - 1].p) {
      currentRank += skipCount + 1;
      skipCount = 0;
    } else if (i > 0 && indexed[i].p === indexed[i - 1].p) {
      skipCount++;
    }
    ranks[indexed[i].i] = currentRank;
  }
  return ranks;
}

const REPORT_CARD_CONTENT_STYLES = `
  .rc-sheet {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 12px;
    color: #000;
    background: #fff;
    width: 210mm;
    padding: 12mm 14mm 14mm;
    page-break-inside: avoid;
    margin: 0 auto;
  }
  .rc-sheet * { box-sizing: border-box; }

  .rc-header {
    text-align: center;
    margin-bottom: 14px;
    line-height: 1.35;
  }
  .rc-school-name {
    font-size: 16px;
    font-weight: 700;
    text-transform: uppercase;
    text-decoration: underline;
    letter-spacing: 0.4px;
    margin: 0 0 6px;
  }
  .rc-school-address {
    font-size: 12px;
    font-weight: 400;
    margin: 0 0 8px;
    min-height: 1.35em;
  }
  .rc-exam-title {
    font-size: 13px;
    font-weight: 700;
    margin: 0;
  }

  .rc-info-row {
    display: flex;
    flex-wrap: wrap;
    gap: 20px 40px;
    margin-bottom: 12px;
    align-items: center;
  }
  .rc-info-field {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 400;
  }
  .rc-label {
    font-weight: 700;
  }
  .rc-box {
    border: 2px solid #000;
    min-width: 200px;
    min-height: 24px;
    padding: 3px 10px;
    font-weight: 400;
    display: inline-flex;
    align-items: center;
  }
  .rc-box.sm { min-width: 80px; text-align: center; justify-content: center; }
  .rc-box.md { min-width: 120px; text-align: center; justify-content: center; }
  .rc-box.lg { min-width: 100%; min-height: 48px; align-items: flex-start; padding-top: 6px; }
  .rc-box.tall { min-height: 36px; }

  table.rc-table {
    width: 100%;
    border-collapse: collapse;
    margin: 0 0 12px;
    font-size: 11px;
    border: 2px solid #000;
  }
  .rc-table th,
  .rc-table td {
    border: 2px solid #000;
    padding: 4px 6px;
    text-align: center;
    vertical-align: middle;
  }
  .rc-table th {
    font-weight: 700;
    background: #fff;
  }
  .rc-table td.subject { text-align: left; font-weight: 700; }
  .rc-table td.num { font-variant-numeric: tabular-nums; }

  .rc-summary-block { margin: 10px 0; }
  .rc-summary-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 24px;
    margin-bottom: 8px;
    font-weight: 400;
  }

  .rc-meta-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 28px;
    margin: 10px 0;
    font-weight: 400;
  }
  .rc-meta-item {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .rc-comments { margin: 12px 0; }
  .rc-comments-label { font-weight: 700; margin-bottom: 4px; }

  .rc-signatures {
    display: flex;
    gap: 16px;
    margin-top: 16px;
    align-items: stretch;
  }
  .rc-sig-labels {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    font-weight: 700;
    font-size: 11px;
    padding: 4px 0;
    min-width: 150px;
  }
  .rc-sig-labels > div { min-height: 36px; display: flex; align-items: center; }
  .rc-sig-boxes {
    flex: 1;
    border: 2px solid #000;
    display: flex;
    flex-direction: column;
  }
  .rc-sig-box {
    flex: 1;
    min-height: 36px;
    border-bottom: 2px solid #000;
  }
  .rc-sig-box:last-child { border-bottom: none; }
`;

/** Scoped styles for in-app preview only — never targets body or * globally */
export const REPORT_CARD_PREVIEW_STYLES = REPORT_CARD_CONTENT_STYLES;

/** Full document styles for print popup only */
export const REPORT_CARD_PRINT_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page {
    size: A4 portrait;
    margin: 0;
  }
  html, body {
    width: 210mm;
    font-family: Arial, Helvetica, sans-serif;
    color: #000;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .rc-page { width: 210mm; margin: 0 auto; padding: 0; }
  ${REPORT_CARD_CONTENT_STYLES}
  .rc-sheet {
    margin: 0;
    box-shadow: none;
  }
  .rc-sheet + .rc-sheet { margin-top: 0; }

  @media print {
    html, body { width: auto; }
    .rc-page { width: auto; padding: 0; }
    .rc-sheet {
      width: 210mm;
      margin: 0;
      page-break-after: always;
      page-break-inside: avoid;
    }
    .rc-sheet:last-child { page-break-after: auto; }
  }
`;

function esc(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function classDisplay(name: string, section: string | null) {
  const base = section ? `${name} — ${section}` : name;
  return /^class\b/i.test(base.trim()) ? base : `Class ${base}`;
}

function examResultTitle(bundle: ReportCardBundle): string {
  const sessionLabel = bundle.academicYear || bundle.sessionName;
  return `${bundle.examName} Examination Result (Session-${sessionLabel})`;
}

function marksCell(value: number | null, isAbsent: boolean): string {
  if (isAbsent) return '';
  if (value == null) return '';
  return String(value);
}

export function renderSingleReportCardHtml(bundle: ReportCardBundle, card: ExamReportCard): string {
  const studentClass = classDisplay(card.className, card.classSection);
  const pctDisplay = card.totalMarksSum > 0
    ? Math.round(card.overallPercentage)
    : '';

  const subjectRows = card.subjects.map((s) => {
    const obtained = marksCell(s.marksObtained, s.isAbsent);
    return `<tr>
      <td class="subject">${esc(s.subjectName)}</td>
      <td class="num">${s.totalMarks}</td>
      <td class="num">${obtained}</td>
      <td>${esc(s.grade)}</td>
    </tr>`;
  }).join('');

  const emptyRow = '<tr><td colspan="4" style="padding:12px;color:#666">No marks entered</td></tr>';

  return `
    <div class="rc-sheet">
      <header class="rc-header">
        <div class="rc-school-name">${esc(bundle.schoolName)}</div>
        <div class="rc-school-address">${bundle.schoolAddress ? esc(bundle.schoolAddress) : '&nbsp;'}</div>
        <div class="rc-exam-title">${esc(examResultTitle(bundle))}</div>
      </header>

      <div class="rc-info-row">
        <div class="rc-info-field">
          <span class="rc-label">Name:</span>
          <span class="rc-box">${esc(card.name)}</span>
        </div>
        <div class="rc-info-field">
          <span class="rc-label">Class:</span>
          <span class="rc-box">${esc(studentClass)}</span>
        </div>
      </div>

      <table class="rc-table">
        <thead>
          <tr>
            <th>Subjects</th>
            <th>Total Marks</th>
            <th>Marks obtained</th>
            <th>Grades</th>
          </tr>
        </thead>
        <tbody>${subjectRows || emptyRow}</tbody>
      </table>

      <div class="rc-summary-block">
        <div class="rc-summary-row">
          <span class="rc-label">Total Marks:</span>
          <span class="rc-box sm">${card.totalMarksSum || ''}</span>
          <span class="rc-label">Marks Obtained:</span>
          <span class="rc-box sm">${card.marksObtainedSum || ''}</span>
        </div>
        <div class="rc-summary-row">
          <span class="rc-label">Percentage%:</span>
          <span class="rc-box sm">${pctDisplay}</span>
          <span class="rc-label">Position:</span>
          <span class="rc-box sm">${card.classRank || ''}</span>
          <span class="rc-label">Grades:</span>
          <span class="rc-box sm">${esc(card.overallGrade)}</span>
        </div>
      </div>

      <div class="rc-meta-row">
        <div class="rc-meta-item">
          <span class="rc-label">Behaviour:</span>
          <span class="rc-box md"></span>
        </div>
        <div class="rc-meta-item">
          <span class="rc-label">Regularity:</span>
          <span class="rc-box md"></span>
        </div>
        <div class="rc-meta-item">
          <span class="rc-label">Date:</span>
          <span class="rc-box md"></span>
        </div>
      </div>

      <div class="rc-comments">
        <div class="rc-comments-label">Comments:</div>
        <div class="rc-box lg"></div>
      </div>

      <div class="rc-signatures">
        <div class="rc-sig-labels">
          <div>Principal Signature:</div>
          <div>Class Teacher Signature:</div>
          <div>Parents Signature:</div>
        </div>
        <div class="rc-sig-boxes">
          <div class="rc-sig-box"></div>
          <div class="rc-sig-box"></div>
          <div class="rc-sig-box"></div>
        </div>
      </div>
    </div>`;
}

export function renderReportCardsPrintDocument(bundle: ReportCardBundle): string {
  const cards = bundle.cards.map((c) => renderSingleReportCardHtml(bundle, c)).join('');
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${esc(bundle.classLabel)} — ${esc(bundle.examName)} Report Cards</title>
<style>${REPORT_CARD_PRINT_STYLES}</style></head>
<body><div class="rc-page">${cards}</div></body></html>`;
}

export function printReportCards(bundle: ReportCardBundle) {
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(renderReportCardsPrintDocument(bundle));
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 600);
}

export function downloadReportCardsCsv(bundle: ReportCardBundle) {
  const headers = [
    'Roll No', 'Student Name', 'Class', 'Session', 'Exam',
    'Subject', 'Test', 'Marks Obtained', 'Total Marks', 'Passing Marks',
    'Percentage', 'Grade', 'Subject Result',
    'Total Marks (Sum)', 'Marks Obtained (Sum)', 'Overall %', 'Overall Grade',
    'Position', 'Overall Result',
  ];
  const rows: (string | number)[][] = [];
  for (const card of bundle.cards) {
    for (const s of card.subjects) {
      rows.push([
        card.rollNumber,
        card.name,
        bundle.classLabel,
        bundle.sessionName,
        bundle.examName,
        s.subjectName,
        s.testName,
        s.isAbsent ? 'AB' : (s.marksObtained ?? ''),
        s.totalMarks,
        s.passingMarks,
        s.percentage,
        s.grade,
        s.passed ? 'Pass' : 'Fail',
        card.totalMarksSum,
        card.marksObtainedSum,
        card.overallPercentage,
        card.overallGrade,
        card.classRank,
        card.passed ? 'Pass' : 'Fail',
      ]);
    }
    if (card.subjects.length === 0) {
      rows.push([
        card.rollNumber, card.name, bundle.classLabel, bundle.sessionName, bundle.examName,
        '', '', '', '', '', '', '', '',
        card.totalMarksSum, card.marksObtainedSum,
        card.overallPercentage, card.overallGrade, card.classRank,
        card.passed ? 'Pass' : 'Fail',
      ]);
    }
  }
  const filename = `${bundle.classLabel}_${bundle.examName}_report_cards`
    .replace(/[^a-z0-9]/gi, '_') + '.csv';
  downloadCsv(filename, headers, rows);
}
