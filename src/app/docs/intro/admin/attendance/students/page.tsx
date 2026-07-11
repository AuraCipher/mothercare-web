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

export default function AdminAttendanceStudentsPage() {
  return (
    <DocsShell
      title="Student Attendance"
      subtitle="Mark daily attendance by class, view week/month/year grids, and open student detail."
      nav={introNav}
      variant="intro"
    >
      <DocSection title="Overview">
        <p>
          <strong>Student Attendance</strong> at <code>/admin/attendance/students</code> is the primary screen
          for marking daily student presence. Select a class and date, toggle statuses per student or use bulk
          buttons, then <strong>Save</strong>. Week, Month, and Year views provide read-only attendance grids
          and percentage summaries.
        </p>
        <p>Page title: <strong>Attendance</strong> (H1).</p>
      </DocSection>

      <DocSection title="Before you start">
        <ul>
          <li><strong>Branch + academic year</strong> selected.</li>
          <li><strong>Class selected</strong> — required to mark and save (not required for read-only browse with All Students).</li>
          <li><strong>Day view</strong> — only view mode that allows saving.</li>
        </ul>
      </DocSection>

      <DocSection title="Filters and controls">
        <DocTable
          headers={['Control', 'Label / placeholder']}
          rows={[
            ['Class', '— All Students — + section options'],
            ['Search', 'Search student name or roll… (clear ✕)'],
            ['Date', 'date input + ChevronLeft/Right; Today link when not today'],
            ['View mode', 'Day, Week, Month, Year buttons'],
            ['Status filter', 'All, Present, Absent, Late, Leave, Half-Day, Function + {N} student(s) (day only)'],
          ]}
        />
      </DocSection>

      <DocSection title="Bulk action buttons (day view + class selected)">
        <ul>
          <li><strong>All Present</strong></li>
          <li><strong>All Absent</strong></li>
          <li><strong>All Late</strong></li>
          <li><strong>All Leave</strong></li>
          <li><strong>All Half-Day</strong></li>
          <li><strong>All Function</strong></li>
          <li><strong>Mark Holiday</strong> — saves immediately via API (no separate Save)</li>
        </ul>
      </DocSection>

      <DocSection title="Save button states">
        <DocTable
          headers={['Label', 'Condition']}
          rows={[
            ['Select a Class', 'No groupId selected'],
            ['Read Only', 'Week, Month, or Year view'],
            ['Future Date', 'Selected date after today'],
            ['Locked', 'Date more than 7 days ago'],
            ['Saving...', 'Request in flight'],
            ['Save', 'Ready to submit batch'],
          ]}
        />
      </DocSection>

      <DocSection title="Day view table">
        <DocTable
          headers={['Column', 'Content', 'Interaction']}
          rows={[
            ['#', 'Row number', '—'],
            ['Roll', 'Roll or —', '—'],
            ['Student Name', 'Name + admission # · class', 'Click → /admin/attendance/student/[id]'],
            ['Status', 'Badge (✓ Present, ✗ Absent, etc.)', 'Click toggles if class selected'],
          ]}
        />
        <p>
          Summary line shows counts: P, A, L, Lv, Hd, F, and pending (unmarked) per day view.
        </p>
        <p>Legend: Present · Absent · Late · Leave · Half-Day · Function · Holiday</p>
      </DocSection>

      <DocSection title="Week / Month / Year grids">
        <DocTable
          headers={['View', 'Columns']}
          rows={[
            ['Week', '#, Student, Mon…Sun, %, Sum'],
            ['Month', '#, Student, day numbers, %, Sum'],
            ['Year', '#, Student, Jan…Dec, %, Sum'],
          ]}
        />
        <p>
          <strong>Alphabet sidebar:</strong> A–Z jump buttons (fixed right). Empty: <em>No students in this class.</em>
        </p>
      </DocSection>

      <DocSection title="Step-by-step: mark today&apos;s class">
        <DocSteps>
          <DocStep title="Select class">
            Choose section from Class dropdown — e.g. Grade 5 — A.
          </DocStep>
          <DocStep title="Confirm date">
            Use <strong>Today</strong> or date picker. Ensure <strong>Day</strong> view is active.
          </DocStep>
          <DocStep title="Mark statuses">
            Click each student badge to cycle status, or use <strong>All Present</strong> then fix exceptions.
          </DocStep>
          <DocStep title="Save">
            Click <strong>Save</strong>. Toast confirms. POST /admin/attendance/batch with date, groupId,
            records[].
          </DocStep>
          <DocStep title="Optional: holiday">
            For school closure, click <strong>Mark Holiday</strong> — all students in class set to holiday
            immediately.
          </DocStep>
        </DocSteps>
      </DocSection>

      <DocSection title="Student detail page (linked)">
        <p>
          Route: <code>/admin/attendance/student/[id]</code>. Title: student name. <strong>Back</strong> button.
        </p>
        <DocTable
          headers={['Column', 'Interaction']}
          rows={[
            ['Date', 'Weekday formatted'],
            ['Status', 'Clickable button — cycle status'],
            ['Note / Reason', 'Text input when absent/late/leave — placeholder Enter reason…'],
          ]}
        />
        <p>
          <strong>Save Changes</strong> / <strong>Saving…</strong> — saves each changed day individually via
          batch API. Future dates show <em>Upcoming</em>. Uses student.groupId without requiring class filter on
          list page.
        </p>
      </DocSection>

      <DocSection title="Permission matrix">
        <DocTable
          headers={['Action', 'Permission']}
          rows={[
            ['View attendance grid', 'ATTENDANCE → Read'],
            ['Save batch / Mark Holiday', 'ATTENDANCE → Create (archivedCanCreate if archived)'],
            ['Student detail GET', 'STUDENTS → Read'],
            ['Student detail save', 'ATTENDANCE → Create'],
          ]}
        />
      </DocSection>

      <DocSection title="Archived academic year">
        <p>
          Historical data loads for archived AY. Backend enforces archived CRUD on POST. Client edit-lock still
          applies. Parent notifications still queue on absent/late/leave saves when allowed.
        </p>
      </DocSection>

      <DocSection title="What happens when">
        <DocTable
          headers={['Event', 'Effect']}
          rows={[
            ['Day load', 'GET /admin/attendance?date&groupId'],
            ['Range load', 'GET /admin/attendance?from&to&groupId'],
            ['Save', 'POST /admin/attendance/batch — upsert records; queueAttendanceStatusNotification for parents'],
            ['Mark Holiday', 'POST batch all students status holiday'],
            ['Click student name', 'Navigate to student detail — GET /admin/students/{id}/attendance'],
          ]}
        />
      </DocSection>

      <DocCallout variant="tip" title="Class required">
        Unlike teachers/staff pages, students require a class selection before Save works. Use All Students only
        for read-only searching.
      </DocCallout>

      <DocSection title="Troubleshooting">
        <DocFaq
          items={[
            {
              q: 'Save disabled — Select a Class',
              a: 'Pick a section from dropdown. All Students mode cannot save.',
            },
            {
              q: 'Status click does nothing',
              a: 'No class selected, or not in Day view.',
            },
            {
              q: 'Mark Holiday saved but Save still enabled',
              a: 'Holiday saves immediately; other changes still need Save if you edited after.',
            },
            {
              q: 'Notes not on list page',
              a: 'Notes only on student detail page for absent/late/leave.',
            },
            {
              q: '403 on Save',
              a: 'Check ATTENDANCE Create permission and archived year flags.',
            },
            {
              q: 'Student detail vs list save rules',
              a: 'Detail page saves per changed day without class filter; list page requires class for batch Save.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Parent notification trigger">
        <p>
          When you Save with absent, late, or leave statuses, backend queues{' '}
          <code>queueAttendanceStatusNotification</code> for parents. Present and holiday do not notify. Ensure
          parent phone numbers are on student profiles for delivery.
        </p>
      </DocSection>

      <DocSection title="Alphabet sidebar usage">
        <p>
          In Week/Month/Year views with long rosters, use A–Z jump buttons on the right edge to scroll quickly
          to a surname range.
        </p>
      </DocSection>

      <DocSection title="Quick reference">
        <p>Route: <code>/admin/attendance/students</code> · Save requires class + Day view · 7-day edit lock applies.</p>
        <p>Student detail: <code>/admin/attendance/student/[id]</code> for per-day notes on absences.</p>
        <p>Bulk buttons require a class selected in Day view before they affect the roster.</p>
        <p>Mark Holiday saves immediately without clicking Save.</p>
        <p>Status toggle cycle: unmarked → present → absent → late → leave → half-day → function → present.</p>
        <p>Module key: ATTENDANCE.</p>
      </DocSection>

      <DocSection title="Related guides">
        <ul>
          <li><Link href="/docs/intro/admin/attendance">Attendance Dashboard</Link></li>
          <li><Link href="/docs/intro/admin/attendance/reports">Reports</Link></li>
          <li><Link href="/docs/intro/admin/classes">Classes</Link></li>
        </ul>
      </DocSection>
    </DocsShell>
  );
}
