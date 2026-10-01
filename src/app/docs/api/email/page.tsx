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

      <h2>WhatsApp credential handoff (manual, no provider)</h2>
      <p>
        WhatsApp communication uses browser click-to-chat handoff with prefilled
        message content. The application does not send WhatsApp messages directly.
        The user completes the final Send action in WhatsApp. The application
        records the initiated WhatsApp handoff, but cannot observe whether the
        user actually presses Send or whether the recipient receives/reads the message.
      </p>

      <h3>Credential endpoints</h3>
      <DocTable
        headers={['Method', 'Path', 'Auth', 'Scope query params']}
        rows={[
          ['POST', '/admin/students/:id/save-credential', 'Admin + students module', 'branchId, academicYearId'],
          ['POST', '/admin/teachers/:id/save-credential', 'Admin', 'branchId'],
          ['POST', '/admin/staff/:userId/save-credential', 'Admin + staff module', 'branchId'],
        ]}
      />

      <h3>POST /admin/students/:id/save-credential — example</h3>
      <pre className={pre}>
{`POST /admin/students/student-uuid/save-credential?branchId=...
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "password": "<generated-12-char>",
  "adminPassword": "<admin-own-password>",
  "replaceExisting": true,
  "idempotencyKey": "<uuid>"
}

Response 200:
{
  "success": true,
  "data": {
    "website": "https://mothercareschool.pk",
    "schoolName": "Mother Care School",
    "appUrl": "https://play.google.com/...",
    "credentialGeneratedAt": "...",
    "credentialSentAt": "..."
  }
}`}
      </pre>

      <h3>Handoff pipeline</h3>
      <pre className={pre}>
{`flowchart TD
  A[Generate password in browser] --> B[Replacement confirm if password exists]
  B --> C[Admin authorizes with own password]
  C --> D[POST save-credential: hash + audit + timestamps in one transaction]
  D --> E[Build message text locally from save response]
  E --> F[Open wa.me chat with prefilled text]
  F --> G[User presses Send in WhatsApp]`}
      </pre>

      <h3>Message values</h3>
      <DocTable
        headers={['Variable', 'Description']}
        rows={[
          [<code>FRONTEND_URL</code>, 'Website slot in manual WhatsApp handoff messages'],
          [<code>SCHOOL_NAME</code>, 'School-name slot in manual WhatsApp handoff messages'],
          [<code>APP_DOWNLOAD_URL</code>, 'App-link slot in manual WhatsApp handoff messages'],
        ]}
      />

      <h3>Message construction</h3>
      <p>File: <code>web/src/lib/whatsappCredential.ts</code></p>
      <DocTable
        headers={['Recipient', 'Slots']}
        rows={[
          [<code>teacher</code>, 'school, teacher name, website, username, password, app link'],
          [<code>staff</code>, 'school, staff name, designation, website, username, password, app link'],
          [<code>student</code>, 'school, student name, class, website, username, password, app link'],
        ]}
      />
      <p>Messages are pure string templates opened via <code>https://wa.me/&lt;digits&gt;?text=&lt;encoded&gt;</code>. The password appears only inside the encoded text.</p>

      <h3>SaveCredentialResult shape</h3>
      <pre className={pre}>
{`{
  "success": true,
  "data": {
    "website": "https://mothercareschool.pk",
    "schoolName": "Mother Care School",
    "appUrl": "https://play.google.com/...",
    "credentialGeneratedAt": "...",
    "credentialSentAt": "..."
  }
}

// Replacement required:
{
  "success": false,
  "code": "PASSWORD_REPLACEMENT_REQUIRED",
  "message": "Student already has a password. Confirm replacement first."
}`}
      </pre>

      <h3>Credential tracking (Prisma)</h3>
      <DocTable
        headers={['Field / model', 'Purpose']}
        rows={[
          [<code>Student.credentialSentAt</code>, 'Timestamp of last WhatsApp handoff (initiated, not delivered)'],
          [<code>Student.credentialStatus</code>, 'sent = handoff initiated (manual flow)'],
          [<code>StudentCredentialTag</code>, 'CRED_NEW, CRED_RESEND, NO_LOGIN, etc.'],
          [<code>CredentialSend</code>, 'Audit history of past automated sends (legacy) — phone redacted in logs'],
        ]}
      />

      <DocCallout variant="info" title="Rate limiting">
        <code>save-credential</code> and <code>set-password</code> routes use <code>passwordSetLimiter</code> to
        prevent abuse. Expect 429 if exceeded.
      </DocCallout>

      <p>
        Next: <Link href="/docs/api/endpoints">REST Endpoints</Link>
      </p>
    </DocsShell>
  );
}
