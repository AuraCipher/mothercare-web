import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function AdminFeesCollectionsPage() {
  return (
    <DocsShell
      title="Fee Collections"
      subtitle="Record student and family payments, filter dues, and track collection status."
      nav={introNav}
      variant="intro"
    >
      <p>
        Collections is the daily cashier screen. It lists generated fees for the selected month (or
        full-year view), shows paid / partial / unpaid status, and opens payment modals for
        individual students or entire families.
      </p>

      <h2>Common tasks</h2>
      <DocSteps>
        <DocStep title="Choose period and month">
          Toggle <strong>Monthly</strong> vs <strong>Full year</strong> and pick the month/year.
          Your choice is remembered in the browser.
        </DocStep>
        <DocStep title="Filter the list">
          Filter by class, roll number, student name, father name, or fee status (paid, partial,
          unpaid, etc.).
        </DocStep>
        <DocStep title="Record a student payment">
          Click a student row to open the payment modal. Enter amount received, payment method, and
          optional notes, then confirm.
        </DocStep>
        <DocStep title="Pay as a family">
          Use the family payment flow to settle dues for all siblings in one transaction — see{' '}
          <Link href="/docs/intro/admin/fees/families">Families</Link>.
        </DocStep>
      </DocSteps>

      <DocCallout variant="tip" title="View modes">
        Switch between <strong>By class</strong> and <strong>A–Z</strong> to match how your office
        works through the roster.
      </DocCallout>

      <h2>Permissions</h2>
      <p>Part of the <strong>Fees</strong> module:</p>
      <ul>
        <li><strong>Read</strong> — view collection lists and payment history</li>
        <li><strong>Create</strong> — record new payments</li>
        <li><strong>Update</strong> — correct payment entries where allowed</li>
        <li><strong>Delete</strong> — void or remove payments (admin-level, when supported)</li>
      </ul>
      <p>
        See <Link href="/docs/intro/admin/permissions">Permissions & Staff Roles</Link>.
      </p>
    </DocsShell>
  );
}
