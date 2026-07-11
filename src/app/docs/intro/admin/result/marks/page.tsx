import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import {
  DocCallout,
  DocSteps,
  DocStep,
  DocTable,
  DocSection,
  DocFaq,
} from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function AdminResultMarksPage() {
  return (
    <DocsShell
      title="Marks Entry"
      subtitle="Enter exam marks per class and subject on the exam detail page."
      nav={introNav}
      variant="intro"
    >
      <DocSection title="Overview">
        <p>
          There is <strong>no standalone /admin/result/marks route</strong>. Marks entry lives on the{' '}
          <strong>exam detail page</strong> at{' '}
          <code>/admin/result/sessions/[sessionId]/exams/[examId]</code>. After generating exam structure,
          enter totals, passing marks, and per-student scores in the <strong>Marks entry</strong> collapsible
          section.
        </p>
      </DocSection>

      <DocSection title="Before you start">
        <ul>
          <li>Exam created in a <Link href="/docs/intro/admin/result/sessions">session</Link>.</li>
          <li><strong>Structure generated</strong> — classes and subjects active for the exam.</li>
          <li>Exam status <strong>DRAFT</strong> to edit marks (ACTIVE = read-only).</li>
          <li>Not an <strong>archived</strong> academic year for writes.</li>
        </ul>
      </DocSection>

      <DocSection title="Exam page header">
        <DocTable
          headers={['Element', 'Description']}
          rows={[
            ['H1', 'Exam name + DRAFT or ACTIVE badge'],
            ['Subline', 'Parent session name'],
            ['Back to session', 'Return to session page'],
            ['Publish', 'Sets ACTIVE — hidden if archived'],
            ['Set Draft', 'Unpublish — hidden if archived'],
            ['Delete', 'Trash icon — confirm modal'],
          ]}
        />
      </DocSection>

      <DocSection title="Status messages">
        <DocTable
          headers={['Condition', 'Message']}
          rows={[
            ['ACTIVE', 'Published (Active) — admin marks are read-only. Teachers cannot enter marks until set back to Draft.'],
            ['DRAFT + teacher on', 'Draft — teachers can enter marks for this exam.'],
            ['DRAFT + teacher off', 'Draft — teacher marks entry is disabled by admin.'],
          ]}
        />
      </DocSection>

      <DocSection title="Teacher marks toggle (Draft only)">
        <p>
          Checkbox: <strong>Allow teachers to enter marks</strong>
        </p>
        <p>
          Help: <em>While the exam is in Draft (build stage), assigned teachers can enter marks in the teacher
          portal. Publishing to Active always locks teacher entry.</em>
        </p>
        <p>PATCH updateResultExam on toggle change.</p>
      </DocSection>

      <DocSection title="Exam details section">
        <DocTable
          headers={['Field', 'Type', 'Validation', 'Disabled when']}
          rows={[
            ['Name *', 'text', 'Required on save', 'Archived or ACTIVE'],
            ['Type', 'select', 'Exam types from session', 'Archived or ACTIVE'],
            ['Weight %', 'number 0–100', 'Null if matches type default', 'Archived or ACTIVE'],
            ['Date range', 'checkbox', '—', 'Archived or ACTIVE'],
            ['Start', 'date', 'Required', 'Archived or ACTIVE'],
            ['End', 'date', 'If range checked', 'Archived or ACTIVE'],
          ]}
        />
        <p>
          <strong>Save</strong> / <strong>Saving…</strong> — hidden if archived or ACTIVE. Errors:{' '}
          <em>Exam name is required</em>, <em>Start date is required</em>,{' '}
          <em>Weight must be between 0 and 100</em>.
        </p>
      </DocSection>

      <DocSection title="Structure section (prerequisite)">
        <p>Title: structure collapsible. Subtitle updates dynamically.</p>
        <p><strong>Pre-generate:</strong> per-class subject checkboxes, Select all / Clear all,{' '}
        <strong>Generate structure</strong> / <strong>Generating…</strong></p>
        <p><strong>Post-generate:</strong> <strong>Sync classes</strong>, per-class Active checkbox (locked if
        hasMarks), per-subject Include checkbox (locked if hasMarks — tooltip: Marks entered — cannot disable).</p>
        <p>Read-only: <em>Set exam to Draft to configure structure.</em> / <em>Read-only in archived year.</em></p>
      </DocSection>

      <DocSection title="Marks entry section">
        <p>
          Help text: <em>Set Total and Pass per subject column, then enter marks. Missing subjects? Use Sync
          classes in Structure. The checkbox beside each mark is Absent — use it when the student did not sit
          that subject.</em>
        </p>
        <DocTable
          headers={['Element', 'Description']}
          rows={[
            ['Class filter', 'Dropdown — one class at a time'],
            ['Subject counter', 'active/total subjects active'],
            ['Header row', 'Student column + per-subject columns'],
            ['Per subject header', 'Subject name, Total input, Pass input, filled/students count, Save button'],
            ['Student cell', 'Marks number input + Abs checkbox (title: Absent — student did not sit this subject)'],
            ['Inactive column', 'Label: Inactive'],
          ]}
        />
      </DocSection>

      <DocSection title="Step-by-step: enter marks">
        <DocSteps>
          <DocStep title="Open exam from session">
            Session → Exams list → click exam name.
          </DocStep>
          <DocStep title="Generate structure (if empty)">
            Structure section → select classes/subjects → <strong>Generate structure</strong>.
          </DocStep>
          <DocStep title="Select class">
            Marks Entry → choose class from dropdown.
          </DocStep>
          <DocStep title="Set Total and Pass">
            Per subject column header — enter max marks and passing threshold. Click <strong>Save</strong> on
            that column.
          </DocStep>
          <DocStep title="Enter student marks">
            Type score per student or check <strong>Abs</strong> for absent. Save per subject column.
          </DocStep>
          <DocStep title="Publish when complete">
            Header <strong>Publish</strong> → ACTIVE locks marks for reporting.
          </DocStep>
        </DocSteps>
      </DocSection>

      <DocSection title="Validation toasts">
        <DocTable
          headers={['Rule', 'Message']}
          rows={[
            ['Total', 'Positive integer required'],
            ['Passing', 'Non-negative integer, ≤ total'],
            ['Marks', 'Non-negative, ≤ total'],
            ['Success', 'Subject name marks saved toast'],
          ]}
        />
      </DocSection>

      <DocSection title="Read-only states">
        <ul>
          <li><em>Exam is published — marks are read-only. Set to Draft to edit.</em></li>
          <li><em>Read-only in archived academic year.</em></li>
        </ul>
      </DocSection>

      <DocSection title="Delete exam modal">
        <p>
          Title: <strong>Delete exam?</strong> Message:{' '}
          <em>This exam will be permanently removed. Exams with classes assigned cannot be deleted.</em>{' '}
          Confirm: <strong>Delete</strong>.
        </p>
      </DocSection>

      <DocSection title="Permission matrix">
        <DocTable
          headers={['Action', 'Permission']}
          rows={[
            ['View marks grid', 'RESULT → Read'],
            ['Save marks / structure', 'RESULT → Create / Update'],
            ['Publish / Set Draft', 'RESULT → Update'],
            ['Delete exam', 'RESULT → Delete'],
            ['Teacher portal entry', 'Teacher assignment + Allow teachers checkbox on Draft exam'],
          ]}
        />
      </DocSection>

      <DocSection title="Archived academic year">
        <p>All write UI hidden. Marks and structure viewable read-only. Publish/Delete disabled.</p>
      </DocSection>

      <DocSection title="What happens when">
        <DocTable
          headers={['Event', 'Effect']}
          rows={[
            ['Save subject column', 'POST saveResultMarks — upsert scores and absent flags'],
            ['Publish', 'PATCH status ACTIVE — teacher entry locked'],
            ['Set Draft', 'PATCH status DRAFT — marks editable again'],
            ['Absent checked', 'Student marked absent for subject — counts as fail in reports'],
            ['Sync classes', 'Adds new sections/subjects from current class setup'],
          ]}
        />
      </DocSection>

      <DocSection title="Troubleshooting">
        <DocFaq
          items={[
            {
              q: 'Cannot type marks — inputs disabled',
              a: 'Exam is ACTIVE or year archived. Set Draft or switch to active year.',
            },
            {
              q: 'Subject column shows Inactive',
              a: 'Subject unchecked in structure. Enable in Structure section (if no marks yet).',
            },
            {
              q: 'Save button on column does nothing',
              a: 'Fix Total/Pass validation errors shown in toast.',
            },
            {
              q: 'New student missing from grid',
              a: 'Click Sync classes in Structure after enrolling student.',
            },
            {
              q: 'Cannot disable subject after marks entered',
              a: 'hasMarks lock — clear marks first or contact technical support.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Absent checkbox behavior">
        <p>
          <strong>Abs</strong> checkbox marks student did not sit the subject — counts as fail in reports.
          Distinct from leaving mark blank (incomplete entry). Save per subject column after changes.
        </p>
      </DocSection>

      <DocSection title="Structure sync">
        <p>
          After enrolling new students mid-term, click <strong>Sync classes</strong> in Structure section before
          expecting them in marks grid. New subjects from timetable changes also appear after sync.
        </p>
      </DocSection>

      <DocSection title="Related guides">
        <ul>
          <li><Link href="/docs/intro/admin/result/sessions">Exam Sessions</Link></li>
          <li><Link href="/docs/intro/admin/result/report-cards">Report Cards</Link></li>
          <li><Link href="/docs/intro/admin/result/compute">Compute</Link></li>
        </ul>
      </DocSection>
    </DocsShell>
  );
}
