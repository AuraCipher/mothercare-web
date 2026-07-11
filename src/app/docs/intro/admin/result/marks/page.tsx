import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function AdminResultMarksPage() {
  return (
    <DocsShell
      title="Marks Entry"
      subtitle="Enter and review subject marks for a specific exam."
      nav={introNav}
      variant="intro"
    >
      <p>
        Marks Entry opens from an exam inside a session (<code>/admin/result/sessions/…/exams/…</code>).
        You see the class roster, subjects, maximum marks, and entry fields per student. Progress
        indicators show how many marks are still missing.
      </p>

      <h2>Common tasks</h2>
      <DocSteps>
        <DocStep title="Open the exam">
          From <Link href="/docs/intro/admin/result/sessions">Sessions</Link>, click an exam to open
          its marks sheet.
        </DocStep>
        <DocStep title="Enter marks per subject">
          Fill obtained marks (or grades where configured) for each student and subject column.
        </DocStep>
        <DocStep title="Save frequently">
          Save batches as you go. Large classes are easier when sorted by roll number.
        </DocStep>
        <DocStep title="Verify before compute">
          Confirm 100% marks progress on the session summary before running grade computation.
        </DocStep>
      </DocSteps>

      <DocCallout variant="info" title="Teacher portal">
        Subject teachers may enter marks from the teacher portal for exams they are assigned — admin
        sees the same underlying data.
      </DocCallout>

      <h2>Permissions</h2>
      <p>Part of the <strong>Result & Grade</strong> module:</p>
      <ul>
        <li><strong>Read</strong> — view marks sheets</li>
        <li><strong>Create / Update</strong> — enter and correct marks</li>
        <li><strong>Delete</strong> — clear marks or reset exam data when allowed</li>
      </ul>
      <p>
        See <Link href="/docs/intro/admin/permissions">Permissions & Staff Roles</Link>.
      </p>
    </DocsShell>
  );
}
