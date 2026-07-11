import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function CeoApiKeysPage() {
  return (
    <DocsShell
      title="API Keys"
      subtitle="Create and revoke keys for mobile apps and third-party integrations."
      nav={introNav}
      variant="intro"
    >
      <p>
        API keys let trusted applications talk to your school data securely. Only the CEO (
        <strong>super_admin</strong>) can create or revoke keys. Store secret keys safely — they
        grant access to your organization.
      </p>

      <h2>Key types</h2>
      <ul>
        <li>
          <strong>Publishable</strong> — safe for client-side use (mobile apps, public frontends).
          Limited exposure; still treat as sensitive.
        </li>
        <li>
          <strong>Secret</strong> — for server-side use only. Never embed in mobile apps or public
          websites.
        </li>
      </ul>

      <h2>Scope</h2>
      <ul>
        <li>
          <strong>Global</strong> — access across all branches in your organization.
        </li>
        <li>
          <strong>Branch</strong> — limited to one campus. Pick the branch when creating the key.
          The key prefix includes the branch code (for example <code>pk_mcs_MCS-SOHAN_…</code>).
        </li>
      </ul>

      <h2>Create a key — step-by-step</h2>
      <DocSteps>
        <DocStep title="Open API Keys">
          From the CEO sidebar or dashboard, go to <strong>API Keys</strong>.
        </DocStep>
        <DocStep title="Click Create Key">
          The creation dialog opens.
        </DocStep>
        <DocStep title="Name the key">
          Use a clear label (for example &quot;Production Mobile App&quot; or &quot;Sohan Branch
          Integration&quot;).
        </DocStep>
        <DocStep title="Choose type">
          Select <strong>Publishable</strong> for apps users install, or <strong>Secret</strong> for
          your backend servers.
        </DocStep>
        <DocStep title="Choose scope">
          <strong>Global</strong> for organization-wide tools, or <strong>Branch</strong> and pick
          the campus from the dropdown.
        </DocStep>
        <DocStep title="Create and copy immediately">
          After creation, the <em>full key is shown once</em>. Copy it to a password manager or
          secure config file. You cannot view the full value again — only the prefix remains in the
          list.
        </DocStep>
        <DocStep title="Confirm saved">
          Click <strong>I&apos;ve saved the key</strong> to close the reveal dialog.
        </DocStep>
      </DocSteps>

      <DocCallout variant="warn" title="One-time display">
        If you lose a secret key, revoke it and create a new one. The system never shows the full
        key a second time.
      </DocCallout>

      <h2>Managing existing keys</h2>
      <p>Each active key in the list shows:</p>
      <ul>
        <li>Name and masked prefix</li>
        <li>Type (publishable or secret)</li>
        <li>Scope (global or branch name)</li>
        <li>Created date and last used date (if available)</li>
      </ul>

      <h2>Revoke a key</h2>
      <ol>
        <li>Click the revoke (trash) icon on the key row.</li>
        <li>Confirm in the dialog — revocation is permanent.</li>
        <li>Revoked keys move to a collapsed <strong>Revoked keys</strong> section for audit.</li>
      </ol>
      <p>Any integration using that key stops working immediately. Issue a new key and update your app config.</p>

      <DocCallout variant="info" title="Technical reference">
        Engineers integrating with your API should read the{' '}
        <Link href="/docs/api/authentication">Authentication</Link> and{' '}
        <Link href="/docs/api/endpoints">REST Endpoints</Link> docs for headers, base URLs, and
        request formats.
      </DocCallout>
    </DocsShell>
  );
}
