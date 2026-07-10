'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Edit3, Eye, MessageSquare, Plus, Save, Trash2, UserPlus, VolumeX, X } from 'lucide-react';
import { api } from '@/lib/api';
import { showToast } from '@/components/toast';
import ConfirmModal from '@/components/confirm-modal';

export type ClassRoleStudent = {
  id: string;
  name: string;
  rollNumber?: string | null;
};

export type ClassRoleAssignment = {
  id: string;
  studentId: string;
  publicDisplayName: string;
  isMessagingRestricted: boolean;
  student: { id: string; name: string; rollNumber: string | null };
};

export type ClassRoleDefinition = {
  id: string;
  name: string;
  description: string | null;
  canPostInGroups: boolean;
  canReceiveDms: boolean;
  canInitiateDms: boolean;
  assignments: ClassRoleAssignment[];
};

type RoleDraft = {
  name: string;
  description: string;
  canPostInGroups: boolean;
  canReceiveDms: boolean;
  canInitiateDms: boolean;
};

const emptyDraft = (): RoleDraft => ({
  name: '',
  description: '',
  canPostInGroups: true,
  canReceiveDms: true,
  canInitiateDms: false,
});

function roleApi(actor: 'teacher' | 'admin') {
  if (actor === 'teacher') {
    return {
      list: api.getTeacherClassRoles.bind(api),
      create: api.createTeacherClassRole.bind(api),
      update: api.updateTeacherClassRole.bind(api),
      remove: api.deleteTeacherClassRole.bind(api),
      assign: api.assignTeacherClassRole.bind(api),
      unassign: api.removeTeacherClassAssignment.bind(api),
    };
  }
  return {
    list: api.getAdminClassRoles.bind(api),
    create: api.createAdminClassRole.bind(api),
    update: api.updateAdminClassRole.bind(api),
    remove: api.deleteAdminClassRole.bind(api),
    assign: api.assignAdminClassRole.bind(api),
    unassign: api.removeAdminClassAssignment.bind(api),
  };
}

function FlagToggle({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className={`flex items-start gap-2 rounded-lg border border-warm-card-border px-3 py-2 ${disabled ? 'opacity-70' : 'cursor-pointer hover:bg-warm-card/40'}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 accent-warm-accent"
      />
      <span>
        <span className="block text-xs text-warm-cream">{label}</span>
        <span className="block text-[10px] text-warm-muted">{description}</span>
      </span>
    </label>
  );
}

export function ClassStudentPermissionsPanel({
  actor,
  communityId,
  students,
  readOnly = false,
}: {
  actor: 'teacher' | 'admin';
  communityId: string;
  students: ClassRoleStudent[];
  readOnly?: boolean;
}) {
  const calls = useMemo(() => roleApi(actor), [actor]);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<ClassRoleDefinition[]>([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<RoleDraft>(emptyDraft());
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [assignRoleId, setAssignRoleId] = useState<string | null>(null);
  const [assignStudentId, setAssignStudentId] = useState('');
  const [assignDisplayName, setAssignDisplayName] = useState('');
  const [assignMuted, setAssignMuted] = useState(false);
  const [confirm, setConfirm] = useState<{
    open: boolean;
    title: string;
    message: string;
    action: () => Promise<void>;
  }>({ open: false, title: '', message: '', action: async () => {} });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await calls.list(communityId);
      if (res.success) setRoles(res.data || []);
      else showToast('error', res.message || 'Failed to load roles');
    } catch (e: any) {
      showToast('error', e.message || 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  }, [calls, communityId]);

  useEffect(() => {
    if (communityId) load();
  }, [communityId, load]);

  const assignedStudentIds = useMemo(() => {
    const ids = new Set<string>();
    for (const role of roles) {
      for (const a of role.assignments) ids.add(a.studentId);
    }
    return ids;
  }, [roles]);

  const availableStudents = useMemo(
    () => students.filter((s) => !assignedStudentIds.has(s.id)),
    [students, assignedStudentIds],
  );

  const resetDraft = () => {
    setDraft(emptyDraft());
    setEditingRoleId(null);
    setAssignRoleId(null);
    setAssignStudentId('');
    setAssignDisplayName('');
    setAssignMuted(false);
  };

  const startCreate = () => {
    resetDraft();
    setEditing(true);
  };

  const startEdit = (role: ClassRoleDefinition) => {
    setEditingRoleId(role.id);
    setDraft({
      name: role.name,
      description: role.description || '',
      canPostInGroups: role.canPostInGroups,
      canReceiveDms: role.canReceiveDms,
      canInitiateDms: role.canInitiateDms,
    });
    setEditing(true);
  };

  const handleSaveRole = async () => {
    const name = draft.name.trim();
    if (!name) {
      showToast('error', 'Role name is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name,
        description: draft.description.trim() || null,
        canPostInGroups: draft.canPostInGroups,
        canReceiveDms: draft.canReceiveDms,
        canInitiateDms: draft.canInitiateDms,
      };
      const res = editingRoleId
        ? await calls.update(communityId, editingRoleId, payload)
        : await calls.create(communityId, payload);
      if (!res.success) {
        showToast('error', res.message || 'Failed to save role');
        return;
      }
      showToast('success', editingRoleId ? 'Role updated' : 'Role created');
      setEditing(false);
      resetDraft();
      await load();
    } catch (e: any) {
      showToast('error', e.message || 'Failed to save role');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = (role: ClassRoleDefinition) => {
    setConfirm({
      open: true,
      title: `Delete role "${role.name}"?`,
      message: 'Students holding this role will lose associated chat permissions.',
      action: async () => {
        try {
          const res = await calls.remove(communityId, role.id);
          if (!res.success) {
            showToast('error', res.message || 'Failed to delete role');
            return;
          }
          showToast('success', 'Role deleted');
          await load();
        } catch (e: any) {
          showToast('error', e.message || 'Failed to delete role');
        }
      },
    });
  };

  const handleAssign = async (roleId: string) => {
    if (!assignStudentId) {
      showToast('error', 'Select a student');
      return;
    }
    setSaving(true);
    try {
      const res = await calls.assign(communityId, roleId, {
        studentId: assignStudentId,
        publicDisplayName: assignDisplayName.trim() || undefined,
        isMessagingRestricted: assignMuted,
      });
      if (!res.success) {
        showToast('error', res.message || 'Failed to assign student');
        return;
      }
      showToast('success', 'Student assigned');
      setAssignRoleId(null);
      setAssignStudentId('');
      setAssignDisplayName('');
      setAssignMuted(false);
      await load();
    } catch (e: any) {
      showToast('error', e.message || 'Failed to assign student');
    } finally {
      setSaving(false);
    }
  };

  const handleUnassign = (role: ClassRoleDefinition, assignment: ClassRoleAssignment) => {
    setConfirm({
      open: true,
      title: `Remove ${assignment.student.name} from ${role.name}?`,
      message: 'They will lose posting permissions granted by this role.',
      action: async () => {
        try {
          const res = await calls.unassign(communityId, assignment.id);
          if (!res.success) {
            showToast('error', res.message || 'Failed to remove assignment');
            return;
          }
          showToast('success', 'Assignment removed');
          await load();
        } catch (e: any) {
          showToast('error', e.message || 'Failed to remove assignment');
        }
      },
    });
  };

  const handleToggleMute = async (
    role: ClassRoleDefinition,
    assignment: ClassRoleAssignment,
  ) => {
    setSaving(true);
    try {
      const res = await calls.assign(communityId, role.id, {
        studentId: assignment.studentId,
        publicDisplayName: assignment.publicDisplayName,
        isMessagingRestricted: !assignment.isMessagingRestricted,
      });
      if (!res.success) {
        showToast('error', res.message || 'Failed to update mute');
        return;
      }
      await load();
    } catch (e: any) {
      showToast('error', e.message || 'Failed to update mute');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-warm-card-border bg-warm-card p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare size={16} className="text-warm-accent" />
            <h2 className="text-sm font-medium text-warm-cream">Chat roles</h2>
          </div>
          <p className="mt-1 text-xs text-warm-muted">
            Define class roles (CR, GR, etc.) and assign students. Role holders can post in subject
            groups when enabled — not in class announcements.
          </p>
        </div>
        {!readOnly && !editing && (
          <button
            type="button"
            onClick={startCreate}
            className="flex shrink-0 items-center gap-1 rounded-lg border border-warm-accent/40 bg-warm-accent/10 px-3 py-1.5 text-xs text-warm-cream hover:bg-warm-accent/20"
          >
            <Plus size={12} /> Add role
          </button>
        )}
      </div>

      {editing && (
        <div className="mb-4 rounded-lg border border-warm-accent/30 bg-[#1f1b19] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-medium text-warm-cream">
              {editingRoleId ? 'Edit role' : 'New role'}
            </h3>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                resetDraft();
              }}
              className="text-warm-muted hover:text-warm-cream"
            >
              <X size={14} />
            </button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-[10px] text-warm-muted">Name</label>
              <input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="e.g. Class Representative"
                className="w-full rounded-lg border border-warm-card-border bg-warm-card px-3 py-2 text-xs text-warm-cream"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] text-warm-muted">Description (optional)</label>
              <input
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                placeholder="Short note for admins"
                className="w-full rounded-lg border border-warm-card-border bg-warm-card px-3 py-2 text-xs text-warm-cream"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <FlagToggle
                label="Post in subject groups"
                description="Can send messages in Math, Science, etc."
                checked={draft.canPostInGroups}
                disabled={false}
                onChange={(v) => setDraft({ ...draft, canPostInGroups: v })}
              />
              <FlagToggle
                label="Receive DMs"
                description="Future: direct message policy"
                checked={draft.canReceiveDms}
                disabled={false}
                onChange={(v) => setDraft({ ...draft, canReceiveDms: v })}
              />
              <FlagToggle
                label="Initiate DMs"
                description="Future: start new conversations"
                checked={draft.canInitiateDms}
                disabled={false}
                onChange={(v) => setDraft({ ...draft, canInitiateDms: v })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  resetDraft();
                }}
                className="rounded-lg border border-warm-card-border px-3 py-1.5 text-xs text-warm-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveRole}
                className="flex items-center gap-1 rounded-lg bg-warm-accent px-3 py-1.5 text-xs font-medium text-[#1a1614] disabled:opacity-50"
              >
                <Save size={12} /> {saving ? 'Saving…' : 'Save role'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-warm-card/60" />
          ))}
        </div>
      ) : roles.length === 0 ? (
        <p className="rounded-lg border border-dashed border-warm-card-border px-4 py-8 text-center text-xs text-warm-muted">
          No chat roles yet. Add roles like CR or Diary Monitor, then assign students.
        </p>
      ) : (
        <div className="space-y-3">
          {roles.map((role) => (
            <div key={role.id} className="rounded-lg border border-warm-card-border bg-[#1f1b19] p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-warm-cream">{role.name}</p>
                  {role.description && (
                    <p className="mt-0.5 text-[10px] text-warm-muted">{role.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {role.canPostInGroups && (
                      <span className="rounded bg-warm-accent/15 px-1.5 py-0.5 text-[10px] text-warm-accent">
                        Subject groups
                      </span>
                    )}
                    {role.canInitiateDms && (
                      <span className="rounded bg-warm-card px-1.5 py-0.5 text-[10px] text-warm-muted">
                        Initiate DMs
                      </span>
                    )}
                    {!role.canReceiveDms && (
                      <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] text-red-300">
                        No DMs
                      </span>
                    )}
                  </div>
                </div>
                {!readOnly && (
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => startEdit(role)}
                      className="rounded p-1 text-warm-muted hover:text-warm-cream"
                      title="Edit role"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteRole(role)}
                      className="rounded p-1 text-warm-muted hover:text-red-300"
                      title="Delete role"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-3 border-t border-warm-card-border pt-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wide text-warm-muted">
                    Holders ({role.assignments.length})
                  </span>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => {
                        setAssignRoleId(role.id);
                        setAssignStudentId('');
                        setAssignDisplayName('');
                        setAssignMuted(false);
                      }}
                      className="flex items-center gap-1 text-[10px] text-warm-accent hover:text-[#b39a76]"
                    >
                      <UserPlus size={11} /> Assign student
                    </button>
                  )}
                </div>

                {assignRoleId === role.id && !readOnly && (
                  <div className="mb-3 rounded-lg border border-warm-accent/20 bg-warm-card/40 p-3">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-[10px] text-warm-muted">Student</label>
                        <select
                          value={assignStudentId}
                          onChange={(e) => setAssignStudentId(e.target.value)}
                          className="w-full rounded-lg border border-warm-card-border bg-warm-card px-2 py-1.5 text-xs text-warm-cream"
                        >
                          <option value="">Select student…</option>
                          {availableStudents.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} {s.rollNumber ? `(Roll ${s.rollNumber})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] text-warm-muted">
                          Display title (optional)
                        </label>
                        <input
                          value={assignDisplayName}
                          onChange={(e) => setAssignDisplayName(e.target.value)}
                          placeholder={`${role.name} — Student`}
                          className="w-full rounded-lg border border-warm-card-border bg-warm-card px-2 py-1.5 text-xs text-warm-cream"
                        />
                      </div>
                    </div>
                    <label className="mt-2 flex items-center gap-2 text-[10px] text-warm-muted">
                      <input
                        type="checkbox"
                        checked={assignMuted}
                        onChange={(e) => setAssignMuted(e.target.checked)}
                        className="accent-warm-accent"
                      />
                      Mute messaging (restricted)
                    </label>
                    <div className="mt-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setAssignRoleId(null)}
                        className="text-[10px] text-warm-muted"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => handleAssign(role.id)}
                        className="rounded bg-warm-accent px-2 py-1 text-[10px] font-medium text-[#1a1614] disabled:opacity-50"
                      >
                        Assign
                      </button>
                    </div>
                  </div>
                )}

                {role.assignments.length === 0 ? (
                  <p className="text-[10px] text-warm-muted/70">No students assigned.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {role.assignments.map((a) => (
                      <li
                        key={a.id}
                        className="flex items-center justify-between gap-2 rounded-lg bg-warm-card/50 px-2 py-1.5"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs text-warm-cream">{a.student.name}</p>
                          <p className="text-[10px] text-warm-muted">
                            {a.publicDisplayName}
                            {a.student.rollNumber ? ` · Roll ${a.student.rollNumber}` : ''}
                          </p>
                        </div>
                        {!readOnly && (
                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleToggleMute(role, a)}
                              disabled={saving}
                              title={a.isMessagingRestricted ? 'Unmute' : 'Mute'}
                              className={`rounded p-1 ${a.isMessagingRestricted ? 'text-red-300' : 'text-warm-muted hover:text-warm-cream'}`}
                            >
                              <VolumeX size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUnassign(role, a)}
                              className="rounded p-1 text-warm-muted hover:text-red-300"
                              title="Remove"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                        {readOnly && a.isMessagingRestricted && (
                          <span className="text-[10px] text-red-300">Muted</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!editing && !readOnly && roles.length > 0 && (
        <p className="mt-3 flex items-center gap-1 text-[10px] text-warm-muted/60">
          <Eye size={10} /> Changes apply immediately to mobile chat posting permissions.
        </p>
      )}

      <ConfirmModal
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        variant="danger"
        confirmLabel="Confirm"
        onConfirm={async () => {
          await confirm.action();
          setConfirm((c) => ({ ...c, open: false }));
        }}
        onCancel={() => setConfirm((c) => ({ ...c, open: false }))}
      />
    </div>
  );
}
