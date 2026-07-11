import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout } from '@/components/docs/doc-blocks';
import { apiNav } from '@/lib/docs/navigation';

export default function ApiArchitecturePage() {
  return (
    <DocsShell
      title="Architecture"
      subtitle="How the monorepo surfaces connect, authenticate, and scope data by branch and academic year."
      nav={apiNav}
      variant="api"
    >
      <h2>Monorepo surfaces</h2>
      <ul>
        <li>
          <strong>Express API</strong> (<code>backend/</code>) — single HTTP server on port 5000. Mounts REST
          routers under <code>/auth</code>, <code>/admin</code>, <code>/teacher</code>, <code>/student</code>,{' '}
          <code>/staff</code>, <code>/chat</code>, <code>/api</code> (uploads), and more. Socket.IO shares the
          same HTTP server.
        </li>
        <li>
          <strong>Next.js web</strong> (<code>web/</code>) — CEO (<code>/ceo</code>), admin ERP (<code>/admin</code>),
          teacher portal (<code>/teacher</code>), public admin registration (<code>/register-admin</code>), and
          authenticated docs (<code>/docs</code>).
        </li>
        <li>
          <strong>Flutter mobile</strong> (<code>mobile/</code>) — student, teacher, and branch-admin mobile
          experiences. Chat and read-only academic feeds. No admin ERP on mobile.
        </li>
      </ul>

      <h2>Request flow</h2>
      <pre className="overflow-x-auto rounded-lg border border-warm-card-border bg-warm-card p-4 text-xs leading-relaxed text-warm-cream">
{`Client (web / mobile)
  → CORS + Helmet + JSON parser + cookie parser
  → request logger (development)
  → audit context middleware
  → route-specific auth + role + branch/staff guards
  → service layer (Prisma)
  → JSON response / Socket.IO emit

Errors → global errorHandler (+ Sentry capture when SENTRY_DSN set)`}
      </pre>

      <h2>Authentication flow</h2>
      <ol>
        <li>Client posts credentials to <code>POST /auth/login</code>.</li>
        <li>Backend validates user, role eligibility (student enrollment, teacher branch membership), and password.</li>
        <li>JWT payload includes <code>id</code>, <code>role</code>, <code>name</code>, and <code>branchIds[]</code> from active <code>BranchMember</code> rows.</li>
        <li>Response returns <code>token</code> in JSON. Web also sets an <code>httpOnly</code> <code>token</code> cookie.</li>
        <li>Subsequent requests send <code>Authorization: Bearer &lt;token&gt;</code> and/or the cookie.</li>
        <li><code>POST /auth/logout</code> blacklists the token (Upstash Redis + in-memory fallback) and clears the cookie.</li>
      </ol>
      <p>
        See <Link href="/docs/api/authentication">Authentication</Link> for roles, API keys, and cookie details.
      </p>

      <h2>Role model</h2>
      <p>Two layers of roles work together:</p>

      <h3>User.role (global account type)</h3>
      <p>Prisma enum <code>Role</code>:</p>
      <ul>
        <li><code>super_admin</code> — CEO; full system access, API keys, invitations</li>
        <li><code>management</code> — admin staff; ERP access gated by staff module permissions</li>
        <li><code>teacher</code> — teacher portal + mobile</li>
        <li><code>student</code> — student portal + mobile</li>
        <li><code>parent</code> — legacy/parent account type in schema</li>
      </ul>

      <h3>BranchMember.role (per-branch)</h3>
      <p>Prisma enum <code>BranchRole</code> includes <code>branch_admin</code>, <code>sub_admin</code>, <code>management</code>, <code>teacher</code>, <code>canteen_staff</code>, <code>worker</code>, etc. A user invited as branch admin has <code>User.role = management</code> (or similar) plus <code>BranchMember.role = branch_admin</code> for their campus.</p>

      <h2>Branch & academic year scoping</h2>
      <p>Most admin ERP operations are scoped to a <strong>branch</strong> and <strong>academic year</strong>:</p>
      <ul>
        <li>
          <code>branchScopeMiddleware</code> — on <code>/admin/*</code> routes, checks <code>req.user.branchIds</code>{' '}
          against <code>branchId</code> from params, body, or query. <code>super_admin</code> bypasses.
        </li>
        <li>
          <code>requireScope()</code> — resolves <code>branchId</code> + <code>academicYearId</code> (from query/body
          or the single ACTIVE year). Used by students, fees, groups, stats, etc.
        </li>
        <li>
          <code>GET /me/academic-year</code>, <code>GET /me/branches</code>, <code>GET /me/permissions</code> — help the
          web UI pick valid scope headers.
        </li>
        <li>
          Teacher/student portals pass <code>branchId</code> and <code>academicYearId</code> on bootstrap and scope
          middleware enforces enrollment/assignment.
        </li>
      </ul>

      <DocCallout variant="warn" title="Archived academic years">
        Archived years are read-only for most modules. Staff with <code>archived_ay_access</code> permission can
        view historical data.
      </DocCallout>

      <h2>Background workers</h2>
      <ul>
        <li><strong>Message queue</strong> (<code>message.queue</code>) — WhatsApp credential delivery via BullMQ</li>
        <li><strong>Chat queue</strong> (<code>chat.queue</code>) — FCM push fanout, offline delivery, attendance daily reports</li>
        <li>Both require <code>REDIS_URL</code> (TCP). Without Redis, credentials send synchronously and chat push is skipped.</li>
      </ul>

      <h2>Data layer</h2>
      <ul>
        <li>Prisma client with audit extension (<code>prismaAuditExtension</code>)</li>
        <li>PostgreSQL — single database, branch/AY isolation enforced in application layer</li>
        <li>File metadata in DB; blobs in R2 or local <code>uploads/</code></li>
      </ul>

      <p>
        Next: <Link href="/docs/api/authentication">Authentication</Link> · <Link href="/docs/api/endpoints">REST Endpoints</Link>
      </p>
    </DocsShell>
  );
}
