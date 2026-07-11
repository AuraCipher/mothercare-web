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

export default function AdminResultAnalyticsPage() {
  return (
    <DocsShell
      title="Result Analytics"
      subtitle="Pass/fail breakdowns, grade distribution, and trends across sessions, exams, and classes."
      nav={introNav}
      variant="intro"
    >
      <DocSection title="Overview">
        <p>
          <strong>Result Analytics</strong> at <code>/admin/result/analytics</code> visualizes exam performance:
          marks entry progress, pass/fail rates, grade distribution, trends by session/exam/class, and
          subject-level averages. Filter by session, exam, class, and subject to drill down.
        </p>
        <p>
          Subtitle: <em>Pass/fail, grading, trends across sessions, exams &amp; classes</em>.
        </p>
      </DocSection>

      <DocSection title="Before you start">
        <ul>
          <li><strong>Academic year</strong> selected — else <em>No academic year selected</em>.</li>
          <li><strong>Exam sessions</strong> with marks entered (and ideally computed results for pass/fail charts).</li>
          <li><strong>RESULT → Read</strong> permission.</li>
        </ul>
      </DocSection>

      <DocSection title="Header actions">
        <DocTable
          headers={['Button', 'Effect']}
          rows={[
            ['Result & Grade', 'Back to hub'],
            ['Refresh', 'Reload analytics API'],
            ['Report Cards →', '/admin/result/report-cards'],
            ['Reports →', '/admin/result/reports'],
          ]}
        />
      </DocSection>

      <DocSection title="Filters section">
        <p>Section label: <strong>Filters</strong></p>
        <DocTable
          headers={['Filter', 'Default', 'Options']}
          rows={[
            ['Session', 'All sessions', 'Per-session names'],
            ['Exam', 'All exams', 'Shown only when session ≠ all'],
            ['Class', 'All classes', 'Active sections'],
            ['Subject', 'All subjects', 'Class subjects or analytics subjects'],
          ]}
        />
        <p><strong>Trend by</strong> toggles:</p>
        <DocTable
          headers={['Button', 'Shown when']}
          rows={[
            ['Sessions', 'sessionFilter = ALL'],
            ['Exams', 'Session selected, exam = all'],
            ['Classes', 'Always available'],
          ]}
        />
        <p>
          Footer note when loaded: <em>Passing threshold: N% · Grades D/E/F count as fail</em>
        </p>
      </DocSection>

      <DocSection title="KPI cards">
        <DocTable
          headers={['Card', 'Meaning']}
          rows={[
            ['Marks entry', 'Completion % of marks slots'],
            ['Pass rate', '% students passing threshold'],
            ['Passed', 'Count passed'],
            ['Failed', 'Count failed'],
            ['Avg %', 'Average percentage'],
            ['Results', 'Total subject result records'],
          ]}
        />
      </DocSection>

      <DocSection title="Charts">
        <DocTable
          headers={['Chart title', 'Subtitle / content']}
          rows={[
            ['Marks entry progress', 'percent% (filled/total slots) — progress bar'],
            ['Pass / Fail breakdown', 'Filtered subject results OR Subject-level results (all filters) — pie'],
            ['Grade distribution', 'Bar chart by grade letter'],
            ['Session/Exam/Class — pass rate & average trend', 'Green = pass rate · dashed = average %'],
            ['Session/Exam/Class — marks entry trend', 'Marks slot completion % · dashed = pass rate'],
            ['Session/Exam/Class — pass vs fail count', 'Stacked student/result counts'],
            ['Subject averages', 'Average % per subject — bar chart'],
            ['Subject pass rates', '% of students passing per subject'],
            ['Marks entry by class', 'Completion % per class for current filters'],
            ['Pass rate by class', 'Student pass % per class'],
          ]}
        />
      </DocSection>

      <DocSection title="Step-by-step: term review">
        <DocSteps>
          <DocStep title="Select session">
            Filter to one exam session e.g. First Term.
          </DocStep>
          <DocStep title="Review marks entry progress">
            Confirm all classes near 100% before analyzing pass rates.
          </DocStep>
          <DocStep title="Check pass/fail breakdown">
            KPI Passed/Failed and pie chart for overall health.
          </DocStep>
          <DocStep title="Drill by class">
            Trend by <strong>Classes</strong> — compare Pass rate by class chart.
          </DocStep>
          <DocStep title="Subject weak spots">
            <strong>Subject pass rates</strong> and <strong>Subject averages</strong> for curriculum planning.
          </DocStep>
        </DocSteps>
      </DocSection>

      <DocSection title="Step-by-step: single exam analysis">
        <DocSteps>
          <DocStep title="Select session + exam">
            Narrow exam filter to one published exam.
          </DocStep>
          <DocStep title="Optional class filter">
            Focus on one section for class teacher meeting.
          </DocStep>
          <DocStep title="Export via Reports">
            Click <strong>Reports →</strong> for printable fail lists and marks sheets.
          </DocStep>
        </DocSteps>
      </DocSection>

      <DocSection title="Empty state">
        <p><em>No analytics data available.</em></p>
        <p>
          Hint: <em>Run npx prisma db seed in the backend, or create sessions and compute results.</em>
        </p>
      </DocSection>

      <DocSection title="Permission matrix">
        <DocTable
          headers={['Action', 'Permission']}
          rows={[
            ['View analytics & charts', 'RESULT → Read'],
            ['Refresh', 'RESULT → Read'],
          ]}
        />
      </DocSection>

      <DocSection title="Archived academic year">
        <p>
          No archived guard — analytics loads historical data. Useful for year-over-year comparison when
          sidebar AY is archived.
        </p>
      </DocSection>

      <DocSection title="What happens when">
        <DocTable
          headers={['Event', 'Effect']}
          rows={[
            ['Page load', 'GET exam-sessions, sections, GET result analytics with filter params'],
            ['Session change', 'Reloads exams dropdown; resets dependent filters'],
            ['Class change', 'Reloads subject filter from section subjects'],
            ['Refresh', 'Re-fetches GET /admin/result/analytics'],
            ['Compute not run', 'Pass/fail charts may be empty — run compute workflow first'],
          ]}
        />
      </DocSection>

      <DocCallout variant="tip" title="Passing rules">
        Default passing: <strong>40%</strong> or above. Grades <strong>D, E, F</strong> always count as fail
        in analytics even if above 40% on percentage scale.
      </DocCallout>

      <DocSection title="Troubleshooting">
        <DocFaq
          items={[
            {
              q: 'No analytics data available',
              a: 'Create exam session, enter marks, optionally run compute. Seed data if dev environment.',
            },
            {
              q: 'Pass/fail chart empty but marks exist',
              a: 'Subject results require compute-results API. See Compute guide.',
            },
            {
              q: 'Exam filter not visible',
              a: 'Select a specific session first — exam dropdown appears when session ≠ All.',
            },
            {
              q: 'Subject filter empty',
              a: 'Select a class to load section subjects, or use subjects from analytics payload.',
            },
            {
              q: 'Trend toggle missing',
              a: 'Sessions toggle only when viewing All sessions. Exams toggle needs session selected.',
            },
            {
              q: 'Grade distribution empty',
              a: 'Run compute workflow first — grade bars need computed subject results, not raw marks alone.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Filter combination examples">
        <DocTable
          headers={['Goal', 'Session', 'Exam', 'Class', 'Trend by']}
          rows={[
            ['Whole school overview', 'All sessions', '—', 'All', 'Sessions'],
            ['One term deep dive', 'First Term', 'All exams', 'All', 'Exams'],
            ['Weak class intervention', 'Selected', 'All', 'Grade 8 — A', 'Classes'],
            ['Single subject review', 'Selected', 'One exam', 'One class', 'Subject filter'],
          ]}
        />
      </DocSection>

      <DocSection title="Marks entry progress KPI">
        <p>
          When marks entry KPI is below 100%, open session → each exam → complete Structure and Marks before
          trusting pass/fail charts — empty slots skew fail rates downward.
        </p>
      </DocSection>

      <DocSection title="Quick reference">
        <p>Route: <code>/admin/result/analytics</code> · GET /admin/result/analytics · Filter by session, exam, class, subject.</p>
        <p>Links to Report Cards and Reports in header for export after analysis.</p>
      </DocSection>

      <DocSection title="Related guides">
        <ul>
          <li><Link href="/docs/intro/admin/result">Result hub</Link></li>
          <li><Link href="/docs/intro/admin/result/compute">Compute</Link></li>
          <li><Link href="/docs/intro/admin/result/report-cards">Report Cards</Link></li>
          <li><Link href="/docs/intro/admin/result/marks">Marks Entry</Link></li>
        </ul>
      </DocSection>
    </DocsShell>
  );
}
