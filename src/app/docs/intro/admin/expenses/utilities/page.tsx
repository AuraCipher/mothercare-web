import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep, DocFaq } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function AdminExpensesUtilitiesPage() {
  return (
    <DocsShell
      title="Utility Bills"
      subtitle="Record electricity, water, gas, internet, and recurring branch utility payments."
      nav={introNav}
      variant="intro"
    >
      <h2>Overview</h2>
      <p>
        <strong>Utility Bills</strong> at <code>/admin/expenses/utilities</code> tracks recurring
        branch costs — electricity, water, gas, internet, and similar. Manage categories, saved
        providers for quick entry, bill reminders, and payment records each linked to a{' '}
        <Link href="/docs/intro/admin/expenses/vouchers">voucher</Link>.
      </p>
      <p>
        <strong>Why it exists:</strong> utilities are predictable monthly outflows that need
        category tracking, provider memory, and reminder alerts before due dates.
      </p>
      <p>
        <strong>Who uses it:</strong> branch admins and restricted staff with Payments module access.
        Create permission required to record new bills.
      </p>

      <h2>Before you start</h2>
      <ul>
        <li>Create <strong>utility categories</strong> if defaults are insufficient.</li>
        <li>Optional: save frequent <strong>providers</strong> to duplicate last bill quickly.</li>
        <li>Configure <strong>reminder day of month</strong> for upcoming bill alerts.</li>
      </ul>

      <h2>Step-by-step: common workflows</h2>
      <DocSteps>
        <DocStep title="Review reminders">
          <strong>Bill reminders</strong> panel shows upcoming due utilities based on saved
          reminder days.
        </DocStep>
        <DocStep title="Manage categories">
          Categories manager — add types like Electricity, Water, Gas, Internet.
        </DocStep>
        <DocStep title="Use saved providers">
          Pick a saved provider to pre-fill name and duplicate last bill amounts via{' '}
          <strong>duplicate last bill</strong> action.
        </DocStep>
        <DocStep title="Record a bill payment">
          <strong>Record bill</strong> modal → category*, provider name*, amount, payment kind,
          payment method, consumer number, bill reference, optional save provider checkbox → save.
          Voucher link appears on table row.
        </DocStep>
        <DocStep title="Audit payments">
          Bills table lists history with voucher links — open for print or void.
        </DocStep>
        <DocStep title="Check hub total">
          <Link href="/docs/intro/admin/expenses">Payments hub</Link> utilities card shows
          month-to-date spend.
        </DocStep>
      </DocSteps>

      <h2>Field reference — record bill modal</h2>
      <table>
        <thead>
          <tr><th>Field</th><th>Required</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>Category</td><td>Yes</td><td>Utility type from categories list</td></tr>
          <tr><td>Provider name</td><td>Yes</td><td>Company name e.g. K-Electric, PTCL</td></tr>
          <tr><td>Saved provider</td><td>No</td><td>Pre-fill from saved providers</td></tr>
          <tr><td>Save provider</td><td>No</td><td>Checkbox to remember provider for next time</td></tr>
          <tr><td>Reminder day of month</td><td>No</td><td>Day for upcoming bill alert</td></tr>
          <tr><td>Amount</td><td>Yes</td><td>Bill payment amount</td></tr>
          <tr><td>Payment kind / method</td><td>Yes</td><td>How payment was made</td></tr>
          <tr><td>Consumer number</td><td>No</td><td>Account/reference on utility bill</td></tr>
          <tr><td>Bill reference</td><td>No</td><td>Invoice or receipt number</td></tr>
        </tbody>
      </table>

      <h2>What happens when</h2>
      <table>
        <thead>
          <tr><th>Event</th><th>Behavior</th></tr>
        </thead>
        <tbody>
          <tr><td>Bill recorded</td><td>Voucher created; utilities total on hub increases</td></tr>
          <tr><td>Provider saved</td><td>Appears in saved providers for quick duplicate</td></tr>
          <tr><td>Duplicate last bill</td><td>Pre-fills amount and fields from previous payment</td></tr>
          <tr><td>Archived year</td><td>Read-only banner; record disabled without archived create</td></tr>
        </tbody>
      </table>

      <h2>Permissions</h2>
      <p>Part of <strong>Payments (EXPENSES)</strong> module — same CRUD as other expense types.</p>
      <ul>
        <li><strong>Read</strong> — view bills, reminders, providers</li>
        <li><strong>Create</strong> — record bill, create categories</li>
        <li><strong>Delete</strong> — void voucher from voucher page</li>
      </ul>
      <p>
        See <Link href="/docs/intro/admin/permissions">Permissions &amp; Staff Roles</Link>.
      </p>

      <DocCallout variant="tip" title="Saved providers">
        Save K-Electric, gas, and internet providers once — use duplicate last bill for fast monthly
        entry when amounts are similar.
      </DocCallout>

      <h2>Common issues &amp; fixes</h2>
      <table>
        <thead>
          <tr><th>Symptom</th><th>Cause</th><th>Fix</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>No categories in dropdown</td>
            <td>Fresh branch</td>
            <td>Create categories via manager on page</td>
          </tr>
          <tr>
            <td>Reminder not showing</td>
            <td>reminderDayOfMonth not set</td>
            <td>Set on provider when saving bill</td>
          </tr>
          <tr>
            <td>Duplicate wrong amount</td>
            <td>Last bill was unusual</td>
            <td>Edit amount manually after duplicate</td>
          </tr>
          <tr>
            <td>Record bill disabled</td>
            <td>Archived year</td>
            <td>Grant archived create or switch year</td>
          </tr>
        </tbody>
      </table>

      <h2>Suggested utility categories</h2>
      <ul>
        <li>Electricity</li>
        <li>Gas</li>
        <li>Water / sewerage</li>
        <li>Internet / broadband</li>
        <li>Mobile / landline</li>
        <li>Waste management</li>
        <li>Generator fuel</li>
      </ul>

      <h2>FAQ</h2>
      <DocFaq
        items={[
          {
            q: 'Can I set recurring auto-payments?',
            a: 'Reminders alert you on reminder day of month. You still record each payment manually when paid.',
          },
          {
            q: 'Where do I export utilities data?',
            a: 'Reports page — date range CSV export for utilities.',
          },
          {
            q: 'Should rent go under utilities?',
            a: 'If recurring monthly, utilities category works. One-off rent deposits may fit Others better.',
          },
          {
            q: 'How do reminders work?',
            a: 'Based on reminderDayOfMonth saved with provider — panel shows bills due around that day each month.',
          },
          {
            q: 'Can one provider have multiple categories?',
            a: 'Provider name is free text per bill — same company can pay electricity and gas under different categories.',
          },
          {
            q: 'Where do utility totals appear?',
            a: 'Payments hub Utilities card and monthly CSV export on Reports page.',
          },
        ]}
      />

      <h2>API endpoints (reference)</h2>
      <table>
        <thead>
          <tr><th>Method</th><th>Endpoint</th><th>Purpose</th></tr>
        </thead>
        <tbody>
          <tr><td>GET</td><td><code>/admin/expenses/utilities/bills</code></td><td>List bill payments</td></tr>
          <tr><td>POST</td><td><code>/admin/expenses/utilities/bills</code></td><td>Record new bill</td></tr>
          <tr><td>GET</td><td><code>/admin/expenses/utilities/categories</code></td><td>Category list</td></tr>
          <tr><td>GET</td><td><code>/admin/expenses/utilities/providers</code></td><td>Saved providers</td></tr>
          <tr><td>GET</td><td><code>/admin/expenses/utilities/reminders</code></td><td>Upcoming reminders</td></tr>
        </tbody>
      </table>

      <h2>Navigation paths</h2>
      <table>
        <thead>
          <tr><th>Screen</th><th>URL</th></tr>
        </thead>
        <tbody>
          <tr><td>Utilities list</td><td><code>/admin/expenses/utilities</code></td></tr>
          <tr><td>Record bill modal</td><td>Same page → Record bill button</td></tr>
          <tr><td>Hub summary</td><td><code>/admin/expenses</code></td></tr>
          <tr><td>Export</td><td><code>/admin/expenses/reports</code></td></tr>
        </tbody>
      </table>

      <DocCallout variant="tip" title="Provider memory">
        After paying K-Electric or your gas vendor once with <strong>Save provider</strong> checked,
        next month use <strong>duplicate last bill</strong> and adjust only the amount — saves data
        entry time on recurring bills.
      </DocCallout>

      <h2>Help &amp; documentation</h2>
      <p>
        Utility categories are branch-specific — set up once per campus. Saved providers remember
        consumer numbers and typical amounts. Bill reminders surface on this page before due dates
        when <code>reminderDayOfMonth</code> is configured. For annual audits, export utilities CSV
        from <Link href="/docs/intro/admin/expenses/reports">Reports</Link> with fiscal year dates.
      </p>

      <h2>Step-by-step: first utility setup</h2>
      <DocSteps>
        <DocStep title="Create categories">
          Add Electricity, Gas, Water, Internet at minimum before first bill entry.
        </DocStep>
        <DocStep title="Record first bill">
          Full form with save provider checked — establishes reminder baseline.
        </DocStep>
        <DocStep title="Next month">
          Select saved provider → duplicate last bill → adjust amount from new invoice.
        </DocStep>
        <DocStep title="Month-end">
          Export utilities CSV from Reports for accountant reconciliation.
        </DocStep>
      </DocSteps>

      <DocCallout variant="info" title="Consumer numbers">
        Store electricity and gas consumer numbers when saving providers — speeds duplicate entry and
        helps auditors match vouchers to physical bills.
      </DocCallout>

      <h2>Related guides</h2>
      <ul>
        <li><Link href="/docs/intro/admin/expenses">Payments hub</Link></li>
        <li><Link href="/docs/intro/admin/expenses/vouchers">Vouchers</Link></li>
        <li><Link href="/docs/intro/admin/expenses/reports">Reports</Link></li>
        <li><Link href="/docs/intro/admin/expenses/others">Other Expenses</Link></li>
      </ul>
    </DocsShell>
  );
}
