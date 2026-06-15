'use client';

import { useRouter } from 'next/navigation';
import { BookOpen, GraduationCap, Plus, Users } from 'lucide-react';

const mockStudents = [
  {
    id: 'stu-001',
    name: 'Ali Hassan',
    rollNumber: '012',
    admissionNumber: 'MCS-2026-0042',
    gender: 'male',
    status: 'ACTIVE',
    class: { name: 'Class 5', section: 'A' },
  },
  {
    id: 'stu-002',
    name: 'Fatima Ahmed',
    rollNumber: '008',
    admissionNumber: 'MCS-2026-0038',
    gender: 'female',
    status: 'ACTIVE',
    class: { name: 'Class 4', section: 'B' },
  },
  {
    id: 'stu-003',
    name: 'Usman Khan',
    rollNumber: '015',
    admissionNumber: 'MCS-2026-0045',
    gender: 'male',
    status: 'ACTIVE',
    class: { name: 'Class 3', section: 'A' },
  },
];

export default function StudentsPage() {
  const router = useRouter();

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      {/* Header */}
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
          <button className="flex items-center gap-1.5 rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] transition-colors">
            <Plus size={14} /> Add Student
          </button>
        </div>
      </div>

      {/* Student cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mockStudents.map(student => (
          <div key={student.id} onClick={() => router.push(`/admin/students/mock`)}
            className="rounded-xl border border-warm-card-border bg-warm-card p-4 cursor-pointer hover:border-warm-accent/40 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warm-accent/10">
                <GraduationCap size={18} className="text-warm-accent" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-warm-cream truncate">{student.name}</p>
                <p className="text-[11px] text-warm-muted/60">{student.admissionNumber}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-warm-muted">
              <span className="flex items-center gap-1">
                <BookOpen size={11} className="text-warm-accent" />
                {student.class.name} — {student.class.section}
              </span>
              <span className="text-warm-muted/30">|</span>
              <span className="text-green-400">Roll No: {student.rollNumber}</span>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
