import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function CeoDashboardPage() {
  return (
    <DocsShell
      title="CEO Dashboard"
      subtitle="A single-screen overview of your entire school organization."
      nav={introNav}
      variant="intro"
    >
      <h2>Overview</h2>
      <p>
        The <strong>CEO Dashboard</strong> is the default home screen when you open the CEO portal at{' '}
        <code>/ceo</code>. It answers one question at a glance: <em>how big is my organization right
        now?</em> The page loads live statistics from every branch in your tenancy — total campuses,
        total staff, total students, and how many API keys are currently active.
      </p>
      <p>
        <strong>Why it exists:</strong> before you create branches, invite admins, or issue API
        keys, you need a trustworthy snapshot of scale and growth. The dashboard aggregates counts
        that would otherwise require visiting each campus individually. It also surfaces a{' '}
        <strong>Staff by Role</strong> breakdown so you can spot gaps (for example a branch with
        admins but no teachers yet).
      </p>
      <p>
        <strong>Who uses it:</strong> organization owners and head-office staff with the{' '}
        <code>super_admin</code> role only. Branch administrators do not see this page; they land on
        their own admin dashboard scoped to one campus.
      </p>

      <h2>Before you start</h2>
      <ul>
        <li>
          <strong>Role:</strong> your JWT must contain <code>role: super_admin</code>. Other roles
          are redirected away from <code>/ceo</code> before the dashboard loads.
        </li>
        <li>
          <strong>Session:</strong> you must be signed in. An expired or missing token sends you to{' '}
          <code>/login</code>.
        </li>
        <li>
          <strong>Backend availability:</strong> stats are fetched via <code>GET /stats</code> (or
          equivalent API wrapper) on page load. If the API is down, you see{' '}
          <strong>Failed to load stats</strong> instead of numbers.
        </li>
        <li>
          <strong>Data exists:</strong> zeros across the board usually mean branches are new or
          admins have not finished academic setup — not necessarily an error.
        </li>
      </ul>

      <h2>Step-by-step: using the dashboard</h2>
      <DocSteps>
        <DocStep title="Open the CEO portal">
          Sign in at <code>/login</code> with your CEO account. You should land on{' '}
          <strong>CEO Dashboard</strong> automatically. Alternatively click the menu icon (☰) and
          choose <strong>Dashboard</strong> under Navigation, or click <strong>CEO Panel</strong> in
          the header.
        </DocStep>
        <DocStep title="Read the four summary cards">
          At the top, a 2×2 grid (4 columns on desktop) shows:
          <ul>
            <li>
              <strong>Total Branches</strong> — building icon, count of registered campuses.
            </li>
            <li>
              <strong>Total Staff</strong> — users icon, all staff across every branch (admins,
              teachers, management, etc.).
            </li>
            <li>
              <strong>Total Students</strong> — graduation cap icon, enrolled students
              organization-wide.
            </li>
            <li>
              <strong>Active API Keys</strong> — key icon, keys that have not been revoked.
            </li>
          </ul>
          While loading, each card shows an em dash (—) until data arrives.
        </DocStep>
        <DocStep title="Review Staff by Role">
          Below the summary cards, if role data exists, a section titled <strong>Staff by Role</strong>{' '}
          lists counts per role (for example <em>management</em>, <em>teacher</em>). Role labels are
          humanized (underscores become spaces). Use this to verify hiring and onboarding progress
          across branches.
        </DocStep>
        <DocStep title="Use Quick Actions">
          The <strong>Quick Actions</strong> section offers two shortcuts:
          <ul>
            <li>
              <strong>Manage Branches</strong> — navigates to <code>/ceo/branches</code> (full
              branches list with Add Branch, edit, and archive).
            </li>
            <li>
              <strong>API Key Manager</strong> — navigates to <code>/ceo/keys</code> (create and
              revoke API keys).
            </li>
          </ul>
          Note: there is no quick action for Admins on the dashboard itself — use the sidebar{' '}
          <strong>Admins</strong> link for invitations.
        </DocStep>
        <DocStep title="Navigate deeper when needed">
          Click a quick action or sidebar item to manage branches, invite admins, or configure keys.
          Return to the dashboard anytime via <strong>Dashboard</strong> in the sidebar.
        </DocStep>
      </DocSteps>

      <h2>Field reference — dashboard elements</h2>
      <p>The dashboard is read-only; there are no form fields. This table describes every UI element:</p>
      <table>
        <thead>
          <tr>
            <th>Element</th>
            <th>Location</th>
            <th>Meaning</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>CEO Dashboard (title)</td>
            <td>Page header</td>
            <td>Confirms you are on the home screen.</td>
          </tr>
          <tr>
            <td>Overview of all branches and staff (subtitle)</td>
            <td>Below title</td>
            <td>Describes page purpose.</td>
          </tr>
          <tr>
            <td>Total Branches</td>
            <td>Summary card 1</td>
            <td>Count from <code>stats.totalBranches</code>.</td>
          </tr>
          <tr>
            <td>Total Staff</td>
            <td>Summary card 2</td>
            <td>Count from <code>stats.totalUsers</code>.</td>
          </tr>
          <tr>
            <td>Total Students</td>
            <td>Summary card 3</td>
            <td>Count from <code>stats.totalStudents</code>.</td>
          </tr>
          <tr>
            <td>Active API Keys</td>
            <td>Summary card 4</td>
            <td>Count from <code>stats.activeApiKeys</code> (non-revoked keys).</td>
          </tr>
          <tr>
            <td>Staff by Role rows</td>
            <td>Below cards</td>
            <td>Key-value pairs from <code>stats.byRole</code>.</td>
          </tr>
          <tr>
            <td>Manage Branches</td>
            <td>Quick Actions</td>
            <td>Link to branches management.</td>
          </tr>
          <tr>
            <td>API Key Manager</td>
            <td>Quick Actions</td>
            <td>Link to API keys page.</td>
          </tr>
          <tr>
            <td>Failed to load stats</td>
            <td>Error banner</td>
            <td>API call failed; cards may show dashes.</td>
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
            <td>Page loads</td>
            <td>
              <code>useEffect</code> calls <code>api.stats()</code>. On success, state updates and
              cards populate with formatted numbers (<code>toLocaleString()</code>).
            </td>
          </tr>
          <tr>
            <td>Branch admin enrolls students</td>
            <td>
              <strong>Total Students</strong> increases on next dashboard visit or refresh. No
              real-time websocket — reload to see latest.
            </td>
          </tr>
          <tr>
            <td>You create a branch</td>
            <td>
              <strong>Total Branches</strong> increments after you return to the dashboard.
            </td>
          </tr>
          <tr>
            <td>You revoke an API key</td>
            <td>
              <strong>Active API Keys</strong> decreases. Revoked keys are excluded from the count.
            </td>
          </tr>
          <tr>
            <td>Branch archived</td>
            <td>
              Branch may still contribute to historical user/student counts depending on backend
              aggregation rules. Contact your technical team if archived campuses should be excluded.
            </td>
          </tr>
          <tr>
            <td>API error</td>
            <td>
              Error message displayed; stats remain null and cards show —.
            </td>
          </tr>
        </tbody>
      </table>

      <h2>Permissions</h2>
      <p>
        <strong>View dashboard:</strong> <code>super_admin</code> only. The CEO layout enforces this
        at the route level before children render.
      </p>
      <p>
        <strong>Actions from dashboard:</strong> quick actions lead to pages that are also
        super_admin-only (branches, API keys). You cannot delegate dashboard access to branch admins.
      </p>
      <p>
        <strong>Data visibility:</strong> stats are organization-wide. A CEO sees totals across all
        branches they own, not filtered to a single campus (unlike the admin portal which is
        branch-scoped).
      </p>

      <DocCallout variant="tip" title="When numbers look wrong">
        Totals update from the live database on each page load. If a figure seems off, confirm branch
        admins have selected the correct academic year and finished enrollment. Cross-check a specific
        campus on the <Link href="/docs/intro/ceo/branches/details">Branch Details</Link> page, which
        shows branch-scoped stats.
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
            <td>All cards show —</td>
            <td>Stats request still loading or failed</td>
            <td>Wait a moment. If persistent, check network tab and backend logs. Re-login.</td>
          </tr>
          <tr>
            <td>&quot;Failed to load stats&quot;</td>
            <td>API error or invalid token</td>
            <td>Sign out via <strong>Sign Out</strong> in sidebar, sign in again. Verify API URL config.</td>
          </tr>
          <tr>
            <td>Student count is 0 but branch has students</td>
            <td>Students tied to academic year / branch scope</td>
            <td>Verify enrollment in admin portal for active year. Check branch details page.</td>
          </tr>
          <tr>
            <td>Staff by Role section missing</td>
            <td><code>byRole</code> object empty</td>
            <td>Normal on fresh install before staff exist. Invite admins and add teachers.</td>
          </tr>
          <tr>
            <td>Cannot open dashboard — sent to /admin</td>
            <td>Not super_admin</td>
            <td>Use a CEO account or ask for role upgrade from technical admin.</td>
          </tr>
          <tr>
            <td>Quick action goes to wrong page</td>
            <td>Bookmarked old URL</td>
            <td>Use sidebar navigation. Dashboard links are <code>/ceo/branches</code> and <code>/ceo/keys</code>.</td>
          </tr>
        </tbody>
      </table>

      <h2>Interpreting metrics for decision-making</h2>
      <p>
        Use <strong>Total Branches</strong> against your physical campus count. If you operate three
        locations but see one branch, create the missing campuses before inviting admins — each admin
        must be assigned to exactly one branch at invitation time.
      </p>
      <p>
        Compare <strong>Total Staff</strong> with <strong>Staff by Role</strong>. A healthy campus
        typically has at least one <em>management</em> admin, teachers proportional to classes, and
        optional support staff. A branch with students but zero teachers in the role breakdown
        signals incomplete setup.
      </p>
      <p>
        <strong>Active API Keys</strong> should match integrations you actively maintain. If the
        count is higher than expected, audit keys on the{' '}
        <Link href="/docs/intro/ceo/api-keys">API Keys</Link> page and revoke unused ones.
      </p>

      <h2>Related guides</h2>
      <ul>
        <li>
          <Link href="/docs/intro/ceo">CEO Portal overview</Link> — full setup workflow
        </li>
        <li>
          <Link href="/docs/intro/ceo/branches">Branches</Link> — manage campuses from{' '}
          <strong>Manage Branches</strong>
        </li>
        <li>
          <Link href="/docs/intro/ceo/branches/details">Branch Details</Link> — per-campus stats
        </li>
        <li>
          <Link href="/docs/intro/ceo/admins">Admins</Link> — invite branch administrators
        </li>
        <li>
          <Link href="/docs/intro/ceo/api-keys">API Keys</Link> — from <strong>API Key Manager</strong>
        </li>
        <li>
          <Link href="/docs/intro/ceo/permissions">CEO Permissions</Link> — who can see what
        </li>
      </ul>
    </DocsShell>
  );
}
