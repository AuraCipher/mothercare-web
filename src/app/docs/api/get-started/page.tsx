import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep } from '@/components/docs/doc-blocks';
import { apiNav } from '@/lib/docs/navigation';

export default function ApiGetStartedPage() {
  return (
    <DocsShell
      title="Get Started"
      subtitle="Set up the monorepo locally: database, API, web, and mobile."
      nav={apiNav}
      variant="api"
    >
      <h2>Prerequisites</h2>
      <ul>
        <li>Node.js 20+ and npm</li>
        <li>PostgreSQL (local or hosted)</li>
        <li>Flutter SDK (for mobile)</li>
        <li>Optional: Upstash Redis (REST + TCP), Cloudflare R2, Meta WhatsApp credentials</li>
      </ul>

      <h2>Clone & install</h2>
      <DocSteps>
        <DocStep title="Clone the repository">
          <pre className="overflow-x-auto rounded-lg border border-warm-card-border bg-warm-card p-4 text-xs text-warm-cream">
{`git clone <repo-url> MCS-App
cd MCS-App`}
          </pre>
        </DocStep>
        <DocStep title="Install backend dependencies">
          <pre className="overflow-x-auto rounded-lg border border-warm-card-border bg-warm-card p-4 text-xs text-warm-cream">
{`cd backend
npm install`}
          </pre>
        </DocStep>
        <DocStep title="Install web dependencies">
          <pre className="overflow-x-auto rounded-lg border border-warm-card-border bg-warm-card p-4 text-xs text-warm-cream">
{`cd ../web
npm install`}
          </pre>
        </DocStep>
        <DocStep title="Install Flutter dependencies">
          <pre className="overflow-x-auto rounded-lg border border-warm-card-border bg-warm-card p-4 text-xs text-warm-cream">
{`cd ../mobile
flutter pub get`}
          </pre>
        </DocStep>
      </DocSteps>

      <h2>Environment variables</h2>

      <h3>Backend (<code>backend/.env</code>)</h3>
      <p>Copy <code>backend/.env.example</code> and set at minimum:</p>
      <ul>
        <li><code>DATABASE_URL</code> — PostgreSQL connection string</li>
        <li><code>JWT_SECRET</code> — min 32 characters</li>
        <li><code>APP_MODE=development</code> — verbose logs, permissive CORS</li>
        <li><code>ALLOWED_ORIGINS</code> — comma-separated web origins (e.g. <code>http://localhost:3000</code>)</li>
        <li><code>FRONTEND_URL</code> — used in invitation links and credential messages</li>
      </ul>
      <p>Optional but recommended for full features:</p>
      <ul>
        <li><code>UPSTASH_REDIS_REST_URL</code> + <code>UPSTASH_REDIS_REST_TOKEN</code> — JWT blacklist on logout</li>
        <li><code>REDIS_URL</code> — BullMQ workers (WhatsApp queue, chat push fanout)</li>
        <li><code>META_WHATSAPP_*</code> — credential delivery via WhatsApp templates</li>
        <li><code>R2_*</code> — Cloudflare R2 document storage</li>
        <li><code>SENTRY_DSN</code> — error tracking</li>
        <li><code>RESEND_API_KEY</code> + <code>RESEND_FROM_EMAIL</code> — reserved; not wired in backend yet</li>
      </ul>

      <h3>Web (<code>web/.env.local</code>)</h3>
      <ul>
        <li><code>NEXT_PUBLIC_API_URL=http://localhost:5000</code></li>
        <li><code>NEXT_PUBLIC_PUBLISHABLE_KEY</code> — publishable API key from <code>/key-manager</code> or seed</li>
        <li><code>NEXT_PUBLIC_APP_MODE=development</code></li>
      </ul>

      <h2>Database migrate & seed</h2>
      <DocSteps>
        <DocStep title="Run migrations">
          <pre className="overflow-x-auto rounded-lg border border-warm-card-border bg-warm-card p-4 text-xs text-warm-cream">
{`cd backend
npx prisma migrate deploy
# or during development:
npm run prisma:migrate`}
          </pre>
        </DocStep>
        <DocStep title="Seed default data">
          <pre className="overflow-x-auto rounded-lg border border-warm-card-border bg-warm-card p-4 text-xs text-warm-cream">
{`npx prisma db seed
# richer demo school:
npm run seed:demo`}
          </pre>
          <p className="mt-2">
            The default seed creates a <code>super_admin</code>, default branch, grade scale, and test users.
            See <code>mobile/README.md</code> for seeded student/teacher logins.
          </p>
        </DocStep>
      </DocSteps>

      <h2>Run all surfaces</h2>
      <DocSteps>
        <DocStep title="Start the API">
          <pre className="overflow-x-auto rounded-lg border border-warm-card-border bg-warm-card p-4 text-xs text-warm-cream">
{`cd backend
npm run dev`}
          </pre>
          <p className="mt-2">
            Health check: <code>GET http://localhost:5000/health</code>. Startup runs DB, Redis, and grade-scale checks.
          </p>
        </DocStep>
        <DocStep title="Start the web app">
          <pre className="overflow-x-auto rounded-lg border border-warm-card-border bg-warm-card p-4 text-xs text-warm-cream">
{`cd web
npm run dev`}
          </pre>
          <p className="mt-2">Open <code>http://localhost:3000</code>. Preflight script validates API URL and publishable key.</p>
        </DocStep>
        <DocStep title="Run Flutter mobile">
          <pre className="overflow-x-auto rounded-lg border border-warm-card-border bg-warm-card p-4 text-xs text-warm-cream">
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

      <DocCallout variant="tip" title="First-time setup API">
        On a fresh database, call <code>POST /setup/init</code> or use the key-manager page at{' '}
        <code>/key-manager</code> to bootstrap API keys before the web portal can authenticate.
      </DocCallout>

      <h2>Verify</h2>
      <ul>
        <li><code>curl http://localhost:5000/health</code> → <code>{`{"status":"OK"}`}</code></li>
        <li>Sign in at <code>/login</code> with a seeded admin account</li>
        <li>Mobile: sign in as <code>student_ahmed</code> / <code>Student@123</code></li>
      </ul>

      <p>
        Next: <Link href="/docs/api/architecture">Architecture overview</Link>
      </p>
    </DocsShell>
  );
}
