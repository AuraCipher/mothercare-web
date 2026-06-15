'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Plus, Users, GraduationCap, BookOpen, Search, ArrowLeft } from 'lucide-react';

export default function StudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadStudents = async () => {
    setLoading(true);
    try {
      const res = await api.getStudents({ search: search || undefined, limit: 50 });
      if (res.success) setStudents(res.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadStudents(); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadStudents();
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users size={22} className="text-warm-accent" />
          <h1 className="text-xl font-light text-warm-cream">Students</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/students/mock')}
            className="rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream transition-colors">
            View Mock Profile
          </button>
          <button onClick={() => router.push('/admin/students/new')}
            className="flex items-center gap-1.5 rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] transition-colors">
            <Plus size={14} /> Add Student
          </button>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-muted" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or admission number..."
            className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] pl-9 pr-3 py-2 text-sm text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent transition-colors" />
        </div>
      </form>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3].map(i => <div key={i} className="h-28 animate-pulse rounded-xl bg-warm-card" />)}
        </div>
      ) : students.length === 0 ? (
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-12 text-center">
          <Users size={32} className="mx-auto mb-3 text-warm-muted" />
          <p className="text-sm text-warm-muted">No students found.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {students.map(student => (
            <div key={student.id} onClick={() => router.push(`/admin/students/${student.id}`)}
              className="rounded-xl border border-warm-card-border bg-warm-card p-4 cursor-pointer hover:border-warm-accent/40 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warm-accent/10">
                  <GraduationCap size={18} className="text-warm-accent" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-warm-cream truncate">{student.name}</p>
                  <p className="text-[11px] text-warm-muted/60">{student.admissionNumber || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-warm-muted">
                {student.group && (
                  <span className="flex items-center gap-1">
                    <BookOpen size={11} className="text-warm-accent" />
                    {student.group.name}{student.group.section ? ` — ${student.group.section}` : ''}
                  </span>
                )}
                {student.rollNumber && (
                  <>
                    <span className="text-warm-muted/30">|</span>
                    <span className="text-green-400">Roll: {student.rollNumber}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
