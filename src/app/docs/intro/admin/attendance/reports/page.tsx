import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocSteps, DocStep } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function AdminAttendanceReportsPage() {
  return (
    <DocsShell
      title="Attendance Reports"
      subtitle="Export and print attendance summaries for students, teachers, or staff."
      nav={introNav}
      variant="intro"
    >
      <p>
        Attendance Reports generates register-style outputs for a date range — class-wise student
        sheets, teacher monthly summaries, or staff logs suitable for filing and parent meetings.
      </p>

      <h2>Common tasks</h2>
      <DocSteps>
        <DocStep title="Select audience">
          Choose student, teacher, or staff report type.
        </DocStep>
        <DocStep title="Set date range and filters">
          Pick from/to dates, class, or individual when the form offers those options.
        </DocStep>
        <DocStep title="Generate output">
          Run the report and print or download the result.
        </DocStep>
      </DocSteps>

      <h2>Permissions</h2>
      <p>Part of the <strong>Attendance</strong> module — <strong>Read</strong> is enough to
      generate reports. Marking attendance requires create/update rights on the marking screens.</p>
      <p>
        See <Link href="/docs/intro/admin/permissions">Permissions & Staff Roles</Link>.
      </p>
    </DocsShell>
  );
}
