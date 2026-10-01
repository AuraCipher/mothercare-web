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
  ArrowLeft, RefreshCw, Eye, EyeOff, X,
  Search, ChevronRight,
} from 'lucide-react';
import { showToast } from '@/components/toast';
import config from '@/config';
import ConfirmModal from '@/components/confirm-modal';

import { CREDENTIAL_TAG_LABELS } from '@/lib/staff-permissions';
import {
  buildStudentCredentialMessage,
  buildWhatsAppUrl,
  formatClassLabel,
  generateSecurePassword,
  normalizePhoneDigits,
} from '@/lib/whatsappCredential';

type StatusFilter = 'all' | 'no_creds' | 'pending' | 'sent';

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All Students' },
  { value: 'no_creds', label: 'No Credentials' },
  { value: 'pending', label: 'Not Sent Yet' },
  { value: 'sent', label: 'Sent' },
];

type DrawerPhase =
  | 'ready'
  | 'generated'
  | 'saving'
  | 'blocked'
  | 'done';

function statusBadge(status: string | null | undefined) {
  switch (status) {
    case 'sent': return <span className="text-yellow-400 text-xs">⏳ Sent</span>;
    case 'delivered': return <span className="text-green-400 text-xs">📬 Delivered</span>;
    case 'read': return <span className="text-blue-400 text-xs">👁 Seen</span>;
    case 'failed': return <span className="text-red-400 text-xs">❌ Failed</span>;
    default: return <span className="text-warm-muted/50 text-xs">⏺ None</span>;
  }
}

function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '—';
  const t = phone.trim();
  return t.length > 6 ? `${t.slice(0, 4)}****${t.slice(-2)}` : '****';
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

  // ─── Drawer state (M21 state machine: ready → generated → saving → done/blocked) ───
  const [drawerStudent, setDrawerStudent] = useState<any | null>(null);
  const [phase, setPhase] = useState<DrawerPhase>('ready');
  const [drawerPassword, setDrawerPassword] = useState('');
  const [generatedAt, setGeneratedAt] = useState<number | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);
  const [replaceConfirmed, setReplaceConfirmed] = useState(false);
  const [showAdminStep, setShowAdminStep] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [drawerError, setDrawerError] = useState('');
  const [handoffUrl, setHandoffUrl] = useState('');
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

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

  // ─── Drawer open/close + focus management ───
  // drawerStudent mounts the drawer; drawerOpen drives the slide in/out
  // animation (unmount happens after the slide-out finishes).
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openDrawer = (student: any, trigger: HTMLButtonElement | null) => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    triggerRef.current = trigger;
    setDrawerStudent(student);
    setPhase('ready');
    setDrawerPassword('');
    setGeneratedAt(null);
    setIdempotencyKey('');
    setShowPassword(false);
    setShowReplaceConfirm(false);
    setReplaceConfirmed(false);
    setShowAdminStep(false);
    setAdminPassword('');
    setDrawerError('');
    setHandoffUrl('');
    setSavedAt(null);
    // Mount first, then animate in on the next frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setDrawerOpen(true));
    });
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setShowReplaceConfirm(false);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      setDrawerStudent(null);
      setPhase('ready');
      setDrawerError('');
      // Return focus to the triggering arrow
      triggerRef.current?.focus();
      triggerRef.current = null;
      closeTimer.current = null;
    }, 300);
  };

  useEffect(() => {
    if (drawerStudent && drawerOpen) {
      closeRef.current?.focus();
    }
  }, [drawerStudent, drawerOpen]);

  // Escape closes drawer (replacement modal handles its own Escape)
  useEffect(() => {
    if (!drawerStudent || showReplaceConfirm) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDrawer();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerStudent, showReplaceConfirm]);

  // Simple focus trap inside the drawer
  const trapTab = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab' || !drawerRef.current) return;
    const focusables = drawerRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled])',
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  // ─── Drawer gates (mirrored by backend save-credential preconditions) ───
  const ds = drawerStudent;
  const hasUsername = !!ds?.username;
  const hasClass = !!ds?.group;
  const rawPhone: string | null = ds ? (ds.studentWhatsapp || ds.phone || null) : null;
  const hasPhone = !!rawPhone;
  const canGenerate = hasUsername && hasClass;
  const canSaveSend = hasPhone && hasUsername && hasClass && drawerPassword.length > 0;
  const hasExistingPassword = !!ds?.passwordSetAt;

  const handleGenerate = () => {
    if (!canGenerate) return;
    try {
      setDrawerPassword(generateSecurePassword());
    } catch {
      setDrawerError('Secure random generator unavailable in this browser.');
      return;
    }
    setGeneratedAt(Date.now());
    setIdempotencyKey(crypto.randomUUID());
    setShowPassword(false);
    setReplaceConfirmed(false);
    setShowAdminStep(false);
    setDrawerError('');
    setHandoffUrl('');
    setSavedAt(null);
    setPhase('generated');
  };

  const handleSaveSendClick = () => {
    if (!canSaveSend || phase === 'saving') return;
    setDrawerError('');
    // Replacement confirmation first when the row shows an existing password.
    // Backend re-checks authoritatively (stale-row safe) and returns
    // PASSWORD_REPLACEMENT_REQUIRED if confirmation is still needed.
    if (hasExistingPassword && !replaceConfirmed) {
      setShowReplaceConfirm(true);
      return;
    }
    setShowAdminStep(true);
  };

  const handleReplaceCancel = () => {
    // M21 §16: back to the exact pre-click state — no mutation of any kind.
    setShowReplaceConfirm(false);
  };

  const handleReplaceConfirm = () => {
    setShowReplaceConfirm(false);
    setReplaceConfirmed(true);
    setShowAdminStep(true);
  };

  const doSave = async () => {
    if (!ds || !canSaveSend || phase === 'saving') return;
    if (!adminPassword) {
      setDrawerError('Enter your admin password to authorize this save.');
      return;
    }
    // Popup-safe: open the blank window synchronously in the click gesture,
    // navigate it only after the backend confirms the save.
    const popup = window.open('about:blank', '_blank');
    const popupBlocked = !popup;
    setPhase('saving');
    setDrawerError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${config.apiUrl}/admin/students/${ds.id}/save-credential`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: drawerPassword,
          adminPassword,
          replaceExisting: replaceConfirmed,
          idempotencyKey: idempotencyKey || undefined,
          branchId: branchId || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        popup?.close();
        if (data.code === 'PASSWORD_REPLACEMENT_REQUIRED') {
          // Stale row data: backend is authoritative — confirm, keep exact P1.
          setShowAdminStep(false);
          setAdminPassword('');
          setShowReplaceConfirm(true);
          setPhase('generated');
        } else {
          setDrawerError(data.message || 'Save failed. Nothing was changed.');
          setPhase('generated');
        }
        return;
      }
      // SUCCESS — build the message with EXACTLY the drawer password (P1).
      const website: string = data.data?.website || '';
      const school: string = data.data?.schoolName || '';
      const appUrl: string = data.data?.appUrl || '';
      const message = buildStudentCredentialMessage({
        school,
        name: ds.name,
        className: formatClassLabel(ds.group.name, ds.group.section),
        website,
        username: ds.username,
        password: drawerPassword,
        appUrl,
      });
      const digits = normalizePhoneDigits(rawPhone as string);
      const url = buildWhatsAppUrl(digits, message);
      setHandoffUrl(url);
      setSavedAt(data.data?.credentialSentAt || new Date().toISOString());
      setAdminPassword('');
      // Update the row optimistically (no full refetch).
      setStudents(prev => prev.map(s => s.id === ds.id ? {
        ...s,
        credentialSentAt: data.data?.credentialSentAt || new Date().toISOString(),
        credentialStatus: 'sent',
        passwordSetAt: data.data?.credentialSentAt || new Date().toISOString(),
        credentialGeneratedAt: data.data?.credentialGeneratedAt || new Date().toISOString(),
      } : s));
      setDrawerStudent((prev: any) => prev ? {
        ...prev,
        credentialSentAt: data.data?.credentialSentAt || new Date().toISOString(),
        credentialStatus: 'sent',
        passwordSetAt: data.data?.credentialSentAt || new Date().toISOString(),
      } : prev);
      if (popup && !popup.closed) {
        popup.location.href = url;
        setPhase('done');
        showToast('success', 'Credential saved — WhatsApp opened');
      } else {
        // M21 §31 fallback: SAME url, no re-save, no regeneration.
        setPhase('blocked');
      }
    } catch {
      popup?.close();
      setDrawerError('Network error. Nothing was saved — safe to retry.');
      setPhase('generated');
    }
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
          <Users size={20} className="text-warm-accent" />
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

      {/* ─── Credential drawer ─── */}
      {ds && (
        <div className="fixed inset-0 z-50" role="presentation">
          <div
            className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ease-out ${drawerOpen ? 'opacity-100' : 'opacity-0'}`}
            onClick={closeDrawer}
            aria-hidden="true"
          />
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Student credentials for ${ds.name}`}
            onKeyDown={trapTab}
            className={`absolute right-0 top-0 flex h-full w-full max-w-sm flex-col border-l border-warm-card-border bg-[#1a1614] shadow-2xl transition-transform duration-300 ease-out ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
          >
            <div className="flex items-center justify-between border-b border-warm-card-border px-5 py-4">
              <h2 className="text-sm font-medium text-warm-cream">Student Credentials</h2>
              <button
                ref={closeRef}
                type="button"
                onClick={closeDrawer}
                aria-label="Close credentials drawer"
                className="rounded p-1.5 text-warm-muted hover:bg-warm-card hover:text-warm-cream transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
              <div>
                <p className="mb-1 text-[11px] uppercase tracking-wide text-warm-muted">Student Name</p>
                <p className="text-sm text-warm-cream">{ds.name}</p>
              </div>
              <div>
                <p className="mb-1 text-[11px] uppercase tracking-wide text-warm-muted">Class</p>
                <p className="text-sm text-warm-cream">
                  {ds.group ? formatClassLabel(ds.group.name, ds.group.section) : '—'}
                </p>
              </div>
              <div>
                <p className="mb-1 text-[11px] uppercase tracking-wide text-warm-muted">WhatsApp</p>
                <p className="text-sm text-warm-cream">{maskPhone(ds.studentWhatsapp || ds.phone)}</p>
              </div>
              <div>
                <p className="mb-1 text-[11px] uppercase tracking-wide text-warm-muted">Username</p>
                <p className="font-mono text-sm text-warm-accent">{ds.username || '—'}</p>
              </div>
              <div>
                <p className="mb-1 text-[11px] uppercase tracking-wide text-warm-muted">Password</p>
                <div className="flex items-center gap-2">
                  <p className="min-h-[1.25rem] flex-1 font-mono text-sm text-warm-cream" aria-live="polite">
                    {drawerPassword ? (showPassword ? drawerPassword : '••••••••••••') : <span className="text-warm-muted/40">—</span>}
                  </p>
                  {drawerPassword && (
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      aria-pressed={showPassword}
                      className="rounded p-1.5 text-warm-muted hover:bg-warm-card hover:text-warm-cream transition-colors"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  )}
                </div>
              </div>

              {!canGenerate && (
                <p role="alert" className="rounded-lg border border-yellow-900/40 bg-yellow-900/10 px-3 py-2 text-xs text-yellow-300">
                  Username and class are required before generating credentials.
                </p>
              )}
              {!hasPhone && (
                <p role="alert" className="rounded-lg border border-yellow-900/40 bg-yellow-900/10 px-3 py-2 text-xs text-yellow-300">
                  A WhatsApp/phone number is required before Save &amp; Send.
                </p>
              )}
              {drawerError && (
                <p role="alert" className="rounded-lg border border-red-900/40 bg-red-900/10 px-3 py-2 text-xs text-red-300">
                  {drawerError}
                </p>
              )}
              {phase === 'done' && (
                <p role="status" className="rounded-lg border border-green-900/40 bg-green-900/10 px-3 py-2 text-xs text-green-300">
                  Credential saved{savedAt ? ` (${new Date(savedAt).toLocaleString()})` : ''} — WhatsApp opened with the message prefilled. Press Send inside WhatsApp to deliver it.
                </p>
              )}
              {phase === 'blocked' && (
                <div role="alert" className="rounded-lg border border-yellow-900/40 bg-yellow-900/10 px-3 py-2 text-xs text-yellow-300">
                  <p className="mb-2">Credential saved successfully. WhatsApp could not be opened automatically.</p>
                  <a
                    href={handoffUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] transition-colors"
                  >
                    Open WhatsApp
                  </a>
                </div>
              )}

              <button
                type="button"
                onClick={handleGenerate}
                disabled={!canGenerate || phase === 'saving'}
                title={!canGenerate ? 'Username and class are required before generating credentials.' : 'Generate password'}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-warm-accent/10 px-3 py-2 text-xs text-warm-accent hover:bg-warm-accent/20 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              >
                <RefreshCw size={13} /> Generate
              </button>

              <button
                type="button"
                onClick={handleSaveSendClick}
                disabled={!canSaveSend || phase === 'saving' || showAdminStep}
                title={!canSaveSend ? 'WhatsApp number, username, class and a generated password are required.' : 'Save & Send'}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-warm-accent px-3 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              >
                {phase === 'saving' ? 'Saving…' : 'Save & Send'}
              </button>

              {showAdminStep && phase !== 'saving' && (
                <div className="space-y-2 rounded-lg border border-warm-card-border bg-warm-card/30 p-3">
                  <label htmlFor="drawer-admin-password" className="text-xs text-warm-muted">
                    Enter your admin password to authorize this save.
                  </label>
                  <input
                    id="drawer-admin-password"
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') doSave(); }}
                    placeholder="Your password"
                    autoComplete="current-password"
                    className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent transition-colors"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setShowAdminStep(false); setAdminPassword(''); }}
                      className="flex-1 rounded-lg border border-warm-card-border px-3 py-2 text-xs text-warm-muted hover:text-warm-cream transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={doSave}
                      className="flex-1 rounded-lg bg-warm-accent px-3 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] transition-colors"
                    >
                      Confirm Save
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Replacement confirmation: No mutation on Cancel (M21 §16) */}
      <ConfirmModal
        open={showReplaceConfirm}
        title="Password already exists"
        message="This student already has a password. Do you want to replace it with the newly generated password?"
        confirmLabel="Yes, Replace"
        cancelLabel="No, Cancel"
        variant="warning"
        onConfirm={handleReplaceConfirm}
        onCancel={handleReplaceCancel}
      />
    </main>
  );
}
