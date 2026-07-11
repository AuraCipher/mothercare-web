import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function AdminAttendancePage() {
  return (
    <DocsShell
      title="Attendance"
      subtitle="Dashboard for student, teacher, and staff attendance with trends and quick links."
      nav={introNav}
      variant="intro"
    >
      <p>
        The Attendance hub summarizes presence across your branch. It shows today&apos;s stats,
        trend charts by period (daily, weekly, monthly, or custom), and shortcuts to mark attendance
        for students, teachers, and non-teaching staff.
      </p>

      <h2>Module areas</h2>
      <ul>
        <li><Link href="/docs/intro/admin/attendance/students">Students</Link> — daily class attendance</li>
        <li><Link href="/docs/intro/admin/attendance/teachers">Teachers</Link> — teacher presence</li>
        <li><Link href="/docs/intro/admin/attendance/staff">Staff</Link> — management and worker attendance</li>
        <li><Link href="/docs/intro/admin/attendance/reports">Reports</Link> — exportable attendance reports</li>
      </ul>

      <h2>Common tasks</h2>
      <DocSteps>
        <DocStep title="Review today&apos;s snapshot">
          Open the dashboard to see student and teacher percentages for the current date.
        </DocStep>
        <DocStep title="Filter trends by class">
          Choose a class group on the trend chart to isolate one section&apos;s pattern.
        </DocStep>
        <DocStep title="Mark attendance">
          Use the quick links to jump to the student, teacher, or staff marking screens.
        </DocStep>
      </DocSteps>

      <DocCallout variant="info" title="Payroll link">
        Teacher and staff attendance feeds into{' '}
        <Link href="/docs/intro/admin/expenses/payroll">Payroll</Link> calculations when salaries
        are attendance-based.
      </DocCallout>

      <h2>Permissions</h2>
      <p>Module key: <strong>Attendance</strong>. For restricted staff:</p>
      <ul>
        <li><strong>Read</strong> — view dashboards, histories, and reports</li>
        <li><strong>Create</strong> — mark new attendance records</li>
        <li><strong>Update</strong> — change recent attendance (within edit window on student screen)</li>
        <li><strong>Delete</strong> — remove erroneous marks where allowed</li>
      </ul>
      <p>
        See <Link href="/docs/intro/admin/permissions">Permissions & Staff Roles</Link>.
      </p>
    </DocsShell>
  );
}
