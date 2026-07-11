import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep, DocFaq } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function CeoApiKeysPage() {
  return (
    <DocsShell
      title="API Keys"
      subtitle="Create and revoke keys for mobile apps and third-party integrations."
      nav={introNav}
      variant="intro"
    >
      <h2>Overview</h2>
      <p>
        The <strong>API Keys</strong> page at <code>/ceo/keys</code> lets you create and revoke
        authentication keys for trusted applications — mobile apps, integrations, and server-side
        services. Keys grant programmatic access to your school&apos;s data; treat them like passwords.
      </p>
      <p>
        <strong>Why it exists:</strong> the student and teacher mobile apps, plus any custom
        integrations your technical team builds, need a secure way to call the MCS API. Keys are
        scoped (global or single-branch) and typed (publishable vs secret) so you can follow least-privilege
        practices.
      </p>
      <p>
        <strong>Who uses it:</strong> <code>super_admin</code> only. Branch admins cannot create or
        revoke API keys. The dashboard&apos;s <strong>Active API Keys</strong> count reflects non-revoked
        keys shown here.
      </p>

      <h2>Before you start</h2>
      <ul>
        <li>
          <strong>Role:</strong> signed in as <code>super_admin</code> at <code>/ceo</code>.
        </li>
        <li>
          <strong>Know your integration type:</strong> mobile apps typically use{' '}
          <strong>Publishable</strong> keys; backend servers use <strong>Secret</strong> keys. Never
          embed secret keys in client apps.
        </li>
        <li>
          <strong>Choose scope:</strong> <strong>Global</strong> keys work across all branches;
          <strong>Branch</strong> keys are limited to one campus (prefix includes branch code, for
          example <code>pk_mcs_MCS-SOHAN_…</code>).
        </li>
        <li>
          <strong>Save immediately:</strong> the full key value is shown <em>once</em> after creation.
          Copy it to a password manager before closing the reveal dialog.
        </li>
        <li>
          <strong>Branches for scope:</strong> branch-scoped keys require at least one branch in the
          dropdown loaded from <code>api.getBranches()</code>.
        </li>
      </ul>

      <h2>Key types and scope</h2>
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>UI label</th>
            <th>Use for</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>publishable</td>
            <td><strong>Publishable</strong> — Client-side use</td>
            <td>Mobile apps, public frontends. Prefix <code>pk_mcs_…</code></td>
          </tr>
          <tr>
            <td>secret</td>
            <td><strong>Secret</strong> — Server-side use</td>
            <td>Backend servers only. Prefix <code>sk_mcs_…</code>. Never in mobile binaries.</td>
          </tr>
        </tbody>
      </table>
      <table>
        <thead>
          <tr>
            <th>Scope</th>
            <th>UI label</th>
            <th>Behavior</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>global</td>
            <td><strong>Global</strong> — All branches</td>
            <td>Prefix segment after <code>mcs</code> is <code>global</code>. Organization-wide access.</td>
          </tr>
          <tr>
            <td>branch</td>
            <td><strong>Branch</strong> — Single branch</td>
            <td>Pick campus from <strong>Select Branch</strong>. Prefix includes branch code.</td>
          </tr>
        </tbody>
      </table>

      <h2>Step-by-step: create a key</h2>
      <DocSteps>
        <DocStep title="Open API Keys">
          From the CEO sidebar choose <strong>API Keys</strong>, use dashboard{' '}
          <strong>API Key Manager</strong> quick action, or go to <code>/ceo/keys</code>. Subtitle:{' '}
          <em>Manage publishable and secret API keys for integrations.</em>
        </DocStep>
        <DocStep title="Click Create Key">
          Top-right button opens the <strong>Create API Key</strong> modal.
        </DocStep>
        <DocStep title="Enter Key Name">
          Field <strong>Key Name *</strong> — use a clear label (placeholder:{' '}
          <code>e.g. Production Frontend</code>). Required; empty shows <em>Key name is required</em>.
        </DocStep>
        <DocStep title="Choose Key Type">
          Under <strong>Key Type *</strong>, select <strong>Publishable</strong> (eye icon, client-side)
          or <strong>Secret</strong> (eye-off icon, server-side).
        </DocStep>
        <DocStep title="Choose Scope">
          Under <strong>Scope *</strong>, select <strong>Global</strong> (globe icon) or{' '}
          <strong>Branch</strong> (map-pin icon). For branch scope, a <strong>Select Branch *</strong>{' '}
          dropdown appears — pick <code>Name (CODE)</code>.
        </DocStep>
        <DocStep title="Create Key">
          Click <strong>Create Key</strong> (<strong>Creating…</strong> while working). Modal closes;
          toast <em>API key created</em>; list refreshes.
        </DocStep>
        <DocStep title="Copy the revealed key">
          <strong>API Key Created</strong> dialog shows the full key once. Warning:{' '}
          <em>It will not be shown again.</em> Copy via the copy icon, then click{' '}
          <strong>I&apos;ve saved the key</strong> to dismiss.
        </DocStep>
      </DocSteps>

      <h2>Step-by-step: revoke a key</h2>
      <DocSteps>
        <DocStep title="Find the active key">
          Active keys appear in the main list with name, masked prefix, type badge, scope badge, and
          dates.
        </DocStep>
        <DocStep title="Click revoke">
          Click the trash icon on the key row (title: <em>Revoke key</em>).
        </DocStep>
        <DocStep title="Confirm revocation">
          Dialog title: <strong>Revoke API Key?</strong> Message includes key name and prefix. Click{' '}
          <strong>Revoke Key</strong>. Action is permanent.
        </DocStep>
        <DocStep title="Audit revoked keys">
          Revoked keys move to collapsed <strong>Revoked keys (N)</strong> section at the bottom.
          Names appear struck through with <em>Revoked</em> label.
        </DocStep>
      </DocSteps>

      <h2>Field reference — active key row</h2>
      <table>
        <thead>
          <tr>
            <th>Element</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Name</td>
            <td>Label you assigned at creation.</td>
          </tr>
          <tr>
            <td>Prefix (monospace)</td>
            <td>Masked key prefix with ellipsis — full value never shown again.</td>
          </tr>
          <tr>
            <td>publishable / secret badge</td>
            <td>Blue = publishable; amber = secret.</td>
          </tr>
          <tr>
            <td>Global / branch name badge</td>
            <td>Purple globe = global; green map-pin = branch-scoped with campus name.</td>
          </tr>
          <tr>
            <td>Created date</td>
            <td>Localized creation timestamp.</td>
          </tr>
          <tr>
            <td>Last used date</td>
            <td>Shown when API has recorded usage; omitted if never used.</td>
          </tr>
          <tr>
            <td>Trash icon</td>
            <td>Opens revoke confirmation dialog.</td>
          </tr>
        </tbody>
      </table>

      <h2>What happens when</h2>
      <table>
        <thead>
          <tr>
            <th>Event</th>
            <th>Backend / UI behavior</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Key created</td>
            <td>
              Full key returned once in reveal modal. List stores prefix only. Dashboard{' '}
              <strong>Active API Keys</strong> count increments on next visit.
            </td>
          </tr>
          <tr>
            <td>Reveal dialog dismissed without copy</td>
            <td>Full key is lost forever. Revoke and create new key if needed.</td>
          </tr>
          <tr>
            <td>Key revoked</td>
            <td>
              <code>revokedAt</code> set. Integrations using that key get 401 immediately. Key moves to
              revoked section.
            </td>
          </tr>
          <tr>
            <td>Integration calls API</td>
            <td>
              Valid key passes authentication middleware. <code>lastUsedAt</code> may update on list.
            </td>
          </tr>
          <tr>
            <td>Empty list</td>
            <td>
              Shows <strong>No API keys yet.</strong> with <strong>Create your first API key</strong>{' '}
              link.
            </td>
          </tr>
          <tr>
            <td>Load failure</td>
            <td>Banner: <em>Failed to load API keys</em>.</td>
          </tr>
        </tbody>
      </table>

      <h2>Permissions</h2>
      <p>
        <strong>Create keys:</strong> <code>super_admin</code> only. Route <code>/ceo/keys</code> is
        protected by CEO layout role guard.
      </p>
      <p>
        <strong>Revoke keys:</strong> CEO only. Revocation is immediate and irreversible.
      </p>
      <p>
        <strong>View full key after creation:</strong> one-time only for anyone with CEO access at
        creation moment. Subsequent views show prefix only.
      </p>
      <p>
        <strong>Branch admins:</strong> no API key management. They cannot see this page or bypass CEO
        controls.
      </p>

      <DocCallout variant="warn" title="One-time display">
        If you lose a secret or publishable key, revoke it and create a new one. The system never shows
        the full key a second time — only the prefix remains in the list.
      </DocCallout>

      <DocCallout variant="info" title="Technical reference">
        Engineers integrating with your API should read the{' '}
        <Link href="/docs/api/authentication">Authentication</Link> and{' '}
        <Link href="/docs/api/endpoints">REST Endpoints</Link> docs for headers, base URLs, and request
        formats.
      </DocCallout>

      <h2>Common issues &amp; fixes</h2>
      <table>
        <thead>
          <tr>
            <th>Symptom</th>
            <th>Cause</th>
            <th>Fix</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Lost key after creation</td>
            <td>Closed reveal dialog without saving</td>
            <td>Revoke the key (if identifiable by prefix) and create a new one. Copy immediately.</td>
          </tr>
          <tr>
            <td>Mobile app stopped working</td>
            <td>Key revoked or wrong scope</td>
            <td>Issue new publishable key with correct scope. Update app config. Redeploy if needed.</td>
          </tr>
          <tr>
            <td>&quot;Please select a branch&quot;</td>
            <td>Branch scope without campus</td>
            <td>Pick a branch from dropdown or switch to Global scope.</td>
          </tr>
          <tr>
            <td>Higher Active API Keys than expected</td>
            <td>Old keys not revoked</td>
            <td>Audit list; revoke unused keys. Check revoked section for history.</td>
          </tr>
          <tr>
            <td>Cannot open page — sent to /admin</td>
            <td>Not super_admin</td>
            <td>Only CEO accounts manage API keys.</td>
          </tr>
          <tr>
            <td>Secret key in mobile app</td>
            <td>Wrong key type chosen</td>
            <td>Revoke secret key immediately. Create publishable key for client apps.</td>
          </tr>
        </tbody>
      </table>

      <DocFaq
        items={[
          {
            q: 'What is the difference between publishable and secret keys?',
            a: 'Publishable keys (pk_mcs_…) are intended for client-side apps like the mobile app. Secret keys (sk_mcs_…) are for server-side use only and must never be embedded in apps users install.',
          },
          {
            q: 'Can I see the full key again later?',
            a: 'No. Only the prefix is stored in the list after you dismiss the API Key Created dialog. Revoke and recreate if lost.',
          },
          {
            q: 'Should I use Global or Branch scope?',
            a: 'Use Global for organization-wide tools (single mobile app serving all campuses). Use Branch when an integration should only access one campus — for example a branch-specific kiosk.',
          },
        ]}
      />

      <h2>Related guides</h2>
      <ul>
        <li>
          <Link href="/docs/intro/ceo/dashboard">CEO Dashboard</Link> — Active API Keys summary card
        </li>
        <li>
          <Link href="/docs/intro/ceo/permissions">CEO Permissions</Link> — who can manage keys
        </li>
        <li>
          <Link href="/docs/api/authentication">API Authentication</Link> — how keys are used in requests
        </li>
        <li>
          <Link href="/docs/intro/student/mobile-app">Student Mobile App</Link> — consumer of publishable keys
        </li>
        <li>
          <Link href="/docs/intro/ceo">CEO Portal overview</Link>
        </li>
      </ul>
    </DocsShell>
  );
}
