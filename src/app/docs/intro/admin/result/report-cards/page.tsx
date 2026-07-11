import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import {
  DocCallout,
  DocSteps,
  DocStep,
  DocTable,
  DocSection,
  DocFaq,
} from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function AdminResultReportCardsPage() {
  return (
    <DocsShell
      title="Report Cards"
      subtitle="Generate and print class bulk or single-student exam report cards from marks data."
      nav={introNav}
      variant="intro"
    >
      <DocSection title="Overview">
        <p>
          <strong>Report Cards</strong> at <code>/admin/result/report-cards</code> builds printable exam report
          cards for one student or an entire class. Cards are assembled client-side from marks grids and branch
          details — not from computed/published report card database records (see{' '}
          <Link href="/docs/intro/admin/result/compute">Compute</Link> for that workflow).
        </p>
        <p>
          Subtitle: <em>Class bulk or single-student exam report cards</em>. Back link:{' '}
          <strong>Result &amp; Grade</strong>.
        </p>
      </DocSection>

      <DocSection title="Before you start">
        <ul>
          <li><strong>Branch + academic year</strong> selected.</li>
          <li><strong>Exam session and exam</strong> with marks entered.</li>
          <li><strong>Class</strong> with students enrolled.</li>
          <li>Branch details loaded (school name, address, phone) for card header.</li>
        </ul>
      </DocSection>

      <DocSection title="Filter panel">
        <p>Hint: <em>Session, exam &amp; class required · student optional (class bulk if empty)</em></p>
        <DocTable
          headers={['Filter', 'Label', 'Options']}
          rows={[
            ['Exam Session', 'Exam Session', 'Select session…'],
            ['Exam', 'Exam', 'Select exam… (disabled until session chosen)'],
            ['Class', 'Class', 'Select class…'],
            ['Student', 'Student', 'All students (class bulk) OR roll — name'],
          ]}
        />
      </DocSection>

      <DocSection title="Action buttons">
        <DocTable
          headers={['Button', 'When', 'Effect']}
          rows={[
            ['Generate Report Card', 'Single student selected', 'Builds preview for one student'],
            ['Generate Report Cards', 'No student (bulk)', 'Builds preview for entire class'],
            ['Download CSV', 'After generate', 'downloadReportCardsCsv(bundle)'],
            ['Print / Save PDF', 'After generate', 'printReportCards(bundle) — browser print'],
            ['Regenerate', 'After generate', 'Re-runs generation with same filters'],
          ]}
        />
      </DocSection>

      <DocSection title="Step-by-step: class bulk cards">
        <DocSteps>
          <DocStep title="Open Report Cards">
            From Result hub card or sidebar.
          </DocStep>
          <DocStep title="Select session, exam, class">
            All three required. Leave Student as <em>All students (class bulk)</em>.
          </DocStep>
          <DocStep title="Generate Report Cards">
            Wait for build — uses getResultMarksGrid + branch details.
          </DocStep>
          <DocStep title="Review output header">
            Shows class label · exam name, generated timestamp, student count, session name.
          </DocStep>
          <DocStep title="Print or CSV">
            <strong>Print / Save PDF</strong> for parent distribution. <strong>Download CSV</strong> for records.
          </DocStep>
        </DocSteps>
      </DocSection>

      <DocSection title="Step-by-step: single student">
        <DocSteps>
          <DocStep title="Select student from dropdown">
            Format: roll — name.
          </DocStep>
          <DocStep title="Generate Report Card">
            Single-card preview. Same export buttons available.
          </DocStep>
        </DocSteps>
      </DocSection>

      <DocSection title="Validation toasts">
        <DocTable
          headers={['Condition', 'Message']}
          rows={[
            ['No session', 'Select an exam session'],
            ['No exam', 'Select an exam'],
            ['No class', 'Select a class'],
            ['Branch missing', 'Branch details not loaded — select a branch and try again'],
            ['No student marks', 'No marks found for this student in the selected exam'],
            ['No class marks', 'No students or marks found for this class and exam'],
          ]}
        />
      </DocSection>

      <DocSection title="Output header format">
        <ul>
          <li>Title: classLabel · examName</li>
          <li>Meta: generatedAt · N student(s) · sessionName</li>
        </ul>
      </DocSection>

      <DocSection title="Permission matrix">
        <DocTable
          headers={['Action', 'Permission']}
          rows={[
            ['View filters', 'RESULT → Read'],
            ['Generate / print / CSV', 'RESULT → Read (no data mutation)'],
          ]}
        />
      </DocSection>

      <DocSection title="Archived academic year">
        <p>
          No explicit archived guard on this page. Generation is read-only — works on archived year marks for
          reprinting historical cards.
        </p>
      </DocSection>

      <DocSection title="What happens when">
        <DocTable
          headers={['Event', 'Effect']}
          rows={[
            ['Session select', 'GET exams for sessionId — populates exam dropdown'],
            ['Class select', 'GET students groupId limit 500 — populates student dropdown'],
            ['Generate', 'GET marks grid + GET branch + client buildExamReportCards assembly'],
            ['Print', 'Opens formatted print layout in new window'],
            ['CSV', 'Client-side export from generated bundle'],
          ]}
        />
      </DocSection>

      <DocCallout variant="info" title="vs Compute report cards">
        This page prints directly from <strong>raw marks</strong>. The Compute workflow (ResultsSection API)
        creates <strong>published graded report card records</strong> with ranks and overall grades in the
        database. Use both when you need archival graded records vs quick printable sheets.
      </DocCallout>

      <DocSection title="Report card content (generated)">
        <p>Each card typically includes:</p>
        <ul>
          <li>School name, address, phone from branch details</li>
          <li>Student name, roll, class, academic year name</li>
          <li>Exam name and session name</li>
          <li>Per-subject marks, totals, pass/fail indicators</li>
          <li>Generated timestamp in output header meta</li>
        </ul>
      </DocSection>

      <DocSection title="Bulk vs single workflow">
        <DocTable
          headers={['Mode', 'Student filter', 'Use case']}
          rows={[
            ['Class bulk', 'All students (class bulk)', 'Parent distribution day — print entire class'],
            ['Single', 'Specific roll — name', 'Reprint one lost card or transfer student'],
          ]}
        />
      </DocSection>

      <DocSection title="Data sources">
        <DocTable
          headers={['API', 'Purpose']}
          rows={[
            ['getExamSessions', 'Session dropdown'],
            ['getResultExams', 'Exam dropdown'],
            ['getSections', 'Class dropdown'],
            ['getStudents', 'Student dropdown (limit 500)'],
            ['getBranch', 'School header on card'],
            ['getResultMarksGrid', 'Marks data for card body'],
            ['buildExamReportCards', 'Client-side card assembly'],
          ]}
        />
      </DocSection>

      <DocSection title="Troubleshooting">
        <DocFaq
          items={[
            {
              q: 'Generate button does nothing',
              a: 'Complete session, exam, and class selections. Check toast validation messages.',
            },
            {
              q: 'Blank card header',
              a: 'Branch details failed to load. Re-select branch in sidebar and refresh.',
            },
            {
              q: 'Student missing from dropdown',
              a: 'Student not in selected class or not enrolled in active AY.',
            },
            {
              q: '/admin/result/compute redirects here',
              a: 'Expected — compute page redirects to report-cards. See Compute doc for API workflow.',
            },
            {
              q: 'Marks show AB (F)',
              a: 'Student marked absent for subject in marks entry — expected in marks sheet exports.',
            },
            {
              q: 'CSV vs Print',
              a: 'CSV for data analysis; Print/PDF for parent-facing layout.',
            },
            {
              q: 'Bulk print slow for large class',
              a: 'Browser may lag above 40 students — print in two batches by splitting student dropdown runs.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Regenerate report cards">
        <p>
          After editing marks on exam page, return here and click <strong>Regenerate</strong> — cards rebuild from
          latest marks grid without re-selecting filters.
        </p>
      </DocSection>

      <DocSection title="Quick reference">
        <p>Route: <code>/admin/result/report-cards</code> · Builds from raw marks · Optional student for single-card reprint.</p>
        <p>Distinct from compute-published report card records in the database.</p>
        <p>Branch details supply school name and address on each printed card.</p>
      </DocSection>

      <DocSection title="Related guides">
        <ul>
          <li><Link href="/docs/intro/admin/result/marks">Marks Entry</Link></li>
          <li><Link href="/docs/intro/admin/result/compute">Compute</Link></li>
          <li><Link href="/docs/intro/admin/result/analytics">Analytics</Link></li>
        </ul>
      </DocSection>
    </DocsShell>
  );
}
