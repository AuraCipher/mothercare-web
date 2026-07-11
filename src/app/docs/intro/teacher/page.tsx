import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { introNav } from '@/lib/docs/navigation';

export default function TeacherIntroPage() {
  return (
    <DocsShell
      title="Teacher Portal & App"
      subtitle="Web tools for marks, attendance, timetable — plus mobile chat and workspace."
      nav={introNav}
      variant="intro"
    >
      <h2>Web portal</h2>
      <ul>
        <li>My classes & subject assignments</li>
        <li>Marks entry & results</li>
        <li>Attendance</li>
        <li>Timetable</li>
        <li>My attendance & my payroll (personal records)</li>
        <li>HOD marks (when you are head of department)</li>
      </ul>

      <h2>Mobile app</h2>
      <p>
        Chat (announcements, class communities, DMs), workspace timetable, and HOD panels when
        applicable. See <Link href="/docs/intro/teacher/mobile-app">Mobile app guide</Link>.
      </p>

      <p>
        Permissions: <Link href="/docs/intro/teacher/permissions">Teacher permissions</Link>
      </p>
    </DocsShell>
  );
}
