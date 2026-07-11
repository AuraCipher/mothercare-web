import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function AdminTimetablePage() {
  return (
    <DocsShell
      title="Timetable"
      subtitle="Create weekly class timetables and exam datesheets per academic year."
      nav={introNav}
      variant="intro"
    >
      <p>
        Timetable manages schedule documents for your branch — regular weekly grids (periods per day
        per class) and exam <strong>datesheets</strong>. Each timetable is named, can be activated or
        deactivated, and opens in a grid editor for slot assignment.
      </p>

      <h2>Common tasks</h2>
      <DocSteps>
        <DocStep title="Create a timetable or datesheet">
          Click <strong>New</strong>, choose type (timetable vs datesheet), enter a name, and create.
        </DocStep>
        <DocStep title="Edit the grid">
          Open the item to assign subjects, teachers, and rooms to slots for each class section.
        </DocStep>
        <DocStep title="Full branch view">
          Use the full-grid view to see all classes side by side when coordinating clashes.
        </DocStep>
        <DocStep title="Rename or delete">
          Use the row menu to rename, deactivate, or delete empty timetables.
        </DocStep>
      </DocSteps>

      <DocCallout variant="info" title="Teacher assignments">
        Teachers must be assigned to subjects in <Link href="/docs/intro/admin/classes">Classes</Link>{' '}
        before they can appear in timetable slots.
      </DocCallout>

      <h2>Permissions</h2>
      <p>Module key: <strong>Timetable</strong>. For restricted staff:</p>
      <ul>
        <li><strong>Read</strong> — view timetables and datesheets</li>
        <li><strong>Create / Update</strong> — build and edit schedules</li>
        <li><strong>Delete</strong> — remove unused timetable documents</li>
      </ul>
      <p>
        See <Link href="/docs/intro/admin/permissions">Permissions & Staff Roles</Link>.
      </p>
    </DocsShell>
  );
}
