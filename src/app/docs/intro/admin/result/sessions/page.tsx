import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function AdminResultSessionsPage() {
  return (
    <DocsShell
      title="Exam Sessions"
      subtitle="Create exam terms, manage exam types, and open individual exams."
      nav={introNav}
      variant="intro"
    >
      <p>
        An exam session groups all exams for a term (Mid Year, Final, etc.). From the Result hub you
        see each session&apos;s progress — exam count, marks filled, and report cards generated.
        Click a session to manage exam types, create exams per class, and track completion.
      </p>

      <h2>Common tasks</h2>
      <DocSteps>
        <DocStep title="Create a session">
          Click <strong>New Session</strong>, enter name and date range, and save.
        </DocStep>
        <DocStep title="Configure exam types">
          Inside the session, open <strong>Exam Types</strong> to define categories (e.g. Written,
          Oral) used when creating exams.
        </DocStep>
        <DocStep title="Add exams">
          Use <strong>Create Exam</strong> to add class-specific exams linked to subjects.
        </DocStep>
        <DocStep title="Monitor progress">
          Watch marks and report-card progress bars on the session summary before publishing results.
        </DocStep>
      </DocSteps>

      <DocCallout variant="tip" title="Marks entry">
        Open an exam from the session list to reach{' '}
        <Link href="/docs/intro/admin/result/marks">Marks Entry</Link> for that assessment.
      </DocCallout>

      <h2>Permissions</h2>
      <p>Part of the <strong>Result & Grade</strong> module. Session and exam setup requires
      create/update; teachers with result access may only enter marks on assigned exams.</p>
      <p>
        See <Link href="/docs/intro/admin/permissions">Permissions & Staff Roles</Link>.
      </p>
    </DocsShell>
  );
}
