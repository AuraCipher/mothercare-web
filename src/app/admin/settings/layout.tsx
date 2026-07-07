'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Calendar, BookOpen, ArrowLeft, Archive } from 'lucide-react';

const settingItems = [
  { href: '/admin/settings/academic-years', icon: Calendar, label: 'Academic Years' },
  { href: '/admin/settings/archived-years', icon: Archive, label: 'Archive bucket' },
  { href: '/admin/settings/subjects', icon: BookOpen, label: 'Subjects' },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => router.push('/admin')} className="rounded-lg p-1.5 text-warm-muted hover:text-warm-cream hover:bg-warm-card transition-colors">
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-light text-warm-cream">Settings</h1>
          <p className="text-sm text-warm-muted">Manage your school configuration.</p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar menu */}
        <nav className="w-48 shrink-0">
          <p className="mb-3 text-[10px] font-medium tracking-wider text-warm-muted uppercase">Options</p>
          <div className="space-y-0.5">
            {settingItems.map(item => {
              const Icon = item.icon;
              const active = pathname === item.href || (item.href !== '/admin/settings/academic-years' && pathname.startsWith(item.href));
              return (
                <a key={item.label} href={item.href}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs transition-colors ${
                    active
                      ? 'text-warm-cream bg-warm-accent/10'
                      : 'text-warm-muted hover:bg-warm-card hover:text-warm-cream'
                  }`}
                >
                  <Icon size={14} className="text-warm-accent" /> {item.label}
                </a>
              );
            })}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </main>
  );
}
