import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSection, DocTable } from '@/components/docs/doc-blocks';
import { apiNav } from '@/lib/docs/navigation';

export default function MobilePromotionEffectsPage() {
  return (
    <DocsShell
      title="Mobile App — Batch Promotion Effects"
      subtitle="Code-accurate map of how the Flutter app behaves during each promotion phase and after publish — student, teacher, and staff surfaces."
      nav={apiNav}
      variant="api"
    >
      <p>
        The mobile app (<code>mobile/lib/</code>) does not implement promotion logic. It reads the branch&apos;s{' '}
        <strong>ACTIVE</strong> academic year (or a cached ID) and scopes every API call and chat socket join to that
        year. Batch promotion phases run entirely on the backend and admin web UI; mobile impact appears only when
        data or year status changes — especially at <strong>PUBLISHED</strong>.
      </p>

      <DocCallout variant="info" title="Related backend doc">
        Promotion wizard phases and carry rules:{' '}
        <Link href="/docs/api/academic-year">Academic Year &amp; Batch Promotion</Link>.
      </DocCallout>

      <h2>How mobile resolves the active academic year</h2>
      <DocTable
        headers={['Role', 'Resolution path', 'Source files']}
        rows={[
          [
            'Student',
            <>
              <code>GET /student/bootstrap</code> with no <code>academicYearId</code> query — backend{' '}
              <code>studentScopeMiddleware</code> picks the student&apos;s ACTIVE-year enrollment.
              Mobile stores <code>academicYearId</code> in secure storage after bootstrap.
            </>,
            <>
              <code>mobile/lib/features/student/data/student_api.dart</code>
              <br />
              <code>mobile/lib/features/chat/presentation/student_chat_shell.dart</code>
              <br />
              <code>backend/src/modules/student/middleware/student-scope.middleware.ts</code>
            </>,
          ],
          [
            'Teacher',
            <>
              <code>PortalApi.resolveAcademicYearId()</code> returns stored{' '}
              <code>mcs_academic_year_id</code> if present, else <code>GET /me/academic-year</code>{' '}
              (branch ACTIVE year). Passed to <code>GET /teacher/bootstrap</code>.
            </>,
            <>
              <code>mobile/lib/core/api/portal_api.dart</code>
              <br />
              <code>mobile/lib/features/teacher/data/teacher_api.dart</code>
              <br />
              <code>backend/src/modules/admin/routes/me.routes.ts</code>
            </>,
          ],
          [
            'Staff (management)',
            <>
              Same as teacher: <code>PortalApi</code> → <code>/me/academic-year</code>, then staff
              campus/chat APIs use <code>branchId</code> + <code>academicYearId</code>.
            </>,
            <>
              <code>mobile/lib/features/staff/data/staff_api.dart</code>
              <br />
              <code>mobile/lib/features/chat/presentation/admin_staff_shell.dart</code>
            </>,
          ],
        ]}
      />

      <p>On-device caches (TTL from <code>mobile/lib/core/storage/cache_constants.dart</code>):</p>
      <DocTable
        headers={['Cache', 'TTL', 'Risk after year swap']}
        rows={[
          ['Student bootstrap', '24 hours', 'May show old year label/group until network refresh succeeds'],
          ['Teacher bootstrap', '24 hours', 'May scope timetable/assignments to previous ACTIVE year ID'],
          ['Staff bootstrap', '24 hours', 'Same — campus dashboards use cached academicYearId'],
          ['Chat landing', '30 minutes', 'Room list may reference previous year until refetch'],
          ['Stored academicYearId', 'Until logout', 'Stale ID sent on teacher/staff API queries until bootstrap refresh'],
        ]}
      />
      <p>
        Logout clears all caches (<code>SessionStorage.clear()</code> in{' '}
        <code>mobile/lib/core/storage/session_storage.dart</code>). JWT sessions are <strong>not</strong>{' '}
        invalidated by promotion publish — only eligibility and scoped data change.
      </p>

      <h2>Credential tags and login (students)</h2>
      <p>
        Mobile does not read <code>credentialTag</code> directly. Login eligibility is enforced server-side in{' '}
        <code>backend/src/modules/auth/auth.service.ts</code> → <code>assertStudentLoginEligible()</code>.
        Mobile maps errors in <code>mobile/lib/core/validation/login_validator.dart</code>.
      </p>
      <DocTable
        headers={['Tag / status (after apply/publish)', 'Mobile login', 'User-facing error']}
        rows={[
          [
            <>
              <code>ACTIVE</code> + enrollment in ACTIVE year + <code>userId</code> linked
            </>,
            'Allowed',
            '—',
          ],
          [
            <>
              <code>CRED_NEW</code> / <code>CRED_CARRIED</code> on new-year row with <code>userId: null</code>
            </>,
            'Blocked until admin links user + sends credentials',
            '"No active enrollment. Contact school admin."',
          ],
          [
            <>
              <code>NO_LOGIN</code> or <code>GRADUATED</code> (highest class)
            </>,
            'Blocked',
            '"Account closed after graduation. Contact school admin."',
          ],
          [
            <>Promoted student — old ARCHIVED row still has <code>userId</code></>,
            <>Blocked — auth requires <code>academicYear.status = ACTIVE</code></>,
            '"No active enrollment. Contact school admin."',
          ],
        ]}
      />
      <DocCallout variant="warn" title="Promoted students need re-credentialing">
        <code>batch-promotion.service.ts</code> creates new-year student rows with <code>userId: null</code>.
        Until admin generates credentials and links the user on the new row, promoted students cannot log in on
        mobile even though their password may still be known.
      </DocCallout>

      <h2>Phase-by-phase — Student app</h2>

      <DocSection title="DRAFT">
        <DocTable
          headers={['Area', 'Behavior']}
          rows={[
            ['Login', 'Unchanged — still scoped to current ACTIVE source year'],
            ['Bootstrap', 'Returns current ACTIVE enrollment via student-scope middleware'],
            ['Academics (fees, attendance, results, timetable, datesheets, canteen)', 'All panels pass bootstrap.academicYearId — source year data'],
            ['Chat', 'Socket joins source ACTIVE year; class communities from source enrollments'],
            ['Errors / UI', 'No promotion-specific UI or messages in mobile'],
          ]}
        />
      </DocSection>

      <DocSection title="SNAPSHOT_DONE">
        <DocTable
          headers={['Area', 'Behavior']}
          rows={[
            ['All surfaces', 'Identical to DRAFT — snapshot is audit-only; source year remains ACTIVE'],
            ['Mobile awareness', 'None — no API exposes promotion run phase to student app'],
          ]}
        />
      </DocSection>

      <DocSection title="APPLIED">
        <DocTable
          headers={['Area', 'Behavior']}
          rows={[
            ['Login', 'Still uses source ACTIVE year enrollment'],
            ['Bootstrap / academics / chat', 'Still source ACTIVE year — target BUILD_STAGE is invisible to mobile'],
            ['Backend data change', 'Target year populated; graduated students tagged NO_LOGIN on source; promoted students have new rows with userId null (not yet ACTIVE year)'],
            ['Mobile impact', 'None until publish — students already logged in unaffected'],
          ]}
        />
      </DocSection>

      <DocSection title="PUBLISHED">
        <DocTable
          headers={['Area', 'Behavior']}
          rows={[
            ['Existing session (JWT valid)', 'App may keep running with cached bootstrap showing old year label'],
            ['Bootstrap refresh', 'Resolves new ACTIVE year if student has linked enrollment; else 403 / empty academicYearId'],
            ['Graduated students', 'Login rejected — LoginValidator shows graduation message'],
            ['Promoted students (not re-credentialed)', 'Login rejected — no ACTIVE enrollment with userId'],
            ['Fees / attendance / results', 'New year = empty history until recorded; old year data stays in ARCHIVED (not shown without archived access)'],
            ['Timetable / datesheets', 'New carried timetable appears after bootstrap picks new ACTIVE year'],
            ['Chat', 'New academicYearId → new room set (lazy-created on backend); old year rooms not in landing'],
            ['Attachments in chat', 'Require academicYearId — chat_room_screen.dart errors if missing'],
            ['Recovery', 'Logout + login after admin re-credentials; or pull-to-refresh / retry bootstrap'],
          ]}
        />
      </DocSection>

      <h2>Phase-by-phase — Teacher app</h2>

      <DocSection title="DRAFT / SNAPSHOT_DONE">
        <DocTable
          headers={['Area', 'Behavior']}
          rows={[
            ['Login', 'Unaffected — teacher eligibility is profile + branch membership, not year enrollment'],
            ['Bootstrap', 'teacher_api.dart → portal resolve → /teacher/bootstrap with source ACTIVE year'],
            ['Assignments / timetable', 'Source year assignments from bootstrap'],
            ['Attendance / marks entry', 'Scoped via TeacherBootstrap academicYearId + branchId'],
            ['Chat', 'Class communities and DMs for source year; socket chat:join uses bootstrap academicYearId'],
          ]}
        />
      </DocSection>

      <DocSection title="APPLIED">
        <DocTable
          headers={['Area', 'Behavior']}
          rows={[
            ['Live app', 'Still source ACTIVE year until publish'],
            ['Carried assignments', 'Copied to target BUILD_STAGE on backend — not visible until target is ACTIVE'],
          ]}
        />
      </DocSection>

      <DocSection title="PUBLISHED">
        <DocTable
          headers={['Area', 'Behavior']}
          rows={[
            ['Login', 'No re-login required — JWT remains valid'],
            ['Bootstrap refresh', '/me/academic-year returns new ACTIVE; teacher bootstrap loads new assignments if teacherAssignments carried'],
            ['Stale cache', 'Up to 24h old assignment list / year label if offline-first cache used before refresh'],
            ['Timetable panel', 'teacher_api.fetchTimetable uses bootstrap scope — updates after fresh bootstrap'],
            ['Results / attendance panels', 'New year scopes; historical marks remain in ARCHIVED year on server'],
            ['Chat class communities', 'New year rooms — class_community_screen.dart and portal_chat_landing_screen.dart pass new academicYearId'],
            ['Socket', 'teacher_chat_shell.dart reconnects socket with new academicYearId on _applyBootstrap'],
            ['HOD department view', 'Scoped to new year after bootstrap refresh'],
          ]}
        />
      </DocSection>

      <h2>Phase-by-phase — Staff app (management mobile)</h2>
      <DocTable
        headers={['Phase', 'Behavior']}
        rows={[
          [
            'DRAFT / SNAPSHOT / APPLIED',
            'Staff shell (admin_staff_shell.dart) uses source ACTIVE year from PortalApi. Campus overview, fees, attendance, results queries include academicYearId from bootstrap.',
          ],
          [
            'PUBLISHED',
            <>
              Bootstrap refresh picks new ACTIVE year. Chat landing and campus dashboards scope to new year.
              Staff login unchanged. Cached bootstrap may lag up to 24h. Logout clears stale academicYearId.
            </>,
          ],
        ]}
      />
      <p>
        Staff mobile is chat + read-only campus dashboards — it does not run promotion. Management users
        with web-only roles are blocked at login (<code>LoginValidator</code> → &quot;web portal only&quot;).
      </p>

      <h2>Chat rooms — cross-cutting</h2>
      <DocTable
        headers={['Topic', 'Detail']}
        rows={[
          ['Room scope', 'Every chat API call includes academicYearId (chat_api.dart)'],
          ['Socket join', 'chat_socket_service.dart emits chat:join with academicYearId on connect'],
          ['New year rooms', 'Not pre-created by promotion — backend chat-community.bootstrap.ts creates on first landing fetch'],
          ['After publish', 'Students/teachers see empty or freshly bootstrapped rooms for new year; archived year history not in default mobile landing'],
          ['Push notifications', 'chat_push_nav.dart opens rooms using bootstrap academicYearId — stale cache can open wrong year until refresh'],
          ['Class communities', 'Grouped by enrollment assignments in current bootstrap year (class_community_screen.dart)'],
        ]}
      />

      <h2>Fees, attendance, results visibility</h2>
      <DocTable
        headers={['Surface', 'API', 'After publish']}
        rows={[
          ['Student fees', 'GET /student/fees?academicYearId=', 'New year fee structures if carried; paid balances stay in ARCHIVED year'],
          ['Student attendance', 'GET /student/attendance?academicYearId=', 'Empty in new year until attendance recorded'],
          ['Student results', 'GET /student/results/table?academicYearId=', 'Empty in new year; prior results in ARCHIVED year'],
          ['Teacher marks', 'GET /teacher/marks/table', 'Scoped to bootstrap year — new year after refresh'],
          ['Teacher attendance', 'GET /teacher/attendance', 'New groups from carried assignments'],
          ['Staff campus fees/attendance/results', 'GET /staff/campus/*', 'Switch to new ACTIVE year ID on bootstrap refresh'],
        ]}
      />
      <p>Source files: student panels under <code>mobile/lib/features/student/presentation/</code>, teacher panels under <code>mobile/lib/features/teacher/presentation/</code>.</p>

      <h2>What breaks vs what refreshes vs re-login</h2>
      <DocTable
        headers={['Scenario', 'Student', 'Teacher', 'Staff']}
        rows={[
          ['During DRAFT–APPLIED', 'No change', 'No change', 'No change'],
          ['Immediately after PUBLISHED (cached app)', 'May show old year label; academics may 403 if enrollment not linked', 'May show old assignments until bootstrap refetch', 'Campus stats may target old year ID from cache'],
          ['After bootstrap refetch', 'Works if re-credentialed + linked in new year', 'New assignments/timetable/chat rooms', 'New year campus data'],
          ['Graduated student', 'Login blocked — re-login does not help', 'N/A', 'N/A'],
          ['Promoted student before admin credentials', 'Login blocked', 'N/A', 'N/A'],
          ['Logout + login', 'Required for students after credential re-issue', 'Usually not required', 'Usually not required'],
          ['Force refresh without logout', 'Retry button on student_chat_shell error state; killing app clears bootstrap cache after TTL', 'teacher_chat_shell _loadBootstrap on restart', 'admin_staff_shell same pattern'],
        ]}
      />

      <h2>Mobile source file index</h2>
      <DocTable
        headers={['File', 'Relevance']}
        rows={[
          [<code>mobile/lib/core/api/portal_api.dart</code>, 'ACTIVE year resolution for teacher/staff'],
          [<code>mobile/lib/core/storage/session_storage.dart</code>, 'academicYearId + bootstrap caches; cleared on logout'],
          [<code>mobile/lib/core/validation/login_validator.dart</code>, 'Student graduation / enrollment error copy'],
          [<code>mobile/lib/features/student/data/student_api.dart</code>, 'Bootstrap + academics API scope'],
          [<code>mobile/lib/features/teacher/data/teacher_api.dart</code>, 'Teacher bootstrap + scoped panels'],
          [<code>mobile/lib/features/staff/data/staff_api.dart</code>, 'Staff bootstrap + campus APIs'],
          [<code>mobile/lib/features/chat/data/chat_api.dart</code>, 'All chat endpoints require academicYearId'],
          [<code>mobile/lib/features/chat/data/chat_socket_service.dart</code>, 'Socket scoped to academic year'],
          [<code>mobile/lib/features/chat/presentation/student_chat_shell.dart</code>, 'Student bootstrap + socket lifecycle'],
          [<code>mobile/lib/features/chat/presentation/teacher_chat_shell.dart</code>, 'Teacher bootstrap + socket lifecycle'],
          [<code>mobile/lib/features/chat/presentation/admin_staff_shell.dart</code>, 'Staff bootstrap + socket lifecycle'],
          [<code>mobile/lib/features/student/presentation/student_academics_tab.dart</code>, 'Fees, attendance, results, timetable tabs'],
        ]}
      />

      <p>
        See also: <Link href="/docs/api/academic-year">Academic Year &amp; Batch Promotion</Link> ·{' '}
        <Link href="/docs/api/authentication">Authentication</Link> ·{' '}
        <Link href="/docs/intro/student/mobile-app">Student Mobile App (intro)</Link> ·{' '}
        <Link href="/docs/intro/teacher/mobile-app">Teacher Mobile App (intro)</Link>
      </p>
    </DocsShell>
  );
}
