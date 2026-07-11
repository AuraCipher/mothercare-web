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

export default function AdminAttendanceReportsPage() {
  return (
    <DocsShell
      title="Attendance Reports"
      subtitle="Generate student and teacher attendance reports with CSV and print export."
      nav={introNav}
      variant="intro"
    >
      <DocSection title="Overview">
        <p>
          <strong>Attendance Reports</strong> at <code>/admin/attendance/reports</code> builds tabular reports
          for students or teachers. Choose period, class, status filter, and report type, then generate,
          export CSV, or print. Aggregation runs client-side — no dedicated server report endpoint.
        </p>
        <p>Page title: <strong>Attendance Reports</strong>.</p>
      </DocSection>

      <DocSection title="Before you start">
        <ul>
          <li><strong>Branch + academic year</strong> selected.</li>
          <li><strong>Attendance marked</strong> for the report date range.</li>
          <li><strong>ATTENDANCE → Read</strong> permission.</li>
        </ul>
      </DocSection>

      <DocSection title="Filter panel">
        <DocTable
          headers={['Field', 'Control', 'Options / notes']}
          rows={[
            ['Report For', 'Toggle', 'Students | Teachers (Teachers disabled when Report Type = Class Summary)'],
            ['Class', 'Select', 'All Students | N/A for teachers | section list (disabled for teachers or class-summary)'],
            ['Period', 'Toggle', 'Daily | Monthly | Full AY | Custom (Daily disabled for Absentee List & Class Summary)'],
            ['Filter by Status', 'Buttons', 'All, Present, Absent, Late, Leave, Half-Day, Function (disabled for Absentee List)'],
            ['Date', 'date input', 'When Period = Daily'],
            ['Month', 'Select', 'Jan 2026 … Dec 2026 *(year from current date)*'],
            ['From / To', 'date inputs', 'When Period = Custom'],
            ['Report Type', 'Toggle', 'Standard | Absentee List | Class Summary'],
            ['Below', 'number input', 'Absentee threshold %, default 75, min 0 max 100'],
          ]}
        />
        <p>Primary action: <strong>Generate Report</strong> / <strong>Generating…</strong></p>
      </DocSection>

      <DocSection title="Report types">
        <DocTable
          headers={['Type', 'Behavior']}
          rows={[
            ['Standard', 'Per-row P/A/L counts + %; present includes holiday'],
            ['Absentee List', 'Rows with % below threshold; sorted ascending'],
            ['Class Summary', 'Aggregates by class — students only, all-classes, multi-day period required'],
          ]}
        />
      </DocSection>

      <DocSection title="Period date ranges">
        <DocTable
          headers={['Period', 'Range']}
          rows={[
            ['Daily', 'Single reportDate'],
            ['Monthly', '1st–last day of selected month'],
            ['Full AY', 'Hardcoded 2025-08-01 → 2026-06-30'],
            ['Custom', 'fromDate → toDate (toast Select date range if empty)'],
          ]}
        />
      </DocSection>

      <DocSection title="Output actions">
        <DocTable
          headers={['Button', 'Effect']}
          rows={[
            ['CSV', 'Download spreadsheet'],
            ['Download / Print', 'Open print-ready HTML → browser print/PDF'],
            ['Regenerate', 'Re-run with same filters'],
          ]}
        />
      </DocSection>

      <DocSection title="Generated title format">
        <p>Examples:</p>
        <ul>
          <li><em>All Students · Absentee List · Jan 2026</em></li>
          <li><em>Grade 5 — A · Class Summary · Full Academic Year</em></li>
          <li><em>All Teachers · Monthly · Mar 2026</em></li>
        </ul>
      </DocSection>

      <DocSection title="Dynamic table columns">
        <DocTable
          headers={['Mode', 'Columns']}
          rows={[
            ['Status + single day', 'Roll (students), Class (if all), Name'],
            ['Status + multi-day', 'Roll, Class?, Name, {Status label}, %'],
            ['Standard + single day', 'Roll, Class?, Name, Status'],
            ['Class summary', 'Class, Students, P, A, L, %'],
            ['Standard multi-day', 'Roll, Class?, Name, P, A, L, %'],
          ]}
        />
        <p>Unmarked shown as <strong>— Not Marked</strong>.</p>
      </DocSection>

      <DocSection title="Summary bar labels">
        <ul>
          <li>Status filter: count, status label, percentage of all, and listed student/teacher count</li>
          <li>Single day: Present, Absent, Late, Leave counts and total students/teachers</li>
          <li>Multi-day: P, A, L, Lv counts and overall percentage</li>
        </ul>
      </DocSection>

      <DocSection title="Step-by-step: monthly absentee list">
        <DocSteps>
          <DocStep title="Set Report For: Students">
            Choose target population.
          </DocStep>
          <DocStep title="Period: Monthly">
            Select month from dropdown.
          </DocStep>
          <DocStep title="Report Type: Absentee List">
            Set Below threshold e.g. 75%.
          </DocStep>
          <DocStep title="Generate Report">
            Review table sorted by lowest attendance first.
          </DocStep>
          <DocStep title="Export">
            <strong>CSV</strong> for counselor follow-up or <strong>Download / Print</strong> for meeting.
          </DocStep>
        </DocSteps>
      </DocSection>

      <DocSection title="Step-by-step: class summary">
        <DocSteps>
          <DocStep title="Report Type: Class Summary">
            Class dropdown disables — all sections included.
          </DocStep>
          <DocStep title="Period: Full AY or Monthly">
            Daily period disabled for this type.
          </DocStep>
          <DocStep title="Generate">
            Table shows Class, Students, P, A, L, % per section.
          </DocStep>
        </DocSteps>
      </DocSection>

      <DocSection title="Permission matrix">
        <DocTable
          headers={['Action', 'Permission']}
          rows={[
            ['Generate / export reports', 'ATTENDANCE → Read'],
          ]}
        />
      </DocSection>

      <DocSection title="Archived academic year">
        <p>Reports work on archived year attendance data — read-only. Switch sidebar AY to export historical term reports.</p>
      </DocSection>

      <DocSection title="What happens when">
        <DocTable
          headers={['Event', 'Effect']}
          rows={[
            ['Generate', 'GET /admin/attendance or /admin/attendance/teachers with from&to&groupId'],
            ['Aggregation', 'Client-side — counts P/A/L per student/teacher/class'],
            ['CSV', 'Client download — no extra API'],
            ['Print', 'New window HTML — browser print dialog'],
          ]}
        />
      </DocSection>

      <DocCallout variant="warn" title="Hardcoded Full AY range">
        Full AY uses fixed Aug 2025 – Jun 2026, not your AY calendar from settings. Verify dates match your
        academic calendar before board submissions.
      </DocCallout>

      <DocSection title="Troubleshooting">
        <DocFaq
          items={[
            {
              q: 'Daily period disabled',
              a: 'Absentee List and Class Summary require multi-day periods. Use Monthly or Full AY.',
            },
            {
              q: 'Class Summary empty',
              a: 'Need multi-day period and student mode with All Students.',
            },
            {
              q: 'Month picker shows wrong year',
              a: 'Labels use current calendar year (Jan 2026…Dec 2026) — known limitation.',
            },
            {
              q: 'All rows — Not Marked',
              a: 'No attendance saved for range. Mark attendance first on Students/Teachers page.',
            },
            {
              q: 'Present includes holiday in %',
              a: 'Standard and multi-day reports count holiday toward present percentage — verify policy with management.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Outcome filter (class summary)">
        <p>
          When Report Type is Class Summary and outcome filter is set, threshold input shows{' '}
          <em>At or above</em> or <em>Below</em> plus percentage — filters classes by pass rate against threshold.
        </p>
      </DocSection>

      <DocSection title="Teacher reports">
        <DocSteps>
          <DocStep title="Set Report For: Teachers">
            Class dropdown shows N/A for teachers.
          </DocStep>
          <DocStep title="Choose period and type">
            Standard multi-day for monthly P/A/L counts per teacher.
          </DocStep>
          <DocStep title="Generate and export">
            CSV for HR; Print for principal sign-off.
          </DocStep>
        </DocSteps>
      </DocSection>

      <DocSection title="Quick reference">
        <p>Route: <code>/admin/attendance/reports</code> · Client-side aggregation · Export via CSV or Download / Print.</p>
        <p>Full AY range is hardcoded Aug 2025 – Jun 2026 — verify against your academic calendar.</p>
        <p>Absentee List sorts by lowest attendance percentage first.</p>
        <p>Class Summary requires a multi-day period — Daily is disabled for that type.</p>
        <p>Teachers mode disables class filter — shows N/A for teachers.</p>
        <p>Module key: ATTENDANCE.</p>
      </DocSection>

      <DocSection title="Related guides">
        <ul>
          <li><Link href="/docs/intro/admin/attendance/students">Student Attendance</Link></li>
          <li><Link href="/docs/intro/admin/attendance">Attendance Dashboard</Link></li>
        </ul>
      </DocSection>
    </DocsShell>
  );
}
