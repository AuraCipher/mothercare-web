import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function CeoBranchDetailsPage() {
  return (
    <DocsShell
      title="Branch Details"
      subtitle="Inspect one campus — stats, admin, and quick actions."
      nav={introNav}
      variant="intro"
    >
      <p>
        Open any branch from the <Link href="/docs/intro/ceo/branches">branches list</Link> to see a
        dedicated detail page for that campus.
      </p>

      <h2>Header information</h2>
      <p>At the top you see:</p>
      <ul>
        <li>Branch name and code</li>
        <li>
          <strong>Active</strong> or <strong>Inactive</strong> status
        </li>
        <li>Address, phone, and email (when recorded)</li>
      </ul>

      <h2>Statistics</h2>
      <p>Four cards summarize live data for this branch only:</p>
      <ul>
        <li>
          <strong>Total Staff</strong> — all staff linked to the branch
        </li>
        <li>
          <strong>Total Teachers</strong>
        </li>
        <li>
          <strong>Total Students</strong>
        </li>
        <li>
          <strong>Classes</strong> — class groups in the current setup
        </li>
      </ul>
      <p>
        These numbers are maintained by the branch admin in the admin portal. If everything shows
        zero, the campus may be new or not yet configured.
      </p>

      <h2>Branch admin</h2>
      <p>
        Each branch should have at least one <strong>branch administrator</strong>. This section
        lists assigned admins with name, email, phone, active status, and the date they were
        assigned.
      </p>
      <ul>
        <li>
          If no admin is assigned, a link takes you to{' '}
          <Link href="/docs/intro/ceo/admins/invite">Invite Admin</Link>.
        </li>
        <li>
          <strong>Remove admin</strong> — deactivates their login for this branch. Student,
          teacher, and class data stay intact. You can appoint a new admin afterward.
        </li>
        <li>
          Click an admin&apos;s name from the main <Link href="/docs/intro/ceo/admins">Admins</Link>{' '}
          list to open their <Link href="/docs/intro/ceo/admins/profile">profile</Link>.
        </li>
      </ul>

      <DocCallout variant="warn" title="Removing an admin">
        Removing an admin blocks their access immediately. Confirm with your team before removing
        someone who is still running the campus.
      </DocCallout>

      <h2>Quick actions</h2>
      <ul>
        <li>
          <strong>Invite New Admin</strong> — create an invitation for this or any branch.
        </li>
        <li>
          <strong>Manage Branch</strong> — shortcut toward branch management (day-to-day edits
          happen in the admin portal).
        </li>
        <li>
          <strong>API Keys</strong> — jump to{' '}
          <Link href="/docs/intro/ceo/api-keys">API key management</Link>, useful when integrating
          apps for this campus.
        </li>
      </ul>
    </DocsShell>
  );
}
