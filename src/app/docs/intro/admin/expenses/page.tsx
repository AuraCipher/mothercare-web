import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep, DocFaq } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function AdminExpensesPage() {
  return (
    <DocsShell
      title="Payments (Expenses)"
      subtitle="Branch outgoing ledger — payroll, utilities, miscellaneous costs, and vouchers."
      nav={introNav}
      variant="intro"
    >
      <h2>Overview</h2>
      <p>
        The <strong>Payments</strong> hub at <code>/admin/expenses</code> (labeled{' '}
        <strong>Payments</strong> in the sidebar) tracks money leaving the branch — teacher and staff
        salaries, utility bills, maintenance, and miscellaneous costs. Each payment creates a numbered{' '}
        <strong>voucher</strong> for audit, print, and optional void with reason.
      </p>
      <p>
        <strong>Why it exists:</strong> schools need a unified outgoing ledger separate from fee
        collections (money in). Payroll ties to attendance; utilities track recurring bills; vouchers
        provide an audit trail for accountants.
      </p>
      <p>
        <strong>Who uses it:</strong> branch admins and restricted staff with the{' '}
        <strong>Payments (EXPENSES)</strong> module permission.
      </p>

      <h2>Before you start</h2>
      <ul>
        <li><strong>Branch selected</strong> — expenses are branch-scoped.</li>
        <li><strong>Teachers and staff</strong> profiles with salary for payroll.</li>
        <li><strong>Attendance marked</strong> if using attendance-based payroll calculations.</li>
        <li>Understand voucher lifecycle: PAID → optional VOID with reason.</li>
      </ul>

      <h2>Step-by-step: using the hub</h2>
      <DocSteps>
        <DocStep title="Open Payments hub">
          Sidebar → <strong>Payments</strong> → summary cards load via <code>getExpensesSummary()</code>.
        </DocStep>
        <DocStep title="Review summary cards">
          Month-to-date totals: <strong>Payroll</strong>, <strong>Utilities</strong>,{' '}
          <strong>Others</strong>, and <strong>Total</strong> grand sum.
        </DocStep>
        <DocStep title="Navigate sub-modules">
          Four cards: Pays (payroll), Utility Bills, Others, Reports &amp; Export.
        </DocStep>
        <DocStep title="Record an expense">
          Open relevant sub-module → fill payment form → save → voucher auto-created with link on row.
        </DocStep>
        <DocStep title="Audit a voucher">
          Click voucher link on any payment row → detail page with print and void options.
        </DocStep>
      </DocSteps>

      <h2>Module areas</h2>
      <table>
        <thead>
          <tr><th>Area</th><th>Doc guide</th><th>Purpose</th></tr>
        </thead>
        <tbody>
          <tr><td>Payroll</td><td><Link href="/docs/intro/admin/expenses/payroll">Payroll</Link></td><td>Teacher and staff salaries</td></tr>
          <tr><td>Utilities</td><td><Link href="/docs/intro/admin/expenses/utilities">Utilities</Link></td><td>Electricity, water, internet, etc.</td></tr>
          <tr><td>Others</td><td><Link href="/docs/intro/admin/expenses/others">Others</Link></td><td>Maintenance and misc</td></tr>
          <tr><td>Vouchers</td><td><Link href="/docs/intro/admin/expenses/vouchers">Vouchers</Link></td><td>Receipt detail and void</td></tr>
          <tr><td>Reports</td><td><Link href="/docs/intro/admin/expenses/reports">Reports</Link></td><td>CSV exports</td></tr>
        </tbody>
      </table>

      <h2>Field reference — hub summary cards</h2>
      <table>
        <thead>
          <tr><th>Card</th><th>Meaning</th></tr>
        </thead>
        <tbody>
          <tr><td>Payroll</td><td>Salary payments recorded this period</td></tr>
          <tr><td>Utilities</td><td>Utility bill payments this period</td></tr>
          <tr><td>Others</td><td>Miscellaneous expenses this period</td></tr>
          <tr><td>Total</td><td>Sum of all outgoing payments</td></tr>
        </tbody>
      </table>

      <h2>What happens when</h2>
      <table>
        <thead>
          <tr><th>Event</th><th>Behavior</th></tr>
        </thead>
        <tbody>
          <tr><td>Payment recorded</td><td>Voucher created with unique number; hub totals update on refresh</td></tr>
          <tr><td>Voucher voided</td><td>Status VOID; reason stored; payment excluded from active totals</td></tr>
          <tr><td>Archived year active</td><td>Read-only banner on sub-pages unless archived CRUD granted</td></tr>
          <tr><td>Payroll without attendance</td><td>Missing attendance highlighted on payroll rows</td></tr>
        </tbody>
      </table>

      <h2>Permissions</h2>
      <p>Module key: <strong>Payments (EXPENSES)</strong></p>
      <ul>
        <li><strong>Read</strong> — hub, lists, vouchers, CSV exports</li>
        <li><strong>Create</strong> — record payroll, utilities, other payments</li>
        <li><strong>Update</strong> — edit recent entries where UI allows</li>
        <li><strong>Delete</strong> — void vouchers (mandatory reason)</li>
      </ul>
      <p>
        See <Link href="/docs/intro/admin/permissions">Permissions &amp; Staff Roles</Link>.
      </p>

      <DocCallout variant="info" title="Attendance link">
        Payroll can calculate amounts from <Link href="/docs/intro/admin/attendance">Attendance</Link>{' '}
        when salary rules are attendance-based. Mark teacher and staff attendance before monthly pay.
      </DocCallout>

      <DocCallout variant="warn" title="Vouchers are permanent records">
        Voiding marks a voucher inactive but keeps audit history. Create a correcting payment if
        money was actually paid after a void.
      </DocCallout>

      <h2>Common issues &amp; fixes</h2>
      <table>
        <thead>
          <tr><th>Symptom</th><th>Cause</th><th>Fix</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Hub cards show zero</td>
            <td>No payments this month</td>
            <td>Normal on fresh branch — record first payment</td>
          </tr>
          <tr>
            <td>Cannot record payment</td>
            <td>No create permission</td>
            <td>Grant Payments create on staff matrix</td>
          </tr>
          <tr>
            <td>Totals do not match CSV</td>
            <td>VOID vouchers or date range</td>
            <td>Align export period with hub month; exclude voids</td>
          </tr>
          <tr>
            <td>Pay button hidden</td>
            <td>Archived year read-only</td>
            <td>Switch year or grant archived create</td>
          </tr>
        </tbody>
      </table>

      <h2>Month-end close checklist</h2>
      <DocSteps>
        <DocStep title="Complete attendance">
          Mark all teacher and staff days for the month.
        </DocStep>
        <DocStep title="Run payroll">
          Review earned amounts → pay or bulk pay → verify vouchers.
        </DocStep>
        <DocStep title="Record utilities">
          Enter all monthly bills with provider references.
        </DocStep>
        <DocStep title="Record misc">
          Others — any remaining outgoing payments.
        </DocStep>
        <DocStep title="Export CSVs">
          <Link href="/docs/intro/admin/expenses/reports">Reports</Link> — payroll + utilities + others.
        </DocStep>
        <DocStep title="Reconcile hub total">
          Hub grand total should match sum of category exports.
        </DocStep>
      </DocSteps>

      <h2>FAQ</h2>
      <DocFaq
        items={[
          {
            q: 'Why is the sidebar label Payments but URL is /expenses?',
            a: 'Historical naming — both refer to the same outgoing ledger module (EXPENSES key).',
          },
          {
            q: 'Do fee collections appear here?',
            a: 'No. Fees are money in — see Fees module. Payments tracks money out only.',
          },
          {
            q: 'Who can void a voucher?',
            a: 'Staff with Delete permission on EXPENSES module. Void requires a written reason.',
          },
          {
            q: 'How does payroll relate to fee collections?',
            a: 'They are separate ledgers. Fees track money in from parents; Payments track money out to staff and vendors.',
          },
          {
            q: 'What payment methods are supported?',
            a: 'Cash, bank transfer, and other methods configured in the payment modal — same across payroll, utilities, and others.',
          },
        ]}
      />

      <h2>API endpoints (reference)</h2>
      <table>
        <thead>
          <tr><th>Method</th><th>Endpoint</th><th>Purpose</th></tr>
        </thead>
        <tbody>
          <tr><td>GET</td><td><code>/admin/expenses/summary</code></td><td>Hub summary cards</td></tr>
          <tr><td>GET</td><td><code>/admin/expenses/payroll</code></td><td>Monthly payroll list</td></tr>
          <tr><td>POST</td><td><code>/admin/expenses/payroll/pay</code></td><td>Record salary payment</td></tr>
          <tr><td>POST</td><td><code>/admin/expenses/utilities</code></td><td>Record utility bill</td></tr>
          <tr><td>POST</td><td><code>/admin/expenses/others</code></td><td>Record misc payment</td></tr>
          <tr><td>POST</td><td><code>/admin/expenses/vouchers/:id/void</code></td><td>Void voucher with reason</td></tr>
        </tbody>
      </table>

      <h2>Navigation paths</h2>
      <table>
        <thead>
          <tr><th>Screen</th><th>URL</th></tr>
        </thead>
        <tbody>
          <tr><td>Payments hub</td><td><code>/admin/expenses</code></td></tr>
          <tr><td>Payroll</td><td><code>/admin/expenses/payroll</code></td></tr>
          <tr><td>Utilities</td><td><code>/admin/expenses/utilities</code></td></tr>
          <tr><td>Others</td><td><code>/admin/expenses/others</code></td></tr>
          <tr><td>Reports</td><td><code>/admin/expenses/reports</code></td></tr>
        </tbody>
      </table>

      <DocCallout variant="info" title="Hub refresh">
        Summary cards on the Payments hub load on page visit — record payments in sub-modules then
        return to the hub to see updated month-to-date totals.
      </DocCallout>

      <h2>Help &amp; documentation</h2>
      <p>
        The sidebar label <strong>Payments</strong> maps to module key <code>EXPENSES</code> in the
        staff permission matrix. When delegating to an accountant, grant Payments read + create;
        grant delete only if they must void vouchers. Cross-link this module with{' '}
        <Link href="/docs/intro/admin/attendance">Attendance</Link> documentation — payroll accuracy
        depends on marked teacher and staff days each month.
      </p>

      <h2>Related guides</h2>
      <ul>
        <li><Link href="/docs/intro/admin/expenses/payroll">Payroll</Link></li>
        <li><Link href="/docs/intro/admin/expenses/utilities">Utility Bills</Link></li>
        <li><Link href="/docs/intro/admin/expenses/others">Other Expenses</Link></li>
        <li><Link href="/docs/intro/admin/expenses/vouchers">Vouchers</Link></li>
        <li><Link href="/docs/intro/admin/expenses/reports">Reports</Link></li>
        <li><Link href="/docs/intro/admin/attendance">Attendance</Link></li>
      </ul>
    </DocsShell>
  );
}
