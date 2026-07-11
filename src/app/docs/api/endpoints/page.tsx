import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocTable } from '@/components/docs/doc-blocks';
import { apiNav } from '@/lib/docs/navigation';

export default function ApiEndpointsPage() {
  return (
    <DocsShell
      title="REST Endpoints"
      subtitle="Grouped overview of the Express API. All paths are relative to the API base URL (default http://localhost:5000)."
      nav={apiNav}
      variant="api"
    >
      <p>
        The admin ERP alone exposes 100+ routes under <code>/admin</code>. Tables below list verified routes
        from <code>backend/src/modules/**/routes/*.ts</code> and <code>app.ts</code> mount points.
      </p>

      <h2>Health & setup</h2>
      <DocTable
        headers={['Method', 'Path', 'Auth', 'Description']}
        rows={[
          ['GET', '/', 'Public', 'API index with mount points'],
          ['GET', '/health', 'Public', 'Health check'],
          ['GET', '/setup/status', 'Public', 'Setup state'],
          ['POST', '/setup/init', 'Public', 'First-run bootstrap'],
        ]}
      />

      <h2>Auth</h2>
      <p>Mount: <code>/auth</code></p>
      <DocTable
        headers={['Method', 'Path', 'Auth']}
        rows={[
          ['POST', '/auth/login', 'Public'],
          ['POST', '/auth/refresh', 'JWT'],
          ['GET', '/auth/me', 'JWT'],
          ['PUT', '/auth/password', 'JWT'],
          ['POST', '/auth/logout', 'JWT'],
        ]}
      />

      <h2>CEO — API keys</h2>
      <p>Mount: <code>/api-keys</code> · Requires <code>super_admin</code></p>
      <DocTable
        headers={['Method', 'Path']}
        rows={[
          ['POST', '/api-keys'],
          ['GET', '/api-keys'],
          ['DELETE', '/api-keys/:id'],
        ]}
      />

      <h2>CEO — Admin invitations</h2>
      <p>Mount: <code>/admin/invitations</code></p>
      <DocTable
        headers={['Method', 'Path', 'Auth']}
        rows={[
          ['POST', '/admin/invitations', 'super_admin'],
          ['GET', '/admin/invitations', 'super_admin'],
          ['GET', '/admin/invitations/admins/:userId', 'super_admin'],
          ['PUT', '/admin/invitations/admins/:userId', 'super_admin'],
          ['GET', '/admin/invitations/:token', 'Public'],
          ['POST', '/admin/invitations/:token/complete', 'Public'],
        ]}
      />

      <h2>CEO / Admin ERP</h2>
      <p>
        Mount: <code>/admin</code> · Requires <code>super_admin</code> or <code>management</code> + branch scope +
        staff module permissions.
      </p>

      <h3>Branches & academic years</h3>
      <DocTable
        headers={['Method', 'Path', 'Notes']}
        rows={[
          ['POST', '/admin/branches', 'Create branch'],
          ['GET', '/admin/branches', 'List branches'],
          ['GET', '/admin/branches/:id', 'Branch detail'],
          ['PUT', '/admin/branches/:id', 'Update branch'],
          ['DELETE', '/admin/branches/:id', 'Deactivate branch'],
          ['GET', '/admin/branches/:id/stats', 'Branch stats'],
          ['GET', '/admin/branches/:id/chat-settings', 'Chat settings'],
          ['PATCH', '/admin/branches/:id/chat-settings', 'Update chat settings'],
          ['POST', '/admin/branches/:branchId/academic-years', 'Create academic year'],
          ['GET', '/admin/branches/:branchId/academic-years', 'List academic years'],
          ['GET', '/admin/branches/:branchId/academic-years/:id', 'AY detail'],
          ['PUT', '/admin/branches/:branchId/academic-years/:id', 'Update AY'],
          ['PATCH', '/admin/branches/:branchId/academic-years/:id/publish', 'Publish AY'],
          ['PATCH', '/admin/branches/:branchId/academic-years/:id/pause', 'Pause AY'],
          ['PATCH', '/admin/branches/:branchId/academic-years/:id/resume', 'Resume AY'],
          ['PATCH', '/admin/branches/:branchId/academic-years/:id/archive', 'Archive AY'],
          ['PATCH', '/admin/branches/:branchId/academic-years/:id/unarchive', 'Unarchive AY'],
          ['DELETE', '/admin/branches/:branchId/academic-years/:id', 'Delete AY'],
        ]}
      />

      <h3>Students & teachers</h3>
      <DocTable
        headers={['Method', 'Path', 'Notes']}
        rows={[
          ['GET', '/admin/students', 'List (branch + AY scoped)'],
          ['GET', '/admin/students/:id', 'Detail'],
          ['POST', '/admin/students', 'Create'],
          ['PUT', '/admin/students/:id', 'Update'],
          ['DELETE', '/admin/students/:id', 'Deactivate'],
          ['POST', '/admin/students/:id/send-credentials', 'WhatsApp credentials'],
          ['POST', '/admin/students/:id/set-password', 'Set password'],
          ['GET', '/admin/teachers', 'List teacher profiles'],
          ['POST', '/admin/teachers', 'Create teacher'],
          ['GET', '/admin/teachers/:id', 'Teacher detail'],
          ['PUT', '/admin/teachers/:id', 'Update'],
          ['POST', '/admin/teachers/:id/send-credentials', 'WhatsApp credentials'],
          ['POST', '/admin/assignments', 'Create subject assignment'],
          ['GET', '/admin/groups/:groupId/assignments', 'Assignments for class'],
        ]}
      />

      <h3>Staff RBAC</h3>
      <DocTable
        headers={['Method', 'Path']}
        rows={[
          ['GET', '/admin/staff'],
          ['POST', '/admin/staff'],
          ['POST', '/admin/staff/workers'],
          ['GET', '/admin/staff/:userId'],
          ['PATCH', '/admin/staff/:userId'],
          ['GET', '/admin/staff/:userId/permissions'],
          ['PUT', '/admin/staff/:userId/permissions'],
          ['POST', '/admin/staff/:userId/send-credentials'],
        ]}
      />

      <h3>Attendance, fees, results, exams</h3>
      <DocTable
        headers={['Module', 'Path prefix', 'Examples']}
        rows={[
          ['Attendance', '/admin/attendance', 'GET /attendance, POST /attendance/batch, GET /attendance/teachers'],
          ['Fees', '/admin', 'GET /fee-heads, POST /student-fees/generate, POST /payments, GET /families'],
          ['Results', '/admin/result', 'Marks entry, report cards, analytics (mounted sub-routers)'],
          ['Exams', '/admin', 'GET /exam-sessions, exam types, exam structure under /exams/:examId/structure'],
          ['Expenses', '/admin/expenses', 'Payroll, utilities, others, vouchers'],
          ['Stationary', '/admin', 'Products, inventory, sales (stationary.routes)'],
          ['Canteen', '/admin/canteen', 'Products, sales, suppliers, accounts'],
        ]}
      />

      <h3>Dashboard & legacy</h3>
      <DocTable
        headers={['Method', 'Path']}
        rows={[
          ['GET', '/admin/stats'],
          ['GET', '/admin/users'],
          ['POST', '/admin/users'],
          ['GET', '/admin/groups'],
          ['POST', '/admin/groups'],
        ]}
      />

      <h3>Chat admin (class roles)</h3>
      <DocTable
        headers={['Method', 'Path']}
        rows={[
          ['GET', '/admin/communities/:communityId/roles'],
          ['POST', '/admin/communities/:communityId/roles'],
          ['PATCH', '/admin/communities/:communityId/roles/:roleId'],
          ['DELETE', '/admin/communities/:communityId/roles/:roleId'],
          ['POST', '/admin/communities/:communityId/roles/:roleId/assign'],
          ['DELETE', '/admin/communities/:communityId/assignments/:assignmentId'],
        ]}
      />

      <h2>Branch admin routes</h2>
      <p>Mount: <code>/branches</code> · Branch-role guards (<code>branch_admin</code>, <code>sub_admin</code>)</p>
      <DocTable
        headers={['Method', 'Path']}
        rows={[
          ['GET', '/branches/:branchId/staff'],
          ['POST', '/branches/:branchId/staff'],
          ['PUT', '/branches/:branchId/staff/:userId'],
          ['DELETE', '/branches/:branchId/staff/:userId'],
          ['POST', '/branches/:branchId/admin/resign'],
        ]}
      />

      <h2>Session context (/me)</h2>
      <p>Mount: <code>/me</code> · Any authenticated user</p>
      <DocTable
        headers={['Method', 'Path']}
        rows={[
          ['GET', '/me/academic-year'],
          ['GET', '/me/branches'],
          ['GET', '/me/permissions'],
        ]}
      />

      <h2>Teacher portal</h2>
      <p>Mount: <code>/teacher</code> · Requires <code>teacher</code> role</p>
      <DocTable
        headers={['Method', 'Path', 'Notes']}
        rows={[
          ['GET', '/teacher/bootstrap', '?branchId=&academicYearId='],
          ['GET', '/teacher/profile', ''],
          ['PUT', '/teacher/profile', ''],
          ['GET', '/teacher/timetable', ''],
          ['GET', '/teacher/classes/:groupId/students', ''],
          ['GET', '/teacher/attendance', ''],
          ['POST', '/teacher/attendance/batch', ''],
          ['GET', '/teacher/marks/subjects', ''],
          ['POST', '/teacher/marks/grid/:examClassSubjectId', 'Save marks'],
          ['GET', '/teacher/notifications', ''],
          ['GET', '/teacher/chat/landing', ''],
          ['GET', '/teacher/chat/contacts', ''],
          ['POST', '/teacher/chat/dm', ''],
          ['GET', '/teacher/communities/:communityId/roles', 'Class teacher role CRUD'],
        ]}
      />

      <h2>Student portal</h2>
      <p>Mount: <code>/student</code> · Requires <code>student</code> role</p>
      <DocTable
        headers={['Method', 'Path']}
        rows={[
          ['GET', '/student/bootstrap'],
          ['GET', '/student/profile'],
          ['GET', '/student/fees'],
          ['GET', '/student/attendance'],
          ['GET', '/student/results/table'],
          ['GET', '/student/canteen'],
          ['GET', '/student/timetable'],
          ['GET', '/student/datesheets'],
          ['GET', '/student/announcements'],
          ['GET', '/student/chat/landing'],
          ['GET', '/student/chat/contacts'],
          ['POST', '/student/chat/dm'],
        ]}
      />

      <h2>Staff mobile portal</h2>
      <p>Mount: <code>/staff</code> · Branch admin / management mobile</p>
      <DocTable
        headers={['Method', 'Path']}
        rows={[
          ['GET', '/staff/profile'],
          ['GET', '/staff/chat/landing'],
          ['GET', '/staff/chat/contacts'],
          ['POST', '/staff/chat/dm'],
          ['GET', '/staff/campus/overview'],
          ['GET', '/staff/campus/fees'],
          ['GET', '/staff/campus/attendance'],
          ['GET', '/staff/campus/results'],
          ['GET', '/staff/campus/staff'],
        ]}
      />

      <h2>Chat REST</h2>
      <p>Mount: <code>/chat</code> · JWT required. Realtime messaging uses Socket.IO (see <Link href="/docs/api/chat">Chat docs</Link>).</p>
      <DocTable
        headers={['Method', 'Path']}
        rows={[
          ['GET', '/chat/rooms?academicYearId='],
          ['GET', '/chat/rooms/:roomId/messages'],
          ['PATCH', '/chat/messages/:messageId'],
          ['DELETE', '/chat/messages/:messageId'],
          ['POST', '/chat/devices'],
          ['DELETE', '/chat/devices'],
        ]}
      />

      <h2>Upload & files</h2>
      <p>Mount: <code>/api</code> · POST requires auth + upload permission; GET serving is public for img tags.</p>
      <DocTable
        headers={['Method', 'Path']}
        rows={[
          ['POST', '/api/upload'],
          ['GET', '/api/uploads'],
          ['GET', '/api/uploads/:id'],
          ['GET', '/api/uploads/:id/meta'],
          ['PUT', '/api/uploads/:id/rename'],
          ['DELETE', '/api/uploads/:id'],
        ]}
      />
      <p>Legacy dev static files: <code>GET /uploads/*</code> when R2 is not configured.</p>

      <DocCallout variant="info" title="Response shape">
        Most routes return <code>{`{ success: true, data: … }`}</code>. Errors use <code>success: false</code>{' '}
        with an HTTP status and <code>message</code>.
      </DocCallout>

      <p>
        Next: <Link href="/docs/api/chat">Chat & Realtime</Link>
      </p>
    </DocsShell>
  );
}
