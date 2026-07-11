import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocSteps, DocStep } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function AdminAttendanceTeachersPage() {
  return (
    <DocsShell
      title="Teacher Attendance"
      subtitle="Record daily presence for teaching staff."
      nav={introNav}
      variant="intro"
    >
      <p>
        Teacher Attendance lists all teachers in the branch for the selected period. Mark each
        teacher present, absent, leave, or holiday — data rolls up to the attendance dashboard and
        can affect payroll when salaries are attendance-linked.
      </p>

      <h2>Common tasks</h2>
      <DocSteps>
        <DocStep title="Pick the date range">
          Set the working date (or period) shown at the top of the screen.
        </DocStep>
        <DocStep title="Mark each teacher">
          Update status per teacher row. Save when finished.
        </DocStep>
        <DocStep title="Review trends">
          Return to the <Link href="/docs/intro/admin/attendance">Attendance dashboard</Link> to
          compare teacher presence over time.
        </DocStep>
      </DocSteps>

      <h2>Permissions</h2>
      <p>Part of the <strong>Attendance</strong> module — same read / create / update / delete
      rules as student attendance. Payroll staff often need read-only access here and write access
      in <Link href="/docs/intro/admin/expenses/payroll">Payroll</Link>.</p>
      <p>
        See <Link href="/docs/intro/admin/permissions">Permissions & Staff Roles</Link>.
      </p>
    </DocsShell>
  );
}
