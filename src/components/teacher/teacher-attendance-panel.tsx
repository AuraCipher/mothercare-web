'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { formatGroupLabel } from '@/lib/teacher/types';
import type { TeacherAssignment } from '@/lib/teacher/types';

const STATUSES = [
  { value: 'present', label: 'Present', short: 'P' },
  { value: 'absent', label: 'Absent', short: 'A' },
  { value: 'late', label: 'Late', short: 'L' },
  { value: 'leave', label: 'Leave', short: 'Lv' },
  { value: 'function', label: 'Function', short: 'Fn' },
] as const;

type StatusValue = (typeof STATUSES)[number]['value'];

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isSundayToday() {
  return new Date().getDay() === 0;
}

function formatDisplayDate(date: string) {
  const d = new Date(`${date}T12:00:00`);
  return d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
}

function statusClass(status: string | null) {
  if (status === 'present') return 'border-green-500/40 bg-green-500/10 text-green-300';
  if (status === 'absent') return 'border-red-500/40 bg-red-500/10 text-red-300';
  if (status === 'late') return 'border-yellow-500/40 bg-yellow-500/10 text-yellow-300';
  if (status === 'leave') return 'border-blue-500/40 bg-blue-500/10 text-blue-300';
  if (status === 'function') return 'border-purple-500/40 bg-purple-500/10 text-purple-300';
  return 'border-warm-card-border bg-warm-card/40 text-warm-muted';
}

interface Props {
  assignments: TeacherAssignment[];
  classTeacherGroupIds: string[];
  readOnly: boolean;
  initialGroupId?: string;
}

export function TeacherAttendancePanel({
  assignments,
  classTeacherGroupIds,
  readOnly,
  initialGroupId,
}: Props) {
  const groupOptions = useMemo(() => {
    const seen = new Set<string>();
    return assignments.filter((a) => {
      if (seen.has(a.groupId)) return false;
      seen.add(a.groupId);
      return true;
    });
  }, [assignments]);

  const [groupId, setGroupId] = useState(initialGroupId || groupOptions[0]?.groupId || '');
  const today = todayStr();
  const [date] = useState(today);
  const [records, setRecords] = useState<
    Array<{ studentId: string; name: string; rollNumber: string | null; status: string | null }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [lastLoadedHash, setLastLoadedHash] = useState('');
  const [canMarkToday, setCanMarkToday] = useState(!isSundayToday());

  const selected = groupOptions.find((a) => a.groupId === groupId);
  const isClassTeacher = groupId ? classTeacherGroupIds.includes(groupId) : false;
  const isSunday = isSundayToday();
  const canEdit = !readOnly && canMarkToday && !isSunday;

  const load = useCallback(async () => {
    if (!groupId || !date) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.teacherAttendance(groupId, date);
      if (res.success) {
        const mapped = res.data.records.map((r: any) => ({
          studentId: r.studentId,
          name: r.name,
          rollNumber: r.rollNumber,
          status: r.status,
        }));
        setRecords(mapped);
        if (typeof res.data.canMarkToday === 'boolean') {
          setCanMarkToday(res.data.canMarkToday);
        }
        setLastLoadedHash(JSON.stringify(mapped.map((r: { studentId: string; status: string | null }) => ({
          studentId: r.studentId,
          status: r.status,
        }))));
      } else {
        setError(res.message || 'Failed to load attendance');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  }, [groupId, date]);

  useEffect(() => {
    if (initialGroupId) setGroupId(initialGroupId);
  }, [initialGroupId]);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = (studentId: string, status: StatusValue) => {
    if (!canEdit) return;
    setRecords((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, status } : r)),
    );
  };

  const markAll = (status: StatusValue) => {
    if (!canEdit) return;
    setRecords((prev) => prev.map((r) => ({ ...r, status })));
  };

  const save = async () => {
    if (!groupId || !canEdit) return;
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const payload = records
        .filter((r) => r.status)
        .map((r) => ({ studentId: r.studentId, status: r.status! }));
      const res = await api.teacherSaveAttendance({ groupId, date, records: payload });
      if (res.success) {
        setMessage(`Saved ${res.data?.saved ?? payload.length} record(s).`);
        await load();
      } else {
        setError(res.message || 'Save failed');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const isDirty = useMemo(() => {
    const currentHash = JSON.stringify(
      records.map((r) => ({ studentId: r.studentId, status: r.status })),
    );
    return currentHash !== lastLoadedHash;
  }, [records, lastLoadedHash]);

  if (!groupOptions.length) {
    return (
      <div className="teacher-card rounded-xl border border-warm-card-border bg-warm-card p-6 text-center text-sm text-warm-muted">
        No classes assigned for attendance.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="teacher-card space-y-3 rounded-xl border border-warm-card-border bg-warm-card p-4">
        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
          <label className="block min-w-0">
            <span className="text-xs text-warm-muted">Class</span>
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="mt-1 w-full min-w-0 rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream"
            >
              {groupOptions.map((a) => (
                <option key={a.groupId} value={a.groupId}>
                  {formatGroupLabel(a.group)}
                </option>
              ))}
            </select>
          </label>
          <div className="block min-w-0">
            <span className="text-xs text-warm-muted">Date</span>
            <p className="mt-1 rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream">
              {formatDisplayDate(today)}
            </p>
            <p className="mt-1 text-[11px] text-warm-muted">Attendance can only be marked for today.</p>
          </div>
        </div>

        {selected && (
          <p className="teacher-break-text text-xs text-warm-muted">
            {isClassTeacher ? 'Class teacher · homeroom attendance' : 'Subject teacher · class attendance'}
            {readOnly && ' · Read-only year'}
          </p>
        )}

        {!canEdit && (
          <p className="teacher-break-text text-xs text-warm-muted">
            {readOnly
              ? 'Portal is read-only for this academic year.'
              : isSunday
                ? 'Attendance is not taken on Sundays.'
                : 'Attendance cannot be marked right now.'}
          </p>
        )}

        {canEdit && (
          <div className="teacher-action-row">
            {STATUSES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => markAll(s.value)}
                className="rounded-lg border border-warm-card-border px-2.5 py-1 text-[11px] text-warm-muted hover:text-warm-cream"
              >
                All {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {isSunday && !readOnly && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-200">
          Attendance cannot be marked on Sundays.
        </div>
      )}

      {error && (
        <div className="teacher-break-text rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            <div className="teacher-split-row">
              <span className="teacher-split-row__main">{error}</span>
              <button
                type="button"
                onClick={() => void load()}
                className="teacher-split-row__aside rounded border border-red-400/30 px-2 py-1 text-[11px] text-red-200"
              >
                Retry
              </button>
            </div>
        </div>
        )}
      {message && (
        <div className="teacher-break-text rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-xs text-green-300">
          {message}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-warm-card" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {records.map((student) => (
            <div
              key={student.studentId}
              className="teacher-card rounded-xl border border-warm-card-border bg-warm-card p-3"
            >
              <div className="mb-2 min-w-0">
                <p className="teacher-card__title text-sm text-warm-cream">{student.name}</p>
                <p className="text-xs text-warm-muted">
                  Roll {student.rollNumber || '—'}
                </p>
              </div>
              <div className="teacher-action-row">
                {STATUSES.map((s) => {
                  const active = student.status === s.value;
                  return (
                    <button
                      key={s.value}
                      type="button"
                      disabled={!canEdit}
                      onClick={() => setStatus(student.studentId, s.value)}
                      className={`min-w-[2.5rem] rounded-lg border px-2 py-1.5 text-[11px] transition-colors ${active ? statusClass(s.value) : 'border-warm-card-border text-warm-muted hover:text-warm-cream'}`}
                    >
                      {s.short}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {canEdit && records.length > 0 && (
        <button
          type="button"
          disabled={saving || !isDirty}
          onClick={save}
          className="w-full rounded-lg bg-warm-accent px-4 py-2.5 text-sm font-medium text-[#1a1614] hover:bg-[#b39a76] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? 'Saving…' : isDirty ? 'Save attendance' : 'No changes to save'}
        </button>
      )}
    </div>
  );
}
