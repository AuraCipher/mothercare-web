import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocTable } from '@/components/docs/doc-blocks';
import { apiNav } from '@/lib/docs/navigation';

const pre = 'overflow-x-auto rounded-lg border border-warm-card-border bg-warm-card p-4 text-xs leading-relaxed text-warm-cream';

export default function ApiAuthenticationPage() {
  return (
    <DocsShell
      title="Authentication"
      subtitle="JWT sessions, httpOnly cookies, API keys, role guards, login eligibility, and error responses."
      nav={apiNav}
      variant="api"
    >
      <h2>Auth endpoints</h2>
      <DocTable
        headers={['Method', 'Path', 'Auth', 'Description']}
        rows={[
          ['POST', '/auth/login', 'Public', 'Login with username, email, or phone + password'],
          ['POST', '/auth/refresh', 'JWT', 'Refresh session data for current user'],
          ['GET', '/auth/me', 'JWT', 'Current user profile + branchIds'],
          ['PUT', '/auth/password', 'JWT', 'Change password (Zod-validated)'],
          ['POST', '/auth/logout', 'JWT', 'Revoke token + clear httpOnly cookie'],
        ]}
      />

      <h2>POST /auth/login</h2>
      <h3>Request</h3>
      <pre className={pre}>
{`POST /auth/login
Content-Type: application/json

{
  "identifier": "admin",
  "password": "admin123",
  "rememberMe": false
}`}
      </pre>
      <DocTable
        headers={['Field', 'Type', 'Required', 'Notes']}
        rows={[
          [<code>identifier</code>, 'string', 'Yes', 'Username, email, or phone (case-insensitive for username/email)'],
          [<code>password</code>, 'string', 'Yes', 'Plain text — verified against bcrypt hash'],
          [<code>rememberMe</code>, 'boolean', 'No', 'Default false — issues 30-day rememberMeToken when true'],
        ]}
      />

      <h3>Success response (200)</h3>
      <pre className={pre}>
{`{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "rememberMeToken": null,
  "push": {
    "keyVersion": 1,
    "publicKey": "base64...",
    "algorithm": "AES-256-GCM"
  },
  "user": {
    "id": "uuid",
    "name": "Admin User",
    "username": "admin",
    "email": "admin@school.pk",
    "phone": "+923001234567",
    "role": "management",
    "status": "active"
  }
}`}
      </pre>
      <p>
        <code>push</code> is included only for <code>teacher</code> and <code>student</code> roles (mobile FCM
        decryption). Web also receives <code>Set-Cookie: token=…; HttpOnly; SameSite=Strict</code>.
      </p>

      <h3>Login failure responses</h3>
      <DocTable
        headers={['Status', 'message', 'Cause']}
        rows={[
          ['401', 'Invalid credentials', 'Unknown identifier or wrong password'],
          ['403', 'Account is not active', 'User.status !== active'],
          ['403', 'Student is not enrolled in any active academic year', 'No active enrollment'],
          ['403', 'Student login is disabled after graduation', 'GRADUATED or NO_LOGIN credential tag'],
          ['403', 'Teacher profile not found. Contact school administration.', 'Missing TeacherProfile'],
          ['403', 'No active teacher branch membership...', 'No active BranchMember with role teacher'],
          ['422', 'Validation failed', 'Missing identifier/password — errors[] per field'],
        ]}
      />

      <h2>JWT specification</h2>
      <DocTable
        headers={['Property', 'Value']}
        rows={[
          ['Algorithm', 'HS256 (via jsonwebtoken)'],
          ['Secret', 'JWT_SECRET env (min 32 chars)'],
          ['Expiry', 'JWT_EXPIRY env (default 7d)'],
          ['Issuer', 'school-erp'],
          ['Audience', 'school-erp-clients'],
        ]}
      />

      <h3>Payload claims</h3>
      <pre className={pre}>
{`{
  "id": "user-uuid",
  "role": "management",
  "name": "Admin User",
  "schoolId": "optional-school-uuid",
  "branchIds": ["branch-uuid-1", "branch-uuid-2"],
  "iat": 1720000000,
  "exp": 1720604800,
  "iss": "school-erp",
  "aud": "school-erp-clients"
}`}
      </pre>
      <p>
        <code>branchIds</code> is populated from active <code>BranchMember</code> rows at login time. Scope
        middleware checks this array on every branch-scoped request.
      </p>

      <h2>How clients authenticate</h2>
      <p>File: <code>backend/src/middleware/auth/auth.middleware.ts</code></p>
      <p>Resolution order:</p>
      <ol>
        <li><code>Authorization: Bearer &lt;jwt&gt;</code></li>
        <li><code>token</code> httpOnly cookie (set by web login)</li>
        <li><code>x-publishable-api-key</code> or <code>x-api-key</code> header</li>
      </ol>

      <h3>Auth failure responses (401)</h3>
      <DocTable
        headers={['message', 'Cause']}
        rows={[
          ['Authentication required', 'No Bearer, cookie, or API key'],
          ['Token expired', 'JWT past exp claim'],
          ['Token has been revoked', 'Token in Upstash blacklist after logout'],
          ['Invalid or revoked API key', 'Key not found, wrong branch scope, or revoked'],
        ]}
      />

      <h2>httpOnly cookies (web)</h2>
      <p>
        <code>POST /auth/login</code> sets cookie <code>token</code> with: <code>httpOnly: true</code>,{' '}
        <code>secure: true</code> when <code>NODE_ENV=production</code>, <code>sameSite: strict</code>,{' '}
        <code>maxAge: 7 days</code>, <code>path: /</code>.
      </p>
      <p>
        Web clients must send <code>credentials: &apos;include&apos;</code> on fetch so the cookie is attached.
        XSS cannot read the JWT from JavaScript.
      </p>
      <p>
        <code>POST /auth/logout</code> calls <code>res.clearCookie(&apos;token&apos;)</code> and blacklists the
        active token.
      </p>

      <h2>Token blacklist</h2>
      <p>
        Revoked tokens stored in Upstash Redis (<code>UPSTASH_REDIS_REST_URL</code>) with TTL until JWT expiry.
        In-memory set provides fast path. If Redis is unreachable during blacklist <em>check</em>, middleware
        fails closed — rejects the token.
      </p>
      <pre className={pre}>
{`POST /auth/logout
Authorization: Bearer <token>
# or cookie: token=<token>

Response 200:
{ "success": true, "message": "Logged out successfully" }`}
      </pre>

      <h2>PUT /auth/password</h2>
      <pre className={pre}>
{`PUT /auth/password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "oldPass123",
  "newPassword": "NewPass456",
  "confirmPassword": "NewPass456"
}`}
      </pre>
      <DocTable
        headers={['Validation rule', 'Error']}
        rows={[
          ['newPassword min 8 chars', 'Must contain an uppercase letter'],
          ['newPassword', 'Must contain a number'],
          ['confirmPassword', 'Passwords do not match'],
          ['currentPassword wrong', '401 or 400 Current password is incorrect'],
        ]}
      />

      <h2>GET /auth/me</h2>
      <pre className={pre}>
{`GET /auth/me
Authorization: Bearer <token>

{
  "success": true,
  "user": {
    "id": "uuid",
    "name": "...",
    "role": "management",
    "branchIds": ["..."],
    "managementPerms": { ... },
    "lastLoginAt": "2026-07-11T...",
    ...
  }
}`}
      </pre>

      <h2>Roles &amp; route guards</h2>
      <h3>Global roles (User.role)</h3>
      <DocTable
        headers={['Role', 'Route prefixes']}
        rows={[
          [<code>super_admin</code>, '/api-keys, /admin/invitations (write), all /admin ERP'],
          [<code>management</code>, '/admin/* with staffPermissionMiddleware module checks'],
          [<code>teacher</code>, '/teacher/*'],
          [<code>student</code>, '/student/*'],
          [<code>parent</code>, 'Legacy schema type'],
        ]}
      />

      <h3>Branch roles (BranchMember.role)</h3>
      <p>
        <code>branch_admin</code> and <code>sub_admin</code> are not <code>User.role</code> values. They gate{' '}
        <code>/branches/:branchId/*</code> and <code>/staff/*</code> mobile routes.
      </p>

      <h3>Middleware chains</h3>
      <pre className={pre}>
{`/admin/*
  → auth
  → roleMiddleware(['super_admin', 'management'])
  → branchScopeMiddleware
  → staffPermissionMiddleware

/teacher/*
  → auth → teacher role → active/scope/portal guards

/student/*
  → auth → student role → scope guards

/api-keys/*
  → auth → roleMiddleware(['super_admin'])

/chat/*
  → auth (JWT only — API keys not accepted for chat REST)`}
      </pre>

      <h3>Role guard failure (403)</h3>
      <pre className={pre}>
{`{
  "success": false,
  "message": "Access denied. Allowed roles: super_admin, management"
}`}
      </pre>

      <h2>API keys</h2>
      <p>
        CEO manages keys at <code>/api-keys</code> (<code>super_admin</code> only). Types:{' '}
        <code>publishable</code> (browser-safe) and <code>secret</code> (server-to-server).
      </p>
      <DocTable
        headers={['Header', 'Key type', 'Use case']}
        rows={[
          [<code>x-publishable-api-key</code>, 'publishable', 'Next.js web layout — pre-login portal shell'],
          [<code>x-api-key</code>, 'secret', 'Machine-to-machine admin automation'],
        ]}
      />
      <p>
        Valid keys authenticate as synthetic user <code>{`{ role: 'super_admin', name: 'API Key' }`}</code>.
        Branch-scoped keys must match <code>branchId</code> in the request path/query.
      </p>
      <pre className={pre}>
{`POST /api-keys
Authorization: Bearer <ceo-token>
Content-Type: application/json

{
  "name": "Web Portal Key",
  "type": "publishable",
  "branchId": null
}`}
      </pre>

      <h2>Socket.IO authentication</h2>
      <p>
        Chat sockets accept JWT via <code>handshake.auth.token</code> or{' '}
        <code>Authorization: Bearer</code> header. No API key auth on WebSocket. Unauthenticated connections
        receive <code>Unauthorized</code> and are rejected.
      </p>

      <h2>Mobile push crypto</h2>
      <p>
        On login, teacher/student roles receive <code>push</code> material from{' '}
        <code>issuePushCryptoMaterial()</code>. Derived from <code>PUSH_MASTER_SECRET</code> or{' '}
        <code>JWT_SECRET</code> fallback. Used to decrypt FCM payloads client-side.
      </p>

      <DocCallout variant="info" title="No public registration">
        There is no self-service signup. Accounts are created by admin ERP, CEO invitation, or database seed.
      </DocCallout>

      <p>
        Next: <Link href="/docs/api/email">Email &amp; credentials</Link>
      </p>
    </DocsShell>
  );
}
