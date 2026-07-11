import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocFaq, DocSection, DocTable } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function TeacherPermissionsPage() {
  return (
    <DocsShell
      title="Teacher Permissions"
      subtitle="What teachers can and cannot do — on web, mobile, and in chat."
      nav={introNav}
      variant="intro"
    >
      <h2>Overview</h2>
      <p>
        Teacher access is controlled by three layers: your <strong>account role</strong> (must be{' '}
        <code>teacher</code>), your <strong>subject and class assignments</strong> (what data you
        see), and optional <strong>portal permissions</strong> set by your branch admin (what
        features you can use). Chat posting is a fourth layer managed separately through app
        permissions and class roles.
      </p>
      <p>
        Unlike admin staff, teachers do not have per-module ERP access (fees, payroll setup, student
        enrollment). Those screens live in the admin portal at <code>/admin</code> and require a{' '}
        <code>management</code> account.
      </p>

      <DocSection title="Assignment-based access">
        <p>
          The system only shows classes and subjects you are actively assigned to. If you teach
          Mathematics in Grade 8A, you see that class&apos;s roster, attendance grid, and marks
          entry for Mathematics — not other subjects in the same class unless you are also assigned
          to them.
        </p>
        <DocTable
          headers={['Data', 'Scope rule']}
          rows={[
            ['Class roster', 'Assigned subjects in that class, or class teacher for the whole class'],
            ['Attendance marking', 'Classes where you are class teacher or have attendance permission'],
            ['Marks entry', 'Exam subjects linked to your assignment only'],
            ['Timetable', 'Your periods across all assignments'],
            ['HOD department view', 'Only if designated HOD for a subject department'],
          ]}
        />
        <DocCallout variant="info" title="Class teacher vs subject teacher">
          A <strong>class teacher</strong> is assigned to an entire section (e.g. 8A). They can
          manage class-level chat roles, see all students in the class, and typically mark daily
          attendance. A <strong>subject teacher</strong> only sees students in the context of their
          subject assignment.
        </DocCallout>
      </DocSection>

      <DocSection title="Portal permission levels">
        <p>
          Branch admins configure teacher portal access from the teacher profile in the admin ERP
          (<strong>Portal permissions</strong>). Each feature can be set to inherit (default),
          allow, or deny.
        </p>
        <DocTable
          headers={['Feature', 'Web portal', 'Typical default']}
          rows={[
            ['Classes & roster', '/teacher/my-classes, class pages', 'Allowed'],
            ['Timetable', '/teacher/timetable', 'Allowed'],
            ['Attendance', 'View + mark grids', 'Allowed if branch permits teachers to mark'],
            ['Marks', 'View tables + enter grid', 'Allowed if branch permits teachers to enter marks'],
            ['HOD', '/teacher/hod/*', 'Allowed only when HOD designation exists'],
            ['Announcements', '/teacher/announcements', 'Read-only feed'],
            ['Notifications', 'In-app notification center', 'Allowed'],
            ['Profile', 'Self-service contact info', 'Allowed; password via /login'],
            ['Parent contact', 'View parent details on roster', 'Branch setting dependent'],
          ]}
        />

        <h3>Portal access modes</h3>
        <DocTable
          headers={['Mode', 'Effect']}
          rows={[
            [<strong>FULL</strong>, 'Normal read/write (subject to archived year rules)'],
            [<strong>READ_ONLY</strong>, 'Can view data but cannot save attendance or marks'],
            [<strong>FROZEN</strong>, 'Only dashboard and profile accessible — account suspended'],
          ]}
        />
        <DocCallout variant="warn" title="Frozen accounts">
          If your portal shows limited navigation and you cannot access classes, your account may be
          frozen. Contact your branch administrator — only they can restore FULL access.
        </DocCallout>
      </DocSection>

      <DocSection title="Academic year restrictions">
        <p>
          When an academic year is <strong>archived</strong> or <strong>on hold</strong>, write
          actions are blocked across teacher portals:
        </p>
        <ul>
          <li>Cannot save attendance batches</li>
          <li>Cannot enter or update exam marks</li>
          <li>Cannot create or assign class chat roles</li>
          <li>Can still view historical marks, attendance, and timetables</li>
        </ul>
        <p>
          The teacher dashboard shows a <strong>Read only</strong> badge instead of{' '}
          <strong>Active</strong> when the selected year is not writable.
        </p>
      </DocSection>

      <DocSection title="Chat & mobile app permissions">
        <p>
          Chat lives primarily in the mobile app. Whether you can post in a room is determined by the
          API <code>canPost</code> flag — never by a local app setting.
        </p>
        <DocTable
          headers={['Room type', 'Default posting rule']}
          rows={[
            ['School announcements', 'Admins only; teachers if explicitly appointed'],
            ['Class announcements', 'Class teacher + appointed teachers'],
            ['Subject group chats', 'Subject teacher; students with class roles'],
            ['Teachers channel', 'Admins + appointed teachers'],
            ['Direct messages', 'DM policy + your app permission for DMs'],
            ['System rooms (My Attendance, My Payroll)', 'Read only — school posts automatically'],
          ]}
        />

        <h3>App permission toggles (admin-configured)</h3>
        <p>Your branch admin can fine-tune mobile chat behavior per teacher:</p>
        <ul>
          <li>Post in school announcement channel</li>
          <li>Post in teachers announcement channel</li>
          <li>Post in class announcement channels</li>
          <li>Post in subject group chats</li>
          <li>Send and receive direct messages</li>
          <li>Attach files in messages</li>
        </ul>
        <p>
          If the composer is hidden in a room, your admin has not granted posting permission for
          that channel type — not a bug in the app.
        </p>
      </DocSection>

      <DocSection title="Class teacher — chat role management">
        <p>
          Class teachers can define <strong>student roles</strong> (monitor, prefect, etc.) from the
          web portal class page (<strong>Chat roles</strong>). Each role controls:
        </p>
        <DocTable
          headers={['Permission', 'What it controls']}
          rows={[
            ['canPostInGroups', 'Student can post in subject group chats'],
            ['canReceiveDms', 'Student can receive direct messages'],
            ['canInitiateDms', 'Student can start DMs from the contact picker'],
            ['isMessagingRestricted', 'Blocks messaging for a specific student regardless of role'],
          ]}
        />
        <p>
          Changes apply immediately on student mobile apps after the next bootstrap sync. You cannot
          manage chat roles from the mobile app — use the web portal.
        </p>
        <DocCallout variant="tip" title="Who can edit class roles?">
          Only the <strong>class teacher</strong> for that section, or an admin from the ERP. Subject
          teachers who are not class teachers cannot create or assign class roles.
        </DocCallout>
      </DocSection>

      <DocSection title="Head of Department (HOD)">
        <p>
          When your branch admin designates you as HOD for a subject department, additional tools
          appear:
        </p>
        <ul>
          <li>
            <strong>Web:</strong> <code>/teacher/hod/marks</code> — department-wide marks overview
            across all classes for your subject
          </li>
          <li>
            <strong>Mobile:</strong> HOD tab in Workspace (if HOD permission is allowed)
          </li>
        </ul>
        <p>
          HOD access is read-focused for oversight. Entering marks still happens through your own
          subject assignments unless admin portal permissions grant HOD enter access.
        </p>
      </DocSection>

      <DocSection title="What teachers cannot do">
        <ul>
          <li>Create or enroll students — admin ERP only</li>
          <li>Configure fee structures, collect payments, or view other students&apos; fee details</li>
          <li>Manage staff accounts or module permissions</li>
          <li>Publish or archive academic years</li>
          <li>Change branch-level chat settings</li>
          <li>Access CEO panel, API keys, or branch admin invitations</li>
          <li>View another teacher&apos;s payroll (only your own via My Payroll)</li>
          <li>Override archived-year write blocks without admin <code>archived_ay_access</code></li>
        </ul>
      </DocSection>

      <DocSection title="Multi-branch teachers">
        <p>
          If you teach at multiple campuses, your account may list several branches. Use the branch
          switcher in the web portal header to change context. Mobile bootstrap loads your primary
          branch — contact admin if assignments at another branch do not appear after switching.
        </p>
      </DocSection>

      <h2>Common questions</h2>
      <DocFaq
        items={[
          {
            q: 'I can see a class but cannot enter marks.',
            a: (
              <>
                You may be class teacher without a subject assignment for that exam, or marks entry
                may be denied in your portal permissions. Ask your admin to verify your assignment
                and the <strong>marks.enter</strong> permission.
              </>
            ),
          },
          {
            q: 'The chat composer is missing in the class announcement room.',
            a: 'Class announcements are read-only for most teachers. Only the class teacher and admin-appointed teachers can post. Check with your branch admin if you need posting access.',
          },
          {
            q: 'I am both a teacher and an admin staff member.',
            a: (
              <>
                These are separate accounts in normal setups. Admin ERP access requires a{' '}
                <code>management</code> login. Your teacher account cannot open <code>/admin</code>{' '}
                unless the role was changed.
              </>
            ),
          },
          {
            q: 'Students say they cannot DM me.',
            a: 'Their class role may block initiating DMs, or your app permission may disable receiving DMs. Class teachers can adjust student roles; admins adjust teacher app permissions.',
          },
          {
            q: 'Where is the full permission reference for engineers?',
            a: (
              <>
                See <Link href="/docs/api/endpoints">REST Endpoints</Link> for{' '}
                <code>/teacher/*</code> routes and <Link href="/docs/api/chat">Chat docs</Link> for
                posting rules. Portal permission JSON is stored on the teacher profile in the admin
                ERP.
              </>
            ),
          },
        ]}
      />

      <p>
        Related: <Link href="/docs/intro/teacher">Teacher guide</Link> ·{' '}
        <Link href="/docs/intro/teacher/mobile-app">Mobile app</Link> ·{' '}
        <Link href="/docs/intro/admin/permissions">Admin permissions</Link>
      </p>
    </DocsShell>
  );
}
