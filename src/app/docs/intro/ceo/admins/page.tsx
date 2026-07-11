import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep, DocFaq } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function CeoAdminsPage() {
  return (
    <DocsShell
      title="Admins"
      subtitle="See every branch administrator and track pending invitations."
      nav={introNav}
      variant="intro"
    >
      <h2>Overview</h2>
      <p>
        The <strong>Admins</strong> page at <code>/ceo/admins</code> is your organization-wide roster
        of branch administrators. Branch admins run day-to-day campus operations in the admin portal —
        enrolling students, managing fees, attendance, results, and staff. As CEO you do not perform
        those tasks here; instead you see who is assigned to each campus, who is still waiting to
        register, and you can open any admin&apos;s profile to correct their details.
      </p>
      <p>
        <strong>Why it exists:</strong> every branch needs at least one active administrator before
        academic setup can begin. This screen answers two questions at once: <em>who is already
        running each campus?</em> and <em>who did I invite but has not finished registration yet?</em>
      </p>
      <p>
        <strong>Who uses it:</strong> organization owners with the <code>super_admin</code> role only.
        Branch admins manage teachers and students inside their own campus; they cannot see this page or
        invite other branch admins.
      </p>

      <h2>Before you start</h2>
      <ul>
        <li>
          <strong>Role:</strong> your JWT must contain <code>role: super_admin</code>. Other roles are
          redirected away from <code>/ceo</code> before this page loads.
        </li>
        <li>
          <strong>Branches exist:</strong> you need at least one branch before inviting an admin. Create
          campuses on the <Link href="/docs/intro/ceo/branches/create">Create a Branch</Link> page if
          the assign-branch dropdown would be empty.
        </li>
        <li>
          <strong>Sharing plan:</strong> CEO invitations are <em>not</em> emailed automatically. Prepare
          to copy the registration link and share it yourself — WhatsApp, SMS, or in person. See{' '}
          <Link href="/docs/intro/ceo/admins/invite">Invite Admin</Link> for the full flow.
        </li>
        <li>
          <strong>Credential delivery is different:</strong> after admins are active, they send login
          credentials to teachers and students from the admin portal via <strong>WhatsApp</strong> (not
          from the CEO portal). CEO invites use manual link copy only.
        </li>
      </ul>

      <h2>Step-by-step: using the Admins page</h2>
      <DocSteps>
        <DocStep title="Open Admins">
          Sign in at <code>/login</code> with your CEO account. Open the menu (☰) and choose{' '}
          <strong>Admins</strong> under Navigation, or go directly to <code>/ceo/admins</code>.
        </DocStep>
        <DocStep title="Review Pending Invitations">
          If anyone has not finished registration, a section titled{' '}
          <strong>Pending Invitations</strong> appears at the top. Each row shows the invited email,
          branch name and code, and an expiry date. Invitations expire after <strong>7 days</strong>.
        </DocStep>
        <DocStep title="Resend a registration link">
          Click <strong>Copy Link</strong> on a pending row. The button briefly changes to{' '}
          <strong>Copied</strong> and a toast confirms <em>Invitation link copied</em>. Paste the link
          into WhatsApp or another channel. The URL format is{' '}
          <code>/register-admin?token=…</code> on your school&apos;s domain.
        </DocStep>
        <DocStep title="Browse Branch Admins">
          Below pending invites, the <strong>Branch Admins</strong> section lists every registered
          administrator. Each row shows name, email, assigned branch (with map-pin icon), optional
          phone, and a status badge — <strong>active</strong> or inactive.
        </DocStep>
        <DocStep title="Open an admin profile">
          Click any admin row to open their profile at <code>/ceo/admins/[userId]</code>. You can
          update contact and employment fields on their behalf. See{' '}
          <Link href="/docs/intro/ceo/admins/profile">Admin Profile</Link>.
        </DocStep>
        <DocStep title="Invite a new admin">
          Click <strong>Invite New Admin</strong> (top-right). You are taken to{' '}
          <code>/ceo/admins/invite</code> to enter email, assign a branch, and generate a link.
        </DocStep>
      </DocSteps>

      <h2>Field reference — page elements</h2>
      <table>
        <thead>
          <tr>
            <th>Element</th>
            <th>Location</th>
            <th>Meaning</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Admins (title)</td>
            <td>Page header</td>
            <td>Confirms you are on the administrators list.</td>
          </tr>
          <tr>
            <td>Manage branch administrators and pending invitations. (subtitle)</td>
            <td>Below title</td>
            <td>Describes page purpose.</td>
          </tr>
          <tr>
            <td>Invite New Admin</td>
            <td>Top-right button</td>
            <td>Opens the invitation form at <code>/ceo/admins/invite</code>.</td>
          </tr>
          <tr>
            <td>Pending Invitations</td>
            <td>Top section (when non-empty)</td>
            <td>Outstanding registration links not yet completed.</td>
          </tr>
          <tr>
            <td>Email row</td>
            <td>Pending card</td>
            <td>Address the invite was created for; must match at registration.</td>
          </tr>
          <tr>
            <td>Branch · Expires date</td>
            <td>Pending card subtitle</td>
            <td>Assigned campus and 7-day expiry timestamp.</td>
          </tr>
          <tr>
            <td>Copy Link / Copied</td>
            <td>Pending card action</td>
            <td>Copies <code>{'{origin}'}/register-admin?token={'{token}'}</code> to clipboard.</td>
          </tr>
          <tr>
            <td>Branch Admins</td>
            <td>Main section</td>
            <td>All registered branch administrators organization-wide.</td>
          </tr>
          <tr>
            <td>active / inactive badge</td>
            <td>Admin row</td>
            <td>Whether the account can sign in. Green dot = active.</td>
          </tr>
          <tr>
            <td>No admins yet.</td>
            <td>Empty state</td>
            <td>No registered admins; use <strong>Invite your first admin</strong> link.</td>
          </tr>
          <tr>
            <td>Failed to load data</td>
            <td>Error banner</td>
            <td>API call to fetch invitations failed.</td>
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
            <td>Page loads</td>
            <td>
              <code>api.getInvitations()</code> returns both <code>admins</code> and{' '}
              <code>pendingInvitations</code>. Loading skeletons show until data arrives.
            </td>
          </tr>
          <tr>
            <td>You generate a new invitation</td>
            <td>
              A pending row appears on next visit (or after returning from invite page). No email is
              sent — you must share the link manually.
            </td>
          </tr>
          <tr>
            <td>Invitee completes registration</td>
            <td>
              Row disappears from <strong>Pending Invitations</strong> and a new entry appears under{' '}
              <strong>Branch Admins</strong> with status <strong>active</strong>.
            </td>
          </tr>
          <tr>
            <td>Invitation expires (7 days)</td>
            <td>
              Link stops working at <code>/register-admin</code>. Generate a fresh invitation for the
              same email and branch.
            </td>
          </tr>
          <tr>
            <td>You click Copy Link</td>
            <td>
              Full URL written to clipboard; toast <em>Invitation link copied</em>; button shows{' '}
              <strong>Copied</strong> for ~2 seconds.
            </td>
          </tr>
          <tr>
            <td>Admin deactivated on branch details</td>
            <td>
              Status badge changes to inactive; row remains visible. Academic data is preserved. Use{' '}
              <Link href="/docs/intro/ceo/branches/details">Branch Details</Link> →{' '}
              <strong>Remove admin</strong>.
            </td>
          </tr>
          <tr>
            <td>API error</td>
            <td>Error banner shown; lists may be empty.</td>
          </tr>
        </tbody>
      </table>

      <h2>Permissions</h2>
      <p>
        <strong>View admins list:</strong> <code>super_admin</code> only. The CEO layout enforces this
        at the route level.
      </p>
      <p>
        <strong>Invite admins:</strong> CEO only. Branch admins cannot invite other branch admins or
        access <code>/ceo/admins/invite</code>.
      </p>
      <p>
        <strong>Edit admin profiles:</strong> CEO can update profile fields from{' '}
        <code>/ceo/admins/[userId]</code>. Admins can also edit their own profile in the admin portal.
      </p>
      <p>
        <strong>Remove admin access:</strong> done from branch details, not from this list. Removal
        deactivates credentials but keeps all branch academic data.
      </p>
      <p>
        <strong>Send credentials to staff/students:</strong> branch admin responsibility via WhatsApp
        from the admin portal — not available on this CEO page.
      </p>

      <DocCallout variant="info" title="CEO invites use links, not email or WhatsApp">
        The CEO portal does <em>not</em> email or WhatsApp invitation links automatically. You copy the
        link and share it yourself. After admins register, they use <strong>Generate credentials</strong>{' '}
        and <strong>Send credentials</strong> on student/teacher profiles in the admin portal — those
        messages go out via WhatsApp when configured.
      </DocCallout>

      <DocCallout variant="tip" title="One admin per branch to start">
        Each branch needs at least one active admin before day-to-day work can begin. You can invite
        additional people through the same flow if your organization allows multiple admins per campus.
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
            <td>&quot;Failed to load data&quot;</td>
            <td>API error or expired token</td>
            <td>Sign out via <strong>Sign Out</strong> in sidebar, sign in again. Check backend logs.</td>
          </tr>
          <tr>
            <td>Pending invite never disappears</td>
            <td>Invitee used wrong email or link expired</td>
            <td>Confirm they register with the exact invited email. Regenerate if past 7 days.</td>
          </tr>
          <tr>
            <td>Copy Link does nothing</td>
            <td>Browser blocked clipboard</td>
            <td>Grant clipboard permission or copy from the invite success screen instead.</td>
          </tr>
          <tr>
            <td>Admin shows inactive</td>
            <td>Account deactivated on branch details</td>
            <td>Re-invite or contact technical admin to reactivate.</td>
          </tr>
          <tr>
            <td>Cannot open Admins — sent to /admin</td>
            <td>Not super_admin</td>
            <td>Use a CEO account. Only <code>super_admin</code> reaches <code>/ceo</code>.</td>
          </tr>
          <tr>
            <td>Empty branch list when inviting</td>
            <td>No branches created yet</td>
            <td>Create branches first on <Link href="/docs/intro/ceo/branches">Branches</Link>.</td>
          </tr>
        </tbody>
      </table>

      <DocFaq
        items={[
          {
            q: 'Does the system email the invitation link to the new admin?',
            a: 'No. CEO invitations are manual copy-and-share only. Paste the link into WhatsApp, SMS, or email yourself. Credential delivery via WhatsApp applies later when branch admins send login details to students and teachers.',
          },
          {
            q: 'Can I invite the same email to a different branch?',
            a: 'Generate a new invitation with the correct branch selected. Each invite ties one email to one branch at registration time.',
          },
          {
            q: 'How do I fully remove an admin?',
            a: 'Use Remove admin on the branch details page. This deactivates login credentials. The admin row may still appear here with an inactive badge.',
          },
        ]}
      />

      <h2>Related guides</h2>
      <ul>
        <li>
          <Link href="/docs/intro/ceo/admins/invite">Invite Admin</Link> — generate registration links
        </li>
        <li>
          <Link href="/docs/intro/ceo/admins/profile">Admin Profile</Link> — edit administrator details
        </li>
        <li>
          <Link href="/docs/intro/ceo/branches/details">Branch Details</Link> — remove admin access
        </li>
        <li>
          <Link href="/docs/intro/ceo/permissions">CEO Permissions</Link> — CEO vs branch admin roles
        </li>
        <li>
          <Link href="/docs/intro/ceo">CEO Portal overview</Link> — full setup workflow
        </li>
        <li>
          <Link href="/docs/intro/admin">Admin Portal overview</Link> — what branch admins do next
        </li>
      </ul>
    </DocsShell>
  );
}
