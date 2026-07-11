import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function CeoInviteAdminPage() {
  return (
    <DocsShell
      title="Invite Admin"
      subtitle="Generate a registration link for a new branch administrator."
      nav={introNav}
      variant="intro"
    >
      <p>
        Branch admins cannot self-register without your invitation. You choose their email and
        branch; they set their own password when they open your link.
      </p>

      <h2>Step-by-step</h2>
      <DocSteps>
        <DocStep title="Open Invite New Admin">
          From <Link href="/docs/intro/ceo/admins">Admins</Link> or branch details, click{' '}
          <strong>Invite New Admin</strong>.
        </DocStep>
        <DocStep title="Enter the email address">
          Use the person&apos;s real work email (for example <code>newadmin@mothercare.edu</code>).
          This must match what they use when registering.
        </DocStep>
        <DocStep title="Select a branch">
          Choose which campus they will manage. Create a branch first if the list is empty — see{' '}
          <Link href="/docs/intro/ceo/branches/create">Create a Branch</Link>.
        </DocStep>
        <DocStep title="Generate Invitation Link">
          Click the button to create the invitation. The system builds a unique URL; nothing is sent
          by email from this screen.
        </DocStep>
        <DocStep title="Copy and share the link">
          Copy the full link and send it to the new admin (message, email, or in person). They open
          it in a browser, complete registration, and choose a password.
        </DocStep>
        <DocStep title="Track pending invites">
          Until they register, the invite stays under <strong>Pending Invitations</strong> on the{' '}
          <Link href="/docs/intro/ceo/admins">Admins</Link> page. Use <strong>Copy Link</strong>{' '}
          again if they lose the URL.
        </DocStep>
      </DocSteps>

      <h2>What the new admin does</h2>
      <ol>
        <li>Open your invitation link before it expires (7 days).</li>
        <li>Complete the registration form and set a password.</li>
        <li>Sign in to the admin portal for their assigned branch.</li>
        <li>Set up academic years, classes, students, and staff.</li>
      </ol>

      <DocCallout variant="warn" title="Link expiry">
        Invitations expire after 7 days. If the link stops working, generate a new invitation for
        the same email and branch.
      </DocCallout>

      <DocCallout variant="info" title="Resend vs CEO invitations">
        <strong>CEO invitations</strong> — you share a registration link manually from this page.
        <br />
        <strong>Credential emails</strong> — after admins are active, they email login details to
        teachers and students from profile pages in the admin portal. Those emails are delivered via
        the backend Resend service, not from the CEO portal.
      </DocCallout>

      <h2>After registration</h2>
      <p>
        The person moves from pending invitations to the branch admins list. You can view or edit
        their profile on the <Link href="/docs/intro/ceo/admins/profile">Admin Profile</Link> page.
        They manage school operations under the permissions described in{' '}
        <Link href="/docs/intro/admin/permissions">Admin Permissions</Link>.
      </p>
    </DocsShell>
  );
}
