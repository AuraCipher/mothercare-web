import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep, DocFaq } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function CeoAdminProfilePage() {
  return (
    <DocsShell
      title="Admin Profile"
      subtitle="View and update a branch administrator's record."
      nav={introNav}
      variant="intro"
    >
      <h2>Overview</h2>
      <p>
        The <strong>Admin Profile</strong> page at <code>/ceo/admins/[userId]</code> shows a branch
        administrator&apos;s full record and lets you update contact and employment details on their
        behalf. Open it by clicking any row on the <Link href="/docs/intro/ceo/admins">Admins</Link>{' '}
        list.
      </p>
      <p>
        <strong>Why it exists:</strong> during onboarding you may need to correct phone numbers,
        designations, or emergency contacts before the admin updates their own profile. CEOs have
        organization-wide visibility; branch admins edit the same fields in their own admin portal.
      </p>
      <p>
        <strong>Who uses it:</strong> <code>super_admin</code> only. This page does not send login
        credentials — credential delivery via WhatsApp is handled from the admin portal after enrollment.
      </p>

      <h2>Before you start</h2>
      <ul>
        <li>
          <strong>Role:</strong> signed in as <code>super_admin</code> at <code>/ceo</code>.
        </li>
        <li>
          <strong>Admin exists:</strong> the person must have completed registration. Pending invites
          do not have profiles yet — use <Link href="/docs/intro/ceo/admins/invite">Invite Admin</Link>{' '}
          and <strong>Copy Link</strong> instead.
        </li>
        <li>
          <strong>User ID in URL:</strong> the route uses <code>userId</code> (not staff record id).
          Clicking an admin row navigates to the correct path automatically.
        </li>
        <li>
          <strong>Email is immutable here:</strong> login email cannot be changed from this screen. Plan
          the correct address at invitation time.
        </li>
      </ul>

      <h2>Step-by-step: view and edit a profile</h2>
      <DocSteps>
        <DocStep title="Open Admins">
          From the CEO sidebar, choose <strong>Admins</strong> or go to <code>/ceo/admins</code>.
        </DocStep>
        <DocStep title="Select an administrator">
          Under <strong>Branch Admins</strong>, click the admin&apos;s row. The profile opens at{' '}
          <code>/ceo/admins/[userId]</code>.
        </DocStep>
        <DocStep title="Review the header">
          The page header shows the admin&apos;s <strong>Full name</strong> as the title. Subtitle
          format: <code>Branch Name · email@school.edu</code>.
        </DocStep>
        <DocStep title="Edit fields">
          Update any editable field in the two-column form grid. Tab through{' '}
          <strong>Full name</strong>, <strong>Phone</strong>, <strong>Employee ID</strong>,{' '}
          <strong>Designation</strong>, <strong>Qualification</strong>, <strong>Specialization</strong>,{' '}
          <strong>Joining date</strong>, <strong>Emergency contact</strong>, <strong>Address</strong>,
          and <strong>Bio</strong>.
        </DocStep>
        <DocStep title="Save changes">
          Click <strong>Save</strong> (top-right, save icon). Button shows <strong>Saving…</strong>{' '}
          while the request runs. Success toast: <em>Admin profile updated</em>.
        </DocStep>
        <DocStep title="Return to list">
          Click <strong>Back to admins</strong> (arrow, top-left) to return to the Admins page.
        </DocStep>
      </DocSteps>

      <h2>Field reference</h2>
      <table>
        <thead>
          <tr>
            <th>Field</th>
            <th>Editable</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Full name</td>
            <td>Yes</td>
            <td>Display name shown across portals. Maps to <code>name</code> on save.</td>
          </tr>
          <tr>
            <td>Phone</td>
            <td>Yes</td>
            <td>Contact number. Optional; stored as null if cleared.</td>
          </tr>
          <tr>
            <td>Username</td>
            <td>No (display)</td>
            <td>Login username for reference. Shown in form but not sent on update.</td>
          </tr>
          <tr>
            <td>Email</td>
            <td>No</td>
            <td>Login identifier. Grayed read-only input — cannot change from CEO profile.</td>
          </tr>
          <tr>
            <td>Employee ID</td>
            <td>Yes</td>
            <td>Internal staff identifier (for example EMP-001).</td>
          </tr>
          <tr>
            <td>Designation</td>
            <td>Yes</td>
            <td>Work role label (maps to <code>workRole</code> in API).</td>
          </tr>
          <tr>
            <td>Qualification</td>
            <td>Yes</td>
            <td>Educational qualification text.</td>
          </tr>
          <tr>
            <td>Specialization</td>
            <td>Yes</td>
            <td>Subject or area of expertise.</td>
          </tr>
          <tr>
            <td>Joining date</td>
            <td>Yes</td>
            <td>Date picker (<code>type=date</code>). ISO date sent to API.</td>
          </tr>
          <tr>
            <td>Emergency contact</td>
            <td>Yes</td>
            <td>Phone or name for emergencies.</td>
          </tr>
          <tr>
            <td>Address</td>
            <td>Yes</td>
            <td>Full-width row spanning both columns.</td>
          </tr>
          <tr>
            <td>Bio</td>
            <td>Yes</td>
            <td>Multi-line textarea (3 rows). Optional notes about the administrator.</td>
          </tr>
          <tr>
            <td>Branch (subtitle)</td>
            <td>No</td>
            <td>Assigned campus name from <code>d.branch.name</code>. Not editable on this page.</td>
          </tr>
          <tr>
            <td>Save</td>
            <td>—</td>
            <td>Calls <code>api.updateAdminProfile(userId, …)</code>.</td>
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
              <code>api.getAdminDetail(userId)</code> fetches user + nested <code>profile</code>.
              Shows <strong>Loading…</strong> until complete.
            </td>
          </tr>
          <tr>
            <td>Admin not found</td>
            <td>Red error text: <em>Admin not found</em> or API message.</td>
          </tr>
          <tr>
            <td>Save clicked</td>
            <td>
              PATCH with editable fields only. Empty strings for optional fields become{' '}
              <code>null</code>. Toast on success or error.
            </td>
          </tr>
          <tr>
            <td>Admin edits own profile</td>
            <td>
              Same fields can be updated in admin portal. Last save wins — no conflict UI on CEO side.
            </td>
          </tr>
          <tr>
            <td>Admin deactivated</td>
            <td>
              Profile may still load but login is blocked. Reactivate or re-invite via branch
              details — not from this form.
            </td>
          </tr>
        </tbody>
      </table>

      <h2>Permissions</h2>
      <p>
        <strong>View and edit profile:</strong> <code>super_admin</code> only on this route. Branch
        admins edit their own profile in <code>/admin</code> but cannot open CEO admin profiles.
      </p>
      <p>
        <strong>Change email or branch:</strong> not available here. Email is login-bound. Branch
        assignment is set at invitation and typically changed only through technical processes.
      </p>
      <p>
        <strong>Remove admin:</strong> use <strong>Remove admin</strong> on{' '}
        <Link href="/docs/intro/ceo/branches/details">Branch Details</Link> — not the profile Save
        button. Removal deactivates credentials; academic data remains.
      </p>
      <p>
        <strong>Send credentials:</strong> branch admins send WhatsApp credential messages from student
        and teacher profiles in the admin portal. This CEO screen has no credential actions.
      </p>

      <DocCallout variant="tip" title="Who updates what">
        CEOs often set initial profile details when onboarding a new admin. Day-to-day updates can also
        be done by the admin themselves in the admin portal. Credential messages to staff and students
        go out from the admin portal via WhatsApp — not from this CEO profile screen.
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
            <td>&quot;Admin not found&quot;</td>
            <td>Invalid userId or deleted user</td>
            <td>Return to Admins list and click a valid row. Check URL userId.</td>
          </tr>
          <tr>
            <td>&quot;Update failed&quot; toast</td>
            <td>API validation or network error</td>
            <td>Retry Save. Check required formats (date field). Review backend logs.</td>
          </tr>
          <tr>
            <td>Email field grayed out</td>
            <td>By design — email is read-only</td>
            <td>Re-invite with correct email if wrong address was used at invitation.</td>
          </tr>
          <tr>
            <td>Changes not visible to admin</td>
            <td>Admin has stale session</td>
            <td>Ask admin to refresh or sign out and back in.</td>
          </tr>
          <tr>
            <td>Need to revoke access</td>
            <td>Profile edit does not deactivate login</td>
            <td>Use Remove admin on branch details page.</td>
          </tr>
        </tbody>
      </table>

      <DocFaq
        items={[
          {
            q: 'Can I change the admin\'s email from this page?',
            a: 'No. Email is read-only because it is tied to login. Use the correct email when creating the invitation. Contact technical support for exceptional email migrations.',
          },
          {
            q: 'Can I reassign this admin to a different branch here?',
            a: 'No. Branch appears in the header subtitle only. Reassignment requires deactivating and re-inviting with the correct branch, or a technical admin operation.',
          },
          {
            q: 'How do I send this admin their login details?',
            a: 'They set their own password during registration. For teachers and students, the branch admin uses Generate credentials and Send credentials (WhatsApp) from the admin portal — not this CEO page.',
          },
        ]}
      />

      <h2>Related guides</h2>
      <ul>
        <li>
          <Link href="/docs/intro/ceo/admins">Admins</Link> — open profiles from the list
        </li>
        <li>
          <Link href="/docs/intro/ceo/admins/invite">Invite Admin</Link> — before a profile exists
        </li>
        <li>
          <Link href="/docs/intro/ceo/branches/details">Branch Details</Link> — remove admin access
        </li>
        <li>
          <Link href="/docs/intro/ceo/permissions">CEO Permissions</Link> — CEO vs admin capabilities
        </li>
        <li>
          <Link href="/docs/intro/admin">Admin Portal overview</Link> — where admins work daily
        </li>
      </ul>
    </DocsShell>
  );
}
