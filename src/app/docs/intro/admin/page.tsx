import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep, DocFaq } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function AdminIntroPage() {
  return (
    <DocsShell
      title="Admin Portal & Dashboard"
      subtitle="Branch-scoped ERP home — stats, quick actions, and navigation to every campus module."
      nav={introNav}
      variant="intro"
    >
      <h2>Overview</h2>
      <p>
        The <strong>Admin Portal</strong> at <code>/admin</code> is the main ERP surface for running
        a school campus day to day. The <strong>Dashboard</strong> is the default landing page for
        branch administrators after sign-in. It answers: <em>how big is my campus right now?</em>{' '}
        with live counts for staff, teachers, students, and classes — all scoped to the{' '}
        <strong>active branch</strong> and <strong>academic year</strong> selected in the sidebar.
      </p>
      <p>
        <strong>Why it exists:</strong> before enrolling students, collecting fees, or marking
        attendance, admins need a trustworthy snapshot of campus scale. The dashboard aggregates
        branch stats that would otherwise require visiting each module individually. Quick action
        cards jump straight to the highest-frequency workflows.
      </p>
      <p>
        <strong>Who uses it:</strong> <code>branch_admin</code> and <code>sub_admin</code> roles see
        the full dashboard. <strong>Restricted management staff</strong> are redirected to their first
        permitted module and never see this page — see{' '}
        <Link href="/docs/intro/admin/permissions">Permissions &amp; Staff Roles</Link>.
      </p>

      <h2>Before you start</h2>
      <ul>
        <li>
          <strong>Sign in:</strong> use credentials issued by your organization CEO or branch admin.
          Expired tokens redirect to <code>/login</code>.
        </li>
        <li>
          <strong>Select branch:</strong> open the sidebar → <strong>Active Branch</strong> dropdown.
          Multi-branch admins must pick the campus they are working in.
        </li>
        <li>
          <strong>Select academic year:</strong> choose the year from the dropdown and press{' '}
          <strong>Go</strong>. The page reloads so all modules scope data to that year.
        </li>
        <li>
          <strong>Backend availability:</strong> stats load via <code>getBranchStats(branchId)</code>.
          If the API is down, an error banner appears instead of numbers.
        </li>
      </ul>

      <h2>Step-by-step: using the dashboard</h2>
      <DocSteps>
        <DocStep title="Open the admin portal">
          Sign in at <code>/login</code>. Branch admins land on <strong>Dashboard</strong>{' '}
          automatically. Use the ☰ menu or header link if you navigated away.
        </DocStep>
        <DocStep title="Confirm branch and year">
          Check the header shows the correct branch name. Verify the academic year selector matches
          the year you are working in (e.g. 2025–26 ACTIVE). Press <strong>Go</strong> after any
          change.
        </DocStep>
        <DocStep title="Read the admin info banner">
          Below the title, a banner shows the primary branch admin name, email, and{' '}
          <em>Since</em> date — useful when multiple admins share a campus.
        </DocStep>
        <DocStep title="Review the four summary cards">
          A 2×2 grid (4 columns on desktop) displays:
          <ul>
            <li><strong>Total Staff</strong> — all branch members including management and workers</li>
            <li><strong>Teachers</strong> — teaching staff count</li>
            <li><strong>Students</strong> — enrolled students for the active year</li>
            <li><strong>Classes</strong> — class groups / sections defined for the year</li>
          </ul>
          While loading, cards show skeleton placeholders; on error, em dashes (—).
        </DocStep>
        <DocStep title="Use Quick Actions">
          Four shortcut cards navigate to:
          <ul>
            <li><strong>Students</strong> → <code>/admin/students</code></li>
            <li><strong>Teachers</strong> → <code>/admin/teachers</code></li>
            <li><strong>Staff</strong> → <code>/admin/staff</code></li>
            <li><strong>Classes</strong> → <code>/admin/classes</code></li>
          </ul>
        </DocStep>
        <DocStep title="Navigate other modules">
          Use the sidebar for Fees, Attendance, Result, Canteen, Stationary, Payments, Timetable, and
          Settings. The <strong>?</strong> help icon in the header jumps to docs for the current
          screen.
        </DocStep>
      </DocSteps>

      <h2>Field reference — dashboard elements</h2>
      <p>The dashboard is read-only; there are no form fields.</p>
      <table>
        <thead>
          <tr><th>Element</th><th>Location</th><th>Meaning</th></tr>
        </thead>
        <tbody>
          <tr><td>Dashboard (title)</td><td>Page header</td><td>Confirms you are on the home screen</td></tr>
          <tr><td>Branch subtitle</td><td>Below title</td><td>Active branch name + &quot;Overview of your school campus&quot;</td></tr>
          <tr><td>Admin info banner</td><td>Below header</td><td>Primary admin name, email, since date from <code>admins[0]</code></td></tr>
          <tr><td>Total Staff</td><td>Card 1</td><td><code>stats.totalStaff</code></td></tr>
          <tr><td>Teachers</td><td>Card 2</td><td><code>stats.totalTeachers</code></td></tr>
          <tr><td>Students</td><td>Card 3</td><td><code>stats.totalStudents</code></td></tr>
          <tr><td>Classes</td><td>Card 4</td><td><code>stats.totalClasses</code></td></tr>
          <tr><td>Quick Actions</td><td>Below cards</td><td>Four navigation buttons with icons and descriptions</td></tr>
          <tr><td>Error banner</td><td>Above cards</td><td>&quot;No branch selected&quot; or API failure message</td></tr>
        </tbody>
      </table>

      <h2>Core modules (sidebar)</h2>
      <ul>
        <li><Link href="/docs/intro/admin/students">Students</Link> — enroll, search, manage profiles</li>
        <li><Link href="/docs/intro/admin/classes">Classes / Sections</Link> — groups, subjects, chat roles</li>
        <li><Link href="/docs/intro/admin/fees">Fees</Link> — structures, collections, families, reports</li>
        <li><Link href="/docs/intro/admin/attendance">Attendance</Link> — students, teachers, staff, reports</li>
        <li><Link href="/docs/intro/admin/result">Result &amp; Exams</Link> — sessions, marks, report cards</li>
        <li><Link href="/docs/intro/admin/expenses">Payments (Expenses)</Link> — payroll, utilities, vouchers</li>
        <li><Link href="/docs/intro/admin/stationary">Stationary</Link> — products, inventory, fee-linked sales</li>
        <li><Link href="/docs/intro/admin/canteen">Canteen</Link> — sales, credit accounts, inventory</li>
        <li><Link href="/docs/intro/admin/timetable">Timetable</Link> — weekly grids and exam datesheets</li>
        <li><Link href="/docs/intro/admin/teachers">Teachers</Link> — hire, assign, credentials</li>
        <li><Link href="/docs/intro/admin/staff">Staff</Link> — management workers and permissions</li>
        <li><Link href="/docs/intro/admin/settings">Settings</Link> — academic years, subjects, archives</li>
        <li><Link href="/docs/intro/admin/branches">Branches</Link> — campus list (multi-branch admins)</li>
      </ul>

      <h2>What happens when</h2>
      <table>
        <thead>
          <tr><th>Event</th><th>Backend / UI behavior</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Page loads</td>
            <td>Reads <code>activeBranchId</code> from localStorage, calls <code>api.getBranchStats</code>.
            Numbers formatted with <code>toLocaleString()</code>.</td>
          </tr>
          <tr>
            <td>No branch in localStorage</td>
            <td>Error: &quot;No branch selected. Select a branch from the sidebar.&quot;</td>
          </tr>
          <tr>
            <td>Admin enrolls students</td>
            <td><strong>Students</strong> count increases on next dashboard visit — no websocket</td>
          </tr>
          <tr>
            <td>Academic year changed</td>
            <td>Student and class counts reflect the newly selected year after reload</td>
          </tr>
          <tr>
            <td>Restricted staff opens /admin</td>
            <td>Layout redirects to <code>firstAllowedPath()</code> — e.g. Fees or Attendance</td>
          </tr>
          <tr>
            <td>super_admin signs in</td>
            <td>Redirected to <code>/ceo</code> CEO portal, not admin dashboard</td>
          </tr>
          <tr>
            <td>Year archived</td>
            <td>Dashboard still loads; write actions elsewhere show read-only banners</td>
          </tr>
        </tbody>
      </table>

      <h2>Permissions</h2>
      <p>
        <strong>View dashboard:</strong> <code>branch_admin</code> and <code>sub_admin</code> only.
        Restricted staff never see this page.
      </p>
      <p>
        <strong>Quick actions:</strong> lead to full-admin-only pages (Teachers, Staff, Classes) or
        module-gated pages (Students requires STUDENTS module for restricted users who somehow reach
        the URL).
      </p>
      <p>
        <strong>Data visibility:</strong> stats are branch-scoped, not organization-wide. Compare with
        the <Link href="/docs/intro/ceo/dashboard">CEO Dashboard</Link> for multi-campus totals.
      </p>

      <DocCallout variant="tip" title="Getting oriented">
        Use the <strong>?</strong> help icon in the admin header on any screen to jump to the guide
        for that module. Restricted staff see only modules their admin assigned.
      </DocCallout>

      <DocCallout variant="warn" title="Archived academic years">
        When the active year is <em>archived</em>, most write actions are blocked unless staff have
        archived-year permissions. You can usually still view reports with read access.
      </DocCallout>

      <h2>Common issues &amp; fixes</h2>
      <table>
        <thead>
          <tr><th>Symptom</th><th>Cause</th><th>Fix</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>All cards show —</td>
            <td>Loading failed or no branch</td>
            <td>Select branch in sidebar. Re-login if token expired.</td>
          </tr>
          <tr>
            <td>Student count is 0</td>
            <td>Wrong academic year or no enrollments</td>
            <td>Select ACTIVE year, press Go. Enroll students under Students module.</td>
          </tr>
          <tr>
            <td>Sent to /ceo instead</td>
            <td>super_admin role</td>
            <td>Use CEO portal for org-wide management, or a branch admin account for campus ERP.</td>
          </tr>
          <tr>
            <td>Cannot open dashboard</td>
            <td>Restricted staff role</td>
            <td>Expected — you land on your first permitted module instead.</td>
          </tr>
        </tbody>
      </table>

      <h2>FAQ</h2>
      <DocFaq
        items={[
          {
            q: 'Why must I press Go after changing academic year?',
            a: 'The reload ensures every module fetches data for the newly selected year. Without Go, stale year context may show wrong rosters or empty lists.',
          },
          {
            q: 'Does the dashboard update in real time?',
            a: 'No. Refresh the page or navigate away and back to see updated counts after enrollments or staff changes.',
          },
          {
            q: 'Where do I configure the school structure before using modules?',
            a: 'Start in Settings → Academic Years and Subjects, then Classes, then Students. See the Settings guide.',
          },
          {
            q: 'Can I customize quick actions?',
            a: 'Not currently — the four shortcuts are fixed to Students, Teachers, Staff, and Classes.',
          },
        ]}
      />

      <h2>Related guides</h2>
      <ul>
        <li><Link href="/docs/intro/get-started">Get Started</Link> — first-time login</li>
        <li><Link href="/docs/intro/admin/permissions">Permissions &amp; Staff Roles</Link> — restricted access model</li>
        <li><Link href="/docs/intro/admin/settings">Settings</Link> — academic year setup order</li>
        <li><Link href="/docs/intro/ceo/dashboard">CEO Dashboard</Link> — organization-wide stats</li>
        <li><Link href="/docs/intro/admin/students">Students</Link> — from Quick Actions</li>
      </ul>
    </DocsShell>
  );
}
