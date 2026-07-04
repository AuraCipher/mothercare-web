'use client';

import { useState, useEffect, useMemo } from 'react';
import { showToast } from '@/components/toast';
import { RefreshCw, CheckCircle, ChevronDown, ChevronRight, Edit3 } from 'lucide-react';
import config from '@/config';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const CATEGORY_COLORS: Record<string, string> = {
  MONTHLY: 'bg-blue-900/20 text-blue-300',
  TERM: 'bg-purple-900/20 text-purple-300',
  ANNUAL: 'bg-green-900/20 text-green-300',
  ONE_TIME: 'bg-orange-900/20 text-orange-300',
};

function sectionLabel(sec: { name: string; section?: string | null }) {
  return sec.section ? `${sec.name} — ${sec.section}` : sec.name;
}

export default function GenerateFeesPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [heads, setHeads] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [selectedHeadIds, setSelectedHeadIds] = useState<Set<string>>(new Set());
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());
  const [classesPanelOpen, setClassesPanelOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activeMode, setActiveMode] = useState<'generate' | 'update' | 'regenerate' | null>(null);
  const [result, setResult] = useState<{
    generated: number; skipped: number; updated: number; total: number;
    deleted?: number; protected?: number; mode?: string;
    structuresCopied?: number; groupsProvisioned?: string[];
    skippedNoStructure?: number;
  } | null>(null);
  const [loadingHeads, setLoadingHeads] = useState(true);
  const [loadingSections, setLoadingSections] = useState(true);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const branchId = typeof window !== 'undefined' ? localStorage.getItem('activeBranchId') : null;
  const ayId = typeof window !== 'undefined' ? localStorage.getItem('activeAYId') : null;

  useEffect(() => {
    if (!token) return;
    const loadHeads = async () => {
      try {
        const res = await fetch(`${config.apiUrl}/admin/fee-heads`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.success) {
          const activeHeads = json.data.filter((h: any) => h.isActive !== false);
          setHeads(activeHeads);
          setSelectedHeadIds(new Set(activeHeads.map((h: any) => h.id)));
        }
      } catch {} finally { setLoadingHeads(false); }
    };
    loadHeads();
  }, [token]);

  useEffect(() => {
    if (!token || !branchId || !ayId) {
      setLoadingSections(false);
      return;
    }
    const loadSections = async () => {
      setLoadingSections(true);
      try {
        const res = await fetch(
          `${config.apiUrl}/admin/branches/${branchId}/academic-years/${ayId}/sections`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const json = await res.json();
        if (json.success) {
          const list = (json.data || []).sort((a: any, b: any) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
          setSections(list);
          setSelectedGroupIds(new Set(list.map((s: any) => s.id)));
        }
      } catch {} finally { setLoadingSections(false); }
    };
    loadSections();
  }, [token, branchId, ayId]);

  const groupedSections = useMemo(() => {
    const grouped = sections.reduce<Record<string, any[]>>((acc, s) => {
      if (!acc[s.name]) acc[s.name] = [];
      acc[s.name].push(s);
      return acc;
    }, {});
    return Object.entries(grouped).sort(([, a], [, b]) => (a[0]?.displayOrder ?? 0) - (b[0]?.displayOrder ?? 0));
  }, [sections]);

  const toggleHead = (id: string) => {
    const next = new Set(selectedHeadIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    if (next.size === 0) next.add(id);
    setSelectedHeadIds(next);
  };

  const toggleGroup = (id: string) => {
    const next = new Set(selectedGroupIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    if (next.size === 0) next.add(id);
    setSelectedGroupIds(next);
  };

  const toggleClassGroup = (className: string, classSections: any[]) => {
    const ids = classSections.map(s => s.id);
    const allSelected = ids.every(id => selectedGroupIds.has(id));
    const next = new Set(selectedGroupIds);
    if (allSelected) {
      ids.forEach(id => next.delete(id));
      if (next.size === 0) ids.forEach(id => next.add(id));
    } else {
      ids.forEach(id => next.add(id));
    }
    setSelectedGroupIds(next);
  };

  const toggleExpanded = (className: string) => {
    const next = new Set(expandedClasses);
    if (next.has(className)) next.delete(className); else next.add(className);
    setExpandedClasses(next);
  };

  const classGroupState = (classSections: any[]) => {
    const ids = classSections.map(s => s.id);
    const selectedCount = ids.filter(id => selectedGroupIds.has(id)).length;
    return {
      allSelected: selectedCount === ids.length,
      someSelected: selectedCount > 0 && selectedCount < ids.length,
    };
  };

  const handleAction = async (mode: 'generate' | 'update' | 'regenerate') => {
    if (!token) return;
    if (!ayId) { showToast('error', 'Select an academic year first'); return; }
    if (selectedGroupIds.size === 0) { showToast('error', 'Select at least one class'); return; }
    if (mode === 'regenerate' && !window.confirm('Regenerate will delete unpaid fees for the selected month and recreate them. Fees with payments are protected. Continue?')) return;
    setGenerating(true);
    setActiveMode(mode);
    setResult(null);
    try {
      const res = await fetch(`${config.apiUrl}/admin/student-fees/generate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: month + 1,
          year,
          headIds: Array.from(selectedHeadIds),
          groupIds: Array.from(selectedGroupIds),
          academicYearId: ayId,
          mode,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setResult(json.data);
        const d = json.data;
        if (mode === 'generate') {
          let msg = `Generated ${d.generated} new fees`;
          if (d.structuresCopied > 0) {
            msg += ` · set up ${d.structuresCopied} fee structure(s) for ${d.groupsProvisioned?.length ?? 0} class(es)`;
          }
          if (d.generated === 0 && d.skipped > 0) {
            msg += ` (${d.skipped} already had fees for this month)`;
          }
          showToast(d.generated > 0 || d.structuresCopied > 0 ? 'success' : 'error', msg);
        } else if (mode === 'update') showToast('success', `Updated ${d.updated} fees`);
        else showToast('success', `Regenerated: ${d.generated} created, ${d.deleted ?? 0} deleted`);
      } else showToast('error', json.message || 'Failed');
    } catch { showToast('error', 'Failed'); }
    finally { setGenerating(false); setActiveMode(null); }
  };

  const byCategory: Record<string, any[]> = {};
  for (const h of heads) {
    const cat = h.category || 'MONTHLY';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(h);
  }
  const categoryOrder = ['MONTHLY', 'TERM', 'ANNUAL', 'ONE_TIME'];
  const loading = loadingHeads || loadingSections;
  const allClassesSelected = sections.length > 0 && selectedGroupIds.size === sections.length;
  const classesSummary = sections.length === 0
    ? 'No classes'
    : allClassesSelected
      ? `All ${sections.length} selected`
      : `${selectedGroupIds.size} of ${sections.length} selected`;

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-xl font-light text-warm-cream mb-6">Generate Fees</h1>

      <div className="rounded-xl border border-warm-card-border bg-warm-card p-6">
        <div className="flex items-end gap-4 mb-6">
          <div>
            <label className="block text-[10px] text-warm-muted/60 uppercase tracking-wider mb-1.5">Month</label>
            <select value={month} onChange={e => setMonth(Number(e.target.value))}
              className="rounded-lg border border-warm-card-border bg-[#1a1614] px-4 py-2.5 text-sm text-warm-cream outline-none focus:border-warm-accent">
              {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-warm-muted/60 uppercase tracking-wider mb-1.5">Year</label>
            <input type="number" value={year} onChange={e => setYear(Number(e.target.value))}
              className="rounded-lg border border-warm-card-border bg-[#1a1614] px-4 py-2.5 text-sm text-warm-cream outline-none focus:border-warm-accent w-24" />
          </div>
          <div className="flex flex-wrap gap-2 ml-auto">
            <button onClick={() => handleAction('generate')} disabled={generating || loading || selectedHeadIds.size === 0 || selectedGroupIds.size === 0}
              className="inline-flex items-center gap-1.5 rounded-lg bg-warm-accent px-4 py-2.5 text-sm font-medium text-[#1a1614] hover:bg-[#b39a76] disabled:opacity-50 transition-colors">
              {generating && activeMode === 'generate' ? <RefreshCw size={15} className="animate-spin" /> : <CheckCircle size={15} />}
              {generating && activeMode === 'generate' ? 'Generating...' : 'Generate'}
            </button>
            <button onClick={() => handleAction('update')} disabled={generating || loading || selectedHeadIds.size === 0 || selectedGroupIds.size === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-warm-accent/40 bg-warm-accent/10 px-4 py-2.5 text-sm font-medium text-warm-accent hover:bg-warm-accent/20 disabled:opacity-50 transition-colors">
              {generating && activeMode === 'update' ? <RefreshCw size={15} className="animate-spin" /> : <Edit3 size={15} />}
              {generating && activeMode === 'update' ? 'Updating...' : 'Update'}
            </button>
            <button onClick={() => handleAction('regenerate')} disabled={generating || loading || selectedHeadIds.size === 0 || selectedGroupIds.size === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-orange-500/40 bg-orange-900/20 px-4 py-2.5 text-sm font-medium text-orange-300 hover:bg-orange-900/30 disabled:opacity-50 transition-colors">
              {generating && activeMode === 'regenerate' ? <RefreshCw size={15} className="animate-spin" /> : <RefreshCw size={15} />}
              {generating && activeMode === 'regenerate' ? 'Regenerating...' : 'Regenerate'}
            </button>
          </div>
        </div>

        {/* Classes — whole panel collapsed by default, all selected */}
        <div className="mb-6">
          <button type="button" onClick={() => setClassesPanelOpen(o => !o)}
            className="flex w-full items-center gap-2 mb-3 text-left group">
            {classesPanelOpen ? <ChevronDown size={14} className="text-warm-muted" /> : <ChevronRight size={14} className="text-warm-muted" />}
            <span className="text-[10px] text-warm-muted/60 uppercase tracking-wider group-hover:text-warm-muted transition-colors">Classes to Include</span>
            {!loadingSections && sections.length > 0 && (
              <span className="text-[10px] text-warm-accent/80 ml-auto">{classesSummary}</span>
            )}
          </button>
          {classesPanelOpen && (
            loadingSections ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <div key={i} className="h-10 animate-pulse rounded-lg bg-warm-card/50" />)}
              </div>
            ) : sections.length === 0 ? (
              <p className="text-xs text-warm-muted/40">No classes found for this academic year.</p>
            ) : (
              <div className="rounded-lg border border-warm-card-border/40 divide-y divide-warm-card-border/20">
                {groupedSections.map(([className, classSections]) => {
                  const expanded = expandedClasses.has(className);
                  const hasMultiple = classSections.length > 1 || !!classSections[0]?.section;
                  const { allSelected, someSelected } = classGroupState(classSections);
                  return (
                    <div key={className}>
                      <div className="flex items-center gap-2 px-3 py-2.5 hover:bg-warm-card/30 transition-colors">
                        {hasMultiple ? (
                          <button type="button" onClick={() => toggleExpanded(className)}
                            className="p-0.5 text-warm-muted hover:text-warm-cream transition-colors">
                            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </button>
                        ) : (
                          <span className="w-5" />
                        )}
                        <label className="flex flex-1 items-center gap-3 cursor-pointer min-w-0">
                          <input type="checkbox"
                            checked={allSelected}
                            ref={el => { if (el) el.indeterminate = someSelected; }}
                            onChange={() => hasMultiple ? toggleClassGroup(className, classSections) : toggleGroup(classSections[0].id)}
                            className="rounded border-warm-card-border bg-[#1a1614] text-warm-accent focus:ring-warm-accent shrink-0" />
                          <span className="text-sm text-warm-cream truncate">{className}</span>
                          {hasMultiple && (
                            <span className="text-[10px] text-warm-muted/50 shrink-0">
                              {classSections.filter(s => selectedGroupIds.has(s.id)).length}/{classSections.length}
                            </span>
                          )}
                        </label>
                      </div>
                      {hasMultiple && expanded && (
                        <div className="pb-1">
                          {classSections.map(sec => (
                            <label key={sec.id}
                              className="flex items-center gap-3 pl-10 pr-3 py-1.5 hover:bg-warm-card/20 cursor-pointer transition-colors">
                              <input type="checkbox" checked={selectedGroupIds.has(sec.id)} onChange={() => toggleGroup(sec.id)}
                                className="rounded border-warm-card-border bg-[#1a1614] text-warm-accent focus:ring-warm-accent" />
                              <span className="text-xs text-warm-muted">{sectionLabel(sec)}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>

        {/* Fee heads checkboxes — grouped by category */}
        <div className="mb-6">
          <label className="block text-[10px] text-warm-muted/60 uppercase tracking-wider mb-3">Fee Heads to Include</label>
          {loadingHeads ? (
            <div className="space-y-2">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-warm-card/50" />
              ))}
            </div>
          ) : heads.length === 0 ? (
            <p className="text-xs text-warm-muted/40">No fee heads found. Create some under Fee Heads first.</p>
          ) : (
            <div className="space-y-1">
              {categoryOrder.map(cat => {
                const catHeads = byCategory[cat];
                if (!catHeads || catHeads.length === 0) return null;
                const displayName = cat === 'ONE_TIME' ? 'One-Time' : cat.charAt(0) + cat.slice(1).toLowerCase();
                return (
                  <div key={cat} className="mb-3">
                    <p className="text-[10px] text-warm-muted/40 uppercase tracking-wider mb-1.5 ml-1">{displayName}</p>
                    {catHeads.map(h => (
                      <label key={h.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-warm-card/50 cursor-pointer transition-colors">
                        <input type="checkbox" checked={selectedHeadIds.has(h.id)} onChange={() => toggleHead(h.id)}
                          className="rounded border-warm-card-border bg-[#1a1614] text-warm-accent focus:ring-warm-accent" />
                        <span className="text-sm text-warm-cream flex-1">{h.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${CATEGORY_COLORS[cat] || 'bg-gray-900/20 text-gray-300'}`}>
                          {cat}
                        </span>
                      </label>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {result && (
          <div className="rounded-lg border border-warm-card-border/30 bg-warm-card/50 p-4">
            <p className="text-xs text-warm-muted/50 uppercase tracking-wider mb-2">{result.mode || 'generate'} result</p>
            {result.mode === 'generate' && (
              <>
                <p className="text-sm text-warm-cream">
                  Generated: <strong className="text-green-400">{result.generated}</strong>
                </p>
                {(result.structuresCopied ?? 0) > 0 && (
                  <p className="text-xs text-warm-muted/70 mt-1">
                    Fee structures copied: <strong className="text-warm-accent">{result.structuresCopied}</strong>
                    {result.groupsProvisioned && result.groupsProvisioned.length > 0 && (
                      <span> for {result.groupsProvisioned.join(', ')}</span>
                    )}
                  </p>
                )}
                {(result.skippedNoStructure ?? 0) > 0 && (
                  <p className="text-xs text-orange-300/90 mt-1">
                    {result.skippedNoStructure} student(s) still have no fee structure for their class
                  </p>
                )}
              </>
            )}
            {result.mode === 'update' && (
              <p className="text-sm text-warm-cream">
                Updated: <strong className="text-warm-accent">{result.updated}</strong>
              </p>
            )}
            {result.mode === 'regenerate' && (
              <p className="text-sm text-warm-cream">
                Created: <strong className="text-green-400">{result.generated}</strong>
                {(result.deleted ?? 0) > 0 && <span className="ml-2">· Deleted unpaid: <strong className="text-orange-300">{result.deleted}</strong></span>}
                {(result.protected ?? 0) > 0 && <span className="ml-2">· Protected (paid): <strong>{result.protected}</strong></span>}
              </p>
            )}
            <p className="text-xs text-warm-muted/60 mt-1">Skipped: {result.skipped}</p>
            <p className="text-xs text-warm-muted/60">Students processed: {result.total}</p>
          </div>
        )}
      </div>
    </main>
  );
}
