import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep, DocFaq } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function AdminClassesPage() {
  return (
    <DocsShell
      title="Classes / Sections"
      subtitle="Create class groups, sections, link subjects, and configure chat roles for the active year."
      nav={introNav}
      variant="intro"
    >
      <h2>Overview</h2>
      <p>
        The <strong>Classes</strong> module at <code>/admin/classes</code> defines how students are
        organized — for example &quot;Class 5 — A&quot;. Each group (section) can have linked subjects,
        teacher assignments, student counts, timetable slots, and mobile chat roles. All data is
        scoped to the <strong>active branch</strong> and <strong>academic year</strong>.
      </p>
      <p>
        <strong>Why it exists:</strong> classes are the structural backbone — enrollment, attendance,
        fees, exams, and timetables all reference section/group IDs. Without classes, students cannot
        be assigned and teachers cannot be linked to subjects.
      </p>
      <p>
        <strong>Who uses it:</strong> <strong>branch admins only</strong>. Restricted management staff
        do not have a separate Classes module; they work with students and attendance within classes
        already created by admins.
      </p>

      <h2>Before you start</h2>
      <ul>
        <li><strong>Academic year:</strong> must be ACTIVE or BUILD_STAGE — archived years are read-only on this page.</li>
        <li><strong>Subjects catalog:</strong> create subjects under <Link href="/docs/intro/admin/settings">Settings → Subjects</Link> before linking to sections.</li>
        <li><strong>Teachers:</strong> hire teachers before assigning them to class-subject pairs (from teacher profile or timetable).</li>
      </ul>

      <h2>Step-by-step: common workflows</h2>
      <DocSteps>
        <DocStep title="Create a class group">
          Click <strong>Add Class</strong> (disabled when year archived). Enter class name (e.g.
          &quot;Class 5&quot;), set <strong>arrangement</strong> (display order), toggle{' '}
          <strong>enable sections</strong> if you need A/B/C splits. Add section tags via comma or
          Enter — each becomes a separate group row. Save.
        </DocStep>
        <DocStep title="Expand and review sections">
          Click a class row to expand. Each section shows student count, subject link icon, chat
          roles link, and edit/delete actions.
        </DocStep>
        <DocStep title="Link subjects to a section">
          Click the subject link icon. A modal lists branch subjects with checkboxes per section.
          Select subjects, save — only checked subjects appear for that section in exams and
          timetables.
        </DocStep>
        <DocStep title="Edit class or section">
          Use edit to rename, add new section tags, or change display order. Arrangement controls
          sort order in dropdowns across the ERP.
        </DocStep>
        <DocStep title="Configure chat roles">
          Open <strong>Chat roles</strong> for a class → controls who can direct-message whom in the
          mobile app. Separate from ERP module permissions — see{' '}
          <Link href="/docs/intro/admin/permissions">Permissions</Link>.
        </DocStep>
        <DocStep title="Delete a section">
          Delete is blocked if students, linked subjects, or teacher assignments exist. Remove
          dependencies first, then delete.
        </DocStep>
      </DocSteps>

      <h2>Field reference — create/edit class</h2>
      <table>
        <thead>
          <tr><th>Field</th><th>Required</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>Class name</td><td>Yes</td><td>Display label e.g. &quot;Class 5&quot;, &quot;O-Level Year 1&quot;</td></tr>
          <tr><td>Arrangement</td><td>No</td><td>Numeric sort order in lists (lower = first)</td></tr>
          <tr><td>Enable sections</td><td>No</td><td>When on, section tags create A/B/C groups under same class name</td></tr>
          <tr><td>Section tags</td><td>If sections enabled</td><td>Comma-separated or Enter — e.g. A, B, C</td></tr>
        </tbody>
      </table>

      <h2>Field reference — list row actions</h2>
      <table>
        <thead>
          <tr><th>Action</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>Expand/collapse</td><td>Show section rows under a class name</td></tr>
          <tr><td>Student count</td><td>Enrolled students in that section for active year</td></tr>
          <tr><td>Link subjects</td><td>Modal — attach catalog subjects to this section</td></tr>
          <tr><td>Chat roles</td><td>Navigate to <code>/admin/classes/[groupId]/chat-roles</code></td></tr>
          <tr><td>Edit</td><td>Rename, sections, arrangement</td></tr>
          <tr><td>Delete</td><td>Remove section if no dependencies</td></tr>
        </tbody>
      </table>

      <h2>What happens when</h2>
      <table>
        <thead>
          <tr><th>Event</th><th>Behavior</th></tr>
        </thead>
        <tbody>
          <tr><td>Class created</td><td>One or more section groups created under branch + year</td></tr>
          <tr><td>Subjects linked</td><td>Section appears in exam marks, timetable slot pickers</td></tr>
          <tr><td>Students enrolled</td><td>Student count on row increments</td></tr>
          <tr><td>Delete blocked</td><td>Toast explains students/subjects/teachers still linked</td></tr>
          <tr><td>Year archived</td><td>Add Class disabled; existing structure read-only</td></tr>
          <tr><td>Subject unlinked</td><td>Removed from that section only — other sections unaffected</td></tr>
        </tbody>
      </table>

      <h2>Permissions</h2>
      <p>
        Class management is a <strong>branch admin</strong> responsibility — not in the restricted
        staff module matrix. Only <code>branch_admin</code> and <code>sub_admin</code> can create,
        edit, or delete classes.
      </p>
      <p>
        When the active academic year is <code>ARCHIVED</code>, the page is read-only for everyone.
      </p>
      <p>
        For staff module access in general, see{' '}
        <Link href="/docs/intro/admin/permissions">Permissions &amp; Staff Roles</Link>.
      </p>

      <DocCallout variant="warn" title="Archived years">
        When the active academic year is archived, class structure is read-only on this page. Switch
        to an ACTIVE year to make structural changes.
      </DocCallout>

      <DocCallout variant="tip" title="Setup order">
        Create academic year → subjects → classes → enroll students. Skipping subjects means empty
        link-subjects modals.
      </DocCallout>

      <h2>Common issues &amp; fixes</h2>
      <table>
        <thead>
          <tr><th>Symptom</th><th>Cause</th><th>Fix</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Add Class disabled</td>
            <td>Archived academic year</td>
            <td>Switch to ACTIVE or BUILD_STAGE year in sidebar</td>
          </tr>
          <tr>
            <td>Delete fails</td>
            <td>Students or subjects linked</td>
            <td>Transfer students, unlink subjects, remove teacher assignments first</td>
          </tr>
          <tr>
            <td>Empty subject link modal</td>
            <td>No subjects in catalog</td>
            <td>Create subjects in <Link href="/docs/intro/admin/settings">Settings</Link></td>
          </tr>
          <tr>
            <td>Wrong sort order in dropdowns</td>
            <td>Arrangement not set</td>
            <td>Edit class and set lower arrangement numbers for earlier grades</td>
          </tr>
          <tr>
            <td>Section not created</td>
            <td>Sections toggle off</td>
            <td>Edit class, enable sections, add tags A/B/C</td>
          </tr>
        </tbody>
      </table>

      <h2>Class setup checklist (new year)</h2>
      <DocSteps>
        <DocStep title="Create grade rows">
          Add each grade (Playgroup through Matric/O-Level) with arrangement order.
        </DocStep>
        <DocStep title="Add sections">
          Enable sections for grades with multiple streams — A, B, Science, Arts, etc.
        </DocStep>
        <DocStep title="Link subjects per section">
          Each section may differ — Science section gets Physics; Arts section may not.
        </DocStep>
        <DocStep title="Configure chat roles">
          Set mobile DM rules before students receive app access.
        </DocStep>
        <DocStep title="Verify in Students module">
          Class dropdown on Add Student should list all new sections.
        </DocStep>
      </DocSteps>

      <h2>FAQ</h2>
      <DocFaq
        items={[
          {
            q: 'What is the difference between class name and section?',
            a: 'Class name is the grade label (Class 5). Sections are A, B, C splits — each is a separate group with its own students and subject links.',
          },
          {
            q: 'Can restricted staff create classes?',
            a: 'No. Only branch admins. Registrars with Students permission enroll into existing classes.',
          },
          {
            q: 'Why cannot I delete a section?',
            a: 'Students enrolled, subjects linked, or teachers assigned block deletion. Clear those first.',
          },
          {
            q: 'Do chat roles affect ERP permissions?',
            a: 'No. Chat roles only control mobile direct messaging between students, parents, and teachers.',
          },
          {
            q: 'How does arrangement affect the UI?',
            a: 'Lower arrangement numbers appear first in class dropdowns on Students, Attendance, and Fees screens.',
          },
          {
            q: 'Can one subject link to multiple sections?',
            a: 'Yes. Link subjects independently per section — Class 5-A and 5-B may have different subject sets.',
          },
        ]}
      />

      <h2>API endpoints (reference)</h2>
      <table>
        <thead>
          <tr><th>Method</th><th>Endpoint</th><th>Purpose</th></tr>
        </thead>
        <tbody>
          <tr><td>GET</td><td><code>/admin/sections?branchId=&amp;academicYearId=</code></td><td>List class groups</td></tr>
          <tr><td>POST</td><td><code>/admin/sections</code></td><td>Create class/sections</td></tr>
          <tr><td>PUT</td><td><code>/admin/sections/:id</code></td><td>Update name, arrangement</td></tr>
          <tr><td>DELETE</td><td><code>/admin/sections/:id</code></td><td>Delete if no dependencies</td></tr>
          <tr><td>POST</td><td><code>/admin/sections/:id/subjects</code></td><td>Link subjects to section</td></tr>
        </tbody>
      </table>

      <h2>Navigation paths</h2>
      <table>
        <thead>
          <tr><th>Screen</th><th>URL</th></tr>
        </thead>
        <tbody>
          <tr><td>Classes list</td><td><code>/admin/classes</code></td></tr>
          <tr><td>Chat roles</td><td><code>/admin/classes/[groupId]/chat-roles</code></td></tr>
          <tr><td>Subjects catalog</td><td><code>/admin/settings/subjects</code></td></tr>
          <tr><td>Enroll students</td><td><code>/admin/students/new</code></td></tr>
        </tbody>
      </table>

      <h2>Related guides</h2>
      <ul>
        <li><Link href="/docs/intro/admin/settings">Settings → Subjects</Link> — subject catalog</li>
        <li><Link href="/docs/intro/admin/students">Students</Link> — enroll into sections</li>
        <li><Link href="/docs/intro/admin/teachers">Teachers</Link> — class-subject assignments</li>
        <li><Link href="/docs/intro/admin/timetable">Timetable</Link> — schedule per section</li>
        <li><Link href="/docs/intro/admin/permissions">Permissions</Link> — ERP vs chat roles</li>
      </ul>
    </DocsShell>
  );
}
