import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep } from '@/components/docs/doc-blocks';
import { apiNav } from '@/lib/docs/navigation';

export default function ApiDeploymentPage() {
  return (
    <DocsShell
      title="Deployment"
      subtitle="Production checklist for the API, web app, database, Redis, and mobile builds."
      nav={apiNav}
      variant="api"
    >
      <h2>Pre-deploy checklist</h2>
      <DocSteps>
        <DocStep title="Run test suites">
          <pre className="overflow-x-auto rounded-lg border border-warm-card-border bg-warm-card p-4 text-xs text-warm-cream">
{`cd backend && npm run test:all
cd ../web && npm run test:all`}
          </pre>
        </DocStep>
        <DocStep title="Typecheck and build">
          <pre className="overflow-x-auto rounded-lg border border-warm-card-border bg-warm-card p-4 text-xs text-warm-cream">
{`cd backend && npm run build
cd ../web && npm run typecheck && npm run build`}
          </pre>
        </DocStep>
        <DocStep title="Verify env files">
          Ensure production values for all required vars (see <Link href="/docs/api/get-started">Get Started</Link>).
          Never commit <code>.env</code> files.
        </DocStep>
      </DocSteps>

      <h2>Backend deployment</h2>
      <DocSteps>
        <DocStep title="Database migration">
          <pre className="overflow-x-auto rounded-lg border border-warm-card-border bg-warm-card p-4 text-xs text-warm-cream">
{`cd backend
npx prisma migrate deploy
npx prisma generate`}
          </pre>
          <p className="mt-2">Run against production PostgreSQL. Verify with a fresh DB in staging first.</p>
        </DocStep>
        <DocStep title="Seed (staging only)">
          <pre className="overflow-x-auto rounded-lg border border-warm-card-border bg-warm-card p-4 text-xs text-warm-cream">
{`npx prisma db seed
# or demo: npm run seed:demo`}
          </pre>
          <p className="mt-2">Production typically seeds only the grade scale (automatic on startup) — not demo users.</p>
        </DocStep>
        <DocStep title="Start the server">
          <pre className="overflow-x-auto rounded-lg border border-warm-card-border bg-warm-card p-4 text-xs text-warm-cream">
{`npm run build
NODE_ENV=production APP_MODE=production node dist/server.js`}
          </pre>
        </DocStep>
      </DocSteps>

      <h3>Required production env</h3>
      <ul>
        <li><code>DATABASE_URL</code>, <code>JWT_SECRET</code> (≥32 chars)</li>
        <li><code>APP_MODE=production</code>, <code>NODE_ENV=production</code></li>
        <li><code>ALLOWED_ORIGINS</code> — exact web origins (comma-separated)</li>
        <li><code>FRONTEND_URL</code>, <code>APP_URL</code></li>
        <li><code>HOST=0.0.0.0</code>, <code>PORT</code></li>
      </ul>

      <h3>Recommended production env</h3>
      <ul>
        <li><code>UPSTASH_REDIS_REST_URL</code> + token — JWT blacklist</li>
        <li><code>REDIS_URL</code> — BullMQ (WhatsApp + chat push)</li>
        <li><code>R2_*</code> — document storage (avoid local disk in production)</li>
        <li><code>SENTRY_DSN</code> — error tracking (<code>initSentry()</code> in <code>server.ts</code>)</li>
        <li><code>META_WHATSAPP_*</code> — credential delivery</li>
        <li><code>FCM_ENABLED=true</code> + Firebase service account — mobile push</li>
      </ul>

      <h2>Web deployment</h2>
      <ul>
        <li>Set <code>NEXT_PUBLIC_API_URL</code> to the production API origin</li>
        <li>Set <code>NEXT_PUBLIC_PUBLISHABLE_KEY</code> from production key manager</li>
        <li><code>NEXT_PUBLIC_APP_MODE=production</code></li>
        <li>Build: <code>npm run build</code> · Start: <code>npm run start</code> (or deploy to Vercel/Node host)</li>
        <li>Ensure CORS <code>ALLOWED_ORIGINS</code> on the API includes the web origin</li>
      </ul>

      <h2>Mobile deployment</h2>
      <ul>
        <li>Build with production API: <code>--dart-define=API_BASE_URL=https://api.yourschool.pk</code></li>
        <li>Configure Firebase for FCM (Android/iOS)</li>
        <li>Distribute APK/IPA or publish to stores; set <code>APP_DOWNLOAD_URL</code> in backend env</li>
      </ul>

      <h2>Startup health checks</h2>
      <p>On boot, <code>runStartupChecks()</code> verifies:</p>
      <ul>
        <li>Environment variables</li>
        <li>PostgreSQL connectivity</li>
        <li>Grade scale seed (idempotent)</li>
        <li>Upstash Redis REST (non-critical)</li>
        <li>Redis TCP for queues (warns if unreachable)</li>
      </ul>
      <p>Probe <code>GET /health</code> from your load balancer.</p>

      <h2>Graceful shutdown</h2>
      <p>
        <code>SIGTERM</code> / <code>SIGINT</code> handlers stop BullMQ workers, close Socket.IO, disconnect
        Prisma, and exit within 10 seconds.
      </p>

      <h2>Security checklist</h2>
      <ul>
        <li>HTTPS everywhere — JWT cookies use <code>secure: true</code> in production</li>
        <li>Rotate <code>JWT_SECRET</code> and API keys on compromise</li>
        <li>Rate limiting on upload and password-set routes</li>
        <li>Helmet security headers (relaxed only for <code>/key-manager</code>)</li>
        <li>Admin routes enforce <code>super_admin</code> / <code>management</code> + branch scope</li>
        <li>Student/teacher routes scoped to active enrollment/assignment</li>
        <li>Docs routes are authenticated and <code>noindex</code></li>
      </ul>

      <h2>Backups</h2>
      <pre className="overflow-x-auto rounded-lg border border-warm-card-border bg-warm-card p-4 text-xs text-warm-cream">
{`cd backend
npm run backup:postgres   # uploads to R2_BACKUPS_BUCKET when configured`}
      </pre>

      <h2>Post-deploy smoke test</h2>
      <ol>
        <li><code>curl https://api.example.com/health</code></li>
        <li>CEO login → create branch → create academic year → publish</li>
        <li>Admin login → create student → send credentials (WhatsApp)</li>
        <li>Mobile login → chat bootstrap loads rooms</li>
        <li>Trigger a test error → verify Sentry event</li>
      </ol>

      <DocCallout variant="warn" title="CORS in production">
        With <code>APP_MODE=production</code>, only origins listed in <code>ALLOWED_ORIGINS</code> are accepted.
        Socket.IO uses the same list (not wildcard).
      </DocCallout>

      <p>
        See also: <Link href="/docs/api/get-started">Get Started</Link> · <Link href="/docs/api/architecture">Architecture</Link>
      </p>
    </DocsShell>
  );
}
