import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function CeoDashboardPage() {
  return (
    <DocsShell
      title="CEO Dashboard"
      subtitle="A single-screen overview of your entire school organization."
      nav={introNav}
      variant="intro"
    >
      <p>
        The dashboard is the home screen when you sign in to the CEO portal. It loads live totals
        from all branches so you can see how the organization is growing at a glance.
      </p>

      <h2>Summary cards</h2>
      <p>Four cards appear at the top of the dashboard:</p>
      <ul>
        <li>
          <strong>Total Branches</strong> — how many campuses you have registered.
        </li>
        <li>
          <strong>Total Staff</strong> — all users across every branch (admins, teachers, and other
          staff).
        </li>
        <li>
          <strong>Total Students</strong> — enrolled students organization-wide.
        </li>
        <li>
          <strong>Active API Keys</strong> — keys currently in use (not revoked).
        </li>
      </ul>

      <h2>Staff by role</h2>
      <p>
        Below the summary cards, a breakdown shows how many people you have in each role (for example
        admin, teacher, student). This helps you spot imbalances — such as a new branch with no
        teachers yet.
      </p>

      <h2>Quick actions</h2>
      <p>Two shortcuts are always available from the dashboard:</p>
      <ul>
        <li>
          <strong>Manage Branches</strong> — opens the{' '}
          <Link href="/docs/intro/ceo/branches">branches list</Link>.
        </li>
        <li>
          <strong>API Key Manager</strong> — opens{' '}
          <Link href="/docs/intro/ceo/api-keys">API keys</Link>.
        </li>
      </ul>

      <DocCallout variant="tip" title="When numbers look wrong">
        Totals update from the live database. If a figure seems off, check that the branch admin has
        finished setting up academic years and enrolling students. Archived branches may still
        contribute to historical counts depending on backend rules.
      </DocCallout>

      <h2>Who can see this page</h2>
      <p>
        Only accounts with the <strong>super_admin</strong> role can open the CEO portal and
        dashboard. Branch admins and staff are redirected to their own portals. See{' '}
        <Link href="/docs/intro/ceo/permissions">Permissions</Link> for details.
      </p>
    </DocsShell>
  );
}
