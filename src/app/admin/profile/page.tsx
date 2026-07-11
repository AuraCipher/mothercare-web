'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import config from '@/config';

export default function AdminProfilePage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const branchId = localStorage.getItem('activeBranchId') || '';
        const res = await fetch(`${config.apiUrl}/staff/profile?branchId=${branchId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.message || 'Failed to load profile');
        setProfile(json.data);
      } catch (e: any) {
        setError(e.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-8 text-sm text-gray-500">Loading profile…</div>;
  if (error) return <div className="p-8 text-sm text-red-600">{error}</div>;
  if (!profile) return null;

  const p = profile.profile ?? {};

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-1 text-2xl font-semibold text-gray-900">My profile</h1>
      <p className="mb-6 text-sm text-gray-500">{profile.branch?.name}</p>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div><dt className="text-xs text-gray-500">Name</dt><dd className="font-medium">{profile.name}</dd></div>
          <div><dt className="text-xs text-gray-500">Role</dt><dd className="font-medium">{profile.role}</dd></div>
          <div><dt className="text-xs text-gray-500">Email</dt><dd>{profile.email ?? '—'}</dd></div>
          <div><dt className="text-xs text-gray-500">Phone</dt><dd>{profile.phone ?? '—'}</dd></div>
          <div><dt className="text-xs text-gray-500">Employee ID</dt><dd>{p.employeeId ?? '—'}</dd></div>
          <div><dt className="text-xs text-gray-500">Designation</dt><dd>{p.workRole ?? '—'}</dd></div>
          <div><dt className="text-xs text-gray-500">Qualification</dt><dd>{p.qualification ?? '—'}</dd></div>
          <div><dt className="text-xs text-gray-500">Emergency</dt><dd>{p.emergencyContact ?? '—'}</dd></div>
          <div className="sm:col-span-2"><dt className="text-xs text-gray-500">Address</dt><dd>{p.address ?? '—'}</dd></div>
        </dl>
      </div>
    </div>
  );
}
