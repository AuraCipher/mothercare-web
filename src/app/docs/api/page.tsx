import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout } from '@/components/docs/doc-blocks';
import { apiNav } from '@/lib/docs/navigation';

export default function ApiIntroPage() {
  return (
    <DocsShell
      title="API & Architecture"
      subtitle="Technical reference for engineers building on or operating Mother Care School."
      nav={apiNav}
      variant="api"
    >
      <p>
        Mother Care School is a monorepo school ERP with a shared Express API, Next.js web portals,
        and a Flutter mobile app. This section documents authentication, endpoints, realtime chat,
        email/credential delivery, and deployment.
      </p>

      <h2>Tech stack</h2>
      <ul>
        <li><strong>Web</strong> — Next.js 16 (App Router), React 19, Tailwind CSS</li>
        <li><strong>API</strong> — Node.js, Express, TypeScript</li>
        <li><strong>Database</strong> — PostgreSQL via Prisma ORM</li>
        <li><strong>Cache & queues</strong> — Upstash Redis (REST for JWT blacklist), Redis TCP + BullMQ (message & chat workers)</li>
        <li><strong>Realtime</strong> — Socket.IO with optional Redis adapter for horizontal scale</li>
        <li><strong>Mobile</strong> — Flutter (student, teacher, branch-admin chat & academics)</li>
        <li><strong>Email templates</strong> — HTML templates in <code>backend/src/emails/</code>; Resend env vars reserved for future outbound email</li>
        <li><strong>Credentials</strong> — Meta WhatsApp Cloud API for login credential delivery</li>
        <li><strong>Storage</strong> — Cloudflare R2 (production) or local <code>uploads/</code> (dev fallback)</li>
        <li><strong>Observability</strong> — Sentry (<code>SENTRY_DSN</code>), structured request logging in development</li>
      </ul>

      <h2>Repository layout</h2>
      <ul>
        <li><code>backend/</code> — Express API, Prisma schema, Socket.IO, BullMQ workers</li>
        <li><code>web/</code> — CEO, admin, and teacher web portals + this documentation site</li>
        <li><code>mobile/</code> — Flutter app for students, teachers, and mobile chat</li>
      </ul>

      <h2>Base URL</h2>
      <p>
        Default local API: <code>http://localhost:5000</code>. The web app reads{' '}
        <code>NEXT_PUBLIC_API_URL</code> from <code>web/.env.local</code>.
      </p>

      <h2>Documentation map</h2>
      <ul>
        <li><Link href="/docs/api/get-started">Get Started</Link> — clone, env, migrate, seed, run all surfaces</li>
        <li><Link href="/docs/api/architecture">Architecture</Link> — monorepo surfaces, auth flow, branch/AY scoping</li>
        <li><Link href="/docs/api/authentication">Authentication</Link> — JWT, roles, cookies, API keys</li>
        <li><Link href="/docs/api/email">Email & credentials</Link> — invitation templates, WhatsApp credential sends</li>
        <li><Link href="/docs/api/endpoints">REST Endpoints</Link> — grouped route reference</li>
        <li><Link href="/docs/api/chat">Chat & Realtime</Link> — Socket.IO events, rooms, mobile-only decisions</li>
        <li><Link href="/docs/api/deployment">Deployment</Link> — production checklist</li>
      </ul>

      <DocCallout variant="info" title="Authenticated docs">
        These pages require a signed-in portal session. They are marked <code>noindex</code> for search engines.
      </DocCallout>

      <h2>User-facing guide</h2>
      <p>
        Non-technical staff should read the <Link href="/docs/intro">User Guide</Link> instead.
      </p>
    </DocsShell>
  );
}
