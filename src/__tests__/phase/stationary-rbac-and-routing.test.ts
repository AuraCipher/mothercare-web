import { describe, expect, test } from 'vitest';
import {
  STAFF_MODULES,
  moduleForPathname,
  pathnameAllowed,
  type StaffAccess,
} from '@/lib/staff-permissions';

describe('Stationary frontend RBAC', () => {
  test('exposes stationary module in matrix list', () => {
    expect(STAFF_MODULES.some((m) => m.key === 'STATIONARY')).toBe(true);
  });

  test('resolves stationary pathname to module key', () => {
    expect(moduleForPathname('/admin/stationary')).toBe('STATIONARY');
    expect(moduleForPathname('/admin/stationary/products')).toBe('STATIONARY');
  });

  test('restricted access allows stationary and blocks unrelated routes', () => {
    const access: StaffAccess = {
      branchId: 'b1',
      isRestricted: true,
      isFullAdmin: false,
      permissions: [{
        module: 'STATIONARY',
        canCreate: true,
        canRead: true,
        canUpdate: true,
        canDelete: false,
      }],
    };
    expect(pathnameAllowed('/admin/stationary/products', access)).toBe(true);
    expect(pathnameAllowed('/admin/fees', access)).toBe(false);
  });
});
