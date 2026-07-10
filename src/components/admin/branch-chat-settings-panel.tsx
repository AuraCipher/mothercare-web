'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Edit3, Eye, Megaphone, MessageSquare, Save, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { showToast } from '@/components/toast';

type PosterUser = { id: string; name: string; username: string | null };

type BranchChatSettings = {
  branchId: string;
  schoolAnnouncementPosterUserIds: string[];
  teacherAnnouncementPosterUserIds: string[];
  allowAllTeachersTeacherAnnouncement: boolean;
  schoolAnnouncementPosters: PosterUser[];
  teacherAnnouncementPosters: PosterUser[];
};

type TeacherRow = {
  userId: string;
  user: { id: string; name: string; username: string | null; status: string };
};

function TeacherPicker({
  label,
  description,
  teachers,
  selectedIds,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  teachers: TeacherRow[];
  selectedIds: string[];
  disabled: boolean;
  onChange: (ids: string[]) => void;
}) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter(
      (t) =>
        t.user.name.toLowerCase().includes(q) ||
        (t.user.username?.toLowerCase().includes(q) ?? false),
    );
  }, [teachers, search]);

  const toggle = (userId: string) => {
    if (disabled) return;
    if (selectedIds.includes(userId)) {
      onChange(selectedIds.filter((id) => id !== userId));
    } else {
      onChange([...selectedIds, userId]);
    }
  };

  return (
    <div className="rounded-lg border border-warm-card-border bg-[#1f1b19] p-4">
      <div className="mb-3">
        <h3 className="text-sm font-medium text-warm-cream">{label}</h3>
        <p className="mt-1 text-xs text-warm-muted">{description}</p>
      </div>
      {!disabled && (
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search teachers…"
          className="mb-3 w-full rounded-lg border border-warm-card-border bg-warm-card px-3 py-2 text-xs text-warm-cream placeholder:text-warm-muted/50"
        />
      )}
      <div className="max-h-48 space-y-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="py-4 text-center text-xs text-warm-muted">No teachers found.</p>
        ) : (
          filtered.map((t) => {
            const checked = selectedIds.includes(t.user.id);
            return (
              <label
                key={t.user.id}
                className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors ${
                  checked ? 'bg-warm-accent/10 text-warm-cream' : 'text-warm-muted hover:bg-warm-card'
                } ${disabled ? 'cursor-default opacity-70' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => toggle(t.user.id)}
                  className="accent-warm-accent"
                />
                <span className="flex-1 truncate">{t.user.name}</span>
                {t.user.username && (
                  <span className="font-mono text-[10px] text-warm-muted/60">{t.user.username}</span>
                )}
              </label>
            );
          })
        )}
      </div>
      {selectedIds.length > 0 && (
        <p className="mt-2 text-[10px] text-warm-muted">{selectedIds.length} appointed</p>
      )}
    </div>
  );
}

export function BranchChatSettingsPanel({
  branchId,
  activeAcademicYearId,
  activeAcademicYearLabel,
}: {
  branchId: string;
  activeAcademicYearId: string | null;
  activeAcademicYearLabel?: string;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [settings, setSettings] = useState<BranchChatSettings | null>(null);
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [schoolPosterIds, setSchoolPosterIds] = useState<string[]>([]);
  const [teacherPosterIds, setTeacherPosterIds] = useState<string[]>([]);
  const [allowAllTeachers, setAllowAllTeachers] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [settingsRes, teachersRes] = await Promise.all([
        api.getBranchChatSettings(branchId),
        api.getBranchTeachers(branchId, { limit: 200 }),
      ]);
      if (settingsRes.success) {
        const data = settingsRes.data as BranchChatSettings;
        setSettings(data);
        setSchoolPosterIds(data.schoolAnnouncementPosterUserIds);
        setTeacherPosterIds(data.teacherAnnouncementPosterUserIds);
        setAllowAllTeachers(data.allowAllTeachersTeacherAnnouncement);
      }
      if (teachersRes.success) {
        setTeachers(
          (teachersRes.data || [])
            .filter((p: any) => p.user?.status === 'active')
            .map((p: any) => ({ userId: p.userId, user: p.user })),
        );
      }
    } catch (e: any) {
      showToast('error', e.message || 'Failed to load chat settings');
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    load();
  }, [load]);

  const resetDraft = () => {
    if (!settings) return;
    setSchoolPosterIds(settings.schoolAnnouncementPosterUserIds);
    setTeacherPosterIds(settings.teacherAnnouncementPosterUserIds);
    setAllowAllTeachers(settings.allowAllTeachersTeacherAnnouncement);
  };

  const handleSave = async () => {
    if (!activeAcademicYearId) {
      showToast('error', 'Publish an active academic year before syncing chat memberships.');
      return;
    }
    setSaving(true);
    try {
      const res = await api.updateBranchChatSettings(branchId, activeAcademicYearId, {
        schoolAnnouncementPosterUserIds: schoolPosterIds,
        teacherAnnouncementPosterUserIds: teacherPosterIds,
        allowAllTeachersTeacherAnnouncement: allowAllTeachers,
      });
      if (res.success) {
        const data = res.data as BranchChatSettings;
        setSettings(data);
        setSchoolPosterIds(data.schoolAnnouncementPosterUserIds);
        setTeacherPosterIds(data.teacherAnnouncementPosterUserIds);
        setAllowAllTeachers(data.allowAllTeachersTeacherAnnouncement);
        setEditing(false);
        showToast('success', 'Mobile chat permissions updated');
      }
    } catch (e: any) {
      showToast('error', e.message || 'Failed to save chat settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !settings) {
    return (
      <div className="mb-8 rounded-xl border border-warm-card-border bg-warm-card p-5">
        <div className="h-5 w-40 animate-pulse rounded bg-warm-card-border/40" />
        <div className="mt-4 h-24 animate-pulse rounded bg-warm-card-border/30" />
      </div>
    );
  }

  return (
    <div className="mb-8 rounded-xl border border-warm-card-border bg-warm-card p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare size={18} className="text-warm-accent" />
            <h2 className="text-sm font-medium text-warm-cream">Mobile chat — channel posters</h2>
          </div>
          <p className="mt-1 max-w-2xl text-xs text-warm-muted">
            Appoint which teachers can post in broadcast channels. Students and other teachers stay
            read-only unless appointed here or via class roles (later). Changes sync room memberships
            for the active academic year.
          </p>
          {activeAcademicYearId ? (
            <p className="mt-2 text-[10px] text-warm-muted/80">
              Sync target: <span className="text-warm-cream">{activeAcademicYearLabel || 'Active year'}</span>
            </p>
          ) : (
            <p className="mt-2 text-[10px] text-amber-400/90">
              No active academic year — publish a year before saving appointments.
            </p>
          )}
        </div>
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
                  resetDraft();
                }}
                className="flex items-center gap-1 rounded-lg border border-warm-card-border px-2.5 py-1 text-xs text-warm-muted"
              >
                <Eye size={12} /> Cancel
              </button>
              <button
                type="button"
                disabled={saving || !activeAcademicYearId}
                onClick={handleSave}
                className="flex items-center gap-1 rounded-lg bg-warm-accent px-2.5 py-1 text-xs font-medium text-[#1a1614] disabled:opacity-60"
              >
                <Save size={12} /> {saving ? 'Saving…' : 'Save'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-warm-card-border bg-[#1f1b19] p-3">
          <div className="mb-2 flex items-center gap-2 text-xs text-warm-muted">
            <Megaphone size={14} className="text-warm-accent" />
            School Announcement
          </div>
          {settings?.schoolAnnouncementPosters.length ? (
            <ul className="space-y-1">
              {settings.schoolAnnouncementPosters.map((p) => (
                <li key={p.id} className="text-xs text-warm-cream">
                  {p.name}
                  {p.username && <span className="ml-2 font-mono text-[10px] text-warm-muted">{p.username}</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-warm-muted">Admin only (no teachers appointed)</p>
          )}
        </div>
        <div className="rounded-lg border border-warm-card-border bg-[#1f1b19] p-3">
          <div className="mb-2 flex items-center gap-2 text-xs text-warm-muted">
            <Users size={14} className="text-warm-accent" />
            Teachers Announcement
          </div>
          {settings?.allowAllTeachersTeacherAnnouncement ? (
            <p className="text-xs text-warm-cream">All teachers can post</p>
          ) : settings?.teacherAnnouncementPosters.length ? (
            <ul className="space-y-1">
              {settings.teacherAnnouncementPosters.map((p) => (
                <li key={p.id} className="text-xs text-warm-cream">
                  {p.name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-warm-muted">Admin only</p>
          )}
        </div>
      </div>

      {editing && (
        <div className="space-y-4 border-t border-warm-card-border pt-4">
          <TeacherPicker
            label="School Announcement posters"
            description="These teachers can post in the whole-school channel (in addition to branch admins)."
            teachers={teachers}
            selectedIds={schoolPosterIds}
            disabled={!editing}
            onChange={setSchoolPosterIds}
          />

          <div className="rounded-lg border border-warm-card-border bg-[#1f1b19] p-4">
            <h3 className="text-sm font-medium text-warm-cream">Teachers Announcement</h3>
            <p className="mt-1 text-xs text-warm-muted">
              Staff-only broadcast channel. All teachers can read; posting is controlled below.
            </p>
            <label className="mt-3 flex items-center gap-2 text-xs text-warm-cream">
              <input
                type="checkbox"
                checked={allowAllTeachers}
                onChange={(e) => setAllowAllTeachers(e.target.checked)}
                className="accent-warm-accent"
              />
              Allow all active teachers to post
            </label>
            {!allowAllTeachers && (
              <div className="mt-4">
                <TeacherPicker
                  label="Appointed posters"
                  description="Only these teachers can post when allow-all is off."
                  teachers={teachers}
                  selectedIds={teacherPosterIds}
                  disabled={!editing}
                  onChange={setTeacherPosterIds}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
