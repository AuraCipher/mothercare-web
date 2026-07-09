'use client';

import { useCallback, useEffect, useState } from 'react';
import { StudentPageShell } from '@/components/student/student-page-shell';
import { api } from '@/lib/api';

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.studentProfile();
      if (res.success) setProfile(res.data);
      else setError(res.message || 'Failed to load profile');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <StudentPageShell title="Profile" subtitle="Your school record (read-only)">
      {loading && (
        <div className="h-32 animate-pulse rounded-xl bg-warm-card" />
      )}

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {profile && (
        <dl className="teacher-card divide-y divide-warm-card-border rounded-xl border border-warm-card-border bg-warm-card">
          {[
            ['Name', profile.name],
            ['Roll number', profile.rollNumber || '—'],
            ['Class', profile.group?.label || '—'],
            ['Academic year', profile.academicYear?.label || '—'],
            ['Username', profile.username || '—'],
            ['Email', profile.email || '—'],
            [
              'Admission date',
              profile.admissionDate
                ? new Date(profile.admissionDate).toLocaleDateString()
                : '—',
            ],
          ].map(([label, value]) => (
            <div key={label} className="flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:justify-between">
              <dt className="text-xs text-warm-muted">{label}</dt>
              <dd className="text-sm text-warm-cream">{value}</dd>
            </div>
          ))}
        </dl>
      )}
    </StudentPageShell>
  );
}
