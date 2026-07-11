import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep, DocFaq } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function CeoInviteAdminPage() {
  return (
    <DocsShell
      title="Invite Admin"
      subtitle="Generate a registration link for a new branch administrator."
      nav={introNav}
      variant="intro"
    >
      <h2>Overview</h2>
      <p>
        The <strong>Invite New Admin</strong> flow at <code>/ceo/admins/invite</code> creates a
        one-time registration link for a future branch administrator. Branch admins cannot
        self-register — you choose their email and campus; they set their own password when they open
        your link.
      </p>
      <p>
        <strong>Why it exists:</strong> onboarding a campus requires a trusted person with full admin
        portal access. This screen binds an email address to exactly one branch and produces a secure
        token URL the invitee uses once to create their account.
      </p>
      <p>
        <strong>Who uses it:</strong> <code>super_admin</code> (CEO) only. When Resend is configured on the
        backend, the invitation email is sent automatically. You can still copy the registration link as a backup.
      </p>

      <h2>Before you start</h2>
      <ul>
        <li>
          <strong>Role:</strong> signed in as <code>super_admin</code> at <code>/ceo</code>.
        </li>
        <li>
          <strong>Branch ready:</strong> at least one branch must exist. The <strong>Assign Branch</strong>{' '}
          dropdown loads from <code>api.getBranches()</code>. Create a campus first if the list is
          empty — see <Link href="/docs/intro/ceo/branches/create">Create a Branch</Link>.
        </li>
        <li>
          <strong>Correct email:</strong> use the person&apos;s real work email (for example{' '}
          <code>newadmin@mothercare.edu</code>). It must match exactly when they register.
        </li>
        <li>
          <strong>Share within 7 days:</strong> links expire after seven days. If missed, generate a
          new invitation for the same email and branch.
        </li>
        <li>
          <strong>Do not confuse with credential WhatsApp:</strong> this CEO flow only creates a
          registration link. After the admin is active, they send login credentials to teachers and
          students via <strong>WhatsApp</strong> from the admin portal — not from here.
        </li>
      </ul>

      <h2>Step-by-step: invite a branch admin</h2>
      <DocSteps>
        <DocStep title="Open Invite New Admin">
          From <Link href="/docs/intro/ceo/admins">Admins</Link>, click <strong>Invite New Admin</strong>{' '}
          (top-right). You can also reach this page from branch details when inviting for a specific
          campus. The page title is <strong>Invite New Admin</strong> with subtitle{' '}
          <em>Send an invitation to create a branch administrator account.</em>
        </DocStep>
        <DocStep title="Enter Email Address">
          In the field labeled <strong>Email Address *</strong>, type the invitee&apos;s work email.
          Placeholder text shows <code>e.g. newadmin@mothercare.edu</code>. Leaving it blank shows{' '}
          <em>Email is required</em> on submit.
        </DocStep>
        <DocStep title="Select Assign Branch">
          Open the <strong>Assign Branch *</strong> dropdown (map-pin icon). Choose{' '}
          <code>Branch Name (CODE)</code> for the campus they will manage. If nothing is selected,
          submit shows <em>Please select a branch</em>.
        </DocStep>
        <DocStep title="Read What happens next?">
          The info box explains: an invitation link will be generated; you share it with the new admin;
          they set their own password; the link expires in <strong>7 days</strong>.
        </DocStep>
        <DocStep title="Send Invitation">
          Click <strong>Send Invitation</strong> (shows <strong>Sending…</strong> while working). On success a
          toast appears and the success screen replaces the form. When <code>RESEND_API_KEY</code> and{' '}
          <code>RESEND_FROM_EMAIL</code> are set on the backend, the invitee receives the email automatically.
        </DocStep>
        <DocStep title="Copy and share the link (backup)">
          On the success screen titled <strong>Invitation Created</strong>, the full URL is displayed even when
          email was sent. Click the copy icon if you need to share manually. Toast: <em>Link copied to clipboard</em>.
        </DocStep>
        <DocStep title="Track or invite again">
          Click <strong>Back to Admins</strong> to see the invite under{' '}
          <strong>Pending Invitations</strong> with a <strong>Copy Link</strong> button. Or click{' '}
          <strong>Invite Another</strong> to reset the form for a second person.
        </DocStep>
      </DocSteps>

      <h2>Field reference — invitation form</h2>
      <table>
        <thead>
          <tr>
            <th>Field / element</th>
            <th>Required</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Back to Admins</td>
            <td>—</td>
            <td>Returns to <code>/ceo/admins</code> without saving.</td>
          </tr>
          <tr>
            <td>Email Address *</td>
            <td>Yes</td>
            <td>Work email; locked to this address at registration. Type <code>email</code>.</td>
          </tr>
          <tr>
            <td>Assign Branch *</td>
            <td>Yes</td>
            <td>Dropdown of active branches as <code>Name (CODE)</code>. First option: Select a branch…</td>
          </tr>
          <tr>
            <td>What happens next?</td>
            <td>—</td>
            <td>Info panel describing link generation, manual share, password setup, 7-day expiry.</td>
          </tr>
          <tr>
            <td>Cancel</td>
            <td>—</td>
            <td>Abandon and return to Admins list.</td>
          </tr>
          <tr>
            <td>Generate Invitation Link</td>
            <td>—</td>
            <td>Submits to <code>api.createInvitation(email, branchId)</code>. Button label: <strong>Send Invitation</strong>.</td>
          </tr>
        </tbody>
      </table>

      <h2>Field reference — success screen</h2>
      <table>
        <thead>
          <tr>
            <th>Element</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Invitation Created</td>
            <td>Success heading with green check icon.</td>
          </tr>
          <tr>
            <td>Share this link with the new admin.</td>
            <td>Subtitle reminder — no automatic delivery.</td>
          </tr>
          <tr>
            <td>Email + branch summary</td>
            <td>Confirms invited email and assigned branch name/code.</td>
          </tr>
          <tr>
            <td>Full invitation URL</td>
            <td>
              Format: <code>{'{origin}'}/register-admin?token={'{token}'}</code>. Select-all enabled.
            </td>
          </tr>
          <tr>
            <td>Copy icon</td>
            <td>Copies URL to clipboard; shows checkmark when copied.</td>
          </tr>
          <tr>
            <td>Invite Another</td>
            <td>Clears form to invite a second administrator.</td>
          </tr>
          <tr>
            <td>Back to Admins</td>
            <td>Returns to pending invitations list.</td>
          </tr>
        </tbody>
      </table>

      <h2>What happens when</h2>
      <table>
        <thead>
          <tr>
            <th>Event</th>
            <th>Backend / UI behavior</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Form submitted successfully</td>
            <td>
              Backend creates invitation record with 7-day <code>expiresAt</code>. Response includes{' '}
              <code>data.link</code>, <code>data.emailSent</code>, and optional <code>data.emailWarning</code>.
              Resend sends HTML email when configured. UI switches to success screen; toast confirms creation.
            </td>
          </tr>
          <tr>
            <td>Invitee opens link (valid)</td>
            <td>
              Registration page at <code>/register-admin?token=…</code> loads. They set name and
              password. Account is bound to the pre-selected branch.
            </td>
          </tr>
          <tr>
            <td>Registration completes</td>
            <td>
              Pending row removed from <strong>Pending Invitations</strong>. Admin appears under{' '}
              <strong>Branch Admins</strong> with status <strong>active</strong>.
            </td>
          </tr>
          <tr>
            <td>Link older than 7 days</td>
            <td>Registration page rejects token. Generate a fresh invitation.</td>
          </tr>
          <tr>
            <td>Duplicate pending invite</td>
            <td>Backend may reject or replace depending on rules. Use <strong>Copy Link</strong> on
            existing pending row if one already exists.</td>
          </tr>
          <tr>
            <td>API failure</td>
            <td>Red error box under form with message (for example network or validation error).</td>
          </tr>
        </tbody>
      </table>

      <h2>What the new admin does</h2>
      <ol>
        <li>Open your invitation link before it expires (7 days).</li>
        <li>Complete the registration form and set a password.</li>
        <li>Sign in to the admin portal for their assigned branch.</li>
        <li>Set up academic years, classes, students, and staff.</li>
        <li>Send login credentials to teachers and students via WhatsApp from profile pages.</li>
      </ol>

      <h2>Permissions</h2>
      <p>
        <strong>Create invitations:</strong> <code>super_admin</code> only. Branch admins cannot access{' '}
        <code>/ceo/admins/invite</code>.
      </p>
      <p>
        <strong>Assign branch:</strong> CEO can assign any branch in the organization. The invitee is
        permanently scoped to that campus after registration.
      </p>
      <p>
        <strong>Share link:</strong> no role restriction on your side — but treat the URL like a
        password until used. Anyone with the link can register as that branch&apos;s admin until expiry.
      </p>

      <DocCallout variant="warn" title="Link expiry">
        Invitations expire after 7 days. If the link stops working, generate a new invitation for the
        same email and branch from this page or use <strong>Copy Link</strong> on a still-valid pending
        row.
      </DocCallout>

      <DocCallout variant="info" title="CEO invitations vs credential WhatsApp">
        <strong>CEO invitations</strong> — emailed automatically via Resend when configured; copy-link remains
        available as fallback.
        <br />
        <strong>Credential delivery</strong> — after admins are active, they use{' '}
        <strong>Generate credentials</strong> and <strong>Send credentials</strong> on student/teacher
        profiles in the admin portal. Those messages are delivered via WhatsApp when Meta WhatsApp is
        configured — not from the CEO portal.
      </DocCallout>

      <h2>Common issues &amp; fixes</h2>
      <table>
        <thead>
          <tr>
            <th>Symptom</th>
            <th>Cause</th>
            <th>Fix</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>&quot;Email is required&quot;</td>
            <td>Empty email field</td>
            <td>Enter a valid work email before submitting.</td>
          </tr>
          <tr>
            <td>&quot;Please select a branch&quot;</td>
            <td>No branch chosen</td>
            <td>Pick a campus from <strong>Assign Branch</strong>. Create one first if list is empty.</td>
          </tr>
          <tr>
            <td>&quot;Failed to create invitation&quot;</td>
            <td>API or duplicate invite error</td>
            <td>Check Admins page for existing pending row. Retry or contact technical support.</td>
          </tr>
          <tr>
            <td>Invitee says link does not work</td>
            <td>Expired or already used</td>
            <td>Regenerate if past 7 days. Confirm they use the full URL including token parameter.</td>
          </tr>
          <tr>
            <td>Wrong branch after registration</td>
            <td>Wrong branch selected at invite time</td>
            <td>Branch assignment is fixed at invitation. Deactivate and re-invite with correct branch.</td>
          </tr>
          <tr>
            <td>Assign Branch dropdown empty</td>
            <td>No branches exist</td>
            <td>Create branches on <Link href="/docs/intro/ceo/branches">Branches</Link> first.</td>
          </tr>
        </tbody>
      </table>

      <DocFaq
        items={[
          {
            q: 'Will the new admin receive an email automatically?',
            a: 'Yes, when RESEND_API_KEY and RESEND_FROM_EMAIL are configured on the backend. Otherwise the CEO portal only generates a link for you to copy and share manually.',
          },
          {
            q: 'Can I resend the same link later?',
            a: 'Yes. While the invitation is still pending and not expired, open Admins and click Copy Link on the pending row, or copy again from the success screen before navigating away.',
          },
          {
            q: 'What happens after the admin registers?',
            a: 'They appear in Branch Admins. You can view their profile on the Admin Profile page. They manage school operations under admin portal permissions.',
          },
        ]}
      />

      <h2>Related guides</h2>
      <ul>
        <li>
          <Link href="/docs/intro/ceo/admins">Admins</Link> — pending invitations and admin roster
        </li>
        <li>
          <Link href="/docs/intro/ceo/admins/profile">Admin Profile</Link> — after registration
        </li>
        <li>
          <Link href="/docs/intro/ceo/branches/create">Create a Branch</Link> — before first invite
        </li>
        <li>
          <Link href="/docs/intro/admin/permissions">Admin Permissions</Link> — what new admins can do
        </li>
        <li>
          <Link href="/docs/intro/ceo/permissions">CEO Permissions</Link> — invitation vs credential flows
        </li>
      </ul>
    </DocsShell>
  );
}
