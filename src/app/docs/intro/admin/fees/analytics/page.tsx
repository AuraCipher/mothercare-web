import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function AdminFeesAnalyticsPage() {
  return (
    <DocsShell
      title="Fee Analytics"
      subtitle="Charts, KPIs, and trends for collections and outstanding dues."
      nav={introNav}
      variant="intro"
    >
      <p>
        Fee Analytics visualizes how money is moving through your branch — monthly collection rates,
        head-wise breakdowns, defaulter trends, and summary KPIs. The fees dashboard also shows a
        snapshot of current-month analytics.
      </p>

      <h2>Common tasks</h2>
      <DocSteps>
        <DocStep title="Pick a time scope">
          Choose monthly, yearly, or custom period filters to match the question you are answering.
        </DocStep>
        <DocStep title="Review KPI cards">
          Check totals for billed, collected, outstanding, and collection percentage at the top.
        </DocStep>
        <DocStep title="Drill into charts">
          Use class-wise or head-wise charts to spot weak collection areas or seasonal patterns.
        </DocStep>
        <DocStep title="Cross-check with reports">
          For formal exports, switch to{' '}
          <Link href="/docs/intro/admin/fees/reports">Fee Reports</Link>.
        </DocStep>
      </DocSteps>

      <DocCallout variant="tip" title="Dashboard shortcut">
        The main <Link href="/docs/intro/admin/fees">Fees hub</Link> shows a quick monthly summary
        without opening the full analytics page.
      </DocCallout>

      <h2>Permissions</h2>
      <p>Part of the <strong>Fees</strong> module — <strong>Read</strong> access is sufficient to
      view analytics. Write permissions are not required on this screen.</p>
      <p>
        See <Link href="/docs/intro/admin/permissions">Permissions & Staff Roles</Link>.
      </p>
    </DocsShell>
  );
}
