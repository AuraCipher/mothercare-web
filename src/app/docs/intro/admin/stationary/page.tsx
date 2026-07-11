import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function AdminStationaryPage() {
  return (
    <DocsShell
      title="Stationary"
      subtitle="Branch product catalog, inventory, suppliers, and fee-linked student sales."
      nav={introNav}
      variant="intro"
    >
      <p>
        Stationary manages school supplies sold or issued to students — notebooks, uniforms, kits,
        etc. Products have bundle and unit prices; inventory tracks stock; sales can be assigned to
        students and appear on their fee statements.
      </p>

      <h2>Module areas</h2>
      <ul>
        <li><strong>Products</strong> — catalog with pricing</li>
        <li><strong>Inventory</strong> — stock levels and adjustments</li>
        <li><strong>Suppliers</strong> — vendor contacts for purchasing</li>
        <li><strong>Sales Records</strong> — history of items assigned to students</li>
      </ul>

      <h2>Common tasks</h2>
      <DocSteps>
        <DocStep title="Add products">
          Create items with name, SKU, bundle/unit price, and optional fee head linkage.
        </DocStep>
        <DocStep title="Adjust stock">
          Open Inventory to receive stock or write off damaged goods.
        </DocStep>
        <DocStep title="Assign to a student">
          Record a sale against a student — charges may flow to{' '}
          <Link href="/docs/intro/admin/fees">Fees</Link> when linked.
        </DocStep>
        <DocStep title="Audit sales">
          Review Sales Records for who received what and when.
        </DocStep>
      </DocSteps>

      <DocCallout variant="info" title="Branch-only">
        Stationary data is scoped to the active branch — each campus maintains its own catalog.
      </DocCallout>

      <h2>Permissions</h2>
      <p>Module key: <strong>Stationary</strong>. For restricted staff:</p>
      <ul>
        <li><strong>Read</strong> — view products, stock, and sales history</li>
        <li><strong>Create</strong> — add products, adjust inventory, record sales</li>
        <li><strong>Update</strong> — edit prices and stock records</li>
        <li><strong>Delete</strong> — remove products or sales where allowed</li>
      </ul>
      <p>
        See <Link href="/docs/intro/admin/permissions">Permissions & Staff Roles</Link>.
      </p>
    </DocsShell>
  );
}
