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

export default function AdminFeesAnalyticsPage() {
  return (
    <DocsShell
      title="Fee Analytics"
      subtitle="Collection performance, trends, defaulters, and KPI dashboards."
      nav={introNav}
      variant="intro"
    >
      <DocSection title="Overview">
        <p>
          <strong>Fee Analytics</strong> at <code>/admin/fees/analytics</code> provides interactive charts and
          KPI cards for collection performance. Filter by period, class, and date range to see trends, payment
          method breakdown, class-wise collection rates, and top defaulters with CSV export.
        </p>
        <p>
          Subtitle: <em>Collection performance, trends &amp; defaulters.</em> Header link: <strong>Reports →</strong>{' '}
          to printable reports.
        </p>
      </DocSection>

      <DocSection title="Before you start">
        <ul>
          <li><strong>Academic year</strong> selected — empty state: <em>Select an academic year from the sidebar…</em></li>
          <li><strong>Fees generated</strong> — otherwise: <em>No analytics data available. Generate fees first.</em></li>
          <li><strong>Fees → Read</strong> permission.</li>
        </ul>
      </DocSection>

      <DocSection title="Header actions">
        <DocTable
          headers={['Control', 'Effect']}
          rows={[
            ['Refresh (icon)', 'Reloads analytics API with current filters'],
            ['Reports →', 'Navigate to /admin/fees/reports'],
          ]}
        />
      </DocSection>

      <DocSection title="Period filters">
        <DocTable
          headers={['Period button', 'Additional controls']}
          rows={[
            ['Today', 'Single day scope'],
            ['Last 7 Days', 'Rolling week'],
            ['Monthly', 'Month select + year number'],
            ['Yearly', 'Year number only'],
            ['Full AY', 'Entire academic year'],
            ['Custom Range', 'Date from / date to inputs'],
          ]}
        />
        <p>
          <strong>Class filter:</strong> All Classes + section options from branch sections API.
        </p>
      </DocSection>

      <DocSection title="KPI cards">
        <DocTable
          headers={['Card', 'Meaning']}
          rows={[
            ['Total Due', 'Sum of fees in filtered scope'],
            ['Collected', 'Payments recorded'],
            ['Outstanding', 'Due minus collected'],
            ['Collection Rate', 'Collected / Due percentage'],
            ['Payments', 'Number of payment transactions'],
            ['Avg Payment', 'Average payment amount'],
          ]}
        />
      </DocSection>

      <DocSection title="Chart sections">
        <DocTable
          headers={['Section title', 'Content']}
          rows={[
            ['Collection Trend', 'FeeLineChart — daily or monthly due/collected/rate'],
            ['Collection Progress', 'Progress bar + rate %'],
            ['Payment Status', 'Bars for paid / partial / unpaid / overpaid'],
            ['Academic Year — Monthly Comparison', 'Due vs collected per month in AY'],
            ['Payment Methods', 'FeeBarChart by method'],
            ['Collection Rate by Class', 'FeeHorizontalBars per section'],
            ['Top Defaulters', 'Top 10 students + CSV export button'],
            ['Collection by Class', 'Table: Class | Students | Due | Collected | Pending | Rate + Export CSV'],
          ]}
        />
      </DocSection>

      <DocSection title="Step-by-step: monthly review">
        <DocSteps>
          <DocStep title="Open Fee Analytics">
            Fees hub <strong>Analytics</strong> card or <strong>View Analytics</strong> quick action.
          </DocStep>
          <DocStep title="Select Monthly period">
            Choose month and year matching your billing cycle.
          </DocStep>
          <DocStep title="Review KPIs">
            Check Collection Rate and Outstanding against targets.
          </DocStep>
          <DocStep title="Inspect defaulters">
            Scroll to <strong>Top Defaulters</strong>. Click <strong>CSV</strong> to export for follow-up calls.
          </DocStep>
          <DocStep title="Compare classes">
            Use <strong>Collection Rate by Class</strong> and <strong>Collection by Class</strong> table to
            identify weak sections.
          </DocStep>
        </DocSteps>
      </DocSection>

      <DocSection title="Step-by-step: custom date analysis">
        <DocSteps>
          <DocStep title="Select Custom Range">
            Click <strong>Custom Range</strong> period button.
          </DocStep>
          <DocStep title="Set from and to dates">
            Pick start and end dates for ad-hoc analysis (e.g. post-vacation collection drive).
          </DocStep>
          <DocStep title="Optional class filter">
            Narrow to one section for class-teacher review meetings.
          </DocStep>
          <DocStep title="Refresh if needed">
            Click refresh icon after changing filters.
          </DocStep>
        </DocSteps>
      </DocSection>

      <DocSection title="Export actions">
        <ul>
          <li><strong>Top Defaulters → CSV</strong> — downloads defaulter list for current filters</li>
          <li><strong>Collection by Class → Export CSV</strong> — class summary spreadsheet</li>
        </ul>
        <p>For full printable reports with more types, use <Link href="/docs/intro/admin/fees/reports">Fee Reports</Link>.</p>
      </DocSection>

      <DocSection title="Permission matrix">
        <DocTable
          headers={['Action', 'Permission']}
          rows={[
            ['View analytics dashboard', 'Fees → Read'],
            ['Refresh data', 'Fees → Read'],
            ['Export CSV', 'Fees → Read'],
          ]}
        />
      </DocSection>

      <DocSection title="Archived academic year">
        <p>
          Analytics loads historical data for archived years — read-only viewing. KPIs and charts reflect
          that year&apos;s generated fees and payments. No write actions on this page.
        </p>
      </DocSection>

      <DocSection title="What happens when">
        <DocTable
          headers={['Event', 'Effect']}
          rows={[
            ['Page load / refresh', 'GET /admin/fees/analytics?period&month&year&from&to&groupId&academicYearId&branchId'],
            ['Class filter change', 'Re-queries with groupId'],
            ['Period change', 'Adjusts date scope and chart granularity (daily vs monthly)'],
            ['CSV export', 'Client-side from loaded analytics payload — no extra API'],
            ['Hub widget', 'Same API with period=monthly powers Fees dashboard This Month panel'],
          ]}
        />
      </DocSection>

      <DocCallout variant="tip" title="Hub shortcut">
        The Fees hub <strong>This Month</strong> widget uses the same analytics endpoint. Open{' '}
        <strong>Full Analytics →</strong> from the hub for the full filter set.
      </DocCallout>

      <DocSection title="Troubleshooting">
        <DocFaq
          items={[
            {
              q: 'No analytics data available',
              a: 'Generate fees for the period first. Confirm academic year is selected in sidebar.',
            },
            {
              q: 'Charts empty but KPIs show numbers',
              a: 'Some charts need multiple data points. Widen period or check class filter.',
            },
            {
              q: 'Collection rate over 100%',
              a: 'Overpayments (OVERPAID status) can push collected above due for the filtered window.',
            },
            {
              q: 'Class filter missing sections',
              a: 'Sections load from branch + AY. Verify classes exist under Admin → Classes.',
            },
            {
              q: 'Defaulter CSV empty',
              a: 'All students may be paid in scope. Switch to Full AY or lower collection expectations.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Interpreting collection rate">
        <p>
          Rate = Collected ÷ Due × 100 for the filtered scope. A dip after month-start is normal before
          generation. Compare <strong>Collection Rate by Class</strong> against school targets (e.g. 85% by
          15th of month).
        </p>
      </DocSection>

      <DocSection title="Custom range use cases">
        <ul>
          <li>Post-vacation collection drive — two-week window</li>
          <li>Audit specific date of fee increase</li>
          <li>Compare pre/post scholarship policy change</li>
        </ul>
      </DocSection>

      <DocSection title="Monthly comparison chart">
        <p>
          <strong>Academic Year — Monthly Comparison</strong> bars show due vs collected per month in the active
          year — ideal for spotting seasonal collection dips (e.g. summer vacation months).
        </p>
      </DocSection>

      <DocSection title="Refresh cadence">
        <p>
          Analytics is not real-time websocket — click <strong>Refresh</strong> after large batch of payments or
          fee generation to see updated KPIs without full page reload.
        </p>
      </DocSection>

      <DocSection title="Quick reference — chart list">
        <p>
          Collection Trend · Collection Progress · Payment Status · Monthly Comparison · Payment Methods ·
          Collection Rate by Class · Top Defaulters · Collection by Class table.
        </p>
      </DocSection>

      <DocSection title="Related guides">
        <ul>
          <li><Link href="/docs/intro/admin/fees/reports">Fee Reports</Link></li>
          <li><Link href="/docs/intro/admin/fees/collections">Collections</Link></li>
          <li><Link href="/docs/intro/admin/fees">Fees overview</Link></li>
        </ul>
      </DocSection>
    </DocsShell>
  );
}
