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

export default function AdminAttendanceTeachersPage() {
  return (
    <DocsShell
      title="Teacher Attendance"
      subtitle="Mark daily teacher presence, bulk actions, and multi-day attendance grids."
      nav={introNav}
      variant="intro"
    >
      <DocSection title="Overview">
        <p>
          <strong>Teacher Attendance</strong> at <code>/admin/attendance/teachers</code> lists all active
          teachers on the branch. Mark each teacher&apos;s status for a selected day, use bulk buttons, and
          save in one batch. Week, Month, and Year views show read-only grids with attendance percentages.
        </p>
        <p>Page title: <strong>Teacher Attendance</strong>.</p>
      </DocSection>

      <DocSection title="Before you start">
        <ul>
          <li><strong>Branch</strong> selected — teachers are branch-scoped.</li>
          <li><strong>Day view</strong> for marking; other views are read-only.</li>
          <li>No class filter required (unlike students).</li>
        </ul>
      </DocSection>

      <DocSection title="Filters and controls">
        <DocTable
          headers={['Control', 'Label']}
          rows={[
            ['Scope badge', 'All Teachers (with calendar icon)'],
            ['Search', 'Placeholder: Search teacher name…'],
            ['Date navigation', 'ChevronLeft/Right, date input, Today link'],
            ['View mode', 'Day, Week, Month, Year'],
            ['Status filter (day)', 'All, Present, Absent, Late, Leave, Half-Day, Function + {N} teacher(s)'],
          ]}
        />
      </DocSection>

      <DocSection title="Bulk buttons (day view)">
        <p>Same set as student attendance:</p>
        <ul>
          <li><strong>All Present</strong> · <strong>All Absent</strong> · <strong>All Late</strong> ·{' '}
          <strong>All Leave</strong> · <strong>All Half-Day</strong> · <strong>All Function</strong> ·{' '}
          <strong>Mark Holiday</strong></li>
        </ul>
      </DocSection>

      <DocSection title="Save button states">
        <DocTable
          headers={['Label', 'Condition']}
          rows={[
            ['Read Only', 'Not Day view'],
            ['Future Date', 'Date after today'],
            ['Locked', 'Date > 7 days ago'],
            ['Saving...', 'In progress'],
            ['Save', 'Ready'],
          ]}
        />
        <p>No <em>Select a Class</em> state — teachers page does not require class.</p>
      </DocSection>

      <DocSection title="Day view table">
        <DocTable
          headers={['Column', 'Content']}
          rows={[
            ['#', 'Row number'],
            ['Teacher Name', 'Teacher full name'],
            ['Status', 'Clickable badge — same cycle as students'],
          ]}
        />
        <p>Empty state: <em>No teachers found.</em></p>
      </DocSection>

      <DocSection title="Week / Month / Year grids">
        <DocTable
          headers={['View', 'Header', 'Columns']}
          rows={[
            ['Week/Month', 'Teacher', '#, Teacher, days…, %, Sum'],
            ['Year', 'Teacher', '#, Teacher, Jan…Dec, %, Sum'],
          ]}
        />
      </DocSection>

      <DocSection title="Step-by-step: mark teachers">
        <DocSteps>
          <DocStep title="Open Teacher Attendance">
            Dashboard card or sidebar Attendance → Teachers.
          </DocStep>
          <DocStep title="Set today&apos;s date">
            Confirm <strong>Day</strong> view. Use <strong>Today</strong> shortcut.
          </DocStep>
          <DocStep title="Mark each teacher">
            Click status badges or use bulk <strong>All Present</strong>.
          </DocStep>
          <DocStep title="Save">
            <strong>Save</strong> → POST /admin/attendance/teachers/batch with date and records[].
          </DocStep>
        </DocSteps>
      </DocSection>

      <DocSection title="Status reference">
        <p>Same eight statuses as students — see <Link href="/docs/intro/admin/attendance">Attendance Dashboard</Link> status table. Toggle: unmarked → present → absent → late → leave → half-day → function → present.</p>
      </DocSection>

      <DocSection title="Permission matrix">
        <DocTable
          headers={['Action', 'Permission']}
          rows={[
            ['View teacher list/grid', 'ATTENDANCE → Read'],
            ['Save / Mark Holiday', 'ATTENDANCE → Create'],
          ]}
        />
      </DocSection>

      <DocSection title="Archived academic year">
        <p>Loads historical records. POST blocked per archived CRUD flags. No dedicated UI banner on this page.</p>
      </DocSection>

      <DocSection title="What happens when">
        <DocTable
          headers={['Event', 'Effect']}
          rows={[
            ['Load day', 'GET /admin/attendance/teachers?date'],
            ['Load range', 'GET /admin/attendance/teachers?from&to'],
            ['Save', 'POST /admin/attendance/teachers/batch — notifyTeacherAttendanceStatus'],
            ['Mark Holiday', 'Immediate batch — all teachers → holiday'],
            ['Payroll', 'Attendance data consumed by payroll expense module when configured'],
          ]}
        />
      </DocSection>

      <DocCallout variant="info" title="No teacher detail page">
        Unlike students, there is no per-teacher attendance detail route. All marking happens on this list page.
        Note field exists in API but has no UI input on this page.
      </DocCallout>

      <DocSection title="Comparison with student attendance">
        <DocTable
          headers={['Aspect', 'Students', 'Teachers']}
          rows={[
            ['Class required to save', 'Yes', 'No'],
            ['Detail page', '/attendance/student/[id]', 'None'],
            ['Bulk Mark Holiday', 'Per selected class', 'All teachers on branch'],
            ['Parent notification', 'Yes on absent/late/leave', 'Teacher notification API'],
            ['Payroll link', 'No', 'Yes — attendance-based pay'],
          ]}
        />
      </DocSection>

      <DocSection title="Weekly review workflow">
        <DocSteps>
          <DocStep title="Switch to Week view">
            Read-only grid — verify no accidental gaps mid-week.
          </DocStep>
          <DocStep title="Identify patterns">
            Teachers with repeated Late or Absent — cross-check timetable.
          </DocStep>
          <DocStep title="Export via Reports">
            <Link href="/docs/intro/admin/attendance/reports">Attendance Reports</Link> → Teachers → Monthly Standard.
          </DocStep>
        </DocSteps>
      </DocSection>

      <DocSection title="Backend batch payload">
        <p>POST /admin/attendance/teachers/batch body:</p>
        <ul>
          <li><code>date</code> — ISO date string</li>
          <li><code>records[]</code> — each with <code>teacherId</code>, <code>status</code>, optional <code>note</code></li>
          <li>Scoped with <code>branchId</code> and <code>academicYearId</code> via scopeBody()</li>
        </ul>
      </DocSection>

      <DocSection title="Troubleshooting">
        <DocFaq
          items={[
            {
              q: 'No teachers listed',
              a: 'No active teachers on branch. Add teachers under Admin → Teachers.',
            },
            {
              q: 'Save Locked',
              a: 'Date older than 7 days. Select a recent date.',
            },
            {
              q: 'Mark Holiday toast count wrong',
              a: 'Shows number of teachers updated. Verify in Week view.',
            },
            {
              q: '403 on Save',
              a: 'ATTENDANCE Create missing or archived year blocks writes. Check staff permissions.',
            },
            {
              q: 'Week view shows dots for unmarked',
              a: 'Normal — unmarked cells show · until day view save.',
            },
            {
              q: 'Half-day vs Late',
              a: 'Use Late for tardy arrival; Half-day for leaving after morning only — payroll may treat differently.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Holiday and function days">
        <p>
          Use <strong>Mark Holiday</strong> for school-wide closure affecting all teachers at once. Use{' '}
          <strong>Function</strong> status for sports day or events where staff are present but not in class —
          counts differently from Present in some reports.
        </p>
      </DocSection>

      <DocSection title="Quick reference — routes">
        <DocTable
          headers={['Screen', 'Path']}
          rows={[
            ['Teacher attendance', '/admin/attendance/teachers'],
            ['Teachers module', '/admin/teachers'],
            ['Payroll', '/admin/expenses/payroll'],
            ['Attendance reports', '/admin/attendance/reports'],
          ]}
        />
      </DocSection>

      <DocSection title="Quick reference">
        <p>Route: <code>/admin/attendance/teachers</code> · POST teachers/batch · No class filter required to Save.</p>
        <p>Module key: <strong>ATTENDANCE</strong> · Batch saves map to Create permission.</p>
      </DocSection>

      <DocSection title="Related guides">
        <ul>
          <li><Link href="/docs/intro/admin/attendance/staff">Staff Attendance</Link></li>
          <li><Link href="/docs/intro/admin/attendance/students">Student Attendance</Link></li>
          <li><Link href="/docs/intro/admin/teachers">Teachers module</Link></li>
        </ul>
      </DocSection>
    </DocsShell>
  );
}
