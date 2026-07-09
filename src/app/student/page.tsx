'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { StudentPageShell } from '@/components/student/student-page-shell';
import { api } from '@/lib/api';
import { useStudentBootstrap } from '@/lib/student/use-student-bootstrap';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function StudentHomePage() {
  const { data } = useStudentBootstrap();
  const [todaySlots, setTodaySlots] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [attendancePct, setAttendancePct] = useState<number | null>(null);
  const [feeBalance, setFeeBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!data) return;
    api.studentTimetable().then((res) => {
      if (!res.success || !res.data) return;
      const day = new Date().getDay();
      const rawSlots = (res.data.slots ?? []) as Array<{ dayOfWeek: number | null }>;
      const slots = rawSlots.filter((s) => s.dayOfWeek == null || s.dayOfWeek === day);
      setTodaySlots(slots.slice(0, 4));
    }).catch(() => {});
    api.studentAnnouncements().then((res) => {
      if (res.success) setAnnouncements((res.data || []).slice(0, 3));
    }).catch(() => {});
    api.studentAttendance().then((res) => {
      if (res.success) setAttendancePct(res.data?.summary?.percentage ?? null);
    }).catch(() => {});
    api.studentFees().then((res) => {
      if (res.success) setFeeBalance(res.data?.summary?.balanceDuePaise ?? null);
    }).catch(() => {});
  }, [data]);

  const todayLabel = DAY_NAMES[new Date().getDay()];
  const quickLinks = useMemo(() => {
    const links = [
      { href: '/student/timetable', label: 'Timetable' },
      { href: '/student/datesheets', label: 'Datesheets' },
      { href: '/student/fees', label: 'Fees' },
      { href: '/student/attendance', label: 'Attendance' },
      { href: '/student/results', label: 'Results' },
      { href: '/student/announcements', label: 'Announcements' },
    ];
    if (data?.features.showCanteen) {
      links.push({ href: '/student/canteen', label: 'Canteen' });
    }
    return links;
  }, [data]);

  if (!data) return null;

  return (
    <StudentPageShell
      title={`Hello, ${data.student.name.split(' ')[0]}`}
      subtitle="Your school information — read only"
    >
      <div className="teacher-stat-grid mb-6">
        <div className="teacher-card rounded-xl border border-warm-card-border bg-warm-card p-4">
          <p className="text-xs text-warm-muted">Class</p>
          <p className="mt-1 text-lg text-warm-cream">{data.student.groupLabel || '—'}</p>
        </div>
        <div className="teacher-card rounded-xl border border-warm-card-border bg-warm-card p-4">
          <p className="text-xs text-warm-muted">Attendance</p>
          <p className="mt-1 text-lg text-warm-cream">
            {attendancePct != null ? `${attendancePct}%` : '—'}
          </p>
        </div>
        <div className="teacher-card rounded-xl border border-warm-card-border bg-warm-card p-4">
          <p className="text-xs text-warm-muted">Fee balance</p>
          <p className="mt-1 text-lg text-warm-cream">
            {feeBalance != null ? `Rs ${(feeBalance / 100).toLocaleString()}` : '—'}
          </p>
        </div>
      </div>

      {todaySlots.length > 0 && (
        <section className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-medium text-warm-cream">Today — {todayLabel}</h2>
            <Link href="/student/timetable" className="text-xs text-warm-muted underline">
              Full timetable
            </Link>
          </div>
          <ul className="teacher-card divide-y divide-warm-card-border rounded-xl border border-warm-card-border bg-warm-card">
            {todaySlots.map((slot, i) => (
              <li key={i} className="flex items-center justify-between gap-2 px-4 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="truncate text-warm-cream">
                    {slot.subject?.name || 'Period'}
                    {slot.teacher?.name ? ` · ${slot.teacher.name}` : ''}
                  </p>
                  <p className="text-xs text-warm-muted">
                    P{slot.lectureNumber} · {slot.startTime}–{slot.endTime}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {announcements.length > 0 && (
        <section className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-medium text-warm-cream">Announcements</h2>
            <Link href="/student/announcements" className="text-xs text-warm-muted underline">
              See all
            </Link>
          </div>
          <ul className="space-y-2">
            {announcements.map((a) => (
              <li
                key={a.id}
                className="teacher-card rounded-xl border border-warm-card-border bg-warm-card px-4 py-3"
              >
                <p className="text-sm font-medium text-warm-cream">{a.title}</p>
                {a.content && (
                  <p className="mt-1 line-clamp-2 text-xs text-warm-muted">{a.content}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-medium text-warm-cream">Quick links</h2>
        <div className="flex flex-wrap gap-2">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg border border-warm-card-border bg-warm-card px-3 py-2 text-xs text-warm-cream hover:border-warm-muted/40"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </section>
    </StudentPageShell>
  );
}
