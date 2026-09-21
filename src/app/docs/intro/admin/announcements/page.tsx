import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep, DocTable, DocSection, DocFaq } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function AnnouncementsPage() {
  return (
    <DocsShell
      title="Announcements"
      subtitle="Create and publish school-wide or class-specific notices to the mobile app."
      nav={introNav}
      variant="intro"
    >
      <DocSection title="Overview">
        <p>
          <strong>Announcements</strong> are structured, persistent notices published to the mobile
          app chat interface. Unlike regular chat messages, announcements are designed for official
          communication — they can be pinned, remain visible for reference, and are restricted to
          authorized poster roles.
        </p>
        <p>
          <strong>Why they exist:</strong> schools need a reliable way to broadcast important
          information — schedule changes, event notices, policy updates — that students and teachers
          can refer back to. Announcements cut through chat noise and stay prominent.
        </p>
      </DocSection>

      <DocSection title="Announcement types">
        <DocTable
          headers={['Type', 'Audience', 'Posted by', 'Visibility']}
          rows={[
            ['School Announcement', 'All branch students and teachers', 'Admin, designated teachers', 'Branch-wide — appears in School Announcement room'],
            ['Class Announcement', 'Students and teachers of a specific class', 'Class teacher, admin', 'Per-class — appears in Class Announcement room'],
            ['Teacher Announcement', 'All teachers on the branch', 'Admin, designated teachers', 'Teacher-only channel — hidden from students'],
          ]}
        />
      </DocSection>

      <DocSection title="Creating an announcement">
        <DocSteps>
          <DocStep title="Navigate to announcements">
            On the mobile app, open the relevant announcement room. On the web admin portal, use
            the Announcements section.
          </DocStep>
          <DocStep title="Compose the announcement">
            Enter a <strong>title</strong> and <strong>content</strong>. The title helps recipients
            quickly identify the topic. Content supports plain text.
          </DocStep>
          <DocStep title="Select target (class announcements)">
            For class-specific announcements, select the target class section. School and teacher
            announcements do not require a target — they apply to the entire branch or teacher pool.
          </DocStep>
          <DocStep title="Pin (optional)">
            Toggle <strong>Pin</strong> to keep the announcement at the top of the room. Pinned
            announcements are highlighted and remain visible even after newer posts arrive.
          </DocStep>
          <DocStep title="Publish">
            Submit the announcement. It appears immediately in the target room on all connected
            mobile devices.
          </DocStep>
        </DocSteps>
      </DocSection>

      <DocSection title="Pinning announcements">
        <p>
          Pinned announcements stay at the top of the announcement room, ensuring they are the first
          thing recipients see. Only one announcement can be pinned per room at a time — pinning a
          new one unpins the previous. Admins and the original poster can unpin.
        </p>
        <DocCallout variant="tip" title="When to pin">
          Pin time-sensitive notices like schedule changes, exam dates, or emergency information.
          Unpin once the notice period expires to keep the room current.
        </DocCallout>
      </DocSection>

      <DocSection title="Reading announcements">
        <h3>Mobile app</h3>
        <p>
          Announcements appear in their respective rooms on the Chats tab. Pinned announcements
          show a pin icon and appear at the top. All users in the target audience see the same
          content. The room follows the same unread badge behavior as other chat rooms.
        </p>
        <h3>Web portal</h3>
        <p>
          The teacher web portal at <code>/teacher</code> includes an <strong>Announcements</strong>
          section. This displays all announcements relevant to the teacher in a read-only list view.
          Posting is done from the admin portal or mobile app.
        </p>
      </DocSection>

      <DocSection title="Student view">
        <p>
          Students see announcement rooms as <strong>read-only</strong>. They can read announcements
          but cannot post, reply, or react. This keeps the channel clean for official communication
          only. Students receive no posting input — the message composer is hidden.
        </p>
      </DocSection>

      <DocSection title="Announcements vs chat messages">
        <DocTable
          headers={['Feature', 'Announcements', 'Chat messages']}
          rows={[
            ['Persistence', 'Persistent — remain visible for reference', 'Flow with chat timeline'],
            ['Pinning', 'Can be pinned to room top', 'Not pinnable'],
            ['Posting permission', 'Restricted to admin / designated teachers', 'Based on room role config'],
            ['Student interaction', 'Read-only', 'Can post in group chats if enabled'],
            ['Use case', 'Official notices, schedules, policies', 'Conversation, discussion, Q&A'],
          ]}
        />
      </DocSection>

      <DocSection title="Permissions">
        <DocTable
          headers={['Role', 'Can post announcements']}
          rows={[
            ['Branch admin', 'Yes — all types (school, class, teacher)'],
            ['Designated teacher', 'Yes — class announcements for assigned classes, teacher announcements'],
            ['Regular teacher', 'No — unless designated by admin'],
            ['Student', 'No — read-only in all announcement rooms'],
          ]}
        />
        <DocCallout variant="warn" title="Designation required">
          Teachers must be explicitly designated by an admin to post announcements. Being a class
          teacher does not automatically grant announcement posting rights.
        </DocCallout>
      </DocSection>

      <DocSection title="Troubleshooting">
        <DocFaq
          items={[
            {
              q: 'I cannot post an announcement',
              a: 'Only admins and designated teachers can post. Check with your admin that you have been granted announcement posting permission for the target room.',
            },
            {
              q: 'Announcement not appearing for students',
              a: 'Verify the announcement was published to the correct room type and class. School announcements go to all students; class announcements only go to the selected class section.',
            },
            {
              q: 'Pin is not working',
              a: 'Only one announcement can be pinned per room. Pinning a new one automatically unpins the previous. If the pin does not stick, check your network connection.',
            },
            {
              q: 'Students can see the announcement room but it is empty',
              a: 'No announcements have been posted to that room yet. Announcements only appear after being published by an admin or designated teacher.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Related guides">
        <ul>
          <li><Link href="/docs/intro/chat">Chat</Link> — room types and messaging system</li>
          <li><Link href="/docs/intro/notifications">Notifications</Link> — system-generated alerts</li>
          <li><Link href="/docs/intro/admin/classes">Classes</Link> — class sections for targeting announcements</li>
          <li><Link href="/docs/intro/admin/permissions">Permissions</Link> — staff role configuration</li>
        </ul>
      </DocSection>
    </DocsShell>
  );
}
