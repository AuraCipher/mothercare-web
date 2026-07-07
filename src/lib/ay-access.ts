import type { StaffAccess } from './staff-permissions';
import { canAccessArchivedAy } from './staff-permissions';

export function filterAcademicYearsForAccess<T extends { status: string }>(
  years: T[],
  access: StaffAccess | null,
): T[] {
  if (!access?.isRestricted) return years;
  const allowed = new Set(access.accessibleAyStatuses ?? ['ACTIVE', 'BUILD_STAGE', 'ON_HOLD']);
  if (canAccessArchivedAy(access)) allowed.add('ARCHIVED');
  return years.filter((y) => allowed.has(y.status));
}

export function activeAyStatus(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('activeAYStatus');
}

export function isArchivedAySelected(): boolean {
  return activeAyStatus() === 'ARCHIVED';
}
