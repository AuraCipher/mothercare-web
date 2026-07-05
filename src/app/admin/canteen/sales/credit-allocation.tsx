'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { api } from '@/lib/api';
import { formatCanteenMoney } from '@/lib/canteen';

export type CreditLine = {
  key: string;
  personType: 'STUDENT' | 'TEACHER' | 'STAFF';
  personId: string;
  name: string;
  detail?: string;
  amount: string;
};

type PersonType = CreditLine['personType'];

type CreditPerson = {
  id: string;
  name: string;
  rollNumber?: string;
  phone?: string | null;
  group?: { name: string; section?: string | null } | null;
};

const fieldClass =
  'w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent';

const PERSON_LABELS: Record<PersonType, string> = {
  STUDENT: 'Students',
  TEACHER: 'Teachers',
  STAFF: 'Staff',
};

function personKey(type: PersonType, id: string) {
  return `${type}:${id}`;
}

function formatClass(group?: { name: string; section?: string | null } | null) {
  if (!group) return '';
  return group.section ? `${group.name} · ${group.section}` : group.name;
}

type Props = {
  creditTotal: number;
  lines: CreditLine[];
  onChange: (lines: CreditLine[]) => void;
};

export function CreditAllocationSection({ creditTotal, lines, onChange }: Props) {
  const [pickerType, setPickerType] = useState<PersonType | null>(null);
  const [searchQ, setSearchQ] = useState('');
  const [classId, setClassId] = useState('');
  const [classes, setClasses] = useState<Array<{ id: string; name: string; section?: string | null }>>([]);
  const [persons, setPersons] = useState<CreditPerson[]>([]);
  const [bucket, setBucket] = useState<Set<string>>(new Set());
  const [loadingPersons, setLoadingPersons] = useState(false);

  const assignedTotal = useMemo(() => {
    return lines.reduce((sum, line) => {
      const n = line.amount.trim() === '' ? 0 : Number(line.amount);
      return sum + (Number.isFinite(n) ? n : 0);
    }, 0);
  }, [lines]);

  const creditMismatch = creditTotal > 0 && Math.abs(assignedTotal - creditTotal) > 0.02;
  const remaining = Math.round((creditTotal - assignedTotal) * 100) / 100;

  useEffect(() => {
    if (pickerType !== 'STUDENT') return;
    api.getCanteenCreditClasses()
      .then((r) => setClasses(r.data || []))
      .catch(() => setClasses([]));
  }, [pickerType]);

  useEffect(() => {
    if (!pickerType) return;
    setLoadingPersons(true);
    api.getCanteenCreditPersons(pickerType, {
      q: searchQ || undefined,
      groupId: pickerType === 'STUDENT' && classId ? classId : undefined,
    })
      .then((r) => setPersons(r.data || []))
      .catch(() => setPersons([]))
      .finally(() => setLoadingPersons(false));
  }, [pickerType, searchQ, classId]);

  const openPicker = (type: PersonType) => {
    setPickerType(type);
    setSearchQ('');
    setClassId('');
    setBucket(new Set());
  };

  const closePicker = () => {
    setPickerType(null);
    setBucket(new Set());
  };

  const toggleBucket = (type: PersonType, person: CreditPerson) => {
    const key = personKey(type, person.id);
    if (lines.some((l) => personKey(l.personType, l.personId) === key)) return;
    setBucket((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const confirmBucket = () => {
    if (!pickerType || bucket.size === 0) return;
    const existingKeys = new Set(lines.map((l) => personKey(l.personType, l.personId)));
    const additions: CreditLine[] = [];

    for (const person of persons) {
      const key = personKey(pickerType, person.id);
      if (!bucket.has(key) || existingKeys.has(key)) continue;
      additions.push({
        key,
        personType: pickerType,
        personId: person.id,
        name: person.name,
        detail: pickerType === 'STUDENT'
          ? [formatClass(person.group), person.rollNumber ? `Roll ${person.rollNumber}` : ''].filter(Boolean).join(' · ')
          : undefined,
        amount: '',
      });
    }

    onChange([...lines, ...additions]);
    closePicker();
  };

  const updateLineAmount = (key: string, amount: string) => {
    onChange(lines.map((l) => (l.key === key ? { ...l, amount } : l)));
  };

  const removeLine = (key: string) => {
    onChange(lines.filter((l) => l.key !== key));
  };

  const linesByType = (type: PersonType) => lines.filter((l) => l.personType === type);

  if (creditTotal <= 0) return null;

  return (
    <section className="rounded-xl border border-pink-500/20 bg-pink-500/5 p-4 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-medium text-warm-cream">Credit breakdown</h3>
          <p className="text-[11px] text-warm-muted">
            Assign {formatCanteenMoney(creditTotal)} across students, teachers, or staff
          </p>
        </div>
        <div className="text-right text-xs">
          <p className="text-warm-muted">Assigned</p>
          <p className={`font-medium tabular-nums ${creditMismatch ? 'text-amber-400' : 'text-warm-cream'}`}>
            {formatCanteenMoney(assignedTotal)}
          </p>
          {!creditMismatch && remaining === 0 && lines.length > 0 && (
            <p className="text-[10px] text-green-400">Balanced</p>
          )}
          {remaining !== 0 && (
            <p className="text-[10px] text-amber-400">
              {remaining > 0 ? `${formatCanteenMoney(remaining)} left` : `${formatCanteenMoney(-remaining)} over`}
            </p>
          )}
        </div>
      </div>

      {(['STUDENT', 'TEACHER', 'STAFF'] as const).map((type) => {
        const sectionLines = linesByType(type);
        return (
          <div key={type} className="rounded-lg border border-warm-card-border/60 bg-[#1a1614]/40 p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-warm-cream">{PERSON_LABELS[type]}</p>
              <button
                type="button"
                onClick={() => openPicker(type)}
                className="inline-flex items-center gap-1 rounded-lg border border-warm-card-border px-2.5 py-1 text-[11px] text-warm-accent hover:border-warm-accent/50"
              >
                <Plus size={12} /> Select
              </button>
            </div>

            {sectionLines.length === 0 ? (
              <p className="text-[11px] text-warm-muted/70 py-1">Empty — tap Select to add</p>
            ) : (
              <ul className="space-y-2">
                {sectionLines.map((line) => (
                  <li key={line.key} className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-warm-cream truncate">{line.name}</p>
                      {line.detail && <p className="text-[10px] text-warm-muted truncate">{line.detail}</p>}
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.amount}
                      onChange={(e) => updateLineAmount(line.key, e.target.value)}
                      placeholder="Amount"
                      className="w-24 rounded-lg border border-warm-card-border bg-[#1a1614] px-2 py-1.5 text-xs text-warm-cream tabular-nums outline-none focus:border-warm-accent"
                    />
                    <button
                      type="button"
                      onClick={() => removeLine(line.key)}
                      className="rounded-lg p-1.5 text-warm-muted hover:text-red-400"
                      aria-label={`Remove ${line.name}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}

      {creditMismatch && lines.length > 0 && (
        <p className="text-[11px] text-amber-400">
          Credit assigned must equal total credit ({formatCanteenMoney(creditTotal)}).
        </p>
      )}

      {pickerType && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4">
          <div className="flex max-h-[85vh] w-full sm:max-w-lg flex-col rounded-t-2xl sm:rounded-xl border border-warm-card-border bg-[#1a1614] shadow-xl">
            <div className="flex items-center justify-between border-b border-warm-card-border px-4 py-3">
              <div>
                <h3 className="text-sm font-medium text-warm-cream">Select {PERSON_LABELS[pickerType]}</h3>
                <p className="text-[11px] text-warm-muted">Pick one or more, then add to the list</p>
              </div>
              <button type="button" onClick={closePicker} className="text-warm-muted hover:text-warm-cream">
                <X size={18} />
              </button>
            </div>

            <div className="border-b border-warm-card-border px-4 py-3 space-y-2">
              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder={pickerType === 'STUDENT' ? 'Search name or roll…' : 'Search name…'}
                className={fieldClass}
                autoFocus
              />
              {pickerType === 'STUDENT' && (
                <select
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className={fieldClass}
                >
                  <option value="">All classes</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#1a1614]">
                      {c.section ? `${c.name} · ${c.section}` : c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-2">
              {loadingPersons ? (
                <div className="h-24 animate-pulse rounded-lg bg-warm-card mx-2" />
              ) : persons.length === 0 ? (
                <p className="px-3 py-6 text-center text-xs text-warm-muted">No matches in this branch</p>
              ) : (
                <ul className="space-y-1">
                  {persons.map((p) => {
                    const key = personKey(pickerType, p.id);
                    const alreadyAdded = lines.some((l) => personKey(l.personType, l.personId) === key);
                    const selected = bucket.has(key);
                    return (
                      <li key={p.id}>
                        <button
                          type="button"
                          disabled={alreadyAdded}
                          onClick={() => toggleBucket(pickerType, p)}
                          className={`w-full rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                            alreadyAdded
                              ? 'opacity-40 cursor-not-allowed text-warm-muted'
                              : selected
                                ? 'bg-warm-accent/20 text-warm-accent'
                                : 'hover:bg-warm-card text-warm-cream'
                          }`}
                        >
                          <span className="font-medium">{p.name}</span>
                          {pickerType === 'STUDENT' && (
                            <span className="text-warm-muted">
                              {formatClass(p.group) ? ` · ${formatClass(p.group)}` : ''}
                              {p.rollNumber ? ` · ${p.rollNumber}` : ''}
                            </span>
                          )}
                          {alreadyAdded && <span className="ml-2 text-[10px] text-warm-muted">(added)</span>}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="border-t border-warm-card-border px-4 py-3 flex items-center justify-between gap-3">
              <p className="text-xs text-warm-muted">
                {bucket.size === 0 ? 'None selected' : `${bucket.size} selected`}
              </p>
              <button
                type="button"
                disabled={bucket.size === 0}
                onClick={confirmBucket}
                className="rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] disabled:opacity-50"
              >
                Add to list
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export function creditLinesAreValid(lines: CreditLine[], creditTotal: number) {
  if (creditTotal <= 0) return true;
  if (lines.length === 0) return false;
  const assigned = lines.reduce((sum, line) => {
    const n = line.amount.trim() === '' ? NaN : Number(line.amount);
    if (!Number.isFinite(n) || n <= 0) return NaN;
    return sum + n;
  }, 0);
  if (!Number.isFinite(assigned)) return false;
  return Math.abs(assigned - creditTotal) <= 0.02;
}

export function creditLinesToPayload(lines: CreditLine[]) {
  return lines
    .filter((l) => l.amount.trim() !== '' && Number(l.amount) > 0)
    .map((l) => ({
      personType: l.personType,
      amount: Number(l.amount),
      ...(l.personType === 'STUDENT' ? { studentId: l.personId } : { userId: l.personId }),
    }));
}
