import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function CeoBranchDetailsPage() {
  return (
    <DocsShell
      title="Branch Details"
      subtitle="Inspect one campus — stats, admin, and quick actions."
      nav={introNav}
      variant="intro"
    >
      <h2>Overview</h2>
      <p>
        The <strong>Branch Details</strong> page (<code>/ceo/branches/[id]</code>) is a CEO-only
        drill-down for a single campus. Open it by clicking any branch row on the{' '}
        <Link href="/docs/intro/ceo/branches">Branches</Link> list or the external-link icon on that
        row. You see live operational statistics, assigned branch administrators, status badges, and
        shortcuts to invite admins or manage API keys.
      </p>
      <p>
        <strong>Why use this page:</strong> the organization dashboard shows totals across all
        branches; branch details show whether <em>this specific campus</em> is staffed, enrolled, and
        configured. It is the right place to verify onboarding progress, remove an admin, or jump to
        invitation flow.
      </p>
      <p>
        <strong>Who uses it:</strong> <code>super_admin</code> only. Branch admins use the admin
        portal for their own branch; they do not access this CEO route.
      </p>

      <h2>Before you start</h2>
      <ul>
        <li>
          <strong>Branch exists</strong> — created via <Link href="/docs/intro/ceo/branches/create">Create a Branch</Link>.
        </li>
        <li>
          <strong>Valid branch ID</strong> — URL contains the branch UUID from the list. Invalid IDs
          show <em>Branch not found</em>.
        </li>
        <li>
          <strong>CEO session</strong> — active super_admin token.
        </li>
        <li>
          <strong>Expect zeros initially</strong> — new branches show 0 staff, students, teachers, and
          classes until the branch admin completes setup.
        </li>
      </ul>

      <h2>Step-by-step: reading and acting on branch details</h2>
      <DocSteps>
        <DocStep title="Open a branch">
          From <strong>Branches</strong>, click a branch name row or the <strong>View details</strong>{' '}
          (external link) icon. URL pattern: <code>/ceo/branches/{'{branchId}'}</code>.
        </DocStep>
        <DocStep title="Use Back to Branches">
          Top link: <strong>← Back to Branches</strong> returns to the list without losing list
          scroll position on browser back.
        </DocStep>
        <DocStep title="Read the header">
          Shows:
          <ul>
            <li><strong>Branch name</strong> (h1)</li>
            <li><strong>Branch code</strong> (mono uppercase badge)</li>
            <li>
              Status pill: <strong>Active</strong> (green) or <strong>Inactive</strong> (gray) from{' '}
              <code>isActive</code>
            </li>
            <li>Address line — or <em>No address on file</em></li>
            <li>Phone and email with icons when set</li>
          </ul>
        </DocStep>
        <DocStep title="Review statistics cards">
          Four cards in a grid:
          <ul>
            <li><strong>Total Staff</strong> — <code>stats.totalStaff</code></li>
            <li><strong>Total Teachers</strong> — <code>stats.totalTeachers</code></li>
            <li><strong>Total Students</strong> — <code>stats.totalStudents</code></li>
            <li><strong>Classes</strong> — <code>stats.totalClasses</code></li>
          </ul>
          Numbers use locale formatting. Data maintained by branch admin in admin portal.
        </DocStep>
        <DocStep title="Check Branch Admin section">
          Section title: <strong>Branch Admin</strong> with users icon.
          <ul>
            <li>
              <strong>Empty state:</strong> <em>No admin assigned to this branch.</em> Link:{' '}
              <strong>Invite an admin →</strong>
            </li>
            <li>
              <strong>With admin(s):</strong> card per admin showing name, email, phone,{' '}
              <em>Since {'{date}'}</em>, status badge (<strong>active</strong> / inactive), and
              remove button for active admins.
            </li>
          </ul>
        </DocStep>
        <DocStep title="Remove an admin (if needed)">
          Click trash icon on an <strong>active</strong> admin. Confirm modal:
          <ul>
            <li>Title: <strong>Remove Admin?</strong></li>
            <li>
              Message explains credentials deactivated; students/teachers/classes preserved; new admin
              can be appointed.
            </li>
            <li>Confirm: <strong>Remove Admin</strong> (danger)</li>
          </ul>
          Toast: <em>Admin removed. Credentials deactivated, data preserved.</em>
        </DocStep>
        <DocStep title="Use Quick Actions">
          Three buttons at bottom:
          <ul>
            <li><strong>Invite New Admin</strong> → <code>/ceo/admins/invite</code></li>
            <li><strong>Manage Branch</strong> → <code>/admin/branches</code> (admin portal branch management)</li>
            <li><strong>API Keys</strong> → <code>/ceo/keys</code></li>
          </ul>
        </DocStep>
      </DocSteps>

      <h2>Field reference — displayed data</h2>
      <table>
        <thead>
          <tr>
            <th>Display element</th>
            <th>Source field</th>
            <th>Editable here?</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Branch name</td>
            <td><code>data.name</code></td>
            <td>No — use Edit on branches list</td>
          </tr>
          <tr>
            <td>Branch code</td>
            <td><code>data.code</code></td>
            <td>No — immutable</td>
          </tr>
          <tr>
            <td>Active / Inactive</td>
            <td><code>data.isActive</code></td>
            <td>No — archive from branches list</td>
          </tr>
          <tr>
            <td>Address, phone, email</td>
            <td><code>address</code>, <code>phone</code>, <code>email</code></td>
            <td>No — use Edit modal on list</td>
          </tr>
          <tr>
            <td>Stat cards (4)</td>
            <td><code>data.stats.*</code></td>
            <td>No — updated by admin portal activity</td>
          </tr>
          <tr>
            <td>Admin name</td>
            <td><code>admins[].name</code></td>
            <td>Yes — via <Link href="/docs/intro/ceo/admins/profile">Admin Profile</Link></td>
          </tr>
          <tr>
            <td>Admin email / phone</td>
            <td><code>admins[].email</code>, <code>phone</code></td>
            <td>Profile page (email read-only)</td>
          </tr>
          <tr>
            <td>Admin status</td>
            <td><code>admins[].status</code></td>
            <td>Remove admin action deactivates</td>
          </tr>
          <tr>
            <td>Admin since date</td>
            <td><code>admins[].since</code></td>
            <td>Read-only</td>
          </tr>
        </tbody>
      </table>

      <h2>What happens when</h2>
      <table>
        <thead>
          <tr>
            <th>Action</th>
            <th>Backend effect</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Page load</td>
            <td>
              <code>getBranchStats(id)</code> returns branch metadata, aggregated stats, and admin
              array.
            </td>
          </tr>
          <tr>
            <td>Remove admin</td>
            <td>
              <code>removeAdmin(branchId, adminId)</code> deactivates login for that branch membership.
              Academic records unchanged.
            </td>
          </tr>
          <tr>
            <td>Admin enrolls students (elsewhere)</td>
            <td>
              <strong>Total Students</strong> and <strong>Classes</strong> increase on next page load.
            </td>
          </tr>
          <tr>
            <td>Invite link used</td>
            <td>
              New admin appears in Branch Admin section with <strong>active</strong> status after
              registration completes.
            </td>
          </tr>
          <tr>
            <td>Branch archived from list</td>
            <td>
              Details may show <strong>Inactive</strong> or become inaccessible depending on API
              rules.
            </td>
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
            <td>View branch details page</td>
            <td>Yes</td>
            <td>No</td>
          </tr>
          <tr>
            <td>View cross-branch stats</td>
            <td>Yes (any branch)</td>
            <td>Own branch only in admin portal</td>
          </tr>
          <tr>
            <td>Remove branch admin</td>
            <td>Yes</td>
            <td>No</td>
          </tr>
          <tr>
            <td>Invite admin via quick action</td>
            <td>Yes</td>
            <td>No</td>
          </tr>
          <tr>
            <td>Manage Branch quick action</td>
            <td>Opens admin portal (needs admin access)</td>
            <td>Yes for own branch</td>
          </tr>
        </tbody>
      </table>

      <DocCallout variant="warn" title="Removing an admin">
        Removing an admin blocks their access immediately. Student, teacher, and class data stay
        intact. Confirm with your team before removing someone still operating the campus. Appoint a
        replacement via <strong>Invite New Admin</strong> before removal if possible.
      </DocCallout>

      <h2>Loading and error states</h2>
      <p>
        While loading, skeleton placeholders animate for header and stat cards. On error or missing
        branch, a message appears (<em>Failed to load branch</em> or <em>Branch not found</em>) with{' '}
        <strong>← Back to Branches</strong> link.
      </p>

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
            <td>All stats are 0</td>
            <td>New branch or incomplete admin setup</td>
            <td>Ensure admin registered, created academic year, added classes and students.</td>
          </tr>
          <tr>
            <td>No admin assigned</td>
            <td>Invitation pending or not sent</td>
            <td>
              <Link href="/docs/intro/ceo/admins/invite">Generate invitation</Link>; share link within
              7 days.
            </td>
          </tr>
          <tr>
            <td>Remove admin fails</td>
            <td>API error or already inactive</td>
            <td>Read error toast. Refresh page. Only active admins show remove button.</td>
          </tr>
          <tr>
            <td>Branch not found</td>
            <td>Invalid URL or deleted branch</td>
            <td>Return to branches list. Verify branch was not permanently deleted.</td>
          </tr>
          <tr>
            <td>Manage Branch opens admin portal empty</td>
            <td>CEO may lack branch admin membership</td>
            <td>Expected — day-to-day edits done by branch admin. CEO edits contact info on list page.</td>
          </tr>
          <tr>
            <td>Inactive badge</td>
            <td>Branch archived</td>
            <td>Restore via support or unarchive workflow if available.</td>
          </tr>
        </tbody>
      </table>

      <h2>Monitoring campus health</h2>
      <p>
        Use this page weekly during rollout: confirm <strong>Total Teachers</strong> matches hired
        staff, <strong>Total Students</strong> matches admissions, and <strong>Branch Admin</strong>{' '}
        shows at least one <strong>active</strong> administrator. A campus with students but no admin
        is a critical access gap — invite or reassign immediately.
      </p>

      <h2>Related guides</h2>
      <ul>
        <li>
          <Link href="/docs/intro/ceo/branches">Branches</Link> — list, edit, archive
        </li>
        <li>
          <Link href="/docs/intro/ceo/admins/invite">Invite Admin</Link> — empty state action
        </li>
        <li>
          <Link href="/docs/intro/ceo/admins/profile">Admin Profile</Link> — edit admin details
        </li>
        <li>
          <Link href="/docs/intro/ceo/api-keys">API Keys</Link> — quick action
        </li>
        <li>
          <Link href="/docs/intro/admin">Admin Portal</Link> — where stats are produced
        </li>
      </ul>
    </DocsShell>
  );
}
