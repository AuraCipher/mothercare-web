'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { DocsNavItem } from '@/lib/docs/navigation';

function NavGroup({ item, depth = 0 }: { item: DocsNavItem; depth?: number }) {
  const pathname = usePathname();
  const active = pathname === item.href || (item.href !== '/docs/intro' && item.href !== '/docs/api' && pathname.startsWith(item.href + '/'));
  const selfActive = pathname === item.href;

  return (
    <div className={depth > 0 ? 'ml-3 border-l border-warm-card-border pl-3' : ''}>
      <Link
        href={item.href}
        className={`block rounded-md px-2 py-1.5 text-xs transition-colors ${selfActive ? 'bg-warm-accent/10 text-warm-cream' : active ? 'text-warm-cream' : 'text-warm-muted hover:bg-warm-card hover:text-warm-cream'}`}
      >
        {item.title}
      </Link>
      {item.children?.map((child) => (
        <NavGroup key={child.href} item={child} depth={depth + 1} />
      ))}
    </div>
  );
}

export function DocsSidebar({ items }: { items: DocsNavItem[] }) {
  return (
    <aside className="lg:sticky lg:top-20 lg:self-start">
      <nav className="space-y-4 rounded-xl border border-warm-card-border bg-warm-card/40 p-4">
        {items.map((item) => (
          <div key={item.href}>
            {item.children ? (
              <div>
                <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-warm-muted">{item.title}</p>
                <div className="space-y-0.5">
                  {item.children.map((child) => (
                    <NavGroup key={child.href} item={child} />
                  ))}
                </div>
              </div>
            ) : (
              <NavGroup item={item} />
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}
