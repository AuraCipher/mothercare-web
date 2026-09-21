import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocCodeBlock, DocSection, DocTable } from '@/components/docs/doc-blocks';
import { apiNav } from '@/lib/docs/navigation';

const pre = 'overflow-x-auto rounded-lg border border-warm-card-border bg-warm-card p-4 text-xs leading-relaxed text-warm-cream';

export default function ApiPayrollPage() {
  return (
    <DocsShell
      title="Payroll & Expenses"
      subtitle="Salary processing, utility payments, outgoing payment vouchers, and the canteen/stationery modules."
      nav={apiNav}
      variant="api"
    >
      <h2>Outgoing payment vouchers</h2>
      <p>
        Every outgoing payment — payroll, utility, or miscellaneous — is recorded as a{' '}
        <code>BranchOutgoingPayment</code> voucher. Voucher numbers are unique per branch and auto-generated
        on creation.
      </p>

      <DocSection title="BranchOutgoingPayment">
        <DocTable
          headers={['Field', 'Type', 'Notes']}
          rows={[
            ['id', 'String (cuid)', 'Primary key'],
            ['branchId', 'String', 'Foreign key to Branch'],
            ['type', 'Enum', 'PAYROLL | UTILITY | OTHER'],
            ['status', 'Enum', 'PAID | VOID'],
            ['amount', 'Decimal', 'Total payment amount'],
            ['voucherNumber', 'String', 'Unique per branch, auto-generated'],
            ['description', 'String?', 'Optional note'],
            ['paidAt', 'DateTime', 'Payment timestamp'],
            ['voidedAt', 'DateTime?', 'Set when status = VOID'],
            ['voidedByUserId', 'String?', 'User who voided'],
            ['voidReason', 'String?', 'Reason for void'],
            ['createdByUserId', 'String', 'User who created'],
            ['createdAt', 'DateTime', 'Creation timestamp'],
          ]}
        />

        <DocCodeBlock>{`POST /branches/:branchId/payroll/payments
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "type": "PAYROLL",
  "amount": 85000.00,
  "description": "March 2026 salaries"
}

// 201 Created
{
  "success": true,
  "data": {
    "id": "clx…",
    "voucherNumber": "PAY-000042",
    "type": "PAYROLL",
    "status": "PAID",
    "amount": "85000.00"
  }
}`}</DocCodeBlock>
      </DocSection>

      <DocSection title="PayrollPaymentDetail">
        <p>
          Each payroll voucher breaks down into per-employee line items via <code>PayrollPaymentDetail</code>.
          One voucher can cover multiple employees in a bulk run.
        </p>
        <DocTable
          headers={['Field', 'Type', 'Notes']}
          rows={[
            ['id', 'String (cuid)', 'Primary key'],
            ['outgoingPaymentId', 'String', 'FK → BranchOutgoingPayment'],
            ['payeeUserId', 'String', 'FK → User receiving payment'],
            ['salaryMonth', 'String', 'YYYY-MM format'],
            ['amount', 'Decimal', 'Individual payment amount'],
            ['createdAt', 'DateTime', 'Creation timestamp'],
          ]}
        />
        <DocCodeBlock>{`POST /branches/:branchId/payroll/payments/:paymentId/details
Content-Type: application/json

{
  "payeeUserId": "clx…",
  "salaryMonth": "2026-03",
  "amount": 42500.00
}`}</DocCodeBlock>
      </DocSection>

      <DocSection title="Bulk payroll processing">
        <p>
          <code>PayrollBulkRun</code> processes multiple employees in a single transaction. An{' '}
          <code>idempotencyKey</code> prevents duplicate runs — submitting the same key within the same
          branch returns the existing result.
        </p>
        <DocTable
          headers={['Field', 'Type', 'Notes']}
          rows={[
            ['id', 'String (cuid)', 'Primary key'],
            ['branchId', 'String', 'FK → Branch'],
            ['idempotencyKey', 'String', 'Unique per branch — prevents duplicates'],
            ['salaryMonth', 'String', 'YYYY-MM format'],
            ['totalCount', 'Int', 'Number of employees processed'],
            ['totalAmount', 'Decimal', 'Sum of all individual amounts'],
            ['createdByUserId', 'String', 'FK → User'],
            ['createdAt', 'DateTime', 'Run timestamp'],
          ]}
        />

        <DocCodeBlock>{`POST /branches/:branchId/payroll/bulk-run
Content-Type: application/json

{
  "salaryMonth": "2026-03",
  "idempotencyKey": "bulk-march-2026",
  "entries": [
    { "payeeUserId": "clx…", "amount": 42500.00 },
    { "payeeUserId": "cly…", "amount": 38000.00 },
    { "payeeUserId": "clz…", "amount": 4500.00 }
  ]
}

// 201 Created
{
  "success": true,
  "data": {
    "bulkRunId": "clx…",
    "totalCount": 3,
    "totalAmount": "85000.00",
    "vouchers": ["PAY-000042", "PAY-000043", "PAY-000044"]
  }
}`}</DocCodeBlock>

        <DocCallout variant="warn" title="Idempotency">
          Re-submitting the same <code>idempotencyKey</code> for the same branch returns the existing bulk
          run — no new vouchers are created. Use a deterministic key like{' '}
          <code>bulk-{`{`}YYYY-MM{`}`}</code>.
        </DocCallout>
      </DocSection>

      <DocSection title="PayrollMonthBalance">
        <p>
          Tracks the total disbursed amount per branch per salary month. Updated automatically when
          vouchers are created or voided.
        </p>
        <DocTable
          headers={['Field', 'Type', 'Notes']}
          rows={[
            ['id', 'String (cuid)', 'Primary key'],
            ['branchId', 'String', 'FK → Branch'],
            ['salaryMonth', 'String', 'YYYY-MM format'],
            ['totalDisbursed', 'Decimal', 'Net amount after voids'],
            ['voucherCount', 'Int', 'Number of active (non-void) vouchers'],
            ['updatedAt', 'DateTime', 'Last mutation timestamp'],
          ]}
        />
      </DocSection>

      <DocSection title="Void payments">
        <p>
          Paid vouchers can be voided — the status flips to <code>VOID</code>, the{' '}
          <code>voidedAt</code> / <code>voidedByUserId</code> / <code>voidReason</code> fields are
          set, and the month balance is adjusted.
        </p>
        <DocCodeBlock>{`PATCH /branches/:branchId/payroll/payments/:paymentId/void
Content-Type: application/json

{
  "reason": "Duplicate entry — employee paid via bulk run"
}

// 200 OK
{
  "success": true,
  "data": {
    "id": "clx…",
    "status": "VOID",
    "voidedAt": "2026-03-20T14:30:00.000Z",
    "voidReason": "Duplicate entry — employee paid via bulk run"
  }
}`}</DocCodeBlock>

        <DocCallout variant="info" title="Void behavior">
          Voiding a voucher does not delete it. The record remains for audit purposes. The month
          balance is decremented by the voucher amount.
        </DocCallout>
      </DocSection>

      <DocSection title="Canteen module">
        <p>
          The canteen module manages day-to-day sales, product inventory, supplier accounts, and
          purchase tracking. Canteen staff access is scoped to their branch via{' '}
          <code>BranchRole.canteen_staff</code>.
        </p>

        <h3>Core models</h3>
        <DocTable
          headers={['Model', 'Purpose']}
          rows={[
            ['CanteenProduct', 'Individual items — name, price, stock quantity, category'],
            ['CanteenSale', 'Daily sale transactions — product, quantity, amount, date'],
            ['CanteenAccount', 'Running balances — cash in, cash out, net balance'],
            ['CanteenSupplier', 'Supplier records — name, contact, payment terms'],
            ['CanteenPurchase', 'Purchase orders — supplier, items, total, date'],
          ]}
        />

        <h3>Typical workflow</h3>
        <pre className={pre}>
{`flowchart LR
  A[Add Product] --> B[Record Sale]
  B --> C[Update Account]
  D[Purchase Stock] --> E[Update Inventory]
  E --> C`}
        </pre>

        <p>
          Products have a stock quantity that decrements on each sale. Purchases from suppliers
          replenish stock. The canteen account tracks all inflows and outflows.
        </p>
      </DocSection>

      <DocSection title="Stationery module">
        <p>
          The stationery module tracks office/classroom supplies — categories, products, stock
          movements, and consumption reporting.
        </p>

        <h3>Core models</h3>
        <DocTable
          headers={['Model', 'Purpose']}
          rows={[
            ['StationeryCategory', 'Grouping — e.g. "Pens", "Notebooks", "Art Supplies"'],
            ['StationeryProduct', 'Individual items — name, category, unit price, stock'],
            ['StationeryStockMovement', 'Inbound/outbound records — product, quantity, type, date'],
          ]}
        />

        <h3>Stock movement types</h3>
        <DocTable
          headers={['Type', 'Effect on stock']}
          rows={[
            ['PURCHASE', 'Increases stock'],
            ['ISSUE', 'Decreases stock — distributed to departments/teachers'],
            ['RETURN', 'Increases stock — items returned'],
            ['ADJUSTMENT', 'Manual correction — up or down'],
          ]}
        />

        <DocCodeBlock>{`POST /branches/:branchId/stationery/movements
Content-Type: application/json

{
  "productId": "clx…",
  "type": "ISSUE",
  "quantity": 50,
  "notes": "Issued to Grade 8 section"
}`}</DocCodeBlock>
      </DocSection>

      <DocSection title="API endpoints summary">
        <DocTable
          headers={['Module', 'Endpoint', 'Purpose']}
          rows={[
            ['Payroll', 'POST /branches/:id/payroll/payments', 'Create outgoing payment voucher'],
            ['Payroll', 'POST /branches/:id/payroll/payments/:id/details', 'Add payment detail line'],
            ['Payroll', 'POST /branches/:id/payroll/bulk-run', 'Process bulk payroll'],
            ['Payroll', 'PATCH /branches/:id/payroll/payments/:id/void', 'Void a paid voucher'],
            ['Payroll', 'GET /branches/:id/payroll/month-balance?month=', 'Month balance summary'],
            ['Canteen', 'GET/POST /branches/:id/canteen/products', 'List or create products'],
            ['Canteen', 'POST /branches/:id/canteen/sales', 'Record a sale'],
            ['Canteen', 'GET /branches/:id/canteen/accounts', 'Account balances'],
            ['Canteen', 'GET/POST /branches/:id/canteen/suppliers', 'Supplier management'],
            ['Stationery', 'GET/POST /branches/:id/stationery/categories', 'Category CRUD'],
            ['Stationery', 'GET/POST /branches/:id/stationery/products', 'Product CRUD'],
            ['Stationery', 'POST /branches/:id/stationery/movements', 'Record stock movement'],
          ]}
        />
      </DocSection>

      <p>
        Next: <Link href="/docs/api/architecture">Architecture</Link> ·{' '}
        <Link href="/docs/api/endpoints">REST Endpoints</Link>
      </p>
    </DocsShell>
  );
}
