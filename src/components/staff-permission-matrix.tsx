'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import {
  EMPTY_PERMISSION_ROW,
  STAFF_MODULES,
  moduleLabel,
  type ModulePermission,
  type StaffModuleKey,
} from '@/lib/staff-permissions';

export type { ModulePermission, StaffModuleKey } from '@/lib/staff-permissions';
export { moduleLabel } from '@/lib/staff-permissions';

function CrudBadges({ p, archived }: { p: ModulePermission; archived?: boolean }) {
  const items = archived
    ? [
        { on: !!p.archivedCanRead, label: 'Read' },
        { on: !!p.archivedCanCreate, label: 'Create' },
        { on: !!p.archivedCanUpdate, label: 'Update' },
        { on: !!p.archivedCanDelete, label: 'Delete' },
      ]
    : [
        { on: true, label: 'Read' },
        { on: p.canCreate, label: 'Create' },
        { on: p.canUpdate, label: 'Update' },
        { on: p.canDelete, label: 'Delete' },
      ];
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map(({ on, label }) => (
        <span
          key={label}
          className={`rounded px-2 py-0.5 text-[10px] ${
            on
              ? 'bg-warm-accent/15 text-warm-accent'
              : 'bg-warm-card-border/30 text-warm-muted/40 line-through'
          }`}
        >
          {label}
        </span>
      ))}
    </div>
  );
}

function CollapsibleBlock({
  title,
  open,
  onToggle,
  children,
  muted,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <div className={`rounded-xl border ${muted ? 'border-warm-card-border/60 bg-warm-card/15' : 'border-warm-card-border bg-warm-card/25'}`}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-warm-cream">
          {open ? <ChevronDown size={14} className="text-warm-muted" /> : <ChevronRight size={14} className="text-warm-muted" />}
          {title}
        </span>
      </button>
      {open && <div className="border-t border-warm-card-border/50 px-4 pb-4 pt-3">{children}</div>}
    </div>
  );
}

/** Read-only collapsible module list */
export function ModulePermissionsRead({ permissions }: { permissions: ModulePermission[] }) {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  if (!permissions.length) {
    return <p className="text-xs text-warm-muted">No module access assigned.</p>;
  }

  return (
    <div className="space-y-2">
      {permissions.map((p) => {
        const key = p.module;
        const isOpen = open[key] ?? false;
        return (
          <CollapsibleBlock
            key={key}
            title={moduleLabel(key)}
            open={isOpen}
            onToggle={() => setOpen((prev) => ({ ...prev, [key]: !isOpen }))}
          >
            <CrudBadges p={p} />
            {p.archivedCanRead && (
              <p className="mt-2 text-[10px] text-yellow-400/80">+ Archived year access</p>
            )}
          </CollapsibleBlock>
        );
      })}
    </div>
  );
}

/** Edit mode — collapsible blocks with CRUD checkboxes */
export function PermissionMatrix({
  value,
  onChange,
  compact,
}: {
  value: Record<StaffModuleKey, ModulePermission | undefined>;
  onChange: (next: Record<StaffModuleKey, ModulePermission | undefined>) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const toggleModule = (key: StaffModuleKey, on: boolean) => {
    const next = { ...value };
    if (on) {
      next[key] = value[key] ?? EMPTY_PERMISSION_ROW(key);
      setOpen((prev) => ({ ...prev, [key]: true }));
    } else {
      delete next[key];
    }
    onChange(next);
  };

  const toggleCrud = (key: StaffModuleKey, field: 'canCreate' | 'canUpdate' | 'canDelete', on: boolean) => {
    const row = value[key] ?? EMPTY_PERMISSION_ROW(key);
    onChange({ ...value, [key]: { ...row, [field]: on } });
  };

  const toggleArchivedMaster = (key: StaffModuleKey, on: boolean) => {
    const row = value[key] ?? EMPTY_PERMISSION_ROW(key);
    onChange({
      ...value,
      [key]: {
        ...row,
        archivedCanRead: on,
        archivedCanCreate: on ? row.archivedCanCreate : false,
        archivedCanUpdate: on ? row.archivedCanUpdate : false,
        archivedCanDelete: on ? row.archivedCanDelete : false,
      },
    });
  };

  const toggleArchivedCrud = (
    key: StaffModuleKey,
    field: 'archivedCanCreate' | 'archivedCanUpdate' | 'archivedCanDelete',
    on: boolean,
  ) => {
    const row = value[key] ?? EMPTY_PERMISSION_ROW(key);
    onChange({
      ...value,
      [key]: {
        ...row,
        archivedCanRead: true,
        [field]: on,
      },
    });
  };

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      {STAFF_MODULES.map(({ key }) => {
        const enabled = !!value[key];
        const row = value[key];
        const isOpen = open[key] ?? enabled;
        return (
          <div
            key={key}
            className={`rounded-xl border ${enabled ? 'border-warm-accent/40 bg-warm-card/40' : 'border-warm-card-border bg-warm-card/20'}`}
          >
            <div className="flex items-center gap-2 px-4 py-3">
              <button
                type="button"
                onClick={() => setOpen((prev) => ({ ...prev, [key]: !isOpen }))}
                className="text-warm-muted hover:text-warm-cream"
                aria-label={isOpen ? 'Collapse' : 'Expand'}
              >
                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              <label className="flex flex-1 cursor-pointer items-center gap-2">
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
            </div>
            {enabled && row && isOpen && (
              <div className={`border-t border-warm-card-border/50 px-4 pb-3 pt-2 space-y-3 ${compact ? 'text-[11px]' : 'text-xs'}`}>
                <div>
                  <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-warm-muted">Current year</p>
                  <div className="flex flex-wrap gap-4 pl-1">
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
                </div>
                <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-3 py-2">
                  <label className="mb-2 flex items-center gap-2 text-warm-cream">
                    <input
                      type="checkbox"
                      checked={!!row.archivedCanRead}
                      onChange={(e) => toggleArchivedMaster(key, e.target.checked)}
                      className="rounded border-warm-card-border"
                    />
                    <span className="font-medium">Archived / old academic years</span>
                  </label>
                  {row.archivedCanRead && (
                    <div className="flex flex-wrap gap-4 pl-1">
                      <label className="flex items-center gap-1.5 text-warm-muted">
                        <input type="checkbox" checked disabled className="rounded opacity-60" />
                        Read <span className="text-[10px]">(required)</span>
                      </label>
                      {(['archivedCanCreate', 'archivedCanUpdate', 'archivedCanDelete'] as const).map((field) => (
                        <label key={field} className="flex items-center gap-1.5 text-warm-cream">
                          <input
                            type="checkbox"
                            checked={!!row[field]}
                            onChange={(e) => toggleArchivedCrud(key, field, e.target.checked)}
                            className="rounded border-warm-card-border"
                          />
                          {field === 'archivedCanCreate' ? 'Create' : field === 'archivedCanUpdate' ? 'Update' : 'Delete'}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
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
  if (!permissions.length) return 'No modules';
  return permissions.map((p) => moduleLabel(p.module)).join(', ');
}

export function crudSummary(p: ModulePermission): string {
  const parts = ['Read'];
  if (p.canCreate) parts.push('Create');
  if (p.canUpdate) parts.push('Update');
  if (p.canDelete) parts.push('Delete');
  return parts.join(' · ');
}
