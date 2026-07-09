'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  CalendarDays,
  CheckSquare,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Receipt,
  User,
  UtensilsCrossed,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { api } from '@/lib/api';
import ToastContainer from '@/components/toast';
import { decodeJwtPayload } from '@/lib/teacher/auth-routing';
import { useStudentBootstrap } from '@/lib/student/use-student-bootstrap';
import { academicYearBanner } from '@/lib/student/types';

interface JwtUser {
  id: string;
  name: string;
  role: string;
}

const BASE_NAV = [
  { href: '/student', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/student/timetable', icon: CalendarDays, label: 'Timetable' },
  { href: '/student/datesheets', icon: FileSpreadsheet, label: 'Datesheets' },
  { href: '/student/fees', icon: Receipt, label: 'Fees' },
  { href: '/student/attendance', icon: CheckSquare, label: 'Attendance' },
  { href: '/student/results', icon: GraduationCap, label: 'Results' },
  { href: '/student/announcements', icon: Megaphone, label: 'Announcements' },
  { href: '/student/profile', icon: User, label: 'Profile' },
] as const;

function isNavActive(pathname: string, href: string) {
  if (href === '/student') return pathname === '/student';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function StudentPortalShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: bootstrap } = useStudentBootstrap();

  const [user, setUser] = useState<JwtUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const payload = decodeJwtPayload(token);
    if (!payload) return;
    setUser({
      id: payload.id as string,
      name: payload.name as string,
      role: payload.role as string,
    });
  }, []);

  const navItems = bootstrap?.features.showCanteen
    ? [
        ...BASE_NAV.slice(0, 7),
        { href: '/student/canteen', icon: UtensilsCrossed, label: 'Canteen' },
        ...BASE_NAV.slice(7),
      ]
    : [...BASE_NAV];

  const handleLogout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      /* ignore */
    }
    localStorage.removeItem('token');
    localStorage.removeItem('activeBranchId');
    localStorage.removeItem('activeAYId');
    localStorage.removeItem('activeAYStatus');
    document.cookie = 'token=; path=/; max-age=0';
    router.replace('/login');
  }, [router]);

  const ayBanner =
    bootstrap &&
    academicYearBanner(bootstrap.academicYear.status, bootstrap.academicYear.label);

  return (
    <div className="teacher-portal-root flex min-h-screen flex-col bg-[#1a1614] text-warm-cream">
      <header className="teacher-portal-header sticky top-0 z-40 flex items-center justify-between border-b border-warm-card-border bg-[#1a1614]/95 px-3 py-3 backdrop-blur sm:px-4">
        <div className="teacher-portal-header__start flex min-w-0 items-center gap-2">
          <button
            type="button"
            className="rounded-lg p-2 text-warm-muted hover:bg-warm-card hover:text-warm-cream lg:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-warm-cream">
              {bootstrap?.branch.name || 'Student Portal'}
            </p>
            <p className="truncate text-[11px] text-warm-muted">
              {bootstrap?.academicYear.label || 'Loading…'}
            </p>
          </div>
        </div>
        <div className="teacher-portal-header__end flex items-center gap-2">
          <span className="hidden max-w-[8rem] truncate text-xs text-warm-muted sm:inline">
            {user?.name}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg p-2 text-warm-muted hover:bg-warm-card hover:text-warm-cream"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {ayBanner && (
        <div className="border-b border-amber-500/20 bg-amber-500/10 px-4 py-2 text-center text-xs text-amber-200">
          {ayBanner}
        </div>
      )}

      <div className="teacher-portal-main flex flex-1 min-h-0">
        <aside className="hidden w-56 shrink-0 border-r border-warm-card-border bg-[#141210] lg:block">
          <nav className="sticky top-[57px] space-y-0.5 p-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isNavActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    active
                      ? 'bg-warm-card text-warm-cream'
                      : 'text-warm-muted hover:bg-warm-card/60 hover:text-warm-cream'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="teacher-portal-main flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          />
          <div className="absolute left-0 top-0 flex h-full w-[min(18rem,85vw)] flex-col bg-[#141210] shadow-xl">
            <div className="flex items-center justify-between border-b border-warm-card-border px-4 py-3">
              <span className="text-sm font-medium">Menu</span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="rounded p-1 text-warm-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isNavActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`mb-0.5 flex items-center gap-2.5 rounded-lg px-3 py-3 text-sm ${
                      active ? 'bg-warm-card text-warm-cream' : 'text-warm-muted'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
}
