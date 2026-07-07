'use client';

import { useEffect, useState } from 'react';
import { showToast } from '@/components/toast';
import { Plus, Edit3, Trash2 } from 'lucide-react';
import ConfirmModal from '@/components/confirm-modal';
import config from '@/config';

export default function FeeHeadsPage() {
  const [heads, setHeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', category: 'MONTHLY', isOptional: false });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const loadHeads = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${config.apiUrl}/admin/fee-heads`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) setHeads(json.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadHeads(); }, []);

  const handleSave = async () => {
    if (!token || !form.name) return;
    const url = editId ? `${config.apiUrl}/admin/fee-heads/${editId}` : `${config.apiUrl}/admin/fee-heads`;
    const method = editId ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, {
        method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) { showToast('success', editId ? 'Updated' : 'Created'); setShowForm(false); setEditId(null); setForm({ name: '', description: '', category: 'MONTHLY', isOptional: false }); loadHeads(); }
      else showToast('error', json.message || 'Failed');
    } catch { showToast('error', 'Failed'); }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${config.apiUrl}/admin/fee-heads/${id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) { showToast('success', 'Deactivated'); loadHeads(); }
    } catch { showToast('error', 'Failed'); }
  };

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-light text-warm-cream">Fee Heads</h1>
        <button onClick={() => { setEditId(null); setForm({ name: '', description: '', category: 'MONTHLY', isOptional: false }); setShowForm(true); }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] transition-colors">
          <Plus size={14} /> Add Head
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-5 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[10px] text-warm-muted/60 uppercase tracking-wider mb-1">Name</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent" placeholder="e.g., Tuition" />
            </div>
            <div>
              <label className="block text-[10px] text-warm-muted/60 uppercase tracking-wider mb-1">Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent">
                <option value="MONTHLY">Monthly</option>
                <option value="TERM">Term</option>
                <option value="ANNUAL">Annual</option>
                <option value="ONE_TIME">One Time</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] text-warm-muted/60 uppercase tracking-wider mb-1">Description</label>
              <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.isOptional} onChange={e => setForm({ ...form, isOptional: e.target.checked })} id="opt" className="rounded border-warm-card-border bg-[#1a1614]" />
              <label htmlFor="opt" className="text-xs text-warm-muted/70">Optional (e.g., Transport)</label>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className="rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] transition-colors">{editId ? 'Update' : 'Create'}</button>
            <button onClick={() => setShowForm(false)} className="rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream transition-colors">Cancel</button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-warm-card-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-warm-card/70">
              <th className="text-left px-4 py-3 text-[10px] text-warm-muted font-medium">Name</th>
              <th className="text-left px-4 py-3 text-[10px] text-warm-muted font-medium">Category</th>
              <th className="text-left px-4 py-3 text-[10px] text-warm-muted font-medium">Description</th>
              <th className="text-center px-4 py-3 text-[10px] text-warm-muted font-medium">Status</th>
              <th className="text-center px-4 py-3 text-[10px] text-warm-muted font-medium w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {heads.map(h => (
              <tr key={h.id} className="border-t border-warm-card-border/20 hover:bg-warm-card/20 transition-colors">
                <td className="px-4 py-3 text-xs text-warm-cream">{h.name}</td>
                <td className="px-4 py-3 text-xs text-warm-muted">{h.category}</td>
                <td className="px-4 py-3 text-xs text-warm-muted/60">{h.description || '—'}</td>
                <td className="px-4 py-3 text-xs text-center">{h.isActive ? <span className="text-green-400">Active</span> : <span className="text-red-400">Inactive</span>}</td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => { setEditId(h.id); setForm({ name: h.name, description: h.description || '', category: h.category, isOptional: h.isOptional }); setShowForm(true); }}
                    className="p-1 text-warm-muted hover:text-warm-accent transition-colors"><Edit3 size={13} /></button>
                  <button onClick={() => setDeleteId(h.id)} className="p-1 text-warm-muted hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {heads.length === 0 && <div className="p-8 text-center text-xs text-warm-muted/40">No fee heads yet</div>}
      </div>
      <ConfirmModal
        open={!!deleteId}
        title="Deactivate Fee Head?"
        message="This fee head will be marked inactive and hidden from new fee generation."
        confirmLabel="Deactivate"
        cancelLabel="Cancel"
        variant="warning"
        onConfirm={() => {
          const id = deleteId;
          setDeleteId(null);
          if (id) void handleDelete(id);
        }}
        onCancel={() => setDeleteId(null)}
      />
    </main>
  );
}
