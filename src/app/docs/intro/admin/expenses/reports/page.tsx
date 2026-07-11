import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocSteps, DocStep } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function AdminExpensesReportsPage() {
  return (
    <DocsShell
      title="Expense Reports"
      subtitle="Export CSV reports for payroll, utilities, and other payments."
      nav={introNav}
      variant="intro"
    >
      <p>
        Expense Reports lets you download branch outgoing data for accounting — payroll registers,
        utility bill lists, and miscellaneous expense CSVs filtered by date range.
      </p>

      <h2>Common tasks</h2>
      <DocSteps>
        <DocStep title="Choose export type">
          Select payroll, utilities, or others export.
        </DocStep>
        <DocStep title="Set date range">
          Pick from and to dates matching your reconciliation period.
        </DocStep>
        <DocStep title="Download CSV">
          Generate and save the file for Excel or your accounting software.
        </DocStep>
      </DocSteps>

      <h2>Permissions</h2>
      <p>Part of the <strong>Payments</strong> module — <strong>Read</strong> is sufficient for
      exports.</p>
      <p>
        See <Link href="/docs/intro/admin/permissions">Permissions & Staff Roles</Link>.
      </p>
    </DocsShell>
  );
}
