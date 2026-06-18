'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Plus, Users, GraduationCap, BookOpen, Search, Filter, LayoutGrid, Menu, Key, RefreshCw, Save, Send, Check } from 'lucide-react';
import { showToast } from '@/components/toast';

export default function StudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [groupId, setGroupId] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [sections, setSections] = useState<any[]>([]);
  const [expandedView, setExpandedView] = useState(false);

  // Restore view preference
  useEffect(() => {
    const saved = localStorage.getItem('studentViewMode');
    if (saved === 'expanded') setExpandedView(true);
  }, []);

  const toggleView = () => {
    const next = !expandedView;
    setExpandedView(next);
    localStorage.setItem('studentViewMode', next ? 'expanded' : 'grid');
  };

  // ─── Credential management state ──────────────────────────
  const [credentials, setCredentials] = useState<Record<string, { username: string; password: string; saved: boolean; sent: boolean }>>({});
  const [showAdminPopup, setShowAdminPopup] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminPassError, setAdminPassError] = useState('');
  const [savingAll, setSavingAll] = useState(false);
  const [pendingSaveSingle, setPendingSaveSingle] = useState<string | null>(null); // studentId to save single

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

  const generateForStudent = async (studentId: string) => {
    // Call backend to create user + get username
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/students/${studentId}/generate-credentials`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setCredentials(prev => ({
          ...prev,
          [studentId]: { username: data.data.username, password: data.data.password, saved: false, sent: false },
        }));
        showToast('success', `Username: ${data.data.username}`);
      } else {
        // User may already exist — just generate password locally
        setCredentials(prev => ({
          ...prev,
          [studentId]: { ...prev[studentId], password: generatePassword(), saved: false },
        }));
      }
    } catch {
      setCredentials(prev => ({
        ...prev,
        [studentId]: { ...prev[studentId], password: generatePassword(), saved: false },
      }));
    }
  };

  const generateForAll = async () => {
    let count = 0;
    for (const s of students) {
      if (!credentials[s.id]?.username) {
        await generateForStudent(s.id);
        count++;
      }
    }
    if (count > 0) showToast('success', `Credentials generated for ${count} students`);
    else showToast('info', 'All students already have credentials');
  };

  const generateForOne = (studentId: string) => {
    generateForStudent(studentId);
  };

  const saveSingle = async (studentId: string, password: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/admin/students/${studentId}/set-password`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, adminPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setCredentials(prev => ({ ...prev, [studentId]: { ...prev[studentId], saved: true } }));
        showToast('success', 'Password saved');
        return true;
      } else {
        showToast('error', data.message || 'Save failed');
        return false;
      }
    } catch {
      showToast('error', 'Save failed');
      return false;
    }
  };

  const handleSaveSingleClick = (studentId: string) => {
    if (!credentials[studentId]?.password) { showToast('error', 'Generate a password first'); return; }
    setPendingSaveSingle(studentId);
    setShowAdminPopup(true);
  };

  const handleSaveAllClick = () => {
    const pending = Object.entries(credentials).filter(([, c]) => c.password && !c.saved);
    if (pending.length === 0) { showToast('info', 'No unsaved passwords'); return; }
    setPendingSaveSingle(null); // null = save all mode
    setShowAdminPopup(true);
  };

  const handleAdminVerify = async () => {
    if (!adminPassword.trim()) { setAdminPassError('Enter your password'); return; }
    setSavingAll(true);

    try {
      if (pendingSaveSingle) {
        // Save single
        await saveSingle(pendingSaveSingle, credentials[pendingSaveSingle].password);
      } else {
        // Save all
        const pending = Object.entries(credentials).filter(([, c]) => c.password && !c.saved);
        let successCount = 0;
        for (const [sid, cred] of pending) {
          const ok = await saveSingle(sid, cred.password);
          if (ok) successCount++;
        }
        showToast('success', `${successCount}/${pending.length} saved`);
      }
    } finally {
      setShowAdminPopup(false);
      setAdminPassword('');
      setAdminPassError('');
      setSavingAll(false);
      setPendingSaveSingle(null);
    }
  };

  const handleSend = (studentId: string) => {
    // Placeholder — send method TBD
    showToast('info', 'Send feature coming soon');
  };

  const branchId = typeof window !== 'undefined' ? localStorage.getItem('activeBranchId') : null;
  const ayId = typeof window !== 'undefined' ? localStorage.getItem('activeAYId') : null;

  const loadStudents = async () => {
    setLoading(true);
    try {
      const res = await api.getStudents({
        search: search || undefined,
        groupId: groupId || undefined,
        rollNumber: rollNumber || undefined,
        limit: 50,
      });
      if (res.success) setStudents(res.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadStudents(); }, [groupId, rollNumber]);

  // Load sections for filter dropdown
  useEffect(() => {
    if (branchId && ayId) {
      api.getSections(branchId, ayId).then(d => { if (d.success) setSections(d.data); }).catch(() => {});
    }
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users size={22} className="text-warm-accent" />
          <h1 className="text-xl font-light text-warm-cream">Students</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push('/admin/students/new')}
            className="flex items-center gap-1.5 rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] transition-colors">
            <Plus size={14} /> Add Student
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-muted" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or admission..."
            className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] pl-9 pr-3 py-2 text-sm text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent transition-colors" />
        </div>
        <div className="min-w-[160px]">
          <select value={groupId} onChange={(e) => setGroupId(e.target.value)}
            className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent transition-colors">
            <option value="">All Classes</option>
            {sections.map((s: any) => (
              <option key={s.id} value={s.id}>{s.name}{s.section ? ` — ${s.section}` : ''}</option>
            ))}
          </select>
        </div>
        <div className="min-w-[130px]">
          <input type="text" value={rollNumber} onChange={(e) => setRollNumber(e.target.value)}
            placeholder="Roll no."
            className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent transition-colors" />
        </div>
        <button onClick={loadStudents}
          className="flex items-center gap-1.5 rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream transition-colors">
          <Filter size={13} /> Filter
        </button>
        <button onClick={toggleView} title={expandedView ? 'Grid view' : 'Expanded view'}
          className={`ml-auto rounded-lg border p-2 transition-colors ${expandedView ? 'border-warm-accent/50 text-warm-accent' : 'border-warm-card-border text-warm-muted hover:border-warm-accent/50 hover:text-warm-cream'}`}>
          {expandedView ? <LayoutGrid size={15} /> : <Menu size={15} />}
        </button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3].map(i => <div key={i} className="h-28 animate-pulse rounded-xl bg-warm-card" />)}
        </div>
      ) : students.length === 0 ? (
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-12 text-center">
          <Users size={32} className="mx-auto mb-3 text-warm-muted" />
          <p className="text-sm text-warm-muted">No students found.</p>
        </div>
      ) : expandedView ? (
          <div className="space-y-3">
            {/* Bulk Action Bar — top of the right column */}
            <div className="flex justify-end">
              <div className="flex items-center gap-1.5 rounded-xl border border-warm-card-border bg-warm-card px-3 py-2">
                <button onClick={generateForAll} title="Generate passwords for all"
                  className="flex items-center gap-1 rounded-lg bg-warm-accent/10 px-2.5 py-1.5 text-[11px] text-warm-accent hover:bg-warm-accent/20 transition-colors">
                  <RefreshCw size={12} /> Gen All
                </button>
                <button onClick={handleSaveAllClick} title="Save all generated passwords"
                  className="flex items-center gap-1 rounded-lg bg-warm-accent/10 px-2.5 py-1.5 text-[11px] text-warm-accent hover:bg-warm-accent/20 transition-colors">
                  <Save size={12} /> Save All
                </button>
                <button onClick={() => showToast('info', 'Send feature coming soon')} title="Send all credentials"
                  className="flex items-center gap-1 rounded-lg bg-warm-accent/10 px-2.5 py-1.5 text-[11px] text-warm-accent hover:bg-warm-accent/20 transition-colors">
                  <Send size={12} /> Send All
                </button>
              </div>
            </div>

            {/* Each row: card + credential panel side by side */}
            {students.map(student => {
              const cred = credentials[student.id];
              return (
                <div key={student.id} className="flex gap-3">
                  {/* Student card — takes remaining space */}
                  <div onClick={() => router.push(`/admin/students/${student.id}`)}
                    className="flex-1 rounded-xl border border-warm-card-border bg-warm-card p-4 cursor-pointer hover:border-warm-accent/40 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-warm-accent/10">
                        <GraduationCap size={20} className="text-warm-accent" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-warm-cream truncate">{student.name}</p>
                        <p className="text-xs text-warm-muted/60 mt-0.5">{student.admissionNumber || '—'}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-warm-muted">
                          {student.group && (
                            <span className="flex items-center gap-1">
                              <BookOpen size={11} className="text-warm-accent" />
                              {student.group.name}{student.group.section ? ` — ${student.group.section}` : ''}
                            </span>
                          )}
                          {student.rollNumber && (
                            <span className="text-green-400">{student.gender === 'male' ? '♂' : student.gender === 'female' ? '♀' : ''} Roll: {student.rollNumber}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Credential panel — fixed width */}
                  <div className="w-[260px] shrink-0 rounded-xl border border-warm-card-border bg-warm-card p-3 self-start">
                    {cred?.username && (
                      <div className="mb-1.5">
                        <p className="text-[10px] text-warm-accent font-mono">👤 {cred.username}</p>
                      </div>
                    )}
                    <div className="mb-1.5">
                      <p className="text-[10px] text-warm-muted/60">📞 {student.phone || '—'}</p>
                    </div>
                    <div className="relative mb-2">
                      <input type="text" readOnly
                        value={cred?.password || ''}
                        placeholder="Generate password..."
                        className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] py-1.5 pl-7 pr-2 text-xs text-warm-cream font-mono outline-none placeholder:text-warm-muted/30 focus:border-warm-accent transition-colors" />
                      <Key size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-warm-muted/50" />
                      {cred?.saved && <Check size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-green-400" />}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => generateForOne(student.id)} title="Generate"
                        className="flex items-center gap-1 rounded-lg border border-warm-card-border px-2 py-1 text-[10px] text-warm-muted hover:text-warm-cream transition-colors">
                        <RefreshCw size={10} /> Gen
                      </button>
                      <button onClick={() => handleSaveSingleClick(student.id)} title="Save"
                        className="flex items-center gap-1 rounded-lg border border-warm-card-border px-2 py-1 text-[10px] text-warm-muted hover:text-warm-cream transition-colors">
                        <Save size={10} /> Save
                      </button>
                      <button onClick={() => handleSend(student.id)} title="Send"
                        className="flex items-center gap-1 rounded-lg border border-warm-card-border px-2 py-1 text-[10px] text-warm-muted hover:text-warm-cream transition-colors">
                        <Send size={10} /> Send
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {students.map(student => (
              <div key={student.id} onClick={() => router.push(`/admin/students/${student.id}`)}
                className="rounded-xl border border-warm-card-border bg-warm-card p-4 cursor-pointer hover:border-warm-accent/40 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warm-accent/10">
                    <GraduationCap size={18} className="text-warm-accent" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-warm-cream truncate">{student.name}</p>
                    <p className="text-[11px] text-warm-muted/60">{student.admissionNumber || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-warm-muted">
                  {student.group && (
                    <span className="flex items-center gap-1">
                      <BookOpen size={11} className="text-warm-accent" />
                      {student.group.name}{student.group.section ? ` — ${student.group.section}` : ''}
                    </span>
                  )}
                  {student.rollNumber && (
                    <>
                      <span className="text-warm-muted/30">|</span>
                      <span className="text-green-400">Roll: {student.rollNumber}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      {/* Admin password verification popup */}
      {showAdminPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => { setShowAdminPopup(false); setPendingSaveSingle(null); }}>
          <div className="w-full max-w-sm rounded-xl border border-warm-card-border bg-[#24201e] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-2 text-sm font-medium text-warm-cream">Verify Your Password</h2>
            <p className="mb-4 text-xs text-warm-muted">Enter your admin password to confirm saving {pendingSaveSingle ? '' : 'all'} student credentials.</p>
            <input type="password" value={adminPassword}
              onChange={(e) => { setAdminPassword(e.target.value); setAdminPassError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && !savingAll && handleAdminVerify()}
              placeholder="Your password" autoFocus
              className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2.5 text-sm text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent transition-colors" />
            {adminPassError && <p className="mt-2 text-xs text-red-400">{adminPassError}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => { setShowAdminPopup(false); setAdminPassword(''); setAdminPassError(''); setPendingSaveSingle(null); }}
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
