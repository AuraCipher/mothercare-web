import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocCodeBlock, DocSection, DocStep, DocSteps, DocTable } from '@/components/docs/doc-blocks';
import { apiNav } from '@/lib/docs/navigation';

const pre = 'overflow-x-auto rounded-lg border border-warm-card-border bg-warm-card p-4 text-xs leading-relaxed text-warm-cream';

export default function ApiEnvironmentPage() {
  return (
    <DocsShell
      title="Environment Variables"
      subtitle="Complete reference for backend, web, and mobile configuration — validated in code, with step-by-step setup for each integration."
      nav={apiNav}
      variant="api"
    >
      <p>
        Environment variables are the contract between deployment infrastructure and the MCS codebase.
        The backend validates all variables at process start via Zod in{' '}
        <code>backend/src/config/env.ts</code>. Invalid values cause an immediate exit with a printed
        error list. Example files live at <code>backend/.env.example</code>, <code>web/.env.example</code>,
        and the monorepo index <code>.env.example</code>.
      </p>

      <DocCallout variant="info" title="Never commit secrets">
        Add <code>.env</code>, <code>.env.local</code>, and Firebase service account JSON to{' '}
        <code>.gitignore</code>. Use your hosting provider&apos;s secret manager in production.
      </DocCallout>

      <h2>File layout</h2>
      <DocTable
        headers={['File', 'Used by', 'Purpose']}
        rows={[
          [<code>backend/.env</code>, 'Express API + workers', 'All server-side secrets and integration keys'],
          [<code>web/.env.local</code>, 'Next.js web portals', 'Public-prefixed client vars only'],
          [<code>mobile --dart-define</code>, 'Flutter app', 'API_BASE_URL at build time'],
        ]}
      />

      <h2>Backend — required variables</h2>
      <p>Process will not start without these:</p>
      <DocTable
        headers={['Variable', 'Validation', 'Purpose']}
        rows={[
          [<code>DATABASE_URL</code>, 'Valid URL', 'PostgreSQL via Prisma'],
          [<code>JWT_SECRET</code>, 'Min 32 chars', 'JWT HS256 signing'],
          [<code>PORT</code>, 'String (default 5000)', 'HTTP listen port'],
          [<code>HOST</code>, 'String (default 0.0.0.0)', 'Bind address'],
          [<code>NODE_ENV</code>, 'development | production | test', 'Node runtime mode'],
          [<code>APP_MODE</code>, 'development | production', 'CORS + logging behavior'],
        ]}
      />

      <h2>Backend — full variable catalog</h2>
      <DocTable
        headers={['Variable', 'Required', 'Default', 'Read by']}
        rows={[
          [<code>DATABASE_URL</code>, 'Yes', '—', 'Prisma client'],
          [<code>JWT_SECRET</code>, 'Yes', '—', 'auth.service, jwt.ts'],
          [<code>JWT_EXPIRY</code>, 'No', '7d', 'auth.service'],
          [<code>PORT</code>, 'No', '5000', 'server.ts'],
          [<code>HOST</code>, 'No', '0.0.0.0', 'server.ts'],
          [<code>NODE_ENV</code>, 'No', 'development', 'cookies, Sentry, Helmet'],
          [<code>APP_MODE</code>, 'No', 'production', 'CORS policy in app.ts'],
          [<code>FRONTEND_URL</code>, 'No', '—', 'invitation.service, credential-delivery.service'],
          [<code>APP_URL</code>, 'No', '—', 'upload.service stored URLs'],
          [<code>APP_DOWNLOAD_URL</code>, 'No', 'Play Store default', 'credential-delivery.service'],
          [<code>SCHOOL_NAME</code>, 'No', 'Mother Care School', 'invitation HTML, startup banner'],
          [<code>DEFAULT_BRANCH_NAME</code>, 'No', 'Mother Care Sohan', 'seed.ts, group auto-assign'],
          [<code>ALLOWED_ORIGINS</code>, 'Prod', '—', 'Express + Socket.IO CORS'],
          [<code>UPSTASH_REDIS_REST_URL</code>, 'No', '—', 'jwt.ts blacklist'],
          [<code>UPSTASH_REDIS_REST_TOKEN</code>, 'No', '—', 'jwt.ts blacklist'],
          [<code>REDIS_URL</code>, 'No', '—', 'BullMQ workers, Socket.IO adapter'],
          [<code>MESSAGE_QUEUE_CONCURRENCY</code>, 'No', '3', 'message.worker.ts'],
          [<code>CHAT_QUEUE_CONCURRENCY</code>, 'No', '5', 'chat.worker.ts'],
          [<code>META_WHATSAPP_PHONE_NUMBER_ID</code>, 'For WA', '—', 'meta-whatsapp.service.ts'],
          [<code>META_WHATSAPP_ACCESS_TOKEN</code>, 'For WA', '—', 'meta-whatsapp.service.ts'],
          [<code>META_WHATSAPP_BUSINESS_ACCOUNT_ID</code>, 'No', '—', 'Not read by send code — dashboard only'],
          [<code>META_WHATSAPP_API_VERSION</code>, 'No', 'v21.0', 'meta-whatsapp.service.ts'],
          [<code>RESEND_API_KEY</code>, 'For email invites', '—', 'resend.service.ts → sendAdminInvitationEmail'],
          [<code>RESEND_FROM_EMAIL</code>, 'For email invites', '—', 'resend.service.ts (verified sender domain)'],
          [<code>R2_ACCOUNT_ID</code>, 'For R2', '—', 'upload.service.ts'],
          [<code>R2_ACCESS_KEY_ID</code>, 'For R2', '—', 'upload.service.ts'],
          [<code>R2_SECRET_ACCESS_KEY</code>, 'For R2', '—', 'upload.service.ts'],
          [<code>R2_DOCUMENTS_BUCKET</code>, 'No', 'mcs-documents', 'upload.service.ts'],
          [<code>R2_BACKUPS_BUCKET</code>, 'No', 'mcs-backups', 'backup scripts'],
          [<code>R2_PUBLIC_BASE_URL</code>, 'No', '—', 'Optional CDN for public files'],
          [<code>SOCKET_PATH</code>, 'No', '/socket.io', 'chat.socket.ts'],
          [<code>FCM_ENABLED</code>, 'No', 'false', 'fcm.service.ts'],
          [<code>PUSH_MASTER_SECRET</code>, 'No', 'JWT_SECRET fallback', 'push crypto at login'],
          [<code>FIREBASE_SERVICE_ACCOUNT_PATH</code>, 'For FCM', '—', 'fcm.service.ts'],
          [<code>FIREBASE_SERVICE_ACCOUNT_JSON</code>, 'For FCM', '—', 'fcm.service.ts'],
          [<code>SENTRY_DSN</code>, 'No', '—', 'server.ts initSentry()'],
        ]}
      />

      <h2>Web — client variables</h2>
      <DocTable
        headers={['Variable', 'Required', 'Example', 'Purpose']}
        rows={[
          [<code>NEXT_PUBLIC_API_URL</code>, 'Yes', 'http://localhost:5000', 'All fetch() calls in web/src/lib/api.ts'],
          [<code>NEXT_PUBLIC_PUBLISHABLE_KEY</code>, 'Yes', 'pk_live_…', 'Portal preflight + pre-login shell'],
          [<code>NEXT_PUBLIC_APP_MODE</code>, 'No', 'development', 'Client-side mode flag'],
        ]}
      />
      <p>
        Next.js only exposes variables prefixed with <code>NEXT_PUBLIC_</code> to the browser. Never put
        secrets (JWT, Resend, Meta tokens) in web env files.
      </p>

      <DocSection title="Optional in development — what still works without them">
        <p>
          These services are <strong>optional locally</strong>. The app runs with PostgreSQL + JWT only; other
          features degrade gracefully instead of crashing.
        </p>
        <DocTable
          headers={['Service', 'If unset in dev', 'What you lose']}
          rows={[
            [
              <><code>REDIS_URL</code> (TCP)</>,
              'WhatsApp credential sends run synchronously in the API process instead of a background queue',
              'No BullMQ workers; no chat push fanout; Socket.IO stays single-instance (no Redis adapter)',
            ],
            [
              <><code>R2_*</code> (Cloudflare)</>,
              'Files save to local <code>backend/uploads/</code> on disk',
              'Uploads work on one machine only — not suitable for multi-server production',
            ],
            [
              <><code>FIREBASE_*</code> + <code>PUSH_MASTER_SECRET</code></>,
              'Chat and credentials still work',
              'No mobile push notifications when the app is in the background — users must open the app to see new messages',
            ],
            [
              <><code>UPSTASH_REDIS_*</code> (REST)</>,
              'Server starts with a warning',
              'JWT blacklist on logout may not work — logged-out tokens might still work until expiry',
            ],
            [
              <><code>RESEND_*</code></>,
              'CEO invites return copy-link only',
              'No automatic invitation email — you paste the link manually',
            ],
            [
              <><code>META_WHATSAPP_*</code></>,
              'Generate credentials still works; Send fails with an error',
              'Cannot deliver login details via WhatsApp until Meta API is configured',
            ],
          ]}
        />
        <DocCallout variant="tip" title="Production vs development">
          For go-live, treat Redis (both REST + TCP), R2, WhatsApp, and Firebase as <strong>required</strong>.
          Development can omit them to iterate faster on a laptop.
        </DocCallout>
      </DocSection>

      <DocSection title="PostgreSQL (DATABASE_URL)">
        <DocSteps>
          <DocStep title="Provision a database">
            Use managed PostgreSQL (Supabase, Neon, Railway, RDS) or local Docker. Create an empty database
            named e.g. <code>mcs</code>.
          </DocStep>
          <DocStep title="Build the connection string">
            <DocCodeBlock>{`DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/mcs?schema=public"`}</DocCodeBlock>
          </DocStep>
          <DocStep title="Run migrations">
            <DocCodeBlock>{`cd backend
npx prisma migrate deploy
npx prisma generate`}</DocCodeBlock>
          </DocStep>
          <DocStep title="Verify">
            <DocCodeBlock>{`npm run dev
# Startup checks print PostgreSQL OK
curl http://localhost:5000/health`}</DocCodeBlock>
          </DocStep>
        </DocSteps>
      </DocSection>

      <DocSection title="JWT (JWT_SECRET)">
        <p>
          Generate a cryptographically random string of at least 32 characters. Used for signing all JWTs
          and (as fallback) deriving FCM encryption keys.
        </p>
        <DocCodeBlock>{`openssl rand -base64 48
# Paste output into JWT_SECRET=`}</DocCodeBlock>
        <DocCallout variant="warn" title="Rotation">
          Changing <code>JWT_SECRET</code> invalidates all existing sessions immediately. Plan a maintenance
          window and communicate to users.
        </DocCallout>
      </DocSection>

      <DocSection title="Upstash Redis — JWT blacklist">
        <DocSteps>
          <DocStep title="Create an Upstash Redis database">
            Sign up at upstash.com → Create Redis database → choose region near your API.
          </DocStep>
          <DocStep title="Copy REST credentials">
            From the database dashboard: <strong>REST URL</strong> → <code>UPSTASH_REDIS_REST_URL</code>,{' '}
            <strong>REST Token</strong> → <code>UPSTASH_REDIS_REST_TOKEN</code>.
          </DocStep>
          <DocStep title="Copy TCP URL for BullMQ">
            Connect tab → Redis URL (<code>rediss://…</code>) → <code>REDIS_URL</code>. The same Upstash
            instance serves both REST (blacklist) and TCP (queues).
          </DocStep>
          <DocStep title="Verify logout revocation">
            Login → copy token → logout → retry request with old token → expect 401{' '}
            <em>Token has been revoked</em>.
          </DocStep>
        </DocSteps>
        <p>
          File: <code>backend/src/lib/jwt.ts</code>. If REST Redis is unreachable during a blacklist{' '}
          <em>check</em>, middleware fails closed (rejects token).
        </p>
      </DocSection>

      <DocSection title="Meta WhatsApp — credential delivery">
        <p>
          WhatsApp is the <strong>only production credential channel</strong>. Flow: admin UI →{' '}
          <code>send-credentials</code> API → BullMQ (or sync) →{' '}
          <code>meta-whatsapp.service.ts</code> → Graph API template message.
        </p>
        <DocSteps>
          <DocStep title="Meta Business setup">
            Create a Meta Business account → add WhatsApp product → verify a phone number → obtain a
            WhatsApp Business Account (WABA).
          </DocStep>
          <DocStep title="Create message templates">
            In Meta Business Manager → WhatsApp → Message templates, create and get approved:
            <ul className="mt-2 list-disc pl-5">
              <li><code>credential_send</code> — students</li>
              <li><code>credential_send_teacher</code> — teachers</li>
              <li><code>credential_send_staff</code> — staff</li>
            </ul>
            Each template body needs 5 text parameters: name, username, password, portal URL, app URL.
          </DocStep>
          <DocStep title="Get API credentials">
            <DocTable
              headers={['Env var', 'Where to find']}
              rows={[
                [<code>META_WHATSAPP_PHONE_NUMBER_ID</code>, 'WhatsApp → API Setup → Phone number ID'],
                [<code>META_WHATSAPP_ACCESS_TOKEN</code>, 'System user token with whatsapp_business_messaging'],
                [<code>META_WHATSAPP_BUSINESS_ACCOUNT_ID</code>, 'WABA ID (optional — not used in send code)'],
                [<code>META_WHATSAPP_API_VERSION</code>, 'Default v21.0 — match your Graph API version'],
              ]}
            />
          </DocStep>
          <DocStep title="Set portal URLs">
            <DocCodeBlock>{`FRONTEND_URL=https://portal.yourschool.pk
APP_DOWNLOAD_URL=https://play.google.com/store/apps/details?id=com.mothercare.app`}</DocCodeBlock>
          </DocStep>
          <DocStep title="Test send">
            Admin portal → student with phone → Generate credentials → Send credentials (or Operations bulk).
            Check API logs for <code>Credential WhatsApp sent</code> or classified Meta error codes.
          </DocStep>
        </DocSteps>
        <DocCallout variant="warn" title="Without REDIS_URL">
          When <code>REDIS_URL</code> is unset, <code>enqueueCredentialSend()</code> calls{' '}
          <code>deliverCredential()</code> synchronously — the admin HTTP request waits for Meta API
          response (up to 60s with queue wait).
        </DocCallout>
      </DocSection>

      <DocSection title="Resend — CEO admin invitation emails">
        <p>
          Service: <code>backend/src/lib/email/resend.service.ts</code> → <code>sendAdminInvitationEmail()</code>.
          Called automatically from <code>invitation.service.createInvitation()</code> after the invitation row is saved.
        </p>
        <DocSteps>
          <DocStep title="Create a Resend account and verify your domain">
            Sign up at <a href="https://resend.com">resend.com</a>, add your sending domain, and complete DNS verification.
          </DocStep>
          <DocStep title="Create an API key">
            Resend dashboard → API Keys → create key with send permission.
          </DocStep>
          <DocStep title="Configure backend env">
            <DocCodeBlock>{`RESEND_API_KEY=re_xxxxxxxx
RESEND_FROM_EMAIL=noreply@yourschool.pk
FRONTEND_URL=https://portal.yourschool.pk`}</DocCodeBlock>
          </DocStep>
          <DocStep title="Test from CEO portal">
            <code>/ceo/admins/invite</code> → submit email + branch. Response includes <code>emailSent: true</code> when
            delivery succeeds. If Resend is unset or fails, <code>emailSent: false</code> and <code>emailWarning</code>{' '}
            explain why — the registration link is still returned for manual sharing.
          </DocStep>
        </DocSteps>
        <DocCallout variant="info" title="Optional fallback">
          Resend is <strong>not</strong> required for invitations to work. Without it, the CEO portal behaves as
          copy-link only (same as before). WhatsApp credential delivery is unrelated — it uses Meta env vars.
        </DocCallout>
      </DocSection>

      <DocSection title="Cloudflare R2 — file storage">
        <DocSteps>
          <DocStep title="Create R2 bucket">
            Cloudflare dashboard → R2 → Create bucket <code>mcs-documents</code> (and optionally{' '}
            <code>mcs-backups</code>).
          </DocStep>
          <DocStep title="Create API token">
            R2 → Manage R2 API Tokens → Object Read & Write → copy Account ID, Access Key ID, Secret.
          </DocStep>
          <DocStep title="Configure env">
            <DocCodeBlock>{`R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret
R2_DOCUMENTS_BUCKET=mcs-documents
R2_BACKUPS_BUCKET=mcs-backups
# Optional public CDN:
R2_PUBLIC_BASE_URL=https://cdn.yourschool.pk`}</DocCodeBlock>
          </DocStep>
          <DocStep title="Verify">
            Upload a profile photo or document in admin portal. When R2 is configured, binary goes to R2;
            when unset, files land in <code>backend/uploads/</code> and are served via{' '}
            <code>GET /uploads/*</code>.
          </DocStep>
        </DocSteps>
        <p>Implementation: <code>backend/src/modules/upload/upload.service.ts</code></p>
      </DocSection>

      <DocSection title="Firebase FCM — mobile push">
        <DocSteps>
          <DocStep title="Create Firebase project">
            console.firebase.google.com → Add project → Add Android/iOS apps matching your Flutter bundle ID.
          </DocStep>
          <DocStep title="Download service account">
            Project Settings → Service accounts → Generate new private key (JSON).
          </DocStep>
          <DocStep title="Configure backend">
            Either set <code>FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/serviceAccount.json</code> or paste
            the JSON string into <code>FIREBASE_SERVICE_ACCOUNT_JSON</code> (escape newlines for single-line).
          </DocStep>
          <DocStep title="Enable push">
            <DocCodeBlock>{`FCM_ENABLED=true
PUSH_MASTER_SECRET=<32+ char random string>
REDIS_URL=rediss://...  # required for chat push worker`}</DocCodeBlock>
          </DocStep>
          <DocStep title="Verify">
            Mobile login (teacher/student) → response includes <code>push</code> crypto material → send chat
            message to offline device → FCM notification arrives.
          </DocStep>
        </DocSteps>
        <p>Worker: <code>backend/src/queues/chat.worker.ts</code> → <code>fcm.service.ts</code></p>
      </DocSection>

      <DocSection title="Sentry — error tracking">
        <DocSteps>
          <DocStep title="Create Sentry project">
            sentry.io → New project → Node.js → copy DSN.
          </DocStep>
          <DocStep title="Set DSN">
            <DocCodeBlock>SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx</DocCodeBlock>
          </DocStep>
          <DocStep title="Verify">
            Trigger a 500 in staging → confirm event in Sentry dashboard. Initialized in{' '}
            <code>backend/server.ts</code> via <code>initSentry()</code>.
          </DocStep>
        </DocSteps>
      </DocSection>

      <DocSection title="Web publishable API key">
        <DocSteps>
          <DocStep title="First-run bootstrap">
            <DocCodeBlock>{`curl http://localhost:5000/setup/status
curl -X POST http://localhost:5000/setup/init -H "Content-Type: application/json" \\
  -d '{"email":"ceo@school.pk","password":"SecurePass123","name":"CEO"}'`}</DocCodeBlock>
            Or open <code>http://localhost:5000/key-manager</code> in a browser.
          </DocStep>
          <DocStep title="Copy publishable key">
            CEO portal → API Keys → create <code>publishable</code> key → paste into{' '}
            <code>web/.env.local</code> as <code>NEXT_PUBLIC_PUBLISHABLE_KEY</code>.
          </DocStep>
          <DocStep title="Match API URL">
            <DocCodeBlock>{`NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_PUBLISHABLE_KEY=pk_live_...`}</DocCodeBlock>
          </DocStep>
        </DocSteps>
      </DocSection>

      <DocSection title="CORS and URLs — production checklist">
        <DocTable
          headers={['Variable', 'Production value']}
          rows={[
            [<code>APP_MODE</code>, 'production'],
            [<code>ALLOWED_ORIGINS</code>, 'https://portal.yourschool.pk (exact match, no trailing slash issues)'],
            [<code>FRONTEND_URL</code>, 'Same as web portal origin'],
            [<code>APP_URL</code>, 'https://api.yourschool.pk'],
            [<code>NEXT_PUBLIC_API_URL</code>, 'Same as APP_URL'],
          ]}
        />
        <p>
          Socket.IO uses the same <code>ALLOWED_ORIGINS</code> list. A mismatch produces browser CORS errors
          on both REST and WebSocket connections.
        </p>
      </DocSection>

      <DocSection title="Startup validation">
        <p>
          <code>runStartupChecks()</code> in <code>backend/src/lib/startup.ts</code> runs on every boot:
        </p>
        <DocTable
          headers={['Check', 'On failure']}
          rows={[
            ['Zod env parse', 'Process exits with printed field errors'],
            ['PostgreSQL ping', 'Process exits'],
            ['Grade scale seed', 'Warns — non-fatal idempotent insert'],
            ['Upstash REST ping', 'Warns — JWT blacklist may be degraded'],
            ['Redis TCP ping', 'Warns — sync WhatsApp, no workers, no Socket.IO adapter'],
          ]}
        />
      </DocSection>

      <DocSection title="Local development minimal .env">
        <pre className={pre}>
{`# backend/.env — minimum to boot
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mcs"
JWT_SECRET=local_dev_secret_at_least_32_characters_long
APP_MODE=development
NODE_ENV=development
PORT=5000
HOST=127.0.0.1
FRONTEND_URL=http://localhost:3000
APP_URL=http://localhost:5000

# web/.env.local
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_PUBLISHABLE_KEY=<from /key-manager after setup/init>`}
        </pre>
      </DocSection>

      <p>
        See also: <Link href="/docs/api/deployment">Deployment</Link> ·{' '}
        <Link href="/docs/api/email">Email &amp; credentials</Link> ·{' '}
        <Link href="/docs/api/get-started">Get Started</Link>
      </p>
    </DocsShell>
  );
}
