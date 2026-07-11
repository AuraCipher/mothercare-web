import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep, DocFaq } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function TeacherMobilePage() {
  return (
    <DocsShell
      title="Teacher Mobile App"
      subtitle="Chats, workspace, and profile on Android/iOS."
      nav={introNav}
      variant="intro"
    >
      <h2>Overview</h2>
      <p>
        The teacher mobile app is a Flutter application for Android and iOS. Install the build
        provided by your school and sign in with the same credentials as the web portal. After
        bootstrap loads your branch, academic year, and assignments, you see three bottom tabs:{' '}
        <strong>Chats</strong>, <strong>Workspace</strong>, and <strong>Profile</strong>.
      </p>
      <p>
        The app connects to a live WebSocket for real-time chat, caches landing data for offline
        viewing, and supports push notifications when you tap a notification to jump directly into a
        chat room.
      </p>

      <h2>App structure</h2>
      <ul>
        <li><strong>Chats</strong> — announcements, class communities, direct messages, personal record rooms</li>
        <li><strong>Workspace</strong> — classes list, today&apos;s attendance, results, timetable, HOD panel</li>
        <li><strong>Profile</strong> — account details, branch/year context, sign out</li>
      </ul>
      <p>
        Tap the menu icon (top-right on Chats) to see branch name, academic year, your name, assignment
        count, and a logout shortcut.
      </p>

      <h2>Chats tab — landing screen</h2>
      <p>
        The chat landing loads pinned tiles and scrollable sections. Pull down to refresh. If you
        were offline, a banner appears and cached rooms remain visible until sync succeeds.
      </p>

      <h3>Pinned announcements</h3>
      <p>Two announcement channels may appear at the top:</p>
      <ul>
        <li>
          <strong>School Announcement</strong> (<code>school_announcement</code>) — branch-wide
          notices from administration. <strong>Read-only</strong>: you can read messages but the
          composer is hidden and a &quot;Read-only channel&quot; bar appears at the bottom.
        </li>
        <li>
          <strong>Teacher Announcement</strong> (<code>teacher_announcement</code>) — notices aimed
          at teaching staff. Also read-only for most teachers unless your role has post permission on
          this channel.
        </li>
      </ul>

      <h3>Messages (direct)</h3>
      <p>
        Existing one-to-one DM threads appear under <strong>Messages</strong>. Tap a thread to open
        the chat room. You can send text, images, documents, and voice notes in DMs where{' '}
        <code>canPost</code> is true.
      </p>
      <DocSteps>
        <DocStep title="Start a new DM">
          Tap the floating <strong>New message</strong> button (bottom-right). The contact picker
          opens with searchable sections grouped by role and class.
        </DocStep>
        <DocStep title="Pick a contact">
          Tap a name to open or create a DM thread. The picker filters out <strong>your own
          account</strong> — you cannot message yourself.
        </DocStep>
        <DocStep title="CEO is not available">
          The organization owner (<code>super_admin</code> / CEO) does not appear in teacher contact
          lists. DM threads with the CEO are also hidden from the main Messages list. This is
          intentional — use official announcement channels for school-wide communication.
        </DocStep>
      </DocSteps>

      <h3>My Records (system rooms)</h3>
      <p>
        Two automated system rooms appear under <strong>My Records</strong> when your school has
        enabled them:
      </p>
      <ul>
        <li>
          <strong>My Attendance</strong> (<code>system_teacher_attendance</code>) — staff attendance
          log plus a notification feed when admin records your presence
        </li>
        <li>
          <strong>My Payroll</strong> (<code>system_teacher_payroll</code>) — salary payment history
          plus notifications when payroll is processed
        </li>
      </ul>
      <p>
        Each system room opens a two-tab screen: <strong>Records</strong> (live data panel — same as
        web My Attendance / My Payroll) and <strong>Updates</strong> (read-only notification
        messages). You cannot post in system rooms.
      </p>

      <h3>My Classes (class communities)</h3>
      <p>
        One tile per class you teach. Tap to drill into the <strong>class community</strong> screen:
      </p>
      <ul>
        <li>
          <strong>Class Announcement</strong> — pinned at top. Class teachers and admins post here;
          subject teachers may have read access. Students see this as read-only.
        </li>
        <li>
          <strong>Subject groups</strong> — one group chat per subject assignment (e.g. &quot;Grade 8A
          — Mathematics&quot;). Post here for subject-specific discussion with students who have
          permission.
        </li>
      </ul>
      <p>
        Unread badges aggregate across all rooms in a community. Opening a room marks it read via
        WebSocket.
      </p>

      <h3>Inside a chat room</h3>
      <ul>
        <li>Scroll through message history; pull to load older messages</li>
        <li>Send text when <code>canPost</code> is true</li>
        <li>Attach images, documents, or hold-to-record voice notes from the composer bar</li>
        <li>Long-press your own messages to delete (where allowed)</li>
        <li>Read-only rooms show a gray bar: &quot;Read-only channel&quot; — no composer</li>
      </ul>

      <DocCallout variant="warn" title="Posting in class groups">
        Students need chat role permission to post in subject groups or initiate DMs. Class teachers
        configure these roles on the web portal under <strong>Chat roles</strong> for their class.
        Changes apply immediately on mobile.
      </DocCallout>

      <h2>Workspace tab</h2>
      <p>
        Horizontal tabs across the top. Scroll tabs left/right on smaller phones. HOD tab appears only
        when <code>bootstrap.isHod</code> is true.
      </p>

      <h3>Classes</h3>
      <p>
        Lists your subject assignments with class and subject names. Quick overview — open web portal
        for deep class management.
      </p>

      <h3>Today&apos;s Attendance</h3>
      <DocSteps>
        <DocStep title="Select class and date">
          Pick from assigned classes. Defaults to today.
        </DocStep>
        <DocStep title="Mark students">
          Same statuses as web — Present, Absent, etc. Respects branch{' '}
          <code>teachersCanMarkAttendance</code> flag; view-only if disabled.
        </DocStep>
        <DocStep title="Submit">
          Save the sheet. Students may receive a system room notification on their app.
        </DocStep>
      </DocSteps>

      <h3>Results</h3>
      <p>Read-only summary of exam results for your assignments — not a full marks editor. Use web Marks for entry.</p>

      <h3>Timetable</h3>
      <p>Weekly period grid for your assignments. Matches web timetable data.</p>

      <h3>HOD (Head of Department)</h3>
      <p>
        Department subject overview — lists every subject in your HOD department with assignment
        metadata. For full marks monitoring and grid access, use{' '}
        <Link href="/docs/intro/teacher">web HOD marks</Link>.
      </p>

      <h2>Profile tab</h2>
      <p>
        Shows your name, HOD badge when applicable, branch, academic year, employee ID,
        qualification, phone, email, username, and joining date. Sign out clears local chat cache and
        returns to the login screen.
      </p>

      <h2>Push notifications</h2>
      <p>
        Allow notifications when prompted. Tapping a push opens the relevant chat room directly. The
        app switches to the Chats tab and navigates into the room. Ensure you are signed in on only
        one device if you notice duplicate notifications.
      </p>

      <h2>Offline behavior</h2>
      <p>
        Chat landing and messages cache locally. If sync fails, you see an offline banner but can
        still read cached rooms. Outgoing messages queue as pending bubbles until connectivity
        returns. Workspace panels require a live API connection to load attendance and results.
      </p>

      <h2>Related guides</h2>
      <ul>
        <li><Link href="/docs/intro/teacher">Teacher portal overview</Link> — web modules in depth</li>
        <li><Link href="/docs/intro/teacher/permissions">Teacher permissions</Link> — what you can and cannot do</li>
        <li><Link href="/docs/intro/get-started">Get started</Link> — sign-in and role routing</li>
      </ul>

      <DocFaq
        items={[
          {
            q: 'Why can\'t I post in the School Announcement channel?',
            a: 'Announcement channels are read-only for teachers by design. Only authorized admin staff can post school-wide. Use class announcement or subject group chats for your own messages.',
          },
          {
            q: 'A student says they cannot reply in our group chat.',
            a: 'Check Chat roles on the web class page. The student\'s assigned role may have "Can post in groups" disabled. Class teachers and admins can update roles.',
          },
          {
            q: 'I don\'t see the HOD tab.',
            a: 'The HOD tab appears only when admin has designated you Head of Department for at least one subject. Contact your branch admin if this is incorrect.',
          },
        ]}
      />
    </DocsShell>
  );
}
