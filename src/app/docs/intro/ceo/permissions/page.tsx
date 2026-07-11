import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function CeoPermissionsPage() {
  return (
    <DocsShell
      title="CEO Permissions"
      subtitle="What the organization owner can do — and what branch admins handle instead."
      nav={introNav}
      variant="intro"
    >
      <p>
        Mother Care School uses role-based access. Your CEO account is a{' '}
        <strong>super_admin</strong> — the highest level. Branch admins and staff have narrower
        access inside their campus.
      </p>

      <h2>CEO (super_admin) — full organization access</h2>
      <p>As CEO you can:</p>
      <ul>
        <li>View the organization-wide dashboard and statistics</li>
        <li>Create, edit, archive, or delete branches</li>
        <li>Invite branch administrators and copy invitation links</li>
        <li>View and edit admin profiles</li>
        <li>Remove branch admins (credentials deactivated; data preserved)</li>
        <li>Create, view, and revoke API keys (global or per-branch)</li>
        <li>Access the CEO portal routes under <code>/ceo</code></li>
      </ul>
      <p>
        You are <em>not</em> meant to run daily ERP tasks (fee collection, attendance entry, report
        cards) in the admin portal unless you also hold a branch admin role — those workflows belong
        to campus staff.
      </p>

      <h2>Branch admin — one campus, full ERP</h2>
      <p>Branch administrators can:</p>
      <ul>
        <li>Manage students, classes, teachers, and academic years for their branch</li>
        <li>Run fees, attendance, results, expenses, and other admin modules</li>
        <li>Invite and manage teachers and staff (within their branch)</li>
        <li>Send login credential emails to students, teachers, and staff via Resend</li>
        <li>Assign module permissions to restricted management staff</li>
      </ul>
      <p>Branch admins cannot:</p>
      <ul>
        <li>Open the CEO portal or see other branches&apos; organization-wide controls</li>
        <li>Create or revoke API keys (CEO only)</li>
        <li>Create new top-level branches or invite CEOs</li>
        <li>Override super_admin settings</li>
      </ul>

      <h2>Management staff — custom module access</h2>
      <p>
        Admins can mark staff as <em>restricted</em> and grant read / create / update / delete per
        module (fees, attendance, etc.). Details are in{' '}
        <Link href="/docs/intro/admin/permissions">Admin Permissions & Staff Roles</Link>.
      </p>

      <h2>Teachers and students</h2>
      <ul>
        <li>
          <strong>Teachers</strong> — teacher portal and mobile app; class work, marks, chat. See{' '}
          <Link href="/docs/intro/teacher/permissions">Teacher Permissions</Link>.
        </li>
        <li>
          <strong>Students</strong> — mobile app for academics, fees view, attendance, chat. No CEO
          or admin ERP access.
        </li>
      </ul>

      <h2>Email and invitations</h2>
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
            <td>CEO</td>
            <td>Registration link you copy and share (7-day expiry)</td>
          </tr>
          <tr>
            <td>Send login credentials to staff / students</td>
            <td>Branch admin</td>
            <td>Email via Resend from admin portal profile actions</td>
          </tr>
        </tbody>
      </table>

      <DocCallout variant="info" title="Portal routing">
        If someone signs in with the wrong role, they are sent to their own portal — teachers to
        <code>/teacher</code>, admins to <code>/admin</code>, and only <code>super_admin</code>{' '}
        users reach <code>/ceo</code>.
      </DocCallout>

      <h2>Quick reference</h2>
      <ul>
        <li>
          <Link href="/docs/intro/ceo">CEO Portal overview</Link>
        </li>
        <li>
          <Link href="/docs/intro/admin">Admin Portal overview</Link>
        </li>
        <li>
          <Link href="/docs/intro/admin/permissions">Staff module permissions</Link>
        </li>
      </ul>
    </DocsShell>
  );
}
