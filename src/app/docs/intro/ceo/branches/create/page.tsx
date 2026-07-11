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
      <p>
        Use this when you open a new location or want a separate campus in the system. Each branch
        gets its own admin, students, and academic years.
      </p>

      <h2>Step-by-step</h2>
      <DocSteps>
        <DocStep title="Open the Branches page">
          In the CEO portal, go to <strong>Branches</strong> (or use the dashboard quick action).
        </DocStep>
        <DocStep title="Click Add Branch">
          The create form opens in a dialog.
        </DocStep>
        <DocStep title="Fill in required fields">
          <ul>
            <li>
              <strong>Branch Name</strong> — display name (for example &quot;Mother Care
              Sohan&quot;).
            </li>
            <li>
              <strong>Branch Code</strong> — short unique ID, stored in uppercase (for example{' '}
              <code>MCS-SOHAN</code>). Used in API keys and internal references. Choose carefully;
              it cannot be edited later.
            </li>
          </ul>
        </DocStep>
        <DocStep title="Add optional contact details">
          Address, phone, and email help staff identify the campus. They are not required to create
          the branch.
        </DocStep>
        <DocStep title="Click Create Branch">
          On success, the new campus appears in your branches list. You can edit contact details
          anytime from the list.
        </DocStep>
        <DocStep title="Invite a branch admin">
          Go to <Link href="/docs/intro/ceo/admins/invite">Invite Admin</Link> and assign someone
          to this branch so they can set up classes and enroll students.
        </DocStep>
      </DocSteps>

      <h2>Field reference</h2>
      <table>
        <thead>
          <tr>
            <th>Field</th>
            <th>Required</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Branch Name</td>
            <td>Yes</td>
            <td>Shown everywhere in the app.</td>
          </tr>
          <tr>
            <td>Branch Code</td>
            <td>Yes</td>
            <td>Unique, uppercase. Used when scoping API keys to one branch.</td>
          </tr>
          <tr>
            <td>Address</td>
            <td>No</td>
            <td>Street or area, for reference.</td>
          </tr>
          <tr>
            <td>Phone</td>
            <td>No</td>
            <td>Campus contact number.</td>
          </tr>
          <tr>
            <td>Email</td>
            <td>No</td>
            <td>Campus email address.</td>
          </tr>
        </tbody>
      </table>

      <DocCallout variant="info" title="Duplicate codes">
        If creation fails, the branch code may already be in use. Pick a different code and try
        again.
      </DocCallout>

      <p>
        Next: <Link href="/docs/intro/ceo/branches/details">Branch details</Link> ·{' '}
        <Link href="/docs/intro/ceo/admins/invite">Invite an admin</Link>
      </p>
    </DocsShell>
  );
}
