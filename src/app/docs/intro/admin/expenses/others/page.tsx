import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocSteps, DocStep } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function AdminExpensesOthersPage() {
  return (
    <DocsShell
      title="Other Expenses"
      subtitle="Maintenance, repairs, and miscellaneous branch payments."
      nav={introNav}
      variant="intro"
    >
      <p>
        Others captures one-off or non-utility spending — building repairs, supplies, events, and
        any outgoing payment that is not payroll or a standard utility bill. Each entry creates a
        voucher in the branch ledger.
      </p>

      <h2>Common tasks</h2>
      <DocSteps>
        <DocStep title="Record an expense">
          Add description, category, amount, and payment date, then save.
        </DocStep>
        <DocStep title="Attach to voucher">
          Open the linked <Link href="/docs/intro/admin/expenses/vouchers">Voucher</Link> for audit
          or printing.
        </DocStep>
        <DocStep title="Export for accounts">
          Use <Link href="/docs/intro/admin/expenses/reports">Reports</Link> to download CSV for
          your accountant.
        </DocStep>
      </DocSteps>

      <h2>Permissions</h2>
      <p>Part of the <strong>Payments</strong> module.</p>
      <p>
        See <Link href="/docs/intro/admin/permissions">Permissions & Staff Roles</Link>.
      </p>
    </DocsShell>
  );
}
