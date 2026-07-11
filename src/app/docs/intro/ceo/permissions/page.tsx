import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep, DocFaq } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function CeoPermissionsPage() {
  return (
    <DocsShell
      title="CEO Permissions"
      subtitle="What the organization owner can do — and what branch admins handle instead."
      nav={introNav}
      variant="intro"
    >
      <h2>Overview</h2>
      <p>
        Mother Care School uses role-based access control. Your CEO account holds the{' '}
        <code>super_admin</code> role — the highest level in the system. Branch administrators,
        teachers, and students each have narrower access scoped to their campus and duties.
      </p>
      <p>
        <strong>Why this matters:</strong> knowing who can perform which action prevents security
        mistakes (for example sharing API keys with branch staff) and sets clear onboarding
        expectations (CEO invites admins via link; admins send credentials via WhatsApp).
      </p>
      <p>
        <strong>Portal routing:</strong> after sign-in, users are sent to the portal matching their
        role — only <code>super_admin</code> reaches <code>/ceo</code>. Wrong-role access attempts
        redirect automatically (for example branch admins to <code>/admin</code>).
      </p>

      <h2>Before you start</h2>
      <ul>
        <li>
          <strong>CEO account:</strong> must have JWT <code>role: super_admin</code>. This is the only
          role that opens the CEO portal.
        </li>
        <li>
          <strong>Not dual-purpose by default:</strong> CEO is for organization setup — branches,
          admins, API keys — not daily fee collection or attendance entry unless you also hold a
          branch admin assignment.
        </li>
        <li>
          <strong>Invitation vs credentials:</strong> two different delivery channels. CEO copies
          admin registration links (7-day expiry). Branch admins send login credentials via WhatsApp
          to students and staff.
        </li>
      </ul>

      <h2>CEO (super_admin) — full organization access</h2>
      <p>As CEO you can:</p>
      <ul>
        <li>View the organization-wide <Link href="/docs/intro/ceo/dashboard">CEO Dashboard</Link> and statistics</li>
        <li>Create, edit, archive, or delete branches</li>
        <li>Invite branch administrators and copy invitation links (manual share, 7-day expiry)</li>
        <li>View and edit admin profiles on <code>/ceo/admins/[userId]</code></li>
        <li>Remove branch admins from branch details (credentials deactivated; data preserved)</li>
        <li>Create, view, and revoke API keys (global or per-branch) on <code>/ceo/keys</code></li>
        <li>Access all CEO portal routes under <code>/ceo</code></li>
      </ul>
      <p>As CEO you typically do <em>not</em>:</p>
      <ul>
        <li>Run daily ERP tasks (fee collection, attendance entry, report cards) unless you also have a branch admin role</li>
        <li>Email or WhatsApp admin invitation links automatically — you copy and share manually</li>
        <li>Send student/teacher login credentials — that is branch admin work via WhatsApp</li>
        <li>Delegate CEO portal access to branch admins</li>
      </ul>

      <h2>Branch admin — one campus, full ERP</h2>
      <p>Branch administrators can:</p>
      <ul>
        <li>Manage students, classes, teachers, and academic years for their branch only</li>
        <li>Run fees, attendance, results, expenses, and other admin modules</li>
        <li>Invite and manage teachers and staff within their branch</li>
        <li>
          <strong>Generate credentials</strong> and <strong>Send credentials</strong> to students,
          teachers, and staff via WhatsApp (when Meta WhatsApp is configured)
        </li>
        <li>Assign module permissions to restricted management staff</li>
      </ul>
      <p>Branch admins cannot:</p>
      <ul>
        <li>Open the CEO portal or see organization-wide CEO controls</li>
        <li>Create or revoke API keys</li>
        <li>Create top-level branches or invite CEOs</li>
        <li>View or manage other branches&apos; data</li>
        <li>Override <code>super_admin</code> settings</li>
      </ul>

      <h2>Management staff — custom module access</h2>
      <p>
        Admins can mark staff as <em>restricted</em> and grant read / create / update / delete per
        module (fees, attendance, etc.). Details are in{' '}
        <Link href="/docs/intro/admin/permissions">Admin Permissions &amp; Staff Roles</Link>.
      </p>

      <h2>Teachers and students</h2>
      <ul>
        <li>
          <strong>Teachers</strong> — teacher portal and mobile app; class work, marks, chat. See{' '}
          <Link href="/docs/intro/teacher/permissions">Teacher Permissions</Link>.
        </li>
        <li>
          <strong>Students</strong> — mobile app (primary) and optional web portal for read-only
          academics, fees, attendance, and chat. No CEO or admin ERP access. See{' '}
          <Link href="/docs/intro/student">Student overview</Link>.
        </li>
      </ul>

      <h2>Step-by-step: typical CEO onboarding permissions flow</h2>
      <DocSteps>
        <DocStep title="CEO creates branches">
          Only <code>super_admin</code> can add campuses. Each branch needs a unique code.
        </DocStep>
        <DocStep title="CEO invites branch admin">
          From <strong>Admins</strong> → <strong>Invite New Admin</strong>, generate link and share
          manually (WhatsApp, etc.). Link expires in 7 days.
        </DocStep>
        <DocStep title="Admin registers and sets password">
          Invitee completes <code>/register-admin?token=…</code>. They gain full admin portal access
          for their assigned branch only.
        </DocStep>
        <DocStep title="Admin sets up academics">
          Admin creates academic year, classes, enrolls students, adds teachers — CEO does not do this.
        </DocStep>
        <DocStep title="Admin sends credentials via WhatsApp">
          From student/teacher profiles: <strong>Generate credentials</strong> then{' '}
          <strong>Send credentials</strong>. Requires phone on file and WhatsApp API config.
        </DocStep>
        <DocStep title="CEO issues API keys if needed">
          For mobile app or integrations, CEO creates publishable/secret keys on{' '}
          <strong>API Keys</strong> — not branch admins.
        </DocStep>
      </DocSteps>

      <h2>Field reference — role comparison</h2>
      <table>
        <thead>
          <tr>
            <th>Capability</th>
            <th>super_admin (CEO)</th>
            <th>Branch admin</th>
            <th>Teacher</th>
            <th>Student</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>CEO portal <code>/ceo</code></td>
            <td>Yes</td>
            <td>No</td>
            <td>No</td>
            <td>No</td>
          </tr>
          <tr>
            <td>Admin portal <code>/admin</code></td>
            <td>Only if also assigned</td>
            <td>Yes (one branch)</td>
            <td>No</td>
            <td>No</td>
          </tr>
          <tr>
            <td>Invite branch admin (link)</td>
            <td>Yes — manual copy</td>
            <td>No</td>
            <td>No</td>
            <td>No</td>
          </tr>
          <tr>
            <td>Send credentials (WhatsApp)</td>
            <td>No</td>
            <td>Yes</td>
            <td>No</td>
            <td>No</td>
          </tr>
          <tr>
            <td>API keys</td>
            <td>Create / revoke</td>
            <td>No</td>
            <td>No</td>
            <td>No</td>
          </tr>
          <tr>
            <td>Organization-wide stats</td>
            <td>Yes</td>
            <td>No (branch only)</td>
            <td>No</td>
            <td>No</td>
          </tr>
          <tr>
            <td>Mobile app</td>
            <td>N/A</td>
            <td>Optional</td>
            <td>Yes</td>
            <td>Yes (primary)</td>
          </tr>
        </tbody>
      </table>

      <h2>Email, invitations, and credentials</h2>
      <table>
        <thead>
          <tr>
            <th>Action</th>
            <th>Who does it</th>
            <th>How it is delivered</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Invite new branch admin</td>
            <td>CEO (<code>super_admin</code>)</td>
            <td>Registration link you copy and share — 7-day expiry. Not emailed or WhatsApp&apos;d by the system.</td>
          </tr>
          <tr>
            <td>Send login credentials to staff / students</td>
            <td>Branch admin</td>
            <td>WhatsApp template via Meta Cloud API from admin portal profile actions</td>
          </tr>
          <tr>
            <td>Admin sets own password</td>
            <td>New branch admin</td>
            <td>During <code>/register-admin</code> flow from CEO invitation link</td>
          </tr>
        </tbody>
      </table>

      <h2>What happens when</h2>
      <table>
        <thead>
          <tr>
            <th>Event</th>
            <th>System behavior</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Branch admin signs in</td>
            <td>JWT role routes to <code>/admin</code>. CEO routes return redirect.</td>
          </tr>
          <tr>
            <td>CEO signs in</td>
            <td>Routes to <code>/ceo</code> dashboard. <code>super_admin</code> guard passes.</td>
          </tr>
          <tr>
            <td>Teacher opens <code>/ceo</code></td>
            <td>Redirected to <code>/teacher</code> or <code>/admin</code> per role.</td>
          </tr>
          <tr>
            <td>Admin removed from branch</td>
            <td>Credentials deactivated. CEO can still see inactive badge on Admins list.</td>
          </tr>
          <tr>
            <td>API key revoked</td>
            <td>Only CEO action. Mobile apps lose API access until new key configured.</td>
          </tr>
        </tbody>
      </table>

      <h2>Permissions enforcement</h2>
      <p>
        <strong>CEO layout:</strong> decodes JWT client-side and redirects non-<code>super_admin</code>{' '}
        users before children render. Missing token sends to <code>/login</code>.
      </p>
      <p>
        <strong>Admin layout:</strong> branch-scoped data via <code>activeBranchId</code> and backend
        middleware. Admins never receive organization-wide aggregates available on CEO dashboard.
      </p>
      <p>
        <strong>API layer:</strong> server validates role and branch on every request. Client-side
        routing alone is not sufficient — backend enforces boundaries.
      </p>

      <DocCallout variant="info" title="Portal routing">
        If someone signs in with the wrong role, they are sent to their own portal — teachers to{' '}
        <code>/teacher</code>, admins to <code>/admin</code>, students to <code>/student</code>, and
        only <code>super_admin</code> users reach <code>/ceo</code>.
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
            <td>Branch admin cannot open CEO portal</td>
            <td>By design — not super_admin</td>
            <td>Use admin portal. CEO tasks require organization owner account.</td>
          </tr>
          <tr>
            <td>CEO redirected to /admin</td>
            <td>JWT role is not super_admin</td>
            <td>Verify account role with technical admin. CEO must be super_admin only.</td>
          </tr>
          <tr>
            <td>Admin expected invitation email</td>
            <td>CEO flow is manual link only</td>
            <td>CEO copies link from Admins or invite success screen and shares via WhatsApp.</td>
          </tr>
          <tr>
            <td>Credentials not received on WhatsApp</td>
            <td>Missing phone or WhatsApp config</td>
            <td>Branch admin checks phone on profile and Meta WhatsApp env vars — not a CEO task.</td>
          </tr>
          <tr>
            <td>Branch admin wants API key</td>
            <td>CEO-only capability</td>
            <td>CEO creates key on API Keys page and shares securely with technical team.</td>
          </tr>
        </tbody>
      </table>

      <DocFaq
        items={[
          {
            q: 'Can a branch admin also be CEO?',
            a: 'The CEO role is super_admin at the organization level. A person could hold multiple roles in theory, but CEO portal access requires super_admin in the JWT. Day-to-day campus work uses the admin portal separately.',
          },
          {
            q: 'Why does the CEO not send credential WhatsApp messages?',
            a: 'Onboarding is split: CEO provisions branch structure and admin accounts via invitation links. Branch admins who know their campus send credentials to students and teachers when enrollment is ready.',
          },
          {
            q: 'Who can revoke a branch admin?',
            a: 'CEO removes admins from branch details. This deactivates login but preserves academic data. Branch admins cannot remove themselves from CEO controls or create sibling branches.',
          },
        ]}
      />

      <h2>Related guides</h2>
      <ul>
        <li>
          <Link href="/docs/intro/ceo">CEO Portal overview</Link>
        </li>
        <li>
          <Link href="/docs/intro/ceo/admins/invite">Invite Admin</Link> — CEO invitation flow
        </li>
        <li>
          <Link href="/docs/intro/ceo/api-keys">API Keys</Link> — CEO-only integration keys
        </li>
        <li>
          <Link href="/docs/intro/admin">Admin Portal overview</Link>
        </li>
        <li>
          <Link href="/docs/intro/admin/permissions">Staff module permissions</Link>
        </li>
        <li>
          <Link href="/docs/intro/get-started">Get started</Link> — sign-in and role routing
        </li>
      </ul>
    </DocsShell>
  );
}
