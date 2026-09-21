import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocCodeBlock, DocSection, DocTable } from '@/components/docs/doc-blocks';
import { apiNav } from '@/lib/docs/navigation';

const pre = 'overflow-x-auto rounded-lg border border-warm-card-border bg-warm-card p-4 text-xs leading-relaxed text-warm-cream';

export default function ApiAttendancePage() {
  return (
    <DocsShell
      title="Attendance"
      subtitle="Student, teacher, and staff attendance — marking, notifications, and reporting."
      nav={apiNav}
      variant="api"
    >
      <h2>Overview</h2>
      <p>
        The attendance system tracks student, teacher, and staff presence. It supports batch operations,
        configurable marking permissions, and generates notifications for absent records.
      </p>

      <DocTable
        headers={['Model', 'Scope', 'Who marks']}
        rows={[
          ['Attendance', 'Students', 'Teachers (class teacher or appointed)'],
          ['TeacherAttendance', 'Teachers', 'Admin or branch admin'],
          ['StaffAttendance', 'Staff', 'Admin or branch admin'],
        ]}
      />

      <DocSection title="Student attendance">
        <h3>Status values</h3>
        <DocTable
          headers={['Status', 'Meaning', 'Notification']}
        rows={[
          ['present', 'Student is present', 'No'],
          ['absent', 'Student is absent', 'Yes — push to parent contacts'],
          ['late', 'Student arrived late', 'No'],
          ['leave', 'Student on approved leave', 'No'],
          ['function', 'Student at school function', 'No'],
        ]}
      />

        <h3>Attendance record</h3>
        <DocCodeBlock>{`// Attendance model
{
  "id": "att-uuid",
  "studentId": "student-uuid",
  "groupId": "group-uuid",
  "date": "2026-03-15",
  "status": "present",        // present | absent | late | leave | function
  "markedBy": "teacher-uuid",
  "branchId": "branch-uuid",
  "academicYearId": "ay-uuid",
  "remarks": "optional note"
}`}</DocCodeBlock>
      </DocSection>

      <DocSection title="Teacher attendance">
        <DocCodeBlock>{`// TeacherAttendance model
{
  "id": "ta-uuid",
  "teacherId": "teacher-uuid",
  "date": "2026-03-15",
  "status": "present",
  "markedBy": "admin-uuid",
  "branchId": "branch-uuid",
  "checkIn": "08:55:00",
  "checkOut": "16:05:00"
}`}</DocCodeBlock>
        <DocCallout variant="info" title="Teacher marking">
          Teachers cannot mark their own attendance. Only admins or branch admins can mark teacher
          attendance.
        </DocCallout>
      </DocSection>

      <DocSection title="Staff attendance">
        <DocCodeBlock>{`// StaffAttendance model
{
  "id": "sa-uuid",
  "staffId": "staff-uuid",
  "date": "2026-03-15",
  "status": "present",
  "markedBy": "admin-uuid",
  "branchId": "branch-uuid",
  "checkIn": "09:00:00",
  "checkOut": "17:00:00"
}`}</DocCodeBlock>
      </DocSection>

      <DocSection title="Batch operations">
        <p>
          Attendance can be marked for an entire class in a single request. The batch endpoint accepts
          an array of student statuses and processes them atomically.
        </p>
        <DocCodeBlock>{`POST /teacher/attendance/batch
Content-Type: application/json

{
  "date": "2026-03-15",
  "groupId": "group-uuid",
  "academicYearId": "ay-uuid",
  "records": [
    { "studentId": "uuid-1", "status": "present" },
    { "studentId": "uuid-2", "status": "absent" },
    { "studentId": "uuid-3", "status": "late", "remarks": "Traffic jam" },
    { "studentId": "uuid-4", "status": "leave" }
  ]
}

Response 200:
{
  "success": true,
  "data": {
    "marked": 4,
    "absent": 1,
    "notificationsQueued": 1
  }
}`}</DocCodeBlock>
        <DocCallout variant="tip" title="Idempotent">
          Marking attendance for the same student on the same date updates the existing record rather
          than creating a duplicate.
        </DocCallout>
      </DocSection>

      <DocSection title="Absent notification behavior">
        <p>
          When a student is marked absent, the system generates a notification for the student's parent
          contacts. Notifications are sent via the standard notification pipeline.
        </p>
        <DocCodeBlock>{`// Absent notification flow
1. Teacher marks student as "absent"
2. Backend creates Attendance record
3. NotificationService.withEventLock(
     'attendance',
     studentId,
     async () => {
       // Create system notification
       // Determine parent recipients
       // Enqueue FCM push for each parent device
     }
   );
4. Push delivered to parent mobile devices`}</DocCodeBlock>
        <DocCallout variant="warn" title="Only absent triggers push">
          Present, late, leave, and function statuses do not generate push notifications. Only absent
          records trigger the notification pipeline.
        </DocCallout>
      </DocSection>

      <DocSection title="Branch settings">
        <p>
          Branch-level settings control attendance behavior:
        </p>
        <DocTable
          headers={['Setting', 'Effect']}
          rows={[
            ['teachersCanMarkAttendance', 'When true, class teachers can mark student attendance for their classes'],
            ['attendanceNotificationEnabled', 'When false, suppresses absent notifications for this branch'],
            ['attendanceLockDays', 'Number of days after which attendance cannot be modified'],
          ]}
        />
        <DocCodeBlock>{`// GET /admin/branches/:branchId/attendance-settings
{
  "success": true,
  "data": {
    "teachersCanMarkAttendance": true,
    "attendanceNotificationEnabled": true,
    "attendanceLockDays": 7
  }
}`}</DocCodeBlock>
      </DocSection>

      <DocSection title="Teacher portal marking">
        <p>
          Teachers mark attendance for their assigned classes through the teacher portal. The portal
          only shows classes where the teacher is the class teacher or has been appointed for attendance.
        </p>
        <DocCodeBlock>{`// GET /teacher/attendance/classes
Response 200:
{
  "success": true,
  "data": [
    {
      "groupId": "group-uuid",
      "groupName": "Grade 8A",
      "totalStudents": 45,
      "todayStatus": "not_marked"  // or "marked" with summary
    },
    ...
  ]
}

// POST /teacher/attendance/batch
// (as shown in Batch Operations section)`}</DocCodeBlock>
      </DocSection>

      <DocSection title="Reporting">
        <p>
          Attendance reports can be generated per student, class, or branch. Reports show daily,
          weekly, and monthly attendance percentages.
        </p>
        <DocCodeBlock>{`// GET /admin/attendance/report?branchId=&startDate=&endDate=&groupId=
Response 200:
{
  "success": true,
  "data": {
    "summary": {
      "totalDays": 22,
      "present": 20,
      "absent": 1,
      "late": 1,
      "percentage": 95.45
    },
    "daily": [
      { "date": "2026-03-01", "present": 43, "absent": 2 },
      ...
    ]
  }
}`}</DocCodeBlock>
      </DocSection>

      <DocCallout variant="info" title="Socket realtime">
        Attendance updates are broadcast via Socket.IO to connected clients in the same branch. Admin
        dashboards update in realtime when teachers mark attendance.
      </DocCallout>

      <p>
        Next: <Link href="/docs/api/database">Database</Link> ·{' '}
        <Link href="/docs/api/notifications">Notifications</Link>
      </p>
    </DocsShell>
  );
}
