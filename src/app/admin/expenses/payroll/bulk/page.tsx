'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, CheckSquare, RefreshCw, Square } from 'lucide-react';
import { api } from '@/lib/api';
import { showToast } from '@/components/toast';
import { useAyPermissions } from '@/hooks/use-ay-permissions';
import NumberStepper from '@/components/inputs/number-stepper';

const METHODS = ['CASH', 'CHEQUE', 'BANK_TRANSFER', 'ONLINE'] as const;
const PAYEE_TYPES = ['ALL', 'TEACHER', 'STAFF', 'WORKER'] as const;

type Row = {
  userId: string;
  name: string;
  payeeType: string;
  branchRole: string;
  closingBalance: number;
  suggestedAmount: number;
  unmarkedDays: number;
};

export default function BulkPayrollPage() {
  const router = useRouter();
  const { canCreate, readOnly } = useAyPermissions('EXPENSES');
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [payeeType, setPayeeType] = useState<string>('ALL');
  const [unpaidOnly, setUnpaidOnly] = useState(true);
  const [missingOnly, setMissingOnly] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [amounts, setAmounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [payMethod, setPayMethod] = useState('CASH');
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getPayrollBulkPreview({
        month,
        payeeType,
        unpaidOnly: unpaidOnly ? 'true' : 'false',
        missingAttendanceOnly: missingOnly ? 'true' : 'false',
      });
      if (res.success) {
        const data = (res.data || []) as Row[];
        setRows(data);
        const nextAmounts: Record<string, number> = {};
        const nextSelected = new Set<string>();
        for (const r of data) {
          const amt = Number(r.suggestedAmount ?? r.closingBalance ?? 0);
          nextAmounts[r.userId] = amt;
          if (amt > 0) nextSelected.add(r.userId);
        }
        setAmounts(nextAmounts);
        setSelected(nextSelected);
      }
    } catch {
      showToast('error', 'Failed to load preview');
    } finally {
      setLoading(false);
    }
  }, [month, payeeType, unpaidOnly, missingOnly]);

  useEffect(() => { load(); }, [load]);

  const toggle = (userId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === rows.length) setSelected(new Set());
    else setSelected(new Set(rows.map((r) => r.userId)));
  };

  const selectedTotal = useMemo(
    () => rows.filter((r) => selected.has(r.userId)).reduce((s, r) => s + (amounts[r.userId] || 0), 0),
    [rows, selected, amounts],
  );

  const submit = async () => {
    const payments = rows
      .filter((r) => selected.has(r.userId) && (amounts[r.userId] || 0) > 0)
      .map((r) => ({ payeeUserId: r.userId, amount: amounts[r.userId] }));
    if (!payments.length) {
      showToast('error', 'Select at least one payee with amount > 0');
      return;
    }
    setSaving(true);
    try {
      const res = await api.recordPayrollBulk({
        salaryMonth: month,
        paymentMethod: payMethod,
        paymentKind: 'REGULAR',
        note: note || undefined,
        payments,
      });
      if (res.success) {
        const d = (res as any).data;
        showToast('success', `Bulk run: ${d.successCount} paid, ${d.failCount} failed · ${Number(d.totalAmount).toLocaleString()}`);
        load();
      } else {
        showToast('error', (res as any).message || 'Bulk payment failed');
      }
    } catch (e: any) {
      showToast('error', e.message || 'Bulk payment failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <button type="button" onClick={() => router.push('/admin/expenses/payroll')} className="mb-4 flex items-center gap-1 text-xs text-warm-muted hover:text-warm-cream">
        <ChevronLeft size={14} /> Pays
      </button>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-light text-warm-cream">Bulk payroll</h1>
          <p className="text-xs text-warm-muted">Select payees, adjust amounts, record one batch</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream" />
          <button type="button" onClick={load} className="rounded-lg border border-warm-card-border p-2 text-warm-muted hover:text-warm-cream">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {readOnly && (
        <p className="mb-4 rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-3 py-2 text-[11px] text-yellow-300">
          Archived year — bulk payroll is disabled (read-only).
        </p>
      )}

      <div className="mb-4 flex flex-wrap gap-3 rounded-xl border border-warm-card-border bg-warm-card/30 p-4">
        <select value={payeeType} onChange={(e) => setPayeeType(e.target.value)} className="rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream">
          {PAYEE_TYPES.map((t) => <option key={t} value={t}>{t === 'ALL' ? 'All types' : t.charAt(0) + t.slice(1).toLowerCase() + 's'}</option>)}
        </select>
        <label className="flex items-center gap-2 text-xs text-warm-muted">
          <input type="checkbox" checked={unpaidOnly} onChange={(e) => setUnpaidOnly(e.target.checked)} />
          Unpaid only
        </label>
        <label className="flex items-center gap-2 text-xs text-warm-muted">
          <input type="checkbox" checked={missingOnly} onChange={(e) => setMissingOnly(e.target.checked)} />
          Missing attendance only
        </label>
        <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} className="rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream">
          {METHODS.map((m) => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
        </select>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Batch note (optional)" className="min-w-[180px] flex-1 rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream" />
      </div>

      {loading ? (
        <p className="text-sm text-warm-muted">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-warm-muted">No payees match filters.</p>
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between">
            <button type="button" onClick={toggleAll} className="flex items-center gap-1 text-xs text-warm-muted hover:text-warm-cream">
              {selected.size === rows.length ? <CheckSquare size={14} /> : <Square size={14} />}
              {selected.size} of {rows.length} selected
            </button>
            <span className="text-xs text-warm-cream">Total: {selectedTotal.toLocaleString()}</span>
          </div>
          <div className="overflow-x-auto rounded-xl border border-warm-card-border">
            <table className="w-full min-w-[800px] text-left text-xs">
              <thead className="border-b border-warm-card-border bg-warm-card/60 text-warm-muted">
                <tr>
                  <th className="px-3 py-2 w-8" />
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Balance</th>
                  <th className="px-3 py-2">Missing att.</th>
                  <th className="px-3 py-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.userId} className="border-b border-warm-card-border/50">
                    <td className="px-3 py-2">
                      <button type="button" onClick={() => toggle(r.userId)} className="text-warm-muted hover:text-warm-cream">
                        {selected.has(r.userId) ? <CheckSquare size={16} /> : <Square size={16} />}
                      </button>
                    </td>
                    <td className="px-3 py-2 text-warm-cream">{r.name}</td>
                    <td className="px-3 py-2 text-warm-muted">{r.payeeType} · {r.branchRole}</td>
                    <td className="px-3 py-2">{Number(r.closingBalance ?? 0).toLocaleString()}</td>
                    <td className="px-3 py-2 text-warm-muted">{r.unmarkedDays ?? 0}</td>
                    <td className="px-3 py-2">
                      <NumberStepper
                        value={amounts[r.userId] ?? 0}
                        onChange={(v) => setAmounts((p) => ({ ...p, [r.userId]: v }))}
                        min={0}
                        step={100}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              disabled={saving || selected.size === 0 || !canCreate}
              onClick={submit}
              className="rounded-lg bg-warm-accent px-4 py-2 text-sm font-medium text-[#1a1614] disabled:opacity-50"
            >
              {saving ? 'Processing…' : `Record ${selected.size} payment(s)`}
            </button>
          </div>
        </>
      )}
    </main>
  );
}
