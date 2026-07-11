import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function AdminFeesFamiliesPage() {
  return (
    <DocsShell
      title="Fee Families"
      subtitle="Group siblings under one family account and pay fees together."
      nav={introNav}
      variant="intro"
    >
      <p>
        Families let you link multiple students (typically siblings) so guardians can pay one
        combined bill. Each family has a name, linked students, shared contact info, and optional
        fee allocations across children.
      </p>

      <h2>Common tasks</h2>
      <DocSteps>
        <DocStep title="Create a family">
          Click <strong>New Family</strong>, enter the family name and guardian details, then save.
        </DocStep>
        <DocStep title="Add students to the family">
          Open the family profile and link enrolled students from the branch roster.
        </DocStep>
        <DocStep title="Allocate fees across children">
          Use <strong>Allocate</strong> on the family or student fee screens to split or assign
          charges between siblings when needed.
        </DocStep>
        <DocStep title="Collect family payment">
          From <Link href="/docs/intro/admin/fees/collections">Collections</Link> or the family
          profile, open <strong>Family Pay</strong> to record one payment against multiple students.
        </DocStep>
      </DocSteps>

      <DocCallout variant="info" title="Collections integration">
        Family rows in Collections show a combined view when siblings share a family record.
      </DocCallout>

      <h2>Permissions</h2>
      <p>Part of the <strong>Fees</strong> module:</p>
      <ul>
        <li><strong>Read</strong> — view families and linked students</li>
        <li><strong>Create</strong> — create families and link members</li>
        <li><strong>Update</strong> — edit family details and allocations</li>
        <li><strong>Delete</strong> — remove families or unlink students</li>
      </ul>
      <p>
        See <Link href="/docs/intro/admin/permissions">Permissions & Staff Roles</Link>.
      </p>
    </DocsShell>
  );
}
