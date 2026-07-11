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

export default function AdminResultPage() {
  return (
    <DocsShell
      title="Result & Grade"
      subtitle="Exam sessions, marks entry, analytics, report cards, and result reports."
      nav={introNav}
      variant="intro"
    >
      <DocSection title="Overview">
        <p>
          <strong>Result &amp; Grade</strong> at <code>/admin/result</code> manages the full exam lifecycle:
          create exam sessions, define exam types, build exams per class, enter marks, compute weighted results,
          generate report cards, and analyze pass/fail trends.
        </p>
        <p>
          Subtitle: <em>Exam sessions, marks entry, analytics &amp; report cards.</em>
        </p>
        <p>
          <strong>Who uses it:</strong> exam cell staff and admins with <strong>RESULT</strong> module
          permissions.
        </p>
      </DocSection>

      <DocSection title="Before you start">
        <ul>
          <li><strong>Branch + academic year</strong> selected — required for all result data.</li>
          <li><strong>Classes and subjects</strong> configured under Admin → Classes.</li>
          <li><strong>Students enrolled</strong> in sections for marks grids.</li>
          <li><strong>Teachers assigned</strong> if using teacher portal marks entry.</li>
        </ul>
      </DocSection>

      <DocSection title="Hub navigation cards">
        <DocTable
          headers={['Card', 'Description', 'Route']}
          rows={[
            ['Analytics', 'Pass/fail, grades, charts & trends', '/admin/result/analytics'],
            ['Report Cards', 'Generate & print exam report cards', '/admin/result/report-cards'],
            ['Reports', 'Generate class result sheets & exports', '/admin/result/reports'],
          ]}
        />
        <p>Exam sessions are listed on the hub itself — click a session row to open session detail.</p>
      </DocSection>

      <DocSection title="Hub overview panel">
        <p>When session summaries load:</p>
        <DocTable
          headers={['Stat', 'Source']}
          rows={[
            ['Sessions', 'Count of exam sessions in active AY'],
            ['Exams', 'Sum of examCount across sessions'],
            ['Avg marks', 'Average marksProgress.percent across sessions'],
            ['Report cards', 'Sum of reportCardCount'],
          ]}
        />
        <p>Link: <strong>Full Analytics →</strong> to analytics page.</p>
      </DocSection>

      <DocSection title="Session list">
        <p>Each row shows:</p>
        <ul>
          <li>Session name</li>
          <li>Date range: start — end (en-PK format)</li>
          <li>Meta: N exam(s) · N type(s) · X% marks</li>
        </ul>
        <p>Click row → <code>/admin/result/sessions/[sessionId]</code></p>
        <p>
          Buttons (active year only): <strong>Add session</strong>, empty-state <strong>Create first session</strong>.
        </p>
      </DocSection>

      <DocSection title="End-to-end workflow">
        <DocSteps>
          <DocStep title="Create exam session">
            <strong>Add session</strong> → New exam session modal (name, start, end dates).
          </DocStep>
          <DocStep title="Manage exam types">
            On session page, <strong>Types (N)</strong> → add types with default weight %.
          </DocStep>
          <DocStep title="Create exams">
            <strong>Add</strong> in Exams section → Create Exam modal → navigates to exam detail.
          </DocStep>
          <DocStep title="Generate structure">
            On exam page, Structure section → pick classes/subjects → <strong>Generate structure</strong>.
          </DocStep>
          <DocStep title="Enter marks">
            Marks Entry section — set Total/Pass per subject, enter scores, mark Absent checkbox.
          </DocStep>
          <DocStep title="Publish exam">
            <strong>Publish</strong> → status ACTIVE — locks marks; optional teacher entry disabled.
          </DocStep>
          <DocStep title="Report cards">
            <Link href="/docs/intro/admin/result/report-cards">Report Cards</Link> — print from raw marks, or
            use compute APIs for published graded cards (see Compute guide).
          </DocStep>
          <DocStep title="Analytics & reports">
            Review pass rates on <Link href="/docs/intro/admin/result/analytics">Analytics</Link> and export via{' '}
            <code>/admin/result/reports</code>.
          </DocStep>
        </DocSteps>
      </DocSection>

      <DocSection title="Exam status lifecycle">
        <DocTable
          headers={['Status', 'Marks editable', 'Teacher entry']}
          rows={[
            ['DRAFT', 'Yes (admin)', 'Optional — Allow teachers to enter marks checkbox'],
            ['ACTIVE', 'No — read-only', 'Locked — publishing always disables teacher entry'],
          ]}
        />
        <p>
          Draft messages: <em>Draft — teachers can enter marks…</em> or <em>Draft — teacher marks entry is disabled by admin.</em>
        </p>
        <p>
          Active message: <em>Published (Active) — admin marks are read-only. Teachers cannot enter marks until set back to Draft.</em>
        </p>
      </DocSection>

      <DocSection title="Permission matrix">
        <DocTable
          headers={['Action', 'Read', 'Create', 'Update', 'Delete']}
          rows={[
            ['View hub & analytics', '✓', '—', '—', '—'],
            ['Create/edit sessions', '✓', '✓', '✓', '—'],
            ['Manage exam types', '✓', '✓', '✓', '✓'],
            ['Create/edit exams', '✓', '✓', '✓', '✓'],
            ['Enter marks', '✓', '✓', '✓', '—'],
            ['Publish exam', '✓', '—', '✓', '—'],
            ['Compute results / report cards', '✓', '✓', '✓', '—'],
            ['Print report cards', '✓', '—', '—', '—'],
          ]}
        />
        <p>Module key: <strong>RESULT</strong>. Routes: <code>/admin/result/**</code>, <code>/admin/exam-sessions/**</code>.</p>
      </DocSection>

      <DocSection title="Archived academic year">
        <DocTable
          headers={['Area', 'Behavior']}
          rows={[
            ['Hub', 'Hides Add session, Create first session'],
            ['Session page', 'Hides Rename, Add exam; Types modal read-only'],
            ['Exam page', 'Hides Publish/Set Draft/Delete; forms read-only'],
            ['Analytics, Report Cards, Reports', 'No archived guard — read-oriented operations'],
            ['Compute route', 'Redirects to report-cards; ResultsSection not mounted'],
          ]}
        />
      </DocSection>

      <DocSection title="What happens when">
        <DocTable
          headers={['Event', 'Effect']}
          rows={[
            ['Hub load', 'GET exam-sessions + parallel GET session summaries'],
            ['Create session', 'POST /admin/exam-sessions'],
            ['Create exam', 'POST exam under session → structure empty until generated'],
            ['Generate structure', 'POST structure — creates class/subject slots for marks grid'],
            ['Save marks', 'POST marks per subject column'],
            ['Publish', 'PATCH exam status ACTIVE'],
            ['Compute results', 'POST compute-results — weighted subject percentages (ResultsSection API)'],
            ['Compute report cards', 'POST compute-report-cards — grades and ranks'],
          ]}
        />
      </DocSection>

      <DocCallout variant="info" title="Two report card paths">
        <strong>Report Cards page</strong> builds printable cards from raw marks grids.{' '}
        <strong>Compute workflow</strong> (ResultsSection component) creates published graded report card records
        via API — note compute UI is not currently mounted on a live page; see{' '}
        <Link href="/docs/intro/admin/result/compute">Compute</Link>.
      </DocCallout>

      <DocSection title="Passing rules">
        <p>
          Analytics and reports use <strong>40%</strong> minimum passing threshold. Grades <strong>D, E, F</strong>{' '}
          count as fail. Subject marks show P/F per subject in exam marks sheets.
        </p>
      </DocSection>

      <DocSection title="Troubleshooting">
        <DocFaq
          items={[
            {
              q: 'No academic year selected',
              a: 'Select branch and AY in sidebar, press Go. Hub shows empty until activeAYId is set.',
            },
            {
              q: 'Cannot add session',
              a: 'Academic year is archived. Switch to active year or view existing sessions read-only.',
            },
            {
              q: 'Marks progress stuck at 0%',
              a: 'Generate exam structure and enter marks. Progress = filled slots / total slots.',
            },
            {
              q: 'Where is Compute page?',
              a: '/admin/result/compute redirects to report-cards. Compute APIs exist in ResultsSection component.',
            },
            {
              q: 'Reports vs Analytics',
              a: 'Hub Reports card goes to /admin/result/reports (printable sheets). Analytics card is charts-only.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Exam weight and types">
        <p>
          Exam types carry default weight %. Individual exams can override weight on exam detail page. Weighted
          compute (when enabled) combines multiple ACTIVE exams per session using these percentages.
        </p>
      </DocSection>

      <DocSection title="Teacher portal marks">
        <p>
          While exam is DRAFT with <strong>Allow teachers to enter marks</strong> enabled, assigned teachers enter
          marks in <code>/teacher</code> portal. Publishing to ACTIVE always locks teacher entry regardless of
          checkbox state at publish time.
        </p>
      </DocSection>

      <DocSection title="Quick reference">
        <p>Route: <code>/admin/result</code> · Module key RESULT · Passing threshold 40% · Grades D/E/F = fail.</p>
        <p>Compute route redirects to report-cards — see Compute doc for graded record workflow.</p>
      </DocSection>

      <DocSection title="Related guides">
        <ul>
          <li><Link href="/docs/intro/admin/result/sessions">Exam Sessions</Link></li>
          <li><Link href="/docs/intro/admin/result/marks">Marks Entry</Link></li>
          <li><Link href="/docs/intro/admin/result/report-cards">Report Cards</Link></li>
          <li><Link href="/docs/intro/admin/result/compute">Compute</Link></li>
          <li><Link href="/docs/intro/admin/result/analytics">Analytics</Link></li>
          <li><Link href="/docs/intro/admin/classes">Classes &amp; subjects</Link></li>
        </ul>
      </DocSection>
    </DocsShell>
  );
}
