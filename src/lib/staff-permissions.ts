export type CrudAction = 'create' | 'read' | 'update' | 'delete';

export type StaffModuleKey =
  | 'STUDENTS'
  | 'OPERATIONS'
  | 'TIMETABLE'
  | 'ATTENDANCE'
  | 'FEES'
  | 'RESULT'
  | 'CANTEEN';

export type ModulePermission = {
  module: StaffModuleKey;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

export type StaffAccess = {
  branchId: string;
  isRestricted: boolean;
  isFullAdmin: boolean;
  permissions: ModulePermission[];
};

export const STAFF_MODULES: Array<{
  key: StaffModuleKey;
  label: string;
  path: string;
}> = [
  { key: 'STUDENTS', label: 'Students', path: '/admin/students' },
  { key: 'OPERATIONS', label: 'Operations', path: '/admin/students/operations' },
  { key: 'TIMETABLE', label: 'Timetable', path: '/admin/timetable' },
  { key: 'ATTENDANCE', label: 'Attendance', path: '/admin/attendance' },
  { key: 'FEES', label: 'Fees', path: '/admin/fees' },
  { key: 'RESULT', label: 'Result & Grade', path: '/admin/result' },
  { key: 'CANTEEN', label: 'Canteen', path: '/admin/canteen' },
];

export function moduleLabel(key: StaffModuleKey): string {
  return STAFF_MODULES.find((m) => m.key === key)?.label ?? key;
}

export function moduleDefaultPath(key: StaffModuleKey, permissions: ModulePermission[]): string {
  if (key === 'CANTEEN') {
    const c = permissions.find((p) => p.module === 'CANTEEN');
    if (c && !c.canUpdate && !c.canDelete) return '/admin/canteen/sales';
    return '/admin/canteen';
  }
  return STAFF_MODULES.find((m) => m.key === key)?.path ?? '/admin';
}

export function allowedModules(access: StaffAccess | null): ModulePermission[] {
  if (!access?.isRestricted) return [];
  return access.permissions.filter((p) => p.canRead);
}

export function pathnameAllowed(pathname: string, access: StaffAccess | null): boolean {
  if (!access?.isRestricted) return true;

  const allowed = allowedModules(access);
  if (!allowed.length) return false;

  for (const p of allowed) {
    const base = moduleDefaultPath(p.module, access.permissions);
    if (pathname === base || pathname.startsWith(`${base}/`)) return true;
    if (p.module === 'STUDENTS' && pathname.startsWith('/admin/students') && !pathname.startsWith('/admin/students/operations')) {
      return true;
    }
    if (p.module === 'OPERATIONS' && pathname.startsWith('/admin/students/operations')) return true;
    if (p.module === 'FEES' && (pathname.startsWith('/admin/fees') || pathname.startsWith('/admin/payments'))) return true;
    if (p.module === 'RESULT' && (pathname.startsWith('/admin/result') || pathname.startsWith('/admin/exam-sessions'))) return true;
    if (p.module === 'CANTEEN' && pathname.startsWith('/admin/canteen')) return true;
  }
  return false;
}

export function firstAllowedPath(access: StaffAccess): string {
  const mods = allowedModules(access);
  if (!mods.length) return '/login';
  return moduleDefaultPath(mods[0].module, access.permissions);
}

export function canCrud(
  access: StaffAccess | null,
  module: StaffModuleKey,
  action: CrudAction,
): boolean {
  if (!access?.isRestricted) return true;
  const row = access.permissions.find((p) => p.module === module);
  if (!row) return false;
  if (action === 'read') return row.canRead;
  if (action === 'create') return row.canCreate;
  if (action === 'update') return row.canUpdate;
  if (action === 'delete') return row.canDelete;
  return false;
}

export const EMPTY_PERMISSION_ROW = (module: StaffModuleKey): ModulePermission => ({
  module,
  canCreate: false,
  canRead: true,
  canUpdate: false,
  canDelete: false,
});
