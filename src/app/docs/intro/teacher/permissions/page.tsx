import { DocsShell } from '@/components/docs/docs-shell';
import { introNav } from '@/lib/docs/navigation';

export default function TeacherPermissionsPage() {
  return (
    <DocsShell title="Teacher Permissions" subtitle="What teachers can and cannot do." nav={introNav} variant="intro">
      <ul>
        <li>View and enter marks only for assigned subjects/classes</li>
        <li>Mark attendance for assigned classes</li>
        <li>Post in chat rooms where posting is allowed (announcements may be read-only)</li>
        <li>Cannot access admin ERP modules (fees, payroll setup, student creation) unless also staff</li>
        <li>HOD tools appear only when designated HOD for a subject</li>
      </ul>
    </DocsShell>
  );
}
