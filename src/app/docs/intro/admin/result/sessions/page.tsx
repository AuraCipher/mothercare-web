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

export default function AdminResultSessionsPage() {
  return (
    <DocsShell
      title="Exam Sessions"
      subtitle="Create sessions, manage exam types, and add exams within a term or board cycle."
      nav={introNav}
      variant="intro"
    >
      <DocSection title="Overview">
        <p>
          An <strong>exam session</strong> groups related exams (e.g. First Term 2026, Annual Board) within an
          academic year. The session page at <code>/admin/result/sessions/[sessionId]</code> shows overview
          stats, exam list with progress, and tools to rename the session, manage exam types, and add new exams.
        </p>
        <p>Sessions are created from the <Link href="/docs/intro/admin/result">Result &amp; Grade hub</Link>.</p>
      </DocSection>

      <DocSection title="Before you start">
        <ul>
          <li><strong>Active academic year</strong> — required to create sessions and exams.</li>
          <li><strong>RESULT → Create</strong> for new sessions and exams.</li>
          <li>Plan session date range covering all exams in the term.</li>
        </ul>
      </DocSection>

      <DocSection title="Session page header">
        <DocTable
          headers={['Element', 'Description']}
          rows={[
            ['H1', 'Session name from summary'],
            ['Subtitle', 'startDate — endDate (en-PK format)'],
            ['All sessions', 'Back link → /admin/result'],
            ['Rename', 'Opens ExamSessionModal edit — hidden if archived'],
            ['Types (N)', 'Opens ExamTypeManagerModal — always visible'],
          ]}
        />
      </DocSection>

      <DocSection title="New exam session modal">
        <DocTable
          headers={['Field', 'Required', 'Notes']}
          rows={[
            ['Name', 'Yes', 'e.g. First Term Examination'],
            ['Start', 'Yes', 'Date — session start'],
            ['End', 'Yes', 'Date — must be ≥ start'],
          ]}
        />
        <p>
          Create mode title: <strong>New exam session</strong>. Buttons: <strong>Cancel</strong>,{' '}
          <strong>Create</strong>. Edit mode title: <strong>Rename session</strong>, button <strong>Save</strong>.
        </p>
        <p>API: POST createExamSession, PATCH updateExamSession.</p>
      </DocSection>

      <DocSection title="Step-by-step: create a session">
        <DocSteps>
          <DocStep title="Open Result hub">
            <code>/admin/result</code> — click <strong>Add session</strong> or <strong>Create first session</strong>.
          </DocStep>
          <DocStep title="Fill modal">
            Enter name and date range. Click <strong>Create</strong>.
          </DocStep>
          <DocStep title="Add exam types">
            On session page click <strong>Types (N)</strong>. Add types e.g. Written (weight 70%), Viva (30%).
          </DocStep>
          <DocStep title="Create first exam">
            In Exams section click <strong>Add</strong> → Create Exam modal → <strong>Create &amp; continue</strong>.
          </DocStep>
        </DocSteps>
      </DocSection>

      <DocSection title="Exam Type Manager modal">
        <p>Title: <strong>Manage Exam Types</strong></p>
        <DocTable
          headers={['Element', 'Description']}
          rows={[
            ['Add section', 'Name*, Weight %, Add / Adding… button'],
            ['Type row', 'Name, Default weight: N% or —'],
            ['Edit inline', 'Save, Cancel on existing type'],
            ['Delete', 'Confirm: Delete exam type name — types linked to exams cannot be deleted'],
            ['Close', 'Dismiss modal'],
            ['readOnly (archived)', 'View types only — no add/edit/delete'],
          ]}
        />
      </DocSection>

      <DocSection title="Overview collapsible section">
        <DocTable
          headers={['Element', 'Content']}
          rows={[
            ['Title', 'Overview'],
            ['Subtitle', 'X% marks · N exams'],
            ['Progress', 'Session marks filled/total slots'],
            ['Stat tiles', 'Types, Exams counts'],
          ]}
        />
      </DocSection>

      <DocSection title="Exams collapsible section">
        <DocTable
          headers={['Element', 'Description']}
          rows={[
            ['Title', 'Exams'],
            ['Subtitle', 'No exams yet OR N exam(s) · X% session progress'],
            ['Badge', 'Exam count'],
            ['Add', 'Opens CreateExamModal — hidden if archived'],
          ]}
        />
      </DocSection>

      <DocSection title="Create Exam modal">
        <DocTable
          headers={['Field', 'Required', 'Notes']}
          rows={[
            ['Name', 'Yes', 'Exam title'],
            ['Exam type', 'Yes', 'Select from session types'],
            ['Weight %', 'No', 'Override type default'],
            ['Date range', 'Checkbox', 'Enables end date'],
            ['Start', 'Yes', 'Exam date or range start'],
            ['End', 'If range', 'End date'],
          ]}
        />
        <p>
          Button: <strong>Create &amp; continue</strong> / <strong>Creating…</strong>. Empty types:{' '}
          <em>Add exam types first using Manage Types.</em> Navigates to exam detail on success.
        </p>
      </DocSection>

      <DocSection title="Exam list (ExamListSection)">
        <p>Per exam row (collapsed):</p>
        <ul>
          <li>Status badge: <strong>DRAFT</strong> or <strong>ACTIVE</strong></li>
          <li>Meta: percent% marks · examType · date</li>
          <li>Progress: Marks filled/total slots</li>
        </ul>
        <p>Expanded: type, weight %, date, class count. Per-class breakdown toggle loads structure.</p>
        <p>Click exam name → <code>/admin/result/sessions/[sessionId]/exams/[examId]</code></p>
        <p>Empty: <em>No exams yet. Use Add Exam above to create one.</em></p>
      </DocSection>

      <DocSection title="Permission matrix">
        <DocTable
          headers={['Action', 'Permission']}
          rows={[
            ['View session', 'RESULT → Read'],
            ['Create/rename session', 'RESULT → Create / Update'],
            ['Manage types', 'RESULT → Create / Update / Delete'],
            ['Add exam', 'RESULT → Create'],
          ]}
        />
      </DocSection>

      <DocSection title="Archived academic year">
        <p>
          <strong>Rename</strong> and <strong>Add</strong> hidden. Types modal read-only. Existing exams viewable
          — open for marks review on exam page (read-only).
        </p>
      </DocSection>

      <DocSection title="What happens when">
        <DocTable
          headers={['Event', 'Effect']}
          rows={[
            ['Session load', 'GET session summary + GET exams list'],
            ['Expand exam class breakdown', 'GET exam structure per class'],
            ['Create exam', 'POST exam — empty structure until generated on exam page'],
            ['Delete type with linked exams', 'API rejects — modal shows error'],
          ]}
        />
      </DocSection>

      <DocSection title="Troubleshooting">
        <DocFaq
          items={[
            {
              q: 'Cannot create exam — no types in dropdown',
              a: 'Open Types (N) and add at least one exam type first.',
            },
            {
              q: 'End date before start',
              a: 'Modal validation requires end ≥ start on session and exam dates.',
            },
            {
              q: 'Session marks % low',
              a: 'Open each exam, generate structure, enter marks. Progress aggregates all exams in session.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Session date range tips">
        <p>
          Set session start/end to cover all exams in the term. Reports and analytics filter by session — dates
          outside range may exclude exam marks from session-level aggregates.
        </p>
      </DocSection>

      <DocSection title="Exam list progress">
        <p>
          Expanding an exam row shows per-class breakdown after GET structure API call. Use this to see which
          classes still need marks before publishing.
        </p>
      </DocSection>

      <DocSection title="Collapsible sections">
        <p>
          Session page uses accordion sections (Overview, Exams) — click header to expand/collapse. Badge on Exams
          shows live exam count without expanding.
        </p>
      </DocSection>

      <DocSection title="Quick reference — routes">
        <DocTable
          headers={['Screen', 'Path']}
          rows={[
            ['Result hub', '/admin/result'],
            ['Session detail', '/admin/result/sessions/[sessionId]'],
            ['Exam detail / marks', '/admin/result/sessions/[sessionId]/exams/[examId]'],
            ['Result reports', '/admin/result/reports'],
          ]}
        />
      </DocSection>

      <DocSection title="Quick reference">
        <p>Route: <code>/admin/result/sessions/[sessionId]</code> · Modals: New exam session, Manage Exam Types, Create Exam.</p>
        <p>Exam detail marks entry: click exam name in list to open exam page.</p>
        <p>Types modal manages default weight % used when creating new exams.</p>
      </DocSection>

      <DocSection title="Related guides">
        <ul>
          <li><Link href="/docs/intro/admin/result/marks">Marks Entry</Link></li>
          <li><Link href="/docs/intro/admin/result">Result hub</Link></li>
        </ul>
      </DocSection>
    </DocsShell>
  );
}
