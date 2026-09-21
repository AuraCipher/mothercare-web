import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocTable, DocSection, DocFaq } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function ChatPage() {
  return (
    <DocsShell
      title="Chat"
      subtitle="Real-time messaging for teachers, students, and staff — rooms, messages, and direct messages."
      nav={introNav}
      variant="intro"
    >
      <DocSection title="Overview">
        <p>
          The <strong>Chat</strong> module provides real-time messaging through the mobile app for
          teachers, students, and admin staff. It supports group rooms (announcements, class
          communities), direct messages, and automated system rooms. The mobile app is the primary
          chat interface; the web portal offers a read-only announcements view.
        </p>
        <p>
          <strong>Who uses it:</strong> teachers, students, and branch admin staff. Each role sees
          different room types and posting permissions based on their account configuration.
        </p>
      </DocSection>

      <DocSection title="Chat tab layout">
        <p>
          The <strong>Chats</strong> tab on mobile shows a scrollable list of all rooms you have
          access to. Each row displays the room name, last message preview, timestamp, and an unread
          badge if new messages exist. A search bar at the top filters rooms by name.
        </p>
        <p>
          Rooms are ordered by most-recent-activity. System rooms appear alongside user-created rooms
          in the same list.
        </p>
      </DocSection>

      <DocSection title="Room types">
        <DocTable
          headers={['Room type', 'Scope', 'Who can post', 'Notes']}
          rows={[
            ['School Announcement', 'Branch-wide', 'Admin, designated teachers', 'Read-only for students'],
            ['Teacher Announcement', 'All teachers', 'Admin, designated teachers', 'Teacher-only channel'],
            ['Class Announcement', 'Per class section', 'Class teacher, admin', 'Read-only for students in that class'],
            ['Class Community / Group Chat', 'Per class section', 'Configurable by roles', 'Students may post if enabled'],
            ['Direct Messages', '1:1 private', 'Both participants', 'Private conversation between two users'],
            ['System Rooms', 'Branch-scoped', 'System (automated)', 'Read-only feeds: Attendance, Fees, Results, etc.'],
          ]}
        />
      </DocSection>

      <DocSection title="Room details">
        <h3>Announcement rooms</h3>
        <p>
          Announcement rooms are <strong>read-only</strong> for most users. Only admins and
          designated teachers can post. Students see announcements but cannot reply — this keeps
          official communication clear and uncluttered.
        </p>
        <h3>Class Community / Group Chat</h3>
        <p>
          These rooms allow conversation based on role configuration. A teacher or admin defines
          which roles can post — for example, &quot;teachers and class rep students can post, all
          students can view.&quot; This flexibility supports class discussions, homework help, and
          peer interaction.
        </p>
        <h3>Direct Messages</h3>
        <p>
          Private 1:1 conversations between any two users. Useful for personal communication that
          should not be in a group room. You cannot message yourself.
        </p>
        <h3>System rooms</h3>
        <p>
          Automated feeds that display system-generated notifications. These are read-only and
          populate with attendance alerts, fee receipts, result publications, and payroll updates.
          See <Link href="/docs/intro/notifications">Notifications</Link> for details.
        </p>
      </DocSection>

      <DocSection title="Sending a message">
        <ul>
          <li><strong>Text:</strong> type in the message input at the bottom of the room and tap send.</li>
          <li><strong>Attachments:</strong> use the attachment icon to share images or files from your device.</li>
          <li><strong>Permission check:</strong> if you do not have posting permission in a room, the input is hidden or disabled.</li>
        </ul>
      </DocSection>

      <DocSection title="Reading messages">
        <p>
          Unread messages show a <strong>badge count</strong> on the room row in the Chats tab list.
          Opening the room clears the badge. The last message preview in the list updates in
          real-time as new messages arrive.
        </p>
      </DocSection>

      <DocSection title="Contact picker rules">
        <ul>
          <li>You <strong>cannot message yourself</strong> — your own name is excluded from the contact picker.</li>
          <li>The <strong>CEO</strong> is hidden from the contact picker for non-CEO roles.</li>
          <li>Direct message conversations are created on first message and persist in your chat list.</li>
        </ul>
      </DocSection>

      <DocSection title="Chat roles">
        <p>
          Who can post in a group chat is configurable per room. The room creator or admin sets
          posting permissions — typically one of:
        </p>
        <ul>
          <li><strong>Everyone can post</strong> — open discussion room.</li>
          <li><strong>Teachers only</strong> — students observe, teachers communicate.</li>
          <li><strong>Selected roles</strong> — e.g. teachers + class representatives.</li>
        </ul>
        <DocCallout variant="info" title="Announcements are different">
          Announcement rooms are always restricted to admin/teacher posting regardless of group
          chat role settings. They serve as official communication channels.
        </DocCallout>
      </DocSection>

      <DocSection title="Announcements on web">
        <p>
          The web teacher portal at <code>/teacher</code> includes an <strong>Announcements</strong>
          section that displays school and class announcements in a read-only view. This is useful
          for reviewing official notices on a larger screen. Posting announcements is done from the
          admin portal or mobile app.
        </p>
      </DocSection>

      <DocSection title="Troubleshooting">
        <DocFaq
          items={[
            {
              q: 'Messages are not sending',
              a: 'Check your internet connection. The app queues messages and sends when connectivity is restored. If the issue persists, try closing and reopening the app.',
            },
            {
              q: 'Chat rooms are empty or missing',
              a: (
                <>
                  Pull down on the Chats tab to refresh. Confirm you are in the correct branch —
                  rooms are branch-scoped. If rooms never appear, check that you are enrolled in the
                  relevant classes or that your role grants access.
                </>
              ),
            },
            {
              q: 'I see the wrong rooms for my role',
              a: 'Your account role determines which rooms appear. If rooms seem incorrect, contact your admin to verify your role and class assignments.',
            },
            {
              q: 'Cannot post in a room',
              a: 'The room&apos;s posting permission does not include your role. Only admins or designated teachers can post in announcement rooms. For group chats, check with the room admin.',
            },
            {
              q: 'Unread badge not clearing',
              a: 'Open the room and scroll through messages. If the badge persists, pull down to refresh or restart the app.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Related guides">
        <ul>
          <li><Link href="/docs/intro/notifications">Notifications</Link> — system room feeds and push alerts</li>
          <li><Link href="/docs/intro/admin/announcements">Announcements</Link> — creating and managing announcement posts</li>
          <li><Link href="/docs/intro/teacher/mobile-app">Teacher Mobile App</Link> — mobile workspace overview</li>
          <li><Link href="/docs/intro/student/mobile-app">Student Mobile App</Link> — student chat experience</li>
        </ul>
      </DocSection>
    </DocsShell>
  );
}
