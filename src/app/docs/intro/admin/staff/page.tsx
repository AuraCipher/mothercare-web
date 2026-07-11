import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep, DocFaq } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function AdminStaffPage() {
  return (
    <DocsShell
      title="Staff"
      subtitle="Management workers, permission matrix, payroll records, and WhatsApp credentials."
      nav={introNav}
      variant="intro"
    >
      <h2>Overview</h2>
      <p>
        The <strong>Staff</strong> module at <code>/admin/staff</code> manages non-teacher branch
        employees who may need partial ERP access — accountants, registrars, exam cell officers,
        canteen managers. Create <strong>restricted staff</strong> with per-module CRUD permissions,
        or <strong>workers</strong> with payroll/attendance records but no portal login.
      </p>
      <p>
        <strong>Why it exists:</strong> schools delegate ERP tasks without giving every employee full
        admin rights. The permission matrix defined here drives the slim navigation shell restricted
        users see after sign-in.
      </p>
      <p>
        <strong>Who uses it:</strong> <strong>branch admins only</strong>. Restricted staff cannot
        view or edit other users&apos; permissions.
      </p>

      <h2>Before you start</h2>
      <ul>
        <li>Understand module keys — see <Link href="/docs/intro/admin/permissions">Permissions guide</Link> for full CRUD matrix.</li>
        <li>Plan minimum permissions before creating accounts (principle of least privilege).</li>
        <li>For login-enabled staff, collect a valid <strong>phone</strong> for WhatsApp credentials.</li>
      </ul>

      <h2>Step-by-step: common workflows</h2>
      <DocSteps>
        <DocStep title="Add management staff (with login)">
          Click <strong>Add Staff</strong> → identity fields (name, username, phone, etc.) →{' '}
          <strong>Permission Matrix</strong> — enable at least one module with Read → save. User is
          marked restricted and sees only assigned modules.
        </DocStep>
        <DocStep title="Add worker (no login)">
          Click <strong>Add Worker</strong> → profile and employment fields, optional photo → save.
          Worker appears in payroll and staff attendance but has no credentials section.
        </DocStep>
        <DocStep title="Edit module permissions">
          Open staff profile → <strong>Module Permissions</strong> → edit matrix → save. Staff
          should refresh browser to see sidebar changes.
        </DocStep>
        <DocStep title="Set login credentials">
          On profile (staff with login only): generate password, save with admin password
          confirmation.
        </DocStep>
        <DocStep title="Send credentials via WhatsApp">
          Click <strong>Send via WhatsApp</strong>. Disabled if phone is missing — warning shown.
          Calls <code>api.sendStaffCredentials(userId)</code> → Meta template queued.
        </DocStep>
        <DocStep title="Deactivate or reactivate">
          Deactivated staff cannot sign in; payroll history retained. Use for leavers instead of
          delete when records must persist.
        </DocStep>
        <DocStep title="Filter the list">
          Search by name, filter by role (all/staff/worker), status (active/inactive).
        </DocStep>
      </DocSteps>

      <h2>Field reference — create staff</h2>
      <table>
        <thead>
          <tr><th>Field</th><th>Required</th><th>Notes</th></tr>
        </thead>
        <tbody>
          <tr><td>Name</td><td>Yes</td><td>Display name</td></tr>
          <tr><td>Username</td><td>Yes (staff)</td><td>Portal login</td></tr>
          <tr><td>Phone</td><td>For WhatsApp</td><td>Required to enable Send via WhatsApp</td></tr>
          <tr><td>Email, employee ID, address, salary, etc.</td><td>No</td><td>HR profile fields</td></tr>
          <tr><td>Permission matrix</td><td>Yes (staff)</td><td>Min 1 module with Read</td></tr>
          <tr><td>Photo</td><td>No</td><td>Upload via file picker</td></tr>
        </tbody>
      </table>

      <h2>Field reference — permission matrix columns</h2>
      <table>
        <thead>
          <tr><th>Column</th><th>Effect</th></tr>
        </thead>
        <tbody>
          <tr><td>Read</td><td>Module visible in slim sidebar; view data</td></tr>
          <tr><td>Create</td><td>Add records, generate fees, mark attendance, etc.</td></tr>
          <tr><td>Update</td><td>Edit existing records</td></tr>
          <tr><td>Delete</td><td>Remove records, void vouchers (Payments)</td></tr>
          <tr><td>Archived Read/Create/Update/Delete</td><td>Same actions when academic year is ARCHIVED</td></tr>
        </tbody>
      </table>
      <p>Modules: Students, Operations, Timetable, Attendance, Fees, Result, Canteen, Stationary, Payments, Documents.</p>

      <h2>Field reference — profile sections</h2>
      <table>
        <thead>
          <tr><th>Section</th><th>Staff with login</th><th>Worker</th></tr>
        </thead>
        <tbody>
          <tr><td>Profile</td><td>View/edit all fields</td><td>View/edit all fields</td></tr>
          <tr><td>Module Permissions</td><td>Edit matrix</td><td>Hidden</td></tr>
          <tr><td>Payments</td><td>Payroll history</td><td>Payroll history</td></tr>
          <tr><td>Tenure history</td><td>Join/leave events</td><td>Join/leave events</td></tr>
          <tr><td>Login Credentials</td><td>Username, password, Save, Send via WhatsApp</td><td>Hidden — &quot;payroll and attendance only&quot;</td></tr>
        </tbody>
      </table>

      <h2>What happens when</h2>
      <table>
        <thead>
          <tr><th>Event</th><th>Behavior</th></tr>
        </thead>
        <tbody>
          <tr><td>Restricted staff created</td><td><code>isRestricted: true</code>; slim shell on login</td></tr>
          <tr><td>Permissions updated</td><td>Sidebar modules add/remove on next load</td></tr>
          <tr><td>Send via WhatsApp</td><td>Fresh temp password + Meta template to phone</td></tr>
          <tr><td>Worker created</td><td>No user login; appears in payroll list</td></tr>
          <tr><td>Canteen sales-only grant</td><td>User with Canteen read+create only → auto-redirect to sales POS</td></tr>
          <tr><td>Deactivate</td><td>Login blocked immediately</td></tr>
        </tbody>
      </table>

      <h2>Permissions</h2>
      <p>
        Only <strong>branch admins</strong> can open Staff management and edit the permission matrix.
        Restricted staff cannot access <code>/admin/staff</code>.
      </p>
      <p>
        Full module CRUD reference:{' '}
        <Link href="/docs/intro/admin/permissions">Permissions &amp; Staff Roles</Link>.
      </p>

      <DocCallout variant="warn" title="Security">
        Grant the minimum permissions needed. A cashier needs Fees read + create but not Result
        delete. Review permissions when staff change roles or at year-end.
      </DocCallout>

      <DocCallout variant="info" title="WhatsApp credentials">
        Staff credentials send via WhatsApp to the profile phone field. Button is disabled without
        phone. Workers never receive login credentials from this screen.
      </DocCallout>

      <h2>Common issues &amp; fixes</h2>
      <table>
        <thead>
          <tr><th>Symptom</th><th>Cause</th><th>Fix</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Send via WhatsApp disabled</td>
            <td>Phone field empty</td>
            <td>Edit profile and add valid phone with country code</td>
          </tr>
          <tr>
            <td>Staff sees no modules</td>
            <td>No read permission on any module</td>
            <td>Edit matrix — enable Read on at least one module</td>
          </tr>
          <tr>
            <td>Sidebar unchanged after edit</td>
            <td>Browser cache</td>
            <td>Staff refreshes page or re-logins</td>
          </tr>
          <tr>
            <td>Cannot create staff</td>
            <td>Username duplicate</td>
            <td>Choose unique username across branch</td>
          </tr>
          <tr>
            <td>Worker has login section</td>
            <td>Wrong create flow used</td>
            <td>Workers use Add Worker — no credentials section</td>
          </tr>
        </tbody>
      </table>

      <h2>Role templates (suggested starting points)</h2>
      <table>
        <thead>
          <tr><th>Role</th><th>Suggested modules</th><th>Typical CRUD</th></tr>
        </thead>
        <tbody>
          <tr><td>Fee cashier</td><td>Fees</td><td>Read + Create (+ Update for corrections)</td></tr>
          <tr><td>Registrar</td><td>Students, Operations</td><td>Full CRUD on both</td></tr>
          <tr><td>Exam cell</td><td>Result, Attendance (read)</td><td>Result full; Attendance read</td></tr>
          <tr><td>Canteen counter</td><td>Canteen</td><td>Read + Create only (sales-only)</td></tr>
          <tr><td>Accountant</td><td>Fees (read), Payments (full)</td><td>Payments read/create/delete for voids</td></tr>
          <tr><td>Store keeper</td><td>Stationary</td><td>Full CRUD</td></tr>
        </tbody>
      </table>

      <h2>FAQ</h2>
      <DocFaq
        items={[
          {
            q: 'What is the difference between Add Staff and Add Worker?',
            a: 'Staff get usernames, module permissions, and portal login. Workers are HR/payroll records only with no ERP access.',
          },
          {
            q: 'Can I make someone a full admin from here?',
            a: 'Full admins are invited via CEO portal as branch_admin. Staff page creates restricted management accounts.',
          },
          {
            q: 'Why does my staff member not see the dashboard?',
            a: 'Restricted users are redirected to their first allowed module — expected behavior.',
          },
          {
            q: 'How do I give canteen counter staff access?',
            a: 'Grant Canteen Read + Create only — they auto-land on Daily Sales without catalog access.',
          },
          {
            q: 'Can staff permissions differ per branch?',
            a: 'Yes. Permissions are stored per branch. Multi-branch staff may have different matrices at each campus.',
          },
        ]}
      />

      <h2>API endpoints (reference)</h2>
      <table>
        <thead>
          <tr><th>Method</th><th>Endpoint</th><th>Purpose</th></tr>
        </thead>
        <tbody>
          <tr><td>GET</td><td><code>/admin/staff</code></td><td>List staff and workers</td></tr>
          <tr><td>POST</td><td><code>/admin/staff</code></td><td>Create restricted staff</td></tr>
          <tr><td>PUT</td><td><code>/admin/staff/:userId/permissions</code></td><td>Update module matrix</td></tr>
          <tr><td>POST</td><td><code>/admin/staff/:userId/send-credentials</code></td><td>WhatsApp credentials</td></tr>
        </tbody>
      </table>

      <h2>Navigation paths</h2>
      <table>
        <thead>
          <tr><th>Screen</th><th>URL</th></tr>
        </thead>
        <tbody>
          <tr><td>Staff list</td><td><code>/admin/staff</code></td></tr>
          <tr><td>Staff profile</td><td><code>/admin/staff/[id]</code></td></tr>
          <tr><td>Permission reference</td><td><code>/docs/intro/admin/permissions</code></td></tr>
          <tr><td>Payroll</td><td><code>/admin/expenses/payroll</code></td></tr>
        </tbody>
      </table>

      <h2>Related guides</h2>
      <ul>
        <li><Link href="/docs/intro/admin/permissions">Permissions &amp; Staff Roles</Link> — full module CRUD tables</li>
        <li><Link href="/docs/intro/admin/expenses/payroll">Payroll</Link> — pay staff and workers</li>
        <li><Link href="/docs/intro/admin/attendance/staff">Staff Attendance</Link></li>
        <li><Link href="/docs/api/email">API: WhatsApp credentials</Link></li>
      </ul>
    </DocsShell>
  );
}
