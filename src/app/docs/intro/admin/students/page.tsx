import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep, DocFaq } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function AdminStudentsPage() {
  return (
    <DocsShell
      title="Students"
      subtitle="Enroll students, search the roster, manage profiles, and send login credentials."
      nav={introNav}
      variant="intro"
    >
      <h2>Overview</h2>
      <p>
        The <strong>Students</strong> module at <code>/admin/students</code> is your branch roster for
        the selected academic year. Register new admissions, filter by class or roll number, open
        rich student profiles, and manage class assignments, status history, and login credentials.
        Bulk credential delivery lives on the separate <strong>Operations</strong> screen.
      </p>
      <p>
        <strong>Why it exists:</strong> every downstream module — fees, attendance, results,
        stationary — depends on accurate student records tied to the active branch and year.
      </p>
      <p>
        <strong>Who uses it:</strong> branch admins and restricted staff with the{' '}
        <strong>Students</strong> module permission. Operations (bulk WhatsApp credentials) requires
        the separate <strong>Operations</strong> module.
      </p>

      <h2>Before you start</h2>
      <ul>
        <li><strong>Branch &amp; year:</strong> select both in the sidebar and press <strong>Go</strong>.</li>
        <li><strong>Classes exist:</strong> create class groups under <Link href="/docs/intro/admin/classes">Classes</Link> before assigning students.</li>
        <li><strong>Subjects linked:</strong> optional elective subjects require class subject links from Classes.</li>
        <li><strong>Permissions:</strong> verify Students read/create/update/delete for your role.</li>
      </ul>

      <h2>Step-by-step: common workflows</h2>
      <DocSteps>
        <DocStep title="Add a new student">
          Click <strong>Add Student</strong> → fill admission details, parent/guardian info, contact
          numbers (include WhatsApp for credential delivery), class assignment → save. Student
          appears in the roster for the active year.
        </DocStep>
        <DocStep title="Find a student">
          Enter name or admission number in search, pick a class from the dropdown, optionally
          filter by roll number, click <strong>Filter</strong>. Class and roll filters auto-reload;
          search requires the Filter button. Click a card to open the profile.
        </DocStep>
        <DocStep title="Edit profile sections">
          On the profile page, each section (Student Information, Contact, Parent, Address,
          Emergency Contact, Health, Previous Education) has <strong>Edit</strong> or{' '}
          <strong>Add</strong>. Changes save immediately per section.
        </DocStep>
        <DocStep title="Change student status">
          Use <strong>Student Status</strong> to set ACTIVE, SUSPENDED, WITHDRAWN, TRANSFERRED,
          EXPELED, or DECEASED with a reason. History is logged and visible on the profile.
        </DocStep>
        <DocStep title="Manage login credentials (single)">
          In <strong>Login Credentials</strong>: click generate, copy or set password, confirm with
          your admin password. This page does <em>not</em> send WhatsApp — use Operations for bulk
          send.
        </DocStep>
        <DocStep title="Send credentials via WhatsApp (bulk)">
          Open sidebar <strong>Operations</strong> under Students. Filter by credential status,
          select rows, use <strong>Send Selected</strong> or <strong>Send to New</strong>. Requires
          Operations module create permission and WhatsApp configured on backend.
        </DocStep>
        <DocStep title="Delete a student">
          From profile → Student Status section → <strong>Delete Student</strong> with confirmation.
          Requires delete permission; may be blocked if linked records exist.
        </DocStep>
      </DocSteps>

      <h2>Field reference — list page</h2>
      <table>
        <thead>
          <tr><th>Field / Element</th><th>Type</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>Search</td><td>Text</td><td>Name or admission number — requires Filter click</td></tr>
          <tr><td>Class dropdown</td><td>Select</td><td>Filter by section/group — auto-reloads</td></tr>
          <tr><td>Roll number</td><td>Text</td><td>Exact roll filter — auto-reloads</td></tr>
          <tr><td>Filter button</td><td>Action</td><td>Applies search text to query</td></tr>
          <tr><td>Student card</td><td>Link</td><td>Shows name, admission #, class/section, roll</td></tr>
          <tr><td>Add Student</td><td>Button</td><td>Opens <code>/admin/students/new</code></td></tr>
        </tbody>
      </table>

      <h2>Field reference — profile sections</h2>
      <table>
        <thead>
          <tr><th>Section</th><th>Key fields</th></tr>
        </thead>
        <tbody>
          <tr><td>Student Information</td><td>Name, DOB, roll, religion, nationality, gender, B-Form, admission #, class, subjects</td></tr>
          <tr><td>Student Contact</td><td>Phone, email, <strong>WhatsApp</strong> (used for credential delivery)</td></tr>
          <tr><td>Parent/Guardian</td><td>Name, relation, CNIC, occupation, employer, income, phone, WhatsApp, email, marital status</td></tr>
          <tr><td>Address</td><td>Address, city, country, postal code</td></tr>
          <tr><td>Emergency Contact</td><td>Name, relationship, phone, WhatsApp</td></tr>
          <tr><td>Health &amp; Medical</td><td>Blood group, allergies, chronic disease, doctor, disability, notes</td></tr>
          <tr><td>Previous Education</td><td>Previous school/class, TC number, referred by</td></tr>
          <tr><td>School Tenure</td><td>Rejoin/leave events, class movement history</td></tr>
          <tr><td>Login Credentials</td><td>Username, password generate/copy/save (admin password required)</td></tr>
        </tbody>
      </table>

      <h2>Field reference — new student form</h2>
      <table>
        <thead>
          <tr><th>Field</th><th>Required</th><th>Notes</th></tr>
        </thead>
        <tbody>
          <tr><td>Name</td><td>Yes</td><td>Legal student name</td></tr>
          <tr><td>Admission number</td><td>Yes</td><td>Unique per branch/year</td></tr>
          <tr><td>Class / Section</td><td>Yes</td><td>From active year sections</td></tr>
          <tr><td>Guardian WhatsApp</td><td>No</td><td>Primary target for credential WhatsApp messages</td></tr>
          <tr><td>Parent fields</td><td>Varies</td><td>Name, phone, CNIC recommended for records</td></tr>
        </tbody>
      </table>

      <h2>Operations page — credential workflow</h2>
      <p>At <code>/admin/students/operations</code> (module: <strong>Operations</strong>):</p>
      <table>
        <thead>
          <tr><th>Action</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>Gen All / Gen</td><td>Generate usernames and temporary passwords</td></tr>
          <tr><td>Save All / Save</td><td>Persist passwords (admin password confirmation)</td></tr>
          <tr><td>Send Selected</td><td>WhatsApp credentials for checked rows</td></tr>
          <tr><td>Send to New</td><td>Batch send to students tagged CRED_NEW</td></tr>
        </tbody>
      </table>
      <p>Status filters: <code>no_creds</code>, <code>pending</code>, <code>sent</code>,{' '}
      <code>delivered</code>, <code>read</code>, <code>failed</code>, <code>cred_carried</code>,{' '}
      <code>cred_new</code>, <code>no_login</code>.</p>

      <h2>What happens when</h2>
      <table>
        <thead>
          <tr><th>Event</th><th>Behavior</th></tr>
        </thead>
        <tbody>
          <tr><td>Student saved</td><td>Record tied to active branchId + academicYearId</td></tr>
          <tr><td>Class changed</td><td>Class movement logged in tenure history</td></tr>
          <tr><td>Status → WITHDRAWN</td><td>May affect fee dues and attendance expectations</td></tr>
          <tr><td>Generate credentials</td><td>Username created; password shown once until saved</td></tr>
          <tr><td>Send credentials (WhatsApp)</td><td>Backend generates fresh temp password, hashes, queues Meta template</td></tr>
          <tr><td>Archived year active</td><td>Write actions blocked unless archived CRUD granted</td></tr>
          <tr><td>Empty roster</td><td>Often means no year selected — check sidebar Go button</td></tr>
        </tbody>
      </table>

      <h2>Permissions</h2>
      <p>Module key: <strong>Students (STUDENTS)</strong></p>
      <ul>
        <li><strong>Read</strong> — list and profile view</li>
        <li><strong>Create</strong> — Add Student, new enrollment</li>
        <li><strong>Update</strong> — edit sections, status, class, credentials, photo</li>
        <li><strong>Delete</strong> — delete student</li>
      </ul>
      <p>Module key: <strong>Operations (OPERATIONS)</strong> — separate module for bulk credentials.</p>
      <p>
        Branch admins have full access. See{' '}
        <Link href="/docs/intro/admin/permissions">Permissions &amp; Staff Roles</Link> for archived-year
        rules.
      </p>

      <DocCallout variant="tip" title="Academic year required">
        Select a branch and academic year from the sidebar and press <strong>Go</strong> before
        loading students. An empty roster often means no year is selected yet.
      </DocCallout>

      <DocCallout variant="info" title="WhatsApp credentials">
        Delivery uses Meta WhatsApp Cloud API, not email. Ensure student or guardian WhatsApp is
        filled on the profile. Bulk send is on Operations; teachers and staff send from their
        profile pages.
      </DocCallout>

      <h2>Common issues &amp; fixes</h2>
      <table>
        <thead>
          <tr><th>Symptom</th><th>Cause</th><th>Fix</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Empty student list</td>
            <td>No academic year selected</td>
            <td>Sidebar → pick year → press <strong>Go</strong></td>
          </tr>
          <tr>
            <td>Search returns nothing</td>
            <td>Filter not clicked</td>
            <td>Enter text and press <strong>Filter</strong> — class/roll auto-filter only</td>
          </tr>
          <tr>
            <td>WhatsApp send failed</td>
            <td>Missing phone or Meta API error</td>
            <td>Fill student/parent WhatsApp; check backend META_WHATSAPP_* config</td>
          </tr>
          <tr>
            <td>Cannot save password</td>
            <td>Admin password wrong</td>
            <td>Re-enter your admin password in confirmation modal</td>
          </tr>
          <tr>
            <td>Add Student hidden</td>
            <td>No create permission or archived year</td>
            <td>Check Students create flag; switch to ACTIVE year or get archived create</td>
          </tr>
          <tr>
            <td>Class dropdown empty</td>
            <td>No classes for year</td>
            <td>Create sections under <Link href="/docs/intro/admin/classes">Classes</Link></td>
          </tr>
        </tbody>
      </table>

      <h2>Student status reference</h2>
      <table>
        <thead>
          <tr><th>Status</th><th>When to use</th></tr>
        </thead>
        <tbody>
          <tr><td>ACTIVE</td><td>Currently enrolled and attending</td></tr>
          <tr><td>SUSPENDED</td><td>Temporarily barred from attendance — fees may still apply</td></tr>
          <tr><td>WITHDRAWN</td><td>Left mid-year voluntarily</td></tr>
          <tr><td>TRANSFERRED</td><td>Moved to another campus or school</td></tr>
          <tr><td>EXPELED</td><td>Removed for disciplinary reasons</td></tr>
          <tr><td>DECEASED</td><td>Recorded with sensitivity — locks further enrollment actions</td></tr>
        </tbody>
      </table>

      <h2>FAQ</h2>
      <DocFaq
        items={[
          {
            q: 'Why is there no Send button on the student profile?',
            a: 'Individual profiles support generate/save password. Bulk WhatsApp delivery is on the Operations page under Students in the sidebar.',
          },
          {
            q: 'Which phone number receives student credentials?',
            a: 'Student WhatsApp field first, then student phone, then parent WhatsApp as configured by backend send logic.',
          },
          {
            q: 'Can I promote students to the next class?',
            a: 'Use academic year Promote flow in Settings, or class movement on the student profile tenure section.',
          },
          {
            q: 'Why does search not work until I click Filter?',
            a: 'Class and roll filters auto-reload; text search is applied only when you press Filter to avoid excessive API calls.',
          },
          {
            q: 'What are credential tags on Operations?',
            a: 'CRED_NEW means send credentials. CRED_RESEND means password changed — resend. CRED_CARRIED means promoted from prior year. NO_LOGIN means student will not receive portal access.',
          },
          {
            q: 'Can parents log in with student credentials?',
            a: 'Student accounts are for the student portal/mobile app. Parent contact fields are for records and WhatsApp delivery targets.',
          },
        ]}
      />

      <h2>Related guides</h2>
      <ul>
        <li><Link href="/docs/intro/admin/classes">Classes</Link> — assign students to sections</li>
        <li><Link href="/docs/intro/admin/fees">Fees</Link> — billing per student</li>
        <li><Link href="/docs/intro/admin/attendance/students">Student Attendance</Link></li>
        <li><Link href="/docs/intro/admin/permissions">Permissions</Link> — Students vs Operations modules</li>
        <li><Link href="/docs/api/email">API: WhatsApp credentials</Link> — technical pipeline</li>
      </ul>
    </DocsShell>
  );
}
