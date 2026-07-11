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

export default function AdminAttendancePage() {
  return (
    <DocsShell
      title="Attendance Dashboard"
      subtitle="Organization-wide attendance overview, trends, and quick navigation to marking screens."
      nav={introNav}
      variant="intro"
    >
      <DocSection title="Overview">
        <p>
          The <strong>Attendance Dashboard</strong> at <code>/admin/attendance</code> is the hub for daily
          attendance operations. It shows present/absent/late statistics, trend charts, class breakdowns,
          lowest-attendance students, and quick links to mark student, teacher, and staff attendance or
          generate reports.
        </p>
        <p>
          <strong>Who uses it:</strong> branch admins and restricted staff with <strong>Attendance → Read</strong>.
          Marking requires <strong>Create</strong> on the sub-pages.
        </p>
      </DocSection>

      <DocSection title="Before you start">
        <ul>
          <li><strong>Branch + academic year</strong> selected in sidebar.</li>
          <li><strong>Students enrolled</strong> in sections for student stats.</li>
          <li><strong>Teachers and staff</strong> active on branch for staff panels.</li>
        </ul>
      </DocSection>

      <DocSection title="Quick-action cards">
        <DocTable
          headers={['Card', 'Description', 'Route']}
          rows={[
            ['Student Attendance', 'Mark and view student attendance', '/admin/attendance/students'],
            ['Teacher Attendance', 'Mark and view teacher attendance', '/admin/attendance/teachers'],
            ['Staff Attendance', 'Workers, cleaners, and office staff', '/admin/attendance/staff'],
            ['Reports', 'Generate monthly & term reports (PDF)', '/admin/attendance/reports'],
            ['Today Snapshot', '{N} active students — from stats', '/admin/attendance/students'],
          ]}
        />
      </DocSection>

      <DocSection title="Dashboard filters">
        <DocTable
          headers={['Control', 'Options']}
          rows={[
            ['Class', 'All Classes + {name} — {section} per section'],
            ['Period', 'Daily, Weekly, Monthly, Full AY, Custom button group'],
            ['Custom range', 'From date — to date (when Custom selected)'],
          ]}
        />
      </DocSection>

      <DocSection title="Dashboard panels">
        <DocTable
          headers={['Panel', 'Content']}
          rows={[
            ['Period attendance %', 'Large % + progress bar; legend P, A, L, Lv, Hd, F'],
            ['Status Breakdown', 'Donut chart — Present, Absent, Late, Leave, Half-Day, Function'],
            ['Filter banner', 'When legend clicked: Showing students with {status} · {N} students + ✕ Clear'],
            ['Attendance Distribution', 'Histogram bins 0–10% … 90–100%'],
            ['Attendance Trend', 'SVG line chart + Refresh button'],
            ['By Class', 'Per-section % with P/A/L/Lv counts'],
            ['Lowest Attendance', 'Top 10 students by lowest %'],
            ['System Overview', 'Students, Teachers, Classes, Users counts'],
          ]}
        />
      </DocSection>

      <DocSection title="Attendance status values">
        <p>Shared across all marking pages:</p>
        <DocTable
          headers={['Status', 'Day badge', 'Grid abbrev', 'Counts as present %']}
          rows={[
            ['unmarked', '— Not Marked', '·', 'No'],
            ['present', '✓ Present', 'P', 'Yes'],
            ['absent', '✗ Absent', 'A', 'No'],
            ['late', '⏳ Late', 'L', 'No'],
            ['leave', '✈ Leave', 'Lv', 'No'],
            ['half-day', 'Half-Day', 'Hd', 'No'],
            ['holiday', 'Holiday', 'H', 'Yes (+ auto Sundays)'],
            ['function', 'Function', 'F', 'No'],
          ]}
        />
        <p>
          <strong>Toggle cycle</strong> (click badge): unmarked → present → absent → late → leave → half-day →
          function → present. Color thresholds: ≥80% green, ≥70% yellow, &lt;70% red.
        </p>
      </DocSection>

      <DocSection title="Step-by-step: morning attendance routine">
        <DocSteps>
          <DocStep title="Check dashboard">
            Open Attendance Dashboard. Review Today / This Week % and Lowest Attendance list.
          </DocStep>
          <DocStep title="Mark students">
            Click <strong>Student Attendance</strong>. Select class, today&apos;s date, Day view. Bulk{' '}
            <strong>All Present</strong> then adjust absences. <strong>Save</strong>.
          </DocStep>
          <DocStep title="Mark teachers and staff">
            Repeat on Teacher and Staff pages (no class filter required).
          </DocStep>
          <DocStep title="Follow up">
            Use Reports for absentee lists or parent notification (absent/late/leave triggers backend
            notification queue).
          </DocStep>
        </DocSteps>
      </DocSection>

      <DocSection title="Edit lock rules (marking pages)">
        <DocTable
          headers={['Rule', 'Save button label']}
          rows={[
            ['Date > 7 days ago', 'Locked'],
            ['Date in future', 'Future Date'],
            ['Week/Month/Year view', 'Read Only'],
            ['Students: no class selected', 'Select a Class'],
            ['Saving in progress', 'Saving...'],
          ]}
        />
        <DocCallout variant="warn" title="Client-side lock only">
          The 7-day edit lock is enforced in the browser. Backend validates AY date range and no future dates,
          but not the 7-day window.
        </DocCallout>
      </DocSection>

      <DocSection title="Permission matrix">
        <DocTable
          headers={['Action', 'Module', 'Read', 'Create', 'Update']}
          rows={[
            ['View dashboard', 'ATTENDANCE', '✓', '—', '—'],
            ['Mark attendance', 'ATTENDANCE', '✓', '✓', '✓ (batch upsert)'],
            ['Generate reports', 'ATTENDANCE', '✓', '—', '—'],
            ['Student detail attendance', 'STUDENTS (GET)', '✓', '—', '—'],
          ]}
        />
        <p>
          Restricted staff: archived year uses <em>archivedCanCreate</em> for batch saves. Nav requires{' '}
          <em>archivedCanRead</em> to see archived years in switcher.
        </p>
      </DocSection>

      <DocSection title="Archived academic year">
        <p>
          Dashboard loads read-only historical data for archived AY. Sidebar shows <em>(Archived)</em> or{' '}
          <em>(Read only)</em>. Marking pages hide effective writes when backend returns 403. Full AY chart
          uses fixed Aug–Jun months — not dynamically read from AY calendar.
        </p>
      </DocSection>

      <DocSection title="What happens when">
        <DocTable
          headers={['Event', 'Effect']}
          rows={[
            ['Dashboard load', 'GET /admin/stats + GET sections + GET attendance (trend range)'],
            ['Donut legend click', 'Filters distribution/class/absentee panels by status'],
            ['Student Save', 'POST /admin/attendance/batch — queues parent notifications for absent/late/leave'],
            ['Teacher/Staff Save', 'POST teachers/batch or staff/batch — teacher notification'],
            ['Mark Holiday', 'Immediate batch — all students/teachers/staff → holiday status'],
            ['Payroll link', 'Teacher/staff attendance feeds payroll calculations in Expenses module'],
          ]}
        />
      </DocSection>

      <DocSection title="Troubleshooting">
        <DocFaq
          items={[
            {
              q: 'Dashboard shows 0% for all periods',
              a: 'No attendance marked yet, or wrong class filter. Mark today on Students page first.',
            },
            {
              q: 'Full AY range looks wrong',
              a: 'Hardcoded Aug 2025 – Jun 2026 in code — may not match your AY calendar dates.',
            },
            {
              q: 'Cannot save — Locked',
              a: 'Date older than 7 days. Contact admin for correction or use student detail page.',
            },
            {
              q: 'Save button works but API 403',
              a: 'Restricted staff lacks Create on archived year, or wrong branch scope.',
            },
            {
              q: 'Staff page says "Teacher" in labels',
              a: 'Known UI copy issue on staff page — functionality is for non-teacher staff roles.',
            },
            {
              q: 'Trend chart flat line',
              a: 'Daily period on dashboard uses last 7 days — switch to Weekly or Monthly for smoother trend.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Period chart behavior">
        <DocTable
          headers={['Period', 'Date range used']}
          rows={[
            ['Daily', 'Last 7 days'],
            ['Weekly', 'Last 35 days'],
            ['Monthly', '1st of current month → today'],
            ['Full AY', 'Aug 2025 – Jun 2026 (hardcoded)'],
            ['Custom', 'User from/to; if over 60 days, aggregates by month'],
          ]}
        />
      </DocSection>

      <DocSection title="Using donut filter">
        <p>
          Click a segment in <strong>Status Breakdown</strong> (Present, Absent, etc.) to filter downstream
          panels. Banner shows <em>Showing students with [status] status</em> with <strong>✕ Clear</strong>.
          Useful for spotting which students drive absentee spikes.
        </p>
      </DocSection>

      <DocSection title="System Overview panel">
        <p>
          <strong>System Overview</strong> shows Students, Teachers, Classes, Users counts from GET /admin/stats —
          cross-check against <Link href="/docs/intro/admin">Admin Dashboard</Link> if numbers disagree (stale cache).
        </p>
      </DocSection>

      <DocSection title="Quick reference — marking pages">
        <DocTable
          headers={['Audience', 'Path']}
          rows={[
            ['Students', '/admin/attendance/students'],
            ['Teachers', '/admin/attendance/teachers'],
            ['Staff', '/admin/attendance/staff'],
            ['Reports', '/admin/attendance/reports'],
          ]}
        />
      </DocSection>

      <DocSection title="Related guides">
        <ul>
          <li><Link href="/docs/intro/admin/attendance/students">Student Attendance</Link></li>
          <li><Link href="/docs/intro/admin/attendance/teachers">Teacher Attendance</Link></li>
          <li><Link href="/docs/intro/admin/attendance/staff">Staff Attendance</Link></li>
          <li><Link href="/docs/intro/admin/attendance/reports">Attendance Reports</Link></li>
          <li><Link href="/docs/intro/admin/expenses/payroll">Payroll</Link> — attendance-linked pay</li>
        </ul>
      </DocSection>
    </DocsShell>
  );
}
