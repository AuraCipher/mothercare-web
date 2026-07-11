import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function CeoOverviewPage() {
  return (
    <DocsShell
      title="CEO Portal"
      subtitle="The organization owner's control center — branches, branch admins, and API keys."
      nav={introNav}
      variant="intro"
    >
      <h2>Overview</h2>
      <p>
        The <strong>CEO portal</strong> is the top-level management interface for Mother Care School.
        It is designed for the organization owner — the person who oversees every campus, not the
        day-to-day running of a single branch. Your account must have the <strong>super_admin</strong>{' '}
        role. When you sign in, the system routes you to <code>/ceo</code>; branch administrators
        and teachers are sent to their own portals automatically.
      </p>
      <p>
        Think of the CEO portal as the <em>structure and access</em> layer. You decide how many
        campuses exist, who administers each one, and which external systems may connect through
        API keys. Branch admins handle students, fees, attendance, results, and staff inside the{' '}
        <Link href="/docs/intro/admin">admin portal</Link>. Teachers and students use their own apps.
      </p>
      <p>
        <strong>Who uses this portal:</strong> the school owner, director, or designated head office
        administrator with a <code>super_admin</code> account. No other role can open{' '}
        <code>/ceo</code> — the layout checks your JWT and redirects non-CEO users to{' '}
        <code>/admin</code>.
      </p>

      <h2>Before you start</h2>
      <p>Make sure the following are in place before you rely on the CEO portal for setup:</p>
      <ul>
        <li>
          <strong>CEO login credentials</strong> — a <code>super_admin</code> account created during
          initial deployment or database seed. Sign in at <code>/login</code>.
        </li>
        <li>
          <strong>Modern browser</strong> — Chrome, Firefox, Safari, or Edge with JavaScript enabled.
          The portal stores your session token in <code>localStorage</code> and an httpOnly cookie.
        </li>
        <li>
          <strong>Stable internet</strong> — all actions call the live backend API. Offline mode is
          not supported.
        </li>
        <li>
          <strong>A plan for sharing invitation links</strong> — when you invite branch admins, the
          system gives you a link to copy manually (WhatsApp, SMS, or email from your own account).
          The CEO portal does not send invitation emails automatically.
        </li>
      </ul>
      <p>
        <strong>Permissions required:</strong> only <code>super_admin</code>. Branch admins, teachers,
        management staff, students, and parents cannot access any CEO route. See{' '}
        <Link href="/docs/intro/ceo/permissions">CEO Permissions</Link> for the full comparison with
        other roles.
      </p>

      <h2>What you can do here</h2>
      <p>The CEO sidebar contains four main areas. Each has a dedicated guide:</p>
      <ul>
        <li>
          <Link href="/docs/intro/ceo/dashboard">Dashboard</Link> — organization-wide totals for
          branches, staff, students, and active API keys, plus a staff-by-role breakdown and quick
          actions.
        </li>
        <li>
          <Link href="/docs/intro/ceo/branches">Branches</Link> — list every campus, create new
          branches, edit contact details, archive or delete empty branches, and open per-branch
          statistics.
        </li>
        <li>
          <Link href="/docs/intro/ceo/admins">Admins</Link> — view all branch administrators,
          track pending invitations (7-day expiry), copy registration links, and open admin profiles.
        </li>
        <li>
          <Link href="/docs/intro/ceo/api-keys">API Keys</Link> — create publishable or secret keys
          with global or branch scope, copy the one-time full key, and revoke compromised keys.
        </li>
      </ul>

      <h2>Step-by-step: first-time organization setup</h2>
      <DocSteps>
        <DocStep title="Sign in as CEO">
          Go to <code>/login</code>, enter your super_admin email and password, and confirm you land
          on the <strong>CEO Dashboard</strong> with the <strong>CEO Panel</strong> header and CEO
          badge in the top bar.
        </DocStep>
        <DocStep title="Review the dashboard">
          Check <strong>Total Branches</strong>, <strong>Total Staff</strong>,{' '}
          <strong>Total Students</strong>, and <strong>Active API Keys</strong>. A fresh install
          typically shows one branch and low counts until admins enroll people.
        </DocStep>
        <DocStep title="Create additional branches (if needed)">
          Open <strong>Branches</strong> from the sidebar (menu icon → <strong>Branches</strong>) or
          use <strong>Manage Branches</strong> on the dashboard. Click <strong>Add Branch</strong>,
          fill <strong>Branch Name</strong> and <strong>Branch Code</strong>, then{' '}
          <strong>Create Branch</strong>. Full field reference:{' '}
          <Link href="/docs/intro/ceo/branches/create">Create a Branch</Link>.
        </DocStep>
        <DocStep title="Invite a branch administrator">
          Go to <strong>Admins</strong> → <strong>Invite New Admin</strong>. Enter{' '}
          <strong>Email Address</strong>, choose <strong>Assign Branch</strong>, click{' '}
          <strong>Generate Invitation Link</strong>, then copy and share the link. The invitee has 7
          days to register at <code>/register-admin?token=…</code>.
        </DocStep>
        <DocStep title="Let the admin run the campus">
          After registration, the new admin signs in to the admin portal for their branch. They set
          up academic years, classes, students, and teachers. Login credentials for students and
          staff are sent via <strong>WhatsApp</strong> from the admin portal — not from the CEO
          portal.
        </DocStep>
        <DocStep title="Create API keys (optional)">
          When you need mobile apps or integrations, open <strong>API Keys</strong> →{' '}
          <strong>Create Key</strong>. Copy the full key immediately — it is shown only once.
        </DocStep>
      </DocSteps>

      <h2>Portal layout and navigation</h2>
      <p>Every CEO page shares the same chrome:</p>
      <ul>
        <li>
          <strong>Header</strong> — hamburger menu, <strong>CEO Panel</strong> home link, docs help
          link, active branch name (when applicable), your display name, and a <strong>CEO</strong>{' '}
          badge.
        </li>
        <li>
          <strong>Sidebar</strong> (opened via menu) — your name, <strong>CEO · Full access</strong>,
          optional <strong>Active Branch</strong> switcher, navigation links (Dashboard, Branches,
          Admins, API Keys), and <strong>Sign Out</strong>.
        </li>
        <li>
          <strong>Main content</strong> — page-specific data loaded from the API on each visit.
        </li>
      </ul>
      <p>
        The <strong>Active Branch</strong> switcher in the sidebar sets context in{' '}
        <code>localStorage</code> for features that reference a branch. CEO-wide actions (creating
        branches, inviting admins, API keys) do not require a branch selection, but the switcher
        helps when you are associated with specific campuses.
      </p>

      <h2>What happens when — key backend effects</h2>
      <table>
        <thead>
          <tr>
            <th>Your action</th>
            <th>What the system does</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Sign in as super_admin</td>
            <td>
              Issues a JWT (7-day session). Stores <code>token</code> in localStorage and an httpOnly
              cookie. CEO layout allows access to <code>/ceo/*</code>.
            </td>
          </tr>
          <tr>
            <td>Create a branch</td>
            <td>
              Inserts a new <code>Branch</code> record with uppercase code, active status, and
              optional contact fields. Appears immediately in the branches list.
            </td>
          </tr>
          <tr>
            <td>Generate admin invitation</td>
            <td>
              Creates an invitation row with a unique token and 7-day <code>expiresAt</code>. Returns
              a registration URL — no automatic email or WhatsApp is sent from the CEO flow.
            </td>
          </tr>
          <tr>
            <td>Admin completes registration</td>
            <td>
              Creates user + branch membership with <code>management</code> role. Invitation moves
              from pending to registered; admin can access <code>/admin</code>.
            </td>
          </tr>
          <tr>
            <td>Create API key</td>
            <td>
              Stores hashed key with prefix (<code>pk_mcs_…</code> or <code>sk_mcs_…</code>). Returns
              full key once in the create response.
            </td>
          </tr>
          <tr>
            <td>Archive / delete branch</td>
            <td>
              Branches with academic years or members are archived (<code>isActive: false</code>,
              data preserved). Empty branches are permanently deleted.
            </td>
          </tr>
          <tr>
            <td>Remove branch admin</td>
            <td>
              Deactivates their credentials for that branch. Students, teachers, and classes remain
              untouched.
            </td>
          </tr>
        </tbody>
      </table>

      <h2>Permissions</h2>
      <p>
        The CEO portal is exclusively for <strong>super_admin</strong>. The layout decodes your JWT
        and redirects anyone else to <code>/admin</code>. Within the portal you have unrestricted
        organization-level access: all branches, all invitations, all API keys, and all admin
        profiles. You do not automatically have branch-scoped ERP permissions unless you are also
        assigned as a branch member — daily school operations belong in the admin portal. Full
        matrix: <Link href="/docs/intro/ceo/permissions">CEO Permissions</Link>.
      </p>

      <h2>CEO vs branch admin — delivery channels</h2>
      <DocCallout variant="info" title="Invitations vs credentials">
        <strong>CEO admin invitations</strong> — you receive a registration link to copy and share
        manually. Expires in 7 days. No automatic email.
        <br />
        <br />
        <strong>Student / teacher / staff credentials</strong> — branch admins send these from profile
        pages in the admin portal. Delivery is via the <strong>Meta WhatsApp Cloud API</strong>{' '}
        (queued through BullMQ), using the phone number on each person&apos;s profile. This is not
        sent through Resend email.
      </DocCallout>

      <h2>Common issues &amp; fixes</h2>
      <table>
        <thead>
          <tr>
            <th>Problem</th>
            <th>Likely cause</th>
            <th>What to do</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Redirected to /admin after login</td>
            <td>Account is not super_admin</td>
            <td>
              Confirm role with your technical contact. Only super_admin reaches /ceo. Branch admins
              use /admin.
            </td>
          </tr>
          <tr>
            <td>&quot;Failed to load stats&quot; on dashboard</td>
            <td>API unreachable or session expired</td>
            <td>Refresh the page. Sign out and sign in again. Check backend health.</td>
          </tr>
          <tr>
            <td>Cannot invite admin — branch list empty</td>
            <td>No branches created yet</td>
            <td>
              Create a branch first via <strong>Add Branch</strong>. See{' '}
              <Link href="/docs/intro/ceo/branches/create">Create a Branch</Link>.
            </td>
          </tr>
          <tr>
            <td>Invitation link expired</td>
            <td>More than 7 days since generation</td>
            <td>
              Generate a new invitation for the same email and branch. Copy the fresh link from the
              invite screen or <strong>Copy Link</strong> on the Admins page.
            </td>
          </tr>
          <tr>
            <td>New campus shows zero students</td>
            <td>Branch admin has not enrolled anyone</td>
            <td>
              Normal for new branches. The branch admin must set up academic years and students in
              the admin portal.
            </td>
          </tr>
          <tr>
            <td>Lost API key after creation</td>
            <td>Full key shown only once by design</td>
            <td>Revoke the old key and create a new one. Update your integration config.</td>
          </tr>
        </tbody>
      </table>

      <h2>Related guides</h2>
      <ul>
        <li>
          <Link href="/docs/intro/ceo/dashboard">CEO Dashboard</Link> — reading organization stats
        </li>
        <li>
          <Link href="/docs/intro/ceo/branches">Branches</Link> — campus list and lifecycle
        </li>
        <li>
          <Link href="/docs/intro/ceo/branches/create">Create a Branch</Link> — add a new campus
        </li>
        <li>
          <Link href="/docs/intro/ceo/admins/invite">Invite Admin</Link> — onboarding branch admins
        </li>
        <li>
          <Link href="/docs/intro/ceo/api-keys">API Keys</Link> — integrations and mobile apps
        </li>
        <li>
          <Link href="/docs/intro/ceo/permissions">CEO Permissions</Link> — role comparison
        </li>
        <li>
          <Link href="/docs/intro/admin">Admin Portal overview</Link> — what branch admins do next
        </li>
      </ul>
    </DocsShell>
  );
}
