import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocSteps, DocStep } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function AdminExpensesUtilitiesPage() {
  return (
    <DocsShell
      title="Utility Bills"
      subtitle="Record electricity, water, gas, internet, and other utility payments."
      nav={introNav}
      variant="intro"
    >
      <p>
        Utility Bills tracks recurring branch costs — electricity, water, gas, internet, and
        similar. Each bill entry stores amount, billing period, provider notes, and links to a
        payment voucher.
      </p>

      <h2>Common tasks</h2>
      <DocSteps>
        <DocStep title="Add a bill payment">
          Click add/new, select utility type, enter amount and billing month, then save.
        </DocStep>
        <DocStep title="Open voucher">
          Click the voucher link on a row to view or print the payment receipt.
        </DocStep>
        <DocStep title="Review monthly total">
          Check the <Link href="/docs/intro/admin/expenses">Payments hub</Link> summary for
          utilities spend vs payroll and others.
        </DocStep>
      </DocSteps>

      <h2>Permissions</h2>
      <p>Part of the <strong>Payments</strong> module — same CRUD rules as other expense types.</p>
      <p>
        See <Link href="/docs/intro/admin/permissions">Permissions & Staff Roles</Link>.
      </p>
    </DocsShell>
  );
}
