import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep, DocFaq } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function StudentIntroPage() {
  return (
    <DocsShell
      title="Student Portal & App"
      subtitle="Optional web view; primary experience is mobile."
      nav={introNav}
      variant="intro"
    >
      <h2>Overview</h2>
      <p>
        Students access Mother Care School through the <strong>mobile app</strong> (primary) and an
        optional <strong>web portal</strong> at <code>/student</code>. Both surfaces are read-only for
        school data — you view fees, attendance, results, timetable, and announcements; you do not
        manage enrollment or grades.
      </p>
      <p>
        <strong>Why two surfaces:</strong> the mobile app combines academics with real-time chat
        (class community, announcements, system record rooms). The web portal is a lightweight browser
        experience for the same academic data when you are at a desktop — it does not include the full
        chat experience.
      </p>
      <p>
        <strong>Who uses it:</strong> accounts with the <code>student</code> role. CEOs (
        <code>super_admin</code>), branch admins, and teachers are routed to their own portals after
        sign-in.
      </p>

      <h2>Before you start</h2>
      <ul>
        <li>
          <strong>Account exists:</strong> your branch admin must enroll you and send login credentials.
          Credentials are delivered via <strong>WhatsApp</strong> when your phone number is on file and
          the school has WhatsApp configured — not by email from the CEO portal.
        </li>
        <li>
          <strong>Username and password:</strong> use the credentials from your admin. Same login works
          on mobile app and web.
        </li>
        <li>
          <strong>Active enrollment:</strong> data is scoped to your current branch, class, and academic
          year. Empty screens often mean enrollment is incomplete for the active year.
        </li>
        <li>
          <strong>Mobile recommended:</strong> for chat, class community, and push notifications, install
          the school&apos;s mobile build. See{' '}
          <Link href="/docs/intro/student/mobile-app">Student Mobile App</Link>.
        </li>
      </ul>

      <h2>Step-by-step: sign in on web</h2>
      <DocSteps>
        <DocStep title="Open the login page">
          Go to <code>/login</code> on your school&apos;s website. Enter the username and password from
          your WhatsApp credential message (or what your admin gave you in person).
        </DocStep>
        <DocStep title="Land on Student Dashboard">
          After sign-in, students route to <code>/student</code>. The page title greets you by first name
          with subtitle <em>Your school information — read only</em>.
        </DocStep>
        <DocStep title="Read summary cards">
          Three cards show <strong>Class</strong>, <strong>Attendance</strong> (percentage), and{' '}
          <strong>Fee balance</strong> (Rs amount). Values load from live API calls; em dashes appear
          while loading.
        </DocStep>
        <DocStep title="Use sidebar navigation">
          Open the menu (☰) for <strong>Dashboard</strong>, <strong>Timetable</strong>,{' '}
          <strong>Datesheets</strong>, <strong>Fees</strong>, <strong>Attendance</strong>,{' '}
          <strong>Results</strong>, <strong>Announcements</strong>, optional <strong>Canteen</strong>,
          and <strong>Profile</strong>.
        </DocStep>
        <DocStep title="Sign out">
          Choose <strong>Sign Out</strong> at the bottom of the sidebar when finished on a shared
          computer.
        </DocStep>
      </DocSteps>

      <h2>Web portal — pages and labels</h2>
      <table>
        <thead>
          <tr>
            <th>Sidebar label</th>
            <th>Route</th>
            <th>What you see</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Dashboard</td>
            <td><code>/student</code></td>
            <td>Summary cards, today&apos;s timetable slots, recent announcements, quick links</td>
          </tr>
          <tr>
            <td>Timetable</td>
            <td><code>/student/timetable</code></td>
            <td>Weekly period grid for your class</td>
          </tr>
          <tr>
            <td>Datesheets</td>
            <td><code>/student/datesheets</code></td>
            <td>Exam datesheets when published</td>
          </tr>
          <tr>
            <td>Fees</td>
            <td><code>/student/fees</code></td>
            <td>Fee summary, allocations, payment history (read-only)</td>
          </tr>
          <tr>
            <td>Attendance</td>
            <td><code>/student/attendance</code></td>
            <td>Attendance percentage and daily records</td>
          </tr>
          <tr>
            <td>Results</td>
            <td><code>/student/results</code></td>
            <td>Published exam results</td>
          </tr>
          <tr>
            <td>Announcements</td>
            <td><code>/student/announcements</code></td>
            <td>School and branch announcements</td>
          </tr>
          <tr>
            <td>Canteen</td>
            <td><code>/student/canteen</code></td>
            <td>Menu when branch enables canteen feature</td>
          </tr>
          <tr>
            <td>Profile</td>
            <td><code>/student/profile</code></td>
            <td>Your name, roll number, class, branch, academic year</td>
          </tr>
        </tbody>
      </table>

      <h2>Mobile app vs web</h2>
      <table>
        <thead>
          <tr>
            <th>Feature</th>
            <th>Mobile app</th>
            <th>Web portal</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Chats tab</td>
            <td>Yes — announcements, class community, DMs, system rooms</td>
            <td>No</td>
          </tr>
          <tr>
            <td>Academics (fees, attendance, results, etc.)</td>
            <td>Yes — Academics tab with sub-tabs</td>
            <td>Yes — separate sidebar pages</td>
          </tr>
          <tr>
            <td>Push notifications</td>
            <td>Yes — opens chat rooms</td>
            <td>No</td>
          </tr>
          <tr>
            <td>Offline chat cache</td>
            <td>Yes</td>
            <td>No</td>
          </tr>
          <tr>
            <td>Edit data</td>
            <td>No (read-only academics)</td>
            <td>No (read-only)</td>
          </tr>
        </tbody>
      </table>

      <h2>What happens when</h2>
      <table>
        <thead>
          <tr>
            <th>Event</th>
            <th>System behavior</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Admin enrolls you</td>
            <td>Student record tied to branch, class, academic year. Credentials can be sent via WhatsApp.</td>
          </tr>
          <tr>
            <td>Teacher marks attendance</td>
            <td>Attendance page and mobile Academics tab update on refresh. Mobile may show system room notification.</td>
          </tr>
          <tr>
            <td>Fee payment recorded</td>
            <td>Fee balance on dashboard decreases after reload.</td>
          </tr>
          <tr>
            <td>Results published</td>
            <td>Visible on Results page and mobile Academics → Results tab.</td>
          </tr>
          <tr>
            <td>Wrong role signs in</td>
            <td>Redirected to teacher, admin, or CEO portal — not student.</td>
          </tr>
          <tr>
            <td>Canteen hidden</td>
            <td>Branch feature flag <code>showCanteen</code> false — Canteen link omitted from nav.</td>
          </tr>
        </tbody>
      </table>

      <h2>Permissions</h2>
      <p>
        <strong>View own data:</strong> students see only their enrollment — one branch, one class,
        current academic year context. No access to other students&apos; records.
      </p>
      <p>
        <strong>Read-only:</strong> cannot edit fees, attendance, marks, or class lists on web or mobile.
      </p>
      <p>
        <strong>Chat posting:</strong> depends on class chat roles configured by teachers/admins. Some
        channels are read-only (school announcements). Subject groups may allow posting when permitted.
      </p>
      <p>
        <strong>System rooms:</strong> Attendance, Fees &amp; Payments, and Results system rooms are
        read-only — view records and notification updates, cannot post messages.
      </p>
      <p>
        <strong>CEO / admin:</strong> students cannot open <code>/ceo</code> or <code>/admin</code>.
      </p>

      <DocCallout variant="tip" title="Prefer the mobile app for daily use">
        Install the school&apos;s Android or iOS build for chat with teachers and classmates, system
        record notifications, and offline viewing. Use the web portal when you need a quick desktop
        check of fees or timetable.
      </DocCallout>

      <DocCallout variant="info" title="Getting your login details">
        Branch admins use <strong>Generate credentials</strong> and <strong>Send credentials</strong> on
        your student profile in the admin portal. Messages go to WhatsApp — ask your school office if you
        did not receive them. CEO invitation links are only for branch administrators, not students.
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
            <td>Cannot sign in</td>
            <td>Wrong credentials or inactive account</td>
            <td>Contact branch admin to resend credentials via WhatsApp or reset password.</td>
          </tr>
          <tr>
            <td>All data shows —</td>
            <td>Not enrolled for active year</td>
            <td>Ask admin to confirm class enrollment and academic year selection.</td>
          </tr>
          <tr>
            <td>Sent to /admin after login</td>
            <td>Account is not student role</td>
            <td>Use the portal matching your role or ask admin to fix role assignment.</td>
          </tr>
          <tr>
            <td>No Canteen in menu</td>
            <td>Feature disabled for branch</td>
            <td>Normal if your campus has not enabled canteen module.</td>
          </tr>
          <tr>
            <td>No chat on web</td>
            <td>Chat is mobile-only</td>
            <td>Install mobile app — see Mobile App guide.</td>
          </tr>
        </tbody>
      </table>

      <DocFaq
        items={[
          {
            q: 'How do I get my username and password?',
            a: 'Your branch admin generates credentials and sends them via WhatsApp to the phone number on your student record. If missing, contact the school office — CEOs do not send student credentials.',
          },
          {
            q: 'Can I use the same login on phone and computer?',
            a: 'Yes. The same username and password work on the mobile app and the web student portal.',
          },
          {
            q: 'Why is the mobile app recommended over web?',
            a: 'Chat (announcements, class community, teacher DMs, system record rooms) and push notifications are built into the mobile app. The web portal focuses on read-only academic pages without chat.',
          },
        ]}
      />

      <h2>Related guides</h2>
      <ul>
        <li>
          <Link href="/docs/intro/student/mobile-app">Student Mobile App</Link> — Chats, Academics, Profile tabs
        </li>
        <li>
          <Link href="/docs/intro/get-started">Get started</Link> — first sign-in and role routing
        </li>
        <li>
          <Link href="/docs/intro/admin">Admin Portal overview</Link> — how schools enroll students
        </li>
        <li>
          <Link href="/docs/intro/teacher/mobile-app">Teacher Mobile App</Link> — how teachers interact with students in chat
        </li>
      </ul>
    </DocsShell>
  );
}
