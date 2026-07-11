import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep, DocFaq } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function AdminCanteenPage() {
  return (
    <DocsShell
      title="Canteen"
      subtitle="Daily sales, credit accounts, products, inventory, and suppliers — branch food ledger."
      nav={introNav}
      variant="intro"
    >
      <h2>Overview</h2>
      <p>
        The <strong>Canteen</strong> module at <code>/admin/canteen</code> runs the school food
        counter — record cash and credit sales, manage student <em>bakaya</em> (credit) accounts,
        maintain menu products and stock, and track suppliers. Canteen is a{' '}
        <strong>branch-only ledger</strong> — it does not link to the fee system or academic year
        APIs.
      </p>
      <p>
        <strong>Why it exists:</strong> daily cafeteria operations need fast POS entry, credit
        tracking, and stock control separate from tuition billing.
      </p>
      <p>
        <strong>Who uses it:</strong> branch admins, management staff with full Canteen permission,
        or <strong>sales-only</strong> staff redirected automatically to Daily Sales.
      </p>

      <h2>Before you start</h2>
      <ul>
        <li><strong>Products</strong> created before first sale (unless using quick-add on POS).</li>
        <li>Understand <strong>sales-only access</strong> — read+create without update/delete lands on POS only.</li>
        <li><code>canteen_staff</code> role users always redirect to <code>/admin/canteen/sales</code>.</li>
      </ul>

      <h2>Step-by-step: common workflows</h2>
      <DocSteps>
        <DocStep title="Review hub summary">
          Open Canteen → see summary cards: Total revenue, Cash, Credit, Sales count for the period.
        </DocStep>
        <DocStep title="Record a daily sale">
          <strong>Daily Sales</strong> → POS-style cart → add products → take cash or post to a
          credit account (student/staff). Complete sale updates summary.
        </DocStep>
        <DocStep title="View daily summary">
          <strong>Daily Summary</strong> → today&apos;s breakdown by payment type and product.
        </DocStep>
        <DocStep title="Manage credit accounts">
          <strong>Credit Accounts</strong> → view balances → record settlement payments when
          students or staff pay off credit.
        </DocStep>
        <DocStep title="Maintain products and stock">
          <strong>Products</strong> → menu items and prices. <strong>Inventory</strong> → restock
          after deliveries, track consumption.
        </DocStep>
        <DocStep title="Pay suppliers">
          <strong>Suppliers</strong> → vendor records → link restock payments when paying vendors.
        </DocStep>
      </DocSteps>

      <h2>Module areas</h2>
      <table>
        <thead>
          <tr><th>Card</th><th>Path</th><th>Purpose</th></tr>
        </thead>
        <tbody>
          <tr><td>Daily Sales</td><td><code>/admin/canteen/sales</code></td><td>POS entry — cash and credit</td></tr>
          <tr><td>Daily Summary</td><td><code>/admin/canteen/summary</code></td><td>Today&apos;s totals</td></tr>
          <tr><td>Credit Accounts</td><td><code>/admin/canteen/accounts</code></td><td>Outstanding balances</td></tr>
          <tr><td>Products</td><td><code>/admin/canteen/products</code></td><td>Menu catalog</td></tr>
          <tr><td>Inventory</td><td><code>/admin/canteen/inventory</code></td><td>Stock management</td></tr>
          <tr><td>Suppliers</td><td><code>/admin/canteen/suppliers</code></td><td>Vendor directory</td></tr>
        </tbody>
      </table>

      <h2>Field reference — daily sale (typical)</h2>
      <table>
        <thead>
          <tr><th>Field</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>Product / quantity</td><td>Line items in cart</td></tr>
          <tr><td>Payment type</td><td>Cash or Credit</td></tr>
          <tr><td>Credit account</td><td>Student or staff account when posting credit</td></tr>
          <tr><td>Total</td><td>Computed from line prices</td></tr>
        </tbody>
      </table>

      <h2>What happens when</h2>
      <table>
        <thead>
          <tr><th>Event</th><th>Behavior</th></tr>
        </thead>
        <tbody>
          <tr><td>Cash sale</td><td>Recorded in ledger; cash total on hub increases</td></tr>
          <tr><td>Credit sale</td><td>Account balance increases; credit total on hub increases</td></tr>
          <tr><td>Credit settlement</td><td>Payment reduces account balance</td></tr>
          <tr><td>Sales-only user opens /admin/canteen</td><td>Redirect to Daily Sales automatically</td></tr>
          <tr><td>Inventory restock</td><td>Stock levels update for product availability on POS</td></tr>
        </tbody>
      </table>

      <h2>Permissions</h2>
      <p>Module key: <strong>Canteen (CANTEEN)</strong></p>
      <ul>
        <li><strong>Read</strong> — hub, sales, accounts (scope depends on other flags)</li>
        <li><strong>Create</strong> — record sales, new products</li>
        <li><strong>Update</strong> — edit products, inventory, settlements</li>
        <li><strong>Delete</strong> — remove products/sales where permitted</li>
      </ul>
      <p>
        <strong>Sales-only shortcut:</strong> Read + Create without Update and Delete → user sees
        only <code>/admin/canteen/sales</code>, not catalog or inventory.
      </p>
      <p>
        See <Link href="/docs/intro/admin/permissions">Permissions &amp; Staff Roles</Link>.
      </p>

      <DocCallout variant="tip" title="Sales-only access">
        Staff with canteen read-only or sales-only permission land on Daily Sales automatically —
        they do not see admin catalog screens. Grant update/delete for inventory managers.
      </DocCallout>

      <DocCallout variant="info" title="No fee integration">
        Canteen credit is separate from tuition fees. Settle canteen balances under Credit Accounts,
        not Fees Collections.
      </DocCallout>

      <h2>Common issues &amp; fixes</h2>
      <table>
        <thead>
          <tr><th>Symptom</th><th>Cause</th><th>Fix</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Redirected to Sales only</td>
            <td>Sales-only permission</td>
            <td>Expected — grant update/delete for catalog access</td>
          </tr>
          <tr>
            <td>Credit balance wrong</td>
            <td>Unsettled sales</td>
            <td>Credit Accounts → review ledger and settlements</td>
          </tr>
          <tr>
            <td>Product unavailable on POS</td>
            <td>Zero inventory</td>
            <td>Restock via Inventory screen</td>
          </tr>
          <tr>
            <td>Hub totals mismatch</td>
            <td>Stale page</td>
            <td>Refresh hub after batch sales entry</td>
          </tr>
        </tbody>
      </table>

      <h2>Daily canteen workflow</h2>
      <DocSteps>
        <DocStep title="Morning">
          Open Daily Summary from yesterday — verify cash handover.
        </DocStep>
        <DocStep title="Service hours">
          Daily Sales POS — cash and credit transactions.
        </DocStep>
        <DocStep title="Credit follow-up">
          Credit Accounts — note students with high bakaya balances.
        </DocStep>
        <DocStep title="End of day">
          Daily Summary — reconcile cash drawer vs system total.
        </DocStep>
        <DocStep title="Weekly">
          Inventory restock; supplier payments if applicable.
        </DocStep>
      </DocSteps>

      <h2>Credit vs cash accounting</h2>
      <p>
        <strong>Cash sales</strong> increment the hub Cash total immediately. <strong>Credit
        sales</strong> post to a student or staff credit account — hub Credit total rises but cash
        drawer is unchanged until settlement. End-of-day reconciliation: cash in drawer should equal
        opening float plus cash sales minus cash refunds (if any).
      </p>
      <p>
        Credit accounts are independent from tuition fees. Parents may owe both — settle each in
        its own module. High bakaya balances on student accounts should be reviewed weekly to avoid
        uncollectable debt.
      </p>

      <h2>FAQ</h2>
      <DocFaq
        items={[
          {
            q: 'Why was I redirected to Sales when opening Canteen?',
            a: 'You have sales-only permission (read+create, no update/delete) or canteen_staff role. This is intentional.',
          },
          {
            q: 'Can canteen charges appear on fee statements?',
            a: 'No. Canteen uses its own credit ledger. Use Stationary with fee head linkage for supply charges on fees.',
          },
          {
            q: 'Is canteen data per academic year?',
            a: 'No. Canteen APIs are branch-scoped only — not filtered by academic year.',
          },
          {
            q: 'Can students pay canteen credit via Fees?',
            a: 'No. Settle canteen credit under Credit Accounts — separate from tuition Collections.',
          },
        ]}
      />

      <h2>API endpoints (reference)</h2>
      <table>
        <thead>
          <tr><th>Method</th><th>Endpoint</th><th>Purpose</th></tr>
        </thead>
        <tbody>
          <tr><td>GET</td><td><code>/admin/canteen/summary</code></td><td>Hub summary stats</td></tr>
          <tr><td>POST</td><td><code>/admin/canteen/sales</code></td><td>Record POS sale</td></tr>
          <tr><td>GET</td><td><code>/admin/canteen/accounts</code></td><td>Credit account list</td></tr>
          <tr><td>GET</td><td><code>/admin/canteen/products</code></td><td>Menu products</td></tr>
        </tbody>
      </table>

      <h2>Navigation paths</h2>
      <table>
        <thead>
          <tr><th>Screen</th><th>URL</th></tr>
        </thead>
        <tbody>
          <tr><td>Canteen hub</td><td><code>/admin/canteen</code></td></tr>
          <tr><td>Daily Sales (POS)</td><td><code>/admin/canteen/sales</code></td></tr>
          <tr><td>Credit Accounts</td><td><code>/admin/canteen/accounts</code></td></tr>
          <tr><td>Daily Summary</td><td><code>/admin/canteen/summary</code></td></tr>
        </tbody>
      </table>

      <DocCallout variant="warn" title="Credit limits">
        Establish informal credit caps for student accounts — the system tracks balance but does not
        auto-block sales when bakaya exceeds a threshold unless enforced at POS manually.
      </DocCallout>

      <h2>Related guides</h2>
      <ul>
        <li><Link href="/docs/intro/admin/staff">Staff</Link> — grant sales-only canteen access</li>
        <li><Link href="/docs/intro/admin/stationary">Stationary</Link> — supplies with fee link</li>
        <li><Link href="/docs/intro/admin/permissions">Permissions</Link> — Canteen CRUD matrix</li>
      </ul>
    </DocsShell>
  );
}
