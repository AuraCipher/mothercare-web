import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep, DocFaq, DocSection, DocTable } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function AdminAcademicYearsPage() {
  return (
    <DocsShell
      title="Academic Years & Batch Promotion"
      subtitle="Create years, run the four-step promotion wizard, and understand what changes in every portal at each stage."
      nav={introNav}
      variant="intro"
    >
      <h2>Overview</h2>
      <p>
        Almost every module in MCS — students, fees, attendance, results, timetable, chat — is scoped to
        a <strong>branch</strong> and an <strong>academic year</strong>. When you move from one school
        year to the next, you use <strong>Batch Promotion</strong> to copy structure from the current{' '}
        <strong>ACTIVE</strong> year into a <strong>BUILD_STAGE</strong> year, then publish the swap.
      </p>
      <p>
        <strong>Where to open it:</strong> <code>/admin/settings/academic-years</code> → open the current
        ACTIVE year → <strong>Batch Promote</strong>, or go directly to{' '}
        <code>/admin/academic-years/[id]/promote</code>.
      </p>
      <p>
        <strong>Critical rule:</strong> the current ACTIVE year stays fully live for students, teachers,
        and staff until you click <strong>Publish</strong> on step 4. DRAFT, snapshot, and apply phases
        prepare the next year in the background — they do not interrupt day-to-day operations.
      </p>

      <DocCallout variant="info" title="Technical reference">
        Backend phases, carry flags, and API routes:{' '}
        <Link href="/docs/api/academic-year">Academic Year &amp; Promotion (API)</Link>. Mobile-specific
        effects: <Link href="/docs/api/academic-year/mobile-effects">Mobile Promotion Effects</Link>.
      </DocCallout>

      <h2>Academic year statuses</h2>
      <DocTable
        headers={['Status', 'Meaning', 'Who sees it']}
        rows={[
          [<code>BUILD_STAGE</code>, 'Next year being prepared', 'Admins only — not used by student/teacher apps'],
          [<code>ACTIVE</code>, 'Current operational year', 'All portals and mobile apps'],
          [<code>ON_HOLD</code>, 'Paused year', 'Resume returns to ACTIVE'],
          [<code>ARCHIVED</code>, 'Historical read-only year', 'Admins with archived-year access; not default in mobile'],
        ]}
      />

      <h2>Before you start</h2>
      <ul>
        <li>Confirm the <strong>source year is ACTIVE</strong> — promotion cannot start from BUILD_STAGE or ARCHIVED.</li>
        <li>Create or pick a <strong>target BUILD_STAGE</strong> year (new calendar label, e.g. 2026–27).</li>
        <li>Read the four acknowledgements on wizard step 1 — especially graduated students losing login and fees staying in the old year.</li>
        <li>Plan credential re-delivery for promoted students after publish (see below).</li>
        <li>Only one in-progress promotion run per branch at a time.</li>
      </ul>

      <h2>Wizard steps (admin UI)</h2>
      <DocSteps>
        <DocStep title="Step 1 — Acknowledgements">
          Check all four boxes confirming you understand: (1) current year stays live until publish,
          (2) graduates lose login, (3) outstanding fees remain in the old year, (4) class promotion is
          automatic (+1 class / empty lowest / graduate highest).
        </DocStep>
        <DocStep title="Step 2 — Target year &amp; carry options">
          Pick an existing BUILD_STAGE year or create one from a calendar. Select what to copy: classes,
          subjects, students, teacher assignments, timetable, fee structures. Dependencies are enforced
          (e.g. students require classes). Click <strong>Start promotion</strong> → backend phase{' '}
          <code>DRAFT</code>.
        </DocStep>
        <DocStep title="Step 3 — Snapshot &amp; apply">
          <strong>Create snapshot</strong> captures an audit record of the source year (groups, student
          counts, teacher assignments) → phase <code>SNAPSHOT_DONE</code>. Then <strong>Apply carry</strong>{' '}
          copies selected data into the target BUILD_STAGE year → phase <code>APPLIED</code>. Source year
          is still ACTIVE throughout.
        </DocStep>
        <DocStep title="Step 4 — Publish">
          Confirm and <strong>Publish</strong> → source becomes <code>ARCHIVED</code>, target becomes{' '}
          <code>ACTIVE</code> → phase <code>PUBLISHED</code>. This is the only step that changes what
          students, teachers, and mobile apps see as the live year.
        </DocStep>
      </DocSteps>

      <h2>What each backend phase does</h2>
      <DocTable
        headers={['Phase', 'Backend action', 'Live year for everyone']}
        rows={[
          [<code>DRAFT</code>, 'Promotion run created; carry options saved; target year may be created', 'Source ACTIVE — unchanged'],
          [<code>SNAPSHOT_DONE</code>, 'Audit snapshot of source groups/students/teachers stored', 'Source ACTIVE — unchanged'],
          [<code>APPLIED</code>, 'Target BUILD_STAGE populated; graduates tagged on source; new student rows created with userId null', 'Source ACTIVE — unchanged'],
          [<code>PUBLISHED</code>, 'Source → ARCHIVED; target → ACTIVE; snapshot marked complete', 'Target ACTIVE — year swap'],
        ]}
      />

      <h2>What gets copied (carry options)</h2>
      <DocTable
        headers={['Option', 'Default', 'What happens on apply']}
        rows={[
          ['Classes', 'On', 'All class groups copied to target year'],
          ['Subjects', 'On', 'Subjects + class–subject links copied'],
          ['Students', 'On', 'ACTIVE students promoted +1 class; highest class graduates; lowest class stays empty'],
          ['Teacher assignments', 'On', 'Active assignments copied to mapped classes/subjects'],
          ['Timetable', 'On', 'Grid copied with mapped class/subject IDs'],
          ['Fee structures', 'On', 'Template amounts per class — not paid balances'],
          ['Datesheets', 'Off', 'Not carried (forced off)'],
          ['Attendance', 'Removed from wizard — never carried'],
          ['Exams / results', 'Removed from wizard — never carried'],
          ['Announcements / chat', 'Removed from wizard — never carried'],
        ]}
      />

      <DocCallout variant="warn" title="UI checkboxes without backend support">
        Attendance, exams/results, and announcements/messages appear in the wizard but are not read by
        the apply step today. Do not assume historical attendance or marks move to the new year.
      </DocCallout>

      <h2>Student promotion rules (when students + classes carried)</h2>
      <ul>
        <li>Only <strong>ACTIVE</strong> students are promoted.</li>
        <li><strong>Lowest class</strong> (smallest display order) receives no students in the new year — intake class stays empty for new admissions.</li>
        <li><strong>Highest class</strong> students are marked <code>GRADUATED</code> with <code>NO_LOGIN</code> — no row in the new year.</li>
        <li>Everyone else moves up one class (+1 display order).</li>
        <li>
          <strong>Promoted students keep their login</strong> — the user account link moves from the archived
          source row to the new ACTIVE year row (same username/password).
        </li>
        <li>
          Credential tag: <code>CRED_CARRIED</code> if credentials were sent before; <code>CRED_NEW</code>{' '}
          if never credentialed — those students still need Generate + Send on{' '}
          <Link href="/docs/intro/admin/students">Students</Link> Operations.
        </li>
        <li>Outstanding fee balances stay in the <strong>archived</strong> source year unless you manually carry forward on student fee detail.</li>
      </ul>

      <h2>Effects by portal — every stage</h2>
      <p>
        The table below answers: <em>while promotion is running, and after publish, what does each app
        see?</em> Until <strong>PUBLISHED</strong>, all users continue on the source ACTIVE year.
      </p>

      <DocSection title="Admin web ERP">
        <DocTable
          headers={['Phase', 'What you see']}
          rows={[
            ['Before promotion', 'Sidebar year selector shows source ACTIVE. All modules scope to it.'],
            ['DRAFT / SNAPSHOT', 'Promotion wizard shows progress. ERP still uses source ACTIVE if that is selected in sidebar.'],
            ['APPLIED', 'Target BUILD_STAGE has data if you switch sidebar to it — for review only. Source still ACTIVE for daily ops until publish.'],
            [
              'PUBLISHED',
              <>
                Switch sidebar to new ACTIVE year and press <strong>Go</strong>. Dashboard counts, students,
                fees, attendance, results, timetable all scope to new year (mostly empty history). Old year
                available as ARCHIVED if you have <code>archived_ay_access</code>.
              </>,
            ],
          ]}
        />
      </DocSection>

      <DocSection title="Student web &amp; mobile">
        <DocTable
          headers={['Phase', 'Behavior']}
          rows={[
            ['DRAFT / SNAPSHOT / APPLIED', 'No change — login and all panels use source ACTIVE enrollment.'],
            [
              'PUBLISHED — graduated',
              'Login blocked: &quot;Account closed after graduation.&quot; Re-login does not help.',
            ],
            [
              'PUBLISHED — promoted (had credentials)',
              'Same username/password works in new ACTIVE year after bootstrap refresh',
            ],
            [
              'PUBLISHED — promoted (never credentialed)',
              'Login blocked until admin generates credentials on Operations page',
            ],
            [
              'PUBLISHED — session already open',
              'App may show stale year label until bootstrap refresh or logout/login.',
            ],
          ]}
        />
      </DocSection>

      <DocSection title="Teacher web &amp; mobile">
        <DocTable
          headers={['Phase', 'Behavior']}
          rows={[
            ['DRAFT / SNAPSHOT / APPLIED', 'Assignments, timetable, marks, attendance, chat — all source ACTIVE year.'],
            [
              'PUBLISHED',
              'No re-login required. Bootstrap refresh loads new ACTIVE year. Carried assignments and timetable appear. Marks/attendance history for old year stays in ARCHIVED. Chat rooms are per year — new class communities created lazily on first chat open.',
            ],
            ['PUBLISHED — stale cache (mobile)', 'Up to 24h cached bootstrap may show old assignments until refresh or app restart.'],
          ]}
        />
      </DocSection>

      <DocSection title="Staff mobile (management)">
        <DocTable
          headers={['Phase', 'Behavior']}
          rows={[
            ['DRAFT / SNAPSHOT / APPLIED', 'Campus dashboards and chat use source ACTIVE year.'],
            ['PUBLISHED', 'Bootstrap picks new ACTIVE year. Campus stats/fees/attendance scope updates after refresh. Logout clears stale cache.'],
          ]}
        />
      </DocSection>

      <DocSection title="CEO portal">
        <DocTable
          headers={['Phase', 'Behavior']}
          rows={[
            ['All phases', 'CEO does not run promotion. Branch-level year status visible via branch admin activity. No direct student/teacher impact.'],
          ]}
        />
      </DocSection>

      <h2>After publish — admin checklist</h2>
      <DocSteps>
        <DocStep title="Switch active year in sidebar">
          Select the new ACTIVE year → <strong>Go</strong>. Verify dashboard student/class counts.
        </DocStep>
        <DocStep title="Review promoted roster">
          Open <Link href="/docs/intro/admin/students">Students</Link> — confirm class placements. Lowest class should be empty; graduates absent from new year.
        </DocStep>
        <DocStep title="Re-credential students who never had login">
          Operations page → filter <code>CRED_NEW</code> students who were never sent credentials → Generate + Send via WhatsApp.
          Students who already had credentials keep the same login after promotion.
        </DocStep>
        <DocStep title="Carry fee dues if needed">
          For students with balances in the archived year, use <strong>Carry Old Dues</strong> on student fee detail — not automatic during promotion.
        </DocStep>
        <DocStep title="Set up new admissions">
          Enroll new students in the empty lowest class. Create fee structures if not carried.
        </DocStep>
        <DocStep title="Verify teacher assignments &amp; timetable">
          Open <Link href="/docs/intro/admin/timetable">Timetable</Link> and teacher profiles if assignments were carried.
        </DocStep>
        <DocStep title="Open chat in new year">
          Class communities and announcement rooms are created on first access — teachers/students may see empty chat until someone opens the Chats tab.
        </DocStep>
      </DocSteps>

      <h2>Scenarios &amp; troubleshooting</h2>
      <DocTable
        headers={['Scenario', 'What happens', 'What to do']}
        rows={[
          ['Promotion stuck — another run in progress', '409 error on start', 'Resume existing run from preconditions or wait for completion'],
          ['Student cannot log in after publish', 'New-year row has userId null or graduate tag', 'Re-credential via Operations; graduates need no action'],
          ['Teacher sees wrong class on mobile', 'Cached bootstrap (24h TTL)', 'Pull to refresh, restart app, or logout/login'],
          ['Fees missing in new year', 'Only structures carried — balances stay in ARCHIVED year', 'Use Carry Old Dues or record new payments'],
          ['Attendance / results empty in new year', 'Not carried by promotion', 'Expected — start fresh marking in new ACTIVE year'],
          ['Need old year data', 'Year is ARCHIVED', 'Switch sidebar to ARCHIVED year if you have archived_ay_access permission'],
          ['Checked attendance carry in wizard', 'Option removed from wizard — attendance is never carried'],
        ]}
      />

      <DocFaq
        items={[
          {
            q: 'Can I undo publish?',
            a: 'No automatic rollback. You would need to archive the new year and unarchive the old one — contact your technical team. Plan carefully before step 4.',
          },
          {
            q: 'Does publish log everyone out?',
            a: 'JWT sessions stay valid. Student login eligibility changes based on enrollment in the new ACTIVE year. Teachers usually keep working after bootstrap refresh.',
          },
          {
            q: 'When does the mobile app switch years?',
            a: 'Only after publish, when bootstrap resolves the new ACTIVE year. Cached data may lag up to 24 hours on mobile.',
          },
          {
            q: 'What about direct publish without batch promotion?',
            a: 'You can PATCH publish a BUILD_STAGE year, but you must archive the current ACTIVE year first manually. Batch promotion handles the swap atomically and copies data.',
          },
          {
            q: 'Where is chat history?',
            a: 'Chat rooms are per academicYearId. Old year rooms remain on the server but are not shown in default mobile landing after publish. New year rooms appear when chat is first opened.',
          },
        ]}
      />

      <h2>Related links</h2>
      <ul>
        <li><Link href="/docs/intro/admin/settings">Settings</Link> — academic year list entry point</li>
        <li><Link href="/docs/intro/admin/students">Students</Link> — credential tags and Operations bulk send</li>
        <li><Link href="/docs/intro/admin/fees">Fees</Link> — carry forward dues from archived year</li>
        <li><Link href="/docs/api/academic-year">Technical: Academic Year &amp; Promotion</Link></li>
        <li><Link href="/docs/api/academic-year/mobile-effects">Technical: Mobile effects by phase</Link></li>
      </ul>
    </DocsShell>
  );
}
