'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ArrowLeft, Save } from 'lucide-react';
import { showToast } from '@/components/toast';

export default function CeoAdminDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    phone: '',
    employeeId: '',
    workRole: '',
    qualification: '',
    specialization: '',
    joiningDate: '',
    address: '',
    emergencyContact: '',
    bio: '',
    email: '',
    username: '',
    branchName: '',
    status: '',
  });

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.getAdminDetail(userId);
        if (!res.success || !res.data) throw new Error('Admin not found');
        const d = res.data as any;
        const p = d.profile ?? {};
        setForm({
          name: d.name ?? '',
          phone: d.phone ?? p.phone ?? '',
          employeeId: p.employeeId ?? '',
          workRole: p.workRole ?? '',
          qualification: p.qualification ?? '',
          specialization: p.specialization ?? '',
          joiningDate: p.joiningDate ? String(p.joiningDate).slice(0, 10) : '',
          address: p.address ?? '',
          emergencyContact: p.emergencyContact ?? '',
          bio: p.bio ?? '',
          email: d.email ?? '',
          username: d.username ?? '',
          branchName: d.branch?.name ?? '',
          status: d.status ?? '',
        });
      } catch (e: any) {
        setError(e.message || 'Failed to load admin');
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await api.updateAdminProfile(userId, {
        name: form.name,
        phone: form.phone || null,
        employeeId: form.employeeId || null,
        workRole: form.workRole || null,
        qualification: form.qualification || null,
        specialization: form.specialization || null,
        joiningDate: form.joiningDate || null,
        address: form.address || null,
        emergencyContact: form.emergencyContact || null,
        bio: form.bio || null,
      });
      if (res.success) showToast('success', 'Admin profile updated');
    } catch (e: any) {
      showToast('error', e.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <main className="mx-auto max-w-3xl px-6 py-10 text-sm text-warm-muted">Loading…</main>;
  }

  if (error) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-sm text-red-400">{error}</p>
      </main>
    );
  }

  const field = (label: string, key: keyof typeof form, type = 'text') => (
    <div>
      <label className="mb-1 block text-xs text-warm-muted">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent"
      />
    </div>
  );

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <button
        onClick={() => router.push('/ceo/admins')}
        className="mb-6 flex items-center gap-2 text-xs text-warm-muted hover:text-warm-cream"
      >
        <ArrowLeft size={14} /> Back to admins
      </button>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-light text-warm-cream">{form.name}</h1>
          <p className="text-sm text-warm-muted">{form.branchName} · {form.email}</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-lg bg-warm-accent px-3 py-2 text-xs font-medium text-[#1a1614] disabled:opacity-50"
        >
          <Save size={14} /> {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      <div className="grid gap-4 rounded-xl border border-warm-card-border bg-warm-card p-6 md:grid-cols-2">
        {field('Full name', 'name')}
        {field('Phone', 'phone')}
        {field('Username', 'username')}
        <div>
          <label className="mb-1 block text-xs text-warm-muted">Email</label>
          <input value={form.email} readOnly className="w-full rounded-lg border border-warm-card-border bg-[#1a1614]/50 px-3 py-2 text-sm text-warm-muted" />
        </div>
        {field('Employee ID', 'employeeId')}
        {field('Designation', 'workRole')}
        {field('Qualification', 'qualification')}
        {field('Specialization', 'specialization')}
        {field('Joining date', 'joiningDate', 'date')}
        {field('Emergency contact', 'emergencyContact')}
        <div className="md:col-span-2">{field('Address', 'address')}</div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-xs text-warm-muted">Bio</label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            rows={3}
            className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent"
          />
        </div>
      </div>
    </main>
  );
}
