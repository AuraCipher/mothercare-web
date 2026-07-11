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

export default function AdminAttendanceStaffPage() {
  return (
    <DocsShell
      title="Staff Attendance"
      subtitle="Mark attendance for management, canteen, and worker roles (non-teaching staff)."
      nav={introNav}
      variant="intro"
    >
      <DocSection title="Overview">
        <p>
          <strong>Staff Attendance</strong> at <code>/admin/attendance/staff</code> covers non-teacher branch
          users: <code>management</code>, <code>canteen_staff</code>, and <code>worker</code> roles. The UI
          mirrors the teacher attendance page — day marking with bulk buttons, week/month/year read-only grids.
        </p>
        <p>Page title: <strong>Staff Attendance</strong>.</p>
      </DocSection>

      <DocSection title="Who appears on this page">
        <p>Backend includes active users with branch roles:</p>
        <ul>
          <li><strong>management</strong> — office and admin support staff</li>
          <li><strong>canteen_staff</strong> — canteen operators</li>
          <li><strong>worker</strong> — cleaners, guards, maintenance</li>
        </ul>
        <p>Teachers are excluded — use <Link href="/docs/intro/admin/attendance/teachers">Teacher Attendance</Link>.</p>
      </DocSection>

      <DocSection title="Before you start">
        <ul>
          <li><strong>Branch</strong> selected.</li>
          <li><strong>Staff accounts</strong> created under Admin → Staff with appropriate roles.</li>
          <li><strong>Day view</strong> for saving marks.</li>
        </ul>
      </DocSection>

      <DocSection title="Filters and controls">
        <DocTable
          headers={['Control', 'UI label (as shown)']}
          rows={[
            ['Scope badge', 'All Teachers *(copy-paste label — page is for staff)*'],
            ['Search', 'Search teacher name… *(placeholder text)*'],
            ['Date navigation', 'ChevronLeft/Right, date input, Today'],
            ['View mode', 'Day, Week, Month, Year'],
            ['Status filter', 'All, Present, Absent, Late, Leave, Half-Day, Function + {N} teacher(s)'],
          ]}
        />
        <DocCallout variant="warn" title="UI label quirk">
          Several labels still say &quot;Teacher&quot; on the staff page. Functionality targets non-teacher staff
          — ignore the badge wording when following on-screen text.
        </DocCallout>
      </DocSection>

      <DocSection title="Bulk buttons">
        <p>Identical to teachers page:</p>
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
            ['Read Only', 'Week/Month/Year view'],
            ['Future Date', 'Future date selected'],
            ['Locked', '> 7 days ago'],
            ['Saving...', 'In flight'],
            ['Save', 'Ready'],
          ]}
        />
      </DocSection>

      <DocSection title="Table columns">
        <DocTable
          headers={['View', 'Columns']}
          rows={[
            ['Day', '#, Teacher Name *(header)*, Status'],
            ['Week/Month', '#, Teacher *(header)*, days…, %, Sum'],
            ['Year', '#, Teacher, Jan…Dec, %, Sum'],
          ]}
        />
        <p>Empty state message: <em>No staffList found.</em></p>
      </DocSection>

      <DocSection title="Step-by-step: mark staff">
        <DocSteps>
          <DocStep title="Open Staff Attendance">
            From dashboard <strong>Staff Attendance</strong> card.
          </DocStep>
          <DocStep title="Day view + today">
            Select date and <strong>Day</strong> mode.
          </DocStep>
          <DocStep title="Mark statuses">
            Click badges or bulk <strong>All Present</strong>.
          </DocStep>
          <DocStep title="Save">
            <strong>Save</strong> — POST /admin/attendance/staff/batch with staffUserId per record.
          </DocStep>
        </DocSteps>
      </DocSection>

      <DocSection title="Permission matrix">
        <DocTable
          headers={['Action', 'Permission']}
          rows={[
            ['View staff attendance', 'ATTENDANCE → Read'],
            ['Save batch', 'ATTENDANCE → Create'],
          ]}
        />
      </DocSection>

      <DocSection title="Archived academic year">
        <p>Read historical data; writes follow archived CRUD on API. Same 7-day client lock as other marking pages.</p>
      </DocSection>

      <DocSection title="What happens when">
        <DocTable
          headers={['Event', 'Effect']}
          rows={[
            ['Load', 'GET /admin/attendance/staff?date or from&to'],
            ['Save', 'POST /admin/attendance/staff/batch — records use staffUserId'],
            ['Mark Holiday', 'Toast: Holiday set for {N} staffList — all staff → holiday'],
            ['Payroll', 'Staff attendance may feed payroll like teachers'],
          ]}
        />
      </DocSection>

      <DocSection title="Roles included (reference)">
        <DocTable
          headers={['Branch role', 'Typical job', 'On this page?']}
          rows={[
            ['management', 'Office admin, coordinator', 'Yes'],
            ['canteen_staff', 'Canteen operator', 'Yes'],
            ['worker', 'Cleaner, guard, maintenance', 'Yes'],
            ['teacher', 'Class teacher', 'No — use Teacher Attendance'],
          ]}
        />
      </DocSection>

      <DocSection title="Daily marking checklist">
        <DocSteps>
          <DocStep title="Open Staff Attendance before school opens">
            Set date to today, Day view.
          </DocStep>
          <DocStep title="Mark non-teaching staff">
            Workers and canteen staff often start earlier — mark Present or Late.
          </DocStep>
          <DocStep title="Save batch">
            Single Save for all changes — unlike Mark Holiday which saves immediately.
          </DocStep>
          <DocStep title="Cross-check payroll">
            If payroll uses attendance, verify month-to-date on{' '}
            <Link href="/docs/intro/admin/expenses/payroll">Payroll</Link> before salary run.
          </DocStep>
        </DocSteps>
      </DocSection>

      <DocSection title="API reference">
        <DocTable
          headers={['Endpoint', 'Purpose']}
          rows={[
            ['GET /admin/attendance/staff', 'List staff + records for date or range'],
            ['POST /admin/attendance/staff/batch', 'Upsert records with staffUserId'],
          ]}
        />
      </DocSection>

      <DocSection title="Troubleshooting">
        <DocFaq
          items={[
            {
              q: 'Expected worker not on list',
              a: 'User must have worker/canteen_staff/management branch role and be active.',
            },
            {
              q: 'Teacher appears here',
              a: 'Should not — teachers belong on Teacher Attendance page only.',
            },
            {
              q: 'Labels say Teacher',
              a: 'Known UI copy issue; page is still Staff Attendance functionally.',
            },
            {
              q: 'Save shows Future Date',
              a: 'Cannot mark attendance for future days — select today or past (within lock window).',
            },
            {
              q: 'Empty state says staffList',
              a: 'UI string quirk — means no staff records found for branch roles on this page.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Coordinate with teacher attendance">
        <p>
          Mark teachers on <Link href="/docs/intro/admin/attendance/teachers">Teacher Attendance</Link> first in
          the morning, then staff on this page. Avoid duplicating the same person — teachers never appear here.
        </p>
      </DocSection>

      <DocSection title="Quick reference — routes">
        <DocTable
          headers={['Screen', 'Path']}
          rows={[
            ['Staff attendance', '/admin/attendance/staff'],
            ['Teacher attendance', '/admin/attendance/teachers'],
            ['Attendance reports', '/admin/attendance/reports'],
            ['Staff management', '/admin/staff'],
          ]}
        />
      </DocSection>

      <DocSection title="Quick reference">
        <p>Route: <code>/admin/attendance/staff</code> · Roles: management, canteen_staff, worker · POST staff/batch.</p>
        <p>Excludes teachers — they are marked on the Teacher Attendance page only.</p>
        <DocCallout variant="tip" title="UI labels">
          Some on-screen labels still say &quot;Teacher&quot; — this page is for non-teaching staff only.
        </DocCallout>
        <p>Coordinate morning marking: teachers first, then staff on this page.</p>
        <p>POST /admin/attendance/staff/batch uses staffUserId in each record.</p>
        <p>Module key: ATTENDANCE.</p>
        <p>7-day edit lock applies to Save on this page.</p>
        <p>Empty state text may show &quot;No staffList found&quot; — means zero staff rows.</p>
      </DocSection>

      <DocSection title="Related guides">
        <ul>
          <li><Link href="/docs/intro/admin/attendance/teachers">Teacher Attendance</Link></li>
          <li><Link href="/docs/intro/admin/staff">Staff management</Link></li>
          <li><Link href="/docs/intro/admin/attendance">Attendance Dashboard</Link></li>
        </ul>
      </DocSection>
    </DocsShell>
  );
}
