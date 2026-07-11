import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function AdminBranchesPage() {
  return (
    <DocsShell
      title="Branches"
      subtitle="View and edit campuses assigned to your admin account."
      nav={introNav}
      variant="intro"
    >
      <p>
        The Branches screen lists every campus your account can access. Multi-branch admins switch
        active branch from the sidebar; this page shows details, member counts, and lets you edit
        contact info or create new branches when your role allows.
      </p>

      <h2>Common tasks</h2>
      <DocSteps>
        <DocStep title="Switch active branch">
          Use the sidebar <strong>Active Branch</strong> dropdown, then press <strong>Go</strong> on
          the academic year selector to reload data.
        </DocStep>
        <DocStep title="View branch details">
          Click a branch row to open stats, academic years, and quick links.
        </DocStep>
        <DocStep title="Edit branch info">
          Update name, address, phone, or email. Branch codes are fixed after creation.
        </DocStep>
        <DocStep title="Create a branch">
          Organization owners create branches from the{' '}
          <Link href="/docs/intro/ceo/branches">CEO portal</Link>; some admins may create campuses
          here if permitted.
        </DocStep>
      </DocSteps>

      <DocCallout variant="info" title="CEO vs admin">
        Super admins manage all branches organization-wide in the CEO portal. Branch admins see only
        campuses they are assigned to.
      </DocCallout>

      <h2>Permissions</h2>
      <p>
        Branch list access is for <strong>branch admins</strong> (and super admins redirected to CEO).
        Restricted management staff do not manage branches — they work inside one assigned campus.
      </p>
      <p>
        See <Link href="/docs/intro/admin/permissions">Permissions & Staff Roles</Link>.
      </p>
    </DocsShell>
  );
}
