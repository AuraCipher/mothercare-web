import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocSteps, DocStep } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function AdminResultReportCardsPage() {
  return (
    <DocsShell
      title="Report Cards"
      subtitle="Generate, preview, and print student report cards after marks are complete."
      nav={introNav}
      variant="intro"
    >
      <p>
        Report Cards turns computed exam results into printable cards per student or class. Select a
        session and exam, filter by class, then generate cards with grades, totals, and remarks
        fields where configured.
      </p>

      <h2>Common tasks</h2>
      <DocSteps>
        <DocStep title="Select session and exam">
          Choose the exam session and specific exam whose results should appear on cards.
        </DocStep>
        <DocStep title="Filter students">
          Narrow by class or individual student before bulk generation.
        </DocStep>
        <DocStep title="Generate and print">
          Run generation, preview a sample card, then print or export for distribution to parents.
        </DocStep>
      </DocSteps>

      <h2>Permissions</h2>
      <p>Part of the <strong>Result & Grade</strong> module. Generating cards requires read access
      to results; publishing or editing remarks may need update permission. Grade computation is
      covered under <Link href="/docs/intro/admin/result/compute">Compute</Link>.</p>
      <p>
        See <Link href="/docs/intro/admin/permissions">Permissions & Staff Roles</Link>.
      </p>
    </DocsShell>
  );
}
