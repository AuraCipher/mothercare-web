'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft, Boxes, Package, Truck, ReceiptText } from 'lucide-react';

const cards = [
  { href: '/admin/stationary/products', icon: Package, title: 'Products', desc: 'Branch catalog with bundle + unit prices' },
  { href: '/admin/stationary/inventory', icon: Boxes, title: 'Inventory', desc: 'Stock adjustments and live stock view' },
  { href: '/admin/stationary/suppliers', icon: Truck, title: 'Suppliers', desc: 'Supplier details for stationary purchasing' },
  { href: '/admin/stationary/sales-records', icon: ReceiptText, title: 'Sales Records', desc: 'Student assignment history linked to fees' },
];

export default function StationaryHubPage() {
  const router = useRouter();
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <button type="button" onClick={() => router.push('/admin')} className="mb-4 flex items-center gap-1 text-xs text-warm-muted hover:text-warm-cream">
        <ChevronLeft size={14} /> Admin
      </button>
      <h1 className="text-xl font-light text-warm-cream">Stationary</h1>
      <p className="mb-6 mt-1 text-xs text-warm-muted">Branch-only products and inventory, with fee-linked student assignment.</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <button key={c.href} type="button" onClick={() => router.push(c.href)} className="rounded-xl border border-warm-card-border bg-warm-card p-4 text-left hover:border-warm-accent/50">
              <Icon size={18} className="mb-2 text-warm-accent" />
              <p className="text-sm text-warm-cream">{c.title}</p>
              <p className="text-[11px] text-warm-muted">{c.desc}</p>
            </button>
          );
        })}
      </div>
    </main>
  );
}
