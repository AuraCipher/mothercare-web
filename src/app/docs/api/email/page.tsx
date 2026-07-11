import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocTable } from '@/components/docs/doc-blocks';
import { apiNav } from '@/lib/docs/navigation';

const pre = 'overflow-x-auto rounded-lg border border-warm-card-border bg-warm-card p-4 text-xs leading-relaxed text-warm-cream';

export default function ApiEmailPage() {
  return (
    <DocsShell
      title="Email & Credential Delivery"
      subtitle="Admin invitation emails via Resend, WhatsApp credential pipeline, and HTML templates."
      nav={apiNav}
      variant="api"
    >
      <h2>Overview</h2>
      <p>Mother Care School uses two separate outbound channels:</p>
      <DocTable
        headers={['Channel', 'Status', 'Purpose']}
        rows={[
          ['Resend email', 'Active when RESEND_API_KEY + RESEND_FROM_EMAIL set', 'CEO admin invitation delivery'],
          ['HTML email templates', 'Used by Resend sender', 'Branded admin invitation body'],
          ['Meta WhatsApp Cloud API', 'Production path', 'Login credential delivery for students, teachers, staff'],
        ]}
      />

      <h2>Resend — CEO admin invitations</h2>
      <p>
        Service: <code>backend/src/lib/email/resend.service.ts</code>. Template:{' '}
        <code>backend/src/emails/templates/admin-invitation.ts</code>.
      </p>
      <DocTable
        headers={['Variable', 'Required', 'Purpose']}
        rows={[
          [<code>RESEND_API_KEY</code>, 'For auto-send', 'Resend API authentication'],
          [<code>RESEND_FROM_EMAIL</code>, 'For auto-send', 'Verified sender address (e.g. noreply@yourschool.pk)'],
          [<code>FRONTEND_URL</code>, 'Recommended', 'Registration link base URL in email body'],
          [<code>SCHOOL_NAME</code>, 'No', 'Branding in subject and HTML'],
        ]}
      />
      <DocCallout variant="info" title="Graceful fallback">
        When Resend is not configured or send fails, <code>POST /admin/invitations</code> still returns{' '}
        <code>data.link</code> with <code>emailSent: false</code> and an <code>emailWarning</code> string.
        The CEO portal shows the link for manual sharing.
      </DocCallout>

      <h2>Admin invitation flow</h2>
      <p>
        Template: <code>backend/src/emails/templates/admin-invitation.ts</code> →{' '}
        <code>adminInvitationEmailHtml()</code>. Produces branded HTML with branch name, 7-day expiry, and link to{' '}
        <code>{'{FRONTEND_URL}'}/register-admin?token=…</code>.
      </p>

      <pre className={pre}>
{`sequenceDiagram
  participant CEO as CEO Portal
  participant API as POST /admin/invitations
  participant DB as PostgreSQL
  participant Resend as Resend API
  participant Admin as New Branch Admin

  CEO->>API: branchId, email
  API->>DB: Store invitation token (7d TTL)
  API->>Resend: sendAdminInvitationEmail (if configured)
  API-->>CEO: { token, link, emailSent, emailWarning? }
  Note over CEO: Copy link as backup when emailSent=false
  Admin->>API: GET /admin/invitations/:token
  API-->>Admin: Token validity JSON
  Admin->>API: POST /admin/invitations/:token/complete
  API->>DB: Create user + BranchMember branch_admin
  API-->>Admin: 201 + JWT`}
      </pre>

      <h3>Invitation endpoints</h3>
      <DocTable
        headers={['Method', 'Path', 'Auth', 'Body / params']}
        rows={[
          ['POST', '/admin/invitations', 'super_admin', 'branchId, email, name, phone?'],
          ['GET', '/admin/invitations', 'super_admin', 'List pending + registered admins'],
          ['GET', '/admin/invitations/:token', 'Public', 'Validate token — JSON'],
          ['GET', '/admin/invitations/:token?html=1', 'Public', 'Render invitation HTML preview'],
          ['POST', '/admin/invitations/:token/complete', 'Public', 'password, name, phone, username'],
          ['GET', '/admin/invitations/admins/:userId', 'super_admin', 'Admin profile detail'],
          ['PUT', '/admin/invitations/admins/:userId', 'super_admin', 'Update admin profile fields'],
        ]}
      />

      <h3>POST /admin/invitations — example</h3>
      <pre className={pre}>
{`POST /admin/invitations
Authorization: Bearer <ceo-token>
Content-Type: application/json

{
  "branchId": "branch-uuid",
  "email": "principal@school.pk",
  "name": "Principal Name",
  "phone": "+923001234567"
}

Response 201:
{
  "success": true,
  "data": {
    "id": "invitation-uuid",
    "token": "secure-random-token",
    "registrationUrl": "https://portal.school.pk/register-admin?token=...",
    "expiresAt": "2026-07-18T..."
  }
}`}
      </pre>

      <h3>POST /admin/invitations/:token/complete — example</h3>
      <pre className={pre}>
{`POST /admin/invitations/abc123token/complete
Content-Type: application/json

{
  "password": "SecurePass123",
  "name": "Principal Name",
  "username": "principal_sohan",
  "phone": "+923001234567"
}

Response 201:
{
  "success": true,
  "token": "jwt...",
  "user": { "id": "...", "role": "management", ... }
}`}
      </pre>

      <h3>Invitation errors</h3>
      <DocTable
        headers={['Status', 'message', 'Cause']}
        rows={[
          ['400', 'Invitation expired', 'Token past 7-day expiry'],
          ['400', 'Invitation already used', 'Token consumed'],
          ['404', 'Invitation not found', 'Invalid token'],
          ['409', 'Email already registered', 'Duplicate user'],
          ['422', 'Validation failed', 'Weak password or missing fields'],
        ]}
      />

      <h2>WhatsApp credential delivery</h2>
      <p>
        Admin portal actions call <code>send-credentials</code> endpoints. Backend generates a fresh temporary
        password, hashes it with bcrypt, updates the user record, and queues delivery via Meta WhatsApp template
        API.
      </p>

      <h3>Credential endpoints</h3>
      <DocTable
        headers={['Method', 'Path', 'Auth', 'Scope query params']}
        rows={[
          ['POST', '/admin/students/:id/send-credentials', 'Admin + students module', 'branchId, academicYearId'],
          ['POST', '/admin/students/send-credentials/bulk', 'Admin', 'branchId, academicYearId, studentIds[]'],
          ['POST', '/admin/students/send-all-credentials', 'Admin', 'branchId, academicYearId'],
          ['POST', '/admin/teachers/:id/send-credentials', 'Admin', 'branchId'],
          ['POST', '/admin/staff/:userId/send-credentials', 'Admin + staff module', 'branchId'],
        ]}
      />

      <h3>POST /admin/students/:id/send-credentials — example</h3>
      <pre className={pre}>
{`POST /admin/students/student-uuid/send-credentials?branchId=...&academicYearId=...
Authorization: Bearer <admin-token>

Response 200:
{
  "success": true,
  "data": {
    "credentialStatus": "SENT",
    "delivery": {
      "success": true,
      "channel": "whatsapp",
      "messageStatus": "queued",
      "messageId": "bullmq-job-id"
    }
  }
}`}
      </pre>

      <h3>Delivery pipeline</h3>
      <pre className={pre}>
{`flowchart TD
  A[Admin POST send-credentials] --> B[studentService.sendCredentials]
  B --> C[Generate temp password + hash]
  C --> D[notificationService.sendCredential]
  D --> E{REDIS_URL set?}
  E -->|Yes| F[enqueueCredentialSend → messages queue]
  E -->|No| G[deliverCredential sync]
  F --> H[message.worker]
  H --> I[credential-delivery.service]
  G --> I
  I --> J[meta-whatsapp.service sendTemplateMessage]
  J --> K[CredentialSend audit row]
  K --> L[Update student.credentialStatus]`}
      </pre>

      <h3>WhatsApp environment variables</h3>
      <DocTable
        headers={['Variable', 'Description']}
        rows={[
          [<code>META_WHATSAPP_PHONE_NUMBER_ID</code>, 'Sender phone number ID from Meta Business Suite'],
          [<code>META_WHATSAPP_ACCESS_TOKEN</code>, 'System user or permanent token with whatsapp_business_messaging'],
          [<code>META_WHATSAPP_BUSINESS_ACCOUNT_ID</code>, 'WABA ID — template namespace'],
          [<code>META_WHATSAPP_API_VERSION</code>, 'Graph API version (default v21.0)'],
          [<code>FRONTEND_URL</code>, 'Web portal link in template body parameter'],
          [<code>APP_DOWNLOAD_URL</code>, 'Mobile app store link in template body parameter'],
        ]}
      />

      <h3>Template selection</h3>
      <p>File: <code>backend/src/services/meta-whatsapp.service.ts</code></p>
      <DocTable
        headers={['recipientType', 'Template purpose']}
        rows={[
          [<code>student</code>, 'Student login credentials template'],
          [<code>teacher</code>, 'Teacher login credentials template'],
          [<code>staff</code>, 'Staff login credentials template'],
        ]}
      />
      <p>Body parameters (via <code>buildCredentialParameters()</code>): name, username, temporary password, portal URL, app download URL.</p>

      <h3>SendCredentialResult shape</h3>
      <pre className={pre}>
{`{
  "success": true,
  "channel": "whatsapp",
  "messageId": "wamid.xxx",
  "messageStatus": "sent"
}

// Failure:
{
  "success": false,
  "channel": "whatsapp",
  "messageStatus": "failed",
  "errorCode": "131026",
  "errorMessage": "Message undeliverable",
  "retryable": true,
  "solvable": false
}`}
      </pre>

      <h3>WhatsApp error codes (examples)</h3>
      <DocTable
        headers={['errorCode', 'retryable', 'Meaning']}
        rows={[
          ['131026', 'Sometimes', 'Recipient not on WhatsApp or invalid number'],
          ['130429', 'Yes', 'Rate limit — worker retries with exponential backoff'],
          ['queue_failed', 'Yes', 'BullMQ job failed after 3 attempts'],
          ['unknown_error', 'Yes', 'Unexpected network or parse error'],
          ['missing_whatsapp_config', 'No', 'META_WHATSAPP_* env not set'],
        ]}
      />

      <h3>Credential tracking (Prisma)</h3>
      <DocTable
        headers={['Field / model', 'Purpose']}
        rows={[
          [<code>Student.credentialSentAt</code>, 'Timestamp of last send'],
          [<code>Student.credentialStatus</code>, 'SENT | FAILED | PENDING'],
          [<code>StudentCredentialTag</code>, 'CRED_NEW, CRED_RESEND, NO_LOGIN, etc.'],
          [<code>CredentialSend</code>, 'Audit history — phone redacted in logs'],
        ]}
      />

      <DocCallout variant="tip" title="Queue fallback">
        Without <code>REDIS_URL</code>, <code>enqueueCredentialSend()</code> calls{' '}
        <code>deliverCredential()</code> synchronously. Admin UI waits up to 60s for queue completion when{' '}
        <code>wait: true</code> (default).
      </DocCallout>

      <DocCallout variant="info" title="Rate limiting">
        <code>send-credentials</code> and <code>set-password</code> routes use <code>passwordSetLimiter</code> to
        prevent abuse. Expect 429 if exceeded.
      </DocCallout>

      <p>
        Next: <Link href="/docs/api/endpoints">REST Endpoints</Link>
      </p>
    </DocsShell>
  );
}
