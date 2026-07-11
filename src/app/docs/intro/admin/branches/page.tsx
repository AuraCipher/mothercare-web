import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep, DocFaq } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function AdminBranchesPage() {
  return (
    <DocsShell
      title="Branches"
      subtitle="View and edit campuses assigned to your admin account."
      nav={introNav}
      variant="intro"
    >
      <h2>Overview</h2>
      <p>
        The <strong>Branches</strong> screen at <code>/admin/branches</code> lists every campus your
        account can access. Multi-branch admins switch the active branch from the sidebar; this page
        shows details, academic year counts, and lets you edit contact info or create branches when
        your role permits.
      </p>
      <p>
        <strong>Why it exists:</strong> organizations with multiple locations need a campus directory
        within the admin portal — separate from the CEO organization-wide branch manager.
      </p>
      <p>
        <strong>Who uses it:</strong> <strong>branch admins</strong> assigned to one or more campuses.
        <code>super_admin</code> users are redirected to the CEO portal. Restricted staff do not
        manage branches.
      </p>

      <h2>Before you start</h2>
      <ul>
        <li>Know whether you are a single-branch or multi-branch admin.</li>
        <li>Branch <strong>codes</strong> are fixed after creation — choose carefully at create time.</li>
        <li>Organization owners create branches from the <Link href="/docs/intro/ceo/branches">CEO portal</Link> if you lack create permission here.</li>
      </ul>

      <h2>Step-by-step: common workflows</h2>
      <DocSteps>
        <DocStep title="Switch active branch">
          Sidebar → <strong>Active Branch</strong> dropdown → select campus → academic year dropdown
          → press <strong>Go</strong> to reload all module data for that branch.
        </DocStep>
        <DocStep title="View branch list">
          Open Branches → cards show name, code, active badge, address, phone, academic year count.
        </DocStep>
        <DocStep title="Open branch details">
          Click a row → <code>/admin/branches/[id]</code> — stats, academic years, quick links for
          that campus.
        </DocStep>
        <DocStep title="Edit branch info">
          <strong>Edit</strong> modal → update name, address, phone, email. Branch code cannot change
          after creation.
        </DocStep>
        <DocStep title="Create a branch">
          If permitted, <strong>Create</strong> modal → name*, code*, address, phone, email → save.
          Some organizations require CEO portal for new campuses.
        </DocStep>
        <DocStep title="Deactivate or archive">
          <strong>Deactivate</strong> when campus closes. Branch with data → archived state; empty
          branch → may be permanently removed per backend rules.
        </DocStep>
      </DocSteps>

      <h2>Field reference — create/edit branch</h2>
      <table>
        <thead>
          <tr><th>Field</th><th>Required</th><th>Notes</th></tr>
        </thead>
        <tbody>
          <tr><td>Name</td><td>Yes (create)</td><td>Campus display name</td></tr>
          <tr><td>Code</td><td>Yes (create)</td><td>Short unique ID — immutable after create</td></tr>
          <tr><td>Address</td><td>No</td><td>Physical location</td></tr>
          <tr><td>Phone</td><td>No</td><td>Campus contact — not WhatsApp API config</td></tr>
          <tr><td>Email</td><td>No</td><td>Campus email</td></tr>
        </tbody>
      </table>

      <h2>Field reference — branch card</h2>
      <table>
        <thead>
          <tr><th>Element</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>Active badge</td><td>Whether branch is operational</td></tr>
          <tr><td>AY count</td><td>Number of academic years configured</td></tr>
          <tr><td>View detail</td><td>Branch-scoped stats and year list</td></tr>
          <tr><td>Edit / Deactivate</td><td>Admin actions on card menu</td></tr>
        </tbody>
      </table>

      <h2>What happens when</h2>
      <table>
        <thead>
          <tr><th>Event</th><th>Behavior</th></tr>
        </thead>
        <tbody>
          <tr><td>Branch switched in sidebar</td><td><code>activeBranchId</code> in localStorage updates after Go</td></tr>
          <tr><td>Branch created</td><td>Appears in list; admin may need assignment to access</td></tr>
          <tr><td>Branch deactivated with data</td><td>Archived — historical records retained</td></tr>
          <tr><td>super_admin opens /admin/branches</td><td>Redirected to CEO branches manager</td></tr>
        </tbody>
      </table>

      <h2>Permissions</h2>
      <p>
        Branch list access is for <strong>branch admins</strong>. Not in restricted staff module
        matrix. Restricted staff work inside one assigned campus without branch management.
      </p>
      <p>
        CEO-level branch creation: <Link href="/docs/intro/ceo/branches">CEO Branches</Link>.
      </p>

      <DocCallout variant="info" title="CEO vs admin">
        Super admins manage all branches organization-wide in the CEO portal. Branch admins see
        only campuses they are assigned to.
      </DocCallout>

      <h2>Common issues &amp; fixes</h2>
      <table>
        <thead>
          <tr><th>Symptom</th><th>Cause</th><th>Fix</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Branch list empty</td>
            <td>Not assigned to branches</td>
            <td>CEO must invite admin with branch assignment</td>
          </tr>
          <tr>
            <td>Data wrong after switch</td>
            <td>Did not press Go</td>
            <td>Change branch/year → press <strong>Go</strong></td>
          </tr>
          <tr>
            <td>Cannot create branch</td>
            <td>Role lacks permission</td>
            <td>Use <Link href="/docs/intro/ceo/branches">CEO Branches</Link></td>
          </tr>
          <tr>
            <td>Code field missing on edit</td>
            <td>Immutable after create</td>
            <td>Codes cannot change — create new branch if needed</td>
          </tr>
        </tbody>
      </table>

      <h2>Multi-branch admin workflow</h2>
      <DocSteps>
        <DocStep title="List campuses">
          Branches page — verify all assigned locations appear.
        </DocStep>
        <DocStep title="Switch context">
          Sidebar branch dropdown → select campus → Go on year.
        </DocStep>
        <DocStep title="Work in module">
          All ERP data now scoped to selected branch.
        </DocStep>
        <DocStep title="Repeat per campus">
          Switch branch again for next location — no cross-branch data mixing.
        </DocStep>
      </DocSteps>

      <h2>FAQ</h2>
      <DocFaq
        items={[
          {
            q: 'Why must I press Go after switching branch?',
            a: 'Reload ensures every module fetches data for the new branch context.',
          },
          {
            q: 'Can I change a branch code?',
            a: 'No. Codes are immutable after creation. Create a new branch if a new code is required.',
          },
          {
            q: 'Where do I invite new branch admins?',
            a: 'CEO portal → Admins → Invite. Branch admins are assigned to a specific campus at invitation.',
          },
          {
            q: 'Does branch phone configure WhatsApp?',
            a: 'No. Branch phone is display contact only. WhatsApp credential delivery uses META_WHATSAPP_* server environment variables.',
          },
          {
            q: 'Can restricted staff switch branches?',
            a: 'Only if assigned to multiple branches. Most restricted staff work in one campus without seeing Branches page.',
          },
          {
            q: 'How do I add a second campus?',
            a: 'CEO portal → Branches → Add Branch, then invite an admin assigned to the new campus.',
          },
          {
            q: 'What is the branch code used for?',
            a: 'Internal short identifier — appears on reports and API scoping. Choose a memorable code at creation; it cannot be edited later.',
          },
        ]}
      />

      <h2>API endpoints (reference)</h2>
      <table>
        <thead>
          <tr><th>Method</th><th>Endpoint</th><th>Purpose</th></tr>
        </thead>
        <tbody>
          <tr><td>GET</td><td><code>/admin/branches</code></td><td>List assigned branches</td></tr>
          <tr><td>POST</td><td><code>/admin/branches</code></td><td>Create branch (if permitted)</td></tr>
          <tr><td>PUT</td><td><code>/admin/branches/:id</code></td><td>Update name, address, phone, email</td></tr>
          <tr><td>POST</td><td><code>/admin/branches/:id/deactivate</code></td><td>Deactivate or archive campus</td></tr>
        </tbody>
      </table>

      <h2>Navigation paths</h2>
      <table>
        <thead>
          <tr><th>Screen</th><th>URL</th></tr>
        </thead>
        <tbody>
          <tr><td>Branch list</td><td><code>/admin/branches</code></td></tr>
          <tr><td>Branch detail</td><td><code>/admin/branches/[id]</code></td></tr>
          <tr><td>Switch branch</td><td>Sidebar Active Branch dropdown</td></tr>
          <tr><td>CEO all branches</td><td><code>/ceo/branches</code> (super_admin)</td></tr>
        </tbody>
      </table>

      <DocCallout variant="info" title="Branch phone vs WhatsApp">
        The phone field on a branch card is campus contact information only. WhatsApp credential
        delivery for students, teachers, and staff uses the Meta Cloud API configured on the server
        — not the branch phone number.
      </DocCallout>

      <h2>Help &amp; documentation</h2>
      <p>
        Use the <strong>?</strong> icon in the admin header while on the Branches screen to return
        to this guide. For organization-wide branch creation, CEO admins use{' '}
        <Link href="/docs/intro/ceo/branches/create">Create Branch</Link> in the CEO portal. After
        creating a campus, invite a branch admin assigned to that branch ID so they can complete
        academic year and subject setup under Settings.
      </p>

      <p>
        Branch detail pages show academic year count and quick stats — use them to verify a new campus
        has at least one ACTIVE year before telling staff to begin enrollment.
      </p>

      <h2>Related guides</h2>
      <ul>
        <li><Link href="/docs/intro/ceo/branches">CEO Branches</Link> — organization-wide management</li>
        <li><Link href="/docs/intro/ceo/branches/details">Branch Details</Link> — per-campus stats</li>
        <li><Link href="/docs/intro/admin/settings">Settings</Link> — academic years per branch</li>
        <li><Link href="/docs/intro/admin">Admin Dashboard</Link> — branch-scoped stats</li>
      </ul>
    </DocsShell>
  );
}
