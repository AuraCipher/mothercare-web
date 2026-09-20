import { describe, expect, it } from 'vitest';

import {
  isAdminPortalAllowedForRole,
  type StaffAccess,
} from '@/lib/staff-permissions';

function access(overrides: Partial<StaffAccess>): StaffAccess {
  return {
    branchId: 'b1',
    isRestricted: false,
    isFullAdmin: false,
    permissions: [],
    ...overrides,
  };
}

describe('M10 Admin Portal UI boundary', () => {
  it('allows branch administrators (full admin)', () => {
    expect(isAdminPortalAllowedForRole('management', access({ isFullAdmin: true }))).toBe(true);
  });

  it('allows module-scoped staff (restricted shell, not full nav)', () => {
    expect(
      isAdminPortalAllowedForRole(
        'management',
        access({ isRestricted: true, permissions: [{ module: 'FEES', canCreate: false, canRead: true, canUpdate: false, canDelete: false }] }),
      ),
    ).toBe(true);
  });

  it('denies legacy-unrestricted plain management (no admin membership, no rows)', () => {
    expect(isAdminPortalAllowedForRole('management', access({}))).toBe(false);
  });

  it('denies teacher/student/parent regardless of access flags', () => {
    const full = access({ isFullAdmin: true });
    expect(isAdminPortalAllowedForRole('teacher', full)).toBe(false);
    expect(isAdminPortalAllowedForRole('student', full)).toBe(false);
    expect(isAdminPortalAllowedForRole('parent', full)).toBe(false);
  });

  it('never locks out on unloaded permissions (fail-open while loading)', () => {
    expect(isAdminPortalAllowedForRole('management', null)).toBe(true);
  });

  it('allows super_admin at predicate level (routed to /ceo elsewhere)', () => {
    expect(isAdminPortalAllowedForRole('super_admin', access({ isFullAdmin: true }))).toBe(true);
  });
});
