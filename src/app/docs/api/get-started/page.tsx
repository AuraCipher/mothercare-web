import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep, DocTable } from '@/components/docs/doc-blocks';
import { apiNav } from '@/lib/docs/navigation';

const pre = 'overflow-x-auto rounded-lg border border-warm-card-border bg-warm-card p-4 text-xs leading-relaxed text-warm-cream';

export default function ApiGetStartedPage() {
  return (
    <DocsShell
      title="Get Started"
      subtitle="Clone, configure environment, migrate the database, seed data, and run API + web + mobile locally."
      nav={apiNav}
      variant="api"
    >
      <h2>Prerequisites</h2>
      <DocTable
        headers={['Tool', 'Version', 'Purpose']}
        rows={[
          ['Node.js', '20+', 'Backend + web'],
          ['npm', '9+', 'Package management'],
          ['PostgreSQL', '14+', 'Primary database'],
          ['Flutter SDK', '3.x', 'Mobile app'],
          ['Upstash Redis', 'Optional', 'JWT blacklist (REST) + BullMQ (TCP)'],
          ['Cloudflare R2', 'Optional', 'Production-like file storage'],
          ['Meta WhatsApp', 'Optional', 'Credential delivery in dev/staging'],
        ]}
      />

      <h2>Clone &amp; install</h2>
      <DocSteps>
        <DocStep title="Clone the repository">
          <pre className={pre}>
{`git clone <repo-url> MCS-App
cd MCS-App`}
          </pre>
        </DocStep>
        <DocStep title="Install backend dependencies">
          <pre className={pre}>
{`cd backend
npm install`}
          </pre>
        </DocStep>
        <DocStep title="Install web dependencies">
          <pre className={pre}>
{`cd ../web
npm install`}
          </pre>
        </DocStep>
        <DocStep title="Install Flutter dependencies">
          <pre className={pre}>
{`cd ../mobile
flutter pub get`}
          </pre>
        </DocStep>
      </DocSteps>

      <h2>Backend environment (<code>backend/.env</code>)</h2>
      <p>
        Copy <code>backend/.env.example</code>. Variables are validated at boot by Zod in{' '}
        <code>backend/src/config/env.ts</code> — invalid config exits the process.
      </p>

      <h3>Required</h3>
      <DocTable
        headers={['Variable', 'Default', 'Description']}
        rows={[
          [<code>DATABASE_URL</code>, '—', 'PostgreSQL connection string (must be valid URL)'],
          [<code>JWT_SECRET</code>, '—', 'Signing key, minimum 32 characters'],
          [<code>PORT</code>, '5000', 'HTTP listen port'],
          [<code>HOST</code>, '0.0.0.0', 'Bind address (use 127.0.0.1 for local-only)'],
          [<code>NODE_ENV</code>, 'development', 'Node environment'],
          [<code>APP_MODE</code>, 'production', 'Set development for verbose logs + permissive CORS'],
        ]}
      />

      <h3>Recommended for local dev</h3>
      <DocTable
        headers={['Variable', 'Example', 'Description']}
        rows={[
          [<code>APP_MODE</code>, 'development', 'Allows any CORS origin when Origin header present'],
          [<code>ALLOWED_ORIGINS</code>, 'http://localhost:3000', 'Comma-separated web origins (required in production)'],
          [<code>FRONTEND_URL</code>, 'http://localhost:3000', 'Invitation links + WhatsApp template body'],
          [<code>APP_URL</code>, 'http://localhost:5000', 'Public base for stored file URLs'],
          [<code>JWT_EXPIRY</code>, '7d', 'Token lifetime'],
          [<code>SCHOOL_NAME</code>, 'Mother Care School', 'Startup banner label'],
          [<code>DEFAULT_BRANCH_NAME</code>, 'Mother Care Sohan', 'Single-school auto-assignment'],
        ]}
      />

      <h3>Redis &amp; queues</h3>
      <DocTable
        headers={['Variable', 'Purpose', 'If unset']}
        rows={[
          [<code>UPSTASH_REDIS_REST_URL</code>, 'JWT blacklist on logout', 'Blacklist may fail closed at token check'],
          [<code>UPSTASH_REDIS_REST_TOKEN</code>, 'Upstash REST auth', 'Same as above'],
          [<code>REDIS_URL</code>, 'BullMQ TCP (messages + chat workers)', 'WhatsApp sync delivery; no chat push worker'],
          [<code>MESSAGE_QUEUE_CONCURRENCY</code>, '3', 'WhatsApp credential worker parallelism'],
          [<code>CHAT_QUEUE_CONCURRENCY</code>, '5', 'Chat push / system notification worker parallelism'],
        ]}
      />

      <h3>WhatsApp credentials</h3>
      <DocTable
        headers={['Variable', 'Description']}
        rows={[
          [<code>META_WHATSAPP_PHONE_NUMBER_ID</code>, 'Sender phone number ID from Meta Business'],
          [<code>META_WHATSAPP_ACCESS_TOKEN</code>, 'Permanent or system user token'],
          [<code>META_WHATSAPP_BUSINESS_ACCOUNT_ID</code>, 'WABA ID for template management'],
          [<code>META_WHATSAPP_API_VERSION</code>, 'Default v21.0 — Graph API version'],
          [<code>APP_DOWNLOAD_URL</code>, 'Play Store / App Store link in template body'],
        ]}
      />

      <h3>Storage (R2)</h3>
      <DocTable
        headers={['Variable', 'Default', 'Description']}
        rows={[
          [<code>R2_ACCOUNT_ID</code>, '—', 'Cloudflare account'],
          [<code>R2_ACCESS_KEY_ID</code>, '—', 'R2 API key'],
          [<code>R2_SECRET_ACCESS_KEY</code>, '—', 'R2 secret'],
          [<code>R2_DOCUMENTS_BUCKET</code>, 'mcs-documents', 'Upload target'],
          [<code>R2_BACKUPS_BUCKET</code>, 'mcs-backups', 'Postgres backup target'],
          [<code>R2_PUBLIC_BASE_URL</code>, '—', 'Optional CDN; empty = serve via /api/uploads/:id'],
        ]}
      />

      <h3>Mobile chat &amp; push</h3>
      <DocTable
        headers={['Variable', 'Default', 'Description']}
        rows={[
          [<code>SOCKET_PATH</code>, '/socket.io', 'Socket.IO HTTP path'],
          [<code>FCM_ENABLED</code>, 'false', 'Enable Firebase push fanout'],
          [<code>PUSH_MASTER_SECRET</code>, '—', 'AES key derivation (≥32 chars; falls back to JWT_SECRET)'],
          [<code>FIREBASE_SERVICE_ACCOUNT_PATH</code>, '—', 'Path to service account JSON'],
          [<code>FIREBASE_SERVICE_ACCOUNT_JSON</code>, '—', 'Inline JSON alternative'],
          [<code>SENTRY_DSN</code>, '—', 'Error tracking URL'],
        ]}
      />

      <h3>Reserved (not wired)</h3>
      <DocCallout variant="warn" title="Resend env vars exist but are unused">
        <code>RESEND_API_KEY</code> and <code>RESEND_FROM_EMAIL</code> are defined in env.ts but no backend service
        sends email via Resend. CEO invitations are copied manually. See{' '}
        <Link href="/docs/api/email">Email &amp; credentials</Link>.
      </DocCallout>

      <h2>Web environment (<code>web/.env.local</code>)</h2>
      <DocTable
        headers={['Variable', 'Example', 'Description']}
        rows={[
          [<code>NEXT_PUBLIC_API_URL</code>, 'http://localhost:5000', 'Backend origin for all API calls'],
          [<code>NEXT_PUBLIC_PUBLISHABLE_KEY</code>, 'pk_live_…', 'From /key-manager or seed — required for portal auth'],
          [<code>NEXT_PUBLIC_APP_MODE</code>, 'development', 'Client-side mode flag'],
        ]}
      />

      <h2>Database migrate &amp; seed</h2>
      <DocSteps>
        <DocStep title="Run migrations">
          <pre className={pre}>
{`cd backend
npx prisma migrate deploy
# development (creates migration files):
npm run prisma:migrate`}
          </pre>
        </DocStep>
        <DocStep title="Seed default data">
          <pre className={pre}>
{`npx prisma db seed
# richer demo school with sample students/teachers:
npm run seed:demo`}
          </pre>
          <p className="mt-2">
            Default seed creates <code>super_admin</code>, default branch, grade scale, and test users. See{' '}
            <code>mobile/README.md</code> for seeded logins (e.g. <code>student_ahmed</code> /{' '}
            <code>Student@123</code>).
          </p>
        </DocStep>
      </DocSteps>

      <h2>First-run API bootstrap</h2>
      <p>On a completely fresh database with no API keys:</p>
      <pre className={pre}>
{`# Check setup state
curl http://localhost:5000/setup/status

# Bootstrap super_admin + publishable key (one-time)
curl -X POST http://localhost:5000/setup/init \\
  -H "Content-Type: application/json" \\
  -d '{"email":"ceo@school.pk","password":"YourSecurePass123","name":"CEO Admin"}'`}
      </pre>
      <p>
        Alternatively open <code>http://localhost:5000/key-manager</code> in a browser for the HTML key manager UI.
      </p>

      <h2>Run all surfaces</h2>
      <DocSteps>
        <DocStep title="Start the API">
          <pre className={pre}>
{`cd backend
npm run dev`}
          </pre>
          <p className="mt-2">
            <code>runStartupChecks()</code> verifies env, PostgreSQL, grade scale seed, Upstash REST, and Redis TCP.
            Health: <code>GET http://localhost:5000/health</code>.
          </p>
        </DocStep>
        <DocStep title="Start the web app">
          <pre className={pre}>
{`cd web
npm run dev`}
          </pre>
          <p className="mt-2">
            Open <code>http://localhost:3000</code>. Preflight validates API URL and publishable key.
          </p>
        </DocStep>
        <DocStep title="Run Flutter mobile">
          <pre className={pre}>
{`cd mobile
# Android emulator → host machine:
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:5000

# iOS simulator:
flutter run --dart-define=API_BASE_URL=http://127.0.0.1:5000

# Physical device (same Wi-Fi):
flutter run --dart-define=API_BASE_URL=http://YOUR_LAN_IP:5000`}
          </pre>
        </DocStep>
      </DocSteps>

      <h2>Verify installation</h2>
      <h3>Health check</h3>
      <pre className={pre}>
{`curl -s http://localhost:5000/health
# {"status":"OK","timestamp":"2026-07-11T..."}`}
      </pre>

      <h3>Login (JWT)</h3>
      <pre className={pre}>
{`curl -s -X POST http://localhost:5000/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"identifier":"admin","password":"admin123"}'`}
      </pre>
      <p>Response includes <code>token</code>, <code>user</code>, and optional <code>push</code> crypto for mobile roles.</p>

      <h3>Scoped admin request</h3>
      <pre className={pre}>
{`curl -s "http://localhost:5000/admin/students?branchId=<uuid>&academicYearId=<uuid>" \\
  -H "Authorization: Bearer <token>"`}
      </pre>

      <h3>Smoke checklist</h3>
      <DocTable
        headers={['Step', 'Expected']}
        rows={[
          ['GET /health', '200 OK'],
          ['POST /auth/login', '200 + token'],
          ['GET /me/branches', '200 + branch list'],
          ['Web /login', 'Portal dashboard loads'],
          ['Mobile login', 'Bootstrap + chat landing returns rooms'],
        ]}
      />

      <DocCallout variant="tip" title="CORS in development">
        With <code>APP_MODE=development</code>, the API accepts any Origin header. Production requires exact{' '}
        <code>ALLOWED_ORIGINS</code> matches for both REST and Socket.IO.
      </DocCallout>

      <p>
        Next: <Link href="/docs/api/architecture">Architecture overview</Link>
      </p>
    </DocsShell>
  );
}
