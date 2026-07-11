/** Maps app routes to contextual user-guide doc paths for the ? help icon. */
export function docsPathForAppRoute(pathname: string): string | null {
  const rules: Array<[RegExp, string]> = [
    // CEO portal
    [/^\/ceo$/, '/docs/intro/ceo/dashboard'],
    [/^\/ceo\/branches\/[^/]+$/, '/docs/intro/ceo/branches/details'],
    [/^\/ceo\/branches/, '/docs/intro/ceo/branches'],
    [/^\/ceo\/admins\/invite/, '/docs/intro/ceo/admins/invite'],
    [/^\/ceo\/admins\/[^/]+$/, '/docs/intro/ceo/admins/profile'],
    [/^\/ceo\/admins/, '/docs/intro/ceo/admins'],
    [/^\/ceo\/keys/, '/docs/intro/ceo/api-keys'],
    [/^\/ceo/, '/docs/intro/ceo'],

    // Admin — fees (specific before general)
    [/^\/admin\/fees\/collections/, '/docs/intro/admin/fees/collections'],
    [/^\/admin\/fees\/structures/, '/docs/intro/admin/fees/structures'],
    [/^\/admin\/fees\/families/, '/docs/intro/admin/fees/families'],
    [/^\/admin\/fees\/reports/, '/docs/intro/admin/fees/reports'],
    [/^\/admin\/fees\/analytics/, '/docs/intro/admin/fees/analytics'],
    [/^\/admin\/fees/, '/docs/intro/admin/fees'],

    // Admin — attendance
    [/^\/admin\/attendance\/students/, '/docs/intro/admin/attendance/students'],
    [/^\/admin\/attendance\/teachers/, '/docs/intro/admin/attendance/teachers'],
    [/^\/admin\/attendance\/staff/, '/docs/intro/admin/attendance/staff'],
    [/^\/admin\/attendance\/reports/, '/docs/intro/admin/attendance/reports'],
    [/^\/admin\/attendance/, '/docs/intro/admin/attendance'],

    // Admin — result & exams
    [/^\/admin\/result\/sessions\/[^/]+\/exams/, '/docs/intro/admin/result/marks'],
    [/^\/admin\/result\/sessions/, '/docs/intro/admin/result/sessions'],
    [/^\/admin\/result\/report-cards/, '/docs/intro/admin/result/report-cards'],
    [/^\/admin\/result\/compute/, '/docs/intro/admin/result/compute'],
    [/^\/admin\/result\/analytics/, '/docs/intro/admin/result/analytics'],
    [/^\/admin\/result/, '/docs/intro/admin/result'],

    // Admin — expenses (payments)
    [/^\/admin\/expenses\/payroll/, '/docs/intro/admin/expenses/payroll'],
    [/^\/admin\/expenses\/utilities/, '/docs/intro/admin/expenses/utilities'],
    [/^\/admin\/expenses\/others/, '/docs/intro/admin/expenses/others'],
    [/^\/admin\/expenses\/vouchers/, '/docs/intro/admin/expenses/vouchers'],
    [/^\/admin\/expenses\/reports/, '/docs/intro/admin/expenses/reports'],
    [/^\/admin\/expenses/, '/docs/intro/admin/expenses'],

    // Admin — other modules
    [/^\/admin\/students/, '/docs/intro/admin/students'],
    [/^\/admin\/classes/, '/docs/intro/admin/classes'],
    [/^\/admin\/stationary/, '/docs/intro/admin/stationary'],
    [/^\/admin\/canteen/, '/docs/intro/admin/canteen'],
    [/^\/admin\/timetable/, '/docs/intro/admin/timetable'],
    [/^\/admin\/teachers/, '/docs/intro/admin/teachers'],
    [/^\/admin\/staff/, '/docs/intro/admin/staff'],
    [/^\/admin\/settings/, '/docs/intro/admin/settings'],
    [/^\/admin\/branches/, '/docs/intro/admin/branches'],
    [/^\/admin/, '/docs/intro/admin'],

    // Other portals
    [/^\/teacher/, '/docs/intro/teacher'],
    [/^\/student/, '/docs/intro/student'],
    [/^\/login/, '/docs/intro/get-started'],
  ];

  for (const [pattern, href] of rules) {
    if (pattern.test(pathname)) return href;
  }
  return null;
}
