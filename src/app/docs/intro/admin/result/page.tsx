import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function AdminResultPage() {
  return (
    <DocsShell
      title="Result & Grade"
      subtitle="Exam sessions, marks entry, report cards, and result analytics."
      nav={introNav}
      variant="intro"
    >
      <p>
        The Result hub manages the full exam cycle for the active academic year — create exam
        sessions (e.g. Mid Term, Final), define exams and subjects, enter marks, compute grades,
        print report cards, and analyze performance.
      </p>

      <h2>Module areas</h2>
      <ul>
        <li><Link href="/docs/intro/admin/result/sessions">Sessions</Link> — exam terms and exam list</li>
        <li><Link href="/docs/intro/admin/result/marks">Marks Entry</Link> — subject-wise marks per exam</li>
        <li><Link href="/docs/intro/admin/result/report-cards">Report Cards</Link> — generate and print cards</li>
        <li><Link href="/docs/intro/admin/result/compute">Compute</Link> — grade calculation workflow</li>
        <li><Link href="/docs/intro/admin/result/analytics">Analytics</Link> — pass/fail and grade charts</li>
      </ul>

      <h2>Typical exam workflow</h2>
      <DocSteps>
        <DocStep title="Create a session">
          Add an exam session with start/end dates (e.g. &quot;First Term 2026&quot;).
        </DocStep>
        <DocStep title="Define exam types and exams">
          Inside the session, configure exam types and individual exams per class.
        </DocStep>
        <DocStep title="Enter marks">
          Open each exam to fill subject marks — progress bars show completion.
        </DocStep>
        <DocStep title="Compute and publish">
          Run grade computation, then generate{' '}
          <Link href="/docs/intro/admin/result/report-cards">Report Cards</Link> for parents.
        </DocStep>
      </DocSteps>

      <DocCallout variant="warn" title="Archived years">
        Result data in archived academic years is read-only unless you have archived-year write
        permissions.
      </DocCallout>

      <h2>Permissions</h2>
      <p>Module key: <strong>Result & Grade</strong>. For restricted staff:</p>
      <ul>
        <li><strong>Read</strong> — view sessions, marks, and report cards</li>
        <li><strong>Create</strong> — add sessions, exams, and marks</li>
        <li><strong>Update</strong> — edit marks, structures, and computed results</li>
        <li><strong>Delete</strong> — remove sessions or exams where permitted</li>
      </ul>
      <p>
        See <Link href="/docs/intro/admin/permissions">Permissions & Staff Roles</Link>.
      </p>
    </DocsShell>
  );
}
