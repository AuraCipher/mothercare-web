import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep, DocFaq } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function AdminPermissionsPage() {
  return (
    <DocsShell
      title="Admin Permissions & Staff Roles"
      subtitle="Who can do what in the admin portal — roles, module matrix, archived years, and credentials."
      nav={introNav}
      variant="intro"
    >
      <h2>Overview</h2>
      <p>
        The admin portal serves two audiences: <strong>branch administrators</strong> with full campus
        access, and <strong>restricted management staff</strong> who see only the ERP modules their
        admin assigned. Permissions are enforced in the sidebar, on each page, and on the backend API.
        Understanding this model prevents over-granting access and explains why a colleague cannot see
        a menu item you use daily.
      </p>
      <p>
        <strong>Why it exists:</strong> schools delegate day-to-day work — fee collection, attendance
        marking, result entry — without giving every employee teacher lists, payroll, or settings
        access. The permission matrix on the{' '}
        <Link href="/docs/intro/admin/staff">Staff</Link> page defines exactly which modules and CRUD
        actions each person may perform.
      </p>
      <p>
        <strong>Who uses it:</strong> branch admins configure permissions when creating or editing
        staff. Restricted staff experience the result every time they sign in. Teachers use a
        separate teacher portal and are <em>not</em> governed by this ERP matrix.
      </p>

      <h2>Before you start</h2>
      <ul>
        <li>
          <strong>Role clarity:</strong> only <code>branch_admin</code> and <code>sub_admin</code>{' '}
          have full ERP access. Everyone else marked <em>restricted</em> needs an explicit matrix.
        </li>
        <li>
          <strong>Branch context:</strong> permissions are per branch. A staff member working at two
          campuses may have different rights at each.
        </li>
        <li>
          <strong>Academic year:</strong> select branch and year from the sidebar before testing what
          a restricted user can do. Archived years apply a second layer of rules.
        </li>
        <li>
          <strong>Minimum grant:</strong> when creating restricted staff, at least one module must
          have <strong>Read</strong> enabled or the account cannot access the portal.
        </li>
      </ul>

      <h2>Role types</h2>
      <table>
        <thead>
          <tr>
            <th>Role</th>
            <th>Portal access</th>
            <th>Typical use</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Branch admin / Sub-admin</td>
            <td>Full sidebar — all modules, teachers, classes, settings, branches</td>
            <td>Campus principal, head of administration</td>
          </tr>
          <tr>
            <td>Restricted management staff</td>
            <td>Slim shell — only assigned modules appear in navigation</td>
            <td>Accountant, registrar, exam cell, canteen manager</td>
          </tr>
          <tr>
            <td>Worker (no login)</td>
            <td>None — payroll and attendance records only</td>
            <td>Janitorial, security, hourly workers</td>
          </tr>
          <tr>
            <td>Canteen staff</td>
            <td>Canteen sales screen only (auto-redirect)</td>
            <td>Counter staff recording daily sales</td>
          </tr>
          <tr>
            <td>Teacher</td>
            <td>Teacher portal (<code>/teacher</code>), not admin ERP</td>
            <td>Classroom teaching, mobile app</td>
          </tr>
        </tbody>
      </table>

      <h2>Step-by-step: assign module permissions</h2>
      <DocSteps>
        <DocStep title="Open Staff management">
          Go to <Link href="/docs/intro/admin/staff">Staff</Link> → <strong>Add Staff</strong> for a
          new hire, or open an existing profile to edit.
        </DocStep>
        <DocStep title="Review the permission matrix">
          Each row is an ERP module. Columns are <strong>Read</strong>, <strong>Create</strong>,{' '}
          <strong>Update</strong>, and <strong>Delete</strong>. Toggle only what the job requires.
        </DocStep>
        <DocStep title="Set archived-year overrides">
          Expand archived columns when someone must view or edit historical years (e.g. an accountant
          reconciling last year&apos;s fees). Without archived read, archived years are hidden from
          the year dropdown.
        </DocStep>
        <DocStep title="Save and test">
          Ask the staff member to sign in. They should land on their first allowed module, not the
          dashboard. Verify create buttons appear only where granted.
        </DocStep>
        <DocStep title="Send credentials via WhatsApp">
          From the staff profile, generate a password and tap <strong>Send via WhatsApp</strong>. The
          phone number on the profile is required. See the credentials section below.
        </DocStep>
      </DocSteps>

      <h2>Module permission reference — restricted staff</h2>
      <p>
        The matrix uses ten module keys. Below is what each CRUD flag controls in the live admin UI.
        Full admins bypass all of these checks.
      </p>

      <h3>Students (STUDENTS)</h3>
      <table>
        <thead>
          <tr><th>Action</th><th>Allows</th><th>Blocked without it</th></tr>
        </thead>
        <tbody>
          <tr><td>Read</td><td>Student list, profile view, search and filters</td><td>Entire Students module hidden</td></tr>
          <tr><td>Create</td><td><strong>Add Student</strong>, new enrollment form</td><td>Add button hidden</td></tr>
          <tr><td>Update</td><td>Edit profile sections, status, class assignment, photo, set password</td><td>Edit buttons read-only</td></tr>
          <tr><td>Delete</td><td>Delete student with confirmation</td><td>Delete action hidden</td></tr>
        </tbody>
      </table>
      <p>
        <strong>Archived year:</strong> without archived read, staff cannot select an archived year
        for student data. Archived create/update/delete gates edits to historical enrollments.
      </p>

      <h3>Operations (OPERATIONS)</h3>
      <p>
        Separate from Students — controls bulk credential workflow at{' '}
        <code>/admin/students/operations</code>.
      </p>
      <table>
        <thead>
          <tr><th>Action</th><th>Allows</th></tr>
        </thead>
        <tbody>
          <tr><td>Read</td><td>View operations table, credential tags, delivery status</td></tr>
          <tr><td>Create</td><td>Generate credentials, Save All, Send Selected, Send to New</td></tr>
          <tr><td>Update</td><td>Set individual passwords, bulk save</td></tr>
          <tr><td>Delete</td><td>Not used on operations screen</td></tr>
        </tbody>
      </table>

      <h3>Timetable (TIMETABLE)</h3>
      <table>
        <thead>
          <tr><th>Action</th><th>Allows</th></tr>
        </thead>
        <tbody>
          <tr><td>Read</td><td>View timetable list, grid, datesheet, full view</td></tr>
          <tr><td>Create</td><td>New timetable/datesheet, add slots</td></tr>
          <tr><td>Update</td><td>Rename, activate/deactivate days, edit slot assignments</td></tr>
          <tr><td>Delete</td><td>Delete empty or unused timetable documents</td></tr>
        </tbody>
      </table>

      <h3>Attendance (ATTENDANCE)</h3>
      <table>
        <thead>
          <tr><th>Action</th><th>Allows</th></tr>
        </thead>
        <tbody>
          <tr><td>Read</td><td>Hub dashboard, student/teacher/staff lists, reports, histories</td></tr>
          <tr><td>Create</td><td>Mark new attendance for students, teachers, staff</td></tr>
          <tr><td>Update</td><td>Change recent marks within the edit window</td></tr>
          <tr><td>Delete</td><td>Remove erroneous attendance rows where allowed</td></tr>
        </tbody>
      </table>

      <h3>Fees (FEES)</h3>
      <table>
        <thead>
          <tr><th>Action</th><th>Allows</th></tr>
        </thead>
        <tbody>
          <tr><td>Read</td><td>Fee heads, structures, collections, families, analytics, reports</td></tr>
          <tr><td>Create</td><td>Generate monthly fees, record payments, create families</td></tr>
          <tr><td>Update</td><td>Adjust structures, allocations, payment records</td></tr>
          <tr><td>Delete</td><td>Remove fee records where the system permits</td></tr>
        </tbody>
      </table>

      <h3>Result &amp; Grade (RESULT)</h3>
      <table>
        <thead>
          <tr><th>Action</th><th>Allows</th></tr>
        </thead>
        <tbody>
          <tr><td>Read</td><td>Sessions, marks entry, report cards, analytics, compute status</td></tr>
          <tr><td>Create</td><td>New exam sessions, enter marks, generate report cards</td></tr>
          <tr><td>Update</td><td>Edit marks, session settings, recompute</td></tr>
          <tr><td>Delete</td><td>Remove sessions or marks where allowed</td></tr>
        </tbody>
      </table>

      <h3>Canteen (CANTEEN)</h3>
      <table>
        <thead>
          <tr><th>Action</th><th>Allows</th></tr>
        </thead>
        <tbody>
          <tr><td>Read</td><td>Hub summary, sales, credit accounts, products (if update/delete granted)</td></tr>
          <tr><td>Create</td><td>Record sales, new products, inventory receipts</td></tr>
          <tr><td>Update</td><td>Edit products, stock, credit settlements, suppliers</td></tr>
          <tr><td>Delete</td><td>Remove products or sales where permitted</td></tr>
        </tbody>
      </table>
      <p>
        <strong>Sales-only shortcut:</strong> if a user has Read + Create but no Update and no Delete
        on Canteen, they are redirected to <code>/admin/canteen/sales</code> and see only the POS
        screen — not catalog or inventory management.
      </p>

      <h3>Stationary (STATIONARY)</h3>
      <table>
        <thead>
          <tr><th>Action</th><th>Allows</th></tr>
        </thead>
        <tbody>
          <tr><td>Read</td><td>Products, inventory levels, suppliers, sales records</td></tr>
          <tr><td>Create</td><td>Add products, stock adjustments, student sales assignments</td></tr>
          <tr><td>Update</td><td>Edit prices, stock, supplier details</td></tr>
          <tr><td>Delete</td><td>Remove products or sales where allowed</td></tr>
        </tbody>
      </table>

      <h3>Payments / Expenses (EXPENSES)</h3>
      <table>
        <thead>
          <tr><th>Action</th><th>Allows</th></tr>
        </thead>
        <tbody>
          <tr><td>Read</td><td>Payroll list, utility bills, other payments, vouchers, CSV exports</td></tr>
          <tr><td>Create</td><td>Record payroll, utility bills, other expenses</td></tr>
          <tr><td>Update</td><td>Edit recent entries where the UI allows</td></tr>
          <tr><td>Delete</td><td>Void paid vouchers (requires reason on voucher screen)</td></tr>
        </tbody>
      </table>

      <h3>Documents (DOCUMENTS)</h3>
      <p>
        Reserved module key — not shown as a separate sidebar item for restricted users. Used for
        future document workflows. Defaults to no access unless explicitly granted.
      </p>

      <h2>Pages outside the staff module matrix</h2>
      <p>These screens are <strong>branch admin only</strong>. Restricted staff cannot open them even
      if they guess the URL:</p>
      <ul>
        <li><strong>Dashboard</strong> (<code>/admin</code>) — redirected to first allowed module</li>
        <li><strong>Teachers</strong> — hire, deactivate, assignments, WhatsApp credentials</li>
        <li><strong>Classes / Sections</strong> — create groups, link subjects, chat roles</li>
        <li><strong>Staff</strong> — permission matrix for other users</li>
        <li><strong>Settings</strong> — academic years, subjects, archives</li>
        <li><strong>Branches</strong> — campus list and details</li>
        <li><strong>Profile</strong> — own account settings</li>
      </ul>

      <h2>Archived academic years</h2>
      <p>
        When the active year status is <code>ARCHIVED</code>, the sidebar shows{' '}
        <em>(Archived)</em> or <em>(Read only)</em>. For restricted staff:
      </p>
      <ul>
        <li>Without <strong>archived read</strong> on any module, archived years are filtered out of
        the academic year dropdown.</li>
        <li>With archived read only, pages load in read-only mode — create/update/delete buttons
        hidden unless archived create/update/delete are also granted.</li>
        <li>Full branch admins can still write in archived years from Settings flows; restricted
        staff need explicit archived CRUD flags.</li>
      </ul>

      <DocCallout variant="warn" title="Principle of least privilege">
        A fee cashier needs Fees read + create, not Result delete. An exam cell officer needs Result
        full access but not Payments. Review the matrix when staff change roles or at year-end.
      </DocCallout>

      <h2>WhatsApp credential delivery</h2>
      <p>
        Login credentials are sent via the <strong>Meta WhatsApp Cloud API</strong>, not email. Admin
        actions queue a template message with a fresh temporary password.
      </p>
      <table>
        <thead>
          <tr><th>Entity</th><th>Where to send</th><th>Phone field used</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Students (bulk)</td>
            <td><Link href="/docs/intro/admin/students">Students → Operations</Link></td>
            <td>Student WhatsApp or phone on profile</td>
          </tr>
          <tr>
            <td>Teachers</td>
            <td><Link href="/docs/intro/admin/teachers">Teacher profile</Link> → Send</td>
            <td>Phone on teacher profile</td>
          </tr>
          <tr>
            <td>Staff</td>
            <td><Link href="/docs/intro/admin/staff">Staff profile</Link> → Send via WhatsApp</td>
            <td>Phone required — button disabled without it</td>
          </tr>
        </tbody>
      </table>
      <p>
        Student individual profiles support generate/save password locally but bulk WhatsApp send
        lives on the Operations page. Credential tags (<code>CRED_NEW</code>, <code>CRED_RESEND</code>,{' '}
        <code>CRED_CARRIED</code>, <code>NO_LOGIN</code>) help filter who still needs delivery.
      </p>

      <h2>Chat permissions (mobile) — separate from ERP</h2>
      <p>
        Class <strong>Chat roles</strong> (who can direct-message whom in the mobile app) are
        configured per class under Classes → Chat roles. This is independent of the ERP module
        matrix above.
      </p>

      <h2>What happens when</h2>
      <table>
        <thead>
          <tr><th>Event</th><th>Behavior</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Restricted staff signs in</td>
            <td>Layout loads <code>mePermissions</code>, shows slim shell, redirects dashboard to
            first allowed path</td>
          </tr>
          <tr>
            <td>Staff visits disallowed URL</td>
            <td>Redirected to first allowed module or login</td>
          </tr>
          <tr>
            <td>Admin toggles a permission</td>
            <td>Staff must refresh or re-login for sidebar to update</td>
          </tr>
          <tr>
            <td>Year archived mid-session</td>
            <td>Write buttons disappear on next page load if archived CRUD not granted</td>
          </tr>
          <tr>
            <td>API call without permission</td>
            <td>Backend returns 403 — UI should not show the action if configured correctly</td>
          </tr>
        </tbody>
      </table>

      <h2>FAQ</h2>
      <DocFaq
        items={[
          {
            q: 'Why can my colleague not see the Dashboard?',
            a: 'Restricted staff are redirected to their first permitted module. Only full branch admins see the dashboard at /admin.',
          },
          {
            q: 'Can I give someone Students but not Operations?',
            a: 'Yes. Operations is a separate module for bulk credential workflows. Registrars may need Students full access but Operations only for send-credentials.',
          },
          {
            q: 'What is the difference between worker and restricted staff?',
            a: 'Workers have no login — they appear in payroll and attendance only. Restricted staff have usernames and module permissions for partial ERP access.',
          },
          {
            q: 'Why does canteen staff only see Sales?',
            a: 'Users with Canteen read+create but no update/delete are auto-redirected to Daily Sales — a deliberate sales-only mode.',
          },
          {
            q: 'Can restricted staff void vouchers?',
            a: 'Only if they have Delete on the Payments (EXPENSES) module. Void requires a mandatory reason and is audited.',
          },
          {
            q: 'Are credentials sent by email?',
            a: 'No. Production delivery uses WhatsApp via Meta Cloud API. Ensure META_WHATSAPP_* env vars are configured on the backend.',
          },
          {
            q: 'How do archived-year permissions work?',
            a: 'Four extra toggles per module: archived read/create/update/delete. Without archived read, archived years are hidden from the year selector.',
          },
        ]}
      />

      <h2>Related guides</h2>
      <ul>
        <li><Link href="/docs/intro/admin/staff">Staff</Link> — create users and edit the matrix</li>
        <li><Link href="/docs/intro/admin/students">Students</Link> — roster and Operations credentials</li>
        <li><Link href="/docs/intro/admin/teachers">Teachers</Link> — teacher profiles and WhatsApp send</li>
        <li><Link href="/docs/intro/admin/settings">Settings</Link> — academic year lifecycle</li>
        <li><Link href="/docs/api/email">API: Email &amp; credentials</Link> — WhatsApp pipeline technical detail</li>
        <li><Link href="/docs/intro/ceo/permissions">CEO Permissions</Link> — organization-level roles</li>
      </ul>
    </DocsShell>
  );
}
