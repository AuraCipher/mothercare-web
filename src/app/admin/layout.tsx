'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import { LogOut, Users, BookOpen, GraduationCap, LayoutDashboard, Menu, X } from 'lucide-react';

interface UserData {
  id: string; name: string; role: string; username?: string; email?: string; phone?: string; status?: string;
}

const navItems = [
  { href: '/admin/classes', icon: BookOpen, label: 'Classes / Groups' },
  { href: '/admin', icon: Users, label: 'Teachers' },
  { href: '/admin', icon: GraduationCap, label: 'Students' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserData | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    loadUser();
  }, []);

  const loadUser = async () => {
    try { const d = await api.me(); if (d.success) setUser(d.user); }
    catch { /* ignore */ }
  };

  const handleSignOut = async () => {
    try { await api.logout(); } catch {}
    localStorage.removeItem('token');
    document.cookie = 'token=; path=/; max-age=0';
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-[#1a1614]">
      {/* ── Universal header ─────────────────────────────── */}
      <header className="flex items-center justify-between border-b border-warm-card-border px-6 py-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setMenuOpen(!menuOpen)} className="rounded-lg p-1.5 text-warm-muted hover:bg-warm-card hover:text-warm-cream transition-colors">
            {menuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
          <LayoutDashboard size={16} className="text-warm-accent" />
          <span className="text-sm font-medium text-warm-cream">Admin</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-warm-muted sm:block">{user?.name}</span>
          <span className="inline-flex items-center gap-1 rounded-full border border-warm-accent/30 bg-warm-accent/10 px-2.5 py-0.5 text-[10px] font-medium tracking-wide text-warm-accent uppercase">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-warm-accent" />
            {user?.role?.replace('_', ' ') || 'user'}
          </span>
          <button onClick={handleSignOut} className="flex items-center gap-1 text-xs text-warm-muted hover:text-warm-cream transition-colors">
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </header>

      {/* ── Sidebar overlay ──────────────────────────────── */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div className="flex-1 bg-black/50" onClick={() => setMenuOpen(false)} />
          <nav className="w-56 bg-[#24201e] border-l border-warm-card-border p-4 overflow-y-auto">
            <p className="mb-4 text-[10px] font-medium tracking-wider text-warm-muted uppercase">Navigation</p>
            <div className="space-y-0.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs transition-colors ${
                      active ? 'text-warm-cream bg-warm-accent/10' : 'text-warm-muted hover:bg-warm-card hover:text-warm-cream'
                    }`}
                  >
                    <Icon size={14} className="text-warm-accent" /> {item.label}
                  </a>
                );
              })}
            </div>
          </nav>
        </div>
      )}

      {children}
    </div>
  );
}
