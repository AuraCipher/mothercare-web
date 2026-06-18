'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Plus, Users, GraduationCap, BookOpen, Search, Filter, LayoutGrid, Menu } from 'lucide-react';

export default function StudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [groupId, setGroupId] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [sections, setSections] = useState<any[]>([]);
  const [expandedView, setExpandedView] = useState(false);

  // Restore view preference
  useEffect(() => {
    const saved = localStorage.getItem('studentViewMode');
    if (saved === 'expanded') setExpandedView(true);
  }, []);

  const toggleView = () => {
    const next = !expandedView;
    setExpandedView(next);
    localStorage.setItem('studentViewMode', next ? 'expanded' : 'grid');
  };

  const branchId = typeof window !== 'undefined' ? localStorage.getItem('activeBranchId') : null;
  const ayId = typeof window !== 'undefined' ? localStorage.getItem('activeAYId') : null;

  const loadStudents = async () => {
    setLoading(true);
    try {
      const res = await api.getStudents({
        search: search || undefined,
        groupId: groupId || undefined,
        rollNumber: rollNumber || undefined,
        limit: 50,
      });
      if (res.success) setStudents(res.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadStudents(); }, [groupId, rollNumber]);

  // Load sections for filter dropdown
  useEffect(() => {
    if (branchId && ayId) {
      api.getSections(branchId, ayId).then(d => { if (d.success) setSections(d.data); }).catch(() => {});
    }
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users size={22} className="text-warm-accent" />
          <h1 className="text-xl font-light text-warm-cream">Students</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push('/admin/students/new')}
            className="flex items-center gap-1.5 rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] transition-colors">
            <Plus size={14} /> Add Student
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-muted" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or admission..."
            className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] pl-9 pr-3 py-2 text-sm text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent transition-colors" />
        </div>
        <div className="min-w-[160px]">
          <select value={groupId} onChange={(e) => setGroupId(e.target.value)}
            className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent transition-colors">
            <option value="">All Classes</option>
            {sections.map((s: any) => (
              <option key={s.id} value={s.id}>{s.name}{s.section ? ` — ${s.section}` : ''}</option>
            ))}
          </select>
        </div>
        <div className="min-w-[130px]">
          <input type="text" value={rollNumber} onChange={(e) => setRollNumber(e.target.value)}
            placeholder="Roll no."
            className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent transition-colors" />
        </div>
        <button onClick={loadStudents}
          className="flex items-center gap-1.5 rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream transition-colors">
          <Filter size={13} /> Filter
        </button>
        <button onClick={toggleView} title={expandedView ? 'Grid view' : 'Expanded view'}
          className={`ml-auto rounded-lg border p-2 transition-colors ${expandedView ? 'border-warm-accent/50 text-warm-accent' : 'border-warm-card-border text-warm-muted hover:border-warm-accent/50 hover:text-warm-cream'}`}>
          {expandedView ? <LayoutGrid size={15} /> : <Menu size={15} />}
        </button>
      </div>

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
        <div className={`grid gap-4 ${expandedView ? 'grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
          {students.map((student, idx) => (
            <div key={student.id} onClick={() => router.push(`/admin/students/${student.id}`)}
              className={`rounded-xl border border-warm-card-border bg-warm-card p-4 cursor-pointer hover:border-warm-accent/40 transition-colors ${expandedView ? 'col-span-2' : ''}`}>
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-warm-accent/10">
                  <GraduationCap size={20} className="text-warm-accent" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-warm-cream truncate">{student.name}</p>
                  <p className="text-xs text-warm-muted/60 mt-0.5">{student.admissionNumber || '—'}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-warm-muted">
                    {student.group && (
                      <span className="flex items-center gap-1">
                        <BookOpen size={11} className="text-warm-accent" />
                        {student.group.name}{student.group.section ? ` — ${student.group.section}` : ''}
                      </span>
                    )}
                    {student.rollNumber && (
                      <span className="text-green-400">{student.gender === 'male' ? '♂' : student.gender === 'female' ? '♀' : ''} Roll: {student.rollNumber}</span>
                    )}
                    {student.phone && <span>📞 {student.phone}</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {/* Empty column in expanded view for extra content */}
          {expandedView && students.map((_, idx) => (
            <div key={`extra-${idx}`} className="rounded-xl border border-dashed border-warm-card-border/30 p-4 min-h-[80px] flex items-center justify-center">
              <p className="text-[10px] text-warm-muted/30"></p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
