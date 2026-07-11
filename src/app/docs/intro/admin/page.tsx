import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { introNav } from '@/lib/docs/navigation';

export default function AdminIntroPage() {
  return (
    <DocsShell
      title="Admin Portal"
      subtitle="Day-to-day school operations — students, fees, attendance, results, expenses, and staff."
      nav={introNav}
      variant="intro"
    >
      <p>
        The admin portal is the main ERP surface for branch administrators and permitted management
        staff. Select your <strong>branch</strong> and <strong>academic year</strong> from the
        sidebar before working in any module — most data is scoped to those choices.
      </p>

      <h2>Core modules</h2>
      <ul>
        <li><Link href="/docs/intro/admin/students">Students</Link> — enroll, search, and manage student profiles</li>
        <li><Link href="/docs/intro/admin/classes">Classes / Sections</Link> — class groups, sections, and subject links</li>
        <li><Link href="/docs/intro/admin/fees">Fees</Link> — structures, collections, families, reports, analytics</li>
        <li><Link href="/docs/intro/admin/attendance">Attendance</Link> — students, teachers, staff, and reports</li>
        <li><Link href="/docs/intro/admin/result">Result & Exams</Link> — sessions, marks, report cards, analytics</li>
        <li><Link href="/docs/intro/admin/expenses">Payments (Expenses)</Link> — payroll, utilities, vouchers, exports</li>
        <li><Link href="/docs/intro/admin/stationary">Stationary</Link> — products, inventory, fee-linked sales</li>
        <li><Link href="/docs/intro/admin/canteen">Canteen</Link> — sales, credit accounts, inventory</li>
        <li><Link href="/docs/intro/admin/timetable">Timetable</Link> — weekly grids and exam datesheets</li>
        <li><Link href="/docs/intro/admin/teachers">Teachers</Link> — hire, assign, and manage teaching staff</li>
        <li><Link href="/docs/intro/admin/staff">Staff</Link> — management workers and module permissions</li>
        <li><Link href="/docs/intro/admin/settings">Settings</Link> — academic years, subjects, archives</li>
        <li><Link href="/docs/intro/admin/branches">Branches</Link> — campus list and branch details (multi-branch admins)</li>
      </ul>

      <h2>Getting oriented</h2>
      <p>
        Use the <strong>?</strong> help icon in the admin header on any screen to jump to the guide
        for that module. Restricted staff see only the modules their admin assigned — see{' '}
        <Link href="/docs/intro/admin/permissions">Permissions & Staff Roles</Link>.
      </p>

      <h2>Archived academic years</h2>
      <p>
        When the active year is <em>archived</em>, most write actions are blocked unless you have
        special archived-year permissions. You can usually still view reports and historical
        records with read access.
      </p>
    </DocsShell>
  );
}
