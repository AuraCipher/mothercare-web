import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep, DocFaq } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function StudentMobilePage() {
  return (
    <DocsShell
      title="Student Mobile App"
      subtitle="Academics, fees, attendance, results, and chat."
      nav={introNav}
      variant="intro"
    >
      <h2>Overview</h2>
      <p>
        The student mobile app is a Flutter application for Android and iOS. Install the build provided
        by your school and sign in with the same credentials sent via <strong>WhatsApp</strong> (or
        given by your admin). After bootstrap loads your branch, academic year, and class, you see
        three bottom tabs: <strong>Chats</strong>, <strong>Academics</strong>, and <strong>Profile</strong>.
      </p>
      <p>
        The app connects to a live WebSocket for real-time chat, caches landing data for offline
        viewing, and supports push notifications that open directly into a chat room when tapped.
      </p>
      <p>
        <strong>Read-only academics:</strong> you view fees, attendance, and results — you cannot edit
        school records. Chat posting depends on your class chat role; system record rooms are always
        read-only.
      </p>

      <h2>Before you start</h2>
      <ul>
        <li>
          <strong>Credentials:</strong> username and password from branch admin via WhatsApp{' '}
          <strong>Send credentials</strong> (or in person). CEO portal only invites branch admins — not
          students.
        </li>
        <li>
          <strong>App install:</strong> use the APK, Play Store, or TestFlight link your school provides.
        </li>
        <li>
          <strong>Enrollment:</strong> admin must assign you to a class for the active academic year.
          Empty chat or academics usually means setup is incomplete.
        </li>
        <li>
          <strong>Notifications:</strong> allow push notifications when prompted for attendance, fee,
          and chat alerts.
        </li>
      </ul>

      <h2>App structure — bottom navigation</h2>
      <table>
        <thead>
          <tr>
            <th>Tab</th>
            <th>Icon</th>
            <th>Purpose</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Chats</td>
            <td>Chat bubble</td>
            <td>Announcements, class community, direct messages, School Records system rooms</td>
          </tr>
          <tr>
            <td>Academics</td>
            <td>Menu book</td>
            <td>Fees, Attendance, Results, Timetable, Datesheets, Canteen (horizontal sub-tabs)</td>
          </tr>
          <tr>
            <td>Profile</td>
            <td>Person</td>
            <td>Account details, branch/year context, Logout</td>
          </tr>
        </tbody>
      </table>
      <p>
        The Chats tab shows an unread badge on the nav icon when you have unread messages (capped at{' '}
        <strong>99+</strong>).
      </p>

      <h2>Chats tab — landing screen</h2>
      <p>
        The chat landing loads pinned tiles and scrollable sections. Pull down to refresh. If you were
        offline, an offline banner appears and cached rooms remain visible until sync succeeds. Header
        shows your <strong>branch name</strong>; menu icon (top-right) opens branch, academic year,
        class, and <strong>Logout</strong>.
      </p>

      <h3>School announcement (pinned)</h3>
      <p>
        When enabled, a <strong>school announcement</strong> tile (<code>school_announcement</code>)
        appears at the top with violet highlight. Tap to read branch-wide notices. This channel is{' '}
        <strong>read-only</strong> for students — no message composer.
      </p>

      <h3>Class community</h3>
      <p>
        If your class has community rooms, a tile shows your class name with subtitle{' '}
        <em>Class community</em> and a groups icon. Tap to open class announcement and subject group
        chats. Unread badge aggregates across all rooms in the community.
      </p>

      <h3>Messages (direct)</h3>
      <DocSteps>
        <DocStep title="View existing DMs">
          One-to-one threads appear under the <strong>Messages</strong> section heading. Tap a thread
          to open the chat room when <code>canPost</code> allows.
        </DocStep>
        <DocStep title="Start a new message">
          Tap the floating <strong>New message</strong> button (bottom-right). Contact picker opens
          with searchable teachers and classmates allowed by chat roles.
        </DocStep>
        <DocStep title="Pick a contact">
          Tap a name to open or create a DM. You cannot message yourself. Some contacts may be hidden
          if chat roles disallow DMs.
        </DocStep>
      </DocSteps>

      <h3>School Records (system rooms)</h3>
      <p>
        Under the <strong>School Records</strong> section heading, up to three automated system rooms
        appear (when enabled by your school), in this order:
      </p>
      <table>
        <thead>
          <tr>
            <th>Tile title</th>
            <th>Kind</th>
            <th>Subtitle</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Attendance</td>
            <td><code>system_attendance</code></td>
            <td>View all attendance records</td>
          </tr>
          <tr>
            <td>Fees &amp; Payments</td>
            <td><code>system_payment</code></td>
            <td>Fees, payments &amp; receipts</td>
          </tr>
          <tr>
            <td>Results</td>
            <td><code>system_result</code></td>
            <td>Published exam results</td>
          </tr>
        </tbody>
      </table>
      <p>
        Each system room opens a two-tab screen with header showing the record name and academic year:
      </p>
      <ul>
        <li>
          <strong>All records</strong> — live read-only panel (same data as Academics sub-tabs:
          attendance list, fees summary, or results)
        </li>
        <li>
          <strong>Updates</strong> — read-only notification feed when admin records attendance, posts
          fees, or publishes results. Shows <em>No updates yet</em> when empty.
        </li>
      </ul>
      <p>You cannot post messages in system rooms.</p>

      <h2>Academics tab</h2>
      <p>
        Horizontal scrollable sub-tabs across the top (violet indicator). Six tabs when canteen is
        enabled for your branch:
      </p>
      <table>
        <thead>
          <tr>
            <th>Tab label</th>
            <th>Content</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Fees</td>
            <td>Fee summary, allocations, balance due, payment history (read-only)</td>
          </tr>
          <tr>
            <td>Attendance</td>
            <td>Percentage summary and daily attendance log</td>
          </tr>
          <tr>
            <td>Results</td>
            <td>Published exam results for your enrollment</td>
          </tr>
          <tr>
            <td>Timetable</td>
            <td>Weekly period grid — subject, teacher, period number, times</td>
          </tr>
          <tr>
            <td>Datesheets</td>
            <td>Exam schedule when admin publishes datesheets</td>
          </tr>
          <tr>
            <td>Canteen</td>
            <td>Menu and items when branch enables canteen feature</td>
          </tr>
        </tbody>
      </table>
      <p>
        Academics panels require a live API connection. They do not cache offline the way chat landing
        does.
      </p>

      <h2>Profile tab</h2>
      <p>Displays your account card with:</p>
      <ul>
        <li>Name and <strong>Student</strong> role label</li>
        <li>Roll number</li>
        <li>Class (group label)</li>
        <li>Branch</li>
        <li>Academic year</li>
        <li>Email and username (when set)</li>
        <li>Admission date (formatted)</li>
      </ul>
      <p>
        Tap <strong>Logout</strong> to clear local session and chat cache, returning to the login
        screen.
      </p>

      <h2>Step-by-step: daily workflow</h2>
      <DocSteps>
        <DocStep title="Sign in">
          Open the app, enter credentials from WhatsApp. Wait for bootstrap (branch, year, class).
        </DocStep>
        <DocStep title="Check Chats">
          Read school announcement and class community posts. Open <strong>School Records</strong> for
          fee or attendance updates.
        </DocStep>
        <DocStep title="Review Academics">
          Switch to <strong>Academics</strong> tab — check <strong>Fees</strong> balance and{' '}
          <strong>Attendance</strong> percentage.
        </DocStep>
        <DocStep title="Message a teacher">
          From Chats, tap <strong>New message</strong>, pick an allowed teacher, send your question.
        </DocStep>
        <DocStep title="Confirm Profile">
          Profile tab verifies roll number and class match your physical classroom.
        </DocStep>
      </DocSteps>

      <h2>What happens when</h2>
      <table>
        <thead>
          <tr>
            <th>Event</th>
            <th>App behavior</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Teacher marks you absent/present</td>
            <td>Attendance panel updates on refresh. System room may get an Update notification.</td>
          </tr>
          <tr>
            <td>Fee payment recorded</td>
            <td>Fees panel and system_payment Updates tab reflect new balance.</td>
          </tr>
          <tr>
            <td>Results published</td>
            <td>Results tab and system_result room show new marks.</td>
          </tr>
          <tr>
            <td>Push notification tapped</td>
            <td>App switches to Chats and opens the relevant room.</td>
          </tr>
          <tr>
            <td>Network lost during chat</td>
            <td>Offline banner; cached landing still visible. Retry when online.</td>
          </tr>
          <tr>
            <td>Open system room</td>
            <td>Socket joins room and marks read; unread badge clears locally.</td>
          </tr>
        </tbody>
      </table>

      <h2>Permissions</h2>
      <p>
        <strong>Academics:</strong> read-only view of your own enrollment data only.
      </p>
      <p>
        <strong>School announcement:</strong> read-only for students.
      </p>
      <p>
        <strong>Class community / subject groups:</strong> posting allowed only when your chat role
        permits. Teachers configure roles on the web portal.
      </p>
      <p>
        <strong>Direct messages:</strong> can message teachers (and sometimes classmates) allowed by
        class chat settings. Cannot DM CEO (<code>super_admin</code>).
      </p>
      <p>
        <strong>System rooms:</strong> read-only — <strong>All records</strong> and{' '}
        <strong>Updates</strong> tabs only; no composer.
      </p>

      <DocCallout variant="warn" title="Posting in class groups">
        If you cannot reply in a subject group, your chat role may have group posting disabled. Ask
        your class teacher to check <strong>Chat roles</strong> on the web admin portal.
      </DocCallout>

      <h2>Offline behavior</h2>
      <p>
        Chat landing and messages cache locally. If sync fails, you see an offline banner but can still
        read cached rooms. Pull to refresh when back online. Academics tabs need connectivity to load
        fees, attendance, and results.
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
            <td>&quot;No chat rooms yet&quot;</td>
            <td>Enrollment or chat not configured</td>
            <td>Ask admin to confirm class assignment and chat setup for your year.</td>
          </tr>
          <tr>
            <td>Cannot post in group chat</td>
            <td>Chat role restricts posting</td>
            <td>Class teacher updates your chat role on web portal.</td>
          </tr>
          <tr>
            <td>Teacher not in contact picker</td>
            <td>DM not allowed for that role</td>
            <td>Use class community or ask teacher to enable student DMs.</td>
          </tr>
          <tr>
            <td>Academics tabs empty</td>
            <td>No data for active year or offline</td>
            <td>Check network. Confirm enrollment with school office.</td>
          </tr>
          <tr>
            <td>No School Records section</td>
            <td>System rooms not provisioned</td>
            <td>Normal on fresh setup — use Academics tab directly for data.</td>
          </tr>
          <tr>
            <td>Did not receive login WhatsApp</td>
            <td>Missing phone or WhatsApp config</td>
            <td>Ask admin to verify phone on your profile and resend credentials.</td>
          </tr>
        </tbody>
      </table>

      <DocFaq
        items={[
          {
            q: 'Why can\'t I reply in the School Announcement channel?',
            a: 'School announcements are read-only for students by design. Use class community subject groups or DMs (when allowed) to reach teachers.',
          },
          {
            q: 'What is the difference between Academics → Fees and the Fees & Payments system room?',
            a: 'Both show the same fee data. The system room also has an Updates tab with notification messages when payments are recorded. Academics is a quick tabbed view; system rooms combine records with a chat-style update feed.',
          },
          {
            q: 'Can I use the app without WhatsApp credentials?',
            a: 'You need a username and password from your school. WhatsApp is how admins typically deliver them — ask the office in person if you did not receive the message.',
          },
        ]}
      />

      <h2>Related guides</h2>
      <ul>
        <li>
          <Link href="/docs/intro/student">Student Portal overview</Link> — web portal at <code>/student</code>
        </li>
        <li>
          <Link href="/docs/intro/get-started">Get started</Link> — sign-in and credentials
        </li>
        <li>
          <Link href="/docs/intro/teacher/mobile-app">Teacher Mobile App</Link> — how teachers use chat with you
        </li>
        <li>
          <Link href="/docs/intro/admin">Admin Portal overview</Link> — enrollment and credential sending
        </li>
      </ul>
    </DocsShell>
  );
}
