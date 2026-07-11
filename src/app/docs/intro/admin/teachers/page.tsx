import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep, DocFaq } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function AdminTeachersPage() {
  return (
    <DocsShell
      title="Teachers"
      subtitle="Hire teachers, manage profiles, class assignments, and WhatsApp login credentials."
      nav={introNav}
      variant="intro"
    >
      <h2>Overview</h2>
      <p>
        The <strong>Teachers</strong> module at <code>/admin/teachers</code> lists every teaching
        staff member in the branch — qualification, employment details, class-subject assignments,
        payroll history, tenure, and portal login credentials. Teachers use the separate{' '}
        <strong>teacher portal</strong> (<code>/teacher</code>) and mobile app for daily classroom
        work; this admin screen is for HR and academic management.
      </p>
      <p>
        <strong>Why it exists:</strong> teachers must exist as user accounts before timetable slots,
        attendance marking, result entry, and parent contact permissions can be assigned.
      </p>
      <p>
        <strong>Who uses it:</strong> <strong>branch admins only</strong>. Restricted management
        staff typically cannot access this module.
      </p>

      <h2>Before you start</h2>
      <ul>
        <li><strong>Branch selected</strong> in sidebar — teacher list is branch-scoped.</li>
        <li><strong>Classes and subjects</strong> configured before adding assignments.</li>
        <li><strong>Phone number</strong> on profile required for WhatsApp credential delivery.</li>
        <li><strong>WhatsApp API</strong> configured on backend (<code>META_WHATSAPP_*</code> env vars).</li>
      </ul>

      <h2>Step-by-step: common workflows</h2>
      <DocSteps>
        <DocStep title="Add a teacher">
          Click <strong>Add Teacher</strong> → fill required name and username → employment fields
          (employee ID, qualification, specialization, joining date, salary, phone, etc.) → save.
          A user account is created with an auto-generated temporary password.
        </DocStep>
        <DocStep title="Search and filter">
          Enter name in search box, optionally filter by qualification (M.Sc, B.Ed, M.Ed, B.Sc,
          PhD), click <strong>Search</strong>. Results paginate 20 per page.
        </DocStep>
        <DocStep title="Open teacher profile">
          Click a card or <strong>View detail</strong> → full profile with assignments, timetable,
          payments, tenure, credentials, and teacher portal permissions.
        </DocStep>
        <DocStep title="Assign class and subject">
          On profile → <strong>Assignments</strong> → add class-subject pair. Teacher appears in
          timetable pickers and teacher attendance for that assignment.
        </DocStep>
        <DocStep title="Set login credentials">
          <strong>Login Credentials</strong> section: generate password, copy, save with admin
          password confirmation.
        </DocStep>
        <DocStep title="Send credentials via WhatsApp">
          After password is generated, click <strong>Send</strong>. Backend queues Meta WhatsApp
          template with fresh temporary password to teacher&apos;s <strong>phone</strong> field.
          Success toast: &quot;Credentials sent via WhatsApp&quot;.
        </DocStep>
        <DocStep title="Deactivate or reactivate">
          From list or profile — deactivated teachers cannot sign in but records are retained.
          Delete only allowed when no class assignments exist.
        </DocStep>
      </DocSteps>

      <h2>Field reference — create/edit teacher</h2>
      <table>
        <thead>
          <tr><th>Field</th><th>Required</th><th>Notes</th></tr>
        </thead>
        <tbody>
          <tr><td>Name</td><td>Yes</td><td>Display name</td></tr>
          <tr><td>Username</td><td>Yes</td><td>Portal login — unique</td></tr>
          <tr><td>Email</td><td>No</td><td>Contact email</td></tr>
          <tr><td>Employee ID</td><td>No</td><td>Internal HR reference</td></tr>
          <tr><td>Qualification</td><td>No</td><td>Filterable — M.Sc, B.Ed, etc.</td></tr>
          <tr><td>Specialization</td><td>No</td><td>Subject area</td></tr>
          <tr><td>Joining date / DOB</td><td>No</td><td>Employment dates</td></tr>
          <tr><td>Phone</td><td>For WhatsApp</td><td>Credential delivery target</td></tr>
          <tr><td>Emergency contact</td><td>No</td><td>HR record</td></tr>
          <tr><td>Address</td><td>No</td><td>Residential</td></tr>
          <tr><td>Salary</td><td>No</td><td>Feeds payroll module</td></tr>
          <tr><td>Blood group, card ID, gender, experience, bio</td><td>No</td><td>Profile enrichment</td></tr>
        </tbody>
      </table>

      <h2>Field reference — profile sections</h2>
      <table>
        <thead>
          <tr><th>Section</th><th>Contents</th></tr>
        </thead>
        <tbody>
          <tr><td>Profile</td><td>Photo upload, all personal/professional fields, inline edit</td></tr>
          <tr><td>Payments</td><td>Payroll history panel — links to <Link href="/docs/intro/admin/expenses/payroll">Payroll</Link></td></tr>
          <tr><td>Join/Leave History</td><td>Tenure events with reasons</td></tr>
          <tr><td>Login Credentials</td><td>Username, password, Save, <strong>Send</strong> (WhatsApp)</td></tr>
          <tr><td>Teacher Permissions</td><td>Portal access flags, parent contact visibility</td></tr>
          <tr><td>Assignments</td><td>Class + subject pairs — add/edit/delete</td></tr>
          <tr><td>Timetable</td><td>Read-only schedule entries for this teacher</td></tr>
        </tbody>
      </table>

      <h2>What happens when</h2>
      <table>
        <thead>
          <tr><th>Event</th><th>Behavior</th></tr>
        </thead>
        <tbody>
          <tr><td>Teacher created</td><td>User account + teacher profile; temp password generated</td></tr>
          <tr><td>Assignment added</td><td>Teacher available in timetable and attendance for that class-subject</td></tr>
          <tr><td>Send credentials</td><td><code>POST /admin/teachers/:id/send-credentials</code> — new temp password hashed, WhatsApp queued</td></tr>
          <tr><td>Deactivate</td><td>Login blocked; assignments may remain until removed</td></tr>
          <tr><td>Delete attempted with assignments</td><td>Blocked — remove assignments first</td></tr>
          <tr><td>Photo uploaded</td><td>Stored via upload API, URL saved on profile</td></tr>
        </tbody>
      </table>

      <h2>Permissions</h2>
      <p>
        Teacher management is a <strong>branch admin</strong> function. Not in the restricted staff
        module matrix. Restricted staff interact with teachers only through attendance or result
        workflows if those modules are granted.
      </p>
      <p>
        Teacher portal permissions (on profile) are separate — control what the teacher sees in{' '}
        <code>/teacher</code>, not ERP access.
      </p>

      <DocCallout variant="info" title="WhatsApp credentials">
        Credentials are sent via <strong>Meta WhatsApp Cloud API</strong>, not email. Ensure phone is
        valid and WhatsApp env vars are configured. See{' '}
        <Link href="/docs/api/email">API: Email &amp; credentials</Link>.
      </DocCallout>

      <DocCallout variant="tip" title="Class assignments">
        Link teachers to subjects per section from the profile Assignments section or when building
        the <Link href="/docs/intro/admin/timetable">Timetable</Link>.
      </DocCallout>

      <h2>Common issues &amp; fixes</h2>
      <table>
        <thead>
          <tr><th>Symptom</th><th>Cause</th><th>Fix</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Send credentials fails</td>
            <td>Missing phone or WhatsApp API</td>
            <td>Add phone on profile; verify META_WHATSAPP_* backend config</td>
          </tr>
          <tr>
            <td>Delete disabled</td>
            <td>Active class assignments</td>
            <td>Remove assignments from profile or deactivate teacher</td>
          </tr>
          <tr>
            <td>Teacher not in timetable picker</td>
            <td>No assignment for class-subject</td>
            <td>Add assignment on teacher profile</td>
          </tr>
          <tr>
            <td>Cannot sign in after create</td>
            <td>Password not saved/sent</td>
            <td>Generate password, save, then Send via WhatsApp</td>
          </tr>
          <tr>
            <td>Zero search results</td>
            <td>Qualification filter too narrow</td>
            <td>Clear qualification filter and search again</td>
          </tr>
        </tbody>
      </table>

      <h2>Teacher onboarding checklist</h2>
      <DocSteps>
        <DocStep title="Create profile">
          Name, username, phone, qualification, salary, joining date.
        </DocStep>
        <DocStep title="Upload photo">
          Optional but recommended for staff directory and mobile app.
        </DocStep>
        <DocStep title="Add assignments">
          Link to every class-subject they teach this year.
        </DocStep>
        <DocStep title="Set portal permissions">
          Teacher Permissions panel — parent contact visibility, portal features.
        </DocStep>
        <DocStep title="Deliver credentials">
          Generate password → Save → Send via WhatsApp to phone.
        </DocStep>
        <DocStep title="Verify teacher portal">
          Teacher signs in at <code>/teacher</code> or mobile app.
        </DocStep>
      </DocSteps>

      <h2>FAQ</h2>
      <DocFaq
        items={[
          {
            q: 'Are teacher credentials sent by email?',
            a: 'No. Use the Send button on the profile — delivery is via WhatsApp to the phone field.',
          },
          {
            q: 'Can a teacher access the admin ERP?',
            a: 'Teachers use /teacher portal unless they also have a separate staff account with module permissions.',
          },
          {
            q: 'Why is Delete disabled?',
            a: 'Teachers with active class-subject assignments cannot be deleted. Remove assignments or deactivate instead.',
          },
          {
            q: 'Where does salary data go?',
            a: 'Profile salary feeds the Payroll module under Payments when processing monthly pay.',
          },
          {
            q: 'What are Teacher Permissions on the profile?',
            a: 'Controls teacher portal features — parent phone visibility, etc. Not the same as ERP staff module matrix.',
          },
        ]}
      />

      <h2>API endpoints (reference)</h2>
      <table>
        <thead>
          <tr><th>Method</th><th>Endpoint</th><th>Purpose</th></tr>
        </thead>
        <tbody>
          <tr><td>GET</td><td><code>/admin/teachers</code></td><td>List with search/qualification</td></tr>
          <tr><td>POST</td><td><code>/admin/teachers</code></td><td>Create teacher account</td></tr>
          <tr><td>PUT</td><td><code>/admin/teachers/:id</code></td><td>Update profile</td></tr>
          <tr><td>POST</td><td><code>/admin/teachers/:id/send-credentials</code></td><td>WhatsApp credentials</td></tr>
          <tr><td>POST</td><td><code>/admin/teachers/:id/deactivate</code></td><td>Deactivate teacher</td></tr>
        </tbody>
      </table>

      <h2>Related guides</h2>
      <ul>
        <li><Link href="/docs/intro/admin/classes">Classes</Link> — sections for assignments</li>
        <li><Link href="/docs/intro/admin/timetable">Timetable</Link> — schedule slots</li>
        <li><Link href="/docs/intro/admin/attendance/teachers">Teacher Attendance</Link></li>
        <li><Link href="/docs/intro/admin/expenses/payroll">Payroll</Link></li>
        <li><Link href="/docs/intro/teacher">Teacher Portal</Link> — daily teacher workflow</li>
        <li><Link href="/docs/intro/admin/permissions">Permissions</Link></li>
      </ul>
    </DocsShell>
  );
}
