'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { showToast } from '@/components/toast';
import { Search, DollarSign } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function CollectionsPage() {
  const router = useRouter();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [fees, setFees] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [classFilter, setClassFilter] = useState('');
  const [rollFilter, setRollFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [period, setPeriod] = useState<'monthly' | 'full'>('monthly');
  const [viewMode, setViewMode] = useState<'class' | 'alpha'>('class');
  const [loading, setLoading] = useState(true);
  // Pay & custom fee handled via the student detail page (/admin/fees/student/[id])

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const branchId = typeof window !== 'undefined' ? localStorage.getItem('activeBranchId') : null;
  const ayId = typeof window !== 'undefined' ? localStorage.getItem('activeAYId') : null;

  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [fRes, sRes] = await Promise.all([
        fetch(`${API_URL}/admin/fees/students-list?month=${month + 1}&year=${year}&period=${period}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(r => r.json()),
        branchId && ayId ? fetch(`${API_URL}/admin/branches/${branchId}/academic-years/${ayId}/sections`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(r => r.json()) : Promise.resolve({ success: false }),
      ]);
      if (fRes.success) setFees(fRes.data);
      if (sRes.success) setSections(sRes.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [month, year, period]);

  // Get father name from parents array
  const getFather = (student: any) => {
    const father = student?.parents?.find((p: any) => p.parent?.relation === 'Father' || p.parent?.relation === 'Father');
    return father?.parent?.user?.name || father?.parent?.phone || '';
  };

  // Filter & search
  const displayFees = useMemo(() => {
    let result = fees;

    // Class filter
    if (classFilter) {
      result = result.filter(f => f.student?.groupId === classFilter);
    }

    // Roll number filter (exact match)
    if (rollFilter.trim()) {
      result = result.filter(f => (f.student?.rollNumber || '') === rollFilter.trim());
    }

    // Search: match name, roll, father name
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(f => {
        const s = f.student || {};
        const father = getFather(s).toLowerCase();
        return (s.name || '').toLowerCase().includes(q)
          || (s.rollNumber || '').toLowerCase().includes(q)
          || father.includes(q);
      });
    }

    // Sort
    if (viewMode === 'alpha') {
      result = [...result].sort((a, b) => (a.student?.name || '').localeCompare(b.student?.name || ''));
    } else {
      // Class-wise: group by class, then by roll within
      result = [...result].sort((a, b) => {
        const clsA = a.student?.group?.name || a.student?.groupId || '';
        const clsB = b.student?.group?.name || b.student?.groupId || '';
        if (clsA !== clsB) return clsA.localeCompare(clsB);
        const rA = parseInt(a.student?.rollNumber, 10) || 0;
        const rB = parseInt(b.student?.rollNumber, 10) || 0;
        return rA - rB;
      });
    }

    return result;
  }, [fees, classFilter, rollFilter, searchQuery, viewMode]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-light text-warm-cream">Collections</h1>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {(['monthly', 'full'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${period === p ? 'bg-warm-accent text-[#1a1614] font-medium' : 'border border-warm-card-border text-warm-muted hover:text-warm-cream'}`}>
                {p === 'monthly' ? 'Monthly' : 'Full AY'}
              </button>
            ))}
          </div>
          {period === 'monthly' && (
            <>
              <select value={month} onChange={e => setMonth(Number(e.target.value))}
                className="rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent">
                {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
              <input type="number" value={year} onChange={e => setYear(Number(e.target.value))}
                className="rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent w-20" />
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-warm-card-border bg-warm-card p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[160px] flex-1 max-w-xs">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-muted/50" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by name, roll, or father name..."
                className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] pl-8 pr-3 py-2 text-xs text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent" />
            </div>
          </div>
          <div className="min-w-[80px]">
            <input value={rollFilter} onChange={e => setRollFilter(e.target.value)}
              placeholder="Roll no"
              className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent" />
          </div>
          <select value={classFilter} onChange={e => setClassFilter(e.target.value)}
            className="rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent">
            <option value="">All Classes</option>
            {sections.map((s: any) => (
              <option key={s.id} value={s.id}>{s.name}{s.section ? ` — ${s.section}` : ''}</option>
            ))}
          </select>
          <div className="flex gap-1">
            {(['class', 'alpha'] as const).map(v => (
              <button key={v} onClick={() => setViewMode(v)}
                className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${viewMode === v ? 'bg-warm-accent text-[#1a1614] font-medium' : 'border border-warm-card-border text-warm-muted hover:text-warm-cream'}`}>
                {v === 'class' ? 'Class-wise' : 'Alphabetical'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-warm-card-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-warm-card/70">
                <th className="text-left px-3 py-3 text-[10px] text-warm-muted font-medium w-12">#</th>
                <th className="text-left px-2 py-3 text-[10px] text-warm-muted font-medium w-14">Roll</th>
                <th className="text-left px-3 py-3 text-[10px] text-warm-muted font-medium">Name</th>
                <th className="text-left px-3 py-3 text-[10px] text-warm-muted font-medium">Class</th>
                <th className="text-left px-3 py-3 text-[10px] text-warm-muted font-medium">Father Name</th>
                <th className="text-right px-3 py-3 text-[10px] text-warm-muted font-medium">Fee</th>
                <th className="text-right px-3 py-3 text-[10px] text-warm-muted font-medium">Paid</th>
                <th className="text-right px-3 py-3 text-[10px] text-warm-muted font-medium">Due</th>
                <th className="text-center px-2 py-3 text-[10px] text-warm-muted font-medium w-16">Status</th>
                <th className="text-center px-2 py-3 text-[10px] text-warm-muted font-medium w-16">Action</th>
              </tr>
            </thead>
            <tbody>
              {displayFees.map((f: any, idx: number) => {
                const s = f.student || {};
                const due = f.status !== 'NO_FEE' ? (f.netAmount - f.paidAmount) / 100 : 0;
                const father = getFather(s);
                return (
                  <tr key={s.id || f.id || idx} className="border-t border-warm-card-border/20 hover:bg-warm-card/20 transition-colors">
                    <td className="px-3 py-2.5 text-xs text-warm-muted/50">{idx + 1}</td>
                    <td className="px-2 py-2.5 text-xs text-warm-muted">{s.rollNumber || '—'}</td>
                    <td className="px-3 py-2.5">
                      <button onClick={() => router.push(`/admin/fees/student/${s.id}`)}
                        className="text-xs text-warm-cream hover:text-warm-accent transition-colors text-left">{s.name || 'Unknown'}</button>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-warm-muted/60">{s.group?.name || ''}{s.group?.section ? ` — ${s.group.section}` : ''}</td>
                    <td className="px-3 py-2.5 text-xs text-warm-muted/50">{father}</td>
                    <td className="px-3 py-2.5 text-xs text-warm-muted text-right">{f.status !== 'NO_FEE' ? (f.netAmount / 100).toLocaleString() : '—'}</td>
                    <td className="px-3 py-2.5 text-xs text-green-400 text-right">{f.status !== 'NO_FEE' ? (f.paidAmount / 100).toLocaleString() : '—'}</td>
                    <td className="px-3 py-2.5 text-xs text-red-400 text-right font-medium">{f.status !== 'NO_FEE' && due > 0 ? due.toLocaleString() : f.status !== 'NO_FEE' ? '0' : '—'}</td>
                    <td className="px-2 py-2.5 text-xs text-center">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        f.status === 'PAID' ? 'bg-green-900/20 text-green-400' :
                        f.status === 'PARTIAL' ? 'bg-yellow-900/20 text-yellow-400' :
                        f.status === 'OVERPAID' ? 'bg-blue-900/20 text-blue-400' :
                        f.status === 'NO_FEE' ? 'bg-warm-card/50 text-warm-muted/40' :
                        'bg-red-900/20 text-red-400'
                      }`}>{f.status === 'NO_FEE' ? '—' : f.status}</span>
                    </td>
                    <td className="px-2 py-2.5 text-center">
                      <button onClick={() => router.push(`/admin/fees/student/${s.id}`)}
                        className="rounded bg-warm-accent/20 px-2.5 py-1.5 text-[10px] text-warm-accent hover:bg-warm-accent/30 transition-colors">
                        Pay
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {displayFees.length === 0 && <div className="p-8 text-center text-xs text-warm-muted/40">No students found</div>}
      </div>

    </main>
  );
}
