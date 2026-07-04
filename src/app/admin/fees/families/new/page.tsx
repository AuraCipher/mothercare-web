'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { showToast } from '@/components/toast';
import { ArrowLeft, Search, Users } from 'lucide-react';
import config from '@/config';

export default function NewFamilyPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const ayId = typeof window !== 'undefined' ? localStorage.getItem('activeAYId') : null;

  const loadStudents = useCallback(async (q: string) => {
    if (!token || !ayId) return;
    try {
      const params = new URLSearchParams({ academicYearId: ayId });
      if (q.trim()) params.set('search', q.trim());
      const res = await fetch(`${config.apiUrl}/admin/families/students-picker?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setStudents(json.data);
    } catch {
      showToast('error', 'Failed to load students');
    }
  }, [token, ayId]);

  useEffect(() => {
    const t = setTimeout(() => loadStudents(studentSearch), 300);
    return () => clearTimeout(t);
  }, [studentSearch, loadStudents]);

  const toggleStudent = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!name.trim()) { showToast('error', 'Family name is required'); return; }
    if (selectedIds.size === 0) { showToast('error', 'Select at least one student'); return; }

    setSubmitting(true);
    try {
      const res = await fetch(`${config.apiUrl}/admin/families`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          fatherName: fatherName.trim() || undefined,
          motherName: motherName.trim() || undefined,
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
          studentIds: Array.from(selectedIds),
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('success', 'Family created');
        router.push(`/admin/fees/families/${json.data.id}`);
      } else {
        showToast('error', json.message || 'Failed to create family');
      }
    } catch {
      showToast('error', 'Failed to create family');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <button
        onClick={() => router.push('/admin/fees/families')}
        className="mb-4 inline-flex items-center gap-1 text-[11px] text-warm-muted/60 hover:text-warm-cream"
      >
        <ArrowLeft size={12} /> Back to Families
      </button>

      <div className="mb-6 flex items-center gap-3">
        <Users size={22} className="text-warm-accent" />
        <h1 className="text-xl font-light text-warm-cream">New Family</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-5 space-y-3">
          <h2 className="text-xs font-medium text-warm-cream mb-1">Family Details</h2>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Family name (required) *"
            className="w-full rounded-lg border border-warm-card-border bg-warm-bg/50 px-3 py-2 text-xs text-warm-cream placeholder:text-warm-muted/40 focus:border-warm-accent/50 focus:outline-none"
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              value={fatherName}
              onChange={e => setFatherName(e.target.value)}
              placeholder="Father name"
              className="rounded-lg border border-warm-card-border bg-warm-bg/50 px-3 py-2 text-xs text-warm-cream placeholder:text-warm-muted/40 focus:border-warm-accent/50 focus:outline-none"
            />
            <input
              value={motherName}
              onChange={e => setMotherName(e.target.value)}
              placeholder="Mother name"
              className="rounded-lg border border-warm-card-border bg-warm-bg/50 px-3 py-2 text-xs text-warm-cream placeholder:text-warm-muted/40 focus:border-warm-accent/50 focus:outline-none"
            />
          </div>
          <input
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="Phone"
            className="w-full rounded-lg border border-warm-card-border bg-warm-bg/50 px-3 py-2 text-xs text-warm-cream placeholder:text-warm-muted/40 focus:border-warm-accent/50 focus:outline-none"
          />
          <textarea
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder="Address"
            rows={2}
            className="w-full rounded-lg border border-warm-card-border bg-warm-bg/50 px-3 py-2 text-xs text-warm-cream placeholder:text-warm-muted/40 focus:border-warm-accent/50 focus:outline-none resize-none"
          />
        </div>

        <div className="rounded-xl border border-warm-card-border bg-warm-card p-5">
          <h2 className="text-xs font-medium text-warm-cream mb-3">Select Students</h2>
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-muted/40" />
            <input
              value={studentSearch}
              onChange={e => setStudentSearch(e.target.value)}
              placeholder="Search students by name or roll…"
              className="w-full rounded-lg border border-warm-card-border bg-warm-bg/50 py-2 pl-9 pr-3 text-xs text-warm-cream placeholder:text-warm-muted/40 focus:border-warm-accent/50 focus:outline-none"
            />
          </div>
          <div className="max-h-64 overflow-y-auto space-y-1">
            {students.length === 0 ? (
              <p className="text-[11px] text-warm-muted/50 py-4 text-center">No unassigned students found</p>
            ) : students.map(s => {
              const cls = [s.group?.name, s.group?.section].filter(Boolean).join(' — ');
              const checked = selectedIds.has(s.id);
              return (
                <label
                  key={s.id}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 cursor-pointer transition-colors ${checked ? 'bg-warm-accent/10 border border-warm-accent/30' : 'hover:bg-warm-bg/30 border border-transparent'}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleStudent(s.id)}
                    className="accent-warm-accent"
                  />
                  <div className="min-w-0">
                    <p className="text-xs text-warm-cream truncate">{s.name}</p>
                    <p className="text-[10px] text-warm-muted/50">{cls || '—'}{s.rollNumber ? ` · Roll ${s.rollNumber}` : ''}</p>
                  </div>
                </label>
              );
            })}
          </div>
          {selectedIds.size > 0 && (
            <p className="mt-3 text-[10px] text-warm-accent">{selectedIds.size} student{selectedIds.size !== 1 ? 's' : ''} selected</p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-warm-accent/20 py-2.5 text-xs text-warm-accent hover:bg-warm-accent/30 disabled:opacity-50 transition-colors"
        >
          {submitting ? 'Creating…' : 'Create Family'}
        </button>
      </form>
    </main>
  );
}
