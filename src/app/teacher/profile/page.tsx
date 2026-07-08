'use client';

import { useEffect, useState } from 'react';
import { TeacherPageShell } from '@/components/teacher/teacher-page-shell';
import { useTeacherBootstrap } from '@/lib/teacher/use-teacher-bootstrap';
import { api } from '@/lib/api';

export default function TeacherProfilePage() {
  const { data } = useTeacherBootstrap();
  const [phone, setPhone] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [address, setAddress] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const canEditProfile = data && !data.portal.isReadOnly && data.portal.canWrite;

  useEffect(() => {
    if (!data) return;
    setProfileLoading(true);
    api
      .teacherProfile()
      .then((res) => {
        if (res.success && res.data) {
          setPhone(res.data.phone || '');
          setEmergencyContact(res.data.emergencyContact || '');
          setAddress(res.data.address || '');
        }
      })
      .catch(() => {})
      .finally(() => setProfileLoading(false));
  }, [data]);

  if (!data) return null;

  const { user, teacherProfile, branch, academicYear } = data;

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditProfile) return;
    setProfileMessage('');
    setProfileError('');
    setProfileSaving(true);
    try {
      const res = await api.teacherUpdateProfile({
        phone: phone.trim() || null,
        emergencyContact: emergencyContact.trim() || null,
        address: address.trim() || null,
      });
      if (res.success) {
        setProfileMessage('Contact details saved.');
        if (res.data) {
          setPhone(res.data.phone || '');
          setEmergencyContact(res.data.emergencyContact || '');
          setAddress(res.data.address || '');
        }
      } else {
        setProfileError(res.message || 'Unable to save profile');
      }
    } catch (err: unknown) {
      setProfileError(err instanceof Error ? err.message : 'Unable to save profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage('');
    setPasswordError('');
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }
    setPasswordSaving(true);
    try {
      const res = await api.changePassword(currentPassword, newPassword, confirmPassword);
      if (res.success) {
        setPasswordMessage('Password updated successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(res.message || 'Password change failed');
      }
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : 'Password change failed');
    } finally {
      setPasswordSaving(false);
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
        onSubmit={handleProfileSave}
        className="teacher-card space-y-3 rounded-xl border border-warm-card-border bg-warm-card p-4"
      >
        <h2 className="text-sm font-medium text-warm-cream">Contact details</h2>
        {profileLoading ? (
          <div className="h-20 animate-pulse rounded-lg bg-warm-card/60" />
        ) : (
          <>
            <label className="block min-w-0">
              <span className="text-xs text-warm-muted">Phone</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={!canEditProfile}
                className="mt-1 w-full min-w-0 rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream disabled:opacity-60"
              />
            </label>
            <label className="block min-w-0">
              <span className="text-xs text-warm-muted">Emergency contact</span>
              <input
                type="text"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                disabled={!canEditProfile}
                className="mt-1 w-full min-w-0 rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream disabled:opacity-60"
              />
            </label>
            <label className="block min-w-0">
              <span className="text-xs text-warm-muted">Address</span>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={!canEditProfile}
                rows={3}
                className="mt-1 w-full min-w-0 rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream disabled:opacity-60"
              />
            </label>
            {!canEditProfile && (
              <p className="text-[11px] text-warm-muted">
                Contact details cannot be edited while the portal is read-only or frozen.
              </p>
            )}
            {profileError && (
              <p className="teacher-break-text text-xs text-red-300">{profileError}</p>
            )}
            {profileMessage && (
              <p className="teacher-break-text text-xs text-green-300">{profileMessage}</p>
            )}
            {canEditProfile && (
              <button
                type="submit"
                disabled={profileSaving}
                className="w-full rounded-lg bg-warm-accent px-4 py-2.5 text-sm font-medium text-[#1a1614] hover:bg-[#b39a76] disabled:opacity-60"
              >
                {profileSaving ? 'Saving…' : 'Save contact details'}
              </button>
            )}
          </>
        )}
      </form>

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
        {passwordError && (
          <p className="teacher-break-text text-xs text-red-300">{passwordError}</p>
        )}
        {passwordMessage && (
          <p className="teacher-break-text text-xs text-green-300">{passwordMessage}</p>
        )}
        <button
          type="submit"
          disabled={passwordSaving}
          className="w-full rounded-lg bg-warm-accent px-4 py-2.5 text-sm font-medium text-[#1a1614] hover:bg-[#b39a76] disabled:opacity-60"
        >
          {passwordSaving ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </TeacherPageShell>
  );
}
