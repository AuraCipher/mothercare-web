import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep, DocTable } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function TeacherIntroPage() {
  return (
    <DocsShell
      title="Teacher Portal & App"
      subtitle="Web tools for marks, attendance, timetable — plus mobile chat and workspace."
      nav={introNav}
      variant="intro"
    >
      <h2>Overview</h2>
      <p>
        The teacher experience spans two surfaces. The <strong>web portal</strong> at{' '}
        <code>/teacher</code> is where you enter exam marks, mark daily class attendance, review
        results tables, and manage class-level settings. The <strong>mobile app</strong> is where
        you chat with colleagues and students, read announcements, and glance at today&apos;s
        schedule on the go.
      </p>
      <p>
        Your access is always limited to <strong>subjects and classes you are assigned to</strong>.
        If you are also designated <strong>class teacher</strong> for a section, you gain extra
        controls for that class (chat role management). If you are <strong>Head of Department
        (HOD)</strong>, a department-wide marks overview appears on web and mobile.
      </p>

      <h2>Web vs mobile — what goes where</h2>
      <DocTable
        headers={['Feature', 'Web portal', 'Mobile app']}
        rows={[
          ['Dashboard & quick actions', 'Yes', 'No — use Workspace tab'],
          ['Enter exam marks (full grid)', 'Yes — primary', 'View-only results summary'],
          ['Mark class attendance', 'Yes — primary', "Yes — Today's Attendance tab"],
          ['View results (filtered table)', 'Yes', 'Yes — Results tab in Workspace'],
          ['Timetable', 'Yes — weekly view', 'Yes — Timetable tab'],
          ['My Attendance (staff record)', 'Yes — /teacher/my-attendance', 'Yes — My Records room'],
          ['My Payroll', 'Yes — /teacher/my-payroll', 'Yes — My Records room'],
          ['HOD department marks', 'Yes — /teacher/hod/marks', 'Yes — HOD tab (if HOD)'],
          ['School & class chat', 'No', 'Yes — Chats tab'],
          ['Direct messages', 'No', 'Yes — contact picker'],
          ['Class chat roles', 'Yes — per-class settings', 'No'],
          ['Announcements (read)', 'Yes — /teacher/announcements', 'Yes — pinned chat tiles'],
        ]}
      />

      <h2>Web portal — module walkthrough</h2>
      <p>
        After signing in at <code>/login</code> you land on the teacher dashboard. The sidebar lists
        every module. Use the <strong>?</strong> help icon on any page to return here.
      </p>

      <h3>Dashboard</h3>
      <p>
        The home screen shows assignment and class counts, today&apos;s timetable periods (up to four
        slots), recent announcements, and quick-action links. If the academic year is read-only, a
        stat card shows <strong>Read only</strong> instead of <strong>Active</strong>.
      </p>

      <h3>My Classes</h3>
      <DocSteps>
        <DocStep title="Open My Classes">
          Click <strong>My Classes</strong> in the sidebar or <strong>See all</strong> on the
          dashboard. Each card represents a subject assignment (e.g. Mathematics — Grade 8A).
        </DocStep>
        <DocStep title="Open a subject assignment">
          Click a card to open the subject detail page with timetable snippet, marks link, and class
          overview for that assignment.
        </DocStep>
        <DocStep title="Open a class hub">
          Click the class name link to open the class page — student list, attendance shortcut, and
          links filtered to that <code>groupId</code>.
        </DocStep>
        <DocStep title="Manage chat roles (class teachers only)">
          If you are the class teacher for that section, open <strong>Chat roles</strong> from the
          class page. Define student roles (monitor, prefect, etc.) and control who can post in group
          chats or send/receive direct messages. Changes apply immediately on mobile.
        </DocStep>
      </DocSteps>

      <h3>Timetable</h3>
      <p>
        Shows your weekly schedule — period numbers, subjects, classes, and time slots. Active days
        are highlighted. Use this to plan which class to mark attendance for on a given day.
      </p>

      <h3>Attendance</h3>
      <DocSteps>
        <DocStep title="Select a class">
          Open <strong>Attendance</strong> from the sidebar. Pick a class from the dropdown — only
          classes you are assigned to appear. You can also arrive here via a class page with{' '}
          <code>?groupId=</code> pre-selected.
        </DocStep>
        <DocStep title="Pick a date">
          Choose the attendance date. Defaults to today. Past dates may be editable depending on
          branch policy.
        </DocStep>
        <DocStep title="Mark each student">
          Set status per student: Present, Absent, Late, Leave, etc. Add optional notes where
          supported.
        </DocStep>
        <DocStep title="Save">
          Submit the sheet. If marking is disabled by branch settings (
          <code>teachersCanMarkAttendance</code> is off), the page is view-only and shows a message
          explaining that only admins can record attendance.
        </DocStep>
      </DocSteps>

      <h3>Marks</h3>
      <DocSteps>
        <DocStep title="View your exam subjects">
          Open <strong>Marks</strong>. The list shows every exam-class-subject row you can access —
          session name, exam name, class, subject, entry count, and an status badge (Editable, Locked,
          Restricted, etc.).
        </DocStep>
        <DocStep title="Open the marks grid">
          Click a row to open the full marks entry grid. Enter marks per student. Total marks and
          passing marks are shown from the exam configuration.
        </DocStep>
        <DocStep title="Understand lock states">
          Rows may be read-only when the exam is still active (<code>EXAM_ACTIVE</code>), admin has
          restricted entry, or report cards are already published. The badge on each row explains why.
        </DocStep>
        <DocStep title="Save entries">
          Save periodically. In archived academic years the entire marks module is read-only.
        </DocStep>
      </DocSteps>

      <h3>Results</h3>
      <p>
        A read-only marks table with filters for session, exam, and subject. Use this to review
        entered marks without editing. HOD teachers may prefer the department view instead.
      </p>

      <h3>My Attendance</h3>
      <p>
        Your personal staff attendance record — each row shows a date, status (Present, Absent, etc.),
        and optional admin notes. This is <em>your</em> attendance as an employee, not class
        attendance you mark for students. The same data appears in the mobile <strong>My Records</strong>{' '}
        system room.
      </p>

      <h3>My Payroll</h3>
      <p>
        Salary payments received — month label, amount paid, payment date, method, and voucher number
        when recorded by admin. Read-only; payroll is processed in the admin Expenses module. Also
        available in the mobile My Payroll system room.
      </p>

      <h3>HOD — Department marks</h3>
      <p>
        Visible only when your account is flagged as HOD. Shows every exam subject in your department
        across all classes — including subjects taught by other teachers. Use this to monitor entry
        progress before report cards. You can open individual marks grids for subjects in your
        department. On mobile, the <strong>HOD</strong> tab in Workspace shows a department subject
        overview.
      </p>

      <h3>Announcements &amp; Notifications</h3>
      <p>
        <strong>Announcements</strong> lists school-wide notices (title, content, date). These mirror
        the read-only <strong>School Announcement</strong> chat channel on mobile.{' '}
        <strong>Notifications</strong> shows system alerts (unread count on dashboard). Mark
        notifications read from the notifications page.
      </p>

      <h3>Profile</h3>
      <p>
        View your name, employee ID, qualification, contact details, and branch. Sign out from here
        on web. On mobile, profile and logout live in the Profile tab.
      </p>

      <h2>Mobile app summary</h2>
      <p>
        The Flutter app provides three bottom tabs — <strong>Chats</strong>, <strong>Workspace</strong>,
        and <strong>Profile</strong>. Chat covers announcements, class communities, direct messages,
        and personal record rooms. Workspace covers classes, today&apos;s attendance, results
        summary, timetable, and HOD panel.
      </p>
      <p>
        Full mobile walkthrough: <Link href="/docs/intro/teacher/mobile-app">Teacher mobile app guide</Link>.
      </p>

      <DocCallout variant="tip" title="Chat rules reminder">
        You cannot message yourself or the CEO from the contact picker. School and teacher
        announcement channels are read-only. Use class communities and subject group chats for
        class communication. See the mobile guide for room-by-room detail.
      </DocCallout>

      <h2>Permissions</h2>
      <p>
        Teachers cannot access admin ERP modules (fee collection, student enrollment, payroll
        processing) unless they also hold a separate management staff account. Feature visibility on
        web can be further restricted per teacher by the branch admin.
      </p>
      <p>
        Full permission reference:{' '}
        <Link href="/docs/intro/teacher/permissions">Teacher permissions</Link>.
      </p>
    </DocsShell>
  );
}
