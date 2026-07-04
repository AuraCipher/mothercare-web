'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  ArrowLeft, Send, RefreshCw, Save, Key, Check, X,
  Users, Search, Filter, GraduationCap, BookOpen, ChevronDown, ChevronRight,
} from 'lucide-react';
import { showToast } from '@/components/toast';
import config from '@/config';

type StatusFilter = 'all' | 'no_creds' | 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All Students' },
  { value: 'no_creds', label: 'No Credentials' },
  { value: 'pending', label: 'Not Sent Yet' },
  { value: 'sent', label: 'Sent' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'read', label: 'Read / Seen' },
  { value: 'failed', label: 'Failed' },
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sendHistory, setSendHistory] = useState<Record<string, any[]>>({});
  const [passwords, setPasswords] = useState<Record<string, string>>({});
  const [credStatus, setCredStatus] = useState<Record<string, { saved: boolean }>>({});
  const [showAdminPopup, setShowAdminPopup] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminPassError, setAdminPassError] = useState('');
  const [savingAll, setSavingAll] = useState(false);
  const [pendingSaveTargets, setPendingSaveTargets] = useState<string[]>([]);

  const generatePassword = (): string => {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const digits = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const all = upper + lower + digits + special;
    let pw = '';
    pw += upper[Math.floor(Math.random() * upper.length)];
    pw += lower[Math.floor(Math.random() * lower.length)];
    pw += digits[Math.floor(Math.random() * digits.length)];
    pw += special[Math.floor(Math.random() * special.length)];
    for (let i = 0; i < 8; i++) pw += all[Math.floor(Math.random() * all.length)];
    const arr = pw.split('');
    for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
    return arr.join('');
  };

  const handleGenerate = (studentId: string) => {
    setPasswords(prev => ({ ...prev, [studentId]: generatePassword() }));
  };

  const handleGenerateAll = async () => {
    let count = 0;
    for (const s of students) {
      if (!s.username || !passwords[s.id]) {
        handleGenerate(s.id);
        count++;
      }
    }
    if (count > 0) showToast('success', `Passwords generated for ${count} students`);
    else showToast('info', 'All students already have passwords');
  };

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
        // Apply status filter
        switch (statusFilter) {
          case 'no_creds': filtered = filtered.filter((s: any) => !s.username); break;
          case 'pending': filtered = filtered.filter((s: any) => s.username && !s.credentialSentAt); break;
          case 'sent': filtered = filtered.filter((s: any) => s.credentialStatus === 'sent'); break;
          case 'delivered': filtered = filtered.filter((s: any) => s.credentialDeliveredAt && !s.credentialSeenAt); break;
          case 'read': filtered = filtered.filter((s: any) => s.credentialSeenAt); break;
          case 'failed': filtered = filtered.filter((s: any) => s.credentialStatus === 'failed'); break;
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

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === students.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(students.map(s => s.id)));
  };

  // Ensure a student has a User account before saving password
  const ensureUser = async (studentId: string, token: string) => {
    const s = students.find(st => st.id === studentId);
    if (s?.userId) return true; // already has User
    const res = await fetch(`${config.apiUrl}/admin/students/${studentId}/generate-credentials`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return data.success;
  };

  const savePassword = async (studentId: string, password: string, adminPass: string, token: string) => {
    // First ensure User exists (generate credentials if needed)
    await ensureUser(studentId, token);
    const res = await fetch(`${config.apiUrl}/admin/students/${studentId}/set-password`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, adminPassword: adminPass }),
    });
    const data = await res.json();
    return data;
  };

  const handleSaveClick = (studentId: string) => {
    const pw = passwords[studentId];
    if (!pw) { showToast('info', 'Generate a password first'); return; }
    setPendingSaveTargets([studentId]);
    setShowAdminPopup(true);
  };

  const handleSaveAllClick = () => {
    const pending = Object.entries(passwords).filter(([sid]) => !credStatus[sid]?.saved);
    if (pending.length === 0) { showToast('info', 'No unsaved passwords'); return; }
    setPendingSaveTargets(pending.map(([sid]) => sid));
    setShowAdminPopup(true);
  };

  const handleAdminVerify = async () => {
    if (!adminPassword.trim()) { setAdminPassError('Enter your password'); return; }
    setSavingAll(true);
    try {
      let successCount = 0;
      const token = localStorage.getItem('token');
      if (!token) return;
      for (const sid of pendingSaveTargets) {
        const pw = passwords[sid];
        if (!pw) continue;
        try {
          const data = await savePassword(sid, pw, adminPassword, token);
          if (data.success) { setCredStatus(prev => ({ ...prev, [sid]: { saved: true } })); successCount++; }
        } catch {}
      }
      showToast('success', `${successCount}/${pendingSaveTargets.length} saved`);
    } finally {
      setShowAdminPopup(false); setAdminPassword(''); setAdminPassError(''); setSavingAll(false); setPendingSaveTargets([]);
    }
  };

  const handleSend = async (studentId: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${config.apiUrl}/admin/students/${studentId}/send-credentials`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) showToast('success', 'Sent via WhatsApp');
      else showToast('error', data.message || 'Failed');
      loadStudents();
    } catch { showToast('error', 'Failed'); }
  };

  const handleSendSelected = async () => {
    if (selectedIds.size === 0) { showToast('info', 'Select students first'); return; }
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${config.apiUrl}/admin/students/send-all-credentials`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIds: Array.from(selectedIds) }),
      });
      const data = await res.json();
      if (data.success) showToast('success', `${data.data.sent} sent, ${data.data.failed} failed`);
      else showToast('error', data.message || 'Failed');
      loadStudents();
    } catch { showToast('error', 'Failed'); }
  };

  const handleSendToNew = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${config.apiUrl}/admin/students/send-to-new`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          academicYearId: ayId,
          branchId,
        }),
      });
      const data = await res.json();
      if (data.success) showToast('success', `${data.data.sent} sent, ${data.data.skipped} skipped`);
      else showToast('error', data.message || 'Failed');
      loadStudents();
    } catch { showToast('error', 'Failed'); }
  };

  const toggleHistory = async (studentId: string) => {
    if (expandedId === studentId) { setExpandedId(null); return; }
    setExpandedId(studentId);
    if (!sendHistory[studentId]) {
      try {
        const token = localStorage.getItem('token');
        // Fetch from a simple endpoint - for now show from the student data
        setSendHistory(prev => ({ ...prev, [studentId]: [{ status: 'info', msg: 'Send history tracked in CredentialSend table', }] }));
      } catch {}
    }
  };

  const pendingCount = students.filter((s: any) => s.username && !s.credentialSentAt).length;
  const failedCount = students.filter((s: any) => s.credentialStatus === 'failed').length;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/students')} className="rounded-lg p-1.5 text-warm-muted hover:bg-warm-card hover:text-warm-cream transition-colors">
            <ArrowLeft size={16} />
          </button>
          <Users size={20} className="text-warm-accent" />
          <h1 className="text-lg font-light text-warm-cream">Credentials Management</h1>
        </div>
      </div>

      {/* Bulk Action Bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-warm-card-border bg-warm-card p-3">
        <button onClick={handleGenerateAll}
          className="flex items-center gap-1.5 rounded-lg bg-warm-accent/10 px-3 py-1.5 text-xs text-warm-accent hover:bg-warm-accent/20 transition-colors">
          <RefreshCw size={13} /> Gen All
        </button>
        <button onClick={handleSaveAllClick}
          className="flex items-center gap-1.5 rounded-lg bg-warm-accent/10 px-3 py-1.5 text-xs text-warm-accent hover:bg-warm-accent/20 transition-colors">
          <Save size={13} /> Save All
        </button>
        <button onClick={handleSendSelected}
          className="flex items-center gap-1.5 rounded-lg border border-warm-card-border px-3 py-1.5 text-xs text-warm-muted hover:text-warm-cream transition-colors">
          <Send size={13} /> Send Selected ({selectedIds.size})
        </button>
        <div className="ml-auto flex items-center gap-1 text-xs text-warm-muted/60">
          <span className={pendingCount > 0 ? 'text-yellow-400' : ''}>⏳{pendingCount}</span>
          <span className="text-green-400 ml-2">📬{students.filter((s:any) => s.credentialDeliveredAt).length}</span>
          <span className="text-red-400 ml-2">❌{failedCount}</span>
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
            className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-2.5 py-1.5 text-xs text-warm-cream outline-none focus:border-warm-accent transition-colors">
            <option value="">All Classes</option>
            {sections.map((sec: any) => (
              <option key={sec.id} value={sec.id}>{sec.name}{sec.section ? ` — ${sec.section}` : ''}</option>
            ))}
          </select>
        </div>
        <div className="min-w-[100px]">
          <input type="text" value={rollNumber} onChange={(e) => setRollNumber(e.target.value)}
            placeholder="Roll no." autoComplete="off"
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
                <th className="w-8 px-3 py-2"><input type="checkbox" onChange={selectAll} checked={selectedIds.size === students.length && students.length > 0} className="accent-warm-accent" /></th>
                <th className="text-left px-3 py-2 text-warm-muted font-medium">Name</th>
                <th className="text-left px-3 py-2 text-warm-muted font-medium hidden sm:table-cell">Class</th>
                <th className="text-left px-3 py-2 text-warm-muted font-medium hidden md:table-cell">WhatsApp</th>
                <th className="text-left px-3 py-2 text-warm-muted font-medium hidden lg:table-cell">Username</th>
                <th className="text-left px-3 py-2 text-warm-muted font-medium">Password</th>
                <th className="text-left px-3 py-2 text-warm-muted font-medium">Status</th>
                <th className="text-left px-3 py-2 text-warm-muted font-medium hidden md:table-cell">Last Sent</th>
                <th className="w-20 px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {students.map((s: any) => (
                <React.Fragment key={s.id}>
                  <tr
                    className="border-t border-warm-card-border/50 hover:bg-warm-card/30 transition-colors cursor-pointer"
                    onClick={() => toggleHistory(s.id)}>
                    <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={selectedIds.has(s.id)} onChange={() => toggleSelect(s.id)} className="accent-warm-accent" />
                    </td>
                    <td className="px-3 py-2.5">
                      <p className="text-warm-cream font-medium">{s.name}</p>
                    </td>
                    <td className="px-3 py-2.5 text-warm-muted hidden sm:table-cell">{s.group?.name || '—'}{s.group?.section ? ` — ${s.group.section}` : ''}</td>
                    <td className="px-3 py-2.5 text-warm-muted hidden md:table-cell">{s.studentWhatsapp || s.phone || '—'}</td>
                    <td className="px-3 py-2.5 text-warm-accent font-mono hidden lg:table-cell">{s.username || '—'}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        {passwords[s.id] ? (
                          <span className="text-xs text-warm-cream font-mono">{passwords[s.id]}</span>
                        ) : (
                          <span className="text-xs text-warm-muted/40">—</span>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); handleGenerate(s.id); }}
                          className="rounded p-0.5 text-warm-muted hover:text-warm-accent transition-colors" title="Generate password">
                          <RefreshCw size={12} />
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">{statusBadge(s.credentialStatus)}</td>
                    <td className="px-3 py-2.5 text-warm-muted/60 hidden md:table-cell">
                      {s.credentialSentAt ? new Date(s.credentialSentAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1">
                        {passwords[s.id] && (
                          <button onClick={() => handleSaveClick(s.id)} title="Save password"
                            className={`rounded p-1 transition-colors ${credStatus[s.id]?.saved ? 'text-green-400' : 'text-warm-muted hover:text-warm-accent'}`}>
                            <Save size={13} />
                          </button>
                        )}
                        {s.username && (
                          <button onClick={() => handleSend(s.id)} title="Send via WhatsApp"
                            className="rounded p-1 text-warm-muted hover:text-warm-accent transition-colors">
                            <Send size={13} />
                          </button>
                        )}
                        {expandedId === s.id ? <ChevronDown size={14} className="text-warm-muted mt-0.5" /> : <ChevronRight size={14} className="text-warm-muted mt-0.5" />}
                      </div>
                    </td>
                  </tr>
                  {expandedId === s.id && (
                    <tr key={`${s.id}-history`}>
                      <td colSpan={8} className="bg-warm-card/20 px-6 py-4">
                        <div className="text-xs text-warm-muted space-y-1">
                          <p className="text-warm-cream font-medium mb-2">📋 Credential Info</p>
                          <p>👤 Username: <span className="text-warm-accent font-mono">{s.username || '—'}</span></p>
                          <p>📅 Generated: {s.credentialGeneratedAt ? new Date(s.credentialGeneratedAt).toLocaleString() : '—'}</p>
                          <p>🔑 Password last changed: {s.passwordSetAt ? new Date(s.passwordSetAt).toLocaleString() : '—'}</p>
                          <p>📤 Last sent: {s.credentialSentAt ? new Date(s.credentialSentAt).toLocaleString() : '—'}</p>
                          <p>📬 Delivered: {s.credentialDeliveredAt ? new Date(s.credentialDeliveredAt).toLocaleString() : '—'}</p>
                          <p>👁 Seen: {s.credentialSeenAt ? new Date(s.credentialSeenAt).toLocaleString() : '—'}</p>
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

      {/* Admin password verification popup */}
      {showAdminPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => { setShowAdminPopup(false); setPendingSaveTargets([]); }}>
          <div className="w-full max-w-sm rounded-xl border border-warm-card-border bg-[#24201e] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-2 text-sm font-medium text-warm-cream">Verify Your Password</h2>
            <p className="mb-4 text-xs text-warm-muted">Enter your admin password to confirm saving {pendingSaveTargets.length > 1 ? `${pendingSaveTargets.length} student` : ''} credentials.</p>
            <input type="text" value={adminPassword}
              style={{ WebkitTextSecurity: 'disc' } as any}
              onChange={(e) => { setAdminPassword(e.target.value); setAdminPassError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && !savingAll && handleAdminVerify()}
              placeholder="Your password" autoFocus
              className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2.5 text-sm text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent transition-colors" />
            {adminPassError && <p className="mt-2 text-xs text-red-400">{adminPassError}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => { setShowAdminPopup(false); setAdminPassword(''); setAdminPassError(''); setPendingSaveTargets([]); }}
                className="rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream transition-colors">Cancel</button>
              <button onClick={handleAdminVerify} disabled={savingAll}
                className="rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] transition-colors disabled:opacity-50">
                {savingAll ? 'Saving...' : 'Verify'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
