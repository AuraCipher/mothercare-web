import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocCodeBlock, DocSection, DocTable } from '@/components/docs/doc-blocks';
import { apiNav } from '@/lib/docs/navigation';

const pre = 'overflow-x-auto rounded-lg border border-warm-card-border bg-warm-card p-4 text-xs leading-relaxed text-warm-cream';

export default function ApiAcademicYearPage() {
  return (
    <DocsShell
      title="Academic Year & Batch Promotion"
      subtitle="Lifecycle states, activation effects, and the four-phase batch promotion wizard — traced from Prisma schema through services to admin UI."
      nav={apiNav}
      variant="api"
    >
      <p>
        Operational data in MCS is scoped by <strong>branch</strong> and <strong>academic year</strong>.
        Year transitions are managed through explicit status changes and an optional batch promotion wizard
        that copies structure from the current ACTIVE year into a BUILD_STAGE year before go-live.
      </p>

      <h2>Key source files</h2>
      <DocTable
        headers={['File', 'Responsibility']}
        rows={[
          [<code>backend/src/modules/admin/services/academic-year.service.ts</code>, 'CRUD, publish, archive, pause, members'],
          [<code>backend/src/modules/admin/services/batch-promotion.service.ts</code>, 'Promotion run phases DRAFT → PUBLISHED'],
          [<code>backend/src/modules/admin/batch-promotion.constants.ts</code>, 'Carry option defaults and labels'],
          [<code>backend/src/modules/admin/routes/academic-year.routes.ts</code>, 'REST routes + promotion mount'],
          [<code>backend/src/modules/admin/routes/batch-promotion.routes.ts</code>, 'Promotion wizard API'],
          [<code>web/src/app/admin/academic-years/[id]/promote/page.tsx</code>, 'Admin 4-step promotion UI'],
          [<code>backend/prisma/schema.prisma</code>, 'AcademicYear, BatchPromotionRun, snapshots'],
        ]}
      />

      <h2>Academic year statuses</h2>
      <pre className={pre}>
{`stateDiagram-v2
  [*] --> BUILD_STAGE: POST /academic-years
  BUILD_STAGE --> ACTIVE: PATCH publish (or batch promotion publish)
  ACTIVE --> ON_HOLD: PATCH pause
  ON_HOLD --> ACTIVE: PATCH resume
  ACTIVE --> ARCHIVED: PATCH archive (or batch promotion publish archives source)
  ARCHIVED --> BUILD_STAGE: PATCH unarchive target=BUILD_STAGE
  ARCHIVED --> ON_HOLD: PATCH unarchive target=ON_HOLD
  ARCHIVED --> [*]: DELETE (confirm label required)`}
      </pre>

      <DocTable
        headers={['Status', 'Who uses it', 'Writes', 'Notes']}
        rows={[
          [<code>BUILD_STAGE</code>, 'Admins only', 'Full setup', 'Only one per branch at a time (enforced on create)'],
          [<code>ACTIVE</code>, 'All portals', 'Normal operations', 'Exactly one ACTIVE per branch when published'],
          [<code>ON_HOLD</code>, 'Paused year', 'Limited', 'Resume returns to ACTIVE'],
          [<code>ARCHIVED</code>, 'Historical', 'Read-only*', '*Unless staff has archived_ay_access permission'],
        ]}
      />

      <h2>What happens when a year becomes ACTIVE</h2>
      <p>
        Two paths activate a year: <strong>direct publish</strong> (
        <code>academicYearService.publish()</code>) or <strong>batch promotion publish</strong> (
        <code>batchPromotionService.publish()</code>).
      </p>

      <h3>Direct publish — PATCH /admin/branches/:branchId/academic-years/:id/publish</h3>
      <p>File: <code>academic-year.service.ts</code> → <code>publish(id)</code></p>
      <DocTable
        headers={['Check', 'Behavior']}
        rows={[
          ['Year already ACTIVE', '409 Conflict'],
          ['Year ARCHIVED', '400 Cannot publish archived year'],
          ['Another ACTIVE year in branch', '409 — archive the current ACTIVE year first'],
          ['On success', 'Sets status ACTIVE, writes AcademicYearAuditLog action=PUBLISHED'],
        ]}
      />
      <p>
        Direct publish does <strong>not</strong> archive another year automatically. The admin must archive
        the current ACTIVE year first (or use batch promotion which handles the swap).
      </p>

      <h3>Batch promotion publish — POST …/promotion/runs/:runId/publish</h3>
      <p>File: <code>batch-promotion.service.ts</code> → <code>publish(runId, branchId)</code></p>
      <p>In a single transaction:</p>
      <ol>
        <li>Source year (was ACTIVE) → <code>ARCHIVED</code></li>
        <li>Target year (was BUILD_STAGE) → <code>ACTIVE</code></li>
        <li>Snapshot record → <code>COMPLETED</code> if present</li>
        <li>BatchPromotionRun → phase <code>PUBLISHED</code>, <code>publishedAt</code> set</li>
      </ol>

      <h3>Effects on running systems after activation</h3>
      <DocTable
        headers={['Domain', 'Effect']}
        rows={[
          ['Admin ERP scope', 'localStorage activeAYId switches to new ACTIVE; queries use new year ID'],
          ['Student login', 'auth.service checks enrollment in ACTIVE year; graduated students get 403'],
          ['Teacher portal', 'teacher-scope middleware resolves assignments in ACTIVE year'],
          ['Fees / attendance / exams', 'All scoped to academicYearId — old year data stays in ARCHIVED year'],
          ['Chat rooms', 'Rooms are per academicYearId; new year gets rooms on first bootstrap (lazy)'],
          ['Permissions', 'Staff module permissions unchanged; archived_ay_access gates historical year access'],
          ['Outstanding fees', 'Remain in source (now ARCHIVED) year — not auto-carried (see acknowledgements)'],
        ]}
      />
      <DocCallout variant="info" title="Chat rooms are lazy-created">
        Batch promotion does not pre-create chat communities. When a user opens chat in the new ACTIVE year,{' '}
        <code>chat-community.bootstrap.ts</code> ensures school/teacher announcement rooms and class rooms
        for that <code>academicYearId</code>. Archived year rooms remain readable if user has access.
      </DocCallout>

      <h2>Batch promotion wizard — overview</h2>
      <p>
        UI: <code>/admin/academic-years/[sourceAyId]/promote</code>. API mount:{' '}
        <code>/admin/branches/:branchId/academic-years/:sourceAcademicYearId/promotion/*</code>.
        Requires branch admin access (<code>staffService.resolveUserAccess</code> — non-restricted).
      </p>

      <pre className={pre}>
{`flowchart LR
  S1[Step 1 Confirm acks] --> S2[Step 2 Target + carry options]
  S2 --> START[POST start → phase DRAFT]
  START --> SNAP[POST snapshot → SNAPSHOT_DONE]
  SNAP --> APPLY[POST apply → APPLIED]
  APPLY --> PUB[POST publish → PUBLISHED]
  PUB --> LIVE[Target ACTIVE / Source ARCHIVED]`}
      </pre>

      <h3>Preconditions — GET …/promotion/preconditions</h3>
      <p>File: <code>batchPromotionService.getPreconditions()</code></p>
      <DocTable
        headers={['Check', 'Result']}
        rows={[
          ['Source year not found', '404'],
          ['Source year not ACTIVE', '400 — batch promotion only from ACTIVE year'],
          ['inProgressRun exists', 'Returned in response — UI can resume existing run'],
          ['buildYears', 'List of BUILD_STAGE years in branch for target selection'],
          ['defaultCarryOptions', 'From batch-promotion.constants.ts DEFAULT_CARRY_OPTIONS'],
        ]}
      />

      <h3>Phase: DRAFT — POST …/promotion/start</h3>
      <p>File: <code>batchPromotionService.startRun()</code></p>
      <DocTable
        headers={['Scenario', 'Behavior']}
        rows={[
          ['Another in-progress run for different source', '409 Another batch promotion is already in progress'],
          ['Same source in-progress run exists', 'Returns existing run (idempotent resume)'],
          ['No targetAcademicYearId', 'Creates BUILD_STAGE year from calendarId (or reuses existing BUILD_STAGE for same calendar)'],
          ['targetAcademicYearId provided', 'Must be BUILD_STAGE in same branch, ≠ source'],
          ['Duplicate source+target non-failed run', 'Returns existing run'],
          ['On create', 'BatchPromotionRun phase=DRAFT, carryOptions merged with defaults'],
        ]}
      />

      <h3>Phase: SNAPSHOT_DONE — POST …/runs/:runId/snapshot</h3>
      <p>File: <code>batchPromotionService.snapshotRun()</code></p>
      <p>Requires phase <code>DRAFT</code>. In one transaction:</p>
      <ul>
        <li>Creates <code>AcademicYearSnapshot</code> with student count, from/to labels</li>
        <li>For each source group: <code>GroupSnapshot</code> with studentsData + teachersData JSON</li>
        <li>Upserts <code>TeacherAySnapshot</code> per teacher with assignment history</li>
        <li>Updates run phase → <code>SNAPSHOT_DONE</code>, links snapshotId</li>
      </ul>
      <p>
        Snapshot is a <strong>point-in-time audit record</strong> — it does not modify live enrollments.
        Source ACTIVE year remains fully operational.
      </p>

      <h3>Phase: APPLIED — POST …/runs/:runId/apply</h3>
      <p>File: <code>batchPromotionService.applyCarry()</code></p>
      <p>Requires phase <code>SNAPSHOT_DONE</code>. Validates carry dependency chain:</p>
      <DocTable
        headers={['Rule', 'Error if violated']}
        rows={[
          ['students without classes', 'Cannot carry students without carrying classes'],
          ['teacherAssignments without classes+subjects', 'Teacher assignments require both…'],
          ['timetableGrid without classes+subjects', 'Timetable requires both…'],
        ]}
      />

      <p>At start of apply transaction — <strong>wipes target BUILD_STAGE year</strong>:</p>
      <DocCodeBlock>{`student.deleteMany({ academicYearId: targetId })
group.deleteMany({ academicYearId: targetId })
subject.deleteMany({ academicYearId: targetId })
feeStructure.deleteMany({ academicYearId: targetId })
teacherAssignment.deleteMany({ academicYearId: targetId })`}</DocCodeBlock>

      <h4>Carry options — what is actually implemented</h4>
      <DocTable
        headers={['Option', 'Default', 'Implemented in applyCarry?', 'Behavior']}
        rows={[
          [<code>classes</code>, 'true', 'Yes', 'Copy groups (name, section, displayOrder, capacity) to target'],
          [<code>subjects</code>, 'true', 'Yes', 'Copy subjects + group-subject links via ID maps'],
          [<code>students</code>, 'true', 'Yes', 'Promote ACTIVE students — see rules below'],
          [<code>teacherAssignments</code>, 'true', 'Yes', 'Copy active assignments (validTo=null) to mapped groups/subjects'],
          [<code>timetableGrid</code>, 'true', 'Yes', 'Copy timetable slots + entries with mapped IDs'],
          [<code>feeStructures</code>, 'true', 'Yes', 'Copy fee structure templates per group (not paid balances)'],
          [<code>datesheets</code>, 'false (forced)', 'No', 'Always disabled — mergeCarryOptions forces false'],
          [<code>attendance</code>, 'false', 'No', 'UI checkbox only — no code path in applyCarry'],
          [<code>examsResults</code>, 'false', 'No', 'UI checkbox only — no code path in applyCarry'],
          [<code>announcementsMessages</code>, 'false', 'No', 'UI checkbox only — no code path in applyCarry'],
        ]}
      />
      <DocCallout variant="warn" title="Unimplemented carry toggles">
        The promotion UI shows checkboxes for attendance, exams/results, and announcements/messages, but{' '}
        <code>applyCarry()</code> does not read those flags. Enabling them in the UI has no effect today.
      </DocCallout>

      <h4>Fixed student promotion rules (when students + classes carried)</h4>
      <p>From <code>FIXED_STUDENT_RULES</code> in batch-promotion.constants.ts:</p>
      <ul>
        <li>Only <code>ACTIVE</code> + <code>isActive: true</code> students are processed</li>
        <li>Lowest displayOrder class stays empty in the new year (no students placed there)</li>
        <li>Students in highest displayOrder class → source record set <code>GRADUATED</code>, <code>isActive: false</code>, <code>credentialTag: NO_LOGIN</code> — no new-year row created</li>
        <li>All other active students → new Student row in target year at <code>displayOrder + 1</code></li>
        <li>Withdrawn / deceased / graduated students are skipped (not in PROMOTABLE_STATUSES)</li>
      </ul>

      <h4>New-year student row details</h4>
      <DocTable
        headers={['Field', 'Behavior']}
        rows={[
          ['personId', 'Linked via StudentPerson; created if missing on source'],
          ['userId', 'Set null — login not auto-linked to new year row'],
          ['username', 'Copied from source'],
          ['admissionNumber / studentNumber', 'Set null on new row (identity uniques on StudentPerson)'],
          ['credentialTag', 'CRED_CARRIED if credentialSentAt set, else CRED_NEW'],
          ['credentialSentAt / status', 'Copied from source'],
          ['profilePhotoId', 'Set null'],
          ['familyId, fee overrides, contact fields', 'Copied'],
        ]}
      />
      <p>
        Graduated students lose login because <code>auth.service</code> rejects students with{' '}
        <code>NO_LOGIN</code> or <code>GRADUATED</code> status. Admin must generate fresh credentials for
        new-year rows if students need portal access.
      </p>

      <h3>Phase: PUBLISHED — POST …/runs/:runId/publish</h3>
      <p>Requires phase <code>APPLIED</code>. Atomic status swap described above. Run phase becomes{' '}
        <code>PUBLISHED</code> (terminal success state).
      </p>

      <h3>Run phases reference</h3>
      <DocTable
        headers={['Phase', 'Meaning', 'Next action']}
        rows={[
          [<code>DRAFT</code>, 'Run created, carry options saved', 'POST snapshot'],
          [<code>SNAPSHOT_DONE</code>, 'Audit snapshot captured', 'POST apply'],
          [<code>APPLIED</code>, 'Target BUILD_STAGE populated', 'POST publish'],
          [<code>PUBLISHED</code>, 'Year swap complete', 'None — terminal'],
          [<code>FAILED</code>, 'Reserved in schema', 'Not set by current service code'],
        ]}
      />

      <h2>API endpoints summary</h2>
      <DocTable
        headers={['Method', 'Path', 'Function']}
        rows={[
          ['GET', '/admin/branches/:branchId/academic-years/:sourceAyId/promotion/preconditions', 'getPreconditions'],
          ['GET', '/admin/branches/:branchId/academic-years/:sourceAyId/promotion/runs', 'listRuns'],
          ['POST', '/admin/branches/:branchId/academic-years/:sourceAyId/promotion/start', 'startRun'],
          ['GET', '/admin/branches/:branchId/academic-years/:sourceAyId/promotion/runs/:runId', 'getRun'],
          ['POST', '…/runs/:runId/snapshot', 'snapshotRun'],
          ['POST', '…/runs/:runId/apply', 'applyCarry'],
          ['POST', '…/runs/:runId/publish', 'publish'],
          ['PATCH', '/admin/branches/:branchId/academic-years/:id/publish', 'academicYearService.publish (direct)'],
          ['PATCH', '…/pause | …/resume | …/archive | …/unarchive', 'Lifecycle without promotion'],
        ]}
      />

      <h2>Archived year protections</h2>
      <p>
        <code>requireNotArchived</code> middleware on academic-year routes blocks mutations on ARCHIVED years.
        Admin staff need <code>archived_ay_access</code> module permission (via{' '}
        <code>resolveScopeContext</code>) to query historical data.
      </p>

      <h2>Operational acknowledgements (UI Step 1)</h2>
      <p>Hard-coded in <code>getPreconditions()</code>:</p>
      <ol>
        <li>The current ACTIVE year stays live until you publish the new year.</li>
        <li>Graduated students will lose login after publish.</li>
        <li>Outstanding fees remain in the old year unless manually carried forward.</li>
        <li>Class promotion rules are automatic (+1 / empty lowest / graduate highest).</li>
      </ol>

      <h2>Benchmark script</h2>
      <p>
        <code>backend/scripts/benchmark-year-end.ts</code> exercises snapshot on large datasets (2000+ students)
        for performance testing.
      </p>

      <p>
        See also: <Link href="/docs/api/architecture">Architecture</Link> ·{' '}
        <Link href="/docs/api/endpoints">REST Endpoints</Link> ·{' '}
        <Link href="/docs/api/authentication">Authentication</Link> (student login eligibility)
      </p>
    </DocsShell>
  );
}
