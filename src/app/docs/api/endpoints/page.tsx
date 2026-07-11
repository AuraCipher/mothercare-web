import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocCodeBlock, DocSection, DocTable } from '@/components/docs/doc-blocks';
import { apiNav } from '@/lib/docs/navigation';

export default function ApiEndpointsPage() {
  return (
    <DocsShell
      title="REST Endpoints"
      subtitle="Complete route reference grouped by mount point from backend/src/app.ts. Paths are relative to the API base URL (default http://localhost:5000)."
      nav={apiNav}
      variant="api"
    >
      <p>
        Mother Care School exposes 250+ HTTP routes across public setup, authentication, CEO tooling,
        the admin ERP, branch administration, teacher/student/staff portals, chat REST companions, and
        file upload. Every mount point below maps directly to a router in{' '}
        <code>backend/src/modules/**/routes/*.ts</code>.
      </p>
      <DocCallout variant="info" title="Machine-readable spec">
        For OpenAPI 3.1 (296 paths, 384 operations), import <code>backend/openapi.yaml</code> or see{' '}
        <Link href="/docs/api/openapi">OpenAPI Specification</Link>. Regenerate with{' '}
        <code>cd backend && npm run openapi:generate</code>.
      </DocCallout>

      <h2>Mount points (app.ts)</h2>
      <DocTable
        headers={['Mount', 'Router module', 'Auth']}
        rows={[
          ['GET /', 'inline', 'Public — API index JSON'],
          ['GET /health', 'inline', 'Public'],
          ['GET /key-manager', 'inline HTML', 'Public — API key manager page'],
          ['/auth', 'auth.routes', 'Mixed — login public; rest JWT'],
          ['/api-keys', 'api-key.routes', 'super_admin'],
          ['/setup', 'setup.routes', 'Public (first-run only)'],
          ['/admin/canteen', 'canteen.routes', 'super_admin | management + branch scope'],
          ['/admin/invitations', 'invitation.routes', 'CEO routes JWT; token routes public'],
          ['/admin', 'admin.routes (+ sub-routers)', 'super_admin | management + RBAC'],
          ['/teacher', 'teacher.routes', 'teacher role + scope'],
          ['/student', 'student.routes', 'student role + scope'],
          ['/staff', 'staff.routes', 'branch_admin | sub_admin | management'],
          ['/chat', 'chat.routes', 'JWT'],
          ['/me', 'me.routes', 'JWT (any role)'],
          ['/branches', 'branch-admin.routes', 'Branch role guards'],
          ['/api', 'upload.routes', 'POST auth; GET public serving'],
          ['GET /uploads/*', 'express.static', 'Public — dev fallback when R2 unset'],
        ]}
      />

      <DocCallout variant="info" title="Response envelope">
        Successful responses use <code>{`{ success: true, data: … }`}</code>. Errors return{' '}
        <code>{`{ success: false, message: "…" }`}</code> with an appropriate HTTP status. Admin ERP
        routes additionally require <code>?branchId=</code> and <code>?academicYearId=</code> query
        params unless the route embeds branch context in the path.
      </DocCallout>

      <DocSection title="Health & setup">
        <DocTable
          headers={['Method', 'Path', 'Auth', 'Description']}
          rows={[
            ['GET', '/', 'Public', 'API name, version, and mount-point index'],
            ['GET', '/health', 'Public', 'Liveness probe — status OK + ISO timestamp'],
            ['GET', '/setup/status', 'Public', 'Whether first-run bootstrap is complete'],
            ['POST', '/setup/init', 'Public', 'Create super_admin + school (one-time)'],
          ]}
        />
        <p>Setup init request (only when status is incomplete):</p>
        <DocCodeBlock>{`POST /setup/init
Content-Type: application/json

{
  "schoolName": "Mother Care School",
  "adminName": "CEO Name",
  "adminUsername": "ceo",
  "adminPassword": "secure-password-min-8",
  "adminEmail": "ceo@school.pk"
}`}</DocCodeBlock>
        <DocCodeBlock>{`// 201 Created
{
  "success": true,
  "data": {
    "schoolId": "clx…",
    "userId": "clx…",
    "message": "Setup complete"
  }
}`}</DocCodeBlock>
      </DocSection>

      <DocSection title="Authentication (/auth)">
        <DocTable
          headers={['Method', 'Path', 'Auth', 'Description']}
          rows={[
            ['POST', '/auth/login', 'Public', 'Issue JWT + user profile'],
            ['POST', '/auth/refresh', 'JWT', 'Rotate access token'],
            ['GET', '/auth/me', 'JWT', 'Current user from token'],
            ['PUT', '/auth/password', 'JWT', 'Change own password'],
            ['POST', '/auth/logout', 'JWT', 'Blacklist token (Upstash Redis)'],
          ]}
        />
        <DocCodeBlock>{`POST /auth/login
Content-Type: application/json

{
  "identifier": "teacher01",
  "password": "temp-password"
}`}</DocCodeBlock>
        <DocCodeBlock>{`// 200 OK
{
  "success": true,
  "data": {
    "token": "eyJhbG…",
    "user": {
      "id": "clx…",
      "name": "Ayesha Khan",
      "role": "teacher",
      "branchIds": ["clx…"]
    }
  }
}`}</DocCodeBlock>
        <p>
          Web clients store the token in an httpOnly cookie. Mobile sends{' '}
          <code>Authorization: Bearer &lt;token&gt;</code>. See{' '}
          <Link href="/docs/api/authentication">Authentication</Link> for refresh and blacklist details.
        </p>
      </DocSection>

      <DocSection title="CEO — API keys (/api-keys)">
        <p>Requires <code>super_admin</code>. Keys authenticate server-to-server integrations.</p>
        <DocTable
          headers={['Method', 'Path', 'Description']}
          rows={[
            ['POST', '/api-keys', 'Create key — plaintext returned once'],
            ['GET', '/api-keys', 'List active keys (masked)'],
            ['DELETE', '/api-keys/:id', 'Revoke key'],
          ]}
        />
        <DocCodeBlock>{`POST /api-keys
Authorization: Bearer <ceo-jwt>
Content-Type: application/json

{
  "name": "Web production",
  "branchId": null
}`}</DocCodeBlock>
      </DocSection>

      <DocSection title="CEO — Admin invitations (/admin/invitations)">
        <DocTable
          headers={['Method', 'Path', 'Auth', 'Description']}
          rows={[
            ['POST', '/admin/invitations', 'super_admin', 'Invite branch admin'],
            ['GET', '/admin/invitations', 'super_admin', 'List pending invitations'],
            ['GET', '/admin/invitations/admins/:userId', 'super_admin', 'Admin profile for edit'],
            ['PUT', '/admin/invitations/admins/:userId', 'super_admin', 'Update invited admin'],
            ['GET', '/admin/invitations/:token', 'Public', 'Validate invitation token'],
            ['POST', '/admin/invitations/:token/complete', 'Public', 'Complete signup with password'],
          ]}
        />
      </DocSection>

      <DocSection title="Session context (/me)">
        <p>Any authenticated user. No admin role required.</p>
        <DocTable
          headers={['Method', 'Path', 'Description']}
          rows={[
            ['GET', '/me/branches', 'Branches the user can access'],
            ['GET', '/me/academic-year', 'Active or selected AY for branch'],
            ['GET', '/me/permissions', 'Staff module permissions (management role)'],
          ]}
        />
        <DocCodeBlock>{`GET /me/permissions?branchId=clx…
Authorization: Bearer <jwt>

// 200 OK
{
  "success": true,
  "data": {
    "modules": {
      "fees": { "read": true, "create": true, "update": true, "delete": false },
      "attendance": { "read": true, "create": true, "update": true, "delete": false }
    },
    "archivedAyAccess": false
  }
}`}</DocCodeBlock>
      </DocSection>

      <DocSection title="Branch admin (/branches)">
        <p>Branch-role guards: <code>branch_admin</code>, <code>sub_admin</code>.</p>
        <DocTable
          headers={['Method', 'Path', 'Role', 'Description']}
          rows={[
            ['GET', '/branches/:branchId/staff', 'branch_admin | sub_admin', 'List branch staff'],
            ['POST', '/branches/:branchId/staff', 'branch_admin', 'Add staff member'],
            ['PUT', '/branches/:branchId/staff/:userId', 'branch_admin', 'Update staff'],
            ['DELETE', '/branches/:branchId/staff/:userId', 'branch_admin', 'Remove staff'],
            ['POST', '/branches/:branchId/admin/resign', 'branch_admin', 'Self-resign as admin'],
          ]}
        />
      </DocSection>

      <DocSection title="Admin ERP (/admin)">
        <p>
          All routes require JWT + (<code>super_admin</code> OR <code>management</code>). Middleware
          chain: auth → role → branchScope → staffPermission. Pass{' '}
          <code>?branchId=&amp;academicYearId=</code> on scoped routes.
        </p>

        <h3>Branches &amp; academic years</h3>
        <DocTable
          headers={['Method', 'Path', 'Notes']}
          rows={[
            ['POST', '/admin/branches', 'Create branch'],
            ['GET', '/admin/branches', 'List branches'],
            ['GET', '/admin/branches/:id', 'Branch detail'],
            ['PUT', '/admin/branches/:id', 'Update branch'],
            ['DELETE', '/admin/branches/:id', 'Deactivate branch'],
            ['GET', '/admin/branches/:id/stats', 'Branch statistics'],
            ['GET', '/admin/branches/:id/chat-settings', 'Branch chat toggles'],
            ['PATCH', '/admin/branches/:id/chat-settings', 'Update chat settings'],
            ['POST', '/admin/branches/:branchId/members', 'Add branch member'],
            ['PUT', '/admin/branches/:branchId/members/:userId', 'Update member role'],
            ['DELETE', '/admin/branches/:branchId/members/:userId', 'Remove member'],
            ['POST', '/admin/branches/:branchId/members/:userId/promote', 'Promote to branch_admin'],
            ['POST', '/admin/branches/:branchId/remove-admin/:userId', 'Demote admin'],
            ['POST', '/admin/branches/:branchId/academic-years', 'Create academic year'],
            ['GET', '/admin/branches/:branchId/academic-years', 'List academic years'],
            ['GET', '/admin/branches/:branchId/academic-years/:id', 'AY detail'],
            ['PUT', '/admin/branches/:branchId/academic-years/:id', 'Update AY metadata'],
            ['PATCH', '/admin/branches/:branchId/academic-years/:id/publish', 'BUILD_STAGE → ACTIVE'],
            ['PATCH', '/admin/branches/:branchId/academic-years/:id/pause', 'ACTIVE → ON_HOLD'],
            ['PATCH', '/admin/branches/:branchId/academic-years/:id/resume', 'ON_HOLD → ACTIVE'],
            ['PATCH', '/admin/branches/:branchId/academic-years/:id/archive', 'ACTIVE → ARCHIVED'],
            ['PATCH', '/admin/branches/:branchId/academic-years/:id/unarchive', 'ARCHIVED → ACTIVE'],
            ['GET', '/admin/branches/:branchId/academic-years/:id/delete-preview', 'Deletion impact preview'],
            ['DELETE', '/admin/branches/:branchId/academic-years/:id', 'Delete empty AY'],
            ['POST', '/admin/branches/:branchId/academic-years/:ayId/members', 'Add AY member'],
            ['DELETE', '/admin/branches/:branchId/academic-years/:ayId/members/:userId', 'Remove AY member'],
            ['GET', '/admin/branches/:branchId/academic-year-audit-logs', 'AY lifecycle audit'],
          ]}
        />

        <h3>Academic calendars</h3>
        <DocTable
          headers={['Method', 'Path']}
          rows={[
            ['POST', '/admin/calendars'],
            ['GET', '/admin/calendars'],
            ['GET', '/admin/calendars/:id'],
            ['PUT', '/admin/calendars/:id'],
            ['PATCH', '/admin/calendars/:id/set-current'],
            ['DELETE', '/admin/calendars/:id'],
          ]}
        />

        <h3>Sections, subjects, classes</h3>
        <DocTable
          headers={['Method', 'Path', 'Notes']}
          rows={[
            ['POST', '/admin/branches/:branchId/academic-years/:ayId/sections', 'Create section'],
            ['GET', '/admin/branches/:branchId/academic-years/:ayId/sections', 'List sections'],
            ['PUT', '/admin/branches/:branchId/sections/:id', 'Update section'],
            ['DELETE', '/admin/branches/:branchId/sections/:id', 'Delete section'],
            ['GET', '/admin/branches/:branchId/sections/:sectionId/subjects', 'Subjects in section'],
            ['POST', '/admin/branches/:branchId/academic-years/:ayId/subjects', 'Create subject'],
            ['GET', '/admin/branches/:branchId/academic-years/:ayId/subjects', 'List subjects'],
            ['GET', '/admin/branches/:branchId/subjects/:id', 'Subject detail'],
            ['PUT', '/admin/branches/:branchId/subjects/:id', 'Update subject'],
            ['DELETE', '/admin/branches/:branchId/subjects/:id', 'Delete subject'],
            ['POST', '/admin/branches/:branchId/subjects/:id/link', 'Link subject to class'],
            ['DELETE', '/admin/branches/:branchId/subjects/:id/unlink/:groupId', 'Unlink from class'],
            ['GET', '/admin/groups', 'List classes (scoped by AY)'],
            ['GET', '/admin/groups/:id', 'Class detail + members'],
            ['POST', '/admin/groups', 'Create class'],
            ['DELETE', '/admin/groups/:id', 'Deactivate class'],
          ]}
        />

        <h3>Students</h3>
        <DocTable
          headers={['Method', 'Path', 'Notes']}
          rows={[
            ['GET', '/admin/students', 'List — branch + AY scoped'],
            ['GET', '/admin/students/:id', 'Full student profile'],
            ['POST', '/admin/students', 'Enroll new student'],
            ['PUT', '/admin/students/:id', 'Update profile'],
            ['DELETE', '/admin/students/:id', 'Deactivate'],
            ['PUT', '/admin/students/:id/status', 'Change enrollment status'],
            ['GET', '/admin/students/:id/status-logs', 'Status change history'],
            ['POST', '/admin/students/:id/emergency-contact', 'Add emergency contact'],
            ['PUT', '/admin/students/:id/emergency-contact/:contactId', 'Update contact'],
            ['DELETE', '/admin/students/:id/emergency-contact/:contactId', 'Remove contact'],
            ['PUT', '/admin/students/:id/health-record', 'Update health record'],
            ['POST', '/admin/students/:id/parents', 'Link parent account'],
            ['PUT', '/admin/students/:id/parent', 'Update primary parent'],
            ['DELETE', '/admin/students/:id/parents/:parentUserId', 'Unlink parent'],
            ['PUT', '/admin/students/:id/generate-credentials', 'Generate login username/password'],
            ['PUT', '/admin/students/:id/set-password', 'Admin-set password (rate limited)'],
            ['POST', '/admin/students/:id/send-credentials', 'WhatsApp credential delivery'],
            ['POST', '/admin/students/send-to-new', 'Bulk send to new students'],
            ['POST', '/admin/students/send-all-credentials', 'Bulk credential send'],
          ]}
        />
        <DocCodeBlock>{`POST /admin/students?branchId=clx…&academicYearId=clx…
Content-Type: application/json

{
  "name": "Ali Raza",
  "groupId": "clx…",
  "dateOfBirth": "2012-05-14",
  "gender": "male",
  "fatherName": "Raza Ahmed",
  "phone": "+923001234567"
}`}</DocCodeBlock>

        <h3>Teachers &amp; assignments</h3>
        <DocTable
          headers={['Method', 'Path', 'Notes']}
          rows={[
            ['GET', '/admin/teachers', 'List teacher profiles'],
            ['POST', '/admin/teachers', 'Create teacher'],
            ['GET', '/admin/teachers/:id', 'Teacher detail'],
            ['PUT', '/admin/teachers/:id', 'Update teacher'],
            ['DELETE', '/admin/teachers/:id', 'Remove teacher'],
            ['POST', '/admin/teachers/:id/deactivate', 'Deactivate'],
            ['POST', '/admin/teachers/:id/reactivate', 'Reactivate'],
            ['GET', '/admin/teachers/:id/portal-permissions', 'Teacher portal RBAC'],
            ['PUT', '/admin/teachers/:id/portal-permissions', 'Update portal permissions'],
            ['POST', '/admin/teachers/:id/set-password', 'Set password'],
            ['POST', '/admin/teachers/:id/send-credentials', 'WhatsApp credentials'],
            ['GET', '/admin/teachers/:id/assignments', 'Subject assignments'],
            ['POST', '/admin/assignments', 'Create assignment'],
            ['GET', '/admin/groups/:groupId/assignments', 'Assignments for class'],
            ['PUT', '/admin/assignments/:id', 'Update assignment'],
            ['POST', '/admin/assignments/:id/end', 'End assignment tenure'],
            ['DELETE', '/admin/assignments/:id', 'Delete assignment'],
          ]}
        />

        <h3>Staff RBAC</h3>
        <DocTable
          headers={['Method', 'Path', 'Notes']}
          rows={[
            ['GET', '/admin/staff', 'List management staff'],
            ['POST', '/admin/staff', 'Create staff account'],
            ['POST', '/admin/staff/workers', 'Create non-teaching worker'],
            ['GET', '/admin/staff/:userId', 'Staff profile'],
            ['PATCH', '/admin/staff/:userId', 'Update staff'],
            ['POST', '/admin/staff/:userId/deactivate', 'Deactivate'],
            ['POST', '/admin/staff/:userId/reactivate', 'Reactivate'],
            ['GET', '/admin/staff/:userId/permissions', 'Module permissions'],
            ['PUT', '/admin/staff/:userId/permissions', 'Update permissions'],
            ['POST', '/admin/staff/:userId/set-password', 'Set password'],
            ['POST', '/admin/staff/:userId/send-credentials', 'Send credentials'],
          ]}
        />

        <h3>Timetable</h3>
        <DocTable
          headers={['Method', 'Path']}
          rows={[
            ['GET', '/admin/branches/:branchId/academic-years/:ayId/timetables'],
            ['POST', '/admin/branches/:branchId/academic-years/:ayId/timetables'],
            ['PUT', '/admin/branches/:branchId/timetables/:id/rename'],
            ['DELETE', '/admin/branches/:branchId/timetables/:id'],
            ['GET', '/admin/branches/:branchId/timetables/:id/days'],
            ['PUT', '/admin/branches/:branchId/timetables/:id/days'],
            ['GET', '/admin/branches/:branchId/timetables/:id/slots'],
            ['POST', '/admin/branches/:branchId/timetables/:id/slots'],
            ['DELETE', '/admin/branches/:branchId/timetables/:id/slots/:slotId'],
            ['GET', '/admin/branches/:branchId/sections/:sectionId/timetable'],
            ['PUT', '/admin/branches/:branchId/sections/:sectionId/timetable/:slotId'],
            ['GET', '/admin/branches/:branchId/teachers/:teacherId/timetables'],
          ]}
        />

        <h3>Attendance</h3>
        <DocTable
          headers={['Method', 'Path', 'Notes']}
          rows={[
            ['GET', '/admin/attendance', 'Class attendance grid — ?groupId=&date='],
            ['POST', '/admin/attendance/batch', 'Batch save student attendance'],
            ['GET', '/admin/students/:id/attendance', 'Single student history'],
            ['GET', '/admin/attendance/teachers', 'Teacher attendance list'],
            ['POST', '/admin/attendance/teachers/batch', 'Batch teacher attendance'],
            ['GET', '/admin/attendance/staff', 'Staff attendance list'],
            ['POST', '/admin/attendance/staff/batch', 'Batch staff attendance'],
            ['POST', '/admin/attendance/notify', 'Trigger parent notifications'],
          ]}
        />
        <DocCodeBlock>{`POST /admin/attendance/batch?branchId=clx…&academicYearId=clx…
Content-Type: application/json

{
  "groupId": "clx…",
  "date": "2026-03-15",
  "records": [
    { "studentId": "clx…", "status": "present" },
    { "studentId": "clx…", "status": "absent", "remarks": "Sick" }
  ]
}`}</DocCodeBlock>

        <h3>Fees</h3>
        <DocTable
          headers={['Method', 'Path', 'Notes']}
          rows={[
            ['GET', '/admin/fee-heads', 'Fee head catalog'],
            ['POST', '/admin/fee-heads', 'Create fee head'],
            ['PUT', '/admin/fee-heads/:id', 'Update fee head'],
            ['DELETE', '/admin/fee-heads/:id', 'Delete fee head'],
            ['GET', '/admin/fee-structures', 'Structures for AY'],
            ['POST', '/admin/fee-structures', 'Create structure'],
            ['POST', '/admin/fee-structures/update-amount', 'Bulk amount update'],
            ['DELETE', '/admin/fee-structures/:id', 'Delete structure'],
            ['GET', '/admin/student-fees', 'Generated student fee rows'],
            ['POST', '/admin/student-fees/generate', 'Generate fees for class/students'],
            ['POST', '/admin/student-fees/recalculate', 'Recalculate after structure change'],
            ['GET', '/admin/students/:id/fee', 'Single student fee breakdown'],
            ['PUT', '/admin/students/:id/custom-fee', 'Custom fee override'],
            ['POST', '/admin/student-fees/:id/extra-items', 'Add extra line item'],
            ['GET', '/admin/student-fees/:id/extra-items', 'List extra items'],
            ['DELETE', '/admin/student-fees/:id/extra-items/:itemId', 'Remove extra item'],
            ['GET', '/admin/fees/students-list', 'Fee collection picker'],
            ['POST', '/admin/payments', 'Record payment'],
            ['POST', '/admin/payments/waterfall', 'Waterfall allocation'],
            ['POST', '/admin/payments/allocate', 'Manual allocation'],
            ['POST', '/admin/payments/:id/revert', 'Revert payment'],
            ['GET', '/admin/payments', 'Payment history'],
            ['GET', '/admin/payments/:id/receipt', 'Receipt data'],
            ['POST', '/admin/payments/:id/print-receipt', 'Mark receipt printed'],
            ['GET', '/admin/families', 'Family accounts'],
            ['POST', '/admin/families', 'Create family'],
            ['GET', '/admin/families/:id', 'Family detail'],
            ['PATCH', '/admin/families/:id', 'Update family'],
            ['POST', '/admin/family-payments', 'Family-level payment'],
            ['POST', '/admin/family-payments/allocate', 'Allocate across siblings'],
            ['GET', '/admin/fees/summary', 'Dashboard summary'],
            ['GET', '/admin/fees/defaulter', 'Defaulter report'],
            ['GET', '/admin/fees/collection-report', 'Collection report'],
            ['GET', '/admin/fees/analytics', 'Analytics aggregates'],
            ['POST', '/admin/fees/carry-forward', 'Carry forward balances'],
            ['GET', '/admin/fees/carry-forward/sources/:studentId', 'Carry-forward sources'],
            ['GET', '/admin/fees/stationary/catalog', 'Stationary fee catalog'],
            ['POST', '/admin/fees/stationary/assign', 'Assign stationary to student'],
          ]}
        />

        <h3>Exams &amp; results (/admin/result)</h3>
        <DocTable
          headers={['Method', 'Path', 'Notes']}
          rows={[
            ['GET', '/admin/exam-sessions', 'List exam sessions'],
            ['POST', '/admin/exam-sessions', 'Create session'],
            ['GET', '/admin/exam-sessions/:sessionId', 'Session detail'],
            ['PATCH', '/admin/exam-sessions/:sessionId', 'Update session'],
            ['DELETE', '/admin/exam-sessions/:sessionId', 'Delete session'],
            ['GET', '/admin/result/sessions/:sessionId/types', 'Exam types in session'],
            ['POST', '/admin/result/sessions/:sessionId/types', 'Create exam type'],
            ['PATCH', '/admin/result/sessions/:sessionId/types/:typeId', 'Update type'],
            ['DELETE', '/admin/result/sessions/:sessionId/types/:typeId', 'Delete type'],
            ['GET', '/admin/result/sessions/:sessionId/summary', 'Session summary'],
            ['GET', '/admin/result/sessions/:sessionId/exams', 'Exams in session'],
            ['POST', '/admin/result/sessions/:sessionId/exams', 'Create exam'],
            ['GET', '/admin/result/exams/:examId', 'Exam detail'],
            ['PATCH', '/admin/result/exams/:examId', 'Update exam'],
            ['DELETE', '/admin/result/exams/:examId', 'Delete exam'],
            ['POST', '/admin/result/exams/:examId/structure', 'Build exam structure'],
            ['GET', '/admin/result/exams/:examId/structure', 'Get structure'],
            ['PATCH', '/admin/result/structure/classes/:linkId', 'Update class link'],
            ['PATCH', '/admin/result/structure/subjects/:linkId', 'Update subject link'],
            ['GET', '/admin/result/structure/subjects/:linkId/marks-grid', 'Admin marks grid'],
            ['POST', '/admin/result/structure/subjects/:linkId/marks', 'Save marks (admin)'],
            ['DELETE', '/admin/result/marks/:entryId', 'Delete marks entry'],
            ['POST', '/admin/result/sessions/:sessionId/compute-results', 'Compute all results'],
            ['POST', '/admin/result/sessions/:sessionId/classes/:classId/subjects/:subjectId/compute', 'Compute subject'],
            ['GET', '/admin/result/sessions/:sessionId/classes/:classId/results', 'Class results'],
            ['POST', '/admin/result/sessions/:sessionId/compute-report-cards', 'Compute report cards'],
            ['POST', '/admin/result/sessions/:sessionId/classes/:classId/compute-report-cards', 'Class report cards'],
            ['GET', '/admin/result/sessions/:sessionId/classes/:classId/report-cards', 'List report cards'],
            ['POST', '/admin/result/report-cards/:id/publish', 'Publish report card'],
            ['GET', '/admin/result/students/:studentId/sessions/:sessionId/report-card', 'Student report card'],
            ['GET', '/admin/result/analytics', 'Result analytics'],
          ]}
        />

        <h3>Expenses</h3>
        <DocTable
          headers={['Method', 'Path', 'Module']}
          rows={[
            ['GET', '/admin/expenses/summary', 'Dashboard'],
            ['GET', '/admin/expenses/vouchers', 'Vouchers list'],
            ['GET', '/admin/expenses/vouchers/:id', 'Voucher detail'],
            ['POST', '/admin/expenses/vouchers/:id/void', 'Void voucher'],
            ['GET', '/admin/expenses/payroll/payees', 'Payroll payees'],
            ['GET', '/admin/expenses/payroll/preview', 'Bulk preview'],
            ['POST', '/admin/expenses/payroll/bulk', 'Bulk payroll run'],
            ['GET', '/admin/expenses/payroll', 'Payroll list'],
            ['POST', '/admin/expenses/payroll', 'Single payroll entry'],
            ['GET', '/admin/expenses/payroll/profile/:userId', 'Payroll profile'],
            ['GET', '/admin/expenses/payroll/payee/:userId', 'Payee detail'],
            ['GET', '/admin/expenses/payroll/history/:userId', 'Pay history'],
            ['GET', '/admin/expenses/utilities/categories', 'Utility categories'],
            ['POST', '/admin/expenses/utilities/categories', 'Create category'],
            ['PATCH', '/admin/expenses/utilities/categories/:id', 'Update category'],
            ['GET', '/admin/expenses/utilities/providers', 'Providers'],
            ['POST', '/admin/expenses/utilities/providers', 'Create provider'],
            ['PATCH', '/admin/expenses/utilities/providers/:id', 'Update provider'],
            ['POST', '/admin/expenses/utilities/duplicate-last', 'Duplicate last bill'],
            ['GET', '/admin/expenses/utilities/reminders', 'Due reminders'],
            ['GET', '/admin/expenses/utilities', 'Utility bills'],
            ['POST', '/admin/expenses/utilities', 'Record utility bill'],
            ['GET', '/admin/expenses/others/categories', 'Other expense categories'],
            ['POST', '/admin/expenses/others/categories', 'Create category'],
            ['PATCH', '/admin/expenses/others/categories/:id', 'Update category'],
            ['GET', '/admin/expenses/others', 'Other expenses'],
            ['POST', '/admin/expenses/others', 'Record other expense'],
            ['GET', '/admin/expenses/export/payroll', 'Export payroll CSV'],
            ['GET', '/admin/expenses/export/utilities', 'Export utilities CSV'],
            ['GET', '/admin/expenses/export/others', 'Export others CSV'],
          ]}
        />

        <h3>Stationary</h3>
        <DocTable
          headers={['Method', 'Path']}
          rows={[
            ['GET', '/admin/stationary/categories'],
            ['POST', '/admin/stationary/categories'],
            ['PATCH', '/admin/stationary/categories/:id'],
            ['GET', '/admin/stationary/suppliers'],
            ['GET', '/admin/stationary/suppliers/:id'],
            ['POST', '/admin/stationary/suppliers'],
            ['PATCH', '/admin/stationary/suppliers/:id'],
            ['GET', '/admin/stationary/suppliers/:id/payments'],
            ['POST', '/admin/stationary/suppliers/:id/payments'],
            ['GET', '/admin/stationary/suppliers/:id/restock-purchases'],
            ['GET', '/admin/stationary/products'],
            ['POST', '/admin/stationary/products'],
            ['PATCH', '/admin/stationary/products/:id'],
            ['GET', '/admin/stationary/inventory'],
            ['POST', '/admin/stationary/restock-purchases'],
            ['POST', '/admin/stationary/inventory/adjust'],
            ['GET', '/admin/stationary/sales-records'],
          ]}
        />

        <h3>Tenure &amp; batch promotion</h3>
        <DocTable
          headers={['Method', 'Path', 'Notes']}
          rows={[
            ['GET', '/admin/branch-members/:branchMemberId/tenures', 'Staff tenure history'],
            ['POST', '/admin/branch-members/:branchMemberId/tenures/join', 'Record join'],
            ['POST', '/admin/branch-members/:branchMemberId/tenures/leave', 'Record leave'],
            ['GET', '/admin/students/:studentId/school-tenures', 'Student tenure'],
            ['POST', '/admin/students/:studentId/school-tenures/join', 'Student join'],
            ['POST', '/admin/students/:studentId/school-tenures/leave', 'Student leave'],
            ['POST', '/admin/students/:studentId/class-movements', 'Move between classes'],
            ['GET', '/admin/teachers/:userId/tenures', 'Teacher tenure'],
            ['POST', '/admin/teachers/:userId/tenures/join', 'Teacher join'],
            ['POST', '/admin/teachers/:userId/tenures/leave', 'Teacher leave'],
            ['GET', '/admin/batch-promotion/preconditions', 'Promotion readiness'],
            ['GET', '/admin/batch-promotion/runs', 'List promotion runs'],
            ['POST', '/admin/batch-promotion/start', 'Start run'],
            ['GET', '/admin/batch-promotion/runs/:runId', 'Run detail'],
            ['POST', '/admin/batch-promotion/runs/:runId/snapshot', 'Snapshot students'],
            ['POST', '/admin/batch-promotion/runs/:runId/apply', 'Apply promotions'],
            ['POST', '/admin/batch-promotion/runs/:runId/publish', 'Publish promoted AY'],
          ]}
        />

        <h3>Chat admin — class roles (/admin/communities)</h3>
        <DocTable
          headers={['Method', 'Path', 'Notes']}
          rows={[
            ['GET', '/admin/communities/by-group/:groupId', 'Resolve community from class'],
            ['GET', '/admin/communities/:communityId/roles', 'List role definitions'],
            ['POST', '/admin/communities/:communityId/roles', 'Create role'],
            ['PATCH', '/admin/communities/:communityId/roles/:roleId', 'Update role'],
            ['DELETE', '/admin/communities/:communityId/roles/:roleId', 'Delete role'],
            ['POST', '/admin/communities/:communityId/roles/:roleId/assign', 'Assign to student'],
            ['DELETE', '/admin/communities/:communityId/assignments/:assignmentId', 'Remove assignment'],
          ]}
        />

        <h3>Dashboard &amp; users</h3>
        <DocTable
          headers={['Method', 'Path', 'Notes']}
          rows={[
            ['GET', '/admin/stats', 'Dashboard counts — requires scope'],
            ['GET', '/admin/users', 'List users — ?role=&status=&search='],
            ['GET', '/admin/users/:id', 'User detail'],
            ['POST', '/admin/users', 'Create user (legacy)'],
            ['DELETE', '/admin/users/:id', 'Deactivate user'],
          ]}
        />
      </DocSection>

      <DocSection title="Canteen (/admin/canteen)">
        <p>Mounted before global admin middleware. Sales routes require canteen staff role.</p>
        <DocTable
          headers={['Method', 'Path', 'Auth']}
          rows={[
            ['GET', '/admin/canteen/products', 'canteen_staff (sales)'],
            ['GET', '/admin/canteen/credit-persons', 'canteen_staff'],
            ['GET', '/admin/canteen/credit-classes', 'canteen_staff'],
            ['GET', '/admin/canteen/accounts', 'canteen_staff'],
            ['GET', '/admin/canteen/accounts/:id', 'canteen_staff'],
            ['GET', '/admin/canteen/accounts/:id/payments', 'canteen_staff'],
            ['GET', '/admin/canteen/accounts/:id/sales', 'canteen_staff'],
            ['POST', '/admin/canteen/sales', 'canteen_staff — record sale'],
            ['GET', '/admin/canteen/sales', 'canteen_staff'],
            ['GET', '/admin/canteen/summary', 'canteen_staff'],
            ['GET', '/admin/canteen/categories', 'admin'],
            ['POST', '/admin/canteen/categories', 'admin'],
            ['PATCH', '/admin/canteen/categories/:id', 'admin'],
            ['GET', '/admin/canteen/suppliers', 'admin'],
            ['GET', '/admin/canteen/suppliers/:id', 'admin'],
            ['POST', '/admin/canteen/suppliers', 'admin'],
            ['PATCH', '/admin/canteen/suppliers/:id', 'admin'],
            ['GET', '/admin/canteen/suppliers/:id/restock-purchases', 'admin'],
            ['POST', '/admin/canteen/suppliers/:id/payments', 'admin'],
            ['POST', '/admin/canteen/products', 'admin'],
            ['PATCH', '/admin/canteen/products/:id', 'admin'],
            ['DELETE', '/admin/canteen/products/:id', 'admin'],
            ['POST', '/admin/canteen/restock-purchases', 'admin'],
            ['GET', '/admin/canteen/restock-purchases', 'admin'],
            ['POST', '/admin/canteen/accounts', 'admin'],
            ['POST', '/admin/canteen/accounts/:id/payments', 'admin'],
          ]}
        />
      </DocSection>

      <DocSection title="Teacher portal (/teacher)">
        <p>Requires <code>teacher</code> role + active TeacherProfile + branch/AY scope.</p>
        <DocTable
          headers={['Method', 'Path', 'Notes']}
          rows={[
            ['GET', '/teacher/bootstrap', '?branchId=&academicYearId= — full portal state'],
            ['GET', '/teacher/profile', 'Teacher profile'],
            ['PUT', '/teacher/profile', 'Update phone, emergency contact, address'],
            ['GET', '/teacher/announcements', 'School/class announcements'],
            ['GET', '/teacher/timetable', 'Weekly timetable'],
            ['GET', '/teacher/classes/:groupId/students', 'Class roster'],
            ['GET', '/teacher/classes/:groupId/community', 'Chat community (class teacher)'],
            ['GET', '/teacher/attendance', '?groupId=&date= — attendance grid'],
            ['POST', '/teacher/attendance/batch', 'Save attendance (blocked if AY read-only)'],
            ['GET', '/teacher/marks/subjects', 'Assigned exam subjects'],
            ['GET', '/teacher/marks/table', '?sessionId=&examTypeId=&subjectId='],
            ['GET', '/teacher/marks/grid/:examClassSubjectId', 'Marks grid'],
            ['POST', '/teacher/marks/grid/:examClassSubjectId', 'Save marks'],
            ['GET', '/teacher/hod/department', 'HOD department overview'],
            ['GET', '/teacher/hod/marks/subjects', 'HOD subject list'],
            ['GET', '/teacher/notifications', '?unreadOnly=&limit='],
            ['PATCH', '/teacher/notifications/:id/read', 'Mark one read'],
            ['POST', '/teacher/notifications/read-all', 'Mark all read'],
            ['GET', '/teacher/my-attendance', '?from=&to= — own staff attendance'],
            ['GET', '/teacher/my-payroll', 'Own payroll history'],
            ['GET', '/teacher/chat/landing', 'Mobile chat bootstrap'],
            ['GET', '/teacher/chat/contacts', 'DM contact picker'],
            ['POST', '/teacher/chat/dm', '{ participantUserId }'],
            ['GET', '/teacher/communities/:communityId/roles', 'Class role CRUD (class teacher)'],
            ['POST', '/teacher/communities/:communityId/roles', 'Create role'],
            ['PATCH', '/teacher/communities/:communityId/roles/:roleId', 'Update role'],
            ['DELETE', '/teacher/communities/:communityId/roles/:roleId', 'Delete role'],
            ['POST', '/teacher/communities/:communityId/roles/:roleId/assign', 'Assign student'],
            ['DELETE', '/teacher/communities/:communityId/assignments/:assignmentId', 'Remove assignment'],
          ]}
        />
        <DocCodeBlock>{`GET /teacher/bootstrap?branchId=clx…&academicYearId=clx…

// 200 OK (abbreviated)
{
  "success": true,
  "data": {
    "branch": { "id": "clx…", "name": "Main Campus" },
    "academicYear": { "id": "clx…", "name": "2025-26", "status": "ACTIVE" },
    "permissions": { "portalAccess": "FULL", "features": { "marks": { "canEnter": true } } },
    "assignments": [{ "groupId": "clx…", "subjectName": "Mathematics" }]
  }
}`}</DocCodeBlock>
      </DocSection>

      <DocSection title="Student portal (/student)">
        <p>Requires <code>student</code> role + active enrollment. All routes read-only except DM open.</p>
        <DocTable
          headers={['Method', 'Path', 'Description']}
          rows={[
            ['GET', '/student/bootstrap', '?academicYearId= — portal + chat state'],
            ['GET', '/student/profile', 'Student profile'],
            ['GET', '/student/fees', 'Fee summary + history'],
            ['GET', '/student/attendance', '?from=&to= — attendance records'],
            ['GET', '/student/results/table', '?sessionId=&examTypeId=&subjectId='],
            ['GET', '/student/canteen', 'Canteen account balance'],
            ['GET', '/student/timetable', 'Weekly timetable'],
            ['GET', '/student/datesheets', 'Exam datesheets'],
            ['GET', '/student/announcements', 'School announcements'],
            ['GET', '/student/chat/landing', 'Chat rooms + canPost flags'],
            ['GET', '/student/chat/contacts', 'DM contacts'],
            ['POST', '/student/chat/dm', '{ participantUserId }'],
          ]}
        />
      </DocSection>

      <DocSection title="Staff mobile portal (/staff)">
        <p>Branch admin / management mobile shell. Requires <code>?branchId=&amp;academicYearId=</code> on most routes.</p>
        <DocTable
          headers={['Method', 'Path', 'Description']}
          rows={[
            ['GET', '/staff/profile', '?branchId= — self profile'],
            ['GET', '/staff/chat/landing', 'Chat bootstrap'],
            ['GET', '/staff/chat/contacts', 'DM contacts'],
            ['POST', '/staff/chat/dm', '{ branchId, academicYearId, participantUserId }'],
            ['GET', '/staff/campus/overview', 'Campus KPIs'],
            ['GET', '/staff/campus/fees', 'Fees summary'],
            ['GET', '/staff/campus/attendance', '?date= — today attendance'],
            ['GET', '/staff/campus/results', 'Results summary'],
            ['GET', '/staff/campus/staff', 'Staff directory'],
          ]}
        />
      </DocSection>

      <DocSection title="Chat REST (/chat)">
        <p>JWT required. Realtime delivery uses Socket.IO — see <Link href="/docs/api/chat">Chat docs</Link>.</p>
        <DocTable
          headers={['Method', 'Path', 'Description']}
          rows={[
            ['GET', '/chat/rooms?academicYearId=', 'List rooms for current user'],
            ['GET', '/chat/rooms/:roomId/messages', '?cursor=&limit= — paginated history'],
            ['PATCH', '/chat/messages/:messageId', '{ content } — edit own message'],
            ['DELETE', '/chat/messages/:messageId', 'Soft-delete own message'],
            ['POST', '/chat/devices', '{ token, platform } — register FCM token'],
            ['DELETE', '/chat/devices', '{ token } — remove FCM token'],
          ]}
        />
        <DocCodeBlock>{`GET /chat/rooms/:roomId/messages?limit=30

// 200 OK
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "clx…",
        "type": "text",
        "content": "Homework for Monday",
        "sender": { "id": "clx…", "name": "Ayesha Khan" },
        "createdAt": "2026-03-15T10:30:00.000Z"
      }
    ],
    "nextCursor": "clx…"
  }
}`}</DocCodeBlock>
      </DocSection>

      <DocSection title="Upload &amp; files (/api)">
        <p>POST requires auth + upload permission. GET serving is public for <code>&lt;img&gt;</code> tags.</p>
        <DocTable
          headers={['Method', 'Path', 'Auth']}
          rows={[
            ['POST', '/api/upload', 'JWT — multipart file field <code>file</code>'],
            ['GET', '/api/uploads', 'Public — list (filtered by auth when scoped)'],
            ['GET', '/api/uploads/:id', 'Public — binary/stream'],
            ['GET', '/api/uploads/:id/meta', 'Public — metadata JSON'],
            ['PUT', '/api/uploads/:id/rename', 'JWT — rename file'],
            ['DELETE', '/api/uploads/:id', 'JWT — delete file'],
          ]}
        />
        <p>Legacy dev static files: <code>GET /uploads/*</code> when R2 is not configured.</p>
      </DocSection>

      <DocCallout variant="tip" title="Exploring routes locally">
        With <code>APP_MODE=development</code>, the request logger prints every HTTP method + path. Run{' '}
        <code>npm run dev</code> in <code>backend/</code> and watch the console while exercising the web
        or mobile app.
      </DocCallout>

      <p>
        Next: <Link href="/docs/api/openapi">OpenAPI Specification</Link> ·{' '}
        <Link href="/docs/api/chat">Chat &amp; Realtime</Link> ·{' '}
        <Link href="/docs/api/architecture">Architecture</Link>
      </p>
    </DocsShell>
  );
}
