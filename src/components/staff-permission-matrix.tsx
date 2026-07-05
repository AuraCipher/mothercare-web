'use client';

import {
  EMPTY_PERMISSION_ROW,
  STAFF_MODULES,
  moduleLabel,
  type ModulePermission,
  type StaffModuleKey,
} from '@/lib/staff-permissions';

export function PermissionMatrix({
  value,
  onChange,
  compact,
}: {
  value: Record<StaffModuleKey, ModulePermission | undefined>;
  onChange: (next: Record<StaffModuleKey, ModulePermission | undefined>) => void;
  compact?: boolean;
}) {
  const toggleModule = (key: StaffModuleKey, on: boolean) => {
    const next = { ...value };
    if (on) next[key] = value[key] ?? EMPTY_PERMISSION_ROW(key);
    else delete next[key];
    onChange(next);
  };

  const toggleCrud = (key: StaffModuleKey, field: 'canCreate' | 'canUpdate' | 'canDelete', on: boolean) => {
    const row = value[key] ?? EMPTY_PERMISSION_ROW(key);
    onChange({ ...value, [key]: { ...row, [field]: on } });
  };

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      {STAFF_MODULES.map(({ key }) => {
        const enabled = !!value[key];
        const row = value[key];
        return (
          <div
            key={key}
            className={`rounded-xl border px-4 py-3 ${enabled ? 'border-warm-accent/40 bg-warm-card/40' : 'border-warm-card-border bg-warm-card/20'}`}
          >
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => toggleModule(key, e.target.checked)}
                className="rounded border-warm-card-border"
              />
              <span className={`font-medium text-warm-cream ${compact ? 'text-xs' : 'text-sm'}`}>
                {moduleLabel(key)}
              </span>
            </label>
            {enabled && row && (
              <div className={`mt-3 flex flex-wrap gap-4 pl-6 ${compact ? 'text-[11px]' : 'text-xs'}`}>
                <label className="flex items-center gap-1.5 text-warm-muted">
                  <input type="checkbox" checked disabled className="rounded opacity-60" />
                  Read <span className="text-[10px]">(required)</span>
                </label>
                {(['canCreate', 'canUpdate', 'canDelete'] as const).map((field) => (
                  <label key={field} className="flex items-center gap-1.5 text-warm-cream">
                    <input
                      type="checkbox"
                      checked={row[field]}
                      onChange={(e) => toggleCrud(key, field, e.target.checked)}
                      className="rounded border-warm-card-border"
                    />
                    {field === 'canCreate' ? 'Create' : field === 'canUpdate' ? 'Update' : 'Delete'}
                  </label>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function toPermRecord(perms: ModulePermission[]): Record<StaffModuleKey, ModulePermission | undefined> {
  const out = {} as Record<StaffModuleKey, ModulePermission | undefined>;
  for (const p of perms) out[p.module] = p;
  return out;
}

export function toPermArray(map: Record<StaffModuleKey, ModulePermission | undefined>): ModulePermission[] {
  return Object.values(map).filter(Boolean) as ModulePermission[];
}

export function emptyPermMap(): Record<StaffModuleKey, ModulePermission | undefined> {
  return {} as Record<StaffModuleKey, ModulePermission | undefined>;
}

export function formatModuleSummary(permissions: ModulePermission[]): string {
  if (!permissions.length) return 'Full branch access';
  return permissions.map((p) => moduleLabel(p.module)).join(', ');
}

export function crudSummary(p: ModulePermission): string {
  const parts = ['Read'];
  if (p.canCreate) parts.push('Create');
  if (p.canUpdate) parts.push('Update');
  if (p.canDelete) parts.push('Delete');
  return parts.join(' · ');
}
