import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep, DocFaq } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function AdminExpensesVouchersPage() {
  return (
    <DocsShell
      title="Payment Vouchers"
      subtitle="View, print, and void expense vouchers — audit trail for every outgoing payment."
      nav={introNav}
      variant="intro"
    >
      <h2>Overview</h2>
      <p>
        Every payroll, utility, and other payment creates a <strong>voucher</strong> — a numbered
        receipt with amount, payee, type, payment method, timestamp, and recording admin. Open a
        voucher from any expense list or directly at <code>/admin/expenses/vouchers/[id]</code> to
        print for filing or <strong>void</strong> if entered incorrectly.
      </p>
      <p>
        <strong>Why it exists:</strong> accountants and auditors need immutable payment records with
        a controlled void process — void keeps history with reason rather than hard delete.
      </p>
      <p>
        <strong>Who uses it:</strong> anyone with Payments <strong>Read</strong>. Void requires{' '}
        <strong>Delete</strong> permission on EXPENSES module.
      </p>

      <h2>Before you start</h2>
      <ul>
        <li>Locate voucher via payment row link or voucher number reference.</li>
        <li>Prepare void <strong>reason</strong> text before voiding — field is mandatory.</li>
        <li>Understand void is audit-marked, not erased — create new payment if money was actually paid.</li>
      </ul>

      <h2>Step-by-step: common workflows</h2>
      <DocSteps>
        <DocStep title="Open a voucher">
          From payroll, utilities, or others table → click voucher number/link on payment row. Or
          navigate directly if you have the voucher ID.
        </DocStep>
        <DocStep title="Review header">
          Voucher number, type (payroll / utility / other), status (PAID or VOID).
        </DocStep>
        <DocStep title="Read detail rows">
          Amount, payment method, paid at timestamp, recorded by admin, reference fields, note.
        </DocStep>
        <DocStep title="Review type-specific block">
          Payroll section shows payee and salary month. Utility shows provider and consumer number.
          Other shows payee and description.
        </DocStep>
        <DocStep title="Print or share">
          Browser print (<kbd>Ctrl+P</kbd> / <kbd>Cmd+P</kbd>) for physical filing.
        </DocStep>
        <DocStep title="Void a voucher">
          If status is PAID and you have Delete permission → <strong>Void</strong> section → enter
          reason → confirm. Status becomes VOID; reason stored permanently.
        </DocStep>
      </DocSteps>

      <h2>Field reference — voucher detail</h2>
      <table>
        <thead>
          <tr><th>Element</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>Voucher number</td><td>Unique sequential identifier</td></tr>
          <tr><td>Type</td><td>PAYROLL, UTILITY, or OTHER</td></tr>
          <tr><td>Status</td><td>PAID (active) or VOID (cancelled with reason)</td></tr>
          <tr><td>Amount</td><td>Payment amount</td></tr>
          <tr><td>Payment method</td><td>Cash, bank transfer, etc.</td></tr>
          <tr><td>Paid at</td><td>Timestamp of payment</td></tr>
          <tr><td>Recorded by</td><td>Admin who created the entry</td></tr>
          <tr><td>Reference / note</td><td>Bill reference or internal note</td></tr>
          <tr><td>Void reason</td><td>Shown when status is VOID</td></tr>
        </tbody>
      </table>

      <h2>What happens when</h2>
      <table>
        <thead>
          <tr><th>Event</th><th>Behavior</th></tr>
        </thead>
        <tbody>
          <tr><td>Payment recorded elsewhere</td><td>Voucher auto-created with PAID status</td></tr>
          <tr><td>Void confirmed</td><td><code>voidExpenseVoucher(id, reason)</code> — status VOID, reason saved</td></tr>
          <tr><td>Void without Delete permission</td><td>Void section hidden</td></tr>
          <tr><td>Already VOID</td><td>Void action unavailable</td></tr>
          <tr><td>Hub totals refresh</td><td>VOID payments excluded from active month totals</td></tr>
        </tbody>
      </table>

      <h2>Permissions</h2>
      <p>Part of <strong>Payments (EXPENSES)</strong> module:</p>
      <ul>
        <li><strong>Read</strong> — view voucher details and print</li>
        <li><strong>Delete</strong> — void PAID vouchers (<code>canDelete</code> gates Void button via <code>useAyPermissions</code>)</li>
      </ul>
      <p>
        See <Link href="/docs/intro/admin/permissions">Permissions &amp; Staff Roles</Link>.
      </p>

      <DocCallout variant="warn" title="Void is permanent">
        Voiding does not delete history — it marks the voucher inactive with your reason attached.
        Create a correcting payment entry if a new payment is actually needed.
      </DocCallout>

      <h2>Common issues &amp; fixes</h2>
      <table>
        <thead>
          <tr><th>Symptom</th><th>Cause</th><th>Fix</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Void button missing</td>
            <td>No delete permission</td>
            <td>Grant Payments delete to accountant role</td>
          </tr>
          <tr>
            <td>Already VOID</td>
            <td>Previously voided</td>
            <td>Record new payment if money was actually paid</td>
          </tr>
          <tr>
            <td>Cannot find voucher</td>
            <td>No list index page</td>
            <td>Open from payment row in payroll/utilities/others</td>
          </tr>
          <tr>
            <td>Print layout poor</td>
            <td>Browser print settings</td>
            <td>Use print preview; hide browser headers if needed</td>
          </tr>
        </tbody>
      </table>

      <h2>Voucher status lifecycle</h2>
      <table>
        <thead>
          <tr><th>Status</th><th>Meaning</th><th>Actions available</th></tr>
        </thead>
        <tbody>
          <tr><td>PAID</td><td>Active payment in ledger</td><td>Print, Void (if permitted)</td></tr>
          <tr><td>VOID</td><td>Cancelled with reason</td><td>View only — audit record</td></tr>
        </tbody>
      </table>

      <h2>FAQ</h2>
      <DocFaq
        items={[
          {
            q: 'Is there a voucher list page?',
            a: 'No dedicated index — open vouchers from payment rows in payroll, utilities, or others. Reports page documents voucher lookup.',
          },
          {
            q: 'Can I un-void a voucher?',
            a: 'No. Record a new payment if the void was a mistake and money was actually disbursed.',
          },
          {
            q: 'Who can see who voided a voucher?',
            a: 'Void reason and status are on the voucher detail — audit trail includes recording admin.',
          },
          {
            q: 'Do voided vouchers appear in CSV exports?',
            a: 'Typically marked VOID — verify export before submitting to external auditors.',
          },
          {
            q: 'Can accountants void without admin role?',
            a: 'Yes, if granted Payments Delete on the staff permission matrix — not limited to branch_admin.',
          },
          {
            q: 'What voucher types exist?',
            a: 'PAYROLL, UTILITY, and OTHER — type shown in header with type-specific detail block below.',
          },
        ]}
      />

      <h2>API endpoints (reference)</h2>
      <table>
        <thead>
          <tr><th>Method</th><th>Endpoint</th><th>Purpose</th></tr>
        </thead>
        <tbody>
          <tr><td>GET</td><td><code>/admin/expenses/vouchers/:id</code></td><td>Voucher detail</td></tr>
          <tr><td>POST</td><td><code>/admin/expenses/vouchers/:id/void</code></td><td>Void with reason body</td></tr>
        </tbody>
      </table>

      <h2>Navigation paths</h2>
      <table>
        <thead>
          <tr><th>Screen</th><th>URL</th></tr>
        </thead>
        <tbody>
          <tr><td>Voucher detail</td><td><code>/admin/expenses/vouchers/[id]</code></td></tr>
          <tr><td>From payroll row</td><td>Payroll → voucher link on payment</td></tr>
          <tr><td>From utility row</td><td>Utilities → voucher link on bill</td></tr>
          <tr><td>From others row</td><td>Others → voucher link on payment</td></tr>
        </tbody>
      </table>

      <DocCallout variant="warn" title="Void audit trail">
        Every void stores your reason permanently. Use clear descriptions e.g. &quot;Duplicate entry —
        correct payment recorded as voucher #1042&quot; for future audits.
      </DocCallout>

      <h2>Help &amp; documentation</h2>
      <p>
        Vouchers are the audit backbone of the Payments module. Every payroll, utility, and other
        payment generates one automatically. There is no standalone voucher search page — locate by
        payment row link or voucher number if known. Print for physical filing; void only with
        documented reason when entry was erroneous.
      </p>

      <h2>Step-by-step: void workflow</h2>
      <DocSteps>
        <DocStep title="Locate voucher">
          From payment row in payroll, utilities, or others — click voucher link.
        </DocStep>
        <DocStep title="Verify status is PAID">
          Already VOID vouchers cannot be voided again.
        </DocStep>
        <DocStep title="Enter reason">
          Mandatory — explain error e.g. duplicate entry, wrong amount.
        </DocStep>
        <DocStep title="Confirm void">
          Status becomes VOID — excluded from active hub totals.
        </DocStep>
        <DocStep title="Correct if needed">
          Record new payment with correct details if money actually left the branch.
        </DocStep>
      </DocSteps>

      <DocCallout variant="info" title="Print for filing">
        Voucher detail pages are print-friendly — use for physical audit binders alongside bank
        statements for the same payment date.
      </DocCallout>

      <h2>Related guides</h2>
      <ul>
        <li><Link href="/docs/intro/admin/expenses">Payments hub</Link></li>
        <li><Link href="/docs/intro/admin/expenses/payroll">Payroll</Link></li>
        <li><Link href="/docs/intro/admin/expenses/utilities">Utilities</Link></li>
        <li><Link href="/docs/intro/admin/expenses/others">Others</Link></li>
        <li><Link href="/docs/intro/admin/expenses/reports">Reports</Link></li>
        <li><Link href="/docs/intro/admin/permissions">Permissions</Link></li>
      </ul>
    </DocsShell>
  );
}
