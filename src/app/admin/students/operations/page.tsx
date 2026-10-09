'use client';

/**
 * M21 — Students Operations manual WhatsApp handoff.
 *
 * Generate (local, secure) → Save & Send (hash + audit via save-credential)
 * → local approved-message construction → wa.me prefill → USER presses Send.
 * No automated delivery: this page performs no provider calls and imports
 * no messaging/queue services. The only WhatsApp action is browser navigation.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  ArrowLeft,
  Search, ChevronRight,
} from 'lucide-react';
import config from '@/config';
import CredentialDrawer, { CredentialDrawerPerson } from '@/components/credential-drawer';

import { CREDENTIAL_TAG_LABELS } from '@/lib/staff-permissions';
import { formatClassLabel, pickParentWhatsapp } from '@/lib/whatsappCredential';

type StatusFilter = 'all' | 'no_creds' | 'pending' | 'sent';

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All Students' },
  { value: 'no_creds', label: 'No Credentials' },
  { value: 'pending', label: 'Not Sent Yet' },
  { value: 'sent', label: 'Sent' },
];

function statusBadge(status: string | null | undefined) {
  switch (status) {
    case 'sent': return <span className="text-yellow-400 text-xs">⏳ Sent</span>;
    case 'delivered': return <span className="text-green-400 text-xs">📬 Delivered</span>;
    case 'read': return <span className="text-blue-400 text-xs">👁 Seen</span>;
    case 'failed': return <span className="text-red-400 text-xs">❌ Failed</span>;
    default: return <span className="text-warm-muted/50 text-xs">⏺ None</span>;
  }
}

export default function StudentCredentialsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [groupId, setGroupId] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [sections, setSections] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const branchId = typeof window !== 'undefined' ? localStorage.getItem('activeBranchId') : null;
  const ayId = typeof window !== 'undefined' ? localStorage.getItem('activeAYId') : null;

  // Load sections for class filter
  useEffect(() => {
    if (branchId && ayId) {
      api.getSections(branchId, ayId).then(d => { if (d.success) setSections(d.data); }).catch(() => {});
    }
  }, []);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const res = await api.getStudents({ limit: -1, groupId: groupId || undefined, rollNumber: rollNumber || undefined });
      if (res.success) {
        let filtered = res.data;
        // Apply status filter (client-side; no backend status param exists)
        switch (statusFilter) {
          case 'no_creds': filtered = filtered.filter((s: any) => !s.username); break;
          case 'pending': filtered = filtered.filter((s: any) => s.username && !s.credentialSentAt); break;
          case 'sent': filtered = filtered.filter((s: any) => s.credentialStatus === 'sent'); break;
        }
        // Apply search
        if (search.trim()) {
          const q = search.toLowerCase();
          filtered = filtered.filter((s: any) => s.name?.toLowerCase().includes(q) || s.admissionNumber?.toLowerCase().includes(q));
        }
        setStudents(filtered);
      }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadStudents(); }, [statusFilter, search, groupId, rollNumber]);

  // ─── Shared credential drawer wiring (state machine lives in the component) ───
  const [drawerStudent, setDrawerStudent] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const openDrawer = (student: any, trigger: HTMLButtonElement | null) => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    triggerRef.current = trigger;
    setDrawerStudent(student);
    // Mount first, then animate in on the next frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setDrawerOpen(true));
    });
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      setDrawerStudent(null);
      triggerRef.current?.focus();
      triggerRef.current = null;
      closeTimer.current = null;
    }, 300);
  };

  const drawerPerson: CredentialDrawerPerson | null = drawerStudent ? {
    id: drawerStudent.id,
    type: 'student',
    name: drawerStudent.name,
    username: drawerStudent.username,
    phone: pickParentWhatsapp(drawerStudent.parents),
    classLabel: drawerStudent.group ? formatClassLabel(drawerStudent.group.name, drawerStudent.group.section) : null,
    designation: null,
    hasExistingPassword: !!drawerStudent.passwordSetAt,
    saveUrl: `${config.apiUrl}/admin/students/${drawerStudent.id}/save-credential`,
    branchId,
  } : null;

  const handleDrawerSaved = (personId: string, updates: Record<string, any>) => {
    setStudents(prev => prev.map(s => s.id === personId ? { ...s, ...updates } : s));
    setDrawerStudent((prev: any) => prev ? { ...prev, ...updates } : prev);
  };

  const toggleHistory = async (studentId: string) => {
    if (expandedId === studentId) { setExpandedId(null); return; }
    setExpandedId(studentId);
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/students')} className="rounded-lg p-1.5 text-warm-muted hover:bg-warm-card hover:text-warm-cream transition-colors" aria-label="Back to students">
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-lg font-light text-warm-cream">Credentials Management</h1>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] max-w-xs flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-muted" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or admission..."
            className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] pl-8 pr-3 py-1.5 text-xs text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent transition-colors" />
        </div>
        <div className="min-w-[150px]">
          <select value={groupId} onChange={(e) => setGroupId(e.target.value)}
            className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-2.5 py-1.5 text-xs text-warm-cream outline-none focus:border-warm-accent transition-colors" aria-label="Filter by class">
            <option value="">All Classes</option>
            {sections.map((sec: any) => (
              <option key={sec.id} value={sec.id}>{sec.name}{sec.section ? ` — ${sec.section}` : ''}</option>
            ))}
          </select>
        </div>
        <div className="min-w-[100px]">
          <input type="text" value={rollNumber} onChange={(e) => setRollNumber(e.target.value)}
            placeholder="Roll no." autoComplete="off" aria-label="Filter by roll number"
            className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-2.5 py-1.5 text-xs text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent transition-colors" />
        </div>
        {STATUS_OPTIONS.map(opt => (
          <button key={opt.value} onClick={() => setStatusFilter(opt.value)}
            className={`rounded-lg px-2.5 py-1.5 text-[11px] transition-colors ${
              statusFilter === opt.value
                ? 'bg-warm-accent text-[#1a1614] font-medium'
                : 'border border-warm-card-border text-warm-muted hover:text-warm-cream'
            }`}>
            {opt.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-10 animate-pulse rounded-lg bg-warm-card" />)}</div>
      ) : students.length === 0 ? (
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-12 text-center">
          <p className="text-sm text-warm-muted">No students match this filter.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-warm-card-border overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-warm-card/50">
                <th className="text-left px-3 py-2 text-warm-muted font-medium">Name</th>
                <th className="text-left px-3 py-2 text-warm-muted font-medium hidden sm:table-cell">Class</th>
                <th className="text-left px-3 py-2 text-warm-muted font-medium hidden md:table-cell">WhatsApp</th>
                <th className="text-left px-3 py-2 text-warm-muted font-medium hidden lg:table-cell">Username</th>
                <th className="text-left px-3 py-2 text-warm-muted font-medium">Status</th>
                <th className="text-left px-3 py-2 text-warm-muted font-medium hidden md:table-cell">Last WhatsApp Handoff</th>
                <th className="w-20 px-3 py-2"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {students.map((s: any) => (
                <React.Fragment key={s.id}>
                  <tr
                    className="border-t border-warm-card-border/50 hover:bg-warm-card/30 transition-colors cursor-pointer"
                    onClick={() => toggleHistory(s.id)}>
                    <td className="px-3 py-2.5">
                      <p className="text-warm-cream font-medium">{s.name}</p>
                      {s.credentialTag && s.credentialTag !== 'CRED_NONE' && (
                        <span className="mt-0.5 inline-block rounded bg-warm-card-border/40 px-1.5 py-0.5 text-[9px] text-warm-muted">
                          {CREDENTIAL_TAG_LABELS[s.credentialTag] || s.credentialTag}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-warm-muted hidden sm:table-cell">{s.group?.name || '—'}{s.group?.section ? ` — ${s.group.section}` : ''}</td>
                    <td className="px-3 py-2.5 text-warm-muted hidden md:table-cell">{s.studentWhatsapp || s.phone || '—'}</td>
                    <td className="px-3 py-2.5 text-warm-accent font-mono hidden lg:table-cell">{s.username || '—'}</td>
                    <td className="px-3 py-2.5">{statusBadge(s.credentialStatus)}</td>
                    <td className="px-3 py-2.5 text-warm-muted/60 hidden md:table-cell">
                      {s.credentialSentAt ? new Date(s.credentialSentAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-3 py-2.5">
                      <button
                        type="button"
                        aria-label={`Open credentials for ${s.name}`}
                        onClick={(e) => { e.stopPropagation(); openDrawer(s, e.currentTarget); }}
                        className="rounded-lg bg-warm-accent/15 p-2 text-warm-accent transition-colors hover:bg-warm-accent hover:text-[#1a1614]"
                      >
                        <ChevronRight size={18} strokeWidth={2.5} />
                      </button>
                    </td>
                  </tr>
                  {expandedId === s.id && (
                    <tr key={`${s.id}-history`}>
                      <td colSpan={7} className="bg-warm-card/20 px-6 py-4">
                        <div className="text-xs text-warm-muted space-y-1">
                          <p className="text-warm-cream font-medium mb-2">📋 Credential Info</p>
                          <p>👤 Username: <span className="text-warm-accent font-mono">{s.username || '—'}</span></p>
                          <p>📅 Generated: {s.credentialGeneratedAt ? new Date(s.credentialGeneratedAt).toLocaleString() : '—'}</p>
                          <p>🔑 Password last changed: {s.passwordSetAt ? new Date(s.passwordSetAt).toLocaleString() : '—'}</p>
                          <p>📤 Last WhatsApp handoff: {s.credentialSentAt ? new Date(s.credentialSentAt).toLocaleString() : '—'}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CredentialDrawer
        person={drawerPerson}
        open={drawerOpen}
        onClose={closeDrawer}
        triggerRef={triggerRef}
        onSaved={handleDrawerSaved}
      />
    </main>
  );
}
