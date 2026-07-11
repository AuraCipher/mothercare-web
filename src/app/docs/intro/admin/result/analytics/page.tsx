import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocSteps, DocStep } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function AdminResultAnalyticsPage() {
  return (
    <DocsShell
      title="Result Analytics"
      subtitle="Pass/fail rates, grade distributions, and performance trends."
      nav={introNav}
      variant="intro"
    >
      <p>
        Result Analytics visualizes exam outcomes across classes and sessions — pass percentages,
        grade histograms, subject-wise weakness, and comparative trends so leadership can spot
        areas needing intervention.
      </p>

      <h2>Common tasks</h2>
      <DocSteps>
        <DocStep title="Select session">
          Choose the exam session to analyze.
        </DocStep>
        <DocStep title="Filter by class or exam">
          Drill into one class or one exam component.
        </DocStep>
        <DocStep title="Review charts">
          Use pass/fail and grade charts in meetings; export detailed lists from{' '}
          <Link href="/docs/intro/admin/result">Reports</Link> on the result hub when needed.
        </DocStep>
      </DocSteps>

      <h2>Permissions</h2>
      <p>Part of the <strong>Result & Grade</strong> module — <strong>Read</strong> access is
      sufficient. Analytics does not modify marks or grades.</p>
      <p>
        See <Link href="/docs/intro/admin/permissions">Permissions & Staff Roles</Link>.
      </p>
    </DocsShell>
  );
}
