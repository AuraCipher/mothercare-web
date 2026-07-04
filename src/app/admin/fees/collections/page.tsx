'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { showToast } from '@/components/toast';
import { Search, Users } from 'lucide-react';
import config from '@/config';
import StudentPayModal from '@/components/fees/StudentPayModal';
import FamilyPayModal from '@/components/fees/FamilyPayModal';
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const PAGE_SIZE = 100;

function readPeriod(): 'monthly' | 'full' {
  if (typeof window === 'undefined') return 'monthly';
  const stored = localStorage.getItem('collectionsPeriod');
  return stored === 'full' ? 'full' : 'monthly';
}

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
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [fatherQuery, setFatherQuery] = useState('');
  const [debouncedFather, setDebouncedFather] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 });
  const [payStudentId, setPayStudentId] = useState<string | null>(null);
  const [payFamilyId, setPayFamilyId] = useState<string | null>(null);
  const [period, setPeriod] = useState<'monthly' | 'full'>('monthly');
  const [viewMode, setViewMode] = useState<'class' | 'alpha'>('class');
  const [loading, setLoading] = useState(true);
  const loadGenRef = useRef(0);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const branchId = typeof window !== 'undefined' ? localStorage.getItem('activeBranchId') : null;
  const ayId = typeof window !== 'undefined' ? localStorage.getItem('activeAYId') : null;
  const ayStatus = typeof window !== 'undefined' ? localStorage.getItem('activeAYStatus') : null;
  const isAyArchived = ayStatus === 'ARCHIVED';

  useEffect(() => { setPeriod(readPeriod()); }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedFather(fatherQuery.trim()), 350);
    return () => clearTimeout(t);
  }, [fatherQuery]);

  useEffect(() => { setPage(1); }, [month, year, period, classFilter, debouncedSearch, debouncedFather, rollFilter]);

  const loadData = useCallback(async () => {
    if (!token || !ayId) return;
    const gen = ++loadGenRef.current;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        month: String(month + 1),
        year: String(year),
        period,
        academicYearId: ayId,
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (classFilter) params.set('groupId', classFilter);
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (debouncedFather) params.set('fatherSearch', debouncedFather);
      if (rollFilter.trim()) params.set('roll', rollFilter.trim());

      const [fRes, sRes] = await Promise.all([
        fetch(`${config.apiUrl}/admin/fees/students-list?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(r => r.json()),
        branchId ? fetch(`${config.apiUrl}/admin/branches/${branchId}/academic-years/${ayId}/sections`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(r => r.json()) : Promise.resolve({ success: false }),
      ]);
      if (gen !== loadGenRef.current) return;
      if (!fRes.success) {
        showToast('error', fRes.message || 'Failed to load collections');
        setFees([]);
      } else {
        setFees(fRes.data);
        if (fRes.pagination) setPagination(fRes.pagination);
      }
      if (sRes.success) setSections(sRes.data);
    } catch {
      if (gen === loadGenRef.current) {
        showToast('error', 'Failed to load collections');
        setFees([]);
      }
    } finally {
      if (gen === loadGenRef.current) setLoading(false);
    }
  }, [token, ayId, branchId, month, year, period, classFilter, debouncedSearch, debouncedFather, rollFilter, page]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') loadData(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [loadData]);

  const setPeriodAndPersist = (p: 'monthly' | 'full') => {
    setPeriod(p);
    localStorage.setItem('collectionsPeriod', p);
  };

  const getFather = (student: any) => {
    const father = student?.parents?.find((p: any) => p.parent?.relation === 'Father');
    return father?.parent?.user?.name || father?.parent?.phone || '';
  };

  const displayFees = useMemo(() => {
    let result = fees;
    if (viewMode === 'alpha') {
      result = [...result].sort((a, b) => (a.student?.name || '').localeCompare(b.student?.name || ''));
    } else {
      result = [...result].sort((a, b) => {
        const doA = a.student?.group?.displayOrder ?? 999;
        const doB = b.student?.group?.displayOrder ?? 999;
        if (doA !== doB) return doA - doB;
        const rA = parseInt(a.student?.rollNumber, 10) || 0;
        const rB = parseInt(b.student?.rollNumber, 10) || 0;
        return rA - rB;
      });
    }
    return result;
  }, [fees, viewMode]);

  const summary = useMemo(() => {
    let totalDue = 0;
    let totalPaid = 0;
    let outstanding = 0;
    for (const f of displayFees) {
      if (f.status === 'NO_FEE') continue;
      totalDue += f.netAmount || 0;
      totalPaid += f.paidAmount || 0;
      const due = (f.netAmount || 0) - (f.paidAmount || 0);
      if (due > 0) outstanding += due;
    }
    return { count: displayFees.length, totalDue, totalPaid, outstanding };
  }, [displayFees]);

  const showEmpty = !loading && displayFees.length === 0;
  const showAllNoFee = !loading && displayFees.length > 0 && displayFees.every((f: any) => f.status === 'NO_FEE');
  const showTable = !loading && displayFees.length > 0 && !showAllNoFee;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-light text-warm-cream">Collections</h1>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {(['monthly', 'full'] as const).map(p => (
              <button key={p} onClick={() => setPeriodAndPersist(p)}
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

      {isAyArchived && (
        <div className="mb-4 rounded-lg border border-yellow-600/30 bg-yellow-900/10 px-4 py-3 text-xs text-yellow-400">
          Viewing an archived academic year. Payments are read-only for historical reference.
        </div>
      )}

      {period === 'full' && !loading && fees.some((f: any) => f._isEstimated) && (
        <div className="mb-4 rounded-lg border border-warm-card-border/50 bg-warm-card/30 px-4 py-2 text-[10px] text-warm-muted/70">
          Rows marked <span className="text-yellow-400/80">Est.</span> include projected dues for months not yet generated.
        </div>
      )}

      <div className="rounded-xl border border-warm-card-border bg-warm-card p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[160px] flex-1 max-w-xs">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-muted/50" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by name or roll..."
                className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] pl-8 pr-3 py-2 text-xs text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent" />
            </div>
          </div>
          <div className="min-w-[140px] flex-1 max-w-xs">
            <input value={fatherQuery} onChange={e => setFatherQuery(e.target.value)}
              placeholder="Father name or phone"
              className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent" />
          </div>
          <div className="min-w-[80px]">
            <input value={rollFilter} onChange={e => setRollFilter(e.target.value)}
              placeholder="Roll no"
              className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent" />
          </div>
          <select value={classFilter} onChange={e => setClassFilter(e.target.value)}
            className="rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-xs text-warm-cream outline-none focus:border-warm-accent">
            <option value="">All Classes</option>
            {[...sections].sort((a: any, b: any) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999)).map((s: any) => (
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

      {!loading && displayFees.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-4 text-[10px] text-warm-muted/60">
          <span><span className="text-warm-cream font-medium">{summary.count}</span> students</span>
          <span>Total due <span className="text-warm-cream">{(summary.totalDue / 100).toLocaleString()}</span></span>
          <span>Collected <span className="text-green-400">{(summary.totalPaid / 100).toLocaleString()}</span></span>
          <span>Outstanding <span className="text-red-400">{(summary.outstanding / 100).toLocaleString()}</span></span>
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-warm-card-border overflow-hidden">
          <div className="h-10 bg-warm-card/50 animate-pulse" />
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-12 border-t border-warm-card-border/20 bg-warm-card/20 animate-pulse" />
          ))}
        </div>
      ) : showEmpty ? (
        period === 'monthly' ? (
          <div className="rounded-xl border border-warm-card-border p-12 text-center">
            <p className="text-sm text-warm-muted/60 mb-4">No fees generated for {MONTHS[month]} {year} yet</p>
            <button onClick={() => router.push('/admin/fees/generate')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-warm-accent px-5 py-2.5 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] transition-colors">
              Generate Now
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-warm-card-border p-12 text-center text-xs text-warm-muted/40">No students found</div>
        )
      ) : showAllNoFee ? (
        <div className="rounded-xl border border-warm-card-border p-12 text-center">
          <p className="text-sm text-warm-muted/60 mb-4">No fee structures generated for {MONTHS[month]} {year} yet</p>
          <button onClick={() => router.push('/admin/fees/generate')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-warm-accent px-5 py-2.5 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] transition-colors">
            Generate Now
          </button>
        </div>
      ) : showTable ? (
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
                <th className="text-center px-2 py-3 text-[10px] text-warm-muted font-medium w-28">Action</th>
              </tr>
            </thead>
            <tbody>
              {displayFees.map((f: any, idx: number) => {
                const s = f.student || {};
                const isNoFee = f.status === 'NO_FEE';
                const due = !isNoFee ? (f.netAmount - f.paidAmount) / 100 : 0;
                const father = getFather(s);
                const isEstimated = period === 'full' && f._isEstimated;
                const family = s.family;
                const hasFamily = !!s.familyId && !!family?.id;
                return (
                  <tr key={s.id || f.id || idx} className="border-t border-warm-card-border/20 hover:bg-warm-card/20 transition-colors">
                    <td className="px-3 py-2.5 text-xs text-warm-muted/50">{idx + 1 + (page - 1) * PAGE_SIZE}</td>
                    <td className="px-2 py-2.5 text-xs text-warm-muted">{s.rollNumber || '—'}</td>
                    <td className="px-3 py-2.5">
                      <button onClick={() => router.push(`/admin/fees/student/${s.id}`)}
                        className="text-xs text-warm-cream hover:text-warm-accent transition-colors text-left block">{s.name || 'Unknown'}</button>
                      {hasFamily && (
                        <button
                          onClick={() => router.push(`/admin/fees/families/${family.id}`)}
                          className="mt-0.5 inline-flex items-center gap-1 rounded bg-purple-900/25 px-1.5 py-0.5 text-[9px] text-purple-300/90 hover:bg-purple-900/40 transition-colors"
                          title={`Family: ${family.name}`}
                        >
                          <Users size={9} /> {family.name}
                        </button>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-warm-muted/60">{s.group?.name || ''}{s.group?.section ? ` — ${s.group.section}` : ''}</td>
                    <td className="px-3 py-2.5 text-xs text-warm-muted/50">{father}</td>
                    <td className="px-3 py-2.5 text-xs text-right">
                      {isNoFee ? (
                        <span className="text-yellow-500/50 text-[10px]">Not generated</span>
                      ) : (
                        <span className="text-warm-muted inline-flex items-center gap-1 justify-end">
                          {(f.netAmount / 100).toLocaleString()}
                          {isEstimated && <span className="text-[9px] text-yellow-400/70" title={`${f._missingMonths} month(s) estimated`}>Est.</span>}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-right">
                      {isNoFee ? <span className="text-warm-muted/30">—</span> : <span className="text-green-400">{(f.paidAmount / 100).toLocaleString()}</span>}
                    </td>
                    <td className="px-3 py-2.5 text-xs font-medium text-right">
                      {isNoFee ? '' : due > 0 ? <span className="text-red-400">{due.toLocaleString()}</span> : <span className="text-green-400">0</span>}
                    </td>
                    <td className="px-2 py-2.5 text-xs text-center">
                      {isNoFee ? (
                        <button onClick={() => router.push('/admin/fees/generate')}
                          className="rounded bg-yellow-600/20 px-2 py-1.5 text-[10px] text-yellow-400 hover:bg-yellow-600/30 transition-colors">
                          Generate
                        </button>
                      ) : (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          f.status === 'PAID' ? 'bg-green-900/20 text-green-400' :
                          f.status === 'PARTIAL' ? 'bg-yellow-900/20 text-yellow-400' :
                          f.status === 'OVERPAID' ? 'bg-blue-900/20 text-blue-400' :
                          'bg-red-900/20 text-red-400'
                        }`}>{f.status}</span>
                      )}
                    </td>
                    <td className="px-2 py-2.5 text-center">
                      {!isNoFee && (
                        isAyArchived ? (
                          <span className="text-[10px] text-warm-muted/40">—</span>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <button onClick={() => setPayStudentId(s.id)}
                              className="rounded bg-warm-accent/20 px-2.5 py-1.5 text-[10px] text-warm-accent hover:bg-warm-accent/30 transition-colors w-full">
                              Pay
                            </button>
                            {hasFamily && due > 0 && (
                              <button
                                onClick={() => setPayFamilyId(family.id)}
                                className="rounded bg-purple-900/30 px-2 py-1 text-[9px] text-purple-300 hover:bg-purple-900/45 transition-colors w-full"
                                title={`Pay via family ${family.name}`}
                              >
                                Family
                              </button>
                            )}
                          </div>
                        )
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      ) : null}

      {pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-xs text-warm-muted/60">
          <span>
            Page {pagination.page} of {pagination.totalPages} · {pagination.total} students
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="rounded-lg border border-warm-card-border px-3 py-1.5 hover:text-warm-cream disabled:opacity-40 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages || loading}
              className="rounded-lg border border-warm-card-border px-3 py-1.5 hover:text-warm-cream disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <StudentPayModal
        studentId={payStudentId || ''}
        open={!!payStudentId}
        onClose={() => setPayStudentId(null)}
        token={token}
        ayId={ayId}
      />

      <FamilyPayModal
        familyId={payFamilyId || ''}
        open={!!payFamilyId}
        onClose={() => setPayFamilyId(null)}
        token={token}
        ayId={ayId}
      />

    </main>
  );
}
