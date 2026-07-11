import { DocsShell } from '@/components/docs/docs-shell';
import { introNav } from '@/lib/docs/navigation';

export default function StudentMobilePage() {
  return (
    <DocsShell title="Student Mobile App" subtitle="Academics, fees, attendance, results, and chat." nav={introNav} variant="intro">
      <h2>Tabs</h2>
      <ul>
        <li><strong>Chats</strong> — announcements, class community, system rooms (attendance, fees, results)</li>
        <li><strong>Academics</strong> — timetable, datesheets, canteen</li>
        <li><strong>Profile</strong></li>
      </ul>
      <p>Students have read-only access to system notification rooms. They can DM teachers allowed by class chat roles.</p>
    </DocsShell>
  );
}
