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

export default function AdminFeesReportsPage() {
  return (
    <DocsShell
      title="Fee Reports"
      subtitle="Generate printable and CSV-exportable fee reports by class, period, and type."
      nav={introNav}
      variant="intro"
    >
      <DocSection title="Overview">
        <p>
          <strong>Fee Reports</strong> at <code>/admin/fees/reports</code> produces tabular reports for
          management review, parent meetings, and audit. Choose class scope, time period, report type, and
          optional status filters, then export as CSV or open a print-ready view.
        </p>
        <p>
          Subtitle on page: <em>Generate printable reports</em> with <strong>View Analytics</strong> link to{' '}
          <code>/admin/fees/analytics</code>.
        </p>
      </DocSection>

      <DocSection title="Before you start">
        <ul>
          <li><strong>Branch + academic year</strong> selected.</li>
          <li><strong>Fees generated</strong> for the report period (or use Full AY).</li>
          <li><strong>Fees → Read</strong> permission for viewing and exporting.</li>
        </ul>
      </DocSection>

      <DocSection title="Filter panel">
        <DocTable
          headers={['Control', 'Options / behavior']}
          rows={[
            ['Class', 'All Students + section options; disabled when Report Type = Class Summary'],
            ['Period', 'Today, Weekly, Monthly, Yearly, Full AY, Custom'],
            ['Report Type', 'Standard, Defaulter List, Class Summary, Payment Methods, Monthly Trend, Collection Summary'],
            ['Filter by Status', 'All Statuses / Unpaid / Partial / Paid — disabled for Defaulter List'],
            ['Month / Year', 'Shown when Period = Monthly'],
            ['Year', 'Shown when Period = Yearly'],
            ['From / To', 'Date inputs when Period = Custom'],
            ['Defaulter threshold', 'Pending or below [N] % collection rate (0–100, default 100)'],
          ]}
        />
        <p>
          Primary button: <strong>Generate Report</strong> / <strong>Generating…</strong>
        </p>
      </DocSection>

      <DocSection title="Report types explained">
        <DocTable
          headers={['Type', 'Purpose', 'Key columns']}
          rows={[
            ['Standard', 'Per-student dues and collection status', 'Roll, Class?, Name, Due, Paid, Pending, Status, Rate'],
            ['Defaulter List', 'Students below collection threshold', 'Same as Standard; auto-filters low rates'],
            ['Class Summary', 'Aggregate per class', 'Class, Students, Due, Collected, Pending, Rate'],
            ['Payment Methods', 'Breakdown by payment method', 'Method, Amount, Transactions, Share %'],
            ['Monthly Trend', 'Period-over-period comparison', 'Period, Due, Collected, Pending, Rate'],
            ['Collection Summary', 'High-level metrics table', 'Metric, Value (8 summary rows)'],
          ]}
        />
      </DocSection>

      <DocSection title="Step-by-step: defaulter report">
        <DocSteps>
          <DocStep title="Open Fee Reports">
            From Fees hub <strong>Reports</strong> card or Quick Action <strong>Export Reports</strong>.
          </DocStep>
          <DocStep title="Set filters">
            Choose class (or All Students), Period (e.g. Monthly), Report Type: <strong>Defaulter List</strong>.
            Set threshold e.g. 75% — lists students with collection rate below 75%.
          </DocStep>
          <DocStep title="Generate Report">
            Click <strong>Generate Report</strong>. Output shows title, timestamp, record count, summary row
            (Due, Collected, Outstanding, Rate, Paid/Partial/Unpaid counts).
          </DocStep>
          <DocStep title="Export">
            <strong>CSV</strong> downloads spreadsheet. <strong>Download / Print</strong> opens print dialog.
            <strong>Regenerate</strong> refreshes with same filters.
          </DocStep>
        </DocSteps>
      </DocSection>

      <DocSection title="Step-by-step: class summary">
        <DocSteps>
          <DocStep title="Select Class Summary report type">
            Class dropdown disables — report aggregates all sections automatically.
          </DocStep>
          <DocStep title="Choose period">
            Full AY or Monthly works best for management dashboards.
          </DocStep>
          <DocStep title="Generate and print">
            Review per-class Students, Due, Collected, Pending, Rate columns. Export CSV for Excel.
          </DocStep>
        </DocSteps>
      </DocSection>

      <DocSection title="Report output actions">
        <DocTable
          headers={['Button', 'Effect']}
          rows={[
            ['CSV', 'Downloads comma-separated file via client-side export'],
            ['Download / Print', 'Opens new window with print-styled HTML → browser print/PDF'],
            ['Regenerate', 'Re-runs generation with current filter values'],
          ]}
        />
      </DocSection>

      <DocSection title="Summary row labels">
        <p>After generation, header shows:</p>
        <ul>
          <li>Report title and generated timestamp</li>
          <li>Record count</li>
          <li>Summary: Due, Collected, Outstanding, Rate (%)</li>
          <li>Counts: Paid, Partial, Unpaid students</li>
        </ul>
      </DocSection>

      <DocSection title="Permission matrix">
        <DocTable
          headers={['Action', 'Permission']}
          rows={[
            ['View report builder', 'Fees → Read'],
            ['Generate report', 'Fees → Read (read-only aggregation)'],
            ['CSV export', 'Fees → Read'],
            ['Print', 'Fees → Read'],
          ]}
        />
        <p>No Create/Update/Delete required — reports do not modify data.</p>
      </DocSection>

      <DocSection title="Archived academic year">
        <p>
          Reports work on archived year data — read-only by nature. Switch sidebar to archived year to
          export historical defaulter or collection summaries. No write actions on this page.
        </p>
      </DocSection>

      <DocSection title="What happens when">
        <DocTable
          headers={['Event', 'Backend / client effect']}
          rows={[
            ['Generate (student reports)', 'GET /admin/fees/students-list paginated across all pages + GET /admin/fees/analytics summary'],
            ['Generate (multi-month/custom)', 'GET /admin/student-fees with date scope'],
            ['Class Summary', 'Client aggregates students-list by class'],
            ['Payment Methods', 'Derived from analytics payment method breakdown'],
            ['CSV click', 'Client-side downloadReportCsv — no extra API'],
            ['Print click', 'Opens formatted HTML in new tab'],
          ]}
        />
      </DocSection>

      <DocCallout variant="tip" title="Analytics vs Reports">
        Use <Link href="/docs/intro/admin/fees/analytics">Analytics</Link> for interactive charts and live
        KPIs. Use <strong>Reports</strong> when you need a formatted table for printing or CSV for Excel.
      </DocCallout>

      <DocSection title="Troubleshooting">
        <DocFaq
          items={[
            {
              q: 'Generate returns zero records',
              a: 'No fees for period, or status filter too narrow. Widen period or set All Statuses.',
            },
            {
              q: 'Class dropdown disabled',
              a: 'Expected for Class Summary type — report always aggregates all classes.',
            },
            {
              q: 'Status filter disabled',
              a: 'Defaulter List uses threshold instead of status buttons.',
            },
            {
              q: 'Defaulter list empty but students owe money',
              a: 'Raise threshold (e.g. 100%) or switch to Standard report with Unpaid filter.',
            },
            {
              q: 'Print layout cut off',
              a: 'Use landscape in print dialog. Try CSV for wide datasets.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Report type selection guide">
        <DocTable
          headers={['Need', 'Report type', 'Period']}
          rows={[
            ['Daily cashier reconciliation', 'Standard', 'Today or Monthly'],
            ['Parent meeting defaulters', 'Defaulter List', 'Monthly + threshold'],
            ['Principal board review', 'Class Summary', 'Full AY'],
            ['Audit payment mix', 'Payment Methods', 'Monthly or Custom'],
            ['Trend over months', 'Monthly Trend', 'Full AY'],
            ['One-page executive summary', 'Collection Summary', 'Any'],
          ]}
        />
      </DocSection>

      <DocSection title="Print tips">
        <p>
          Download / Print opens a new browser tab with print-optimized CSS. Use landscape for wide Standard
          reports. CSV preferred when sharing with Excel for further pivot tables.
        </p>
      </DocSection>

      <DocSection title="Defaulter threshold guide">
        <p>
          Threshold 100% lists anyone with any pending amount. Lower to 75% to find students below three-quarter
          collection rate. Combine with class filter for section-wise follow-up lists.
        </p>
      </DocSection>

      <DocSection title="Regenerate after generate">
        <p>
          After changing filters, click <strong>Regenerate</strong> rather than navigating away — preserves filter
          state and refreshes table in place.
        </p>
      </DocSection>

      <DocSection title="Quick reference — report types">
        <DocTable
          headers={['Type', 'Best for']}
          rows={[
            ['Standard', 'Full roster with due/paid/status'],
            ['Defaulter List', 'Collection follow-up calls'],
            ['Class Summary', 'Principal monthly review'],
            ['Payment Methods', 'Audit cash vs bank mix'],
            ['Monthly Trend', 'Year-over-year comparison'],
            ['Collection Summary', 'One-page KPI snapshot'],
          ]}
        />
      </DocSection>

      <DocSection title="Related guides">
        <ul>
          <li><Link href="/docs/intro/admin/fees/analytics">Analytics</Link></li>
          <li><Link href="/docs/intro/admin/fees/collections">Collections</Link></li>
          <li><Link href="/docs/intro/admin/fees">Fees overview</Link></li>
        </ul>
      </DocSection>
    </DocsShell>
  );
}
