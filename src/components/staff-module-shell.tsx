'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown, LogOut } from 'lucide-react';
import {
  allowedModules,
  firstAllowedPath,
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

  const modules = useMemo(() => allowedModules(access), [access]);

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
    }
    return modules[0]?.module ?? null;
  }, [access.permissions, modules, pathname]);

  useEffect(() => {
    if (!pathnameAllowed(pathname, access)) {
      router.replace(firstAllowedPath(access));
    }
  }, [access, pathname, router]);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('activeBranchId');
    localStorage.removeItem('activeAYId');
    document.cookie = 'token=; path=/; max-age=0';
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-[#141110]">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-warm-card-border bg-[#1a1614] px-4 py-3">
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
        <div className="flex items-center gap-3">
          {userName && <span className="hidden text-xs text-warm-muted sm:inline">{userName}</span>}
          <button type="button" onClick={logout} className="flex items-center gap-1 text-xs text-warm-muted hover:text-warm-cream">
            <LogOut size={14} /> Logout
          </button>
        </div>
      </header>
      <div className="mx-auto max-w-6xl">{children}</div>
    </div>
  );
}
