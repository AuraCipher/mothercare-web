import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function AdminSettingsPage() {
  return (
    <DocsShell
      title="Settings"
      subtitle="Academic years, subjects, and archive management for the branch."
      nav={introNav}
      variant="intro"
    >
      <p>
        Settings (footer link in the admin sidebar) configures branch-wide academic structure —
        academic years and their lifecycle, subject catalog, and archived year bucket. Most ERP
        modules depend on a published active year before data entry works.
      </p>

      <h2>Options</h2>
      <ul>
        <li><strong>Academic Years</strong> — create years, set ACTIVE / BUILD_STAGE / ARCHIVED status</li>
        <li><strong>Archive bucket</strong> — view and manage archived year records</li>
        <li><strong>Subjects</strong> — branch subject list linked to classes and exams</li>
      </ul>

      <h2>Common tasks</h2>
      <DocSteps>
        <DocStep title="Create an academic year">
          Add calendar label and dates, start in BUILD_STAGE for setup, then publish as ACTIVE when
          ready.
        </DocStep>
        <DocStep title="Add subjects">
          Under Subjects, create entries used when linking classes and entering exam marks.
        </DocStep>
        <DocStep title="Archive a year">
          When a year ends, archive it to lock writes while keeping reports readable.
        </DocStep>
        <DocStep title="Promote students">
          Use promote flows from the academic year detail when moving students to the next class.
        </DocStep>
      </DocSteps>

      <DocCallout variant="warn" title="Order of setup">
        New branches should create an academic year and subjects before enrolling students or
        building classes.
      </DocCallout>

      <h2>Permissions</h2>
      <p>
        Settings are <strong>branch admin</strong> only. Management staff with restricted permissions
        cannot change academic years or the subject catalog.
      </p>
      <p>
        See <Link href="/docs/intro/admin/permissions">Permissions & Staff Roles</Link>.
      </p>
    </DocsShell>
  );
}
