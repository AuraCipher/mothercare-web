import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function CeoBranchesPage() {
  return (
    <DocsShell
      title="Branches"
      subtitle="View and manage every school campus in your organization."
      nav={introNav}
      variant="intro"
    >
      <h2>Overview</h2>
      <p>
        A <strong>branch</strong> represents one physical campus or school location — for example
        &quot;Mother Care Sohan&quot; with code <code>MCS-SOHAN</code>. Each branch is an isolated
        operational unit with its own students, teachers, classes, academic years, fees, and branch
        administrator. The CEO <strong>Branches</strong> page (<code>/ceo/branches</code>) lists every
        campus you oversee and provides entry points to create, edit, inspect, archive, or delete
        branches.
      </p>
      <p>
        <strong>Why branches matter:</strong> multi-campus school groups need separate data boundaries
        so Sohan campus fees never mix with Bahria campus attendance. The branch code is also embedded
        in branch-scoped API keys (<code>pk_mcs_MCS-SOHAN_…</code>), making it a permanent identifier
        chosen at creation time.
      </p>
      <p>
        <strong>Who uses this page:</strong> <code>super_admin</code> (CEO) only. Branch admins manage
        day-to-day academics inside one branch via the admin portal; they cannot create sibling
        branches or view the organization-wide list.
      </p>

      <h2>Before you start</h2>
      <ul>
        <li>
          <strong>CEO access</strong> — signed in as <code>super_admin</code> at <code>/ceo/branches</code>.
        </li>
        <li>
          <strong>Branch codes planned</strong> — each code must be unique and cannot be changed after
          creation. Use a consistent naming scheme (e.g. <code>MCS-SOHAN</code>, <code>MCS-BAHRIA</code>).
        </li>
        <li>
          <strong>Admin readiness</strong> — a new branch has no administrator until you{' '}
          <Link href="/docs/intro/ceo/admins/invite">invite one</Link>. Plan invitations before
          expecting operational data.
        </li>
        <li>
          <strong>Archive awareness</strong> — deactivating a branch with data archives it (hidden,
          data kept). Empty branches are permanently deleted. Communicate with campus staff before
          archiving active schools.
        </li>
      </ul>

      <h2>Step-by-step: branches list workflow</h2>
      <DocSteps>
        <DocStep title="Open Branches">
          From the CEO sidebar, click <strong>Branches</strong>. Or use <strong>Manage Branches</strong>{' '}
          on the dashboard. The page title is <strong>Branches</strong> with subtitle{' '}
          <em>All school campuses managed by you.</em>
        </DocStep>
        <DocStep title="Review the list">
          Each branch appears as a card row showing:
          <ul>
            <li>Building icon, <strong>branch name</strong> (bold)</li>
            <li>
              <strong>Branch code</strong> and address snippet (e.g. <code>MCS-SOHAN · Sohan, Islamabad</code>)
            </li>
            <li>
              Staff count on desktop (e.g. <em>3 staff</em>) from <code>_count.branchMembers</code>
            </li>
          </ul>
          Click the main row area to open <Link href="/docs/intro/ceo/branches/details">Branch Details</Link>.
        </DocStep>
        <DocStep title="Add a new branch">
          Click the <strong>Add Branch</strong> button (top right, gold/accent color). The{' '}
          <strong>Add Branch</strong> modal opens. See{' '}
          <Link href="/docs/intro/ceo/branches/create">Create a Branch</Link> for full field guide.
        </DocStep>
        <DocStep title="Edit an existing branch">
          Click the <strong>Edit</strong> icon (pencil) on a row. The <strong>Edit Branch</strong>{' '}
          modal lets you change name, address, phone, and email. Branch code is not editable.
          Click <strong>Save Changes</strong> to persist.
        </DocStep>
        <DocStep title="Deactivate a branch">
          Click the <strong>Deactivate</strong> icon (trash) on a row. A confirmation modal appears:
          <ul>
            <li>
              If the branch has academic years or members: title <strong>Archive Branch?</strong>,
              button <strong>Archive Branch</strong> (warning variant). Data preserved, branch hidden.
            </li>
            <li>
              If empty: title <strong>Delete Branch?</strong>, button{' '}
              <strong>Delete Permanently</strong> (danger variant). Irreversible removal.
            </li>
          </ul>
        </DocStep>
        <DocStep title="Open branch details">
          Click the row or the <strong>View details</strong> icon (external link). Navigate to
          per-branch stats, admin list, and quick actions.
        </DocStep>
      </DocSteps>

      <h2>Field reference — list and edit modal</h2>
      <p>
        Create form fields are documented on{' '}
        <Link href="/docs/intro/ceo/branches/create">Create a Branch</Link>. Edit modal fields:
      </p>
      <table>
        <thead>
          <tr>
            <th>Field</th>
            <th>Required</th>
            <th>Editable after create</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Branch Name</td>
            <td>Yes (edit)</td>
            <td>Yes</td>
            <td>Display name across portals.</td>
          </tr>
          <tr>
            <td>Branch Code</td>
            <td>Yes (create only)</td>
            <td>No</td>
            <td>Shown in list subtitle; used in API key prefixes.</td>
          </tr>
          <tr>
            <td>Address</td>
            <td>No</td>
            <td>Yes</td>
            <td>Free text; appears in list and details.</td>
          </tr>
          <tr>
            <td>Phone</td>
            <td>No</td>
            <td>Yes</td>
            <td>Campus contact; shown on branch details.</td>
          </tr>
          <tr>
            <td>Email</td>
            <td>No</td>
            <td>Yes</td>
            <td>Campus email; not used for system notifications from CEO flow.</td>
          </tr>
        </tbody>
      </table>

      <h2>What happens when</h2>
      <table>
        <thead>
          <tr>
            <th>Action</th>
            <th>Backend effect</th>
            <th>UI feedback</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Page load</td>
            <td><code>GET</code> branches with member and academic year counts</td>
            <td>List renders or &quot;No branches yet&quot; empty state</td>
          </tr>
          <tr>
            <td>Create branch</td>
            <td>Inserts branch; code stored uppercase</td>
            <td>Toast <em>Branch created successfully</em>; modal closes; list refreshes</td>
          </tr>
          <tr>
            <td>Update branch</td>
            <td>Patches name, address, phone, email</td>
            <td>Toast <em>Branch updated</em></td>
          </tr>
          <tr>
            <td>Archive branch (has data)</td>
            <td><code>isActive: false</code>; records retained</td>
            <td>Toast <em>Branch archived</em>; removed from active list</td>
          </tr>
          <tr>
            <td>Delete branch (empty)</td>
            <td>Hard delete branch row</td>
            <td>Toast <em>Branch deleted</em></td>
          </tr>
          <tr>
            <td>Duplicate code on create</td>
            <td>API validation error</td>
            <td>Red error in modal: message from server</td>
          </tr>
        </tbody>
      </table>

      <h2>Permissions</h2>
      <table>
        <thead>
          <tr>
            <th>Action</th>
            <th>super_admin</th>
            <th>Branch admin</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>View all branches list</td>
            <td>Yes</td>
            <td>No (sees own branch in admin portal only)</td>
          </tr>
          <tr>
            <td>Create branch</td>
            <td>Yes</td>
            <td>No</td>
          </tr>
          <tr>
            <td>Edit branch contact info</td>
            <td>Yes</td>
            <td>Limited branch settings in admin portal</td>
          </tr>
          <tr>
            <td>Archive / delete branch</td>
            <td>Yes</td>
            <td>No</td>
          </tr>
          <tr>
            <td>View branch details stats</td>
            <td>Yes</td>
            <td>No (CEO-only detail route)</td>
          </tr>
        </tbody>
      </table>

      <DocCallout variant="warn" title="Before you archive">
        Archiving hides the branch from active use but preserves all historical data — students,
        fees, academic years. Confirm with the branch admin and ensure another admin is appointed if
        the campus will continue under a different structure. Active students cannot be managed
        through a hidden branch until it is restored (contact technical support if needed).
      </DocCallout>

      <h2>Empty and loading states</h2>
      <p>
        While loading, the page shows <strong>Loading…</strong>. With zero branches, a centered empty
        state displays a map pin icon and <em>No branches yet.</em> Use <strong>Add Branch</strong> to
        create your first campus, then proceed to admin invitation.
      </p>

      <h2>After creating a branch</h2>
      <p>
        A newly created branch appears immediately in the list with zero staff until you assign an
        admin. Next steps:
      </p>
      <ol>
        <li>
          <Link href="/docs/intro/ceo/admins/invite">Invite an admin</Link> and select this branch in{' '}
          <strong>Assign Branch</strong>.
        </li>
        <li>
          Share the 7-day registration link manually (WhatsApp, SMS, or your email client).
        </li>
        <li>
          After registration, the admin sets up academic years and enrolls students in the admin
          portal.
        </li>
        <li>
          Optionally create a branch-scoped API key on the{' '}
          <Link href="/docs/intro/ceo/api-keys">API Keys</Link> page.
        </li>
      </ol>

      <h2>Common issues &amp; fixes</h2>
      <table>
        <thead>
          <tr>
            <th>Problem</th>
            <th>Cause</th>
            <th>Solution</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>&quot;Name and code are required&quot;</td>
            <td>Empty required fields in create modal</td>
            <td>Fill <strong>Branch Name</strong> and <strong>Branch Code</strong> before <strong>Create Branch</strong>.</td>
          </tr>
          <tr>
            <td>Failed to create branch (duplicate)</td>
            <td>Branch code already exists</td>
            <td>Choose a unique code. Codes are organization-wide unique.</td>
          </tr>
          <tr>
            <td>Cannot change branch code</td>
            <td>By design — code is immutable</td>
            <td>Create a new branch with correct code if mistake was pre-data. Migrate with technical help.</td>
          </tr>
          <tr>
            <td>Staff count shows —</td>
            <td>Count not loaded in <code>_count</code></td>
            <td>Refresh page. Open branch details for authoritative staff list.</td>
          </tr>
          <tr>
            <td>Archive button unavailable / fails</td>
            <td>API or permission error</td>
            <td>Confirm super_admin session. Check error toast message.</td>
          </tr>
          <tr>
            <td>Branch missing after archive</td>
            <td>Archived branches hidden from default list</td>
            <td>Expected behavior. Contact support to restore if needed.</td>
          </tr>
        </tbody>
      </table>

      <h2>Related guides</h2>
      <ul>
        <li>
          <Link href="/docs/intro/ceo/branches/create">Create a Branch</Link> — Add Branch modal walkthrough
        </li>
        <li>
          <Link href="/docs/intro/ceo/branches/details">Branch Details</Link> — stats and admin management
        </li>
        <li>
          <Link href="/docs/intro/ceo/admins/invite">Invite Admin</Link> — assign admin to new campus
        </li>
        <li>
          <Link href="/docs/intro/ceo/api-keys">API Keys</Link> — branch-scoped keys
        </li>
        <li>
          <Link href="/docs/intro/ceo/permissions">CEO Permissions</Link>
        </li>
      </ul>
    </DocsShell>
  );
}
