import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function CeoAdminsPage() {
  return (
    <DocsShell
      title="Admins"
      subtitle="See every branch administrator and track pending invitations."
      nav={introNav}
      variant="intro"
    >
      <p>
        Branch administrators run a single campus in the admin portal — enrolling students, managing
        fees, attendance, and staff. The CEO portal lets you see all admins across branches and
        manage who is invited but not yet registered.
      </p>

      <h2>Pending invitations</h2>
      <p>
        When you generate an invitation, it appears here until the person completes registration or
        the link expires (7 days). For each pending invite you see:
      </p>
      <ul>
        <li>Email address you invited</li>
        <li>Branch name and code</li>
        <li>Expiry date</li>
      </ul>
      <p>
        Use <strong>Copy Link</strong> to resend the same registration URL. The link format is{' '}
        <code>/register-admin?token=…</code> on your school&apos;s domain.
      </p>

      <DocCallout variant="info" title="CEO invites use links, not Resend">
        The CEO portal does <em>not</em> email invitation links automatically. You copy the link and
        share it (WhatsApp, SMS, or your own email). After admins are registered, they send login
        credentials to teachers and students from the admin portal — those messages use the
        school&apos;s Resend email integration.
      </DocCallout>

      <h2>Branch admins list</h2>
      <p>Every active or inactive branch admin appears with:</p>
      <ul>
        <li>Name and email</li>
        <li>Assigned branch</li>
        <li>Phone (if set)</li>
        <li>Status badge — <strong>active</strong> or inactive</li>
      </ul>
      <p>
        Click a row to open the admin&apos;s{' '}
        <Link href="/docs/intro/ceo/admins/profile">profile page</Link> and update their details.
      </p>

      <h2>Invite a new admin</h2>
      <p>
        Click <strong>Invite New Admin</strong> to open the invitation form. Full steps are on{' '}
        <Link href="/docs/intro/ceo/admins/invite">Invite Admin</Link>.
      </p>

      <DocCallout variant="tip" title="One admin per branch to start">
        Each branch needs at least one admin before day-to-day work can begin. You can invite
        additional people through the same flow if your organization allows multiple admins per
        campus.
      </DocCallout>

      <h2>Removing access</h2>
      <p>
        To revoke an admin&apos;s access without deleting school data, remove them from the{' '}
        <Link href="/docs/intro/ceo/branches/details">branch details</Link> page. Their credentials
        are deactivated; students and classes remain.
      </p>
    </DocsShell>
  );
}
