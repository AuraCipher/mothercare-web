import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocTable } from '@/components/docs/doc-blocks';
import { apiNav } from '@/lib/docs/navigation';

const pre = 'overflow-x-auto rounded-lg border border-warm-card-border bg-warm-card p-4 text-xs leading-relaxed text-warm-cream';

export default function ApiArchitecturePage() {
  return (
    <DocsShell
      title="Architecture"
      subtitle="Monorepo surfaces, request pipeline, authentication, branch/academic-year scoping, workers, and data model."
      nav={apiNav}
      variant="api"
    >
      <h2>Monorepo surfaces</h2>
      <DocTable
        headers={['Surface', 'Path', 'API prefixes used']}
        rows={[
          ['Express API', 'backend/', '/auth, /admin, /teacher, /student, /staff, /chat, /api, /me, /branches'],
          ['CEO portal', 'web/src/app/ceo/', '/api-keys, /admin/invitations, /admin/branches'],
          ['Admin ERP', 'web/src/app/admin/', '/admin/* with branchId + academicYearId query params'],
          ['Teacher portal', 'web/src/app/teacher/', '/teacher/*'],
          ['Student web', 'web/src/app/student/', '/student/* (minimal; mobile is primary)'],
          ['Flutter mobile', 'mobile/', '/student, /teacher, /staff, /chat + Socket.IO'],
          ['Docs site', 'web/src/app/docs/', 'Authenticated; noindex'],
        ]}
      />

      <h2>HTTP request pipeline</h2>
      <pre className={pre}>
{`sequenceDiagram
  participant C as Client
  participant H as Helmet + CORS
  participant P as Parsers (JSON, cookies)
  participant L as requestLogger (dev)
  participant A as auditContextMiddleware
  participant R as Route router
  participant M as Auth + Role + Scope guards
  participant S as Service (Prisma)
  participant E as errorHandler

  C->>H: HTTP request
  H->>P: Security headers, CORS check
  P->>L: Parse body / cookies
  L->>A: Attach audit context
  A->>R: Match route
  R->>M: Middleware chain
  M->>S: Business logic
  S-->>C: JSON response
  M-->>E: Thrown { status, message }
  E-->>C: { success: false, message }`}
      </pre>
      <p>
        Global middleware order is defined in <code>backend/src/app.ts</code>. Route-specific middleware is mounted
        per router (e.g. <code>admin.routes.ts</code> applies auth → role → branchScope → staffPermission on every
        <code>/admin</code> path).
      </p>

      <h2>Authentication flow</h2>
      <pre className={pre}>
{`sequenceDiagram
  participant C as Client
  participant A as POST /auth/login
  participant DB as PostgreSQL
  participant R as Upstash Redis

  C->>A: identifier + password
  A->>DB: find user, verify password, check eligibility
  A->>DB: load BranchMember → branchIds[]
  A-->>C: JWT + user (+ push crypto for mobile roles)
  Note over C: Web sets httpOnly cookie "token"
  C->>A: Subsequent requests (Bearer or cookie)
  A->>R: isBlacklisted(token)?
  alt revoked
    A-->>C: 401 Token has been revoked
  else valid
    A-->>C: 200 scoped data
  end
  C->>A: POST /auth/logout
  A->>R: blacklist token until expiry`}
      </pre>
      <p>
        JWT payload: <code>id</code>, <code>role</code>, <code>name</code>, <code>branchIds[]</code>, optional{' '}
        <code>schoolId</code>. Issuer <code>school-erp</code>, audience <code>school-erp-clients</code>.
      </p>
      <p>
        Full auth reference: <Link href="/docs/api/authentication">Authentication</Link>.
      </p>

      <h2>Role model (two layers)</h2>
      <h3>User.role — global account type</h3>
      <p>Prisma enum <code>Role</code> in <code>backend/prisma/schema.prisma</code>:</p>
      <DocTable
        headers={['Value', 'Portal access']}
        rows={[
          [<code>super_admin</code>, 'CEO — full system, API keys, invitations, all branches'],
          [<code>management</code>, 'Admin ERP — gated by StaffModule permissions per branch'],
          [<code>teacher</code>, '/teacher/* + mobile teacher app'],
          [<code>student</code>, '/student/* + mobile student app'],
          [<code>parent</code>, 'Legacy merged parent account type in schema'],
        ]}
      />

      <h3>BranchMember.role — per-campus</h3>
      <p>Prisma enum <code>BranchRole</code>:</p>
      <DocTable
        headers={['Value', 'Typical use']}
        rows={[
          [<code>branch_admin</code>, 'Principal — /branches/:id/* + staff mobile'],
          [<code>sub_admin</code>, 'Deputy principal'],
          [<code>management</code>, 'Accountant, admin staff with module RBAC'],
          [<code>teacher</code>, 'Teaching staff branch membership'],
          [<code>canteen_staff</code>, 'Canteen daily sales only'],
          [<code>worker</code>, 'Non-teaching staff — payroll + attendance'],
        ]}
      />
      <p>
        Branch admins are invited by CEO; their <code>User.role</code> is typically <code>management</code> with{' '}
        <code>BranchMember.role = branch_admin</code>.
      </p>

      <h2>Branch &amp; academic year scoping</h2>
      <p>
        MCS isolates operational data by <strong>branch</strong> and <strong>academic year</strong>. Enforcement
        happens in middleware and <code>requireScope()</code> — not row-level DB policies.
      </p>

      <h3>branchScopeMiddleware</h3>
      <p>File: <code>backend/src/middleware/auth/branch-scope.middleware.ts</code></p>
      <p>Resolves <code>branchId</code> from (in order):</p>
      <ol>
        <li><code>req.params.branchId</code></li>
        <li><code>req.params.id</code> (e.g. <code>/admin/branches/:id</code>)</li>
        <li><code>req.body.branchId</code></li>
        <li><code>req.query.branchId</code></li>
      </ol>
      <DocTable
        headers={['Condition', 'Result']}
        rows={[
          ['No branchId in request', 'Skip — CEO routes like /admin/stats'],
          ['super_admin', 'Allow any branch'],
          ['JWT user.branchIds includes branchId', 'Allow'],
          ['API key with branchId=null', 'Allow (global key)'],
          ['API key.branchId matches', 'Allow'],
          ['Otherwise', '403 Access denied: you do not have access to this branch'],
        ]}
      />

      <h3>requireScope() / resolveScopeContext()</h3>
      <p>File: <code>backend/src/modules/admin/utils/scope-context.ts</code></p>
      <p>Resolves <code>academicYearId</code> from query, body, or params; defaults to the single ACTIVE year if omitted.</p>
      <DocTable
        headers={['Input', 'Behavior']}
        rows={[
          [<code>?branchId=&amp;academicYearId=</code>, 'Explicit scope — preferred for admin ERP'],
          ['academicYearId only', 'branchId inferred from AY record'],
          ['branchId + academicYearId mismatch', '400 academicYearId does not belong to the specified branch'],
          ['No ACTIVE year and no explicit AY', '400 No academic year specified'],
          ['ARCHIVED AY + management without archived_ay_access', '403 No permission to access archived academic years'],
        ]}
      />

      <h3>Session context endpoints</h3>
      <p>Mount: <code>/me</code> (any authenticated user)</p>
      <DocTable
        headers={['Endpoint', 'Purpose']}
        rows={[
          ['GET /me/branches', 'Branches the user can access — drives branch picker'],
          ['GET /me/academic-year', 'Active or selected academic year for current branch'],
          ['GET /me/permissions', 'Staff module permissions for management role'],
        ]}
      />

      <h3>Portal scope middleware</h3>
      <DocTable
        headers={['Portal', 'Middleware', 'Rule']}
        rows={[
          ['/teacher/*', 'teacher-scope guards', 'Active TeacherProfile + branch assignment for branchId/AY'],
          ['/student/*', 'student-scope middleware', 'Active enrollment in requested AY; not NO_LOGIN/graduated'],
          ['/staff/*', 'staff-role middleware', 'branch_admin | sub_admin | management on branch'],
        ]}
      />

      <DocCallout variant="warn" title="Archived academic years">
        <code>AcademicYearStatus.ARCHIVED</code> years are read-only for most modules. Staff need{' '}
        <code>archived_ay_access</code> permission (or full admin) to view/edit historical data.
      </DocCallout>

      <h2>Academic year lifecycle</h2>
      <pre className={pre}>
{`stateDiagram-v2
  [*] --> BUILD_STAGE: POST academic-years
  BUILD_STAGE --> ACTIVE: PATCH publish
  ACTIVE --> ON_HOLD: PATCH pause
  ON_HOLD --> ACTIVE: PATCH resume
  ACTIVE --> ARCHIVED: PATCH archive
  ARCHIVED --> ACTIVE: PATCH unarchive
  BUILD_STAGE --> [*]: DELETE (if empty)`}
      </pre>
      <DocTable
        headers={['Status', 'Who sees it', 'Writes']}
        rows={[
          [<code>BUILD_STAGE</code>, 'Admins only', 'Full setup — classes, fees, structure'],
          [<code>ACTIVE</code>, 'Everyone in branch', 'Normal operations'],
          [<code>ON_HOLD</code>, 'Paused — resume to ACTIVE', 'Limited'],
          [<code>ARCHIVED</code>, 'Admins (+ perm)', 'Mostly read-only unless archived_ay_access'],
        ]}
      />

      <h2>Background workers</h2>
      <pre className={pre}>
{`flowchart LR
  subgraph admin [Admin Action]
    SC[send-credentials]
    CM[chat:message:send]
  end

  subgraph msgQ [messages queue]
    MW[message.worker]
    WA[meta-whatsapp.service]
  end

  subgraph chatQ [chat queue]
    CW[chat.worker]
    FCM[fcm.service]
    SYS[system-notification.service]
  end

  SC -->|enqueueCredentialSend| msgQ
  MW --> WA
  CM -->|enqueueChatPushFanout| chatQ
  CW --> FCM
  CW --> SYS`}
      </pre>

      <h3>Message worker (WhatsApp)</h3>
      <DocTable
        headers={['Property', 'Value']}
        rows={[
          ['Queue name', 'messages'],
          ['Job type', 'credential_send'],
          ['Concurrency', 'MESSAGE_QUEUE_CONCURRENCY (default 3)'],
          ['Rate limit', '20 jobs / second'],
          ['Requires', 'REDIS_URL (TCP)'],
          ['Fallback', 'Synchronous deliverCredential() when queue unavailable'],
        ]}
      />

      <h3>Chat worker</h3>
      <DocTable
        headers={['Job', 'Handler']}
        rows={[
          ['chat_push_fanout', 'sendEncryptedPushToUsers — FCM for offline recipients'],
          ['chat_offline_deliver', 'flushPendingSystemNotifications'],
          ['attendance_daily_report', 'runAttendanceDailyReport — system room messages'],
        ]}
      />

      <h2>Data layer highlights</h2>
      <p>Schema: <code>backend/prisma/schema.prisma</code> (~3200 lines). Key entity groups:</p>
      <DocTable
        headers={['Domain', 'Key models']}
        rows={[
          ['Identity', 'User, BranchMember, TeacherProfile, Student, Parent'],
          ['Academic', 'Branch, AcademicYear, Group, Section, Subject, Enrollment'],
          ['Fees', 'FeeHead, FeeStructure, StudentFee, Payment, Family'],
          ['Exams', 'ExamSession, ExamClassSubject, MarksEntry, ReportCard'],
          ['Chat', 'ChatCommunity, ChatRoom, ChatMessage, ClassRole, DeviceToken'],
          ['Audit', 'AuditLog (via prismaAuditExtension), CredentialSend'],
          ['Files', 'UploadedFile — blob in R2 or local uploads/'],
        ]}
      />
      <ul>
        <li>Prisma client extended with <code>prismaAuditExtension</code> for mutation audit trails</li>
        <li>Single PostgreSQL database — branch/AY isolation enforced in application layer</li>
        <li>File metadata in DB; binary storage via R2 or <code>backend/uploads/</code> dev fallback</li>
      </ul>

      <h2>Realtime architecture</h2>
      <p>
        Socket.IO shares the HTTP server (<code>backend/server.ts</code>). Path: <code>SOCKET_PATH</code> (default{' '}
        <code>/socket.io</code>). Redis adapter enabled when <code>REDIS_URL</code> is set for horizontal scale.
        See <Link href="/docs/api/chat">Chat &amp; Realtime</Link>.
      </p>

      <h2>Error handling</h2>
      <p>
        <code>errorHandler</code> in <code>backend/src/middleware/error/errorHandler.ts</code> normalizes thrown{' '}
        <code>{`{ status, message }`}</code> objects. Status ≥500 captured to Sentry when <code>SENTRY_DSN</code>{' '}
        is set. Production hides stack traces on 500 responses.
      </p>

      <p>
        Next: <Link href="/docs/api/authentication">Authentication</Link> ·{' '}
        <Link href="/docs/api/endpoints">REST Endpoints</Link>
      </p>
    </DocsShell>
  );
}
