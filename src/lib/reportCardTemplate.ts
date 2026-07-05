import { downloadCsv } from '@/lib/feeAnalytics';

export type SubjectMarkRow = {
  subjectName: string;
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
    border: 2px solid #c8a96e;
    border-radius: 6px;
    overflow: hidden;
    page-break-inside: avoid;
    margin-bottom: 0;
    box-shadow: 0 1px 0 rgba(0,0,0,0.04);
    font-family: 'Segoe UI', Georgia, 'Times New Roman', serif;
    color: #1c1917;
    background: #fff;
  }
  .rc-sheet * { box-sizing: border-box; }

  .rc-header {
    text-align: center;
    padding: 22px 24px 18px;
    background: linear-gradient(180deg, #faf8f5 0%, #f3efe8 100%);
    border-bottom: 3px double #c8a96e;
  }
  .rc-logo {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 52px;
    border-radius: 50%;
    border: 2px solid #c8a96e;
    font-size: 14px;
    font-weight: 700;
    color: #8b6914;
    letter-spacing: 1px;
    margin-bottom: 10px;
    background: #fff;
  }
  .rc-header h1 {
    font-size: 20px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #1a2744;
  }
  .rc-header .sub { font-size: 11px; color: #666; margin-top: 4px; }
  .rc-header .contact { font-size: 10px; color: #888; margin-top: 2px; }

  .rc-title-bar {
    text-align: center;
    padding: 12px 16px;
    background: #1a2744;
    color: #fff;
  }
  .rc-title-bar h2 {
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 3px;
    text-transform: uppercase;
  }
  .rc-title-bar .exam { font-size: 11px; color: #c8a96e; margin-top: 4px; font-weight: 500; }

  .rc-meta {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px 16px;
    padding: 16px 20px;
    background: #fafafa;
    border-bottom: 1px solid #e8e4df;
    font-size: 12px;
  }
  .rc-meta .field .label {
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: #999;
    margin-bottom: 2px;
  }
  .rc-meta .field .value { font-weight: 600; color: #1c1917; }
  .rc-meta .field.span-2 { grid-column: span 2; }

  .rc-body { padding: 16px 20px 20px; }

  table.rc-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 11px;
    margin-bottom: 16px;
  }
  .rc-table thead th {
    background: #c8a96e;
    color: #fff;
    padding: 8px 10px;
    text-align: left;
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
  }
  .rc-table th.num, .rc-table td.num { text-align: right; font-variant-numeric: tabular-nums; }
  .rc-table th.center, .rc-table td.center { text-align: center; }
  .rc-table tbody td {
    padding: 7px 10px;
    border-bottom: 1px solid #eee;
  }
  .rc-table tbody tr:nth-child(even) { background: #fafafa; }
  .rc-table .pass { color: #16a34a; font-weight: 600; }
  .rc-table .fail { color: #dc2626; font-weight: 600; }
  .rc-table .absent { color: #888; font-style: italic; }

  .rc-summary {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    margin-bottom: 18px;
  }
  .rc-summary .box {
    text-align: center;
    padding: 12px 8px;
    border: 1px solid #e8e4df;
    border-radius: 4px;
    background: #faf8f5;
  }
  .rc-summary .box.highlight {
    border-color: #c8a96e;
    background: linear-gradient(180deg, #fffdf9 0%, #f5efe6 100%);
  }
  .rc-summary .box .lbl {
    font-size: 8px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: #999;
    margin-bottom: 4px;
  }
  .rc-summary .box .val {
    font-size: 18px;
    font-weight: 700;
    color: #1a2744;
  }
  .rc-summary .box .val.grade { color: #8b6914; font-size: 22px; }
  .rc-summary .box .val.pass { color: #16a34a; }
  .rc-summary .box .val.fail { color: #dc2626; }

  .rc-footer {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 24px;
    padding-top: 8px;
    border-top: 1px dashed #d4cfc6;
    margin-top: 4px;
  }
  .rc-footer .sig .line {
    border-top: 1px solid #333;
    margin-top: 36px;
    padding-top: 4px;
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #666;
    text-align: center;
  }
  .rc-print-note {
    text-align: center;
    font-size: 9px;
    color: #aaa;
    margin-top: 12px;
  }
`;

/** Scoped styles for in-app preview only — never targets body or * globally */
export const REPORT_CARD_PREVIEW_STYLES = REPORT_CARD_CONTENT_STYLES;

/** Full document styles for print popup only */
export const REPORT_CARD_PRINT_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', Georgia, 'Times New Roman', serif;
    color: #1c1917;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .rc-page { max-width: 780px; margin: 0 auto; padding: 28px 32px 36px; }
  ${REPORT_CARD_CONTENT_STYLES}
  .rc-sheet { margin-bottom: 32px; }
  .rc-sheet:last-child { margin-bottom: 0; }

  @media print {
    body { padding: 0; }
    .rc-page { padding: 12px; max-width: 100%; }
    .rc-sheet { margin-bottom: 0; box-shadow: none; page-break-after: always; }
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

function classLabel(name: string, section: string | null) {
  return section ? `${name} — ${section}` : name;
}

export function renderSingleReportCardHtml(bundle: ReportCardBundle, card: ExamReportCard): string {
  const studentClass = classLabel(card.className, card.classSection);
  const subjectRows = card.subjects.map((s) => {
    const marksDisplay = s.isAbsent
      ? '<span class="absent">Absent</span>'
      : s.marksObtained != null
        ? String(s.marksObtained)
        : '—';
    return `<tr>
      <td>${esc(s.subjectName)}</td>
      <td class="num">${marksDisplay}</td>
      <td class="num">${s.totalMarks}</td>
      <td class="num">${s.passingMarks}</td>
      <td class="num">${s.percentage.toFixed(1)}%</td>
      <td class="center">${esc(s.grade)}</td>
      <td class="center ${s.passed ? 'pass' : 'fail'}">${s.passed ? 'Pass' : 'Fail'}</td>
    </tr>`;
  }).join('');

  return `
    <div class="rc-sheet">
      <div class="rc-header">
        <div class="rc-logo">MCS</div>
        <h1>${esc(bundle.schoolName)}</h1>
        ${bundle.schoolAddress ? `<p class="sub">${esc(bundle.schoolAddress)}</p>` : ''}
        ${bundle.schoolPhone ? `<p class="contact">${esc(bundle.schoolPhone)}</p>` : ''}
      </div>
      <div class="rc-title-bar">
        <h2>Report Card</h2>
        <p class="exam">${esc(bundle.examName)} · ${esc(bundle.sessionName)}</p>
      </div>
      <div class="rc-meta">
        <div class="field"><div class="label">Student Name</div><div class="value">${esc(card.name)}</div></div>
        <div class="field"><div class="label">Roll Number</div><div class="value">${esc(card.rollNumber)}</div></div>
        <div class="field"><div class="label">Class</div><div class="value">${esc(studentClass)}</div></div>
        <div class="field"><div class="label">Academic Year</div><div class="value">${esc(bundle.academicYear || '—')}</div></div>
        ${card.admissionNumber ? `<div class="field span-2"><div class="label">Admission No.</div><div class="value">${esc(card.admissionNumber)}</div></div>` : ''}
      </div>
      <div class="rc-body">
        <table class="rc-table">
          <thead>
            <tr>
              <th>Subject</th>
              <th class="num">Obtained</th>
              <th class="num">Total</th>
              <th class="num">Pass</th>
              <th class="num">%</th>
              <th class="center">Grade</th>
              <th class="center">Result</th>
            </tr>
          </thead>
          <tbody>${subjectRows || '<tr><td colspan="7" style="text-align:center;color:#999;padding:16px">No marks entered</td></tr>'}</tbody>
        </table>
        <div class="rc-summary">
          <div class="box highlight"><div class="lbl">Overall %</div><div class="val">${card.overallPercentage.toFixed(1)}%</div></div>
          <div class="box highlight"><div class="lbl">Grade</div><div class="val grade">${esc(card.overallGrade)}</div></div>
          <div class="box"><div class="lbl">Class Rank</div><div class="val">${card.classRank || '—'}</div></div>
          <div class="box"><div class="lbl">Outcome</div><div class="val ${card.passed ? 'pass' : 'fail'}">${card.passed ? 'Pass' : 'Fail'}</div></div>
        </div>
        <div class="rc-footer">
          <div class="sig"><div class="line">Class Teacher</div></div>
          <div class="sig"><div class="line">Exam Controller</div></div>
          <div class="sig"><div class="line">Principal</div></div>
        </div>
        <p class="rc-print-note">Generated ${esc(bundle.generatedAt)} · ${esc(bundle.examName)}</p>
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
    'Subject', 'Marks Obtained', 'Total Marks', 'Passing Marks',
    'Percentage', 'Grade', 'Subject Result',
    'Overall %', 'Overall Grade', 'Class Rank', 'Overall Result',
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
        s.isAbsent ? 'AB' : (s.marksObtained ?? ''),
        s.totalMarks,
        s.passingMarks,
        s.percentage,
        s.grade,
        s.passed ? 'Pass' : 'Fail',
        card.overallPercentage,
        card.overallGrade,
        card.classRank,
        card.passed ? 'Pass' : 'Fail',
      ]);
    }
    if (card.subjects.length === 0) {
      rows.push([
        card.rollNumber, card.name, bundle.classLabel, bundle.sessionName, bundle.examName,
        '', '', '', '', '', '', '',
        card.overallPercentage, card.overallGrade, card.classRank,
        card.passed ? 'Pass' : 'Fail',
      ]);
    }
  }
  const filename = `${bundle.classLabel}_${bundle.examName}_report_cards`
    .replace(/[^a-z0-9]/gi, '_') + '.csv';
  downloadCsv(filename, headers, rows);
}
