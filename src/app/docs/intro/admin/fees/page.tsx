import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function AdminFeesPage() {
  return (
    <DocsShell
      title="Fees & Payments"
      subtitle="Fee heads, structures, monthly generation, collections, and reporting."
      nav={introNav}
      variant="intro"
    >
      <p>
        The Fees hub is the starting point for all branch billing. Configure what you charge (fee
        heads), set amounts per class (structures), generate monthly dues, record payments in
        collections, group siblings into families, and review analytics and printable reports.
      </p>

      <h2>Module areas</h2>
      <ul>
        <li><Link href="/docs/intro/admin/fees/collections">Collections</Link> — record payments and view dues</li>
        <li><Link href="/docs/intro/admin/fees/structures">Structures</Link> — amounts per class and fee head</li>
        <li><Link href="/docs/intro/admin/fees/families">Families</Link> — sibling groups and combined payment</li>
        <li><Link href="/docs/intro/admin/fees/reports">Reports</Link> — exportable fee reports</li>
        <li><Link href="/docs/intro/admin/fees/analytics">Analytics</Link> — charts, KPIs, and trends</li>
      </ul>

      <h2>Typical monthly workflow</h2>
      <DocSteps>
        <DocStep title="Set up fee heads">
          Under <strong>Fee Heads</strong>, define charge types (tuition, transport, etc.).
        </DocStep>
        <DocStep title="Configure structures">
          Open <strong>Fee Structures</strong> and enter amounts for each class × fee head combination.
        </DocStep>
        <DocStep title="Generate monthly fees">
          Use <strong>Generate Fees</strong> to create dues for the selected month.
        </DocStep>
        <DocStep title="Collect payments">
          Open <strong>Collections</strong> to record cash or partial payments per student or family.
        </DocStep>
      </DocSteps>

      <DocCallout variant="info" title="Stationary linkage">
        Stationary sales assigned to students can appear on fee statements. See{' '}
        <Link href="/docs/intro/admin/stationary">Stationary</Link>.
      </DocCallout>

      <h2>Permissions</h2>
      <p>Module key: <strong>Fees</strong>. For restricted staff:</p>
      <ul>
        <li><strong>Read</strong> — view dues, collections, structures, and reports</li>
        <li><strong>Create</strong> — generate fees, record payments, create families</li>
        <li><strong>Update</strong> — adjust structures, allocations, or payment records</li>
        <li><strong>Delete</strong> — remove fee records where the system allows</li>
      </ul>
      <p>
        See <Link href="/docs/intro/admin/permissions">Permissions & Staff Roles</Link> for archived-year
        rules and assigning access to cashiers or accountants.
      </p>
    </DocsShell>
  );
}
