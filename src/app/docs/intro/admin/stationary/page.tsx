import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep, DocFaq } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function AdminStationaryPage() {
  return (
    <DocsShell
      title="Stationary"
      subtitle="Branch product catalog, inventory, suppliers, and fee-linked student sales."
      nav={introNav}
      variant="intro"
    >
      <h2>Overview</h2>
      <p>
        The <strong>Stationary</strong> module at <code>/admin/stationary</code> manages school
        supplies sold or issued to students — notebooks, uniforms, kits, and similar items. The hub
        links to four areas: <strong>Products</strong>, <strong>Inventory</strong>,{' '}
        <strong>Suppliers</strong>, and <strong>Sales Records</strong>. Sales assigned to students
        can flow to their <Link href="/docs/intro/admin/fees">fee statements</Link> when linked to a
        fee head.
      </p>
      <p>
        <strong>Why it exists:</strong> campuses track stock, purchasing, and student charges for
        supplies separately from canteen food sales. Fee integration keeps billing in one place for
        parents.
      </p>
      <p>
        <strong>Who uses it:</strong> branch admins and restricted staff with the{' '}
        <strong>Stationary</strong> module permission.
      </p>

      <h2>Before you start</h2>
      <ul>
        <li><strong>Active branch</strong> selected — stationary data is branch-scoped, not year-scoped.</li>
        <li><strong>Fee heads</strong> configured if you want sales to appear on fee statements.</li>
        <li><strong>Students enrolled</strong> before assigning sales to individuals.</li>
      </ul>

      <h2>Step-by-step: common workflows</h2>
      <DocSteps>
        <DocStep title="Open the hub">
          Sidebar → <strong>Stationary</strong> → four navigation cards. Pick the area you need.
        </DocStep>
        <DocStep title="Add products">
          <strong>Products</strong> → create items with name, SKU, bundle price, unit price, optional
          fee head linkage. Bundle vs unit pricing supports pack sales and single-item sales.
        </DocStep>
        <DocStep title="Adjust inventory">
          <strong>Inventory</strong> → receive stock on delivery or write off damaged goods. Stock
          levels decrement when sales are recorded.
        </DocStep>
        <DocStep title="Manage suppliers">
          <strong>Suppliers</strong> → vendor contacts for purchasing reference. Open supplier
          detail for history and notes.
        </DocStep>
        <DocStep title="Assign sale to student">
          Record a sale against a student — quantity, product, pricing. If fee-linked, charge may
          appear on the student&apos;s fee account.
        </DocStep>
        <DocStep title="Audit sales history">
          <strong>Sales Records</strong> → filter who received what and when. Reconcile against
          inventory and fee collections.
        </DocStep>
      </DocSteps>

      <h2>Module areas</h2>
      <table>
        <thead>
          <tr><th>Area</th><th>Path</th><th>Purpose</th></tr>
        </thead>
        <tbody>
          <tr><td>Products</td><td><code>/admin/stationary/products</code></td><td>Catalog with bundle/unit pricing</td></tr>
          <tr><td>Inventory</td><td><code>/admin/stationary/inventory</code></td><td>Stock levels and adjustments</td></tr>
          <tr><td>Suppliers</td><td><code>/admin/stationary/suppliers</code></td><td>Vendor directory</td></tr>
          <tr><td>Sales Records</td><td><code>/admin/stationary/sales-records</code></td><td>Student assignment history</td></tr>
        </tbody>
      </table>

      <h2>Field reference — product (typical)</h2>
      <table>
        <thead>
          <tr><th>Field</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>Name</td><td>Product display name</td></tr>
          <tr><td>SKU / code</td><td>Internal stock identifier</td></tr>
          <tr><td>Bundle price</td><td>Price per pack/set</td></tr>
          <tr><td>Unit price</td><td>Price per single item</td></tr>
          <tr><td>Fee head link</td><td>Optional — posts charge to student fees</td></tr>
          <tr><td>Stock quantity</td><td>Current inventory level (may adjust on Inventory screen)</td></tr>
        </tbody>
      </table>

      <h2>What happens when</h2>
      <table>
        <thead>
          <tr><th>Event</th><th>Behavior</th></tr>
        </thead>
        <tbody>
          <tr><td>Product created</td><td>Available in sales and inventory screens for this branch</td></tr>
          <tr><td>Stock received</td><td>Inventory count increases</td></tr>
          <tr><td>Student sale recorded</td><td>Stock decreases; sale row in Sales Records; optional fee line</td></tr>
          <tr><td>Fee head linked</td><td>Charge may appear on student fee statement in Collections</td></tr>
          <tr><td>Archived year active</td><td>Writes blocked unless archived CRUD on Stationary module</td></tr>
        </tbody>
      </table>

      <h2>Permissions</h2>
      <p>Module key: <strong>Stationary (STATIONARY)</strong></p>
      <ul>
        <li><strong>Read</strong> — view products, stock, suppliers, sales history</li>
        <li><strong>Create</strong> — add products, adjust inventory, record sales</li>
        <li><strong>Update</strong> — edit prices and stock records</li>
        <li><strong>Delete</strong> — remove products or sales where allowed</li>
      </ul>
      <p>
        See <Link href="/docs/intro/admin/permissions">Permissions &amp; Staff Roles</Link> for
        archived-year overrides.
      </p>

      <DocCallout variant="info" title="Branch-only">
        Stationary data is scoped to the active branch — each campus maintains its own catalog and
        stock. Switch branch in sidebar to manage another campus.
      </DocCallout>

      <DocCallout variant="tip" title="Fee linkage">
        Link products to fee heads so uniform and kit charges appear alongside tuition on parent
        statements. See <Link href="/docs/intro/admin/fees">Fees</Link>.
      </DocCallout>

      <h2>Common issues &amp; fixes</h2>
      <table>
        <thead>
          <tr><th>Symptom</th><th>Cause</th><th>Fix</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Sale not on fee statement</td>
            <td>Product not linked to fee head</td>
            <td>Edit product — attach fee head; regenerate fees if needed</td>
          </tr>
          <tr>
            <td>Insufficient stock</td>
            <td>Inventory not received</td>
            <td>Inventory screen → receive stock before sale</td>
          </tr>
          <tr>
            <td>Student not in sale picker</td>
            <td>Not enrolled active year</td>
            <td>Enroll student under Students module first</td>
          </tr>
          <tr>
            <td>Cannot edit product</td>
            <td>No update permission</td>
            <td>Grant Stationary update or ask branch admin</td>
          </tr>
        </tbody>
      </table>

      <h2>Monthly stationary workflow</h2>
      <DocSteps>
        <DocStep title="Receive delivery">
          Inventory → add stock when shipment arrives from supplier.
        </DocStep>
        <DocStep title="Issue to new admissions">
          Sales Records → assign uniform/kit bundles to each new student.
        </DocStep>
        <DocStep title="Reconcile with fees">
          Check student fee statements in Collections for linked charges.
        </DocStep>
        <DocStep title="Audit stock">
          Compare inventory count vs sales records for shrinkage.
        </DocStep>
      </DocSteps>

      <h2>Interpreting inventory vs sales</h2>
      <p>
        <strong>Inventory count</strong> is physical stock on hand. <strong>Sales Records</strong>{' '}
        are commitments to students — a large gap between issued sales and remaining stock signals
        shrinkage, unrecorded write-offs, or sales entered without inventory decrement. Reconcile
        weekly during admission season when uniform and kit issuance peaks.
      </p>
      <p>
        When a product is fee-linked, the sale amount on the student statement should match the
        product price × quantity recorded in Sales Records. Mismatches usually mean the fee head was
        added after the sale or monthly fees were generated before the sale was posted.
      </p>

      <h2>FAQ</h2>
      <DocFaq
        items={[
          {
            q: 'Is stationary linked to academic year?',
            a: 'Catalog and inventory are branch-scoped. Student sales reference enrolled students for the active year context.',
          },
          {
            q: 'Difference from canteen?',
            a: 'Stationary is supplies with optional fee billing. Canteen is daily food sales with separate credit ledger — no fee integration.',
          },
          {
            q: 'Can I sell without fee linkage?',
            a: 'Yes. Record cash sales or assignments without fee head — they stay in Sales Records only.',
          },
          {
            q: 'How often should I reconcile inventory?',
            a: 'Weekly during admission season; monthly otherwise. Compare physical count to system stock.',
          },
        ]}
      />

      <h2>API endpoints (reference)</h2>
      <table>
        <thead>
          <tr><th>Method</th><th>Endpoint</th><th>Purpose</th></tr>
        </thead>
        <tbody>
          <tr><td>GET</td><td><code>/admin/stationary/products</code></td><td>Product catalog</td></tr>
          <tr><td>GET</td><td><code>/admin/stationary/inventory</code></td><td>Stock levels</td></tr>
          <tr><td>GET</td><td><code>/admin/stationary/sales</code></td><td>Sales history</td></tr>
          <tr><td>POST</td><td><code>/admin/stationary/sales</code></td><td>Assign sale to student</td></tr>
        </tbody>
      </table>

      <h2>Navigation paths</h2>
      <table>
        <thead>
          <tr><th>Screen</th><th>URL</th></tr>
        </thead>
        <tbody>
          <tr><td>Stationary hub</td><td><code>/admin/stationary</code></td></tr>
          <tr><td>Products</td><td><code>/admin/stationary/products</code></td></tr>
          <tr><td>Inventory</td><td><code>/admin/stationary/inventory</code></td></tr>
          <tr><td>Sales Records</td><td><code>/admin/stationary/sales-records</code></td></tr>
        </tbody>
      </table>

      <DocCallout variant="tip" title="Admission season">
        Stock uniform and kit bundles before peak admission weeks. Running out mid-enrollment forces
        manual IOUs outside the system.
      </DocCallout>

      <h2>Related guides</h2>
      <ul>
        <li><Link href="/docs/intro/admin/fees">Fees</Link> — collections and statements</li>
        <li><Link href="/docs/intro/admin/students">Students</Link> — assign sales to roster</li>
        <li><Link href="/docs/intro/admin/canteen">Canteen</Link> — separate food ledger</li>
        <li><Link href="/docs/intro/admin/permissions">Permissions</Link></li>
      </ul>
    </DocsShell>
  );
}
