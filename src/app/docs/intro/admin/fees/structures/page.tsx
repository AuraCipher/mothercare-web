import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function AdminFeesStructuresPage() {
  return (
    <DocsShell
      title="Fee Structures"
      subtitle="Set fee amounts per class and fee head for the active academic year."
      nav={introNav}
      variant="intro"
    >
      <p>
        Fee Structures is a grid of classes (sections) versus active fee heads. Each cell holds the
        amount charged for that combination. When you generate monthly fees, the system uses these
        amounts (plus any per-student allocations).
      </p>

      <h2>Common tasks</h2>
      <DocSteps>
        <DocStep title="Review the grid">
          Rows are class sections; columns are fee heads from <strong>Fee Heads</strong>. Empty or
          zero cells mean no charge for that combination.
        </DocStep>
        <DocStep title="Edit an amount">
          Click a cell, type the amount in PKR, and save. The newest effective structure is used
          for future fee generation.
        </DocStep>
        <DocStep title="Open detailed structure">
          For advanced per-structure history, open a structure detail page from the structures list
          when linked from other fee screens.
        </DocStep>
      </DocSteps>

      <DocCallout variant="warn" title="Before generating fees">
        Confirm fee heads are active and structures are filled for every enrolled class. Missing
        cells can lead to zero-amount lines or skipped heads.
      </DocCallout>

      <h2>Permissions</h2>
      <p>Part of the <strong>Fees</strong> module:</p>
      <ul>
        <li><strong>Read</strong> — view the structure grid</li>
        <li><strong>Create / Update</strong> — edit cell amounts and create structure versions</li>
        <li><strong>Delete</strong> — remove structure entries where permitted</li>
      </ul>
      <p>
        See <Link href="/docs/intro/admin/permissions">Permissions & Staff Roles</Link>.
      </p>
    </DocsShell>
  );
}
