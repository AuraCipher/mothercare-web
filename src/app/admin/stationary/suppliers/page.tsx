'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Plus, Truck } from 'lucide-react';
import { api } from '@/lib/api';
import { showToast } from '@/components/toast';

const fieldClass =
  'w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent';

export default function StationarySuppliersPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', contactNumber: '', note: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.getStationarySuppliers()
      .then((r) => setSuppliers(r.data || []))
      .catch((e) => showToast('error', e.message))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: '', contactNumber: '', note: '' });
    setModal(true);
  };

  const openEdit = (s: any) => {
    setEditingId(s.id);
    setForm({ name: s.name || '', contactNumber: s.contactNumber || '', note: s.note || '' });
    setModal(true);
  };

  const closeModal = () => {
    setModal(false);
    setEditingId(null);
    setForm({ name: '', contactNumber: '', note: '' });
  };

  const saveSupplier = async () => {
    if (!form.name.trim()) {
      showToast('error', 'Supplier name is required');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await api.patchStationarySupplier(editingId, {
          name: form.name.trim(),
          contactNumber: form.contactNumber.trim() || undefined,
          note: form.note.trim() || undefined,
        });
        showToast('success', 'Supplier updated');
      } else {
        await api.createStationarySupplier({
          name: form.name.trim(),
          contactNumber: form.contactNumber.trim() || undefined,
          note: form.note.trim() || undefined,
        });
        showToast('success', 'Supplier added');
      }
      closeModal();
      load();
    } catch (e: unknown) {
      showToast('error', e instanceof Error ? e.message : 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleSupplier = async (s: any) => {
    try {
      await api.patchStationarySupplier(s.id, { isActive: !s.isActive });
      load();
    } catch (e: unknown) {
      showToast('error', e instanceof Error ? e.message : 'Failed');
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <button type="button" onClick={() => router.push('/admin/stationary')} className="mb-4 flex items-center gap-1 text-xs text-warm-muted hover:text-warm-cream">
        <ChevronLeft size={14} /> Stationary
      </button>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-light text-warm-cream">
            <Truck size={20} className="text-warm-accent" />
            Stationary Suppliers
          </h1>
          <p className="mt-1 text-xs text-warm-muted">Manage supplier profile and contact details</p>
        </div>
        <button type="button" onClick={openCreate} className="inline-flex items-center gap-1 rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614]">
          <Plus size={14} /> Add supplier
        </button>
      </div>

      {loading ? (
        <div className="h-32 animate-pulse rounded-xl bg-warm-card" />
      ) : suppliers.length === 0 ? (
        <p className="text-sm text-warm-muted">No suppliers yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-warm-card-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-warm-card-border bg-warm-card/80 text-left text-warm-muted">
                <th className="p-3">Supplier</th>
                <th className="p-3">Contact</th>
                <th className="p-3">Status</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s.id} className="border-b border-warm-card-border/50">
                  <td className="p-3 text-warm-cream">{s.name}</td>
                  <td className="p-3 text-warm-muted">{s.contactNumber || '—'}</td>
                  <td className="p-3">{s.isActive ? 'Active' : 'Disabled'}</td>
                  <td className="p-3 text-right">
                    <button type="button" onClick={() => router.push(`/admin/stationary/suppliers/${s.id}`)} className="mr-3 text-warm-accent hover:underline">
                      View details
                    </button>
                    <button type="button" onClick={() => openEdit(s)} className="mr-3 text-warm-accent hover:underline">
                      Edit
                    </button>
                    <button type="button" onClick={() => toggleSupplier(s)} className="text-warm-muted hover:text-warm-cream hover:underline">
                      {s.isActive ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-xl border border-warm-card-border bg-[#1a1614] p-5 space-y-3">
            <h3 className="text-sm font-medium text-warm-cream">{editingId ? 'Edit supplier' : 'New supplier'}</h3>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Supplier name"
              className={fieldClass}
            />
            <input
              value={form.contactNumber}
              onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
              placeholder="Contact info (phone, email...)"
              className={fieldClass}
            />
            <textarea
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Note"
              rows={3}
              className={`${fieldClass} resize-none`}
            />
            <div className="flex gap-2">
              <button type="button" onClick={closeModal} disabled={saving} className="flex-1 rounded-lg border py-2 text-xs text-warm-muted disabled:opacity-50">Cancel</button>
              <button type="button" onClick={saveSupplier} disabled={saving} className="flex-1 rounded-lg bg-warm-accent py-2 text-xs text-[#1a1614] disabled:opacity-50">{saving ? 'Saving…' : editingId ? 'Update' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
