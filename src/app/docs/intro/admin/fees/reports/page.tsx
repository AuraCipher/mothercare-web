import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocSteps, DocStep } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function AdminFeesReportsPage() {
  return (
    <DocsShell
      title="Fee Reports"
      subtitle="Generate and export printable fee reports for the branch."
      nav={introNav}
      variant="intro"
    >
      <p>
        Fee Reports provides exportable and printable summaries — collection registers, defaulter
        lists, class-wise breakdowns, and other office-ready outputs for the selected academic year
        and date range.
      </p>

      <h2>Common tasks</h2>
      <DocSteps>
        <DocStep title="Choose report type">
          Pick the report template that matches your need (collections, outstanding dues, class
          summary, etc.).
        </DocStep>
        <DocStep title="Set filters">
          Select month, class, fee head, or status filters as shown on the form.
        </DocStep>
        <DocStep title="Generate and export">
          Run the report, preview on screen, then print or export to PDF/CSV where available.
        </DocStep>
      </DocSteps>

      <h2>Permissions</h2>
      <p>Part of the <strong>Fees</strong> module:</p>
      <ul>
        <li><strong>Read</strong> — generate and view reports</li>
        <li><strong>Create / Update / Delete</strong> — not typically used on this screen; payment
        changes happen in <Link href="/docs/intro/admin/fees/collections">Collections</Link></li>
      </ul>
      <p>
        See <Link href="/docs/intro/admin/permissions">Permissions & Staff Roles</Link>.
      </p>
    </DocsShell>
  );
}
