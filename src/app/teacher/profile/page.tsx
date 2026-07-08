'use client';

import { useState } from 'react';
import { TeacherPageShell } from '@/components/teacher/teacher-page-shell';
import { useTeacherBootstrap } from '@/lib/teacher/use-teacher-bootstrap';
import { api } from '@/lib/api';

export default function TeacherProfilePage() {
  const { data } = useTeacherBootstrap();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  if (!data) return null;

  const { user, teacherProfile, branch, academicYear } = data;

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    setSaving(true);
    try {
      const res = await api.changePassword(currentPassword, newPassword, confirmPassword);
      if (res.success) {
        setMessage('Password updated successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(res.message || 'Password change failed');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Password change failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <TeacherPageShell title="My Profile" subtitle="Your account and school context">
      <div className="teacher-card rounded-xl border border-warm-card-border bg-warm-card p-4">
        <dl className="teacher-dl-grid text-sm">
          <div>
            <dt className="text-xs text-warm-muted">Name</dt>
            <dd className="teacher-break-text text-warm-cream">{user.name}</dd>
          </div>
          <div>
            <dt className="text-xs text-warm-muted">Username</dt>
            <dd className="teacher-break-text text-warm-cream">{user.username || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-warm-muted">Email</dt>
            <dd className="teacher-break-text text-warm-cream">{user.email || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-warm-muted">Employee ID</dt>
            <dd className="teacher-break-text text-warm-cream">{teacherProfile.employeeId || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-warm-muted">Branch</dt>
            <dd className="teacher-break-text text-warm-cream">{branch.name}</dd>
          </div>
          <div>
            <dt className="text-xs text-warm-muted">Academic year</dt>
            <dd className="teacher-break-text text-warm-cream">
              {academicYear.label} ({academicYear.status})
            </dd>
          </div>
          <div>
            <dt className="text-xs text-warm-muted">Assignments</dt>
            <dd className="text-warm-cream">{data.portal.assignmentCount}</dd>
          </div>
          <div>
            <dt className="text-xs text-warm-muted">Portal access</dt>
            <dd className="text-warm-cream">
              {data.portal.portalAccess || (data.portal.isReadOnly ? 'Read only' : 'Full')}
            </dd>
          </div>
        </dl>
      </div>

      <form
        onSubmit={handlePasswordChange}
        className="teacher-card space-y-3 rounded-xl border border-warm-card-border bg-warm-card p-4"
      >
        <h2 className="text-sm font-medium text-warm-cream">Change password</h2>
        <label className="block min-w-0">
          <span className="text-xs text-warm-muted">Current password</span>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="mt-1 w-full min-w-0 rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream"
            autoComplete="current-password"
            required
          />
        </label>
        <label className="block min-w-0">
          <span className="text-xs text-warm-muted">New password</span>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="mt-1 w-full min-w-0 rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
        <label className="block min-w-0">
          <span className="text-xs text-warm-muted">Confirm new password</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1 w-full min-w-0 rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
        <p className="teacher-break-text text-[11px] text-warm-muted">
          At least 8 characters with one uppercase letter and one number.
        </p>
        {error && (
          <p className="teacher-break-text text-xs text-red-300">{error}</p>
        )}
        {message && (
          <p className="teacher-break-text text-xs text-green-300">{message}</p>
        )}
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-warm-accent px-4 py-2.5 text-sm font-medium text-[#1a1614] hover:bg-[#b39a76] disabled:opacity-60"
        >
          {saving ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </TeacherPageShell>
  );
}
