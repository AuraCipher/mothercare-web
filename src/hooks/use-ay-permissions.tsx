'use client';

import { createContext, useContext, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import {
  canCrud,
  isAyReadOnlyForPath,
  moduleForPathname,
  type CrudAction,
  type StaffAccess,
  type StaffModuleKey,
} from '@/lib/staff-permissions';

type AyPermissionsContextValue = {
  staffAccess: StaffAccess | null;
  ayStatus: string | null;
};

const AyPermissionsContext = createContext<AyPermissionsContextValue>({
  staffAccess: null,
  ayStatus: null,
});

export function AyPermissionsProvider({
  children,
  staffAccess,
  ayStatus,
}: {
  children: React.ReactNode;
  staffAccess: StaffAccess | null;
  ayStatus: string | null;
}) {
  const value = useMemo(() => ({ staffAccess, ayStatus }), [staffAccess, ayStatus]);
  return (
    <AyPermissionsContext.Provider value={value}>
      {children}
    </AyPermissionsContext.Provider>
  );
}

export function useAyPermissions(moduleOverride?: StaffModuleKey) {
  const { staffAccess, ayStatus } = useContext(AyPermissionsContext);
  const pathname = usePathname();
  const module = moduleOverride ?? moduleForPathname(pathname);
  const archived = ayStatus === 'ARCHIVED';

  const can = (action: CrudAction) => {
    if (!module) return !staffAccess?.isRestricted;
    return canCrud(staffAccess, module, action, { archived });
  };

  const readOnly = isAyReadOnlyForPath(staffAccess, pathname, ayStatus);

  return {
    module,
    ayStatus,
    isArchived: archived,
    isBuildStage: ayStatus === 'BUILD_STAGE',
    readOnly,
    canCreate: can('create'),
    canUpdate: can('update'),
    canDelete: can('delete'),
    canRead: module ? can('read') : true,
  };
}
