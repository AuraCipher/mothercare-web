export type CrudAction = 'create' | 'read' | 'update' | 'delete';

export type StaffModuleKey =
  | 'STUDENTS'
  | 'OPERATIONS'
  | 'TIMETABLE'
  | 'ATTENDANCE'
  | 'FEES'
  | 'RESULT'
  | 'CANTEEN'
  | 'STATIONARY'
  | 'EXPENSES'
  | 'DOCUMENTS';

export type ModulePermission = {
  module: StaffModuleKey;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  archivedCanRead?: boolean;
  archivedCanCreate?: boolean;
  archivedCanUpdate?: boolean;
  archivedCanDelete?: boolean;
};

export type StaffAccess = {
  branchId: string;
  isRestricted: boolean;
  isFullAdmin: boolean;
  permissions: ModulePermission[];
  accessibleAyStatuses?: string[];
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
  { key: 'STATIONARY', label: 'Stationary', path: '/admin/stationary' },
  { key: 'EXPENSES', label: 'Payments', path: '/admin/expenses' },
  { key: 'DOCUMENTS', label: 'Documents', path: '/admin' },
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
  return access.permissions.filter((p) => p.canRead && p.module !== 'DOCUMENTS');
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
    if (p.module === 'STATIONARY' && pathname.startsWith('/admin/stationary')) return true;
    if (p.module === 'EXPENSES' && pathname.startsWith('/admin/expenses')) return true;
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
  opts?: { archived?: boolean },
): boolean {
  if (!access?.isRestricted) return true;
  const row = access.permissions.find((p) => p.module === module);
  if (!row) return false;
  const archived = opts?.archived === true;
  if (archived) {
    if (!row.archivedCanRead) return false;
    if (action === 'read') return true;
    if (action === 'create') return !!row.archivedCanCreate;
    if (action === 'update') return !!row.archivedCanUpdate;
    if (action === 'delete') return !!row.archivedCanDelete;
    return false;
  }
  if (action === 'read') return row.canRead;
  if (action === 'create') return row.canCreate;
  if (action === 'update') return row.canUpdate;
  if (action === 'delete') return row.canDelete;
  return false;
}

export function canAccessArchivedAy(access: StaffAccess | null): boolean {
  if (!access?.isRestricted) return true;
  return access.permissions.some((p) => p.archivedCanRead);
}

export function moduleForPathname(pathname: string): StaffModuleKey | null {
  if (pathname.startsWith('/admin/students/operations')) return 'OPERATIONS';
  if (pathname.startsWith('/admin/students')) return 'STUDENTS';
  if (pathname.startsWith('/admin/timetable')) return 'TIMETABLE';
  if (pathname.startsWith('/admin/attendance')) return 'ATTENDANCE';
  if (pathname.startsWith('/admin/fees') || pathname.startsWith('/admin/payments')) return 'FEES';
  if (pathname.startsWith('/admin/result') || pathname.startsWith('/admin/exam-sessions')) return 'RESULT';
  if (pathname.startsWith('/admin/canteen')) return 'CANTEEN';
  if (pathname.startsWith('/admin/stationary')) return 'STATIONARY';
  if (pathname.startsWith('/admin/expenses')) return 'EXPENSES';
  return null;
}

export function isAyReadOnlyForPath(
  access: StaffAccess | null,
  pathname: string,
  ayStatus: string | null,
): boolean {
  if (!ayStatus || ayStatus !== 'ARCHIVED') return false;
  if (!access?.isRestricted) return false;
  const mod = moduleForPathname(pathname);
  if (!mod) return true;
  return !canCrud(access, mod, 'update', { archived: true })
    && !canCrud(access, mod, 'create', { archived: true })
    && !canCrud(access, mod, 'delete', { archived: true });
}

export const EMPTY_PERMISSION_ROW = (module: StaffModuleKey): ModulePermission => ({
  module,
  canCreate: false,
  canRead: module === 'DOCUMENTS' ? false : true,
  canUpdate: false,
  canDelete: false,
  archivedCanRead: false,
  archivedCanCreate: false,
  archivedCanUpdate: false,
  archivedCanDelete: false,
});

export const CREDENTIAL_TAG_LABELS: Record<string, string> = {
  CRED_NONE: 'No credential',
  CRED_CARRIED: 'Credential carried',
  CRED_NEW: 'New — send credential',
  CRED_RESEND: 'Resend credential',
  NO_LOGIN: 'No login',
};
