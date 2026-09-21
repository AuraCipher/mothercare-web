import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocCodeBlock, DocSection, DocTable } from '@/components/docs/doc-blocks';
import { apiNav } from '@/lib/docs/navigation';

const pre = 'overflow-x-auto rounded-lg border border-warm-card-border bg-warm-card p-4 text-xs leading-relaxed text-warm-cream';

export default function ApiDatabasePage() {
  return (
    <DocsShell
      title="Database"
      subtitle="PostgreSQL 16 with Prisma ORM — 116 models, schema domains, migrations, and data patterns."
      nav={apiNav}
      variant="api"
    >
      <h2>Overview</h2>
      <p>
        The backend uses PostgreSQL 16 accessed through Prisma ORM. The schema defines 116 models across
        approximately 3200 lines, organized into domain groups. All IDs are UUIDs. Monetary values are
        stored as integers (paise) in PKR.
      </p>

      <DocTable
        headers={['Property', 'Value']}
        rows={[
          ['Database', 'PostgreSQL 16'],
          ['ORM', 'Prisma (prisma/client)'],
          ['Models', '116'],
          ['Schema size', '~3200 lines'],
          ['ID type', 'UUID (uuid-ossp)'],
          ['Currency', 'PKR — amounts as integers (paise)'],
          ['Connection pool', 'Default 10 (configurable via DATABASE_URL pool)'],
        ]}
      />

      <DocSection title="Schema domains">
        <p>The schema is organized into these key domains:</p>
        <DocTable
          headers={['Domain', 'Key models', 'Purpose']}
          rows={[
            ['Identity', 'User, TeacherProfile, Student, StaffProfile, BranchMember', 'User accounts, profiles, branch membership'],
            ['Academic', 'Branch, AcademicYear, Group, Subject, Enrollment, Division', 'School structure, classes, subjects, student enrollment'],
            ['Fees', 'FeeHead, FeeStructure, StudentFee, Payment, PaymentReceipt', 'Fee definitions, student fee assignment, payment processing'],
            ['Exams', 'ExamSession, ExamType, MarksEntry, ReportCard, GradeScale', 'Exam hierarchy, marks entry, grade computation, report cards'],
            ['Chat', 'ChatRoom, ChatMessage, ChatCommunity, ClassRoleDefinition', 'Messaging rooms, messages, class role permissions'],
            ['Audit', 'AuditLog, PaymentAuditLog', 'Change tracking and financial audit trail'],
            ['Files', 'FileRecord, UploadSession', 'File storage metadata and resumable upload tracking'],
            ['Canteen', 'CanteenItem, CanteenOrder, CanteenOrderItem', 'Canteen menu and order management'],
            ['Stationery', 'StationeryItem, StationeryOrder, StationeryOrderItem', 'Stationery shop inventory and orders'],
            ['Payroll', 'PayrollRecord, TeacherPayroll', 'Teacher and staff salary management'],
          ]}
        />
      </DocSection>

      <DocSection title="Key relationships">
        <DocCodeBlock>{`// User is the central hub
User ──< TeacherProfile (1:1)
User ──< StaffProfile (1:1)
User ──< Student (1:1)
User ──< BranchMember (1:N) ──> Branch

// Student identity chain
Student ──< Enrollment (1:N) ──> AcademicYear
Enrollment ──> Group (class)
Group ──< StudentGroup (N:M)

// Financial flow
FeeHead ──< FeeStructure (1:N) ──> AcademicYear
FeeStructure ──< StudentFee (1:N) ──> Student
StudentFee ──< Payment (1:N)
Payment ──< PaymentReceipt (1:1)

// File lifecycle
User ──< FileRecord (1:N)
FileRecord ──< UploadSession (1:N)`}</DocCodeBlock>
      </DocSection>

      <DocSection title="Migrations">
        <p>Prisma Migrate manages schema changes. Production deployments use:</p>
        <DocCodeBlock>{`# Apply pending migrations
npx prisma migrate deploy

# Generate client after migration
npx prisma generate

# Reset (development only)
npx prisma migrate reset --force`}</DocCodeBlock>
        <DocCallout variant="warn" title="Production safety">
          Always run <code>prisma migrate deploy</code> — never <code>migrate dev</code> or{' '}
          <code>migrate reset</code> in production. Back up the database before applying migrations.
        </DocCallout>
      </DocSection>

      <DocSection title="Key indexes">
        <DocTable
          headers={['Model', 'Index', 'Purpose']}
          rows={[
            ['User', 'unique(username), unique(email), unique(phone)', 'Login lookups, duplicate prevention'],
            ['Student', 'unique(registrationNumber)', 'Registration number uniqueness'],
            ['Enrollment', 'compound(academicYearId, groupId, studentId)', 'Class roster queries'],
            ['StudentFee', 'compound(studentId, feeStructureId)', 'Fee lookup per student'],
            ['Payment', 'compound(studentFeeId, createdAt)', 'Payment history per fee'],
            ['MarksEntry', 'compound(examSessionId, studentId, subjectId)', 'Marks grid queries'],
            ['ChatMessage', 'compound(roomId, createdAt)', 'Message history pagination'],
            ['AuditLog', 'compound(entityType, entityId)', 'Entity audit trail'],
          ]}
        />
      </DocSection>

      <DocSection title="Transaction patterns">
        <p>Financial operations use Prisma interactive transactions for atomicity:</p>
        <DocCodeBlock>{`// Payment allocation — atomic across multiple writes
await prisma.$transaction(async (tx) => {
  // 1. Create payment record
  const payment = await tx.payment.create({ data: { ... } });

  // 2. Apply waterfall allocation to StudentFee records
  for (const allocation of allocations) {
    await tx.studentFee.update({
      where: { id: allocation.studentFeeId },
      data: { paidAmount: { increment: allocation.amount } },
    });
  }

  // 3. Create audit log
  await tx.paymentAuditLog.create({ data: { ... } });

  return payment;
});`}</DocCodeBlock>
        <DocCallout variant="tip" title="Timeout">
          Interactive transactions default to 5-second timeout. Complex financial operations may need{' '}
          <code>{`{ timeout: 10000 }`}</code>.
        </DocCallout>
      </DocSection>

      <DocSection title="Idempotency patterns">
        <p>Several domains protect against duplicate operations:</p>
        <DocTable
          headers={['Pattern', 'Model', 'Key']}
          rows={[
            ['Upload sessions', 'UploadSession', 'unique(uploadId) — prevents re-initiation'],
            ['Payments', 'Payment', 'idempotencyKey — prevents double-charge'],
            ['Payroll', 'PayrollRecord', 'unique(teacherId, month, year) — one record per month'],
            ['Fee assignment', 'StudentFee', 'unique(studentId, feeStructureId) — one fee per student per structure'],
          ]}
        />
      </DocSection>

      <DocCallout variant="info" title="Schema location">
        The full Prisma schema is at <code>backend/prisma/schema.prisma</code>. Use{' '}
        <code>npx prisma studio</code> to browse data visually during development.
      </DocCallout>

      <p>
        Next: <Link href="/docs/api/notifications">Notifications</Link> ·{' '}
        <Link href="/docs/api/financial-system">Financial System</Link>
      </p>
    </DocsShell>
  );
}
