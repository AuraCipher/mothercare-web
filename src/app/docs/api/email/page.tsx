import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocTable } from '@/components/docs/doc-blocks';
import { apiNav } from '@/lib/docs/navigation';

export default function ApiEmailPage() {
  return (
    <DocsShell
      title="Email & Credential Delivery"
      subtitle="Admin invitation templates, Resend configuration, and WhatsApp credential sends."
      nav={apiNav}
      variant="api"
    >
      <h2>Overview</h2>
      <p>Mother Care School uses two separate outbound channels:</p>
      <ul>
        <li><strong>HTML email templates</strong> — admin invitation branding (Resend env reserved, not yet sending from backend)</li>
        <li><strong>Meta WhatsApp Cloud API</strong> — login credential delivery for students, teachers, and staff</li>
      </ul>

      <h2>Resend configuration</h2>
      <p>Environment variables in <code>backend/src/config/env.ts</code>:</p>
      <ul>
        <li><code>RESEND_API_KEY</code> — optional</li>
        <li><code>RESEND_FROM_EMAIL</code> — optional sender address</li>
      </ul>
      <DocCallout variant="warn" title="Not wired yet">
        The Resend SDK is not installed and no backend service calls Resend today. These env vars are
        placeholders for future automatic email delivery. CEO invitations are shared as links manually.
      </DocCallout>

      <h2>Admin invitation emails</h2>
      <p>
        Template: <code>backend/src/emails/templates/admin-invitation.ts</code> →{' '}
        <code>adminInvitationEmailHtml()</code>. Renders a branded HTML email with branch name, expiry (7 days),
        and a link to <code>{'{FRONTEND_URL}'}/register-admin?token=…</code>.
      </p>

      <h3>Invitation API flow</h3>
      <DocTable
        headers={['Method', 'Path', 'Auth', 'Description']}
        rows={[
          ['POST', '/admin/invitations', 'super_admin', 'Create invitation — returns token + registration link'],
          ['GET', '/admin/invitations', 'super_admin', 'List pending invitations and registered admins'],
          ['GET', '/admin/invitations/:token', 'Public', 'Validate token (JSON)'],
          ['GET', '/admin/invitations/:token?html=1', 'Public', 'Render invitation HTML preview'],
          ['POST', '/admin/invitations/:token/complete', 'Public', 'Complete branch admin registration'],
          ['GET', '/admin/invitations/admins/:userId', 'super_admin', 'Admin profile detail'],
          ['PUT', '/admin/invitations/admins/:userId', 'super_admin', 'Update admin profile'],
        ]}
      />

      <p>
        <code>InvitationService.createInvitation()</code> stores a one-time token (7-day expiry). The CEO portal
        copies the link — nothing is emailed automatically from the API.
      </p>

      <h2>sendCredentials (WhatsApp)</h2>
      <p>
        Admin portal actions call <code>send-credentials</code> endpoints. The backend generates a fresh temporary
        password, hashes it, and queues delivery via the Meta WhatsApp template API.
      </p>

      <h3>Endpoints</h3>
      <DocTable
        headers={['Method', 'Path', 'Recipient']}
        rows={[
          ['POST', '/admin/students/:id/send-credentials', 'Student (WhatsApp/phone on profile)'],
          ['POST', '/admin/students/send-credentials/bulk', 'Multiple students'],
          ['POST', '/admin/teachers/:id/send-credentials', 'Teacher'],
          ['POST', '/admin/staff/:userId/send-credentials', 'Staff member'],
        ]}
      />

      <h3>Delivery pipeline</h3>
      <pre className="overflow-x-auto rounded-lg border border-warm-card-border bg-warm-card p-4 text-xs leading-relaxed text-warm-cream">
{`admin route → studentService.sendCredentials()
  → notificationService.sendCredential()
  → message.queue (BullMQ, REDIS_URL)
  → credential-delivery.service
  → meta-whatsapp.service (template message)
  → CredentialSend audit row + student credentialStatus update`}
      </pre>

      <h3>WhatsApp env vars</h3>
      <ul>
        <li><code>META_WHATSAPP_PHONE_NUMBER_ID</code></li>
        <li><code>META_WHATSAPP_ACCESS_TOKEN</code></li>
        <li><code>META_WHATSAPP_BUSINESS_ACCOUNT_ID</code></li>
        <li><code>META_WHATSAPP_API_VERSION</code> (default <code>v21.0</code>)</li>
      </ul>
      <p>
        Templates are selected per recipient type (<code>student</code>, <code>teacher</code>, <code>staff</code>).
        Body parameters include name, username, temporary password, <code>FRONTEND_URL</code>, and{' '}
        <code>APP_DOWNLOAD_URL</code>.
      </p>

      <h3>Credential tracking</h3>
      <p>
        Students track <code>credentialSentAt</code>, <code>credentialStatus</code>, and <code>CredentialSend</code>{' '}
        history rows (phone redacted). Prisma enum <code>StudentCredentialTag</code> includes <code>CRED_RESEND</code>{' '}
        for re-send workflows.
      </p>

      <DocCallout variant="tip" title="Queue fallback">
        Without <code>REDIS_URL</code>, credential sends run synchronously via{' '}
        <code>enqueueCredentialSend(..., {'{ wait: true }'})</code> instead of a background worker.
      </DocCallout>

      <p>
        Next: <Link href="/docs/api/endpoints">REST Endpoints</Link>
      </p>
    </DocsShell>
  );
}
