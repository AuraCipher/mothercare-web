import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function AdminStudentsPage() {
  return (
    <DocsShell
      title="Students"
      subtitle="Enroll students, search the roster, and open individual profiles."
      nav={introNav}
      variant="intro"
    >
      <p>
        The Students module is your branch roster for the selected academic year. You can register
        new students, filter by class or roll number, and open a profile to edit details, assign a
        class, manage credentials, and view linked fees or attendance.
      </p>

      <h2>Common tasks</h2>
      <DocSteps>
        <DocStep title="Add a new student">
          Click <strong>Add Student</strong>, fill in admission details, parent/guardian info, and
          class assignment, then save. The student appears in the roster for the active academic year.
        </DocStep>
        <DocStep title="Find a student">
          Use the search box (name or admission number), class dropdown, or roll number filter, then
          click <strong>Filter</strong>. Click a card to open the student profile.
        </DocStep>
        <DocStep title="Send login credentials">
          On the student profile, use the credential actions to email login details (requires Resend
          configured). Tags show whether credentials were sent or need resending.
        </DocStep>
        <DocStep title="Bulk operations">
          For promotions, transfers, or batch actions, open{' '}
          <strong>Operations</strong> from the sidebar under Students (separate Operations permission).
        </DocStep>
      </DocSteps>

      <DocCallout variant="tip" title="Academic year required">
        Select a branch and academic year from the sidebar and press <strong>Go</strong> before
        loading students. An empty roster often means no year is selected yet.
      </DocCallout>

      <h2>Permissions</h2>
      <p>Module key: <strong>Students</strong>. For restricted management staff:</p>
      <ul>
        <li><strong>Read</strong> — view the student list and profiles</li>
        <li><strong>Create</strong> — register new students</li>
        <li><strong>Update</strong> — edit profiles, class assignment, and credentials</li>
        <li><strong>Delete</strong> — remove or deactivate students (where allowed)</li>
      </ul>
      <p>
        Branch admins have full access. See{' '}
        <Link href="/docs/intro/admin/permissions">Permissions & Staff Roles</Link> for how to
        assign these rights and what happens in archived years.
      </p>
    </DocsShell>
  );
}
