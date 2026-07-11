import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function AdminTeachersPage() {
  return (
    <DocsShell
      title="Teachers"
      subtitle="Hire teachers, manage profiles, and assign classes and subjects."
      nav={introNav}
      variant="intro"
    >
      <p>
        Teachers lists every teaching staff member in the branch with profile details — qualification,
        salary, contact info, class assignments, and login credentials. Teachers use the separate
        teacher portal and mobile app for daily class work.
      </p>

      <h2>Common tasks</h2>
      <DocSteps>
        <DocStep title="Add a teacher">
          Click <strong>Add Teacher</strong>, fill personal and employment fields, and save. A user
          account is created for portal access.
        </DocStep>
        <DocStep title="Search and filter">
          Use search and qualification filters to find staff quickly.
        </DocStep>
        <DocStep title="Open profile">
          Click a row for full detail — assignments, attendance link, credential email actions.
        </DocStep>
        <DocStep title="Send credentials">
          From the profile, email login details via Resend when marked as new or resend.
        </DocStep>
      </DocSteps>

      <DocCallout variant="info" title="Class assignments">
        Assign teachers to subjects per section from the teacher profile or class management screens.
      </DocCallout>

      <h2>Permissions</h2>
      <p>
        Teacher management is a <strong>branch admin</strong> function. Restricted management staff
        typically cannot access this module — they interact with teachers only through attendance or
        result workflows.
      </p>
      <p>
        For module permission assignment to other staff, see{' '}
        <Link href="/docs/intro/admin/permissions">Permissions & Staff Roles</Link>.
      </p>
    </DocsShell>
  );
}
