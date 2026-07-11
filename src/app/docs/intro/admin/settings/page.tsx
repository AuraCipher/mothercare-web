import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep, DocFaq } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function AdminSettingsPage() {
  return (
    <DocsShell
      title="Settings"
      subtitle="Academic years, subjects, and archive management — branch academic foundation."
      nav={introNav}
      variant="intro"
    >
      <h2>Overview</h2>
      <p>
        <strong>Settings</strong> at <code>/admin/settings</code> configures branch-wide academic
        structure. The landing page redirects to <strong>Academic Years</strong>. The settings layout
        sidebar offers Academic Years, Archive bucket, and Subjects. Most ERP modules depend on a
        published <code>ACTIVE</code> year before enrollment, fees, and attendance work correctly.
      </p>
      <p>
        <strong>Why it exists:</strong> academic years bound all operational data; subjects define
        what is taught and examined. Without this foundation, classes, students, and results cannot
        be configured.
      </p>
      <p>
        <strong>Who uses it:</strong> <strong>branch admins only</strong>. Restricted management
        staff cannot change academic years or the subject catalog.
      </p>

      <h2>Before you start</h2>
      <ul>
        <li><strong>Branch selected</strong> in sidebar — settings are branch-scoped.</li>
        <li>For new campuses: create year → subjects → classes → students (in that order).</li>
        <li>Understand year statuses: <code>BUILD_STAGE</code>, <code>ACTIVE</code>, <code>ARCHIVED</code>.</li>
      </ul>

      <h2>Step-by-step: academic years</h2>
      <DocSteps>
        <DocStep title="Open Academic Years">
          Footer <strong>Settings</strong> link or <code>/admin/settings/academic-years</code>.
        </DocStep>
        <DocStep title="Create a year">
          <strong>Create</strong> modal → label (e.g. 2025–26), start/end dates, optional previous
          year link, optional direct-to-archived checkbox for historical import → save. New year
          starts in <code>BUILD_STAGE</code>.
        </DocStep>
        <DocStep title="Configure in BUILD_STAGE">
          Add classes, subjects, structures while year is not yet live. Sidebar shows BUILD_STAGE
          banner when applicable.
        </DocStep>
        <DocStep title="Publish as ACTIVE">
          When ready, <strong>Publish</strong> — year becomes selectable for daily operations.
          Only one ACTIVE year per branch typically.
        </DocStep>
        <DocStep title="Pause or resume">
          <strong>Pause</strong> temporarily blocks new writes; <strong>Resume</strong> restores ACTIVE.
        </DocStep>
        <DocStep title="Archive a year">
          At year end, <strong>Archive</strong> — locks most writes, preserves reports. Staff need
          archived permissions to edit historical data.
        </DocStep>
        <DocStep title="Promote students">
          From year detail → <strong>Promote</strong> flow moves students to next class/year.
        </DocStep>
      </DocSteps>

      <h2>Step-by-step: subjects</h2>
      <DocSteps>
        <DocStep title="Open Subjects">
          Settings sidebar → <code>/admin/settings/subjects</code>. Requires active academic year.
        </DocStep>
        <DocStep title="Create subject">
          Name*, code, description, total marks, passing marks, elective flag, optional HOD (head of
          department teacher).
        </DocStep>
        <DocStep title="Link to classes">
          Use link-to-classes modal — attach subject to sections for exams and timetables.
        </DocStep>
        <DocStep title="Edit or delete">
          Edit updates catalog. Delete blocked if links exist to classes or exam data.
        </DocStep>
      </DocSteps>

      <h2>Field reference — academic year create</h2>
      <table>
        <thead>
          <tr><th>Field</th><th>Required</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>Label</td><td>Yes</td><td>Display name e.g. &quot;2025–26&quot;</td></tr>
          <tr><td>Start / end dates</td><td>Yes</td><td>Calendar boundaries</td></tr>
          <tr><td>Previous academic year</td><td>No</td><td>Chain for promotion history</td></tr>
          <tr><td>Direct to archived</td><td>No</td><td>Import historical year without ACTIVE phase</td></tr>
        </tbody>
      </table>

      <h2>Field reference — subject create</h2>
      <table>
        <thead>
          <tr><th>Field</th><th>Required</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>Name</td><td>Yes</td><td>Subject title</td></tr>
          <tr><td>Code</td><td>No</td><td>Short code for reports</td></tr>
          <tr><td>Total / passing marks</td><td>No</td><td>Default exam marking limits</td></tr>
          <tr><td>Is elective</td><td>No</td><td>Students may opt in/out</td></tr>
          <tr><td>HOD</td><td>No</td><td>Head of department teacher</td></tr>
        </tbody>
      </table>

      <h2>What happens when</h2>
      <table>
        <thead>
          <tr><th>Event</th><th>Behavior</th></tr>
        </thead>
        <tbody>
          <tr><td>Year published ACTIVE</td><td>Appears in sidebar year dropdown for all admins</td></tr>
          <tr><td>Year archived</td><td>Most modules read-only; archived CRUD flags apply for staff</td></tr>
          <tr><td>Subject linked to class</td><td>Available in marks entry, timetable, student electives</td></tr>
          <tr><td>BUILD_STAGE year selected</td><td>Banner in sidebar; some production writes may warn</td></tr>
          <tr><td>Promote executed</td><td>Students moved to target year/class per promotion rules</td></tr>
        </tbody>
      </table>

      <h2>Permissions</h2>
      <p>
        Settings are <strong>branch admin</strong> only. Not in restricted staff module matrix.
        Requires <code>activeBranchId</code>; subjects also need <code>activeAYId</code>.
      </p>
      <p>
        See <Link href="/docs/intro/admin/permissions">Permissions &amp; Staff Roles</Link> for how
        archived years affect restricted staff elsewhere.
      </p>

      <DocCallout variant="warn" title="Order of setup">
        New branches should create an academic year and subjects before enrolling students or
        building classes. Skipping this order causes empty dropdowns and failed enrollments.
      </DocCallout>

      <h2>Academic year status reference</h2>
      <table>
        <thead>
          <tr><th>Status</th><th>Meaning</th><th>Typical actions</th></tr>
        </thead>
        <tbody>
          <tr><td>BUILD_STAGE</td><td>Setup phase — not yet live</td><td>Create classes, import data, test</td></tr>
          <tr><td>ACTIVE</td><td>Current operational year</td><td>Daily enrollment, fees, attendance</td></tr>
          <tr><td>PAUSED</td><td>Temporarily frozen</td><td>Resume when ready; no new writes while paused</td></tr>
          <tr><td>ARCHIVED</td><td>Year closed</td><td>Reports only unless archived CRUD granted</td></tr>
        </tbody>
      </table>

      <h2>Common issues &amp; fixes</h2>
      <table>
        <thead>
          <tr><th>Symptom</th><th>Cause</th><th>Fix</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Subjects page empty</td>
            <td>No activeAYId</td>
            <td>Select academic year in sidebar → Go</td>
          </tr>
          <tr>
            <td>Cannot publish year</td>
            <td>Missing required fields</td>
            <td>Complete label and date range in year detail</td>
          </tr>
          <tr>
            <td>Students module empty after publish</td>
            <td>Wrong year selected</td>
            <td>Confirm ACTIVE year in sidebar matches published year</td>
          </tr>
          <tr>
            <td>Cannot delete subject</td>
            <td>Linked to classes or exams</td>
            <td>Unlink from all sections first</td>
          </tr>
        </tbody>
      </table>

      <h2>FAQ</h2>
      <DocFaq
        items={[
          {
            q: 'What is BUILD_STAGE?',
            a: 'A preparatory status while you configure classes and structures before going live with ACTIVE.',
          },
          {
            q: 'Can I have two ACTIVE years?',
            a: 'Typically one ACTIVE year drives daily operations. Check your branch policy for transitions.',
          },
          {
            q: 'Where is the archive bucket?',
            a: 'Settings sidebar → Archive — browse and manage archived year records.',
          },
          {
            q: 'Can restricted staff view archived years?',
            a: 'Only if granted archived read on at least one module — see Permissions guide.',
          },
          {
            q: 'What happens to data when a year is archived?',
            a: 'Records remain readable. Most write UIs show read-only unless archived CRUD flags are set on staff permissions.',
          },
        ]}
      />

      <h2>API endpoints (reference)</h2>
      <table>
        <thead>
          <tr><th>Method</th><th>Endpoint</th><th>Purpose</th></tr>
        </thead>
        <tbody>
          <tr><td>GET</td><td><code>/admin/academic-years?branchId=</code></td><td>Year list</td></tr>
          <tr><td>POST</td><td><code>/admin/academic-years</code></td><td>Create year</td></tr>
          <tr><td>POST</td><td><code>/admin/academic-years/:id/publish</code></td><td>Publish ACTIVE</td></tr>
          <tr><td>POST</td><td><code>/admin/academic-years/:id/archive</code></td><td>Archive year</td></tr>
          <tr><td>GET</td><td><code>/admin/subjects?branchId=&amp;academicYearId=</code></td><td>Subject catalog</td></tr>
        </tbody>
      </table>

      <h2>Navigation paths</h2>
      <table>
        <thead>
          <tr><th>Screen</th><th>URL</th></tr>
        </thead>
        <tbody>
          <tr><td>Settings landing</td><td><code>/admin/settings</code> → redirects to academic-years</td></tr>
          <tr><td>Academic Years</td><td><code>/admin/settings/academic-years</code></td></tr>
          <tr><td>Subjects</td><td><code>/admin/settings/subjects</code></td></tr>
          <tr><td>Archive bucket</td><td><code>/admin/settings/archived-years</code></td></tr>
        </tbody>
      </table>

      <DocCallout variant="warn" title="Archive timing">
        Archive only after promotion, final results, and fee reconciliation for the closing year are
        complete. Archived years block most writes for staff without explicit archived permissions.
      </DocCallout>

      <h2>Related guides</h2>
      <ul>
        <li><Link href="/docs/intro/admin/classes">Classes</Link> — link subjects to sections</li>
        <li><Link href="/docs/intro/admin/students">Students</Link> — enroll per year</li>
        <li><Link href="/docs/intro/admin/permissions">Permissions</Link> — archived year rules</li>
        <li><Link href="/docs/intro/admin">Admin Dashboard</Link> — year selector in sidebar</li>
      </ul>
    </DocsShell>
  );
}
