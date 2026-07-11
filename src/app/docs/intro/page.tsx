import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocTable } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function IntroOverviewPage() {
  return (
    <DocsShell
      title="Mother Care School — User Guide"
      subtitle="Learn how each portal works, what you can do in every module, and how permissions affect your daily work."
      nav={introNav}
      variant="intro"
    >
      <h2>Overview</h2>
      <p>
        This guide explains Mother Care School software in plain language — no technical background
        required. Whether you run the organization, administer a branch, teach a class, or study as a
        student, you will find step-by-step instructions for every screen you use. Each section
        matches a real portal or mobile app area in the product.
      </p>
      <p>
        Mother Care School is built around four user-facing areas: the <strong>CEO portal</strong>{' '}
        for organization owners, the <strong>admin portal</strong> for branch operations, the{' '}
        <strong>teacher portal and app</strong> for classroom work, and the <strong>student app</strong>{' '}
        (with an optional web view) for academics and school communication. Your login credentials
        determine which area you see — there is no public sign-up.
      </p>

      <h2>Who this guide is for</h2>
      <DocTable
        headers={['Role', 'Primary surface', 'What you do here']}
        rows={[
          [
            <strong key="ceo">CEO (super_admin)</strong>,
            'Web — /ceo',
            'Create branches, invite branch admins, manage API keys, oversee the whole organization.',
          ],
          [
            <strong key="admin">Admin / management staff</strong>,
            'Web — /admin (+ mobile chat)',
            'Enroll students, manage fees, attendance, results, payroll, timetable, and staff permissions.',
          ],
          [
            <strong key="teacher">Teachers</strong>,
            'Web — /teacher + mobile app',
            'Enter marks, mark attendance, view timetable, chat with classes and colleagues, review personal payroll.',
          ],
          [
            <strong key="student">Students</strong>,
            'Mobile app (primary) + web — /student',
            'View fees, attendance, results, timetable; receive announcements; chat in class communities.',
          ],
        ]}
      />

      <h2>Four portal areas</h2>
      <ul>
        <li>
          <Link href="/docs/intro/ceo">CEO Portal</Link> — organization structure: branches, branch
          administrator invitations, and API keys for integrations. Only <code>super_admin</code>{' '}
          accounts can open this area.
        </li>
        <li>
          <Link href="/docs/intro/admin">Admin Portal</Link> — the full school ERP: students, classes,
          fees, attendance, results, expenses, canteen, stationary, timetable, teachers, and staff
          permissions. Scoped to your active branch and academic year.
        </li>
        <li>
          <Link href="/docs/intro/teacher">Teacher Portal &amp; App</Link> — classroom tools on the
          web (marks, attendance, timetable, HOD views) plus mobile chat and a compact workspace for
          on-the-go teaching tasks.
        </li>
        <li>
          <Link href="/docs/intro/student">Student App</Link> — read-only academics, school
          announcements, class communities, and system notification rooms for fees, attendance, and
          results. A web student portal mirrors most academic data.
        </li>
      </ul>

      <h2>Web vs mobile — when to use which</h2>
      <p>
        Not every feature exists on both surfaces. Use this table to pick the right tool for the
        task:
      </p>
      <DocTable
        headers={['Task', 'Web', 'Mobile app']}
        rows={[
          ['Enter exam marks', 'Yes — full grid editor', 'View results summary in Workspace'],
          ['Mark class attendance', 'Yes — primary surface', 'Yes — Today\'s Attendance tab'],
          ['School / class chat', 'No', 'Yes — Chats tab'],
          ['Direct messages', 'No', 'Yes — contact picker'],
          ['View fees / results', 'Students: web portal', 'Students: Academics + system rooms'],
          ['My payroll (teacher)', 'Yes — /teacher/my-payroll', 'Yes — My Records system room'],
          ['Admin ERP (fees, students)', 'Yes — /admin', 'Chat only on mobile'],
        ]}
      />

      <h2>Academic year and branch context</h2>
      <p>
        Almost all school data — marks, attendance, fees, chat rooms — belongs to a specific{' '}
        <strong>branch</strong> and <strong>academic year</strong>. Admins select these from the
        sidebar header before working. Teachers and students are automatically scoped to their
        branch&apos;s active year when they sign in.
      </p>
      <p>
        When an academic year is <em>archived</em> or <em>on hold</em>, write actions (marks entry,
        attendance marking) are blocked and portals switch to read-only mode. You can still view
        historical records. Contact your branch admin if you need access to a past year.
      </p>

      <DocCallout variant="warn" title="Archived years">
        Archived academic years block most editing across admin, teacher, and student portals.
        Teachers see a &quot;Read only&quot; badge on the dashboard; students cannot change any
        academic data.
      </DocCallout>

      <h2>Chat at a glance</h2>
      <p>
        Chat lives in the mobile app for teachers, students, and admin staff. Key rules shared across
        roles:
      </p>
      <ul>
        <li>
          <strong>Announcements are read-only</strong> — school-wide and class announcement channels
          are for admin and teacher posts; students and most staff can read but not reply.
        </li>
        <li>
          <strong>Class communities</strong> — each class has an announcement channel plus subject
          group chats. Teachers post in groups they are assigned to.
        </li>
        <li>
          <strong>Contact picker rules</strong> — you cannot start a direct message with yourself.
          The CEO (<code>super_admin</code>) does not appear in contact lists. Existing DM threads
          with hidden contacts are suppressed from the main chat list.
        </li>
        <li>
          <strong>System rooms</strong> — automated notification feeds paired with live data panels.
          Students get Attendance, Fees, and Results rooms; teachers get My Attendance and My Payroll
          rooms.
        </li>
      </ul>
      <p>
        Full chat walkthroughs:{' '}
        <Link href="/docs/intro/teacher/mobile-app">Teacher mobile app</Link> and{' '}
        <Link href="/docs/intro/student/mobile-app">Student mobile app</Link>.
      </p>

      <h2>Permissions at a glance</h2>
      <p>
        Every action in the system is gated by role, branch, academic year, and (for admin staff)
        module permissions. You cannot escalate your own access — if a button or menu item is missing,
        an administrator must grant it.
      </p>
      <DocTable
        headers={['Role', 'Permissions guide']}
        rows={[
          [
            'CEO',
            <Link key="ceo" href="/docs/intro/ceo/permissions">CEO permissions</Link>,
          ],
          [
            'Admin / management',
            <Link key="admin" href="/docs/intro/admin/permissions">Admin &amp; staff permissions</Link>,
          ],
          [
            'Teacher',
            <Link key="teacher" href="/docs/intro/teacher/permissions">Teacher permissions</Link>,
          ],
          [
            'Student',
            'Read-only academics; chat governed by class roles',
          ],
        ]}
      />

      <h2>Glossary</h2>
      <DocTable
        headers={['Term', 'Meaning']}
        rows={[
          ['Branch', 'A physical campus or school location under the organization'],
          ['Academic year', 'Time-bounded school session (e.g. 2025–26) — all marks, fees, and chat belong to one'],
          ['Class / group', 'A section within a year (e.g. Grade 8A)'],
          ['Assignment', 'Link between a teacher, subject, and class for a period'],
          ['Class teacher', 'Teacher responsible for an entire section — attendance, chat roles'],
          ['HOD', 'Head of Department — oversight across classes for one subject'],
          ['System room', 'Automated chat feed paired with live data (fees, attendance, results)'],
          ['Archived year', 'Ended year — read-only for most users'],
        ]}
      />

      <h2>Guide map</h2>
      <p>Jump directly to the section for your role:</p>
      <ul>
        <li><Link href="/docs/intro/get-started">Get Started</Link> — sign-in, roles, troubleshooting</li>
        <li><Link href="/docs/intro/ceo">CEO guide</Link> — branches, invitations, API keys</li>
        <li><Link href="/docs/intro/admin">Admin guide</Link> — full ERP modules (students, fees, results, …)</li>
        <li><Link href="/docs/intro/teacher">Teacher guide</Link> — web portal + mobile app walkthrough</li>
        <li><Link href="/docs/intro/student">Student guide</Link> — academics and mobile app</li>
      </ul>

      <h2>Getting started</h2>
      <p>
        New to the system? Start with <Link href="/docs/intro/get-started">Get Started</Link> for
        sign-in instructions, role-based routing, and links to your role-specific guide.
      </p>

      <DocCallout variant="tip" title="Contextual help">
        Look for the <strong>?</strong> icon on portal pages — it opens the guide section for that
        exact screen. Teachers opening <code>/teacher/marks</code> land on the teacher guide;
        students on <code>/student/fees</code> land on the student guide.
      </DocCallout>

      <h2>Technical documentation</h2>
      <p>
        Engineers and integrators should read the <Link href="/docs/api">API &amp; architecture docs</Link>{' '}
        for REST endpoints, JWT authentication, WebSocket chat events, deployment, and system design
        decisions. The user guide intentionally avoids implementation detail.
      </p>
    </DocsShell>
  );
}
