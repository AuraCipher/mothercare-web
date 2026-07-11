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

export default function AdminFeesFamiliesPage() {
  return (
    <DocsShell
      title="Fee Families"
      subtitle="Group siblings for combined dues, family payments, and shared payment history."
      nav={introNav}
      variant="intro"
    >
      <DocSection title="Overview">
        <p>
          <strong>Families</strong> at <code>/admin/fees/families</code> lets you group siblings under one
          family record so guardians can pay for multiple children with a single receipt. Each family has
          contact details, a student list, combined due totals, payment history, and tools to add extra
          charges or stationary items per child.
        </p>
        <p>
          <strong>Who uses it:</strong> front-office staff with <strong>Fees → Read</strong> and{' '}
          <strong>Create</strong> for new families and payments.
        </p>
      </DocSection>

      <DocSection title="Before you start">
        <ul>
          <li><strong>Branch + academic year</strong> selected.</li>
          <li><strong>Students enrolled</strong> — only unassigned students appear in the new-family picker.</li>
          <li><strong>Fees generated</strong> for siblings before family payment allocation.</li>
        </ul>
      </DocSection>

      <DocSection title="Families list page">
        <p>
          Title: <strong>Families</strong>. Subtitle: <em>Group siblings for combined fee management.</em>
        </p>
        <DocTable
          headers={['Control', 'Description']}
          rows={[
            ['New Family', 'Button → /admin/fees/families/new'],
            ['Search', 'Placeholder: Search by family name, father, phone, or student…'],
            ['Status filter', 'All Statuses / Unpaid / Partial / Paid'],
            ['Family cards', 'Click row → family detail; shows name, father · phone, student count, payments'],
            ['Due badge', '{amount} PKR due or All clear on right side'],
            ['Empty state', 'Create your first family button'],
          ]}
        />
      </DocSection>

      <DocSection title="Step-by-step: create a family">
        <DocSteps>
          <DocStep title="Click New Family">
            Opens <code>/admin/fees/families/new</code>. Title: <strong>New Family</strong>.
          </DocStep>
          <DocStep title="Fill Family Details">
            <strong>Family name</strong> (required), Father name, Mother name, Phone, Address (textarea).
          </DocStep>
          <DocStep title="Select students">
            Search <em>Search students by name or roll…</em>. Check unassigned students only. Counter:{' '}
            <em>N student(s) selected</em>. Empty: <em>No unassigned students found</em>.
          </DocStep>
          <DocStep title="Create Family">
            Validates name + at least one student. POST /admin/families → redirects to family detail.
          </DocStep>
        </DocSteps>
      </DocSection>

      <DocSection title="New family form fields">
        <DocTable
          headers={['Field', 'Required', 'Placeholder']}
          rows={[
            ['Family name', 'Yes', 'Family name (required) *'],
            ['Father name', 'No', 'Father name'],
            ['Mother name', 'No', 'Mother name'],
            ['Phone', 'No', 'Phone'],
            ['Address', 'No', 'Address'],
            ['Student checkboxes', 'At least one', 'Search picker list'],
          ]}
        />
        <p>Buttons: <strong>Back to Families</strong>, <strong>Create Family</strong> / <strong>Creating…</strong>.</p>
      </DocSection>

      <DocSection title="Family detail page">
        <p>
          Route: <code>/admin/fees/families/[id]</code>. Title: family name. Subtitle: father · phone or{' '}
          <em>No contact info</em>.
        </p>
        <DocTable
          headers={['Element', 'Description']}
          rows={[
            ['Back to Families', 'Return to list'],
            ['Pay as Family', 'Opens Family Payment modal'],
            ['Summary KPIs', 'Students | Total Due (PKR) | Family Payments | Status (Active/Inactive)'],
            ['Student Dues', 'Per-student breakdown with status badges'],
            ['Add Item', 'Per student — extra due or stationary'],
            ['Family Payment History', 'Receipt list with Print per payment'],
          ]}
        />
        <p>
          URL <code>?pay=1</code> auto-opens the pay modal (legacy redirect from{' '}
          <code>/admin/fees/collections/family-pay</code>).
        </p>
      </DocSection>

      <DocSection title="Family Payment modal">
        <DocTable
          headers={['Field', 'Description']}
          rows={[
            ['Title', 'Family Payment'],
            ['Per-student due', 'Breakdown loaded from GET /admin/families/{id}'],
            ['Amount', 'NumberStepper, step 100 PKR'],
            ['Method', 'Cash / Cheque / Bank Transfer'],
            ['Reference', 'Cheque # or transaction ID'],
            ['Next — Allocate', 'Stores sessionStorage → /admin/fees/families/{id}/allocate'],
          ]}
        />
      </DocSection>

      <DocSection title="Allocate Family Payment page">
        <p>Title: <strong>Allocate Family Payment</strong>. Subtitle: family name; paying X PKR via method.</p>
        <DocSteps>
          <DocStep title="Review per-student blocks">
            Collapsible sections per sibling. Checkboxes for current month items and previous months.
            Labels: <em>current month</em>, <em>Previous month</em>, due/applied amounts.
          </DocStep>
          <DocStep title="Check allocation summary">
            <strong>Selected</strong> X / Y PKR. Warning if under-allocated: <em>Select more to cover the full amount</em>.
          </DocStep>
          <DocStep title="Confirm Family Payment">
            POST /admin/family-payments/allocate. Success: <strong>✓ Family Payment Recorded</strong>.
          </DocStep>
          <DocStep title="Print family receipt">
            <strong>Print Family Receipt</strong>, download icon, <strong>Back to Family</strong>.
          </DocStep>
        </DocSteps>
        <p>
          Prerequisite: <code>sessionStorage.pendingFamilyPayment:[familyId]</code>. Missing → toast + redirect.
        </p>
      </DocSection>

      <DocSection title="Add Item modal">
        <p>Title: <strong>Add Item - student name</strong></p>
        <DocTable
          headers={['Field', 'Options']}
          rows={[
            ['Type', 'Extra Due | Stationary'],
            ['Extra Due — Name', 'Text label'],
            ['Extra Due — Amount', 'NumberStepper, step 50 PKR'],
            ['Stationary', 'Catalog by category with quantity steppers'],
            ['Buttons', 'Save, Cancel'],
          ]}
        />
        <p>
          APIs: POST /admin/student-fees/{'{feeId}'}/extra-items (extra due); POST stationary assign for catalog
          items.
        </p>
      </DocSection>

      <DocSection title="Student links from family">
        <ul>
          <li>Student name → <code>/admin/fees/student/[id]</code> full fee detail</li>
          <li><strong>+</strong> on unpaid month → shortcut to Add Item for that month</li>
          <li>Collections list shows family badge on student name → this family page</li>
        </ul>
      </DocSection>

      <DocSection title="Permission matrix">
        <DocTable
          headers={['Action', 'Permission']}
          rows={[
            ['List families', 'Fees → Read'],
            ['Create family', 'Fees → Create'],
            ['Pay as Family', 'Fees → Create'],
            ['Add extra/stationary items', 'Fees → Create'],
            ['Print family receipt', 'Fees → Read'],
          ]}
        />
      </DocSection>

      <DocSection title="Archived academic year">
        <p>
          Family detail does not show the same archived banner as Collections. <strong>Pay as Family</strong>{' '}
          may still appear — backend enforces archived CRUD. Collections page hides Family pay button when
          archived. For historical review, open payment history and use Print.
        </p>
      </DocSection>

      <DocSection title="What happens when">
        <DocTable
          headers={['Event', 'Effect']}
          rows={[
            ['Create family', 'POST /admin/families — links studentIds; students show family badge in Collections'],
            ['Family payment', 'Single FamilyPayment record + allocations per student/month/head'],
            ['Add extra due', 'Extra line item on student fee month'],
            ['Assign stationary', 'Catalog item qty added to fee breakdown'],
            ['Print receipt', 'fetchAndPrintFamilyReceipt(familyPaymentId)'],
          ]}
        />
      </DocSection>

      <DocSection title="Troubleshooting">
        <DocFaq
          items={[
            {
              q: 'Student not in picker when creating family',
              a: 'Student already assigned to another family. Remove from old family first or edit existing family.',
            },
            {
              q: 'Allocate page redirects',
              a: 'sessionStorage pendingFamilyPayment cleared. Restart from Pay as Family modal.',
            },
            {
              q: 'Family due does not match sum of children',
              a: 'Refresh page. Check each child has generated fees for the period. Status filter may hide cleared students.',
            },
            {
              q: 'Legacy family-pay URL',
              a: '/admin/fees/collections/family-pay?familyId= redirects to families/{id}?pay=1 automatically.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Family payment history">
        <p>
          Each family payment shows receipt number, date, recorded-by user, and total PKR. Expand line items to
          see per-student/month allocation. <strong>Print</strong> per payment for guardian copy.
        </p>
      </DocSection>

      <DocSection title="Stationary on family dues">
        <p>
          Add Item → Stationary opens catalog grouped by category. Quantity steppers add items to the selected
          student&apos;s fee month. See <Link href="/docs/intro/admin/stationary">Stationary</Link> for catalog setup.
        </p>
      </DocSection>

      <DocSection title="Related guides">
        <ul>
          <li><Link href="/docs/intro/admin/fees/collections">Collections</Link></li>
          <li><Link href="/docs/intro/admin/fees">Fees overview</Link></li>
          <li><Link href="/docs/intro/admin/stationary">Stationary</Link></li>
        </ul>
      </DocSection>
    </DocsShell>
  );
}
