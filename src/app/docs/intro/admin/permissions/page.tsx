import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function AdminPermissionsPage() {
  return (
    <DocsShell
      title="Admin Permissions & Staff Roles"
      subtitle="Who can do what in the admin portal — in simple terms."
      nav={introNav}
      variant="intro"
    >
      <h2>Role types</h2>
      <ul>
        <li><strong>Branch admin</strong> — full access to their branch unless restricted.</li>
        <li><strong>Management staff</strong> — custom module permissions (read / create / update / delete per module).</li>
        <li><strong>Teachers</strong> — use the teacher portal, not the full admin ERP (except HOD tools when assigned).</li>
      </ul>

      <h2>How restrictions work</h2>
      <p>
        When staff are marked as <em>restricted</em>, an administrator assigns which ERP modules they
        can access and which actions they can perform. If you cannot see a menu item, you do not have
        permission — ask your branch admin.
      </p>

      <h2>Archived academic years</h2>
      <p>
        In an archived year, most write actions are blocked. You can usually still view reports and
        historical records if you have read permission.
      </p>

      <DocCallout variant="info" title="Sending credentials">
        Admins can email login details to students, teachers, and staff from their profile pages.
        Emails are sent through the school&apos;s configured Resend integration.
      </DocCallout>

      <h2>Chat permissions (mobile)</h2>
      <p>
        Class chat roles (who can DM whom) are configured per class under <strong>Chat roles</strong>.
        This is separate from ERP module permissions.
      </p>
    </DocsShell>
  );
}
