import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function AdminCanteenPage() {
  return (
    <DocsShell
      title="Canteen"
      subtitle="Daily sales, credit accounts, products, inventory, and suppliers."
      nav={introNav}
      variant="intro"
    >
      <p>
        Canteen runs the school food counter — record cash and credit sales, manage student
        <em> bakaya</em> (credit) accounts, maintain product catalog and stock, and pay suppliers.
        Sales-only staff are redirected straight to the sales screen with limited menu access.
      </p>

      <h2>Module areas</h2>
      <ul>
        <li><strong>Daily Sales</strong> — POS-style sales entry</li>
        <li><strong>Daily Summary</strong> — today&apos;s breakdown</li>
        <li><strong>Credit Accounts</strong> — student/staff credit balances</li>
        <li><strong>Products & Inventory</strong> — menu and stock</li>
        <li><strong>Suppliers</strong> — restock and supplier payments</li>
      </ul>

      <h2>Common tasks</h2>
      <DocSteps>
        <DocStep title="Record a sale">
          Open Daily Sales, add items to cart, take cash or post to credit account.
        </DocStep>
        <DocStep title="Settle credit">
          From Credit Accounts, view balance and record settlement payments.
        </DocStep>
        <DocStep title="Restock">
          Update inventory when deliveries arrive; link to supplier records when paying.
        </DocStep>
      </DocSteps>

      <DocCallout variant="tip" title="Sales-only access">
        Staff with canteen read-only or sales-only permission land on Daily Sales automatically —
        they do not see admin catalog screens.
      </DocCallout>

      <h2>Permissions</h2>
      <p>Module key: <strong>Canteen</strong>. Restricted staff may have sales-only access (read +
      create sales) without catalog management. Full canteen admin needs create/update on products
      and inventory.</p>
      <p>
        See <Link href="/docs/intro/admin/permissions">Permissions & Staff Roles</Link>.
      </p>
    </DocsShell>
  );
}
