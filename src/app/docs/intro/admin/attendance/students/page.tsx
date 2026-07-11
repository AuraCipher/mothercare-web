import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function AdminAttendanceStudentsPage() {
  return (
    <DocsShell
      title="Student Attendance"
      subtitle="Mark daily presence by class with day, week, month, or year views."
      nav={introNav}
      variant="intro"
    >
      <p>
        This screen is where class teachers and office staff record student attendance. Pick a
        class, choose a date, and mark each student present, absent, late, leave, or holiday. Views
        scale from a single day to a full-year matrix.
      </p>

      <h2>Common tasks</h2>
      <DocSteps>
        <DocStep title="Select class and date">
          Choose the section from the dropdown and set the date (defaults to today).
        </DocStep>
        <DocStep title="Mark statuses">
          Tap or toggle each student&apos;s status for that day. Use bulk actions when available
          for holidays or class-wide present.
        </DocStep>
        <DocStep title="Save changes">
          Click <strong>Save</strong> to persist marks. Unsaved changes are lost if you navigate away.
        </DocStep>
        <DocStep title="Review history">
          Switch to week, month, or year view to audit a student&apos;s pattern or export from{' '}
          <Link href="/docs/intro/admin/attendance/reports">Reports</Link>.
        </DocStep>
      </DocSteps>

      <DocCallout variant="warn" title="Edit lock">
        Attendance older than about seven days may be locked from editing unless you have update
        permission and the system allows overrides.
      </DocCallout>

      <h2>Permissions</h2>
      <p>Part of the <strong>Attendance</strong> module:</p>
      <ul>
        <li><strong>Read</strong> — view attendance grids and student history</li>
        <li><strong>Create</strong> — mark attendance for new dates</li>
        <li><strong>Update</strong> — correct recent marks within the edit window</li>
        <li><strong>Delete</strong> — clear marks when supported</li>
      </ul>
      <p>
        See <Link href="/docs/intro/admin/permissions">Permissions & Staff Roles</Link>.
      </p>
    </DocsShell>
  );
}
