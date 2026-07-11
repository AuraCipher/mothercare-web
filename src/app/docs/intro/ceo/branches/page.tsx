import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function CeoBranchesPage() {
  return (
    <DocsShell
      title="Branches"
      subtitle="View and manage every school campus in your organization."
      nav={introNav}
      variant="intro"
    >
      <p>
        A <strong>branch</strong> is one campus or location (for example &quot;Mother Care
        Sohan&quot;). Each branch has its own students, teachers, classes, and branch admin. The CEO
        portal lists all branches you oversee.
      </p>

      <h2>Branches list</h2>
      <p>From <strong>Branches</strong> in the CEO sidebar, you see every campus with:</p>
      <ul>
        <li>Branch name and short code (for example <code>MCS-SOHAN</code>)</li>
        <li>Address (if set)</li>
        <li>Staff count for that branch</li>
      </ul>
      <p>Click a row to open <Link href="/docs/intro/ceo/branches/details">branch details</Link>.</p>

      <h2>Actions on each branch</h2>
      <ul>
        <li>
          <strong>View details</strong> — stats, assigned admin, and quick links.
        </li>
        <li>
          <strong>Edit</strong> — change name, address, phone, or email. The branch code cannot be
          changed after creation.
        </li>
        <li>
          <strong>Deactivate</strong> — remove a branch from active use. If the branch has academic
          years or members, it is <em>archived</em> (data kept, branch hidden). If it has no linked
          data, it is permanently deleted.
        </li>
      </ul>

      <h2>Add a new branch</h2>
      <p>
        Use the <strong>Add Branch</strong> button to open the create form. Step-by-step instructions
        are on the <Link href="/docs/intro/ceo/branches/create">Create a Branch</Link> page.
      </p>

      <DocCallout variant="warn" title="Before you archive">
        Archiving hides the branch but keeps all historical data. Make sure the branch admin and
        staff know before you archive a campus that still has active students.
      </DocCallout>

      <h2>After creating a branch</h2>
      <p>
        A new branch has no admin until you{' '}
        <Link href="/docs/intro/ceo/admins/invite">invite one</Link>. Without an admin, no one can
        run day-to-day operations for that campus.
      </p>
    </DocsShell>
  );
}
