import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function AdminExpensesPage() {
  return (
    <DocsShell
      title="Payments (Expenses)"
      subtitle="Branch outgoing ledger — payroll, utilities, and other expenses with vouchers."
      nav={introNav}
      variant="intro"
    >
      <p>
        The Payments hub (labeled <strong>Payments</strong> in the sidebar) tracks money leaving the
        branch — salaries, utility bills, maintenance, and miscellaneous costs. Each payment creates
        a voucher you can view, print, or void with a reason.
      </p>

      <h2>Module areas</h2>
      <ul>
        <li><Link href="/docs/intro/admin/expenses/payroll">Payroll</Link> — teacher and staff salaries</li>
        <li><Link href="/docs/intro/admin/expenses/utilities">Utilities</Link> — electricity, water, internet, etc.</li>
        <li><Link href="/docs/intro/admin/expenses/others">Others</Link> — maintenance and misc expenses</li>
        <li><Link href="/docs/intro/admin/expenses/vouchers">Vouchers</Link> — payment receipts and voiding</li>
        <li><Link href="/docs/intro/admin/expenses/reports">Reports</Link> — CSV exports by category</li>
      </ul>

      <h2>Common tasks</h2>
      <DocSteps>
        <DocStep title="Review summary cards">
          The hub shows month-to-date totals for payroll, utilities, others, and grand total.
        </DocStep>
        <DocStep title="Record an expense">
          Open the relevant sub-module, fill the payment form, and save — a voucher is created.
        </DocStep>
        <DocStep title="Audit vouchers">
          Open any payment&apos;s voucher link to see line items and void if entered in error.
        </DocStep>
      </DocSteps>

      <DocCallout variant="info" title="Attendance link">
        Payroll can calculate amounts from{' '}
        <Link href="/docs/intro/admin/attendance">Attendance</Link> when configured for
        attendance-based pay.
      </DocCallout>

      <h2>Permissions</h2>
      <p>Module key: <strong>Payments</strong> (EXPENSES). For restricted staff:</p>
      <ul>
        <li><strong>Read</strong> — view expenses, vouchers, and reports</li>
        <li><strong>Create</strong> — record new payments</li>
        <li><strong>Update</strong> — edit draft or recent entries where allowed</li>
        <li><strong>Delete</strong> — void vouchers (requires reason on voucher screen)</li>
      </ul>
      <p>
        See <Link href="/docs/intro/admin/permissions">Permissions & Staff Roles</Link>.
      </p>
    </DocsShell>
  );
}
