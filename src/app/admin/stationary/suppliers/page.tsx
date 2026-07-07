'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { showToast } from '@/components/toast';

export default function StationarySuppliersPage() {
  const router = useRouter();
  const [rows, setRows] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [contactNumber, setContactNumber] = useState('');

  const load = () => api.getStationarySuppliers().then((r) => setRows(r.data || [])).catch((e) => showToast('error', e.message));
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!name.trim()) return;
    await api.createStationarySupplier({ name: name.trim(), contactNumber });
    setName('');
    setContactNumber('');
    load();
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <button type="button" onClick={() => router.push('/admin/stationary')} className="mb-4 flex items-center gap-1 text-xs text-warm-muted hover:text-warm-cream"><ChevronLeft size={14} /> Stationary</button>
      <h1 className="text-xl font-light text-warm-cream">Stationary Suppliers</h1>
      <div className="my-4 grid grid-cols-1 gap-2 md:grid-cols-3">
        <input className="rounded border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream" placeholder="Supplier name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="rounded border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream" placeholder="Contact number" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} />
        <button className="rounded bg-warm-accent px-3 py-2 text-xs text-[#1a1614]" onClick={create}><Plus size={12} className="mr-1 inline" /> Add</button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-warm-card-border">
        <table className="w-full text-xs">
          <thead><tr className="border-b border-warm-card-border"><th className="p-2 text-left">Name</th><th className="p-2 text-left">Contact</th><th className="p-2 text-left">Status</th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r.id} className="border-b border-warm-card-border/50"><td className="p-2">{r.name}</td><td className="p-2">{r.contactNumber || '—'}</td><td className="p-2">{r.isActive ? 'Active' : 'Disabled'}</td></tr>)}</tbody>
        </table>
      </div>
    </main>
  );
}
