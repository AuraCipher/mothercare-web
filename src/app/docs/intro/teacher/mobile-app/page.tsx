import { DocsShell } from '@/components/docs/docs-shell';
import { introNav } from '@/lib/docs/navigation';

export default function TeacherMobilePage() {
  return (
    <DocsShell title="Teacher Mobile App" subtitle="Chats, workspace, and profile on Android/iOS." nav={introNav} variant="intro">
      <h2>Tabs</h2>
      <ul>
        <li><strong>Chats</strong> — school & teacher announcements, class communities, direct messages</li>
        <li><strong>Workspace</strong> — timetable, HOD tools when assigned</li>
        <li><strong>Profile</strong> — account & sign out</li>
      </ul>
      <h2>Chat rules</h2>
      <p>You cannot message yourself or the CEO from the picker. Use class communities for subject groups.</p>
    </DocsShell>
  );
}
