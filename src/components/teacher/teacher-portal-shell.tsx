'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BookOpen,
  Calendar,
  CalendarDays,
  Check,
  CheckSquare,
  ChevronDown,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Megaphone,
  MapPin,
  Menu,
  User,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';
import ToastContainer from '@/components/toast';
import { decodeJwtPayload } from '@/lib/teacher/auth-routing';
import { useTeacherBootstrap } from '@/lib/teacher/use-teacher-bootstrap';
import { academicYearBanner } from '@/lib/teacher/types';

interface BranchMember {
  id: string;
  role: string;
  branch: { id: string; name: string; code: string; isActive: boolean };
}

interface JwtUser {
  id: string;
  name: string;
  role: string;
  branchIds?: string[];
}

const NAV_ITEMS = [
  { href: '/teacher', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/teacher/my-classes', icon: BookOpen, label: 'My Classes' },
  { href: '/teacher/timetable', icon: CalendarDays, label: 'Timetable' },
  { href: '/teacher/attendance', icon: CheckSquare, label: 'Attendance' },
  { href: '/teacher/marks', icon: ClipboardList, label: 'Marks' },
  { href: '/teacher/announcements', icon: Megaphone, label: 'Announcements' },
  { href: '/teacher/profile', icon: User, label: 'Profile' },
] as const;

function isNavActive(pathname: string, href: string) {
  if (href === '/teacher') return pathname === '/teacher';
  if (href === '/teacher/my-classes') {
    return (
      pathname === href ||
      pathname.startsWith('/teacher/classes/') ||
      pathname.startsWith('/teacher/subjects/')
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function TeacherPortalShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: bootstrap, reload } = useTeacherBootstrap();

  const [user, setUser] = useState<JwtUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [branches, setBranches] = useState<BranchMember[]>([]);
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [activeAYId, setActiveAYId] = useState<string | null>(null);
  const [ayDropdownOpen, setAyDropdownOpen] = useState(false);
  const [busyApplyingAy, setBusyApplyingAy] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const payload = decodeJwtPayload(token);
    if (!payload) return;

    setUser({
      id: payload.id as string,
      name: payload.name as string,
      role: payload.role as string,
      branchIds: (payload.branchIds as string[]) || [],
    });

    const storedBranch = localStorage.getItem('activeBranchId');
    if (storedBranch && (payload.branchIds as string[] | undefined)?.includes(storedBranch)) {
      setActiveBranchId(storedBranch);
    } else if ((payload.branchIds as string[] | undefined)?.length) {
      const first = (payload.branchIds as string[])[0];
      setActiveBranchId(first);
      localStorage.setItem('activeBranchId', first);
    }

    const storedAy = localStorage.getItem('activeAYId');
    if (storedAy) setActiveAYId(storedAy);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const branchRes = await api.meBranches().catch(() => ({ success: true, data: [] as BranchMember[] }));
        if (cancelled || !branchRes.success) return;
        setBranches(branchRes.data || []);

        const branchId = localStorage.getItem('activeBranchId');
        if (!branchId) return;

        const ayRes = await api.getAcademicYears(branchId).catch(() => ({ success: false, data: [] }));
        if (cancelled || !ayRes.success) return;

        setAcademicYears(ayRes.data || []);
        const storedAy = localStorage.getItem('activeAYId');
        if (storedAy && ayRes.data?.some((a: { id: string }) => a.id === storedAy)) {
          setActiveAYId(storedAy);
        } else {
          const active = ayRes.data?.find((a: { status: string }) => a.status === 'ACTIVE');
          if (active) {
            setActiveAYId(active.id);
            localStorage.setItem('activeAYId', active.id);
            localStorage.setItem('activeAYStatus', active.status);
          }
        }
      } catch {
        /* non-critical */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSignOut = useCallback(async () => {
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
    router.push('/login');
  }, [router]);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'token' && !e.newValue) handleSignOut();
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [handleSignOut]);

  useEffect(() => {
    setMenuOpen(false);
    setBranchDropdownOpen(false);
    setAyDropdownOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setBranchDropdownOpen(false);
        setAyDropdownOpen(false);
      }
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  const activeBranch =
    branches.find((b) => b.branch.id === activeBranchId)?.branch ??
    (bootstrap ? { id: bootstrap.branch.id, name: bootstrap.branch.name, code: bootstrap.branch.code } : null);

  const activeAY = academicYears.find((a) => a.id === activeAYId);
  const ayStatus = bootstrap?.academicYear.status ?? activeAY?.status ?? null;
  const ayBanner = ayStatus ? academicYearBanner(ayStatus) : null;
  const isAyArchived = ayStatus === 'ARCHIVED';
  const isAyReadOnly = bootstrap?.portal.isReadOnly ?? isAyArchived;

  const handleSetActiveBranch = (branchId: string) => {
    setActiveBranchId(branchId);
    localStorage.setItem('activeBranchId', branchId);
    setBranchDropdownOpen(false);
    api.getAcademicYears(branchId).then((res) => {
      if (!res.success) return;
      setAcademicYears(res.data || []);
      const active = res.data?.find((a: { status: string }) => a.status === 'ACTIVE');
      if (active) {
        setActiveAYId(active.id);
        localStorage.setItem('activeAYId', active.id);
        localStorage.setItem('activeAYStatus', active.status);
      }
    });
  };

  const handleSetActiveAY = (ayId: string) => {
    setActiveAYId(ayId);
    localStorage.setItem('activeAYId', ayId);
    const ay = academicYears.find((a) => a.id === ayId);
    if (ay) localStorage.setItem('activeAYStatus', ay.status);
    setAyDropdownOpen(false);
  };

  const handleApplyAY = async () => {
    if (!activeAYId) return;
    setBusyApplyingAy(true);
    localStorage.setItem('activeAYId', activeAYId);
    if (activeAY) localStorage.setItem('activeAYStatus', activeAY.status);
    setMenuOpen(false);
    try {
      await reload();
    } finally {
      setBusyApplyingAy(false);
    }
  };

  const displayName = bootstrap?.user.name ?? user?.name;

  return (
    <div className="teacher-portal-root min-h-screen bg-[#1a1614]">
      <header className="teacher-portal-header sticky top-0 z-30 flex items-center justify-between border-b border-warm-card-border bg-[#1a1614] py-2.5 sm:py-3">
        <div className="teacher-portal-header__start flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="shrink-0 rounded-lg p-1.5 text-warm-muted transition-colors hover:bg-warm-card hover:text-warm-cream"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
          <Link href="/teacher" className="flex min-w-0 items-center gap-2">
            <GraduationCap size={16} className="shrink-0 text-warm-accent" />
            <span className="truncate text-sm font-medium text-warm-cream">Teacher</span>
          </Link>
        </div>

        <div className="teacher-portal-header__end flex items-center gap-2 sm:gap-3">
          {activeBranch && (
            <div className="hidden min-w-0 max-w-[9rem] items-center gap-1.5 text-xs text-warm-muted md:flex">
              <MapPin size={12} className="shrink-0 text-warm-accent" />
              <span className="truncate">{activeBranch.name}</span>
            </div>
          )}
          <span className="hidden max-w-[8rem] truncate text-xs text-warm-muted md:block">{displayName}</span>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-warm-accent/30 bg-warm-accent/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-warm-accent sm:px-2.5">
            <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-warm-accent" />
            <span className="hidden sm:inline">teacher</span>
          </span>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-40 transition-all duration-300 ease-out ${menuOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
      >
        <div
          className={`absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-300 ease-out ${menuOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setMenuOpen(false)}
        />
        <nav
          className={`teacher-portal-sidebar relative flex h-full flex-col border-r border-warm-card-border bg-[#24201e] transition-transform duration-300 ease-out ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4">
            <div className="mb-6 border-b border-warm-card-border pb-4">
              <p className="truncate text-sm font-medium text-warm-cream">{displayName || 'Loading…'}</p>
              <p className="mt-0.5 text-[10px] text-warm-muted">teacher</p>
              {bootstrap?.teacherProfile.employeeId && (
                <p className="mt-1 text-[10px] text-warm-muted/80">
                  ID {bootstrap.teacherProfile.employeeId}
                </p>
              )}
            </div>

            {branches.length > 0 && (
              <div className="mb-6">
                <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-warm-muted">
                  Active Branch
                </p>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
                    className="flex w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-warm-card-border bg-warm-card px-3 py-2 text-xs text-warm-cream transition-colors hover:border-warm-accent/50"
                  >
                    <span className="flex min-w-0 flex-1 items-center gap-2">
                      <MapPin size={13} className="shrink-0 text-warm-accent" />
                      <span className="truncate">{activeBranch?.name || 'Select branch…'}</span>
                    </span>
                    <ChevronDown
                      size={13}
                      className={`shrink-0 text-warm-muted transition-transform duration-200 ${branchDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {branchDropdownOpen && (
                    <div className="mt-1 rounded-lg border border-warm-card-border bg-[#2d2826] py-1 shadow-xl">
                      {branches.map((b) => (
                        <button
                          key={b.branch.id}
                          type="button"
                          onClick={() => handleSetActiveBranch(b.branch.id)}
                          className={`flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors ${
                            activeBranchId === b.branch.id
                              ? 'text-warm-accent'
                              : 'text-warm-muted hover:bg-warm-card hover:text-warm-cream'
                          }`}
                        >
                          <div className="flex min-w-0 flex-col items-start text-left">
                            <span className="teacher-dropdown-item__row">
                              {activeBranchId === b.branch.id && (
                                <Check size={12} className="shrink-0 text-warm-accent" />
                              )}
                              <span className="teacher-break-text">{b.branch.name}</span>
                            </span>
                            <span className="mt-0.5 truncate text-[9px] text-warm-muted/60">
                              {b.branch.code} · {b.role}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {academicYears.length > 0 && (
              <div className="mb-6">
                <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-warm-muted">
                  Academic Year
                </p>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setAyDropdownOpen(!ayDropdownOpen)}
                    className={`teacher-ay-trigger w-full rounded-lg border px-3 py-2 text-xs transition-colors ${
                      activeAYId
                        ? 'border-warm-card-border bg-warm-card text-warm-cream hover:border-warm-accent/50'
                        : 'border-yellow-500/30 bg-yellow-500/5 text-yellow-300 hover:border-yellow-400/50'
                    }`}
                  >
                    <span className="teacher-ay-trigger__content">
                      <Calendar
                        size={13}
                        className={`shrink-0 ${activeAYId ? 'text-warm-accent' : 'text-yellow-400'}`}
                      />
                      <span className="teacher-ay-trigger__label">
                        {bootstrap?.academicYear.label || activeAY?.calendar?.label || '— Select Year —'}
                      </span>
                      {isAyArchived && (
                        <span className="teacher-ay-trigger__badge text-[9px] text-yellow-400">(Archived)</span>
                      )}
                      {isAyReadOnly && !isAyArchived && (
                        <span className="teacher-ay-trigger__badge text-[9px] text-yellow-400">(Read only)</span>
                      )}
                    </span>
                    <ChevronDown
                      size={13}
                      className={`shrink-0 text-warm-muted transition-transform duration-200 ${ayDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {ayDropdownOpen && (
                    <div className="mt-1 max-h-48 overflow-y-auto rounded-lg border border-warm-card-border bg-[#2d2826] py-1 shadow-xl">
                      {academicYears.map((ay) => (
                        <button
                          key={ay.id}
                          type="button"
                          onClick={() => handleSetActiveAY(ay.id)}
                          className={`flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors ${
                            activeAYId === ay.id
                              ? 'text-warm-accent'
                              : 'text-warm-muted hover:bg-warm-card hover:text-warm-cream'
                          }`}
                        >
                          <div className="flex min-w-0 flex-col items-start text-left">
                            <span className="teacher-dropdown-item__row">
                              {activeAYId === ay.id && (
                                <Check size={12} className="shrink-0 text-warm-accent" />
                              )}
                              <span>{ay.calendar?.label}</span>
                              <span
                                className={`text-[9px] ${
                                  ay.status === 'ACTIVE'
                                    ? 'text-green-400'
                                    : ay.status === 'ARCHIVED'
                                      ? 'text-yellow-400'
                                      : 'text-gray-400'
                                }`}
                              >
                                ({ay.status.replace('_', ' ')})
                              </span>
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {activeAYId && (
                  <button
                    type="button"
                    onClick={handleApplyAY}
                    disabled={busyApplyingAy}
                    className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-warm-accent px-3 py-2 text-xs font-medium text-[#1a1614] transition-colors hover:bg-[#b39a76] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Check size={13} /> {busyApplyingAy ? 'Applying…' : 'Apply year'}
                  </button>
                )}
              </div>
            )}

            <p className="mb-4 text-[10px] font-medium uppercase tracking-wider text-warm-muted">
              Navigation
            </p>
            <div className="space-y-0.5">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isNavActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs transition-colors ${
                      active
                        ? 'bg-warm-accent/10 text-warm-cream'
                        : 'text-warm-muted hover:bg-warm-card hover:text-warm-cream'
                    }`}
                  >
                    <Icon size={14} className="text-warm-accent" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="border-t border-warm-card-border p-3">
            <button
              type="button"
              onClick={handleSignOut}
              className="mb-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-warm-muted transition-colors hover:bg-warm-card hover:text-red"
            >
              <LogOut size={14} /> Sign Out
            </button>
            <Link
              href="/teacher/profile"
              onClick={() => setMenuOpen(false)}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-warm-muted transition-colors hover:bg-warm-card hover:text-warm-cream"
            >
              <User size={14} /> Profile
            </Link>
          </div>
        </nav>
      </div>

      {ayBanner && (
        <div className="teacher-portal-banner border-b border-yellow-500/20 bg-yellow-500/10 py-2 text-center text-xs text-yellow-200">
          {ayBanner}
        </div>
      )}

      <main className="teacher-portal-main">{children}</main>

      {ayStatus === 'BUILD_STAGE' && (
        <div className="teacher-portal-build-pill fixed bottom-3 z-20 rounded-full border border-blue-500/30 bg-blue-500/10 py-1 text-[11px] text-blue-200">
          BUILD_STAGE year active in selector (preview/setup mode)
        </div>
      )}

      <ToastContainer />
    </div>
  );
}
