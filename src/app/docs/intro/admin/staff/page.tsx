import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function AdminStaffPage() {
  return (
    <DocsShell
      title="Staff"
      subtitle="Management workers, permission matrix, and restricted ERP access."
      nav={introNav}
      variant="intro"
    >
      <p>
        Staff manages non-teacher branch employees who may need partial ERP access — accountants,
        registrars, canteen managers, etc. Create worker profiles, mark them as{' '}
        <strong>restricted</strong>, and assign per-module read / create / update / delete rights
        including archived-year overrides.
      </p>

      <h2>Common tasks</h2>
      <DocSteps>
        <DocStep title="Add management staff">
          Click <strong>Add Staff</strong>, enter profile and employment details, and save.
        </DocStep>
        <DocStep title="Set module permissions">
          Open the permission matrix on create or edit. Toggle each module (Fees, Attendance,
          Result, etc.) and CRUD flags. Restricted users see only allowed modules in a slim shell.
        </DocStep>
        <DocStep title="Add non-login workers">
          Use worker mode for employees who need HR records but no portal login.
        </DocStep>
        <DocStep title="Send credentials">
          Email login details when the staff member needs to sign in to their assigned modules.
        </DocStep>
      </DocSteps>

      <DocCallout variant="warn" title="Security">
        Grant the minimum permissions needed. A cashier needs Fees create/read but not Result delete.
        Review permissions when staff change roles.
      </DocCallout>

      <h2>Permissions</h2>
      <p>
        Only <strong>branch admins</strong> can open Staff management and edit the permission matrix.
        Restricted staff cannot view or change other users&apos; permissions.
      </p>
      <p>
        Full details on module keys and archived-year rules:{' '}
        <Link href="/docs/intro/admin/permissions">Permissions & Staff Roles</Link>.
      </p>
    </DocsShell>
  );
}
