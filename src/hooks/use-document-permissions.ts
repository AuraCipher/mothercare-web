'use client';

import { useContext, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { AyPermissionsContext } from '@/hooks/use-ay-permissions';
import { resolveDocEntityFromPath, type DocEntityType } from '@/lib/doc-entity';
import { canCrud, type StaffModuleKey } from '@/lib/staff-permissions';

function parentModuleForEntity(entityType: DocEntityType): StaffModuleKey | null {
  switch (entityType) {
    case 'student':
      return 'STUDENTS';
    case 'canteen_supplier':
      return 'CANTEEN';
    case 'stationary_supplier':
      return 'STATIONARY';
    case 'teacher':
    case 'staff':
      return null;
    default:
      return null;
  }
}

export function useDocumentPermissions() {
  const { staffAccess } = useContext(AyPermissionsContext);
  const pathname = usePathname();
  const entity = useMemo(() => resolveDocEntityFromPath(pathname), [pathname]);

  const unrestricted = !staffAccess?.isRestricted;

  const canRead = unrestricted || canCrud(staffAccess, 'DOCUMENTS', 'read');
  const canCreate = unrestricted || canCrud(staffAccess, 'DOCUMENTS', 'create');
  const canUpdate = unrestricted || canCrud(staffAccess, 'DOCUMENTS', 'update');
  const canDelete = unrestricted || canCrud(staffAccess, 'DOCUMENTS', 'delete');

  const canAccessPage = useMemo(() => {
    if (!entity) return false;
    if (unrestricted) return true;
    if (!canRead) return false;
    const parent = parentModuleForEntity(entity.entityType);
    if (!parent) return unrestricted;
    return canCrud(staffAccess, parent, 'read');
  }, [entity, unrestricted, canRead, staffAccess]);

  return {
    entity,
    canRead,
    canCreate,
    canUpdate,
    canDelete,
    canAccessPage,
    showDocNav: !!entity && canAccessPage,
  };
}
