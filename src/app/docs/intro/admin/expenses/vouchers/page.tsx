import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function AdminExpensesVouchersPage() {
  return (
    <DocsShell
      title="Payment Vouchers"
      subtitle="View, print, and void expense vouchers for audit trail."
      nav={introNav}
      variant="intro"
    >
      <p>
        Every payroll, utility, and other payment creates a <strong>voucher</strong> — a numbered
        receipt with amount, payee, type, and timestamp. Open a voucher from any expense list or
        directly by ID to print for filing or void if entered incorrectly.
      </p>

      <h2>Common tasks</h2>
      <DocSteps>
        <DocStep title="Open a voucher">
          From payroll, utilities, or others, click the voucher link on a payment row.
        </DocStep>
        <DocStep title="Print or share">
          Use the browser print action on the voucher detail page for physical records.
        </DocStep>
        <DocStep title="Void a voucher">
          If delete permission is granted, open void, enter a mandatory reason, and confirm. The
          payment is marked void but kept in the audit log.
        </DocStep>
      </DocSteps>

      <DocCallout variant="warn" title="Void is permanent">
        Voiding does not delete history — it marks the voucher inactive with your reason attached.
        Create a correcting entry if a new payment is needed.
      </DocCallout>

      <h2>Permissions</h2>
      <p>Part of the <strong>Payments</strong> module:</p>
      <ul>
        <li><strong>Read</strong> — view voucher details</li>
        <li><strong>Delete</strong> — void vouchers (shown only when permitted)</li>
      </ul>
      <p>
        See <Link href="/docs/intro/admin/permissions">Permissions & Staff Roles</Link>.
      </p>
    </DocsShell>
  );
}
