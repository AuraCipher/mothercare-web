'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Plus, Tag } from 'lucide-react';
import { api } from '@/lib/api';
import { formatCanteenMoney, type CanteenProduct } from '@/lib/canteen';
import { showToast } from '@/components/toast';

const fieldClass =
  'w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent';

const emptyForm = {
  name: '',
  categoryId: '',
  unitPrice: '',
  boxPrice: '',
  unitsPerBox: '',
};

function formatBoxPrice(value: number | string | null | undefined) {
  if (value == null || value === '') return '—';
  return formatCanteenMoney(value);
}

export default function CanteenProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<CanteenProduct[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [newCategory, setNewCategory] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([api.getCanteenProducts(false), api.getCanteenCategories()])
      .then(([pRes, cRes]) => {
        setProducts(pRes.data || []);
        setCategories(cRes.data || []);
      })
      .catch((e) => showToast('error', e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModal(true);
  };

  const openEdit = (p: CanteenProduct) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      categoryId: p.category?.id ?? '',
      unitPrice: String(Number(p.unitPrice)),
      boxPrice: p.boxPrice != null ? String(Number(p.boxPrice)) : '',
      unitsPerBox: p.unitsPerBox != null ? String(p.unitsPerBox) : '',
    });
    setModal(true);
  };

  const closeModal = () => {
    setModal(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const saveProduct = async () => {
    if (!form.name.trim() || !form.categoryId || !form.unitPrice || !form.boxPrice || !form.unitsPerBox) {
      showToast('error', 'Fill name, category, unit price, box price & units per box');
      return;
    }
    const unitsPerBox = Number(form.unitsPerBox);
    if (!Number.isInteger(unitsPerBox) || unitsPerBox < 1) {
      showToast('error', 'Units per box must be a whole number ≥ 1');
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      categoryId: form.categoryId,
      unitPrice: Number(form.unitPrice),
      boxPrice: Number(form.boxPrice),
      unitsPerBox,
    };
    try {
      if (editingId) {
        await api.patchCanteenProduct(editingId, payload);
        showToast('success', 'Product updated');
      } else {
        await api.createCanteenProduct(payload);
        showToast('success', 'Product added');
      }
      closeModal();
      load();
    } catch (e: unknown) {
      showToast('error', e instanceof Error ? e.message : 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const addCategory = async () => {
    if (!newCategory.trim()) return;
    try {
      await api.createCanteenCategory(newCategory.trim());
      setNewCategory('');
      load();
      showToast('success', 'Category added');
    } catch (e: unknown) {
      showToast('error', e instanceof Error ? e.message : 'Failed');
    }
  };

  const toggleProduct = async (p: CanteenProduct) => {
    try {
      if (p.isActive) await api.deactivateCanteenProduct(p.id);
      else await api.patchCanteenProduct(p.id, { isActive: true });
      load();
    } catch (e: unknown) {
      showToast('error', e instanceof Error ? e.message : 'Failed');
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <button type="button" onClick={() => router.push('/admin/canteen')} className="mb-4 flex items-center gap-1 text-xs text-warm-muted hover:text-warm-cream">
        <ChevronLeft size={14} /> Canteen
      </button>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-light text-warm-cream">
            <Tag size={22} className="text-violet-400" /> Products
          </h1>
          <p className="mt-1 text-xs text-warm-muted">Catalog — unit & box pricing</p>
        </div>
        <button type="button" onClick={openCreate} className="inline-flex items-center gap-1 rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614]">
          <Plus size={14} /> Add product
        </button>
      </div>

      <div className="mb-6 flex flex-wrap gap-2 items-center">
        <input
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="New category name"
          className="rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent"
        />
        <button type="button" onClick={addCategory} className="rounded-lg border border-warm-card-border px-3 py-2 text-xs text-warm-cream">
          Add category
        </button>
      </div>

      {loading ? (
        <div className="h-32 animate-pulse rounded-xl bg-warm-card" />
      ) : products.length === 0 ? (
        <p className="text-sm text-warm-muted">No products yet. Add a category, then create your first product.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-warm-card-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-warm-card-border bg-warm-card/80 text-left text-warm-muted">
                <th className="p-3">Product</th>
                <th className="p-3">Category</th>
                <th className="p-3">Unit price</th>
                <th className="p-3">Box price</th>
                <th className="p-3">Units / box</th>
                <th className="p-3">Status</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-warm-card-border/50">
                  <td className="p-3 text-warm-cream">{p.name}</td>
                  <td className="p-3 text-warm-muted">{p.category?.name}</td>
                  <td className="p-3">{formatCanteenMoney(p.unitPrice)}</td>
                  <td className="p-3">{formatBoxPrice(p.boxPrice)}</td>
                  <td className="p-3 text-warm-muted">{p.unitsPerBox ?? '—'}</td>
                  <td className="p-3">{p.isActive ? 'Active' : 'Disabled'}</td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-3">
                      <button type="button" onClick={() => openEdit(p)} className="text-warm-accent hover:underline">
                        Edit
                      </button>
                      <button type="button" onClick={() => toggleProduct(p)} className="text-warm-muted hover:text-warm-cream hover:underline">
                        {p.isActive ? 'Disable' : 'Enable'}
                      </button>
                    </div>
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
            <h3 className="text-sm font-medium text-warm-cream">
              {editingId ? 'Edit product' : 'New product'}
            </h3>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" className={fieldClass} />
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className={fieldClass}
            >
              <option value="" className="bg-[#1a1614] text-warm-cream">Category…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#1a1614] text-warm-cream">
                  {c.name}
                </option>
              ))}
            </select>
            <input value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} placeholder="Unit price (1 piece)" type="number" min="0" step="0.01" className={fieldClass} />
            <input value={form.boxPrice} onChange={(e) => setForm({ ...form, boxPrice: e.target.value })} placeholder="Box price" type="number" min="0" step="0.01" className={fieldClass} />
            <input value={form.unitsPerBox} onChange={(e) => setForm({ ...form, unitsPerBox: e.target.value })} placeholder="Units in one box" type="number" min="1" step="1" className={fieldClass} />
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={closeModal} disabled={saving} className="flex-1 rounded-lg border border-warm-card-border py-2 text-xs text-warm-muted disabled:opacity-50">Cancel</button>
              <button type="button" onClick={saveProduct} disabled={saving} className="flex-1 rounded-lg bg-warm-accent py-2 text-xs font-medium text-[#1a1614] disabled:opacity-50">
                {saving ? 'Saving…' : editingId ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
