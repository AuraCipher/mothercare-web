import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep, DocFaq } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function AdminExpensesPayrollPage() {
  return (
    <DocsShell
      title="Payroll"
      subtitle="Calculate and pay teacher and staff salaries with attendance-based rules."
      nav={introNav}
      variant="intro"
    >
      <h2>Overview</h2>
      <p>
        <strong>Payroll</strong> at <code>/admin/expenses/payroll</code> lists teachers and staff
        eligible for salary payment each month. Review calculated earned amounts, opening balances,
        payments made, and remaining balance. Record individual pays or use bulk payroll. Each
        payment generates a <Link href="/docs/intro/admin/expenses/vouchers">voucher</Link>.
      </p>
      <p>
        <strong>Why it exists:</strong> consolidates salary processing with optional attendance
        deductions, extra payments, and CSV export for accounts.
      </p>
      <p>
        <strong>Who uses it:</strong> branch admins and restricted staff with Payments{' '}
        <strong>Create</strong> permission (read-only users view list only).
      </p>

      <h2>Before you start</h2>
      <ul>
        <li>Teacher/staff <strong>salary</strong> set on profiles.</li>
        <li><Link href="/docs/intro/admin/attendance/teachers">Teacher</Link> and{' '}
        <Link href="/docs/intro/admin/attendance/staff">Staff</Link> attendance marked for the month if attendance-based.</li>
        <li>Select correct <strong>salary month</strong> at top of page.</li>
      </ul>

      <h2>Step-by-step: common workflows</h2>
      <DocSteps>
        <DocStep title="Select pay period">
          Use month picker at top — payroll list reloads for that salary month.
        </DocStep>
        <DocStep title="Review the table">
          Columns: Name, Type (teacher/staff/worker), Profile salary, Earned, Opening, Paid,
          Balance, Missing attendance flag, Actions.
        </DocStep>
        <DocStep title="Fix missing attendance">
          Rows with missing attendance highlighted — link to attendance page to mark days before pay.
        </DocStep>
        <DocStep title="Pay an individual">
          Click <strong>Pay</strong> or <strong>Extra</strong> → modal: amount (NumberStepper),
          payment method, kind (REGULAR or EXTRA), note → confirm. Voucher created.
        </DocStep>
        <DocStep title="Bulk payroll">
          <strong>Bulk</strong> link → <code>/admin/expenses/payroll/bulk</code> — process many
          employees when amounts are verified.
        </DocStep>
        <DocStep title="Export CSV">
          Download payroll register for the selected month — also available on Reports page.
        </DocStep>
        <DocStep title="Open voucher">
          Click voucher link on payment row for print or audit.
        </DocStep>
      </DocSteps>

      <h2>Field reference — pay modal</h2>
      <table>
        <thead>
          <tr><th>Field</th><th>Required</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>Amount</td><td>Yes</td><td>Payment amount — NumberStepper control</td></tr>
          <tr><td>Payment method</td><td>Yes</td><td>Cash, bank transfer, etc.</td></tr>
          <tr><td>Payment kind</td><td>Yes</td><td>REGULAR (monthly salary) or EXTRA (bonus/adjustment)</td></tr>
          <tr><td>Note</td><td>No</td><td>Internal reference on voucher</td></tr>
        </tbody>
      </table>

      <h2>Field reference — table columns</h2>
      <table>
        <thead>
          <tr><th>Column</th><th>Meaning</th></tr>
        </thead>
        <tbody>
          <tr><td>Profile salary</td><td>Base salary from employee profile</td></tr>
          <tr><td>Earned</td><td>Calculated amount after attendance rules</td></tr>
          <tr><td>Opening</td><td>Balance brought forward</td></tr>
          <tr><td>Paid</td><td>Sum of payments this month</td></tr>
          <tr><td>Balance</td><td>Remaining owed or overpaid</td></tr>
          <tr><td>Missing attendance</td><td>Warning when days not marked</td></tr>
        </tbody>
      </table>

      <h2>What happens when</h2>
      <table>
        <thead>
          <tr><th>Event</th><th>Behavior</th></tr>
        </thead>
        <tbody>
          <tr><td>Payment recorded</td><td><code>recordPayrollPayment</code> — voucher + balance update</td></tr>
          <tr><td>EXTRA payment</td><td>Separate from regular monthly — tracked as EXTRA kind</td></tr>
          <tr><td>Archived year</td><td>Read-only banner; Pay buttons hidden without archived create</td></tr>
          <tr><td>CSV export</td><td><code>exportPayrollCsv(month)</code> downloads register</td></tr>
        </tbody>
      </table>

      <h2>Permissions</h2>
      <p>Part of <strong>Payments (EXPENSES)</strong> module.</p>
      <ul>
        <li><strong>Read</strong> — view payroll list and amounts</li>
        <li><strong>Create</strong> — Pay and Extra buttons (<code>useAyPermissions</code> gates UI)</li>
        <li><strong>Delete</strong> — void resulting vouchers on voucher page</li>
      </ul>
      <p>
        See <Link href="/docs/intro/admin/permissions">Permissions &amp; Staff Roles</Link>.
      </p>

      <DocCallout variant="tip" title="Attendance data">
        Mark teacher and staff attendance before running attendance-linked payroll. Unmarked days
        appear as warnings on payroll rows.
      </DocCallout>

      <h2>Common issues &amp; fixes</h2>
      <table>
        <thead>
          <tr><th>Symptom</th><th>Cause</th><th>Fix</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Earned amount zero</td>
            <td>No salary on profile</td>
            <td>Set salary on teacher/staff profile</td>
          </tr>
          <tr>
            <td>Missing attendance warning</td>
            <td>Days not marked</td>
            <td>Mark attendance before pay — link from row</td>
          </tr>
          <tr>
            <td>Pay button hidden</td>
            <td>No create permission</td>
            <td>Grant Payments create or archived create</td>
          </tr>
          <tr>
            <td>Balance not zero after pay</td>
            <td>Partial payment or extra owed</td>
            <td>Pay remaining balance or record EXTRA adjustment</td>
          </tr>
        </tbody>
      </table>

      <h2>Payment kind reference</h2>
      <table>
        <thead>
          <tr><th>Kind</th><th>Use when</th></tr>
        </thead>
        <tbody>
          <tr><td>REGULAR</td><td>Standard monthly salary payment</td></tr>
          <tr><td>EXTRA</td><td>Bonus, overtime, advance, or one-off adjustment</td></tr>
        </tbody>
      </table>

      <h2>Understanding earned vs profile salary</h2>
      <p>
        <strong>Profile salary</strong> is the contracted monthly amount on the employee record.{' '}
        <strong>Earned</strong> applies attendance rules when configured — unmarked days reduce
        earned. Always resolve <strong>Missing attendance</strong> flags before final pay. The{' '}
        <strong>Balance</strong> column shows what remains after payments recorded this month;
        negative balance may indicate overpayment requiring EXTRA adjustment review.
      </p>

      <h2>FAQ</h2>
      <DocFaq
        items={[
          {
            q: 'What is the difference between Pay and Extra?',
            a: 'Pay records REGULAR monthly salary. Extra records bonuses or one-off adjustments as EXTRA kind.',
          },
          {
            q: 'Are workers included?',
            a: 'Yes. Workers without login appear in payroll list for hourly or monthly worker pay.',
          },
          {
            q: 'Can I undo a payroll payment?',
            a: 'Void the voucher on the voucher detail page (requires Delete permission) — then record a correction if needed.',
          },
          {
            q: 'What is opening balance?',
            a: 'Amount carried from prior months — salary underpaid or overpaid from previous periods.',
          },
          {
            q: 'Does payroll include workers?',
            a: 'Yes. Workers without login appear in the list with type worker — pay via same Pay modal.',
          },
        ]}
      />

      <h2>API endpoints (reference)</h2>
      <table>
        <thead>
          <tr><th>Method</th><th>Endpoint</th><th>Purpose</th></tr>
        </thead>
        <tbody>
          <tr><td>GET</td><td><code>/admin/expenses/payroll?month=</code></td><td>List payees for month</td></tr>
          <tr><td>POST</td><td><code>/admin/expenses/payroll/pay</code></td><td>Record payment + voucher</td></tr>
          <tr><td>GET</td><td><code>/admin/expenses/payroll/export?month=</code></td><td>CSV download</td></tr>
        </tbody>
      </table>

      <h2>Navigation paths</h2>
      <table>
        <thead>
          <tr><th>Screen</th><th>URL</th></tr>
        </thead>
        <tbody>
          <tr><td>Payroll list</td><td><code>/admin/expenses/payroll</code></td></tr>
          <tr><td>Bulk pay</td><td><code>/admin/expenses/payroll/bulk</code></td></tr>
          <tr><td>Teacher attendance</td><td><code>/admin/attendance/teachers</code></td></tr>
          <tr><td>Staff attendance</td><td><code>/admin/attendance/staff</code></td></tr>
        </tbody>
      </table>

      <DocCallout variant="info" title="Bulk pay">
        Use bulk payroll only after reviewing every row individually once — bulk confirms all
        visible earned amounts in one run. Irreversible without voiding each resulting voucher.
      </DocCallout>

      <h2>Help &amp; documentation</h2>
      <p>
        Teacher salary defaults live on each <Link href="/docs/intro/admin/teachers">Teacher</Link>{' '}
        profile; worker pay may differ — verify type column in payroll list. Use EXTRA kind for
        bonuses not tied to monthly earned calculation. Bulk pay is appropriate only when every row
        has been individually verified for the selected month.
      </p>

      <p>
        Export payroll CSV from this page or from <Link href="/docs/intro/admin/expenses/reports">Reports</Link>{' '}
        — both call the same export endpoint for the selected month.
      </p>

      <h2>Related guides</h2>
      <ul>
        <li><Link href="/docs/intro/admin/expenses">Payments hub</Link></li>
        <li><Link href="/docs/intro/admin/expenses/vouchers">Vouchers</Link></li>
        <li><Link href="/docs/intro/admin/expenses/reports">Reports</Link></li>
        <li><Link href="/docs/intro/admin/teachers">Teachers</Link> — profile salary</li>
        <li><Link href="/docs/intro/admin/staff">Staff</Link> — workers and management</li>
        <li><Link href="/docs/intro/admin/attendance">Attendance</Link></li>
      </ul>
    </DocsShell>
  );
}
