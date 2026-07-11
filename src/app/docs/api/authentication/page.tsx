import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocTable } from '@/components/docs/doc-blocks';
import { apiNav } from '@/lib/docs/navigation';

export default function ApiAuthenticationPage() {
  return (
    <DocsShell
      title="Authentication"
      subtitle="JWT sessions, role guards, httpOnly cookies, and API key auth."
      nav={apiNav}
      variant="api"
    >
      <h2>Auth endpoints</h2>
      <DocTable
        headers={['Method', 'Path', 'Auth', 'Description']}
        rows={[
          ['POST', '/auth/login', 'Public', 'Login with username, email, or phone + password'],
          ['POST', '/auth/refresh', 'JWT', 'Refresh session data'],
          ['GET', '/auth/me', 'JWT', 'Current user profile'],
          ['PUT', '/auth/password', 'JWT', 'Change password'],
          ['POST', '/auth/logout', 'JWT', 'Revoke token + clear cookie'],
        ]}
      />

      <h2>JWT</h2>
      <p>
        Tokens are signed with <code>JWT_SECRET</code>, default expiry <code>JWT_EXPIRY=7d</code>, issuer{' '}
        <code>school-erp</code>, audience <code>school-erp-clients</code>.
      </p>
      <p>Payload fields:</p>
      <ul>
        <li><code>id</code> — user UUID</li>
        <li><code>role</code> — <code>super_admin</code> | <code>management</code> | <code>teacher</code> | <code>student</code> | <code>parent</code></li>
        <li><code>name</code></li>
        <li><code>branchIds</code> — array of branch UUIDs from active memberships</li>
        <li><code>schoolId</code> — optional</li>
      </ul>

      <h2>How clients authenticate</h2>
      <p>The auth middleware tries, in order:</p>
      <ol>
        <li><code>Authorization: Bearer &lt;jwt&gt;</code></li>
        <li><code>token</code> httpOnly cookie (set by web login)</li>
        <li><code>x-publishable-api-key</code> or <code>x-api-key</code> header</li>
      </ol>

      <h2>httpOnly cookies (web)</h2>
      <p>
        <code>POST /auth/login</code> sets <code>token</code> as an httpOnly cookie (7-day max-age, <code>SameSite=strict</code>,
        <code>secure</code> in production). This prevents XSS from reading the JWT while still allowing same-origin
        API calls with <code>credentials: true</code>.
      </p>
      <p>
        The docs layout also mirrors <code>localStorage.token</code> into a non-httpOnly cookie for Next.js doc
        routes — portal pages should rely on the httpOnly cookie from login.
      </p>
      <p><code>POST /auth/logout</code> clears the cookie and blacklists the JWT.</p>

      <h2>Token blacklist</h2>
      <p>
        Revoked tokens are stored in Upstash Redis (<code>UPSTASH_REDIS_REST_URL</code>) with TTL until expiry.
        An in-memory set provides a fast path. If Redis is unavailable at check time, the middleware fails closed
        (rejects the token).
      </p>

      <h2>Roles & route guards</h2>

      <h3>Global roles (<code>User.role</code>)</h3>
      <DocTable
        headers={['Role', 'Typical access']}
        rows={[
          [<code>super_admin</code>, 'CEO portal, /api-keys, /admin/invitations, all /admin ERP routes'],
          [<code>management</code>, '/admin ERP with staffPermissionMiddleware module checks'],
          [<code>teacher</code>, '/teacher/* portal routes'],
          [<code>student</code>, '/student/* portal routes'],
          [<code>parent</code>, 'Parent account type in schema (legacy)'],
        ]}
      />

      <h3>Branch roles (<code>BranchMember.role</code>)</h3>
      <p>
        <code>branch_admin</code> and <code>sub_admin</code> are branch-level roles, not <code>User.role</code> values.
        Branch admins are created via CEO invitation and have <code>branch_admin</code> on their{' '}
        <code>BranchMember</code> record. They use <code>/branches/:branchId/*</code> routes and the mobile staff app.
      </p>

      <h3>Middleware chain examples</h3>
      <ul>
        <li><code>/admin/*</code> — <code>auth</code> → <code>roleMiddleware(['super_admin','management'])</code> → <code>branchScopeMiddleware</code> → <code>staffPermissionMiddleware</code></li>
        <li><code>/teacher/*</code> — <code>auth</code> → teacher role/active/scope/portal guards</li>
        <li><code>/student/*</code> — <code>auth</code> → student role/active/scope guards</li>
        <li><code>/api-keys/*</code> — <code>auth</code> → <code>super_admin</code> only</li>
      </ul>

      <h2>Login eligibility rules</h2>
      <ul>
        <li><strong>Students</strong> — must have an active enrollment in an ACTIVE academic year; blocked if <code>NO_LOGIN</code> or graduated</li>
        <li><strong>Teachers</strong> — must have a <code>TeacherProfile</code> and active <code>BranchMember</code> with role teacher</li>
        <li><strong>Inactive accounts</strong> — <code>status !== 'active'</code> returns 403</li>
      </ul>

      <h2>API keys</h2>
      <p>
        CEO creates keys at <code>/api-keys</code> (super_admin only). Keys can be global or branch-scoped.
        Valid keys authenticate as <code>super_admin</code> for machine-to-machine access. Publishable keys
        (<code>x-publishable-api-key</code>) are safe for browser use; secret keys use <code>x-api-key</code>.
      </p>

      <h2>Mobile push crypto</h2>
      <p>
        On login, teacher/student roles receive <code>push</code> crypto material for encrypted FCM payloads
        (<code>PUSH_MASTER_SECRET</code> or <code>JWT_SECRET</code> fallback).
      </p>

      <DocCallout variant="info" title="No public registration">
        There is no self-service signup. Accounts are created by admin, CEO invitation, or database seed.
      </DocCallout>

      <p>
        Next: <Link href="/docs/api/email">Email & credentials</Link>
      </p>
    </DocsShell>
  );
}
