import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep, DocFaq } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function AdminTimetablePage() {
  return (
    <DocsShell
      title="Timetable"
      subtitle="Create weekly class timetables and exam datesheets per academic year."
      nav={introNav}
      variant="intro"
    >
      <h2>Overview</h2>
      <p>
        The <strong>Timetable</strong> module at <code>/admin/timetable</code> manages schedule
        documents for your branch — regular <strong>weekly grids</strong> (periods per day per class)
        and exam <strong>datesheets</strong>. Each document is named, can be activated or deactivated
        by day, and opens in a grid editor for slot assignment.
      </p>
      <p>
        <strong>Why it exists:</strong> schools need a single source of truth for when each section
        meets which subject with which teacher — displayed to admins, teachers, and optionally
        parents via the mobile app.
      </p>
      <p>
        <strong>Who uses it:</strong> branch admins and restricted staff with the{' '}
        <strong>Timetable</strong> module permission.
      </p>

      <h2>Before you start</h2>
      <ul>
        <li><strong>Academic year</strong> selected — timetables are year-scoped.</li>
        <li><strong>Classes and subjects</strong> linked under <Link href="/docs/intro/admin/classes">Classes</Link>.</li>
        <li><strong>Teachers assigned</strong> to class-subject pairs — see <Link href="/docs/intro/admin/teachers">Teachers</Link>.</li>
      </ul>

      <h2>Step-by-step: common workflows</h2>
      <DocSteps>
        <DocStep title="Create a timetable or datesheet">
          On the list page, click <strong>New</strong> in the appropriate column (Time Tables vs Date
          Sheets). Enter a name, choose type, create. Empty document appears in the list.
        </DocStep>
        <DocStep title="Open the grid editor">
          Click a timetable row → slot grid for assigning subject, teacher, and room per period per
          section. Save changes per cell or batch.
        </DocStep>
        <DocStep title="Use full branch view">
          <strong>Full View</strong> from row menu → <code>/admin/timetable/full/[id]</code> — all
          classes side by side to spot teacher or room clashes.
        </DocStep>
        <DocStep title="Edit datesheet">
          Date sheet rows open <code>/admin/timetable/datesheet/[id]</code> — exam date/time slots
          per subject or paper.
        </DocStep>
        <DocStep title="Activate or deactivate days">
          Row menu → Activate/Deactivate — controls which weekdays (Mon–Sat) the timetable is live
          for display.
        </DocStep>
        <DocStep title="Rename or delete">
          Row dropdown → Rename (modal) or Delete (confirm). Delete only when empty or unused.
        </DocStep>
        <DocStep title="Section-specific view">
          <code>/admin/timetable/[sectionId]</code> — read schedule for one class section.
        </DocStep>
      </DocSteps>

      <h2>Field reference — list page</h2>
      <table>
        <thead>
          <tr><th>Element</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>Time Tables column</td><td>Weekly recurring schedules</td></tr>
          <tr><td>Date Sheets column</td><td>Exam / special date schedules</td></tr>
          <tr><td>Name</td><td>Document label e.g. &quot;Spring 2026&quot;, &quot;Midterm Datesheet&quot;</td></tr>
          <tr><td>Active/Inactive badge</td><td>Whether document is currently enabled</td></tr>
          <tr><td>Slot count</td><td>Number of filled periods</td></tr>
          <tr><td>Row menu</td><td>Full View, Rename, Activate/Deactivate, Delete</td></tr>
        </tbody>
      </table>

      <h2>Field reference — grid slot (typical)</h2>
      <table>
        <thead>
          <tr><th>Field</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>Period / time</td><td>Row identifier for the period</td></tr>
          <tr><td>Day column</td><td>Mon–Sat cells</td></tr>
          <tr><td>Subject</td><td>From section-linked subjects</td></tr>
          <tr><td>Teacher</td><td>From teachers assigned to that class-subject</td></tr>
          <tr><td>Room</td><td>Optional room label</td></tr>
        </tbody>
      </table>

      <h2>What happens when</h2>
      <table>
        <thead>
          <tr><th>Event</th><th>Behavior</th></tr>
        </thead>
        <tbody>
          <tr><td>Timetable created</td><td>Empty grid stored for branch + academic year</td></tr>
          <tr><td>Slot saved</td><td>Teacher timetable view on profile updates</td></tr>
          <tr><td>Day deactivated</td><td>That weekday hidden from active display</td></tr>
          <tr><td>Teacher unassigned from subject</td><td>Slot may show invalid teacher — fix in Teachers or grid</td></tr>
          <tr><td>Archived year</td><td>Writes blocked unless archived CRUD on Timetable module</td></tr>
        </tbody>
      </table>

      <h2>Permissions</h2>
      <p>Module key: <strong>Timetable (TIMETABLE)</strong></p>
      <ul>
        <li><strong>Read</strong> — view list, grids, datesheets, full view</li>
        <li><strong>Create</strong> — new documents, add slots</li>
        <li><strong>Update</strong> — rename, activate days, edit assignments</li>
        <li><strong>Delete</strong> — remove unused documents</li>
      </ul>
      <p>
        See <Link href="/docs/intro/admin/permissions">Permissions &amp; Staff Roles</Link>.
      </p>

      <DocCallout variant="info" title="Teacher assignments">
        Teachers must be assigned to subjects per section before they appear in timetable slot
        pickers. Configure under <Link href="/docs/intro/admin/teachers">Teachers</Link> →
        Assignments.
      </DocCallout>

      <h2>Common issues &amp; fixes</h2>
      <table>
        <thead>
          <tr><th>Symptom</th><th>Cause</th><th>Fix</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Teacher missing in slot</td>
            <td>Not assigned to class-subject</td>
            <td><Link href="/docs/intro/admin/teachers">Teachers</Link> → Assignments</td>
          </tr>
          <tr>
            <td>Subject missing in slot</td>
            <td>Not linked to section</td>
            <td><Link href="/docs/intro/admin/classes">Classes</Link> → Link Subjects</td>
          </tr>
          <tr>
            <td>Clash in Full View</td>
            <td>Same teacher/room double-booked</td>
            <td>Move one slot to different period or room</td>
          </tr>
          <tr>
            <td>Timetable inactive</td>
            <td>All days deactivated</td>
            <td>Row menu → Activate weekdays</td>
          </tr>
          <tr>
            <td>Cannot delete timetable</td>
            <td>Slots still filled</td>
            <td>Clear slots first or deactivate instead of delete</td>
          </tr>
        </tbody>
      </table>

      <h2>Term planning workflow</h2>
      <DocSteps>
        <DocStep title="Clone or create">
          New timetable for new term — name clearly e.g. &quot;Fall 2026 Weekly&quot;.
        </DocStep>
        <DocStep title="Fill core slots">
          Start with homeroom and major subjects per section.
        </DocStep>
        <DocStep title="Full View pass">
          Check all sections for teacher and room conflicts.
        </DocStep>
        <DocStep title="Activate">
          Enable Mon–Sat days when ready for teacher portal display.
        </DocStep>
        <DocStep title="Datesheet for exams">
          Separate Date Sheet document for exam week schedule.
        </DocStep>
      </DocSteps>

      <h2>Grid editor tips</h2>
      <p>
        Fill one section completely before copying patterns to parallel sections at the same grade
        level. Use <strong>Full View</strong> after each major batch of edits — teacher double-booking
        is the most common error and is invisible when editing one section at a time.
      </p>
      <p>
        <strong>Deactivate</strong> rather than delete when a timetable is superseded but you want
        historical reference. Delete only empty documents to avoid losing audit trail of past
        schedules shown to teachers.
      </p>

      <h2>FAQ</h2>
      <DocFaq
        items={[
          {
            q: 'What is the difference between timetable and datesheet?',
            a: 'Timetables are weekly recurring class schedules. Datesheets are exam-specific date/time layouts.',
          },
          {
            q: 'Can teachers edit the timetable?',
            a: 'Teachers view their schedule in the teacher portal. Editing requires admin Timetable permission.',
          },
          {
            q: 'How do I fix a clash?',
            a: 'Use Full View to see all sections at once. Move conflicting slots to different periods or rooms.',
          },
        ]}
      />

      <h2>API endpoints (reference)</h2>
      <table>
        <thead>
          <tr><th>Method</th><th>Endpoint</th><th>Purpose</th></tr>
        </thead>
        <tbody>
          <tr><td>GET</td><td><code>/admin/timetables?branchId=&amp;academicYearId=</code></td><td>List timetables</td></tr>
          <tr><td>POST</td><td><code>/admin/timetables</code></td><td>Create timetable/datesheet</td></tr>
          <tr><td>PUT</td><td><code>/admin/timetables/:id/rename</code></td><td>Rename document</td></tr>
          <tr><td>PUT</td><td><code>/admin/timetables/:id/days</code></td><td>Activate/deactivate weekdays</td></tr>
          <tr><td>DELETE</td><td><code>/admin/timetables/:id</code></td><td>Delete document</td></tr>
        </tbody>
      </table>

      <h2>Navigation paths</h2>
      <table>
        <thead>
          <tr><th>Screen</th><th>URL</th></tr>
        </thead>
        <tbody>
          <tr><td>Timetable list</td><td><code>/admin/timetable</code></td></tr>
          <tr><td>Grid editor</td><td><code>/admin/timetable/grid?id=</code></td></tr>
          <tr><td>Full branch view</td><td><code>/admin/timetable/full/[id]</code></td></tr>
          <tr><td>Datesheet editor</td><td><code>/admin/timetable/datesheet/[id]</code></td></tr>
        </tbody>
      </table>

      <DocCallout variant="tip" title="Exam week">
        Publish datesheets at least one week before exams. Teachers and students reference datesheet
        type timetables in the mobile app — keep names obvious e.g. &quot;Midterm March 2026&quot;.
      </DocCallout>

      <h2>Related guides</h2>
      <ul>
        <li><Link href="/docs/intro/admin/classes">Classes</Link> — sections and subject links</li>
        <li><Link href="/docs/intro/admin/teachers">Teachers</Link> — assignments and schedule view</li>
        <li><Link href="/docs/intro/admin/permissions">Permissions</Link></li>
      </ul>
    </DocsShell>
  );
}
