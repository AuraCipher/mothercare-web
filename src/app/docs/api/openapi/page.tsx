import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocCodeBlock, DocSection, DocSteps, DocStep, DocTable } from '@/components/docs/doc-blocks';
import { apiNav } from '@/lib/docs/navigation';

export default function ApiOpenApiPage() {
  return (
    <DocsShell
      title="OpenAPI Specification"
      subtitle="Machine-readable API catalog — 296 paths, 384 operations generated from Express route files."
      nav={apiNav}
      variant="api"
    >
      <p>
        The MCS REST API is documented in prose at{' '}
        <Link href="/docs/api/endpoints">REST Endpoints</Link> and as a formal{' '}
        <strong>OpenAPI 3.1</strong> file for tooling, client generation, and contract testing.
      </p>

      <h2>File location</h2>
      <DocTable
        headers={['File', 'Purpose']}
        rows={[
          [<code>backend/openapi.yaml</code>, 'Generated OpenAPI 3.1 specification (source of truth for tooling)'],
          [<code>backend/scripts/generate-openapi.ts</code>, 'Generator — scans <code>*.routes.ts</code> files'],
          [<code>npm run openapi:generate</code>, 'Regenerate after adding or changing routes'],
        ]}
      />

      <DocCallout variant="info" title="Not served at runtime">
        The YAML file lives in the repository; the API does not expose <code>/openapi.json</code> by default.
        Import the file into Swagger UI, Postman, or Insomnia, or use it in CI for contract tests.
      </DocCallout>

      <h2>What is included</h2>
      <ul>
        <li>All mounts from <code>backend/src/app.ts</code> — auth, admin ERP, teacher, student, staff, chat, uploads</li>
        <li>Path parameters normalized to OpenAPI style (<code>{'{id}'}</code> not <code>:id</code>)</li>
        <li>Tags per portal/module (Admin ERP, Teacher Portal, Chat, etc.)</li>
        <li>JWT <code>bearerAuth</code> security scheme on protected routes</li>
        <li>Shared <code>SuccessEnvelope</code> / <code>ErrorEnvelope</code> response schemas</li>
        <li><code>branchId</code> and <code>academicYearId</code> query parameters on admin paths</li>
      </ul>

      <h2>What is not included (yet)</h2>
      <ul>
        <li>Per-endpoint request/response body schemas (only login has a detailed body schema today)</li>
        <li>Socket.IO events — realtime chat uses WebSockets, not REST</li>
        <li>Webhook callbacks — none exposed</li>
      </ul>
      <p>
        Extend <code>generate-openapi.ts</code> to attach schemas from Zod validators when you need full
        contract testing.
      </p>

      <DocSection title="Regenerate after route changes">
        <DocSteps>
          <DocStep title="Edit Express routes">
            Add or change routes in <code>backend/src/modules/**/routes/*.ts</code>. If you add a new router
            file, register its mount prefix in <code>MOUNT_BY_FILE</code> inside{' '}
            <code>scripts/generate-openapi.ts</code>.
          </DocStep>
          <DocStep title="Run the generator">
            <DocCodeBlock>{`cd backend
npm run openapi:generate
# Wrote backend/openapi.yaml (384 operations, 296 paths)`}</DocCodeBlock>
          </DocStep>
          <DocStep title="Commit the updated YAML">
            Include <code>backend/openapi.yaml</code> in the same PR as route changes so diffs stay reviewable.
          </DocStep>
        </DocSteps>
      </DocSection>

      <DocSection title="View in Swagger UI">
        <DocSteps>
          <DocStep title="Online editor">
            Open <a href="https://editor.swagger.io">editor.swagger.io</a> → File → Import file → select{' '}
            <code>backend/openapi.yaml</code> from your clone.
          </DocStep>
          <DocStep title="Docker (local)">
            <DocCodeBlock>{`docker run -p 8080:8080 \\
  -e SWAGGER_JSON=/spec/openapi.yaml \\
  -v "$(pwd)/backend/openapi.yaml:/spec/openapi.yaml" \\
  swaggerapi/swagger-ui`}</DocCodeBlock>
            Then open <code>http://localhost:8080</code>.
          </DocStep>
          <DocStep title="Postman">
            Postman → Import → OpenAPI 3.1 → choose <code>backend/openapi.yaml</code> → set collection
            variable <code>baseUrl</code> to your API host.
          </DocStep>
        </DocSteps>
      </DocSection>

      <DocSection title="Generate a TypeScript client (optional)">
        <DocCodeBlock>{`npx openapi-typescript backend/openapi.yaml -o web/src/lib/api-schema.d.ts
# Or openapi-generator-cli for a full fetch client`}</DocCodeBlock>
        <p>
          Useful for third-party integrators or a future typed API layer. The web app currently uses hand-written
          calls in <code>web/src/lib/api.ts</code>.
        </p>
      </DocSection>

      <DocSection title="Contract testing (optional)">
        <DocCodeBlock>{`# Example with Schemathesis (install separately)
schemathesis run backend/openapi.yaml --base-url=http://localhost:5000 \\
  --header "Authorization: Bearer <token>"`}</DocCodeBlock>
        <p>
          Fuzzes paths from the spec against a running API. Best run against a seeded staging database, not
          production.
        </p>
      </DocSection>

      <h2>Tag index</h2>
      <DocTable
        headers={['Tag', 'Mount prefix', 'Auth']}
        rows={[
          ['Authentication', '/auth', 'Login public; rest JWT'],
          ['Setup', '/setup', 'Public (first-run only)'],
          ['API Keys', '/api-keys', 'super_admin'],
          ['CEO Invitations', '/admin/invitations', 'CEO JWT + public token routes'],
          ['Admin ERP', '/admin', 'management + branch scope + module RBAC'],
          ['Canteen', '/admin/canteen', 'Admin RBAC'],
          ['Results', '/admin/result', 'Admin RBAC'],
          ['Teacher Portal', '/teacher', 'teacher role'],
          ['Student Portal', '/student', 'student role'],
          ['Staff Portal', '/staff', 'branch_admin | management'],
          ['Chat', '/chat', 'JWT'],
          ['Current User', '/me', 'JWT'],
          ['Uploads', '/api', 'POST JWT; GET public'],
          ['System', '/, /health', 'Public'],
        ]}
      />

      <p>
        See also: <Link href="/docs/api/endpoints">REST Endpoints (prose)</Link> ·{' '}
        <Link href="/docs/api/authentication">Authentication</Link> ·{' '}
        <Link href="/docs/api/architecture">Architecture</Link>
      </p>
    </DocsShell>
  );
}
