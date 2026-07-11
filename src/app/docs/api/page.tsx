import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocTable } from '@/components/docs/doc-blocks';
import { apiNav } from '@/lib/docs/navigation';

const pre = 'overflow-x-auto rounded-lg border border-warm-card-border bg-warm-card p-4 text-xs leading-relaxed text-warm-cream';

export default function ApiIntroPage() {
  return (
    <DocsShell
      title="API & Architecture"
      subtitle="Engineer-grade technical reference for building on or operating Mother Care School."
      nav={apiNav}
      variant="api"
    >
      <p>
        Mother Care School (MCS) is a monorepo school ERP: one Express API serves CEO, admin, teacher, and student
        web portals plus a Flutter mobile app. Data is scoped by <strong>branch</strong> and{' '}
        <strong>academic year</strong>. Realtime chat uses Socket.IO on the same HTTP server as REST.
      </p>

      <h2>System topology</h2>
      <pre className={pre}>
{`flowchart TB
  subgraph clients [Clients]
    WEB[Next.js Web Portals]
    MOB[Flutter Mobile App]
  end

  subgraph api [Express API :5000]
    REST[REST Routers]
    SOCK[Socket.IO /socket.io]
    MW[Auth + Scope Middleware]
    SVC[Service Layer]
  end

  subgraph data [Data & Infra]
    PG[(PostgreSQL / Prisma)]
    R2[Cloudflare R2 or local uploads/]
    UR[Upstash Redis REST - JWT blacklist]
    RT[Redis TCP - BullMQ workers]
  end

  subgraph workers [Background Workers]
    MSG[Message Worker - WhatsApp credentials]
    CHAT[Chat Worker - FCM push + system feeds]
  end

  WEB -->|HTTPS REST + cookies| REST
  MOB -->|HTTPS REST + Bearer JWT| REST
  WEB --> SOCK
  MOB --> SOCK
  REST --> MW --> SVC --> PG
  SVC --> R2
  MW --> UR
  SVC --> MSG
  SVC --> CHAT
  MSG --> RT
  CHAT --> RT
  SOCK --> RT`}
      </pre>
      <p>
        The API entry point is <code>backend/src/app.ts</code>. Socket.IO initializes in{' '}
        <code>backend/server.ts</code> via <code>initChatSocket()</code>. Workers start alongside the HTTP server
        when <code>REDIS_URL</code> is configured.
      </p>

      <h2>Tech stack</h2>
      <DocTable
        headers={['Layer', 'Technology', 'Location']}
        rows={[
          ['Web portals', 'Next.js 16 App Router, React 19, Tailwind', 'web/'],
          ['API', 'Node.js, Express, TypeScript', 'backend/src/'],
          ['ORM / DB', 'Prisma, PostgreSQL', 'backend/prisma/'],
          ['JWT blacklist', 'Upstash Redis REST', 'backend/src/lib/jwt.ts'],
          ['Job queues', 'BullMQ + Redis TCP', 'backend/src/queues/'],
          ['Realtime', 'Socket.IO + optional Redis adapter', 'backend/src/modules/chat/socket/'],
          ['Mobile', 'Flutter', 'mobile/'],
          ['File storage', 'Cloudflare R2 or local uploads/', 'backend/src/modules/upload/'],
          ['Credentials', 'Meta WhatsApp Cloud API', 'backend/src/services/meta-whatsapp.service.ts'],
          ['Email (future)', 'Resend env vars only — not wired', 'backend/src/config/env.ts'],
          ['Observability', 'Sentry, structured logging', 'backend/src/lib/sentry.ts'],
        ]}
      />

      <h2>Repository layout</h2>
      <DocTable
        headers={['Path', 'Purpose']}
        rows={[
          [<code>backend/</code>, 'Express API, Prisma schema, Socket.IO, BullMQ workers, HTML key-manager'],
          [<code>web/</code>, 'CEO (/ceo), admin ERP (/admin), teacher portal (/teacher), docs (/docs)'],
          [<code>mobile/</code>, 'Student, teacher, branch-admin mobile — chat + academics (read-only feeds)'],
        ]}
      />

      <h2>API mount points</h2>
      <p>Verified from <code>backend/src/app.ts</code>:</p>
      <DocTable
        headers={['Prefix', 'Module', 'Auth']}
        rows={[
          [<code>/</code>, 'API index + health', 'Public'],
          [<code>/auth</code>, 'Login, logout, session', 'Mixed'],
          [<code>/api-keys</code>, 'CEO API key CRUD', 'super_admin'],
          [<code>/setup</code>, 'First-run bootstrap', 'Public'],
          [<code>/admin</code>, 'ERP (students, fees, exams, …)', 'super_admin | management + RBAC'],
          [<code>/admin/invitations</code>, 'Branch admin invitations', 'Mixed'],
          [<code>/admin/canteen</code>, 'Canteen module', 'Admin RBAC'],
          [<code>/branches</code>, 'Branch-admin mobile routes', 'Branch roles'],
          [<code>/teacher</code>, 'Teacher portal', 'teacher'],
          [<code>/student</code>, 'Student portal', 'student'],
          [<code>/staff</code>, 'Branch admin mobile', 'Branch roles'],
          [<code>/chat</code>, 'Chat REST companions', 'JWT'],
          [<code>/me</code>, 'Session context (AY, branches, perms)', 'JWT'],
          [<code>/api</code>, 'Upload + file serving', 'POST: auth; GET: public'],
          [<code>/uploads</code>, 'Legacy static files (dev)', 'Public'],
          [<code>/key-manager</code>, 'HTML API key UI', 'Public page'],
        ]}
      />

      <h2>Base URL &amp; response contract</h2>
      <p>
        Default local API: <code>http://localhost:5000</code>. Web reads <code>NEXT_PUBLIC_API_URL</code> from{' '}
        <code>web/.env.local</code>.
      </p>
      <h3>Success envelope</h3>
      <pre className={pre}>
{`{
  "success": true,
  "data": { ... }
}`}
      </pre>
      <h3>Error envelope</h3>
      <pre className={pre}>
{`{
  "success": false,
  "message": "Human-readable error",
  "errors": [{ "field": "password", "message": "..." }]  // 422 validation only
}`}
      </pre>
      <DocTable
        headers={['HTTP', 'Typical cause']}
        rows={[
          ['401', 'Missing/invalid JWT, expired token, revoked token, invalid API key'],
          ['403', 'Wrong role, branch scope denied, archived AY without permission, login eligibility'],
          ['404', 'Resource not found, unknown route'],
          ['422', 'Zod validation failure on request body'],
          ['429', 'Rate limit (upload, password-set routes)'],
          ['500', 'Unhandled server error — generic message in production'],
        ]}
      />

      <h2>Environment variables (overview)</h2>
      <p>
        Full tables live in <Link href="/docs/api/get-started">Get Started</Link> and{' '}
        <Link href="/docs/api/deployment">Deployment</Link>. Schema: <code>backend/src/config/env.ts</code>.
      </p>
      <DocTable
        headers={['Category', 'Required vars', 'Notes']}
        rows={[
          ['Core', 'DATABASE_URL, JWT_SECRET (≥32 chars)', 'Server exits on invalid env at boot'],
          ['HTTP', 'PORT, HOST, ALLOWED_ORIGINS (prod)', 'APP_MODE=development relaxes CORS'],
          ['URLs', 'FRONTEND_URL, APP_URL, APP_DOWNLOAD_URL', 'Used in invitations + WhatsApp templates'],
          ['Redis REST', 'UPSTASH_REDIS_REST_URL + TOKEN', 'JWT blacklist; fails closed if unreachable at check'],
          ['Redis TCP', 'REDIS_URL', 'BullMQ: WhatsApp queue + chat push worker'],
          ['WhatsApp', 'META_WHATSAPP_*', 'Credential delivery — see Email docs'],
          ['R2', 'R2_ACCOUNT_ID, keys, buckets', 'Falls back to local uploads/ when unset'],
          ['FCM', 'FCM_ENABLED, Firebase SA, PUSH_MASTER_SECRET', 'Encrypted mobile push'],
          ['Unused', 'RESEND_API_KEY, RESEND_FROM_EMAIL', 'Reserved — no backend sender yet'],
        ]}
      />

      <h2>Scoping model (summary)</h2>
      <p>
        Admin ERP routes use <code>branchScopeMiddleware</code> (JWT <code>branchIds</code> or API key branch) and{' '}
        <code>requireScope()</code> for <code>branchId</code> + <code>academicYearId</code> query/body params.
        Teacher/student portals enforce enrollment/assignment via dedicated scope middleware. Details:{' '}
        <Link href="/docs/api/architecture">Architecture</Link>.
      </p>

      <h2>Product split: web vs mobile</h2>
      <DocTable
        headers={['Surface', 'ERP', 'Chat UI', 'Chat config']}
        rows={[
          ['Admin web', 'Full ERP', 'Settings + class roles only', 'Branch chat settings, permissions'],
          ['Teacher web', 'Marks, attendance, timetable', 'Limited', 'Class role CRUD for class teachers'],
          ['Student web', 'Minimal', 'Limited', '—'],
          ['Flutter mobile', 'Read-only academics', 'Primary chat UX', 'Consumes canPost from API only'],
        ]}
      />
      <DocCallout variant="info" title="Mobile-only chat UX">
        Chat composer and room list UX live in Flutter. Web configures permissions; mobile never edits RBAC locally.
        See <Link href="/docs/api/chat">Chat &amp; Realtime</Link>.
      </DocCallout>

      <h2>Documentation map</h2>
      <DocTable
        headers={['Page', 'Contents']}
        rows={[
          [<Link href="/docs/api/get-started">Get Started</Link>, 'Clone, env tables, migrate, seed, run all surfaces'],
          [<Link href="/docs/api/architecture">Architecture</Link>, 'Request flow, roles, scope rules, workers, Prisma highlights'],
          [<Link href="/docs/api/authentication">Authentication</Link>, 'JWT, cookies, API keys, error codes, examples'],
          [<Link href="/docs/api/email">Email &amp; credentials</Link>, 'Invitations, WhatsApp flow (not Resend)'],
          [<Link href="/docs/api/endpoints">REST Endpoints</Link>, 'Module-by-module route tables with params'],
          [<Link href="/docs/api/chat">Chat &amp; Realtime</Link>, 'Socket.IO events, FCM, mobile-only decision'],
          [<Link href="/docs/api/deployment">Deployment</Link>, 'Production runbook step-by-step'],
        ]}
      />

      <DocCallout variant="info" title="Authenticated docs">
        These pages require a signed-in portal session. Layout metadata sets <code>robots: noindex</code>.
      </DocCallout>

      <h2>User-facing guide</h2>
      <p>
        Non-technical staff should read the <Link href="/docs/intro">User Guide</Link> instead of this section.
      </p>
    </DocsShell>
  );
}
