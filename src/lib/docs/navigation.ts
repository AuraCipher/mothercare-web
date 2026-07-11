export type DocsNavItem = {
  title: string;
  href: string;
  children?: DocsNavItem[];
};

export const introNav: DocsNavItem[] = [
  { title: 'Introduction', href: '/docs/intro' },
  { title: 'Get Started', href: '/docs/intro/get-started' },
  {
    title: 'CEO Portal',
    href: '/docs/intro/ceo',
    children: [
      { title: 'Overview', href: '/docs/intro/ceo' },
      { title: 'Dashboard', href: '/docs/intro/ceo/dashboard' },
      { title: 'Branches', href: '/docs/intro/ceo/branches' },
      { title: 'Create a Branch', href: '/docs/intro/ceo/branches/create' },
      { title: 'Branch Details', href: '/docs/intro/ceo/branches/details' },
      { title: 'Admins', href: '/docs/intro/ceo/admins' },
      { title: 'Invite Admin', href: '/docs/intro/ceo/admins/invite' },
      { title: 'Admin Profile', href: '/docs/intro/ceo/admins/profile' },
      { title: 'API Keys', href: '/docs/intro/ceo/api-keys' },
      { title: 'Permissions', href: '/docs/intro/ceo/permissions' },
    ],
  },
  {
    title: 'Admin Portal',
    href: '/docs/intro/admin',
    children: [
      { title: 'Overview', href: '/docs/intro/admin' },
      { title: 'Permissions & Staff Roles', href: '/docs/intro/admin/permissions' },
      { title: 'Students', href: '/docs/intro/admin/students' },
      { title: 'Classes', href: '/docs/intro/admin/classes' },
      {
        title: 'Fees',
        href: '/docs/intro/admin/fees',
        children: [
          { title: 'Overview', href: '/docs/intro/admin/fees' },
          { title: 'Collections', href: '/docs/intro/admin/fees/collections' },
          { title: 'Structures', href: '/docs/intro/admin/fees/structures' },
          { title: 'Families', href: '/docs/intro/admin/fees/families' },
          { title: 'Reports', href: '/docs/intro/admin/fees/reports' },
          { title: 'Analytics', href: '/docs/intro/admin/fees/analytics' },
        ],
      },
      {
        title: 'Attendance',
        href: '/docs/intro/admin/attendance',
        children: [
          { title: 'Overview', href: '/docs/intro/admin/attendance' },
          { title: 'Students', href: '/docs/intro/admin/attendance/students' },
          { title: 'Teachers', href: '/docs/intro/admin/attendance/teachers' },
          { title: 'Staff', href: '/docs/intro/admin/attendance/staff' },
          { title: 'Reports', href: '/docs/intro/admin/attendance/reports' },
        ],
      },
      {
        title: 'Result & Exams',
        href: '/docs/intro/admin/result',
        children: [
          { title: 'Overview', href: '/docs/intro/admin/result' },
          { title: 'Sessions', href: '/docs/intro/admin/result/sessions' },
          { title: 'Marks Entry', href: '/docs/intro/admin/result/marks' },
          { title: 'Report Cards', href: '/docs/intro/admin/result/report-cards' },
          { title: 'Compute', href: '/docs/intro/admin/result/compute' },
          { title: 'Analytics', href: '/docs/intro/admin/result/analytics' },
        ],
      },
      {
        title: 'Expenses',
        href: '/docs/intro/admin/expenses',
        children: [
          { title: 'Overview', href: '/docs/intro/admin/expenses' },
          { title: 'Payroll', href: '/docs/intro/admin/expenses/payroll' },
          { title: 'Utilities', href: '/docs/intro/admin/expenses/utilities' },
          { title: 'Others', href: '/docs/intro/admin/expenses/others' },
          { title: 'Vouchers', href: '/docs/intro/admin/expenses/vouchers' },
          { title: 'Reports', href: '/docs/intro/admin/expenses/reports' },
        ],
      },
      { title: 'Stationary', href: '/docs/intro/admin/stationary' },
      { title: 'Canteen', href: '/docs/intro/admin/canteen' },
      { title: 'Timetable', href: '/docs/intro/admin/timetable' },
      { title: 'Teachers', href: '/docs/intro/admin/teachers' },
      { title: 'Staff', href: '/docs/intro/admin/staff' },
      { title: 'Settings', href: '/docs/intro/admin/settings' },
      { title: 'Academic Years & Promotion', href: '/docs/intro/admin/academic-years' },
      { title: 'Branches', href: '/docs/intro/admin/branches' },
    ],
  },
  {
    title: 'Teacher Portal',
    href: '/docs/intro/teacher',
    children: [
      { title: 'Overview', href: '/docs/intro/teacher' },
      { title: 'Mobile App', href: '/docs/intro/teacher/mobile-app' },
      { title: 'Permissions', href: '/docs/intro/teacher/permissions' },
    ],
  },
  {
    title: 'Student Portal',
    href: '/docs/intro/student',
    children: [
      { title: 'Overview', href: '/docs/intro/student' },
      { title: 'Mobile App', href: '/docs/intro/student/mobile-app' },
    ],
  },
];

export const apiNav: DocsNavItem[] = [
  { title: 'Introduction', href: '/docs/api' },
  { title: 'Get Started', href: '/docs/api/get-started' },
  { title: 'Environment Variables', href: '/docs/api/environment' },
  { title: 'Architecture', href: '/docs/api/architecture' },
  { title: 'Authentication', href: '/docs/api/authentication' },
  { title: 'Academic Year & Promotion', href: '/docs/api/academic-year' },
  { title: 'Mobile Promotion Effects', href: '/docs/api/academic-year/mobile-effects' },
  { title: 'Email & Credentials', href: '/docs/api/email' },
  { title: 'REST Endpoints', href: '/docs/api/endpoints' },
  { title: 'Chat & Realtime', href: '/docs/api/chat' },
  { title: 'Deployment', href: '/docs/api/deployment' },
];
