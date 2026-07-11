import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function AdminExpensesPayrollPage() {
  return (
    <DocsShell
      title="Payroll"
      subtitle="Calculate and pay teacher and staff salaries with optional attendance rules."
      nav={introNav}
      variant="intro"
    >
      <p>
        Payroll lists teachers and staff eligible for salary payment. You can run individual pays,
        bulk payroll for a month, and apply attendance-based deductions or bonuses when salary rules
        are configured.
      </p>

      <h2>Common tasks</h2>
      <DocSteps>
        <DocStep title="Select pay period">
          Choose the month or pay cycle shown at the top of the screen.
        </DocStep>
        <DocStep title="Review calculated amounts">
          Open each employee row to see base salary, attendance adjustments, and net pay.
        </DocStep>
        <DocStep title="Process payment">
          Confirm and pay — a voucher is generated for the ledger.
        </DocStep>
        <DocStep title="Bulk payroll">
          Use <strong>Bulk</strong> to process many employees in one run when amounts are ready.
        </DocStep>
      </DocSteps>

      <DocCallout variant="tip" title="Attendance data">
        Ensure <Link href="/docs/intro/admin/attendance/teachers">Teacher</Link> and{' '}
        <Link href="/docs/intro/admin/attendance/staff">Staff</Link> attendance is marked before
        running attendance-linked payroll.
      </DocCallout>

      <h2>Permissions</h2>
      <p>Part of the <strong>Payments</strong> module — creating payroll entries requires{' '}
      <strong>Create</strong>; voiding paid vouchers needs <strong>Delete</strong>.</p>
      <p>
        See <Link href="/docs/intro/admin/permissions">Permissions & Staff Roles</Link>.
      </p>
    </DocsShell>
  );
}
