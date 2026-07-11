import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocCodeBlock, DocSection, DocSteps, DocStep, DocTable } from '@/components/docs/doc-blocks';
import { apiNav } from '@/lib/docs/navigation';

const pre = 'overflow-x-auto rounded-lg border border-warm-card-border bg-warm-card p-4 text-xs leading-relaxed text-warm-cream';

export default function ApiDeploymentPage() {
  return (
    <DocsShell
      title="Deployment"
      subtitle="Production checklist for the API, web app, database, Redis, Socket.IO, workers, and mobile builds."
      nav={apiNav}
      variant="api"
    >
      <h2>Deployment topology</h2>
      <pre className={pre}>
{`flowchart LR
  subgraph edge [Edge]
    LB[Load balancer / reverse proxy]
    TLS[HTTPS termination]
  end

  subgraph compute [Compute]
    API1[Node API + Socket.IO]
    API2[Node API + Socket.IO]
    WEB[Next.js web]
  end

  subgraph data [Data & queues]
    PG[(PostgreSQL)]
    R2[(Cloudflare R2)]
    REDIS[(Redis TCP — BullMQ + Socket.IO adapter)]
    UPSTASH[(Upstash Redis REST — JWT blacklist)]
  end

  subgraph external [External services]
    FCM[Firebase FCM]
    WA[Meta WhatsApp]
    SENTRY[Sentry]
  end

  LB --> TLS --> API1
  TLS --> API2
  TLS --> WEB
  API1 --> PG
  API2 --> PG
  API1 --> REDIS
  API2 --> REDIS
  API1 --> UPSTASH
  API1 --> R2
  API1 --> FCM
  API1 --> WA
  API1 --> SENTRY`}
      </pre>
      <p>
        A single Node process runs Express, Socket.IO, and BullMQ workers together via{' '}
        <code>backend/server.ts</code>. For horizontal scale, run multiple instances behind a load
        balancer with sticky sessions optional — the Redis Socket.IO adapter handles cross-instance
        fanout when <code>REDIS_URL</code> is set.
      </p>

      <DocSection title="Pre-deploy checklist">
        <DocSteps>
          <DocStep title="Run test suites">
            <DocCodeBlock>{`cd backend && npm run test:all
cd ../web && npm run test:all`}</DocCodeBlock>
          </DocStep>
          <DocStep title="Typecheck and build">
            <DocCodeBlock>{`cd backend && npm run build
cd ../web && npm run typecheck && npm run build`}</DocCodeBlock>
          </DocStep>
          <DocStep title="Verify environment files">
            Ensure production values for all required vars (see{' '}
            <Link href="/docs/api/get-started">Get Started</Link>). Never commit <code>.env</code>{' '}
            files or service account JSON to git.
          </DocStep>
          <DocStep title="Review database migrations">
            Run <code>npx prisma migrate deploy</code> against a staging database first. Confirm no
            destructive migrations without a backup plan.
          </DocStep>
        </DocSteps>
      </DocSection>

      <DocSection title="Backend deployment">
        <DocSteps>
          <DocStep title="Database migration">
            <DocCodeBlock>{`cd backend
npx prisma migrate deploy
npx prisma generate`}</DocCodeBlock>
            <p className="mt-2">
              Run against production PostgreSQL. Verify connectivity from the deployment host before
              cutting over traffic.
            </p>
          </DocStep>
          <DocStep title="Seed (staging only)">
            <DocCodeBlock>{`npx prisma db seed
# or demo data: npm run seed:demo`}</DocCodeBlock>
            <p className="mt-2">
              Production typically seeds only the grade scale (automatic on startup via{' '}
              <code>runStartupChecks()</code>) — not demo users or branches.
            </p>
          </DocStep>
          <DocStep title="Start the server">
            <DocCodeBlock>{`npm run build
NODE_ENV=production APP_MODE=production node dist/server.js`}</DocCodeBlock>
            <p className="mt-2">
              Use a process manager (systemd, PM2, or container orchestrator) to restart on failure.
              Bind <code>HOST=0.0.0.0</code> behind your reverse proxy.
            </p>
          </DocStep>
        </DocSteps>

        <h3>Required production env</h3>
        <DocTable
          headers={['Variable', 'Notes']}
          rows={[
            [<code>DATABASE_URL</code>, 'PostgreSQL connection string'],
            [<code>JWT_SECRET</code>, 'Minimum 32 characters — rotate on compromise'],
            [<code>APP_MODE</code>, 'Must be production'],
            [<code>NODE_ENV</code>, 'production'],
            [<code>ALLOWED_ORIGINS</code>, 'Comma-separated exact web origins — no wildcards'],
            [<code>FRONTEND_URL</code>, 'Web app URL for links in emails/WhatsApp'],
            [<code>APP_URL</code>, 'Public API URL'],
            [<code>HOST</code>, '0.0.0.0 behind proxy'],
            [<code>PORT</code>, 'Internal listen port (e.g. 5000)'],
          ]}
        />

        <h3>Recommended production env</h3>
        <DocTable
          headers={['Variable', 'Purpose']}
          rows={[
            [<><code>UPSTASH_REDIS_REST_URL</code> + token</>, 'JWT blacklist on logout'],
            [<code>REDIS_URL</code>, 'BullMQ workers + Socket.IO Redis adapter'],
            [<code>R2_ACCOUNT_ID</code>, <code>R2_ACCESS_KEY_ID</code>, <code>R2_SECRET_ACCESS_KEY</code>, <code>R2_BUCKET</code>, 'Document storage — avoid local disk'],
            [<code>R2_BACKUPS_BUCKET</code>, 'PostgreSQL backup uploads'],
            [<code>SENTRY_DSN</code>, 'Error tracking — initSentry() in server.ts'],
            [<code>META_WHATSAPP_*</code>, 'Credential delivery via WhatsApp'],
            [<code>FCM_ENABLED=true</code>, 'Mobile push notifications'],
            [<code>FIREBASE_SERVICE_ACCOUNT_JSON</code>, 'FCM credentials (or path variant)'],
            [<code>PUSH_MASTER_SECRET</code>, 'Encrypt FCM payloads'],
            [<code>RESEND_API_KEY</code>, 'Transactional email (invitations, receipts)'],
          ]}
        />
      </DocSection>

      <DocSection title="Web deployment">
        <DocTable
          headers={['Variable', 'Value']}
          rows={[
            [<code>NEXT_PUBLIC_API_URL</code>, 'Production API origin (https://api.yourschool.pk)'],
            [<code>NEXT_PUBLIC_PUBLISHABLE_KEY</code>, 'From production /key-manager page'],
            [<code>NEXT_PUBLIC_APP_MODE</code>, 'production'],
          ]}
        />
        <ul>
          <li>Build: <code>npm run build</code></li>
          <li>Start: <code>npm run start</code> (Node host) or deploy to Vercel/similar</li>
          <li>Ensure API <code>ALLOWED_ORIGINS</code> includes the exact web origin (scheme + host + port)</li>
          <li>Docs routes require authentication and are marked <code>noindex</code></li>
        </ul>
        <DocCodeBlock>{`# Example Vercel env
NEXT_PUBLIC_API_URL=https://api.mothercare.pk
NEXT_PUBLIC_PUBLISHABLE_KEY=pk_live_…
NEXT_PUBLIC_APP_MODE=production`}</DocCodeBlock>
      </DocSection>

      <DocSection title="Mobile deployment">
        <ul>
          <li>
            Build with production API:{' '}
            <code>flutter build apk --dart-define=API_BASE_URL=https://api.yourschool.pk</code>
          </li>
          <li>Configure Firebase for FCM on Android and iOS</li>
          <li>Set <code>APP_DOWNLOAD_URL</code> in backend env for credential messages</li>
          <li>Distribute APK/IPA directly or publish to app stores</li>
        </ul>
        <DocCallout variant="info" title="Push on first login">
          Mobile registers FCM tokens via <code>POST /chat/devices</code> after login. Verify{' '}
          <code>REDIS_URL</code> and <code>FCM_ENABLED</code> before go-live or users will miss
          offline notifications.
        </DocCallout>
      </DocSection>

      <DocSection title="Startup health checks">
        <p>
          On boot, <code>runStartupChecks()</code> in <code>server.ts</code> verifies:
        </p>
        <DocTable
          headers={['Check', 'Failure behavior']}
          rows={[
            ['Environment variables (Zod)', 'Process exits — invalid config'],
            ['PostgreSQL connectivity', 'Process exits'],
            ['Grade scale seed', 'Idempotent insert — non-fatal'],
            ['Upstash Redis REST', 'Warns — JWT blacklist disabled if unreachable'],
            ['Redis TCP for queues', 'Warns — synchronous WhatsApp fallback; no push fanout'],
          ]}
        />
        <p>Configure your load balancer to probe:</p>
        <DocCodeBlock>{`GET /health

// 200 OK
{ "status": "OK", "timestamp": "2026-03-15T12:00:00.000Z" }`}</DocCodeBlock>
      </DocSection>

      <DocSection title="Graceful shutdown">
        <p>
          <code>SIGTERM</code> and <code>SIGINT</code> handlers in <code>server.ts</code>:
        </p>
        <ol>
          <li>Stop accepting new HTTP connections</li>
          <li>Close BullMQ workers (messages + chat queues)</li>
          <li>Close Socket.IO server</li>
          <li>Disconnect Prisma client</li>
          <li>Force exit after 10 seconds if cleanup stalls</li>
        </ol>
        <DocCallout variant="warn" title="Rolling deploys">
          During rolling updates, in-flight Socket.IO connections on the old instance will drop.
          Mobile clients should reconnect with exponential backoff. The Redis adapter ensures messages
          sent from the new instance reach all room members.
        </DocCallout>
      </DocSection>

      <DocSection title="Security checklist">
        <DocTable
          headers={['Control', 'Implementation']}
          rows={[
            ['HTTPS everywhere', 'JWT cookies use secure: true in production'],
            ['CORS lockdown', 'APP_MODE=production restricts to ALLOWED_ORIGINS'],
            ['Token revocation', 'Upstash Redis blacklist on logout'],
            ['Rate limiting', 'Upload routes + password-set endpoints'],
            ['Security headers', 'Helmet — relaxed CSP only for /key-manager'],
            ['Admin RBAC', 'super_admin | management + branch scope + staff modules'],
            ['Portal scoping', 'Teacher/student routes scoped to active enrollment/assignment'],
            ['Secrets rotation', 'JWT_SECRET, API keys, Firebase credentials on compromise'],
            ['Docs access', 'Authenticated + noindex — not publicly crawlable'],
          ]}
        />
      </DocSection>

      <DocSection title="Backups & recovery">
        <DocCodeBlock>{`cd backend
npm run backup:postgres
# uploads to R2_BACKUPS_BUCKET when configured`}</DocCodeBlock>
        <p>Recommended schedule:</p>
        <ul>
          <li>Daily automated PostgreSQL backups to R2</li>
          <li>Point-in-time recovery if your Postgres host supports it</li>
          <li>Test restore on staging quarterly</li>
          <li>R2 object versioning for uploaded documents</li>
        </ul>
      </DocSection>

      <DocSection title="Post-deploy smoke test">
        <DocSteps>
          <DocStep title="API health">
            <DocCodeBlock>{`curl -s https://api.example.com/health | jq`}</DocCodeBlock>
          </DocStep>
          <DocStep title="CEO flow">
            Login → create branch → create academic year → publish
          </DocStep>
          <DocStep title="Admin flow">
            Admin login → create student → send credentials (WhatsApp or email)
          </DocStep>
          <DocStep title="Mobile flow">
            Mobile login → chat bootstrap loads rooms → send test message → verify FCM on second device
          </DocStep>
          <DocStep title="Observability">
            Trigger a test 500 → verify Sentry event. Check worker logs for BullMQ job completion.
          </DocStep>
        </DocSteps>
      </DocSection>

      <DocSection title="Common production issues">
        <DocTable
          headers={['Symptom', 'Likely cause', 'Fix']}
          rows={[
            ['CORS error in browser', 'Web origin not in ALLOWED_ORIGINS', 'Add exact origin including https://'],
            ['Socket.IO connect_error', 'Same CORS issue or wrong SOCKET_PATH', 'Match client path to env'],
            ['Push not delivered', 'REDIS_URL unset or FCM misconfigured', 'Check chat worker logs + Firebase creds'],
            ['WhatsApp credentials fail', 'META_WHATSAPP_* or queue down', 'Verify Meta template + Redis TCP'],
            ['401 after logout elsewhere', 'Expected — token blacklisted', 'Re-login'],
            ['Upload 403', 'Missing upload permission or R2 creds', 'Check staff permission + R2_* vars'],
          ]}
        />
      </DocSection>

      <p>
        See also: <Link href="/docs/api/get-started">Get Started</Link> ·{' '}
        <Link href="/docs/api/architecture">Architecture</Link> ·{' '}
        <Link href="/docs/api/chat">Chat &amp; Realtime</Link>
      </p>
    </DocsShell>
  );
}
