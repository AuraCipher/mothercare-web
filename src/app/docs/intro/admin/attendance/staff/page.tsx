import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocSteps, DocStep } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function AdminAttendanceStaffPage() {
  return (
    <DocsShell
      title="Staff Attendance"
      subtitle="Mark attendance for management and non-teaching workers."
      nav={introNav}
      variant="intro"
    >
      <p>
        Staff Attendance covers branch workers who are not on the teacher roster — office staff,
        guards, cleaners, and other roles registered under{' '}
        <Link href="/docs/intro/admin/staff">Staff</Link>. Marks feed payroll and branch HR
        records.
      </p>

      <h2>Common tasks</h2>
      <DocSteps>
        <DocStep title="Open the staff list">
          Navigate from the attendance hub or sidebar to the staff attendance screen.
        </DocStep>
        <DocStep title="Mark daily status">
          Set present, absent, leave, or holiday for each worker on the selected date.
        </DocStep>
        <DocStep title="Save and verify">
          Save changes, then cross-check totals on the{' '}
          <Link href="/docs/intro/admin/attendance">Attendance dashboard</Link>.
        </DocStep>
      </DocSteps>

      <h2>Permissions</h2>
      <p>Part of the <strong>Attendance</strong> module. Restricted staff need attendance write
      access to mark records; read-only users can audit but not edit.</p>
      <p>
        See <Link href="/docs/intro/admin/permissions">Permissions & Staff Roles</Link>.
      </p>
    </DocsShell>
  );
}
