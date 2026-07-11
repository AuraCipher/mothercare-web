import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function AdminClassesPage() {
  return (
    <DocsShell
      title="Classes / Sections"
      subtitle="Create class groups, sections, and link subjects for the active academic year."
      nav={introNav}
      variant="intro"
    >
      <p>
        Classes (sections/groups) define how students are organized — for example &quot;Class 5 —
        A&quot;. Each group can have capacity limits, linked subjects, teacher assignments, chat
        roles, and a timetable. Data is scoped to the selected branch and academic year.
      </p>

      <h2>Common tasks</h2>
      <DocSteps>
        <DocStep title="Create a class group">
          Click <strong>Add Class</strong>, enter the class name, choose whether to enable sections
          (A, B, C…), and save. Sections are created as separate groups under the same class name.
        </DocStep>
        <DocStep title="Link subjects to a section">
          Expand a class row and use <strong>Link Subjects</strong> to attach subjects from your
          branch catalog (configured under Settings → Subjects).
        </DocStep>
        <DocStep title="Edit or reorder">
          Use the edit action to rename classes, add sections, or adjust display order. Drag handles
          reorder sections when available.
        </DocStep>
        <DocStep title="Configure class chat roles">
          Open <strong>Chat roles</strong> for a class to control who can direct-message whom in the
          mobile app — separate from ERP module permissions.
        </DocStep>
      </DocSteps>

      <DocCallout variant="warn" title="Archived years">
        When the active academic year is archived, class structure is read-only on this page.
      </DocCallout>

      <h2>Permissions</h2>
      <p>
        Class management is a <strong>branch admin</strong> responsibility. Restricted management
        staff do not get a separate Classes module — they work with students and attendance within
        classes assigned to their permissions.
      </p>
      <p>
        For staff module access in general, see{' '}
        <Link href="/docs/intro/admin/permissions">Permissions & Staff Roles</Link>.
      </p>
    </DocsShell>
  );
}
