import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function CeoAdminProfilePage() {
  return (
    <DocsShell
      title="Admin Profile"
      subtitle="View and update a branch administrator's record."
      nav={introNav}
      variant="intro"
    >
      <p>
        Open a branch admin from the <Link href="/docs/intro/ceo/admins">Admins</Link> list to see
        their full profile. As CEO you can correct contact and employment details on their behalf.
      </p>

      <h2>How to open a profile</h2>
      <ol>
        <li>Go to <strong>Admins</strong> in the CEO portal.</li>
        <li>Click the admin&apos;s row in the branch admins list.</li>
        <li>The profile page opens with their name, branch, and email in the header.</li>
      </ol>

      <h2>Editable fields</h2>
      <p>You can update:</p>
      <ul>
        <li>Full name</li>
        <li>Phone</li>
        <li>Employee ID</li>
        <li>Designation (work role)</li>
        <li>Qualification and specialization</li>
        <li>Joining date</li>
        <li>Address and emergency contact</li>
        <li>Bio</li>
      </ul>
      <p>
        Click <strong>Save</strong> after making changes. A success message confirms the update was
        stored.
      </p>

      <h2>Read-only fields</h2>
      <ul>
        <li>
          <strong>Email</strong> — tied to their login; cannot be changed from this screen.
        </li>
        <li>
          <strong>Username</strong> — shown for reference.
        </li>
        <li>
          <strong>Branch</strong> — displayed in the subtitle (assigned campus).
        </li>
      </ul>

      <DocCallout variant="tip" title="Who updates what">
        CEOs often set initial profile details when onboarding a new admin. Day-to-day updates can
        also be done by the admin themselves in the admin portal. Credential emails to staff still
        go out from the admin portal via Resend — not from this CEO profile screen.
      </DocCallout>

      <h2>Removing an admin</h2>
      <p>
        To deactivate access entirely, use <strong>Remove admin</strong> on the{' '}
        <Link href="/docs/intro/ceo/branches/details">branch details</Link> page rather than
        editing the profile. Removal blocks login but keeps all branch academic data.
      </p>

      <p>
        Related: <Link href="/docs/intro/ceo/permissions">CEO vs admin permissions</Link>
      </p>
    </DocsShell>
  );
}
