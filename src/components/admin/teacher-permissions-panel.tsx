'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Edit3, Eye, Lock, Save, Shield, X } from 'lucide-react';
import { api } from '@/lib/api';
import { showToast } from '@/components/toast';

type PermLevel = 'inherit' | 'allow' | 'deny';
type PortalAccess = 'FULL' | 'READ_ONLY' | 'FROZEN';

interface PermissionsPayload {
  portalAccess: PortalAccess;
  stored: Record<string, Record<string, string>>;
  effective: { features: Record<string, { allowed: boolean; reason?: string }> };
  isHod: boolean;
  branch: {
    name: string;
    teacherParentContactEnabled: boolean;
    teachersCanMarkAttendance: boolean;
    teachersCanEnterMarks: boolean;
  };
  catalog: Array<{
    id: string;
    label: string;
    description: string;
    hodOnly?: boolean;
    fields: Array<{
      key: string;
      label: string;
      description: string;
      kind: string;
      branchInheritKey?: string;
    }>;
  }>;
  options: {
    portalModes: Array<{ value: PortalAccess; label: string; description: string }>;
    levels: Array<{ value: PermLevel; label: string }>;
    hodScopes: Array<{ value: string; label: string }>;
  };
}

function getStoredLevel(
  stored: Record<string, Record<string, string>>,
  groupId: string,
  fieldKey: string,
): PermLevel {
  const v = stored[groupId]?.[fieldKey];
  if (v === 'allow' || v === 'deny') return v;
  return 'inherit';
}

function setStoredLevel(
  stored: Record<string, Record<string, string>>,
  groupId: string,
  fieldKey: string,
  level: PermLevel,
): Record<string, Record<string, string>> {
  const next = { ...stored, [groupId]: { ...(stored[groupId] || {}) } };
  if (level === 'inherit') {
    delete next[groupId][fieldKey];
    if (Object.keys(next[groupId]).length === 0) delete next[groupId];
  } else {
    next[groupId][fieldKey] = level;
  }
  return next;
}

export function TeacherPermissionsPanel({
  teacherProfileId,
  branchId,
}: {
  teacherProfileId: string;
  branchId: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<PermissionsPayload | null>(null);
  const [portalAccess, setPortalAccess] = useState<PortalAccess>('FULL');
  const [stored, setStored] = useState<Record<string, Record<string, string>>>({});
  const [hodScope, setHodScope] = useState<'ASSIGNED_ONLY' | 'DEPARTMENT_ALL'>('ASSIGNED_ONLY');

  const load = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const res = await api.getTeacherPortalPermissions(teacherProfileId, branchId);
      if (res.success) {
        setData(res.data);
        setPortalAccess(res.data.portalAccess);
        setStored(res.data.stored || {});
        setHodScope(res.data.stored?.parentContact?.hodScope || 'ASSIGNED_ONLY');
      }
    } catch (e: any) {
      showToast('error', e.message || 'Failed to load permissions');
    } finally {
      setLoading(false);
    }
  }, [teacherProfileId, branchId]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const visibleCatalog = useMemo(() => {
    if (!data) return [];
    return data.catalog.filter((g) => !g.hodOnly || data.isHod);
  }, [data]);

  const handleSave = async () => {
    if (!data) return;
    setSaving(true);
    try {
      const portalPermissions = {
        ...stored,
        parentContact: {
          ...(stored.parentContact || {}),
          hodScope,
        },
      };
      await api.updateTeacherPortalPermissions(teacherProfileId, {
        portalAccess,
        portalPermissions,
      });
      showToast('success', 'Permissions saved');
      setEditing(false);
      await load();
    } catch (e: any) {
      showToast('error', e.message || 'Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  const effectiveLabel = (groupId: string) => {
    const f = data?.effective?.features?.[groupId];
    if (!f) return '—';
    return f.allowed ? 'Allowed' : `Denied${f.reason ? ` — ${f.reason}` : ''}`;
  };

  if (!branchId) {
    return (
      <p className="text-xs text-warm-muted">Select an active branch to manage portal permissions.</p>
    );
  }

  return (
    <section className="mb-10">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-warm-accent" />
          <h2 className="text-sm font-medium text-warm-cream">Portal permissions</h2>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg border border-warm-card-border px-3 py-1.5 text-xs text-warm-muted hover:text-warm-cream"
        >
          {open ? <X size={13} /> : <Lock size={13} />}
          {open ? 'Close' : 'Permissions'}
        </button>
      </div>

      {open && (
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-warm-muted">
              Control global portal mode and per-feature access without freezing the account.
              Branch defaults: {data?.branch.name}
            </p>
            <div className="flex gap-2">
              {!editing ? (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1 rounded-lg border border-warm-card-border px-2.5 py-1 text-xs text-warm-cream"
                >
                  <Edit3 size={12} /> Edit
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      if (data) {
                        setPortalAccess(data.portalAccess);
                        setStored(data.stored || {});
                      }
                    }}
                    className="flex items-center gap-1 rounded-lg border border-warm-card-border px-2.5 py-1 text-xs text-warm-muted"
                  >
                    <Eye size={12} /> Cancel
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleSave}
                    className="flex items-center gap-1 rounded-lg bg-warm-accent px-2.5 py-1 text-xs font-medium text-[#1a1614] disabled:opacity-60"
                  >
                    <Save size={12} /> {saving ? 'Saving…' : 'Save'}
                  </button>
                </>
              )}
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-warm-muted">Loading permissions…</p>
          ) : !data ? (
            <p className="text-sm text-warm-muted">Unable to load permissions.</p>
          ) : (
            <>
              <div className="mb-6 rounded-lg border border-warm-card-border bg-[#1a1614]/40 p-3">
                <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-warm-muted">
                  Global access (big)
                </p>
                {editing ? (
                  <select
                    value={portalAccess}
                    onChange={(e) => setPortalAccess(e.target.value as PortalAccess)}
                    className="w-full max-w-md rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream"
                  >
                    {data.options.portalModes.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-warm-cream">
                    {data.options.portalModes.find((m) => m.value === portalAccess)?.label}
                  </p>
                )}
                <p className="mt-1 text-[11px] text-warm-muted">
                  {data.options.portalModes.find((m) => m.value === portalAccess)?.description}
                </p>
              </div>

              <div className="space-y-4">
                {visibleCatalog.map((group) => (
                  <div key={group.id} className="rounded-lg border border-warm-card-border/80 p-3">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-warm-cream">{group.label}</p>
                        <p className="text-[11px] text-warm-muted">{group.description}</p>
                      </div>
                      {!editing && (
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] ${
                            data.effective.features[group.id]?.allowed
                              ? 'bg-green-900/30 text-green-400'
                              : 'bg-red-900/30 text-red-300'
                          }`}
                        >
                          {effectiveLabel(group.id)}
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      {group.fields.map((field) => {
                        const level = getStoredLevel(stored, group.id, field.key);
                        const branchHint =
                          field.branchInheritKey && data.branch
                            ? `Branch default: ${
                                data.branch[field.branchInheritKey as keyof typeof data.branch]
                                  ? 'on'
                                  : 'off'
                              }`
                            : null;
                        return (
                          <div
                            key={field.key}
                            className="flex flex-col gap-1 border-t border-warm-card-border/50 pt-2 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <p className="text-xs text-warm-cream">{field.label}</p>
                              <p className="text-[10px] text-warm-muted">
                                {field.description}
                                {branchHint ? ` · ${branchHint}` : ''}
                              </p>
                            </div>
                            {editing ? (
                              field.key === 'hodScope' ? null : (
                                <select
                                  value={level}
                                  onChange={(e) =>
                                    setStored(
                                      setStoredLevel(
                                        stored,
                                        group.id,
                                        field.key,
                                        e.target.value as PermLevel,
                                      ),
                                    )
                                  }
                                  className="rounded border border-warm-card-border bg-[#1a1614] px-2 py-1 text-xs text-warm-cream"
                                >
                                  {data.options.levels.map((o) => (
                                    <option key={o.value} value={o.value}>
                                      {o.label}
                                    </option>
                                  ))}
                                </select>
                              )
                            ) : (
                              <span className="text-xs text-warm-muted capitalize">{level}</span>
                            )}
                          </div>
                        );
                      })}

                      {group.id === 'parentContact' && data.isHod && (
                        <div className="flex flex-col gap-1 border-t border-warm-card-border/50 pt-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-xs text-warm-cream">HOD parent contact scope</p>
                            <p className="text-[10px] text-warm-muted">Which classes HOD can see numbers for</p>
                          </div>
                          {editing ? (
                            <select
                              value={hodScope}
                              onChange={(e) =>
                                setHodScope(e.target.value as 'ASSIGNED_ONLY' | 'DEPARTMENT_ALL')
                              }
                              className="rounded border border-warm-card-border bg-[#1a1614] px-2 py-1 text-xs text-warm-cream"
                            >
                              {data.options.hodScopes.map((o) => (
                                <option key={o.value} value={o.value}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-xs text-warm-muted">
                              {data.options.hodScopes.find((o) => o.value === hodScope)?.label}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
