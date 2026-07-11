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

export default function AdminFeesStructuresPage() {
  return (
    <DocsShell
      title="Fee Structures"
      subtitle="Set per-class fee amounts and per-student overrides before monthly generation."
      nav={introNav}
      variant="intro"
    >
      <DocSection title="Overview">
        <p>
          <strong>Fee Structures</strong> at <code>/admin/fees/structures</code> defines how much each class
          pays for each fee head. The page shows a matrix: classes as rows, fee heads as columns, with a
          Total column. Amounts entered here feed directly into <strong>Generate Fees</strong> — when you
          generate monthly dues, the system copies structure amounts to each enrolled student.
        </p>
        <p>
          Click a class name to open <strong>per-student overrides</strong> for scholarships, concessions, or
          custom amounts on individual heads.
        </p>
      </DocSection>

      <DocSection title="Before you start">
        <ul>
          <li>
            <strong>Branch + academic year</strong> selected — structures are year-scoped.
          </li>
          <li>
            <strong>Fee heads</strong> created under <Link href="/docs/intro/admin/fees">Fee Heads</Link>{' '}
            (<code>/admin/fees/heads</code>) — only active heads appear as columns.
          </li>
          <li>
            <strong>Classes/sections</strong> exist for the academic year — rows come from branch sections
            API.
          </li>
        </ul>
      </DocSection>

      <DocSection title="Class matrix — main page">
        <DocTable
          headers={['Column', 'Content', 'Interaction']}
          rows={[
            ['Class', 'Section name (e.g. Grade 5 — A)', 'Click → /admin/fees/structures/{groupId}'],
            ['{Fee head names}', 'Amount in PKR per head', 'Click cell → inline number input'],
            ['Total', 'Sum of head amounts', 'Read-only'],
          ]}
        />
        <p>
          <strong>Inline edit:</strong> click an amount cell → type PKR value → ✓ save or ✕ cancel. Empty
          input shows toast <em>Enter an amount</em>. Invalid number shows <em>Invalid amount</em>. Saved as
          paise: <code>Math.round(parseFloat × 100)</code>.
        </p>
      </DocSection>

      <DocSection title="Step-by-step: set class amounts">
        <DocSteps>
          <DocStep title="Open Fee Structures">
            From Fees hub card <strong>Fee Structures</strong> or sidebar navigation.
          </DocStep>
          <DocStep title="Review the matrix">
            Each row is a class section. Each column is an active fee head (Monthly, Term, Annual, One-Time
            categories from head setup).
          </DocStep>
          <DocStep title="Enter amounts">
            Click a cell, type the monthly (or period) amount in PKR, press ✓ or Enter. Toast confirms save.
            POST /admin/fee-structures with academicYearId, groupId, feeHeadId, amount.
          </DocStep>
          <DocStep title="Verify totals">
            Check the Total column per class matches your fee policy before running Generate Fees.
          </DocStep>
        </DocSteps>
      </DocSection>

      <DocSection title="Per-student overrides — class detail page">
        <p>
          Route: <code>/admin/fees/structures/[groupId]</code>. Title: <strong>ClassName — Student Fees</strong>.
        </p>
        <DocTable
          headers={['Column', 'Content']}
          rows={[
            ['Roll', 'Student roll number'],
            ['Student', 'Student name'],
            ['{Fee head columns}', 'Override amount or class default'],
            ['Total', 'Sum for student'],
          ]}
        />
        <p>
          <strong>Back to Fee Structures</strong> returns to the matrix. Customized cells are highlighted
          (accent color). Click a cell → inline edit → save on Enter or blur via PUT{' '}
          <code>/admin/students/[studentId]/custom-fee</code> with concessionReason{' '}
          <em>Per-head custom</em>.
        </p>
      </DocSection>

      <DocSection title="Step-by-step: student concession">
        <DocSteps>
          <DocStep title="Open class from matrix">
            Click the class name link on the structures page.
          </DocStep>
          <DocStep title="Find the student">
            Scroll the roster for that section.
          </DocStep>
          <DocStep title="Override a head amount">
            Click the cell for the fee head (e.g. Tuition). Enter reduced amount. Save — cell highlights as
            customized.
          </DocStep>
          <DocStep title="Generate fees">
            Next Generate Fees run uses the override for that student × head instead of class default.
          </DocStep>
        </DocSteps>
      </DocSection>

      <DocSection title="Fee heads reference (prerequisite)">
        <p>
          Managed at <code>/admin/fees/heads</code> — not the structures page, but required first:
        </p>
        <DocTable
          headers={['Field', 'Type', 'Notes']}
          rows={[
            ['Name', 'Text', 'Required — e.g. Tuition'],
            ['Category', 'Select', 'MONTHLY, TERM, ANNUAL, ONE_TIME'],
            ['Description', 'Text', 'Optional'],
            ['Optional', 'Checkbox', 'isOptional — e.g. Transport'],
            ['Status', 'Badge', 'Active / Inactive after deactivate'],
          ]}
        />
        <p>
          Buttons: <strong>Add Head</strong>, inline <strong>Create</strong> / <strong>Update</strong>,{' '}
          <strong>Cancel</strong>. Deactivate opens confirm: <strong>Deactivate Fee Head?</strong> —{' '}
          <em>This fee head will be marked inactive and hidden from new fee generation.</em>
        </p>
      </DocSection>

      <DocSection title="Generate Fees connection">
        <p>
          After structures are set, open <code>/admin/fees/generate</code>:
        </p>
        <DocTable
          headers={['Control', 'Description']}
          rows={[
            ['Month / Year', 'Target billing period'],
            ['Classes to Include', 'Collapsible — checkboxes per section; default all selected'],
            ['Fee Heads to Include', 'Grouped Monthly/Term/Annual/One-Time; default all active'],
            ['Generate', 'Create new fees for selected scope'],
            ['Update', 'Recalculate existing fees from current structures'],
            ['Regenerate', 'Delete unpaid + recreate — confirm modal first'],
          ]}
        />
        <DocCallout variant="warn" title="Regenerate confirm">
          <strong>Regenerate Fees?</strong> — <em>This will delete unpaid fees for the selected month and
          recreate them. Fees with payments are protected.</em>
        </DocCallout>
      </DocSection>

      <DocSection title="Permission matrix">
        <DocTable
          headers={['Action', 'Read', 'Create', 'Update', 'Delete']}
          rows={[
            ['View structure matrix', '✓', '—', '—', '—'],
            ['Inline edit class cell', '✓', '✓ (POST new)', '✓ (POST upsert)', '—'],
            ['Student override', '✓', '—', '✓', '—'],
            ['Manage fee heads', '✓', '✓', '✓', '✓ deactivate'],
            ['Generate fees', '✓', '✓', '✓', '✓ regenerate'],
          ]}
        />
      </DocSection>

      <DocSection title="Archived academic year">
        <p>
          No dedicated frontend banner on structures pages. Backend <code>staffPermissionMiddleware</code>{' '}
          applies <em>archivedCanRead/Create/Update/Delete</em> when academic year status is ARCHIVED.
          Restricted staff without archived update cannot edit cells.
        </p>
      </DocSection>

      <DocSection title="What happens when">
        <DocTable
          headers={['Event', 'Effect']}
          rows={[
            ['Matrix loads', 'GET sections + GET active fee-heads + GET fee-structures for AY'],
            ['Save class cell', 'POST /admin/fee-structures — upsert amount for groupId × headId'],
            ['Save student override', 'PUT custom-fee — stores per-head overrides + concession reason'],
            ['Generate fees', 'Copies structure (or override) to StudentFee rows per student'],
            ['Deactivate head', 'Head hidden from matrix columns and generation pickers'],
            ['Skipped on generate', 'Students/classes with no structure for a head are skipped'],
          ]}
        />
      </DocSection>

      <DocSection title="Troubleshooting">
        <DocFaq
          items={[
            {
              q: 'Matrix is empty — no columns',
              a: 'No active fee heads. Create heads at /admin/fees/heads first.',
            },
            {
              q: 'Matrix is empty — no rows',
              a: 'No sections for this academic year. Set up classes under Admin → Classes.',
            },
            {
              q: 'Generate skipped students',
              a: 'Missing structure for that class × head combination. Fill the matrix cell.',
            },
            {
              q: 'Override not applied after generate',
              a: 'Run Update mode on Generate Fees to recalc existing month, or Regenerate unpaid fees.',
            },
            {
              q: 'Cannot edit cell — 403',
              a: 'Restricted staff lacks Fees → Update or archived year blocks writes.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Generate Fees modes explained">
        <DocTable
          headers={['Mode', 'When to use', 'Risk']}
          rows={[
            ['Generate', 'First time creating fees for a month', 'Safe — only creates missing rows'],
            ['Update', 'Structures changed after generation', 'Recalculates existing unpaid amounts'],
            ['Regenerate', 'Major structure overhaul mid-month', 'Deletes unpaid fees — paid fees protected'],
          ]}
        />
      </DocSection>

      <DocSection title="Per-student override tips">
        <p>
          Use overrides sparingly and document reason via concession text on the API. Overrides persist across
          months until changed — updating class matrix does not automatically overwrite customized students.
        </p>
      </DocSection>

      <DocSection title="Related guides">
        <ul>
          <li><Link href="/docs/intro/admin/fees">Fees overview</Link></li>
          <li><Link href="/docs/intro/admin/fees/collections">Collections</Link></li>
          <li><Link href="/docs/intro/admin/classes">Classes</Link> — sections prerequisite</li>
        </ul>
      </DocSection>
    </DocsShell>
  );
}
