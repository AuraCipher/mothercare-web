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

export default function AdminResultComputePage() {
  return (
    <DocsShell
      title="Compute Results"
      subtitle="Subject results, class ranks, and published report card records."
      nav={introNav}
      variant="intro"
    >
      <DocSection title="Overview">
        <p>
          <strong>Compute</strong> is the backend workflow that turns entered marks into weighted subject
          results, overall grades, and class ranks. The route <code>/admin/result/compute</code> currently{' '}
          <strong>redirects immediately</strong> to <code>/admin/result/report-cards</code> — it renders no UI.
        </p>
        <p>
          The intended compute interface lives in <code>ResultsSection</code> component, which implements the
          full compute and publish workflow but is <strong>not mounted on any live page</strong> today. This
          document describes the designed workflow and APIs so exam cell staff understand the complete pipeline.
        </p>
      </DocSection>

      <DocSection title="Intended workflow">
        <p>Workflow text from ResultsSection:</p>
        <p>
          <em>publish exams → enter marks → compute results → compute report cards → publish report cards</em>
        </p>
        <DocSteps>
          <DocStep title="Enter and publish marks">
            Complete marks on exam pages. <strong>Publish</strong> each exam to ACTIVE.
          </DocStep>
          <DocStep title="Compute subject results">
            <strong>Compute results</strong> — calculates weighted subject percentages for all published exams
            in the session.
          </DocStep>
          <DocStep title="Compute report cards">
            <strong>Compute all report cards</strong> or per-class <strong>Compute class report cards</strong> —
            builds overall grades and class ranks from subject results.
          </DocStep>
          <DocStep title="Publish report cards">
            Review DRAFT cards → <strong>Publish</strong> individual cards or <strong>Publish all drafts</strong>.
          </DocStep>
          <DocStep title="Print">
            Use <Link href="/docs/intro/admin/result/report-cards">Report Cards</Link> for quick print from
            marks, or View modal in ResultsSection for published graded records.
          </DocStep>
        </DocSteps>
      </DocSection>

      <DocSection title="Session-level buttons (ResultsSection)">
        <DocTable
          headers={['Button', 'Confirm title', 'Confirm message', 'API']}
          rows={[
            [
              'Compute results',
              'Compute subject results?',
              'Calculates weighted subject percentages for all published (Active) exams in this session. Existing results will be updated.',
              'POST computeResultSession',
            ],
            [
              'Compute all report cards',
              'Compute all report cards?',
              'Builds overall grades and class ranks from subject results. Run after computing subject results.',
              'POST computeReportCardsSession',
            ],
          ]}
        />
        <p>Confirm button labels: <strong>Compute results</strong>, <strong>Compute report cards</strong>.</p>
      </DocSection>

      <DocSection title="Class-level controls">
        <DocTable
          headers={['Control', 'Description']}
          rows={[
            ['Class', 'Select dropdown'],
            ['Refresh', 'Reload class results and report cards'],
            ['Meta', 'Session: N results · N report cards'],
            ['Compute class report cards', 'Per-class compute API'],
            ['Publish all drafts', 'Bulk publish DRAFT status cards'],
          ]}
        />
      </DocSection>

      <DocSection title="Class result sheet table">
        <p>Title: <em>Class result sheet — class label</em></p>
        <DocTable
          headers={['Column', 'Content']}
          rows={[
            ['Student', 'Name — link if report card exists'],
            ['{Subject names}', 'Percentage per subject'],
            ['Overall', 'Report card overall %'],
            ['Grade', 'Overall grade letter'],
            ['Rank', 'Class rank'],
          ]}
        />
        <p>Empty: <em>No results for this class yet. Compute session results after marks are entered.</em></p>
      </DocSection>

      <DocSection title="Report cards list">
        <DocTable
          headers={['Element', 'Description']}
          rows={[
            ['Header', 'Report cards (published/total published)'],
            ['Card row', 'Name, % · grade · Rank N, status badge DRAFT or PUBLISHED'],
            ['View', 'Opens student report card modal'],
            ['Publish', 'DRAFT cards only — POST publishReportCard'],
          ]}
        />
      </DocSection>

      <DocSection title="Student report card modal">
        <DocTable
          headers={['Field', 'Content']}
          rows={[
            ['Header', 'Student name, session name'],
            ['Summary', 'Overall %, grade, rank, status'],
            ['Subjects', 'name — pct · grade per line'],
            ['Close', 'Dismiss modal'],
          ]}
        />
      </DocSection>

      <DocSection title="Before you start">
        <ul>
          <li>All exams in session <strong>published (ACTIVE)</strong> with complete marks.</li>
          <li>Exam types have correct <strong>weight %</strong> for weighted aggregation.</li>
          <li><strong>RESULT → Create</strong> for compute and publish actions.</li>
          <li>Active academic year (readOnly hides compute buttons in ResultsSection).</li>
        </ul>
      </DocSection>

      <DocSection title="Permission matrix">
        <DocTable
          headers={['Action', 'Permission']}
          rows={[
            ['View class results sheet', 'RESULT → Read'],
            ['Compute results / report cards', 'RESULT → Create'],
            ['Publish report card', 'RESULT → Update'],
            ['View student report card modal', 'RESULT → Read'],
          ]}
        />
      </DocSection>

      <DocSection title="Archived academic year">
        <p>
          ResultsSection <code>readOnly</code> mode hides all compute and publish buttons. Redirect route
          (compute → report-cards) still works for navigation.
        </p>
      </DocSection>

      <DocSection title="What happens when">
        <DocTable
          headers={['API', 'Effect']}
          rows={[
            ['POST compute-results', 'Recalculates SubjectResult rows from published exam marks × weights'],
            ['POST compute-report-cards (session)', 'Creates/updates ReportCard with overall %, grade, rank per student'],
            ['POST compute-report-cards (class)', 'Same scoped to one class'],
            ['POST publish report card', 'Sets card status PUBLISHED — visible to student/parent portals if enabled'],
            ['GET class results', 'Loads subject percentages for result sheet table'],
            ['GET class report cards', 'Lists DRAFT/PUBLISHED cards for publish workflow'],
          ]}
        />
      </DocSection>

      <DocCallout variant="warn" title="Current app state">
        Because ResultsSection is not mounted, compute buttons are not available in the live UI. Use API/admin
        tools or mount the component on the session page to enable this workflow. Meanwhile use{' '}
        <Link href="/docs/intro/admin/result/report-cards">Report Cards</Link> for printing from raw marks.
      </DocCallout>

      <DocSection title="Passing and grading">
        <p>
          Passing threshold: <strong>40%</strong> minimum. Grades <strong>D, E, F</strong> count as fail in
          analytics alignment. Weighted subject % combines multiple published exams per type weights.
        </p>
      </DocSection>

      <DocSection title="Troubleshooting">
        <DocFaq
          items={[
            {
              q: 'Compute page is blank then shows Report Cards',
              a: 'By design — compute/page.tsx redirects to report-cards. No standalone compute UI yet.',
            },
            {
              q: 'Compute results returns no data',
              a: 'Ensure exams are ACTIVE (published) and marks complete. Draft exams excluded from compute.',
            },
            {
              q: 'Report cards stuck in DRAFT',
              a: 'Click Publish on each card or Publish all drafts in ResultsSection when available.',
            },
            {
              q: 'Ranks look wrong',
              a: 'Re-run Compute all report cards after fixing marks. Ranks recalculate on compute.',
            },
            {
              q: 'Difference from Report Cards page',
              a: 'Report Cards page prints from raw marks client-side. Compute creates database graded records with ranks.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Mounting compute UI (technical note)">
        <p>
          To expose compute buttons in production, import <code>ResultsSection</code> on the session detail page
          or restore a dedicated compute route. Until then, compute APIs remain callable via admin tools that
          mount the component.
        </p>
      </DocSection>

      <DocSection title="Publish workflow">
        <DocSteps>
          <DocStep title="Compute results">
            Session-level — all ACTIVE exams must have complete marks.
          </DocStep>
          <DocStep title="Compute report cards">
            Session or class level — creates DRAFT cards.
          </DocStep>
          <DocStep title="Review class result sheet">
            Verify subject columns and ranks before publish.
          </DocStep>
          <DocStep title="Publish">
            Per card or Publish all drafts — status becomes PUBLISHED.
          </DocStep>
        </DocSteps>
      </DocSection>

      <DocSection title="Related guides">
        <ul>
          <li><Link href="/docs/intro/admin/result/marks">Marks Entry</Link></li>
          <li><Link href="/docs/intro/admin/result/report-cards">Report Cards (print)</Link></li>
          <li><Link href="/docs/intro/admin/result/analytics">Analytics</Link></li>
          <li><Link href="/docs/intro/admin/result/sessions">Exam Sessions</Link></li>
        </ul>
      </DocSection>
    </DocsShell>
  );
}
