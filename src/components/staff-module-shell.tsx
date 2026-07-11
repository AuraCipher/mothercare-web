'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Calendar, ChevronDown, Check, LogOut } from 'lucide-react';
import { api } from '@/lib/api';
import DocNav from '@/components/doc-nav';
import { DocsHelpLink } from '@/components/docs/help-link';
import { filterAcademicYearsForAccess } from '@/lib/ay-access';
import {
  allowedModules,
  canAccessArchivedAy,
  firstAllowedPath,
  isAyReadOnlyForPath,
  moduleDefaultPath,
  moduleLabel,
  pathnameAllowed,
  type StaffAccess,
} from '@/lib/staff-permissions';

type Props = {
  access: StaffAccess;
  userName?: string;
  children: React.ReactNode;
};

export function StaffModuleShell({ access, userName, children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [ayOpen, setAyOpen] = useState(false);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [activeAYId, setActiveAYId] = useState<string | null>(null);
  const [activeAYStatus, setActiveAYStatus] = useState<string | null>(null);

  const modules = useMemo(() => allowedModules(access), [access]);
  const visibleYears = useMemo(
    () => filterAcademicYearsForAccess(academicYears, access),
    [academicYears, access],
  );
  const showAySwitcher = canAccessArchivedAy(access) && visibleYears.length > 1;

  const activeModule = useMemo(() => {
    for (const p of modules) {
      const base = moduleDefaultPath(p.module, access.permissions);
      if (pathname === base || pathname.startsWith(`${base}/`)) return p.module;
      if (p.module === 'STUDENTS' && pathname.startsWith('/admin/students') && !pathname.startsWith('/admin/students/operations')) {
        return p.module;
      }
      if (p.module === 'OPERATIONS' && pathname.startsWith('/admin/students/operations')) return p.module;
      if (p.module === 'FEES' && pathname.startsWith('/admin/fees')) return p.module;
      if (p.module === 'RESULT' && pathname.startsWith('/admin/result')) return p.module;
      if (p.module === 'CANTEEN' && pathname.startsWith('/admin/canteen')) return p.module;
      if (p.module === 'STATIONARY' && pathname.startsWith('/admin/stationary')) return p.module;
      if (p.module === 'EXPENSES' && pathname.startsWith('/admin/expenses')) return p.module;
    }
    return modules[0]?.module ?? null;
  }, [access.permissions, modules, pathname]);

  const readOnlyAy = isAyReadOnlyForPath(access, pathname, activeAYStatus);

  useEffect(() => {
    if (!pathnameAllowed(pathname, access)) {
      router.replace(firstAllowedPath(access));
    }
  }, [access, pathname, router]);

  useEffect(() => {
    const branchId = localStorage.getItem('activeBranchId') || access.branchId;
    if (!branchId) return;
    api.getAcademicYears(branchId).then((res) => {
      if (!res.success) return;
      const years = res.data || [];
      setAcademicYears(years);
      const stored = localStorage.getItem('activeAYId');
      const filtered = filterAcademicYearsForAccess(years, access);
      const pick = filtered.find((y: any) => y.id === stored) || filtered.find((y: any) => y.status === 'ACTIVE') || filtered[0];
      if (pick) {
        setActiveAYId(pick.id);
        setActiveAYStatus(pick.status);
      }
    }).catch(() => {});
  }, [access]);

  const applyAy = (ay: { id: string; status: string }) => {
    setActiveAYId(ay.id);
    setActiveAYStatus(ay.status);
    localStorage.setItem('activeAYId', ay.id);
    localStorage.setItem('activeAYStatus', ay.status);
    setAyOpen(false);
    window.location.reload();
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('activeBranchId');
    localStorage.removeItem('activeAYId');
    localStorage.removeItem('activeAYStatus');
    document.cookie = 'token=; path=/; max-age=0';
    router.push('/login');
  };

  const activeAy = visibleYears.find((y) => y.id === activeAYId);

  return (
    <div className="min-h-screen bg-[#141110]">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-warm-card-border bg-[#1a1614] px-4 py-3">
        <div className="flex items-center gap-2">
          {showAySwitcher && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setAyOpen((o) => !o)}
                className="flex items-center gap-2 rounded-lg border border-warm-card-border px-2.5 py-1.5 text-xs text-warm-cream hover:border-warm-accent"
              >
                <Calendar size={13} className="text-warm-accent" />
                <span>{activeAy?.calendar?.label || 'Year'}</span>
                {readOnlyAy && <span className="text-[9px] text-yellow-400">(archived)</span>}
                <ChevronDown size={12} />
              </button>
              {ayOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setAyOpen(false)} aria-hidden />
                  <ul className="absolute left-0 top-full z-50 mt-1 max-h-56 min-w-[200px] overflow-y-auto rounded-lg border border-warm-card-border bg-[#24201e] py-1 shadow-xl">
                    {visibleYears.map((ay: any) => (
                      <li key={ay.id}>
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-warm-cream hover:bg-warm-card"
                          onClick={() => applyAy(ay)}
                        >
                          {activeAYId === ay.id && <Check size={12} className="text-warm-accent" />}
                          <span>{ay.calendar?.label}</span>
                          <span className="text-[9px] text-warm-muted">({ay.status.replace('_', ' ')})</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
          <div className="relative">
            {modules.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => setMenuOpen((o) => !o)}
                  className="flex items-center gap-2 rounded-lg border border-warm-card-border px-3 py-2 text-sm text-warm-cream hover:border-warm-accent"
                >
                  {activeModule ? moduleLabel(activeModule) : 'Module'}
                  <ChevronDown size={14} className="text-warm-muted" />
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} aria-hidden />
                    <ul className="absolute left-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border border-warm-card-border bg-[#24201e] py-1 shadow-xl">
                      {modules.map((p) => (
                        <li key={p.module}>
                          <button
                            type="button"
                            className="block w-full px-4 py-2 text-left text-xs text-warm-cream hover:bg-warm-card"
                            onClick={() => {
                              setMenuOpen(false);
                              router.push(moduleDefaultPath(p.module, access.permissions));
                            }}
                          >
                            {moduleLabel(p.module)}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </>
            ) : (
              <span className="text-sm font-medium text-warm-cream">
                {activeModule ? moduleLabel(activeModule) : 'Staff'}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <DocsHelpLink />
          {userName && <span className="hidden text-xs text-warm-muted sm:inline">{userName}</span>}
          <DocNav />
          <button type="button" onClick={logout} className="flex items-center gap-1 text-xs text-warm-muted hover:text-warm-cream">
            <LogOut size={14} /> Logout
          </button>
        </div>
      </header>
      {readOnlyAy && (
        <div className="border-b border-yellow-500/20 bg-yellow-500/10 px-4 py-2 text-center text-[11px] text-yellow-300">
          Viewing archived academic year — edits require archived-year permissions.
        </div>
      )}
      {activeAYStatus === 'BUILD_STAGE' && (
        <div className="border-b border-blue-500/20 bg-blue-500/10 px-4 py-2 text-center text-[11px] text-blue-200">
          BUILD_STAGE selected — this year is in setup mode and not published yet.
        </div>
      )}
      <div className="mx-auto max-w-6xl">{children}</div>
    </div>
  );
}
