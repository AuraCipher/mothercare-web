import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocTable, DocSection, DocFaq } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function NotificationsPage() {
  return (
    <DocsShell
      title="Notifications"
      subtitle="System-generated alerts for attendance, payments, results, and payroll — on web and mobile."
      nav={introNav}
      variant="intro"
    >
      <DocSection title="Overview">
        <p>
          <strong>Notifications</strong> are system-generated alerts triggered automatically by events
          in the ERP — attendance marks, fee payments, result publications, and payroll processing.
          They are not user-sent messages. The system pushes these alerts to relevant users so
          teachers, students, and staff stay informed without checking each module manually.
        </p>
        <p>
          <strong>Why they exist:</strong> in a busy school, stakeholders need timely awareness of
          changes that affect them — a parent learning their child was marked absent, a teacher
          seeing a salary deposit, or a student knowing their report card is ready.
        </p>
        <p>
          <strong>Who receives them:</strong> teachers, students, branch admin staff, and CEO-level
          users depending on the event type. Some notifications go to multiple recipients (e.g.
          a parent notification for a student&apos;s absence).
        </p>
      </DocSection>

      <DocSection title="Notification types">
        <DocTable
          headers={['Category', 'Trigger event', 'Recipient']}
          rows={[
            ['Attendance — Absent', 'Student marked absent', 'Parents / guardians'],
            ['Attendance — Late', 'Student marked late', 'Parents / guardians'],
            ['Attendance — Leave', 'Student marked on leave', 'Parents / guardians'],
            ['Attendance — Function', 'Student marked function', 'Parents / guardians'],
            ['Payment — Received', 'Full fee payment recorded', 'Parents / guardians'],
            ['Payment — Partial', 'Partial payment recorded', 'Parents / guardians'],
            ['Payment — Overpaid', 'Payment exceeds dues', 'Parents / guardians'],
            ['Payment — Reverted', 'Payment reverted by admin', 'Parents / guardians'],
            ['Payment — Family', 'Family payment recorded', 'Parents / guardians'],
            ['Results — Marks Entered', 'Teacher submits marks for a subject', 'Students'],
            ['Results — Report Card Published', 'Report card finalized and published', 'Students'],
            ['Teacher Attendance — Absent', 'Teacher marked absent', 'The teacher'],
            ['Teacher Attendance — Late', 'Teacher marked late', 'The teacher'],
            ['Teacher Attendance — Leave', 'Teacher marked on leave', 'The teacher'],
            ['Teacher Attendance — Present', 'Teacher marked present', 'The teacher'],
            ['Teacher Payroll — Salary Paid', 'Salary fully paid', 'The teacher'],
            ['Teacher Payroll — Partial', 'Partial salary paid', 'The teacher'],
            ['Teacher Payroll — Bulk', 'Bulk salary processing run', 'All teachers in batch'],
          ]}
        />
      </DocSection>

      <DocSection title="Where notifications appear">
        <h3>Mobile app — system rooms</h3>
        <p>
          On the mobile app, notifications appear as dedicated <strong>system rooms</strong> in the
          Chats tab. Each notification category has its own read-only room that receives updates
          automatically:
        </p>
        <DocTable
          headers={['System room', 'Content']}
          rows={[
            ['Attendance', 'Student absent, late, leave, function alerts'],
            ['Fees', 'Payment received, partial, overpaid, reverted, family alerts'],
            ['Results', 'Marks entered, report card published alerts'],
            ['My Records', 'Teacher-specific attendance and activity alerts'],
            ['My Payroll', 'Salary paid, partial, bulk processing alerts'],
          ]}
        />
        <h3>Web portal — notifications page</h3>
        <p>
          On the teacher web portal, a <strong>Notifications</strong> page lists all system-generated
          alerts in chronological order. Click the notification to see details. The page shows unread
          count in the header badge.
        </p>
      </DocSection>

      <DocSection title="Push notifications">
        <p>
          When the mobile app is in the background or closed, <strong>push notifications</strong> are
          delivered via Firebase Cloud Messaging (FCM). These appear as device-level alerts — banners,
          lock screen, and notification tray.
        </p>
        <DocCallout variant="info" title="FCM requirement">
          Push notifications require <code>FCM_ENABLED=true</code> in the server environment. If
          your school has not configured Firebase, push notifications will not work — users only see
          alerts when the app is open.
        </DocCallout>
        <ul>
          <li>Push notifications are mobile-only — web browsers do not receive push alerts.</li>
          <li>Each device registers an FCM token on sign-in; sign-out removes it.</li>
          <li>Multiple devices per user are supported — each receives independent push alerts.</li>
        </ul>
      </DocSection>

      <DocSection title="Marking as read">
        <p>
          Opening a system room on mobile or viewing a notification on web automatically marks it as
          read. Unread badges on the Chats tab and notification header update accordingly. There is
          no manual &quot;mark all as read&quot; action — reading the content clears the badge.
        </p>
      </DocSection>

      <DocSection title="Configuration">
        <DocCallout variant="warn" title="No user-configurable settings">
          Notifications are system-generated and cannot be customized by users. There are no
          settings to enable/disable specific notification types, change delivery channels, or
          set quiet hours. If you need to adjust notification behavior, contact your branch
          administrator.
        </DocCallout>
      </DocSection>

      <DocSection title="Troubleshooting">
        <DocFaq
          items={[
            {
              q: 'I am not receiving any notifications',
              a: (
                <>
                  Check that push notifications are enabled on your device. On mobile, go to device
                  Settings → Apps → the school app → Notifications and ensure they are allowed.
                  If <code>FCM_ENABLED</code> is not set on the server, push will not work.
                </>
              ),
            },
            {
              q: 'System rooms are empty on mobile',
              a: (
                <>
                  Pull down on the Chats tab to refresh. System rooms populate after attendance or
                  payment events occur. If empty for a long time, verify you are in the correct
                  branch — system rooms are branch-scoped.
                </>
              ),
            },
            {
              q: 'Notifications appear on mobile but not on web',
              a: 'Web notifications page may require a page refresh. Push notifications are mobile-only — web shows in-app alerts only when the portal is open.',
            },
            {
              q: 'I see notifications for another student',
              a: 'This would be a data scoping issue — contact your admin to verify your account is linked to the correct student or branch.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Related guides">
        <ul>
          <li><Link href="/docs/intro/chat">Chat</Link> — user-sent messages and system rooms</li>
          <li><Link href="/docs/intro/admin/attendance">Attendance</Link> — triggers attendance notifications</li>
          <li><Link href="/docs/intro/admin/fees">Fees &amp; Payments</Link> — triggers payment notifications</li>
          <li><Link href="/docs/intro/admin/result">Results</Link> — triggers result notifications</li>
          <li><Link href="/docs/intro/admin/expenses/payroll">Payroll</Link> — triggers teacher payroll notifications</li>
        </ul>
      </DocSection>
    </DocsShell>
  );
}
