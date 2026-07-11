import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep, DocFaq } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function AdminExpensesReportsPage() {
  return (
    <DocsShell
      title="Expense Reports"
      subtitle="Export CSV reports for payroll, utilities, and other payments."
      nav={introNav}
      variant="intro"
    >
      <h2>Overview</h2>
      <p>
        <strong>Expense Reports</strong> at <code>/admin/expenses/reports</code> lets you download
        branch outgoing data for accounting — payroll registers by month, utility bill lists by date
        range, and miscellaneous expense CSVs. Read permission on the Payments module is sufficient;
        no create access required.
      </p>
      <p>
        <strong>Why it exists:</strong> accountants and external auditors need machine-readable
        exports without manual copy from on-screen tables.
      </p>
      <p>
        <strong>Who uses it:</strong> branch admins and restricted staff with Payments{' '}
        <strong>Read</strong> permission.
      </p>

      <h2>Before you start</h2>
      <ul>
        <li>Know your reconciliation period (month for payroll, date range for utilities/others).</li>
        <li>Ensure payments are recorded and vouchers not voided incorrectly before export.</li>
        <li>CSV opens in Excel, Google Sheets, or accounting import tools.</li>
      </ul>

      <h2>Step-by-step: common workflows</h2>
      <DocSteps>
        <DocStep title="Open Reports">
          Payments hub → <strong>Reports &amp; Export</strong> card, or sidebar navigation to
          <code>/admin/expenses/reports</code>.
        </DocStep>
        <DocStep title="Export payroll">
          Payroll section → select <strong>month</strong> → click download. Calls{' '}
          <code>exportPayrollCsv(month)</code> — register of salary payments for that month.
        </DocStep>
        <DocStep title="Export utilities">
          Utilities section → set <strong>from</strong> and <strong>to</strong> dates → download.
          Calls <code>{'exportUtilitiesCsv({ from, to })'}</code>.
        </DocStep>
        <DocStep title="Export others">
          Others section → date range → separate download button. Calls{' '}
          <code>{'exportOthersCsv({ from, to })'}</code>.
        </DocStep>
        <DocStep title="Voucher lookup">
          Info section on page explains how to open individual vouchers by number from payment
          lists — see <Link href="/docs/intro/admin/expenses/vouchers">Vouchers</Link> guide.
        </DocStep>
        <DocStep title="Reconcile with hub">
          Compare CSV totals against <Link href="/docs/intro/admin/expenses">Payments hub</Link>{' '}
          summary cards for the same period.
        </DocStep>
      </DocSteps>

      <h2>Field reference — export controls</h2>
      <table>
        <thead>
          <tr><th>Export</th><th>Date control</th><th>API</th></tr>
        </thead>
        <tbody>
          <tr><td>Payroll CSV</td><td>Month picker (single month)</td><td><code>exportPayrollCsv(month)</code></td></tr>
          <tr><td>Utilities CSV</td><td>From date + To date</td><td><code>exportUtilitiesCsv</code></td></tr>
          <tr><td>Others CSV</td><td>From date + To date</td><td><code>exportOthersCsv</code></td></tr>
        </tbody>
      </table>

      <h2>What happens when</h2>
      <table>
        <thead>
          <tr><th>Event</th><th>Behavior</th></tr>
        </thead>
        <tbody>
          <tr><td>Download clicked</td><td>Browser downloads CSV file with branch-scoped rows</td></tr>
          <tr><td>VOID vouchers in range</td><td>Typically excluded or marked per export logic — verify with sample</td></tr>
          <tr><td>Empty date range</td><td>Validation may block download — set valid from/to</td></tr>
          <tr><td>No Read permission</td><td>Page inaccessible for restricted staff without EXPENSES read</td></tr>
        </tbody>
      </table>

      <h2>Permissions</h2>
      <p>Part of <strong>Payments (EXPENSES)</strong> module.</p>
      <ul>
        <li><strong>Read</strong> — sufficient for all exports on this page</li>
        <li><strong>Create / Update / Delete</strong> — not required for downloads</li>
      </ul>
      <p>
        Payroll CSV is also available from the <Link href="/docs/intro/admin/expenses/payroll">Payroll</Link>{' '}
        page export button.
      </p>
      <p>
        See <Link href="/docs/intro/admin/permissions">Permissions &amp; Staff Roles</Link>.
      </p>

      <DocCallout variant="tip" title="Monthly close">
        Export all three CSVs at month-end — payroll by month, utilities and others by calendar month
        date range — for your accountant&apos;s reconciliation package.
      </DocCallout>

      <h2>Common issues &amp; fixes</h2>
      <table>
        <thead>
          <tr><th>Symptom</th><th>Cause</th><th>Fix</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Download does nothing</td>
            <td>Pop-up blocked</td>
            <td>Allow downloads in browser</td>
          </tr>
          <tr>
            <td>Empty CSV</td>
            <td>No payments in range</td>
            <td>Widen date range or verify payments recorded</td>
          </tr>
          <tr>
            <td>Payroll CSV wrong month</td>
            <td>Month picker mismatch</td>
            <td>Re-select salary month before download</td>
          </tr>
          <tr>
            <td>Cannot access page</td>
            <td>No Payments read</td>
            <td>Grant EXPENSES read on staff matrix</td>
          </tr>
        </tbody>
      </table>

      <h2>CSV column expectations (typical)</h2>
      <table>
        <thead>
          <tr><th>Export</th><th>Typical columns</th></tr>
        </thead>
        <tbody>
          <tr><td>Payroll</td><td>Payee, type, month, amount, method, voucher #, date</td></tr>
          <tr><td>Utilities</td><td>Category, provider, amount, consumer #, voucher #, date</td></tr>
          <tr><td>Others</td><td>Category, payee, description, amount, voucher #, date</td></tr>
        </tbody>
      </table>

      <h2>FAQ</h2>
      <DocFaq
        items={[
          {
            q: 'Is there a combined all-expenses export?',
            a: 'Three separate CSVs — payroll, utilities, others. Combine in Excel if a single sheet is needed.',
          },
          {
            q: 'Do exports include voided vouchers?',
            a: 'Check export contents for VOID status column. Voided payments should not inflate active totals.',
          },
          {
            q: 'Can I schedule automatic exports?',
            a: 'Not in the UI — download manually or use API integration for automated reporting.',
          },
          {
            q: 'Which export for annual audit?',
            a: 'Run all three CSVs for the fiscal year date range. Cross-check totals against Payments hub monthly cards.',
          },
          {
            q: 'Do exports include voided payments?',
            a: 'Check CSV for VOID status column — exclude voided rows when summing for active ledger totals.',
          },
          {
            q: 'Can I export a single voucher?',
            a: 'Use browser print on voucher detail page — CSV exports are batch lists only.',
          },
        ]}
      />

      <h2>API endpoints (reference)</h2>
      <table>
        <thead>
          <tr><th>Method</th><th>Endpoint</th><th>Purpose</th></tr>
        </thead>
        <tbody>
          <tr><td>GET</td><td><code>/admin/expenses/payroll/export?month=</code></td><td>Payroll CSV</td></tr>
          <tr><td>GET</td><td><code>/admin/expenses/utilities/export?from=&amp;to=</code></td><td>Utilities CSV</td></tr>
          <tr><td>GET</td><td><code>/admin/expenses/others/export?from=&amp;to=</code></td><td>Others CSV</td></tr>
        </tbody>
      </table>

      <h2>Navigation paths</h2>
      <table>
        <thead>
          <tr><th>Screen</th><th>URL</th></tr>
        </thead>
        <tbody>
          <tr><td>Reports page</td><td><code>/admin/expenses/reports</code></td></tr>
          <tr><td>Payroll CSV</td><td>Same page → Payroll section</td></tr>
          <tr><td>Utilities CSV</td><td>Same page → date range + download</td></tr>
          <tr><td>Others CSV</td><td>Same page → separate download button</td></tr>
        </tbody>
      </table>

      <DocCallout variant="tip" title="Excel import">
        Open downloaded CSV in Excel with UTF-8 encoding. Date columns may need locale formatting
        before pivot tables — verify paid-at dates match your reconciliation period.
      </DocCallout>

      <h2>Help &amp; documentation</h2>
      <p>
        Reports require only Payments <strong>Read</strong> — safe to grant accountants without
        create/delete. Download payroll CSV by salary month; utilities and others by calendar date
        range. Combine the three files for complete outgoing ledger export. Hub summary cards should
        approximate CSV totals for the same period when voided vouchers are excluded.
      </p>

      <h2>Step-by-step: month-end export package</h2>
      <DocSteps>
        <DocStep title="Payroll CSV">
          Select closing salary month → download.
        </DocStep>
        <DocStep title="Utilities CSV">
          From = first day of month, To = last day → download.
        </DocStep>
        <DocStep title="Others CSV">
          Same date range as utilities → download.
        </DocStep>
        <DocStep title="Reconcile">
          Sum three files and compare to Payments hub Total card for that month.
        </DocStep>
      </DocSteps>

      <DocCallout variant="info" title="Date ranges">
        Utilities and Others exports use payment <em>paid at</em> dates — align from/to with your
        bank statement period for straightforward reconciliation.
      </DocCallout>

      <h2>Related guides</h2>
      <ul>
        <li><Link href="/docs/intro/admin/expenses">Payments hub</Link></li>
        <li><Link href="/docs/intro/admin/expenses/payroll">Payroll</Link></li>
        <li><Link href="/docs/intro/admin/expenses/utilities">Utilities</Link></li>
        <li><Link href="/docs/intro/admin/expenses/others">Others</Link></li>
        <li><Link href="/docs/intro/admin/expenses/vouchers">Vouchers</Link></li>
        <li><Link href="/docs/intro/admin/fees/reports">Fee Reports</Link> — incoming money (separate module)</li>
      </ul>
    </DocsShell>
  );
}
