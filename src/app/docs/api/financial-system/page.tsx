import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocCodeBlock, DocSection, DocTable } from '@/components/docs/doc-blocks';
import { apiNav } from '@/lib/docs/navigation';

const pre = 'overflow-x-auto rounded-lg border border-warm-card-border bg-warm-card p-4 text-xs leading-relaxed text-warm-cream';

export default function ApiFinancialSystemPage() {
  return (
    <DocsShell
      title="Financial System"
      subtitle="Fee lifecycle, payment allocation, family payments, receipts, and idempotency."
      nav={apiNav}
      variant="api"
    >
      <h2>Overview</h2>
      <p>
        The financial system manages the complete fee lifecycle from definition to payment receipt. All
        monetary values are stored as integers in PKR (paise). The system supports partial payments,
        overpayments, family payments, and full audit trails.
      </p>

      <pre className={pre}>
{`flowchart LR
  A[FeeHead] --> B[FeeStructure]
  B --> C[StudentFee]
  C --> D[Payment]
  D --> E[PaymentReceipt]

  F[Family] --> G[FamilyPayment]
  G --> D`}
      </pre>

      <DocTable
        headers={['Property', 'Value']}
        rows={[
          ['Currency', 'PKR (Pakistani Rupees)'],
          ['Storage', 'Integers (paise) — 1 PKR = 100 units'],
          ['Partial payments', 'Supported — paidAmount tracks cumulative'],
          ['Overpayments', 'Supported — allocation uses waterfall logic'],
          ['Idempotency', 'PaymentOperation ledger prevents double-processing'],
        ]}
      />

      <DocSection title="Fee lifecycle">
        <h3>FeeHead</h3>
        <p>Top-level fee categories (e.g., Tuition, Admission, Lab Fee). Defines name and description.</p>

        <h3>FeeStructure</h3>
        <p>
          Binds a FeeHead to an AcademicYear with a fixed amount. Optional recurrence (monthly, quarterly,
          yearly) and installments. The <code>amount</code> field is in paise.
        </p>
        <DocCodeBlock>{`// FeeStructure example
{
  "id": "fs-uuid",
  "feeHeadId": "fh-uuid",
  "academicYearId": "ay-uuid",
  "amount": 1500000,    // PKR 15,000 in paise
  "recurrence": "monthly",
  "installments": 12
}`}</DocCodeBlock>

        <h3>StudentFee</h3>
        <p>
          Per-student fee assignment. Created when a student enrolls. Tracks <code>totalAmount</code>,{' '}
          <code>paidAmount</code>, and <code>status</code> (PENDING, PARTIAL, PAID, OVERPAID).
        </p>

        <h3>Payment</h3>
        <p>
          Individual payment records linked to a StudentFee. Each payment has a unique{' '}
          <code>idempotencyKey</code> to prevent double-processing.
        </p>
      </DocSection>

      <DocSection title="Waterfall allocation">
        <p>
          When a payment exceeds a single StudentFee amount, the excess is automatically allocated to
          the oldest outstanding debts first (waterfall pattern).
        </p>
        <DocCodeBlock>{`// Payment allocation waterfall
async function allocatePayment(studentId: string, amount: number) {
  // 1. Get all unpaid StudentFee records, oldest first
  const fees = await prisma.studentFee.findMany({
    where: {
      studentId,
      status: { in: ['PENDING', 'PARTIAL'] },
    },
    orderBy: { createdAt: 'asc' },
  });

  let remaining = amount;
  const allocations: Allocation[] = [];

  for (const fee of fees) {
    if (remaining <= 0) break;

    const outstanding = fee.totalAmount - fee.paidAmount;
    const applied = Math.min(remaining, outstanding);

    allocations.push({ studentFeeId: fee.id, amount: applied });
    remaining -= applied;
  }

  // 2. Apply allocations atomically
  await prisma.$transaction(async (tx) => {
    for (const alloc of allocations) {
      await tx.studentFee.update({
        where: { id: alloc.studentFeeId },
        data: { paidAmount: { increment: alloc.amount } },
      });
    }
  });

  return { allocations, remaining };
}`}</DocCodeBlock>
      </DocSection>

      <DocSection title="Family payments">
        <p>
          A Family can have multiple Students. Family payments allow a single payment to be allocated
          across all family members' fees.
        </p>
        <DocCodeBlock>{`// Family payment flow
FamilyPayment {
  id: UUID
  familyId: FK -> Family
  totalAmount: Int          // paise
  allocations: [{
    studentId: FK -> Student
    studentFeeId: FK -> StudentFee
    amount: Int              // paise
  }]
}

// API: POST /admin/finance/family-payments
{
  "familyId": "family-uuid",
  "amount": 500000,          // PKR 5,000
  "method": "cash",
  "reference": "FAMILY-2026-001"
}`}</DocCodeBlock>
        <DocCallout variant="info" title="Family payment allocation">
          The backend automatically distributes family payments across all children's outstanding fees
          using the same waterfall logic, prioritizing the oldest debts first.
        </DocCallout>
      </DocSection>

      <DocSection title="Receipts">
        <h3>PaymentReceipt</h3>
        <p>
          Created automatically after successful payment. An immutable snapshot of the payment details.
          The receipt includes fee head name, amount, payment method, and timestamp. Cannot be modified
          after creation.
        </p>

        <h3>FamilyPaymentReceipt</h3>
        <p>
          Receipt for family-level payments. Contains the breakdown of allocations across family members.
        </p>
        <DocCodeBlock>{`// PaymentReceipt structure
{
  "id": "receipt-uuid",
  "paymentId": "payment-uuid",
  "receiptNumber": "REC-2026-001234",
  "studentName": "Ahmad Khan",
  "feeHeadName": "Tuition Fee",
  "amount": 1500000,
  "method": "cash",
  "paidAt": "2026-03-15T10:30:00Z",
  "branchName": "Main Campus"
}`}</DocCodeBlock>
      </DocSection>

      <DocSection title="Reversals and audit">
        <h3>PaymentAuditLog</h3>
        <p>
          Every payment mutation (create, reverse, refund) generates an audit log entry. The log
          captures the operation type, before/after state, and the user who performed the action.
        </p>

        <h3>Reversal flow</h3>
        <DocCodeBlock>{`// POST /admin/finance/payments/:id/reverse
{
  "reason": "Duplicate entry",
  "reversedBy": "admin-user-uuid"
}

// Backend performs:
// 1. Mark Payment as REVERSED
// 2. Decrement StudentFee.paidAmount
// 3. Create PaymentAuditLog entry
// 4. Update StudentFee status
// 5. Send notification (optional)`}</DocCodeBlock>
      </DocSection>

      <DocSection title="Idempotency">
        <p>The PaymentOperation ledger prevents duplicate financial operations:</p>
        <DocTable
          headers={['Pattern', 'Model', 'Protection']}
          rows={[
            ['Payment creation', 'Payment.idempotencyKey', 'Unique constraint prevents double-charge'],
            ['Fee assignment', 'StudentFee(studentId, feeStructureId)', 'Unique compound index'],
            ['Payroll processing', 'PayrollRecord(teacherId, month, year)', 'Unique compound index'],
            ['Upload sessions', 'UploadSession.uploadId', 'Unique constraint on upload identifier'],
          ]}
        />
        <DocCallout variant="warn" title="Concurrency">
          Payment allocation uses <code>SELECT ... FOR UPDATE</code> within transactions to prevent
          race conditions when multiple payments arrive simultaneously for the same student.
        </DocCallout>
      </DocSection>

      <DocSection title="Notifications">
        <p>Financial events trigger these notifications:</p>
        <DocTable
          headers={['Event', 'Notification', 'Recipient']}
          rows={[
            ['Payment received', 'Fee receipt generated', 'Student'],
            ['Fee overdue', 'Overdue payment reminder', 'Student'],
            ['Fee structure created', 'New fee assigned', 'Student'],
            ['Payroll processed', 'Salary credited', 'Teacher'],
          ]}
        />
      </DocSection>

      <DocSection title="Environment variables">
        <DocTable
          headers={['Variable', 'Purpose']}
          rows={[
            ['FCM_ENABLED', 'Enable push notifications for payment events'],
            ['REDIS_URL', 'BullMQ queue for async notification delivery'],
          ]}
        />
      </DocSection>

      <p>
        Next: <Link href="/docs/api/files-media">Files &amp; Media</Link> ·{' '}
        <Link href="/docs/api/results">Results &amp; Exams</Link>
      </p>
    </DocsShell>
  );
}
