'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Plus, Package } from 'lucide-react';
import { api } from '@/lib/api';
import { showToast } from '@/components/toast';

const fieldClass =
  'w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent';

const emptyForm = {
  name: '',
  categoryId: '',
  unitPrice: '',
  bundlePrice: '',
  unitsPerBundle: '',
};

export default function StationaryProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [newCategory, setNewCategory] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([api.getStationaryProducts(false), api.getStationaryCategories()])
      .then(([p, c]) => {
        setProducts(p.data || []);
        setCategories(c.data || []);
      })
      .catch((e) => showToast('error', e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    if (!categories.length) {
      showToast('error', 'Please add at least one category first');
      return;
    }
    setEditingId(null);
    setForm(emptyForm);
    setModal(true);
  };

  const openEdit = (p: any) => {
    setEditingId(p.id);
    setForm({
      name: p.name || '',
      categoryId: p.category?.id || p.categoryId || '',
      unitPrice: String((Number(p.unitPrice || 0) / 100)),
      bundlePrice: p.bundlePrice != null ? String((Number(p.bundlePrice || 0) / 100)) : '',
      unitsPerBundle: p.unitsPerBundle != null ? String(p.unitsPerBundle) : '',
    });
    setModal(true);
  };

  const closeModal = () => {
    setModal(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const saveProduct = async () => {
    if (!form.name.trim() || !form.categoryId || !form.unitPrice || !form.bundlePrice || !form.unitsPerBundle) {
      showToast('error', 'Fill name, category, unit price, bundle price & units per bundle');
      return;
    }
    const unitsPerBundle = Number(form.unitsPerBundle);
    if (!Number.isInteger(unitsPerBundle) || unitsPerBundle < 1) {
      showToast('error', 'Units per bundle must be a whole number >= 1');
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      categoryId: form.categoryId,
      unitPrice: Math.round(Number(form.unitPrice) * 100),
      bundlePrice: Math.round(Number(form.bundlePrice) * 100),
      unitsPerBundle,
    };
    try {
      if (editingId) {
        await api.patchStationaryProduct(editingId, payload);
        showToast('success', 'Product updated');
      } else {
        await api.createStationaryProduct(payload);
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
      await api.createStationaryCategory(newCategory.trim());
      setNewCategory('');
      load();
      showToast('success', 'Category added');
    } catch (e: unknown) {
      showToast('error', e instanceof Error ? e.message : 'Failed');
    }
  };

  const startEditCategory = (c: any) => {
    setEditingCategoryId(c.id);
    setEditingCategoryName(c.name || '');
  };

  const saveCategory = async () => {
    if (!editingCategoryId || !editingCategoryName.trim()) return;
    try {
      await api.patchStationaryCategory(editingCategoryId, { name: editingCategoryName.trim() });
      setEditingCategoryId(null);
      setEditingCategoryName('');
      load();
      showToast('success', 'Category updated');
    } catch (e: unknown) {
      showToast('error', e instanceof Error ? e.message : 'Failed');
    }
  };

  const toggleCategory = async (c: any) => {
    try {
      await api.patchStationaryCategory(c.id, { isActive: !c.isActive });
      load();
    } catch (e: unknown) {
      showToast('error', e instanceof Error ? e.message : 'Failed');
    }
  };

  const toggleProduct = async (p: any) => {
    try {
      await api.patchStationaryProduct(p.id, { isActive: !p.isActive });
      load();
    } catch (e: unknown) {
      showToast('error', e instanceof Error ? e.message : 'Failed');
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <button type="button" onClick={() => router.push('/admin/stationary')} className="mb-4 flex items-center gap-1 text-xs text-warm-muted hover:text-warm-cream"><ChevronLeft size={14} /> Stationary</button>
      <h1 className="flex items-center gap-2 text-xl font-light text-warm-cream">
        <Package size={20} className="text-warm-accent" />
        Stationary Products
      </h1>

      <div className="mb-3 mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-warm-muted">Catalog - unit & bundle pricing</p>
        <button type="button" onClick={openCreate} className="inline-flex items-center gap-1 rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614]">
          <Plus size={14} /> Add product
        </button>
      </div>

      <div className="mb-6 rounded-xl border border-warm-card-border bg-warm-card/30 p-3">
        <p className="mb-2 text-[11px] text-warm-muted">Categories</p>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="New category name"
            className="rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent"
          />
          <button type="button" onClick={addCategory} className="rounded-lg border border-warm-card-border px-3 py-2 text-xs text-warm-cream">Add category</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <div key={c.id} className="rounded border border-warm-card-border px-2 py-1 text-[11px] text-warm-cream">
              {editingCategoryId === c.id ? (
                <span className="flex items-center gap-2">
                  <input value={editingCategoryName} onChange={(e) => setEditingCategoryName(e.target.value)} className="rounded border border-warm-card-border bg-[#1a1614] px-2 py-1 text-[11px]" />
                  <button onClick={saveCategory} className="text-warm-accent">Save</button>
                  <button onClick={() => setEditingCategoryId(null)} className="text-warm-muted">Cancel</button>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span>{c.name} {!c.isActive ? '(disabled)' : ''}</span>
                  <button onClick={() => startEditCategory(c)} className="text-warm-accent">Edit</button>
                  <button onClick={() => toggleCategory(c)} className="text-warm-muted">{c.isActive ? 'Disable' : 'Enable'}</button>
                </span>
              )}
            </div>
          ))}
          {!categories.length && <p className="text-xs text-yellow-400">No categories yet. Add one to enable product form.</p>}
        </div>
      </div>

      {loading ? <div className="h-20 animate-pulse rounded bg-warm-card" /> : (
        <div className="overflow-x-auto rounded-xl border border-warm-card-border">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-warm-card-border"><th className="p-2 text-left">Name</th><th className="p-2 text-left">Category</th><th className="p-2 text-left">Unit Price</th><th className="p-2 text-left">Bundle Price</th><th className="p-2 text-left">Units/Bundle</th><th className="p-2 text-left">Stock</th><th className="p-2 text-left">Status</th><th className="p-2" /></tr></thead>
            <tbody>{products.map((p) => <tr key={p.id} className="border-b border-warm-card-border/50"><td className="p-2">{p.name}</td><td className="p-2">{p.category?.name}</td><td className="p-2">{(Number(p.unitPrice || 0) / 100).toFixed(2)}</td><td className="p-2">{p.bundlePrice != null ? (Number(p.bundlePrice || 0) / 100).toFixed(2) : '—'}</td><td className="p-2">{p.unitsPerBundle ?? '—'}</td><td className="p-2">{p.stockBundles} bundle, {p.stockUnits} unit</td><td className="p-2">{p.isActive ? 'Active' : 'Disabled'}</td><td className="p-2 text-right"><button onClick={() => openEdit(p)} className="mr-2 text-warm-accent">Edit</button><button onClick={() => toggleProduct(p)} className="text-warm-muted">{p.isActive ? 'Disable' : 'Enable'}</button></td></tr>)}</tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-xl border border-warm-card-border bg-[#1a1614] p-5 space-y-3">
            <h3 className="text-sm font-medium text-warm-cream">{editingId ? 'Edit product' : 'New product'}</h3>
            {!categories.length ? (
              <p className="text-xs text-yellow-400">No category exists. Add a category first from the section above.</p>
            ) : (
              <>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" className={fieldClass} />
                <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className={fieldClass}>
                  <option value="" className="bg-[#1a1614] text-warm-cream">Category…</option>
                  {categories.filter((c) => c.isActive).map((c) => <option key={c.id} value={c.id} className="bg-[#1a1614] text-warm-cream">{c.name}</option>)}
                </select>
                <input value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} placeholder="Unit price (1 piece)" type="number" min="0" step="0.01" className={fieldClass} />
                <input value={form.bundlePrice} onChange={(e) => setForm({ ...form, bundlePrice: e.target.value })} placeholder="Bundle price" type="number" min="0" step="0.01" className={fieldClass} />
                <input value={form.unitsPerBundle} onChange={(e) => setForm({ ...form, unitsPerBundle: e.target.value })} placeholder="Units in one bundle" type="number" min="1" step="1" className={fieldClass} />
              </>
            )}
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={closeModal} disabled={saving} className="flex-1 rounded-lg border border-warm-card-border py-2 text-xs text-warm-muted disabled:opacity-50">Cancel</button>
              <button type="button" onClick={saveProduct} disabled={saving || !categories.length} className="flex-1 rounded-lg bg-warm-accent py-2 text-xs font-medium text-[#1a1614] disabled:opacity-50">
                {saving ? 'Saving…' : editingId ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
