import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import {
  DocCallout,
  DocSteps,
  DocStep,
  DocTable,
  DocSection,
  DocFaq,
} from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function AdminFeesPage() {
  return (
    <DocsShell
      title="Fees & Payments"
      subtitle="Fee heads, structures, monthly generation, collections, families, analytics, and reporting."
      nav={introNav}
      variant="intro"
    >
      <DocSection title="Overview">
        <p>
          The <strong>Fees &amp; Payments</strong> hub at <code>/admin/fees</code> is the starting point for
          all branch billing. It answers: <em>what do we charge, how much per class, who owes what, and
          what have we collected?</em> From here you navigate to fee heads, structures, monthly generation,
          collections, sibling families, analytics dashboards, and printable reports.
        </p>
        <p>
          <strong>Why it exists:</strong> schools need a single billing pipeline — define charge types once,
          set class amounts, generate monthly dues automatically, record partial or full payments, group
          siblings for combined receipts, and export defaulter lists for follow-up.
        </p>
        <p>
          <strong>Who uses it:</strong> branch administrators, accountants, and restricted staff with the{' '}
          <strong>Fees</strong> module permission. Teachers and students do not access this area.
        </p>
      </DocSection>

      <DocSection title="Before you start">
        <ul>
          <li>
            <strong>Branch:</strong> select your campus from the sidebar branch switcher. All fee data is
            branch-scoped.
          </li>
          <li>
            <strong>Academic year:</strong> select the active year and press <strong>Go</strong>. Fee
            structures, generation, and collections all require <code>activeAYId</code> in scope.
          </li>
          <li>
            <strong>Classes enrolled:</strong> students must be assigned to sections before generation can
            create their monthly fees.
          </li>
          <li>
            <strong>Fee heads defined:</strong> at least one active fee head (e.g. Tuition) must exist before
            structures or generation.
          </li>
          <li>
            <strong>Permissions:</strong> restricted staff need <strong>Fees → Read</strong> to view the hub;
            Create/Update/Delete for write actions. See the permission matrix below.
          </li>
        </ul>
        <DocCallout variant="tip" title="Monthly rhythm">
          Most campuses run: <strong>Fee Heads</strong> → <strong>Fee Structures</strong> →{' '}
          <strong>Generate Fees</strong> (1st of month) → <strong>Collections</strong> (daily) →{' '}
          <strong>Analytics / Reports</strong> (weekly review).
        </DocCallout>
      </DocSection>

      <DocSection title="Hub layout — navigation cards">
        <p>
          The dashboard shows seven clickable cards and four quick-action buttons. Each card navigates to a
          sub-module:
        </p>
        <DocTable
          headers={['Card label', 'Description', 'Route']}
          rows={[
            ['Fee Heads', 'Manage what to charge (tuition, transport, etc.)', '/admin/fees/heads'],
            ['Fee Structures', 'Set amounts per class × fee head', '/admin/fees/structures'],
            ['Generate Fees', 'Create monthly dues for selected classes', '/admin/fees/generate'],
            ['Collections', 'Record payments and view student dues', '/admin/fees/collections'],
            ['Families', 'Group siblings and pay together', '/admin/fees/families'],
            ['Analytics', 'Charts, trends, and KPIs', '/admin/fees/analytics'],
            ['Reports', 'Generate and export printable reports', '/admin/fees/reports'],
          ]}
        />
        <p>
          <strong>Quick Actions</strong> (header buttons): <strong>Record Payment</strong> → Collections;{' '}
          <strong>Generate Monthly Fees</strong> → Generate; <strong>View Analytics</strong> → Analytics;{' '}
          <strong>Export Reports</strong> → Reports.
        </p>
      </DocSection>

      <DocSection title="Hub widgets">
        <p>When analytics data loads, two optional panels appear:</p>
        <DocTable
          headers={['Widget', 'Content', 'Action']}
          rows={[
            [
              'This Month',
              'KPIs: Total Due, Collected, Pending (N students), Rate (%) with progress bar',
              'Full Analytics → link',
            ],
            [
              'Top Defaulters',
              'Top 5 students by pending amount',
              'View All → Reports',
            ],
          ]}
        />
        <p>
          While loading, widgets may be empty. If no fees have been generated for the current month, KPIs
          show zeros — this is normal on a fresh setup.
        </p>
      </DocSection>

      <DocSection title="Step-by-step: first-time fee setup">
        <DocSteps>
          <DocStep title="Define fee heads">
            Open <strong>Fee Heads</strong> from the hub card or sidebar. Click <strong>Add Head</strong>,
            enter name (e.g. Tuition), category (Monthly / Term / Annual / One-Time), optional description,
            and whether the head is optional. Click <strong>Create</strong>.
          </DocStep>
          <DocStep title="Configure class structures">
            Open <strong>Fee Structures</strong>. The matrix shows each class as a row and each fee head as
            a column. Click any cell to inline-edit the amount in PKR. Press ✓ to save or ✕ to cancel. Click
            a class name to open per-student overrides.
          </DocStep>
          <DocStep title="Generate monthly dues">
            Open <strong>Generate Fees</strong>. Select month and year, choose classes and fee heads to
            include, then click <strong>Generate</strong>. The result panel shows how many fees were created,
            skipped, or protected.
          </DocStep>
          <DocStep title="Collect payments">
            Open <strong>Collections</strong>. Filter by class, status, or father name. Click <strong>Pay</strong>{' '}
            on a student row to open the payment modal, allocate across months/heads, and print a receipt.
          </DocStep>
          <DocStep title="Review performance">
            Open <strong>Analytics</strong> for charts and defaulter CSV, or <strong>Reports</strong> for
            printable defaulter lists and class summaries.
          </DocStep>
        </DocSteps>
      </DocSection>

      <DocSection title="Typical monthly workflow">
        <DocSteps>
          <DocStep title="Generate (start of month)">
            Run <strong>Generate Fees</strong> for the new month. Use <strong>Update</strong> if structures
            changed mid-month, or <strong>Regenerate</strong> (with confirmation) to delete unpaid fees and
            recreate them — paid fees are protected.
          </DocStep>
          <DocStep title="Collect (daily)">
            Use <strong>Collections</strong> in Monthly or Full AY mode. Record individual payments via{' '}
            <strong>Pay</strong>, or family payments via <strong>Family</strong> badge → <strong>Pay as Family</strong>.
          </DocStep>
          <DocStep title="Follow up defaulters">
            Check <strong>Top Defaulters</strong> on the hub or run a <strong>Defaulter List</strong> report
            with your collection-rate threshold.
          </DocStep>
          <DocStep title="Close the month">
            Export a <strong>Collection Summary</strong> or <strong>Monthly Trend</strong> report for
            management review.
          </DocStep>
        </DocSteps>
      </DocSection>

      <DocSection title="Permission matrix">
        <p>
          Module key: <strong>FEES</strong>. API routes under <code>/admin/fees/*</code>,{' '}
          <code>/admin/fee-*</code>, <code>/admin/payments/*</code>, <code>/admin/student-fees/*</code>, and{' '}
          <code>/admin/families/*</code> map to this module. HTTP method determines action: GET = read, POST =
          create, PUT/PATCH = update, DELETE = delete.
        </p>
        <DocTable
          headers={['Action', 'Typical UI', 'Read', 'Create', 'Update', 'Delete']}
          rows={[
            ['View hub & analytics', 'Dashboard cards, charts', '✓', '—', '—', '—'],
            ['Manage fee heads', 'Add Head, edit, deactivate', '✓', '✓', '✓', '✓ (deactivate)'],
            ['Edit structures', 'Matrix inline edit', '✓', '✓', '✓', '—'],
            ['Generate fees', 'Generate / Update / Regenerate', '✓', '✓', '✓', '✓ (regenerate unpaid)'],
            ['Record payments', 'Pay, Family Pay, allocate', '✓', '✓', '—', '—'],
            ['Manage families', 'New Family, add items', '✓', '✓', '✓', '—'],
            ['Export reports', 'CSV, Print', '✓', '—', '—', '—'],
            ['Carry forward dues', 'Carry Old Dues on student page', '✓', '✓', '—', '—'],
          ]}
        />
        <p>
          <strong>Branch admins</strong> (unrestricted) have full CRUD. <strong>Restricted staff</strong> follow
          per-module flags. See{' '}
          <Link href="/docs/intro/admin/permissions">Permissions &amp; Staff Roles</Link>.
        </p>
      </DocSection>

      <DocSection title="Archived academic year behavior">
        <DocTable
          headers={['Area', 'Archived behavior']}
          rows={[
            ['Hub & Analytics', 'Read-only — widgets and charts still load historical data'],
            ['Collections', 'Banner: "Viewing an archived academic year. Payments are read-only…" — Pay/Family buttons hidden'],
            ['Student fee detail', 'Banner: "This academic year is archived. New payments cannot be recorded." — Pay/Carry/Family hidden'],
            ['Generate, Heads, Structures', 'No frontend block; backend enforces archived CRUD flags'],
            ['Family detail', 'Pay as Family may still appear — backend should reject writes if archived'],
            ['Carry forward', 'Bridge from archived dues → active year (on student detail, active target month)'],
          ]}
        />
        <DocCallout variant="warn" title="Archived write flags">
          Restricted staff can have separate <em>archived</em> Read/Create/Update/Delete flags. Even full
          admins see payment buttons hidden in Collections when the year is archived.
        </DocCallout>
      </DocSection>

      <DocSection title="What happens when">
        <DocTable
          headers={['Event', 'Backend / UI behavior']}
          rows={[
            ['Page loads', 'GET /admin/fees/analytics?period=monthly loads This Month KPIs and Top Defaulters'],
            ['Generate fees', 'POST /admin/student-fees/generate creates StudentFee rows per student × head × month'],
            ['Record payment', 'POST /admin/payments/allocate applies amount oldest-first across selected heads/months'],
            ['Family payment', 'POST /admin/family-payments/allocate splits one receipt across siblings'],
            ['Deactivate fee head', 'DELETE /admin/fee-heads/:id soft-deactivates; hidden from new generation'],
            ['Regenerate month', 'Deletes unpaid fees for month, recreates from current structures; paid fees protected'],
            ['Add extra due', 'POST /admin/student-fees/:id/extra-items adds ad-hoc charge to a month'],
            ['Assign stationary', 'Stationary catalog items added to student fee via assign API'],
            ['Switch academic year', 'All fee pages reload scoped to new activeAYId'],
          ]}
        />
      </DocSection>

      <DocSection title="Status filter reference">
        <p>Collections, Families, and Reports share these status filter options:</p>
        <DocTable
          headers={['Filter label', 'Meaning']}
          rows={[
            ['All Statuses', 'No status filter applied'],
            ['Unpaid', 'No payment recorded for the period'],
            ['Partial', 'Some payment but balance remains'],
            ['Paid', 'Fully paid or overpaid'],
          ]}
        />
      </DocSection>

      <DocCallout variant="info" title="Stationary linkage">
        Stationary sales assigned to students appear as line items on fee statements. See{' '}
        <Link href="/docs/intro/admin/stationary">Stationary</Link> for catalog and assignment workflow.
      </DocCallout>

      <DocSection title="Troubleshooting">
        <DocFaq
          items={[
            {
              q: 'Hub shows zero KPIs but students exist',
              a: 'Fees may not be generated for the current month. Open Generate Fees or click Generate Now from Collections empty state.',
            },
            {
              q: 'Cannot record payment — Pay button missing',
              a: 'Academic year is archived, or you lack Fees → Create permission. Check sidebar year status and staff profile.',
            },
            {
              q: 'Student shows "Not generated" in Collections',
              a: 'No StudentFee row for that month. Click Generate on the row or run Generate Fees for the class.',
            },
            {
              q: 'Structure cell won\'t save',
              a: 'Enter a valid positive number. Empty or non-numeric values show a toast. Check Update permission.',
            },
            {
              q: 'Family payment allocate page redirects back',
              a: 'sessionStorage pendingFamilyPayment was cleared. Start again from Pay as Family modal.',
            },
            {
              q: 'Regenerate did not change amounts',
              a: 'Paid or partially paid fees are protected. Only fully unpaid fees are deleted and recreated.',
            },
            {
              q: 'Full AY mode shows "Est." on fee column',
              a: 'Normal — projected dues for months not yet generated are marked as estimates.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Related guides">
        <ul>
          <li>
            <Link href="/docs/intro/admin/fees/collections">Collections</Link> — daily payment recording
          </li>
          <li>
            <Link href="/docs/intro/admin/fees/structures">Structures</Link> — class matrix and overrides
          </li>
          <li>
            <Link href="/docs/intro/admin/fees/families">Families</Link> — sibling groups
          </li>
          <li>
            <Link href="/docs/intro/admin/fees/analytics">Analytics</Link> — charts and defaulters
          </li>
          <li>
            <Link href="/docs/intro/admin/fees/reports">Reports</Link> — printable exports
          </li>
          <li>
            <Link href="/docs/intro/admin/students">Students</Link> — enrollment prerequisite
          </li>
          <li>
            <Link href="/docs/intro/admin/permissions">Permissions</Link> — assign Fees module access
          </li>
        </ul>
      </DocSection>
    </DocsShell>
  );
}
