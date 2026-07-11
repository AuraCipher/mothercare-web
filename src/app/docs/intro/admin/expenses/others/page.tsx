import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep, DocFaq } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function AdminExpensesOthersPage() {
  return (
    <DocsShell
      title="Other Expenses"
      subtitle="Maintenance, repairs, events, and miscellaneous branch payments."
      nav={introNav}
      variant="intro"
    >
      <h2>Overview</h2>
      <p>
        <strong>Other Expenses</strong> at <code>/admin/expenses/others</code> captures one-off or
        non-utility spending — building repairs, supplies, events, professional services, and any
        outgoing payment that is not payroll or a standard utility bill. Each entry creates a{' '}
        <Link href="/docs/intro/admin/expenses/vouchers">voucher</Link> in the branch ledger.
      </p>
      <p>
        <strong>Why it exists:</strong> not all campus spending fits payroll or utility categories.
        Others provides flexible categorization for miscellaneous outflows.
      </p>
      <p>
        <strong>Who uses it:</strong> branch admins and restricted staff with Payments module
        <strong> Create</strong> permission.
      </p>

      <h2>Before you start</h2>
      <ul>
        <li>Define <strong>expense categories</strong> relevant to your campus (Maintenance, Events, etc.).</li>
        <li>Have payee name and amount ready before recording.</li>
      </ul>

      <h2>Step-by-step: common workflows</h2>
      <DocSteps>
        <DocStep title="Manage categories">
          Categories manager at top — add labels for your misc expense types.
        </DocStep>
        <DocStep title="Record a payment">
          <strong>Record payment</strong> modal → category*, payee name*, description, amount,
          payment kind, payment method → save. Row appears in payments table with voucher link.
        </DocStep>
        <DocStep title="Review history">
          Payments table — sort/filter by date. Click voucher for detail or print.
        </DocStep>
        <DocStep title="Export for accounts">
          <Link href="/docs/intro/admin/expenses/reports">Reports</Link> → Others CSV with date range.
        </DocStep>
        <DocStep title="Void if entered in error">
          Open voucher → void with reason (requires Delete permission).
        </DocStep>
      </DocSteps>

      <h2>Field reference — record payment modal</h2>
      <table>
        <thead>
          <tr><th>Field</th><th>Required</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>Category</td><td>Yes</td><td>From others categories list</td></tr>
          <tr><td>Payee name</td><td>Yes</td><td>Vendor or recipient name</td></tr>
          <tr><td>Description</td><td>No</td><td>What the payment was for</td></tr>
          <tr><td>Amount</td><td>Yes</td><td>Payment amount</td></tr>
          <tr><td>Payment kind</td><td>Yes</td><td>Payment classification</td></tr>
          <tr><td>Payment method</td><td>Yes</td><td>Cash, bank, etc.</td></tr>
        </tbody>
      </table>

      <h2>What happens when</h2>
      <table>
        <thead>
          <tr><th>Event</th><th>Behavior</th></tr>
        </thead>
        <tbody>
          <tr><td>Payment saved</td><td>Voucher created; Others total on hub updates</td></tr>
          <tr><td>Category created</td><td>Available in record payment dropdown</td></tr>
          <tr><td>Voucher voided</td><td>Payment excluded from active totals; audit trail kept</td></tr>
          <tr><td>Archived year</td><td>Record disabled without archived create permission</td></tr>
        </tbody>
      </table>

      <h2>Permissions</h2>
      <p>Part of <strong>Payments (EXPENSES)</strong> module.</p>
      <ul>
        <li><strong>Read</strong> — view payments table and categories</li>
        <li><strong>Create</strong> — record payments, create categories</li>
        <li><strong>Delete</strong> — void vouchers</li>
      </ul>
      <p>
        See <Link href="/docs/intro/admin/permissions">Permissions &amp; Staff Roles</Link>.
      </p>

      <DocCallout variant="info" title="Use utilities for recurring bills">
        Electricity, water, and internet belong under <Link href="/docs/intro/admin/expenses/utilities">Utilities</Link>{' '}
        for provider memory and reminders. Use Others for one-off misc spending.
      </DocCallout>

      <h2>Common issues &amp; fixes</h2>
      <table>
        <thead>
          <tr><th>Symptom</th><th>Cause</th><th>Fix</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Category missing</td>
            <td>Not created yet</td>
            <td>Add via categories manager</td>
          </tr>
          <tr>
            <td>Wrong amount recorded</td>
            <td>Data entry error</td>
            <td>Void voucher → record correct payment</td>
          </tr>
          <tr>
            <td>Payment in wrong month hub</td>
            <td>Paid at date vs hub month</td>
            <td>Hub uses payment date — verify paid at on voucher</td>
          </tr>
        </tbody>
      </table>

      <h2>Suggested other categories</h2>
      <ul>
        <li>Building maintenance</li>
        <li>Repairs &amp; plumbing</li>
        <li>Office supplies</li>
        <li>Events &amp; functions</li>
        <li>Professional services</li>
        <li>Transport / fuel</li>
        <li>Security services</li>
      </ul>

      <h2>FAQ</h2>
      <DocFaq
        items={[
          {
            q: 'Should I put supplier payments here?',
            a: 'Canteen supplier payments go in Canteen module. Generic vendor payments fit Others.',
          },
          {
            q: 'Can I edit a payment after saving?',
            a: 'Limited update support — void the voucher and record a correcting entry if amount was wrong.',
          },
          {
            q: 'Should petty cash expenses go here?',
            a: 'Yes. Create a Petty Cash category under Others for small daily outflows.',
          },
          {
            q: 'Can I attach a receipt image?',
            a: 'Not on this screen — store physical receipts separately; use description and voucher print for audit.',
          },
          {
            q: 'How is Others total calculated on hub?',
            a: 'Sum of non-void other payments in the current month — refresh hub after recording.',
          },
          {
            q: 'Should exam paper printing go here?',
            a: 'Yes — use Supplies or Events category with description noting exam session name.',
          },
        ]}
      />

      <h2>API endpoints (reference)</h2>
      <table>
        <thead>
          <tr><th>Method</th><th>Endpoint</th><th>Purpose</th></tr>
        </thead>
        <tbody>
          <tr><td>GET</td><td><code>/admin/expenses/others/payments</code></td><td>List misc payments</td></tr>
          <tr><td>POST</td><td><code>/admin/expenses/others/payments</code></td><td>Record payment</td></tr>
          <tr><td>GET</td><td><code>/admin/expenses/others/categories</code></td><td>Category list</td></tr>
          <tr><td>POST</td><td><code>/admin/expenses/others/categories</code></td><td>Create category</td></tr>
        </tbody>
      </table>

      <h2>Navigation paths</h2>
      <table>
        <thead>
          <tr><th>Screen</th><th>URL</th></tr>
        </thead>
        <tbody>
          <tr><td>Payments hub</td><td><code>/admin/expenses</code></td></tr>
          <tr><td>Record payment</td><td><code>/admin/expenses/others</code> → Record payment modal</td></tr>
          <tr><td>Voucher from row</td><td><code>/admin/expenses/vouchers/[id]</code></td></tr>
          <tr><td>CSV export</td><td><code>/admin/expenses/reports</code> → Others download</td></tr>
        </tbody>
      </table>

      <DocCallout variant="tip" title="Category hygiene">
        Keep Others categories broad but distinct from Utilities. Overlapping labels (e.g. both
        having &quot;Maintenance&quot;) make month-end CSV reconciliation harder for accountants.
      </DocCallout>

      <h2>Help &amp; documentation</h2>
      <p>
        Others is the catch-all for spending that is neither salary nor recurring utility. Examples:
        furniture repair, exam paper printing, sports equipment, guest speaker honoraria. Each entry
        should have a clear payee name and description — auditors rely on voucher detail months
        later. Void incorrect entries rather than deleting history.
      </p>

      <h2>Step-by-step: record misc payment</h2>
      <DocSteps>
        <DocStep title="Pick or create category">
          e.g. Maintenance, Events, Supplies — keeps reports grouped.
        </DocStep>
        <DocStep title="Enter payee and description">
          Vendor name plus what was purchased — visible on voucher print.
        </DocStep>
        <DocStep title="Amount and method">
          Match physical payment — cash or bank as actually disbursed.
        </DocStep>
        <DocStep title="Save and verify voucher">
          Open voucher link — print if physical filing required.
        </DocStep>
      </DocSteps>

      <h2>Typical others payments by school</h2>
      <table>
        <thead>
          <tr><th>Category</th><th>Examples</th></tr>
        </thead>
        <tbody>
          <tr><td>Maintenance</td><td>Plumbing, painting, AC repair</td></tr>
          <tr><td>Events</td><td>Sports day, prize distribution, guest fees</td></tr>
          <tr><td>Supplies</td><td>Office stationery not sold to students</td></tr>
          <tr><td>Transport</td><td>Bus fuel, driver meals on trips</td></tr>
          <tr><td>Professional</td><td>Legal, audit, consultancy fees</td></tr>
        </tbody>
      </table>

      <p>
        Petty cash reimbursements and small vendor payments without formal utility contracts belong
        here — not under Utilities or Payroll.
      </p>

      <DocCallout variant="warn" title="Avoid double entry">
        Do not record the same physical payment in both Utilities and Others — pick the module that
        matches the expense type for cleaner category reports.
      </DocCallout>

      <h2>Related guides</h2>
      <ul>
        <li><Link href="/docs/intro/admin/expenses">Payments hub</Link></li>
        <li><Link href="/docs/intro/admin/expenses/vouchers">Vouchers</Link></li>
        <li><Link href="/docs/intro/admin/expenses/reports">Reports</Link></li>
        <li><Link href="/docs/intro/admin/expenses/utilities">Utilities</Link></li>
      </ul>
    </DocsShell>
  );
}
