import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep, DocTable, DocSection, DocFaq } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function AdminFeesCollectionsPage() {
  return (
    <DocsShell
      title="Fee Collections"
      subtitle="Daily cashier operations — find students, record payments, filter by class and status, and track outstanding dues."
      nav={introNav}
      variant="intro"
    >
      <DocSection title="Overview">
        <p>
          <strong>Collections</strong> (<code>/admin/fees/collections</code>) is the front-desk screen for fee
          collection. It lists every student with generated fees for the selected period, shows paid / partial /
          unpaid status, and opens payment modals to record cash, bank, or other methods.
        </p>
        <p>
          <strong>Who uses it:</strong> fees clerks, accountants, and branch admins with <strong>FEES</strong> module
          access. Restricted staff need at least <strong>Read</strong> to view; <strong>Create</strong> to record payments.
        </p>
      </DocSection>

      <DocSection title="Before you start">
        <ul>
          <li>Select correct <strong>branch</strong> and <strong>academic year</strong> in the admin header</li>
          <li>Fees must be <strong>generated</strong> for the month (or full year view) — see{' '}
            <Link href="/docs/intro/admin/fees">Fees overview</Link> and Generate</li>
          <li>Students must be enrolled in classes for the active year</li>
          <li>For family bulk pay, siblings must be linked under a family — see{' '}
            <Link href="/docs/intro/admin/fees/families">Families</Link></li>
        </ul>
      </DocSection>

      <DocSection title="Screen layout">
        <DocTable
          headers={['Area', 'Controls', 'Purpose']}
          rows={[
            ['Top right', 'Monthly / Full AY toggle', 'Switch between single-month view and whole-year rollup'],
            ['Top right (monthly)', 'Month dropdown + Year input', 'Pick billing period (Jan–Dec)'],
            ['Filter bar', 'Search by name or roll', 'Debounced text search across student list'],
            ['Filter bar', 'Father name or phone', 'Find students by guardian contact'],
            ['Filter bar', 'Roll no', 'Exact roll filter'],
            ['Filter bar', 'All Classes dropdown', 'Limit to one section/group'],
            ['Filter bar', 'Fee status dropdown', 'Paid, partial, unpaid, no fee, etc.'],
            ['Filter bar', 'Class-wise / Alphabetical', 'Sort order for walking the roster'],
            ['Summary strip', 'Count, Total due, Collected, Outstanding', 'Quick totals for current filter'],
            ['Table rows', 'Click student row', 'Opens Student payment modal'],
            ['Family icon / actions', 'Family pay', 'Pay all siblings in one transaction when configured'],
          ]}
        />
      </DocSection>

      <DocSection title="Record a student payment (step-by-step)">
        <DocSteps>
          <DocStep title="Set period">
            Choose <strong>Monthly</strong> and pick month/year, or <strong>Full AY</strong> for year-to-date view.
            Your choice is saved in the browser (<code>collectionsPeriod</code>).
          </DocStep>
          <DocStep title="Find the student">
            Use class filter, roll number, or name search. Wait ~350ms after typing for search to apply.
          </DocStep>
          <DocStep title="Click the student row">
            The <strong>Student payment</strong> modal opens showing net amount, paid so far, and balance.
          </DocStep>
          <DocStep title="Enter payment details">
            Fill amount received, payment method (cash, bank, etc.), optional reference/notes. Amount cannot exceed
            balance unless your process allows advance (follow school policy).
          </DocStep>
          <DocStep title="Confirm">
            On success, the row updates to paid or partial. A receipt may be printable depending on configuration.
            Student&apos;s mobile <strong>Fees</strong> system room may receive a notification.
          </DocStep>
        </DocSteps>
      </DocSection>

      <DocSection title="Fee status meanings">
        <DocTable
          headers={['Status', 'Meaning']}
          rows={[
            ['Paid', 'Net amount fully collected'],
            ['Partial', 'Some payment received; balance remains'],
            ['Unpaid', 'Generated fee with zero payment'],
            ['No fee', 'No fee record for this period (not generated or not applicable)'],
            ['Est. (Full AY)', 'Projected amount for months not yet generated — informational only'],
          ]}
        />
      </DocSection>

      <DocSection title="What happens when you record a payment">
        <ul>
          <li>API creates a payment record linked to the student fee line</li>
          <li><code>paidAmount</code> increases; status recalculates to partial or paid</li>
          <li>Collections list refreshes; summary totals update</li>
          <li>Reports and analytics modules see the new collection on next load</li>
          <li>Student app Fees panel may show updated balance after sync</li>
        </ul>
      </DocSection>

      <DocSection title="Archived academic year">
        <p>
          Yellow banner: <em>Viewing an archived academic year. Payments are read-only.</em> You can review history
          but not post new collections unless archive write rules explicitly allow it.
        </p>
      </DocSection>

      <DocSection title="Permissions (FEES module)">
        <DocTable
          headers={['Action', 'Permission needed']}
          rows={[
            ['View collections list', 'FEES → Read'],
            ['Record payment', 'FEES → Create'],
            ['Edit/void payment (if available)', 'FEES → Update / Delete'],
            ['Navigate to Generate', 'FEES → Create on generate route'],
          ]}
        />
        <p>
          See <Link href="/docs/intro/admin/permissions">Permissions & Staff Roles</Link>.
        </p>
      </DocSection>

      <DocSection title="Empty states">
        <ul>
          <li><strong>No fees generated for [month]</strong> — click <strong>Generate Now</strong> to go to fee generation</li>
          <li><strong>No students match status</strong> — clear fee status filter or change month</li>
          <li><strong>Failed to load collections</strong> — check token, academic year, and API connectivity</li>
        </ul>
      </DocSection>

      <DocSection title="Student fee detail (from Collections)">
        <p>Clicking a student name opens <code>/admin/fees/student/[id]</code> with extended tools:</p>
        <DocTable
          headers={['Element', 'Description']}
          rows={[
            ['Back to Collections', 'Return to list'],
            ['Carry Old Dues', 'Move archived AY balance to current month — not archived years only'],
            ['Pay via Family', 'If student in family — opens family payment flow'],
            ['Pay Now', 'Same Record Payment modal as Collections Pay button'],
            ['Add Item', 'Extra Due or Stationary on a fee month'],
            ['Fee History', 'Expandable rows — fee head breakdown, extra items with delete'],
            ['Payment History', 'Date, Receipt, Month, Amount, Method, Print/Download'],
          ]}
        />
        <p>
          Archived banner on detail: <em>This academic year is archived. New payments cannot be recorded.</em>
        </p>
      </DocSection>

      <DocSection title="Payment methods">
        <DocTable
          headers={['Method', 'Reference field', 'Typical use']}
          rows={[
            ['Cash', 'Optional', 'Counter collection'],
            ['Cheque', 'Cheque #', 'Post-dated or current cheques'],
            ['Bank Transfer', 'Transaction ID', 'Online transfers, mobile wallets'],
          ]}
        />
        <p>All methods flow through the same allocate → receipt pipeline regardless of method.</p>
      </DocSection>

      <DocSection title="Interpreting collection status badges">
        <DocTable
          headers={['Badge', 'Meaning', 'Action']}
          rows={[
            ['PAID', 'Due fully cleared for filtered period', 'No Pay button'],
            ['PARTIAL', 'Some payment recorded, balance remains', 'Pay for remainder'],
            ['OVERPAID', 'Paid more than due', 'Review allocations; may apply to future months'],
            ['UNPAID', 'Generated fee, zero payment', 'Pay or follow up'],
            ['NO_FEE / Not generated', 'No StudentFee row for month', 'Generate or run monthly generation'],
          ]}
        />
      </DocSection>

      <DocSection title="Family pay from Collections">
        <DocSteps>
          <DocStep title="Identify family students">
            Family badge on name column links to family detail.
          </DocStep>
          <DocStep title="Click Family in Action column">
            Opens <strong>Family Payment</strong> modal with per-sibling due breakdown.
          </DocStep>
          <DocStep title="Allocate across siblings">
            Same as <Link href="/docs/intro/admin/fees/families">Families</Link> allocate workflow — one receipt,
            multiple students.
          </DocStep>
        </DocSteps>
      </DocSection>

      <DocSection title="API reference">
        <DocTable
          headers={['Endpoint', 'When']}
          rows={[
            ['GET /admin/fees/students-list', 'Main list with all filters and pagination'],
            ['GET /admin/branches/.../sections', 'Class dropdown options'],
            ['GET /admin/students/:id/fee', 'Student detail and pay modal preview'],
            ['POST /admin/payments/allocate', 'Confirm student payment'],
            ['POST /admin/family-payments/allocate', 'Confirm family payment'],
          ]}
        />
      </DocSection>

      <DocSection title="Troubleshooting">
        <DocFaq
          items={[
            {
              q: 'Pay button not visible',
              a: 'Year is archived, student has no fee (NO_FEE), or balance is zero. Switch to active year or generate fees first.',
            },
            {
              q: 'Allocate page redirects immediately',
              a: 'sessionStorage pendingPayment was lost (new tab, cleared storage). Re-open Pay modal.',
            },
            {
              q: 'Payment did not clear expected month',
              a: 'Allocation is oldest-first by default. On allocate page, manually select specific months/heads.',
            },
            {
              q: 'Full AY totals look high',
              a: 'Est. rows include projected future months. Switch to Monthly for exact generated amounts.',
            },
            {
              q: '403 on Confirm Payment',
              a: 'Staff lacks Fees → Create, or archived year blocks writes on API. Check permissions.',
            },
            {
              q: 'Student not in list',
              a: 'Verify enrollment in active year, class assignment, and that fees were generated for selected month.',
            },
            {
              q: 'Pagination missing students',
              a: 'List is 100 per page. Use search/filters or walk pages. Export via Reports for full roster.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Best practices for cashiers">
        <ul>
          <li>Run <strong>Monthly</strong> view for daily collection — use Full AY only for management review.</li>
          <li>Always verify class filter before bulk parent notifications — wrong class causes confusion.</li>
          <li>After payment, confirm receipt number prints before dismissing success screen.</li>
          <li>For partial payments, note which months remain due on the allocate screen before confirming.</li>
          <li>End-of-day: export Collections summary via Reports for reconciliation with physical cash.</li>
        </ul>
      </DocSection>

      <DocSection title="Pagination and performance">
        <p>
          Lists load 100 students per page. Large branches should combine class filter + status filter rather than
          scrolling all pages. Search debounces — wait a moment after typing before assuming no match.
        </p>
      </DocSection>

      <DocSection title="Related guides">
        <ul>
          <li><Link href="/docs/intro/admin/fees">Fees overview</Link></li>
          <li><Link href="/docs/intro/admin/fees/families">Families</Link> — combined sibling payments</li>
          <li><Link href="/docs/intro/admin/fees/structures">Structures</Link> — amounts behind dues</li>
          <li><Link href="/docs/intro/admin/fees/reports">Reports</Link> — defaulter exports</li>
        </ul>
      </DocSection>
    </DocsShell>
  );
}
