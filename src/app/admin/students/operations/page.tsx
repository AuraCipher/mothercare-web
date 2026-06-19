'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  ArrowLeft, Send, RefreshCw, Save, Key, Check, X,
  Users, Search, Filter, GraduationCap, BookOpen, ChevronDown, ChevronRight,
} from 'lucide-react';
import { showToast } from '@/components/toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sendHistory, setSendHistory] = useState<Record<string, any[]>>({});

  const branchId = typeof window !== 'undefined' ? localStorage.getItem('activeBranchId') : null;
  const ayId = typeof window !== 'undefined' ? localStorage.getItem('activeAYId') : null;

  const loadStudents = async () => {
    setLoading(true);
    try {
      const res = await api.getStudents({ limit: 200 });
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

  useEffect(() => { loadStudents(); }, [statusFilter, search]);

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

  const handleSend = async (studentId: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/admin/students/${studentId}/send-credentials`, {
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
      const res = await fetch(`${API_URL}/api/admin/students/send-all-credentials`, {
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
      const res = await fetch(`${API_URL}/api/admin/students/send-to-new`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
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
        <button onClick={handleSendToNew}
          className="flex items-center gap-1.5 rounded-lg bg-warm-accent px-3 py-1.5 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] transition-colors">
          <Send size={13} /> Send to New {pendingCount > 0 && `(${pendingCount})`}
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
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-muted" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or admission..."
            className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] pl-8 pr-3 py-1.5 text-xs text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent transition-colors" />
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
                <th className="text-left px-3 py-2 text-warm-muted font-medium">Status</th>
                <th className="text-left px-3 py-2 text-warm-muted font-medium hidden md:table-cell">Last Sent</th>
                <th className="w-20 px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {students.map((s: any) => (
                <>
                  <tr key={s.id}
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
                    <td className="px-3 py-2.5">{statusBadge(s.credentialStatus)}</td>
                    <td className="px-3 py-2.5 text-warm-muted/60 hidden md:table-cell">
                      {s.credentialSentAt ? new Date(s.credentialSentAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1">
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
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
