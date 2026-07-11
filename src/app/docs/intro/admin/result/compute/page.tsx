import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function AdminResultComputePage() {
  return (
    <DocsShell
      title="Result Compute"
      subtitle="Run grade calculation after marks entry is complete."
      nav={introNav}
      variant="intro"
    >
      <p>
        Compute (grade calculation) processes raw marks into totals, percentages, grades, and
        positions according to your exam structure. In the app, the dedicated compute route
        redirects to <strong>Report Cards</strong> where computation and card generation are
        handled together for each session.
      </p>

      <h2>Common tasks</h2>
      <DocSteps>
        <DocStep title="Confirm marks are complete">
          On the session summary, verify marks progress shows 100% for each exam.
        </DocStep>
        <DocStep title="Open report cards">
          Go to <Link href="/docs/intro/admin/result/report-cards">Report Cards</Link> for the
          target session.
        </DocStep>
        <DocStep title="Run computation">
          Trigger compute / regenerate if the UI offers it before printing cards — this refreshes
          grades from the latest marks.
        </DocStep>
        <DocStep title="Review before print">
          Spot-check a few students&apos; totals and grades against the marks sheet.
        </DocStep>
      </DocSteps>

      <DocCallout variant="warn" title="Re-computing">
        If you change marks after cards were generated, re-run computation so printed cards match
        the updated data.
      </DocCallout>

      <h2>Permissions</h2>
      <p>Part of the <strong>Result & Grade</strong> module — requires <strong>Update</strong> (or
      full admin) to run computation. Read-only users can view outcomes but not recalculate.</p>
      <p>
        See <Link href="/docs/intro/admin/permissions">Permissions & Staff Roles</Link>.
      </p>
    </DocsShell>
  );
}
