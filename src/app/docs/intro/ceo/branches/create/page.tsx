import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function CeoCreateBranchPage() {
  return (
    <DocsShell
      title="Create a Branch"
      subtitle="Add a new school campus to your organization."
      nav={introNav}
      variant="intro"
    >
      <h2>Overview</h2>
      <p>
        Creating a branch registers a new campus in Mother Care School&apos;s multi-tenant structure.
        Each branch becomes a container for academic years, classes, students, teachers, fees, and one
        or more branch administrators. You reach the create flow from the{' '}
        <Link href="/docs/intro/ceo/branches">Branches</Link> page by clicking{' '}
        <strong>Add Branch</strong>, which opens the <strong>Add Branch</strong> modal dialog.
      </p>
      <p>
        <strong>Why create branches:</strong> open a new physical location, separate primary and
        secondary campuses, or isolate a franchise unit under the same organization owner. Without a
        branch record, you cannot assign an admin, enroll students, or scope API keys to that campus.
      </p>
      <p>
        <strong>Who performs this:</strong> <code>super_admin</code> (CEO) only. Branch admins cannot
        create sibling branches or modify organization structure.
      </p>

      <h2>Before you start</h2>
      <ul>
        <li>
          <strong>Unique branch code</strong> — decide the code before clicking Create. It is stored
          uppercase (e.g. <code>MCS-SOHAN</code>) and cannot be edited later. It appears in API key
          prefixes and internal references.
        </li>
        <li>
          <strong>Display name</strong> — the human-readable name staff and parents will see (e.g.
          &quot;Mother Care Sohan&quot;).
        </li>
        <li>
          <strong>Admin invitation plan</strong> — the branch is non-operational until a branch admin
          registers via your invitation link.
        </li>
        <li>
          <strong>CEO session</strong> — signed in at <code>/ceo/branches</code> with super_admin role.
        </li>
      </ul>

      <h2>Step-by-step</h2>
      <DocSteps>
        <DocStep title="Navigate to Branches">
          Open the CEO portal menu and select <strong>Branches</strong>, or use dashboard{' '}
          <strong>Manage Branches</strong>.
        </DocStep>
        <DocStep title="Click Add Branch">
          Top-right button labeled <strong>Add Branch</strong> with a plus icon. A modal overlay opens
          titled <strong>Add Branch</strong> with an X close button.
        </DocStep>
        <DocStep title="Enter Branch Name (required)">
          Field label: <strong>Branch Name *</strong>. Placeholder:{' '}
          <em>e.g. Mother Care Sohan</em>. Enter the official campus name. Trimmed on submit; empty
          names are rejected.
        </DocStep>
        <DocStep title="Enter Branch Code (required)">
          Field label: <strong>Branch Code *</strong>. Placeholder: <em>e.g. MCS-SOHAN</em>. Input
          displays uppercase. Stored as <code>createCode.trim().toUpperCase()</code>. Must be unique
          organization-wide.
        </DocStep>
        <DocStep title="Enter Address (optional)">
          Field label: <strong>Address</strong>. Placeholder: <em>e.g. Sohan, Islamabad</em>. Helps
          identify the campus in lists and branch details.
        </DocStep>
        <DocStep title="Enter Phone and Email (optional)">
          <strong>Phone</strong> placeholder: <em>e.g. +92 300 1234567</em>.{' '}
          <strong>Email</strong> placeholder: <em>e.g. sohan@mothercare.edu</em>. Contact metadata only
          — not used for CEO invitation delivery.
        </DocStep>
        <DocStep title="Click Create Branch">
          Primary button at bottom right. While processing, label changes to <strong>Creating…</strong>{' '}
          and button is disabled. On success: modal closes, toast{' '}
          <em>Branch created successfully</em>, list refreshes.
        </DocStep>
        <DocStep title="Cancel if needed">
          <strong>Cancel</strong> or click outside modal / X — discards unsaved input and closes dialog.
        </DocStep>
        <DocStep title="Invite a branch admin">
          Immediately go to <strong>Admins</strong> → <strong>Invite New Admin</strong>, select the new
          branch in <strong>Assign Branch</strong>, generate and copy the 7-day registration link.
        </DocStep>
      </DocSteps>

      <h2>Field reference</h2>
      <table>
        <thead>
          <tr>
            <th>Field</th>
            <th>Required</th>
            <th>Validation</th>
            <th>Stored as</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Branch Name</td>
            <td>Yes</td>
            <td>Non-empty after trim</td>
            <td><code>name</code></td>
            <td>Shown in all portals and docs.</td>
          </tr>
          <tr>
            <td>Branch Code</td>
            <td>Yes</td>
            <td>Non-empty; unique; uppercased</td>
            <td><code>code</code></td>
            <td>Immutable. Used in <code>pk_mcs_{'{CODE}'}_…</code> API keys.</td>
          </tr>
          <tr>
            <td>Address</td>
            <td>No</td>
            <td>Trimmed; omitted if empty</td>
            <td><code>address</code></td>
            <td>Free text location.</td>
          </tr>
          <tr>
            <td>Phone</td>
            <td>No</td>
            <td>Trimmed; omitted if empty</td>
            <td><code>phone</code></td>
            <td>Campus phone; not WhatsApp config.</td>
          </tr>
          <tr>
            <td>Email</td>
            <td>No</td>
            <td>Trimmed; omitted if empty</td>
            <td><code>email</code></td>
            <td>Reference contact email.</td>
          </tr>
        </tbody>
      </table>

      <h2>What happens when</h2>
      <table>
        <thead>
          <tr>
            <th>Step</th>
            <th>System behavior</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Validation fails (empty name/code)</td>
            <td>
              Client shows <em>Name and code are required</em> in red error box inside modal. No API
              call.
            </td>
          </tr>
          <tr>
            <td>API <code>createBranch</code> succeeds</td>
            <td>
              New <code>Branch</code> row with <code>isActive: true</code>. Optional fields stored as
              null/undefined when blank. CEO branch list refetches.
            </td>
          </tr>
          <tr>
            <td>Duplicate code</td>
            <td>Server error returned; modal shows <code>e.message</code> (e.g. code already exists).</td>
          </tr>
          <tr>
            <td>After creation</td>
            <td>
              Branch has zero academic years, zero members, zero students. Appears in invite branch
              dropdown and API key branch selector.
            </td>
          </tr>
          <tr>
            <td>Admin invited and registers</td>
            <td>
              <code>branchMembers</code> count increases. Branch becomes operational in admin portal.
            </td>
          </tr>
        </tbody>
      </table>

      <h2>Permissions</h2>
      <p>
        Only <code>super_admin</code> can call branch creation endpoints and open the Add Branch modal.
        Branch admins and API keys scoped to <code>management</code> role cannot create top-level
        branches. Attempting the API without super_admin returns 403.
      </p>

      <DocCallout variant="info" title="Duplicate codes">
        If creation fails with a server error, the branch code may already be in use anywhere in your
        organization — including archived branches. Pick a different code and retry.
      </DocCallout>

      <DocCallout variant="tip" title="Naming conventions">
        Use a short prefix plus location: <code>MCS-SOHAN</code>, <code>MCS-BAHRIA</code>. Avoid spaces
        and special characters. The code is permanent — treat it like a database primary key label.
      </DocCallout>

      <h2>Choosing branch codes for API integrations</h2>
      <p>
        When you later create branch-scoped API keys, the selected branch&apos;s <strong>code</strong>{' '}
        is embedded in the key prefix. Changing the display name does not affect integrations; changing
        the code is impossible after creation. Coordinate with your development team on the code string
        before creating the branch if mobile apps will use branch-scoped keys.
      </p>

      <h2>Common issues &amp; fixes</h2>
      <table>
        <thead>
          <tr>
            <th>Issue</th>
            <th>Cause</th>
            <th>Fix</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>&quot;Name and code are required&quot;</td>
            <td>Missing required fields</td>
            <td>Complete both starred fields.</td>
          </tr>
          <tr>
            <td>&quot;Failed to create branch&quot;</td>
            <td>Network or server error</td>
            <td>Retry. Check API logs. Verify authentication.</td>
          </tr>
          <tr>
            <td>Code typo after save</td>
            <td>Codes are immutable</td>
            <td>If no data yet, delete empty branch and recreate. Otherwise contact support.</td>
          </tr>
          <tr>
            <td>Branch not in invite dropdown</td>
            <td>List not refreshed</td>
            <td>Reload Admins invite page. Confirm branch <code>isActive</code>.</td>
          </tr>
          <tr>
            <td>Modal stuck on Creating…</td>
            <td>Request hung</td>
            <td>Close modal, check network, retry.</td>
          </tr>
        </tbody>
      </table>

      <h2>Post-creation checklist</h2>
      <ol>
        <li>Verify branch appears in <Link href="/docs/intro/ceo/branches">Branches</Link> list.</li>
        <li>Open <Link href="/docs/intro/ceo/branches/details">Branch Details</Link> — expect zeros.</li>
        <li>
          <Link href="/docs/intro/ceo/admins/invite">Invite Admin</Link> — copy 7-day link, share via
          WhatsApp or your channel.
        </li>
        <li>Admin registers, sets up academic year in admin portal.</li>
        <li>Admin enrolls students; credentials sent via WhatsApp from admin portal.</li>
      </ol>

      <h2>Related guides</h2>
      <ul>
        <li>
          <Link href="/docs/intro/ceo/branches">Branches list</Link> — edit, archive, navigate
        </li>
        <li>
          <Link href="/docs/intro/ceo/branches/details">Branch Details</Link> — monitor setup progress
        </li>
        <li>
          <Link href="/docs/intro/ceo/admins/invite">Invite Admin</Link> — required next step
        </li>
        <li>
          <Link href="/docs/intro/ceo/api-keys">API Keys</Link> — branch-scoped integration keys
        </li>
      </ul>
    </DocsShell>
  );
}
