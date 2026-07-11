'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import ToastContainer from '@/components/toast';
import { DocsHelpLink } from '@/components/docs/help-link';
import {
  LogOut, LayoutDashboard, Building2, Menu, X,
  ChevronDown, Check, MapPin, Users, Key,
} from 'lucide-react';

/* ── Decode JWT payload client-side (no library needed) ── */
function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(atob(parts[1]));
  } catch { return null; }
}

/* ── Types ── */
interface BranchMember {
  id: string;
  role: string;
  branch: { id: string; name: string; code: string; isActive: boolean };
}

interface UserData {
  id: string; name: string; role: string; email?: string; branchIds?: string[];
}

/* ── CEO nav items ── */
const navItems = [
  { href: '/ceo', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/ceo/branches', icon: Building2, label: 'Branches' },
  { href: '/ceo/admins', icon: Users, label: 'Admins' },
  { href: '/ceo/keys', icon: Key, label: 'API Keys' },
];

/* ── Layout ── */
export default function CeoLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<UserData | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const [branches, setBranches] = useState<BranchMember[]>([]);
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }

    // Use JWT payload directly — no background verification
    const payload = decodeJwtPayload(token);
    if (!payload) { clearAuth(); return; }

    // Guard: only super_admin can access /ceo
    if (payload.role !== 'super_admin') {
      router.replace('/admin');
      return;
    }

    setUser({ id: payload.id, name: payload.name, role: payload.role, branchIds: payload.branchIds || [] });
    const stored = localStorage.getItem('activeBranchId');
    if (stored && (payload.branchIds || []).includes(stored)) {
      setActiveBranchId(stored);
    } else if (payload.branchIds?.length) {
      setActiveBranchId(payload.branchIds[0]);
      localStorage.setItem('activeBranchId', payload.branchIds[0]);
    } else {
      localStorage.removeItem('activeBranchId');
    }
    setLoadingUser(false);

    // Fetch branches list in background (non-critical)
    let cancelled = false;
    (async () => {
      try {
        const branchRes = await api.meBranches().catch(() => ({ success: true, data: [] as any[] }));
        if (cancelled || !branchRes.success) return;
        setBranches(branchRes.data || []);
      } catch {
        clearAuth();
      } finally {
        if (!cancelled) setLoadingUser(false);
      }
    })();
    return () => { cancelled = true; };
  }, [router]);

  // Cross-tab logout sync: if token is removed from localStorage in another tab,
  // immediately log out this tab too.
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'token' && !e.newValue) clearAuth();
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  });

  function clearAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('activeBranchId');
    document.cookie = 'token=; path=/; max-age=0';
    router.push('/login');
  }

  const activeBranch = branches.find(b => b.branch.id === activeBranchId);
  const handleSetActiveBranch = (branchId: string) => {
    setActiveBranchId(branchId);
    localStorage.setItem('activeBranchId', branchId);
    setBranchDropdownOpen(false);
  };

  const handleSignOut = async () => {
    try { await api.logout(); } catch {}
    clearAuth();
  };

  if (loadingUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1a1614]">
        <p className="text-sm text-warm-muted">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1614]">
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-warm-card-border bg-[#1a1614] px-6 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-lg p-1.5 text-warm-muted hover:bg-warm-card hover:text-warm-cream transition-colors"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
          <a href="/ceo" className="flex items-center gap-2">
            <LayoutDashboard size={16} className="text-warm-accent" />
            <span className="text-sm font-medium text-warm-cream">CEO Panel</span>
          </a>
        </div>

        <div className="flex items-center gap-3">
          <DocsHelpLink />
          {activeBranch && (
            <div className="hidden items-center gap-1.5 text-xs text-warm-muted sm:flex">
              <MapPin size={12} className="text-warm-accent" />
              <span>{activeBranch.branch.name}</span>
            </div>
          )}
          <span className="hidden text-xs text-warm-muted sm:block">{user?.name}</span>
          <span className="inline-flex items-center gap-1 rounded-full border border-warm-accent/30 bg-warm-accent/10 px-2.5 py-0.5 text-[10px] font-medium tracking-wide text-warm-accent uppercase">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-warm-accent" />
            CEO
          </span>
        </div>
      </header>

      {/* Sidebar */}
      <div className={`fixed inset-0 z-40 transition-all duration-300 ease-out ${menuOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div className={`absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-300 ease-out ${menuOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setMenuOpen(false)} />
        <nav className={`relative flex h-full w-64 flex-col bg-[#24201e] border-r border-warm-card-border transition-transform duration-300 ease-out ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          {/* Scrollable top section */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-6 border-b border-warm-card-border pb-4">
              <p className="text-sm font-medium text-warm-cream truncate">{user?.name || 'Loading…'}</p>
              <p className="mt-0.5 text-[10px] text-warm-muted">CEO · Full access</p>
            </div>

            {/* Branch Switcher */}
            {branches.length > 0 && (
              <div className="mb-6">
                <p className="mb-2 text-[10px] font-medium tracking-wider text-warm-muted uppercase">Active Branch</p>
                <div className="relative">
                  <button
                    onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
                    className="flex w-full items-center justify-between rounded-lg border border-warm-card-border bg-warm-card px-3 py-2 text-xs text-warm-cream transition-colors hover:border-warm-accent/50"
                  >
                    <span className="flex items-center gap-2">
                      <MapPin size={13} className="text-warm-accent shrink-0" />
                      <span className="truncate">{activeBranch?.branch.name || 'Select branch…'}</span>
                    </span>
                    <ChevronDown size={13} className={`text-warm-muted transition-transform duration-200 ${branchDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {branchDropdownOpen && (
                    <div className="mt-1 rounded-lg border border-warm-card-border bg-[#2d2826] py-1 shadow-xl">
                      {branches.map(b => (
                        <button key={b.branch.id} onClick={() => handleSetActiveBranch(b.branch.id)}
                          className={`flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors ${activeBranchId === b.branch.id ? 'text-warm-accent' : 'text-warm-muted hover:bg-warm-card hover:text-warm-cream'}`}>
                          <div className="flex flex-col items-start text-left">
                            <span className="flex items-center gap-1.5">
                              {activeBranchId === b.branch.id && <Check size={12} className="text-warm-accent shrink-0" />}
                              <span>{b.branch.name}</span>
                            </span>
                            <span className="mt-0.5 text-[9px] text-warm-muted/60 truncate">{b.branch.code} · {b.role}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {/* Overlay not needed — sidebar backdrop closes menu */}
                </div>
              </div>
            )}

            <p className="mb-4 text-[10px] font-medium tracking-wider text-warm-muted uppercase">Navigation</p>
            <div className="space-y-0.5">
              {navItems.map(item => {
                const Icon = item.icon;
                const active = pathname === item.href || (item.href !== '/ceo' && pathname.startsWith(item.href));
                return (
                  <a key={item.label} href={item.href} onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs transition-colors ${active ? 'text-warm-cream bg-warm-accent/10' : 'text-warm-muted hover:bg-warm-card hover:text-warm-cream'}`}>
                    <Icon size={14} className="text-warm-accent" /> {item.label}
                  </a>
                );
              })}
            </div>
          </div>

          {/* Fixed bottom section */}
          <div className="border-t border-warm-card-border p-3">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-warm-muted hover:bg-warm-card hover:text-red transition-colors"
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </nav>
      </div>

      {children}
      <ToastContainer />
    </div>
  );
}
