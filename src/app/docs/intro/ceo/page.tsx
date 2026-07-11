import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function CeoOverviewPage() {
  return (
    <DocsShell
      title="CEO Portal"
      subtitle="Set up your school organization — branches, branch admins, and API keys."
      nav={introNav}
      variant="intro"
    >
      <p>
        The CEO portal is for the organization owner (your account has the{' '}
        <strong>super_admin</strong> role). You oversee every campus from one place. Branch
        administrators handle day-to-day school work in the admin portal; you focus on structure
        and access.
      </p>

      <h2>What you can do here</h2>
      <ul>
        <li>
          <Link href="/docs/intro/ceo/dashboard">Dashboard</Link> — see totals across all branches
          (staff, students, API keys).
        </li>
        <li>
          <Link href="/docs/intro/ceo/branches">Branches</Link> — add campuses, edit contact
          details, archive or delete empty branches.
        </li>
        <li>
          <Link href="/docs/intro/ceo/admins">Admins</Link> — invite branch administrators and
          manage pending invitations.
        </li>
        <li>
          <Link href="/docs/intro/ceo/api-keys">API Keys</Link> — create keys for integrations
          (mobile apps, third-party tools).
        </li>
      </ul>

      <h2>Typical setup flow</h2>
      <ol>
        <li>Create your first <Link href="/docs/intro/ceo/branches/create">branch</Link> (campus).</li>
        <li>
          <Link href="/docs/intro/ceo/admins/invite">Invite an admin</Link> and assign them to that
          branch.
        </li>
        <li>
          The new admin registers via your invitation link, then runs the school in the{' '}
          <Link href="/docs/intro/admin">admin portal</Link> (students, fees, attendance, and so
          on).
        </li>
        <li>
          Optionally create <Link href="/docs/intro/ceo/api-keys">API keys</Link> when you need
          external integrations.
        </li>
      </ol>

      <DocCallout variant="info" title="CEO vs branch admin">
        You manage <em>who</em> runs each branch and <em>organization-wide</em> settings. Branch
        admins manage students, teachers, fees, and daily operations inside their campus. See{' '}
        <Link href="/docs/intro/ceo/permissions">Permissions</Link> for a full comparison.
      </DocCallout>

      <DocCallout variant="tip" title="Invitation links vs credential emails">
        When you invite a branch admin, the CEO portal generates a <strong>registration link</strong>{' '}
        for you to share. Login credentials for students, teachers, and staff are sent by{' '}
        <strong>branch admins</strong> from the admin portal — those emails go out through the
        school&apos;s Resend integration.
      </DocCallout>

      <h2>Getting started</h2>
      <p>
        Sign in at <code>/login</code> with your CEO account, then open the CEO portal. Use the
        sidebar or <Link href="/docs/intro/ceo/dashboard">dashboard quick actions</Link> to jump to
        branches, admins, or API keys.
      </p>
    </DocsShell>
  );
}
