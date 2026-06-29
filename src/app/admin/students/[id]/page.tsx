'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api, apiRequest } from '@/lib/api';
import {
  ArrowLeft, User, Calendar, Heart, Phone, Mail, MapPin, BookOpen,
  Award, CreditCard, FileText, AlertTriangle, Plus, X, Edit3,
  Key, Eye, EyeOff, Copy, Check, RefreshCw, Save,
} from 'lucide-react';
import AvatarImage from '@/components/avatar-image';
import ProfileOptionMenu, { viewPhotoItem, uploadNewItem } from '@/components/profile-option-menu';
import Lightbox from '@/components/lightbox';
import { showToast } from '@/components/toast';
import config from '@/config';

export default function StudentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Credential management
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAdminPassPopup, setShowAdminPassPopup] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminPassError, setAdminPassError] = useState('');
  const passwordInputRef = React.useRef<HTMLInputElement>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const photoInputRef = React.useRef<HTMLInputElement>(null);
  const [ecList, setEcList] = useState<any[]>([]);
  const [statusReason, setStatusReason] = useState('');
  const [statusLogs, setStatusLogs] = useState<any[]>([]);
  const [changingStatus, setChangingStatus] = useState(false);

  const branchId = typeof window !== 'undefined' ? localStorage.getItem('activeBranchId') : null;

  const loadData = () => {
    setLoading(true);
    api.getStudent(id)
      .then(d => { if (d.success) { setData(d.data); setEcList(d.data.emergencyContacts || []); if (d.data.groupId && branchId) { api.getSectionSubjects(branchId, d.data.groupId).then(r => { if (r.success) setSubjects(r.data); }).catch(() => {}); } } })
      .catch(e => setError(e.message || 'Failed to load student'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [id]);
  useEffect(() => { if (id) loadStatusLogs(); }, [id]);

  async function loadStatusLogs() {
    try { const res: any = await apiRequest(`/admin/students/${id}/status-logs`); if (res.success) setStatusLogs(res.data); } catch {}
  }

  // ── Modal / form state ──────────────────────────────────
  const [editStudent, setEditStudent] = useState(false);
  const [sf, setSf] = useState<any>({});
  const [editSections, setEditSections] = useState<any[]>([]);
  const openEditStudent = () => {
    const s = data;
    setSf({
      name: s.name, gender: s.gender, bloodGroup: s.bloodGroup || '',
      dateOfBirth: s.dateOfBirth ? s.dateOfBirth.substring(0, 10) : '',
      religion: s.religion || '', nationality: s.nationality || '',
      bformCnic: s.bformCnic || '', motherTongue: s.motherTongue || '',
      rollNumber: s.rollNumber || '', admissionNumber: s.admissionNumber || '',
      admissionDate: s.admissionDate ? s.admissionDate.substring(0, 10) : '',
      groupId: s.groupId || '',
    });
    setEditStudent(true);
    // Load sections for class selector
    const bId = localStorage.getItem('activeBranchId');
    const aId = localStorage.getItem('activeAYId');
    if (bId && aId) api.getSections(bId, aId).then(d => { if (d.success) setEditSections(d.data); }).catch(() => {});
  };

  // ── Contact ──
  const [editContact, setEditContact] = useState(false);
  const [cf, setCf] = useState<any>({});
  const openContact = () => { const s = data; setCf({ phone: s.phone || '', studentEmail: s.studentEmail || '', studentWhatsapp: s.studentWhatsapp || '' }); setEditContact(true); };

  // ── Parent ──
  const [editParent, setEditParent] = useState(false);
  const [pf, setPf] = useState<any>({});
  const openParent = (sp: any) => {
    const p = sp?.parent || {};
    const user = p?.user || {};
    setPf({ name: user.name || sp?.name || '', relation: sp?.relation || p?.relation || '', cnicNumber: p?.cnicNumber || '', occupation: p?.occupation || '', employerName: p?.employerName || '', maritalStatus: p?.maritalStatus || '', monthlyIncome: p?.monthlyIncome || '', phone: p?.phone || '', whatsapp: p?.whatsapp || '', email: p?.email || '' });
    setEditParent(true);
  };

  // ── Address ──
  const [editAddress, setEditAddress] = useState(false);
  const [af, setAf] = useState<any>({});
  const openAddress = () => { const s = data; setAf({ address: s.address || '', city: s.city || '', country: s.country || '', postalCode: s.postalCode || '' }); setEditAddress(true); };

  // ── Emergency Contact ──
  const [showEcForm, setShowEcForm] = useState(false);
  const [ec, setEc] = useState({ name: '', relationship: '', phone: '', whatsapp: '' });
  const [editEcId, setEditEcId] = useState<string | null>(null);

  // ── Health ──
  const [showHlthForm, setShowHlthForm] = useState(false);
  const [hlth, setHlth] = useState<any>({});

  // ── Previous Education ──
  const [editPrev, setEditPrev] = useState(false);
  const [prevf, setPrevf] = useState<any>({});
  const openPrev = () => { const s = data; setPrevf({ previousSchool: s.previousSchool || '', previousClass: s.previousClass || '', tcNumber: s.tcNumber || '', referredBy: s.referredBy || '' }); setEditPrev(true); };

  const handleSave = async (endpoint: string, body: any, cb: () => void, msg: string) => {
    try { await apiRequest(endpoint, { method: 'PUT', body: JSON.stringify(body) }); showToast('success', msg); cb(); loadData(); }
    catch (e: any) { showToast('error', e.message || 'Failed'); }
  };

  if (loading) return <main className="mx-auto max-w-5xl px-6 py-10"><div className="h-6 w-48 animate-pulse rounded bg-warm-card mb-6" />{[1,2,3,4].map(i => <div key={i} className="h-24 rounded-xl bg-warm-card animate-pulse mb-3" />)}</main>;
  if (error || !data) return <main className="mx-auto max-w-5xl px-6 py-10"><button onClick={() => router.push('/admin/students')} className="mb-6 flex items-center gap-1.5 text-xs text-warm-muted hover:text-warm-cream"><ArrowLeft size={13} /> Back to Students</button><div className="rounded-xl border border-warm-card-border bg-warm-card p-8 text-center"><AlertTriangle size={28} className="mx-auto mb-3 text-warm-muted" /><p className="text-sm text-warm-muted">{error || 'Student not found'}</p></div></main>;

  const s = data;
  const hasContact = s.phone || s.studentEmail || s.studentWhatsapp;
  const hasAddress = s.address || s.city || s.country || s.postalCode;
  const hasPrev = s.previousSchool || s.previousClass || s.tcNumber || s.referredBy;
  const studentUser = s.user;

  // ─── Password Management ─────────────────────────────────
  const generatePassword = () => {
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
    setGeneratedPassword(arr.join(''));
    setPasswordSaved(false);
    setShowPassword(true);
  };

  const copyPassword = () => {
    if (!generatedPassword) return;
    navigator.clipboard.writeText(generatedPassword).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(() => {});
  };

  const handleSavePassword = () => {
    if (!generatedPassword) return;
    setShowAdminPassPopup(true);
  };

  const handleGenerateCredentials = async () => {
    try {
      const res = await api.generateStudentCredentials(id);
      if (res.success) {
        setGeneratedPassword(res.data.password);
        setShowPassword(true);
        setPasswordSaved(false);
        loadData(); // reload to get the new user data
        showToast('success', 'Credentials generated. Username: ' + res.data.username);
      }
    } catch (e: any) {
      showToast('error', e.message || 'Failed to generate credentials');
    }
  };

  const handleChangeStatus = async (newStatus: string) => {
    setChangingStatus(true);
    try {
      const res = await apiRequest(`/admin/students/${id}/status`, { method: 'PUT', body: JSON.stringify({ status: newStatus, reason: statusReason || undefined }) });
      if (res.success) {
        showToast('success', res.message);
        setData((prev: any) => ({ ...prev, status: newStatus }));
        setStatusReason('');
        loadStatusLogs();
      } else showToast('error', res.message || 'Failed');
    } catch (e: any) { showToast('error', e.message); }
    finally { setChangingStatus(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Permanently delete this student? This cannot be undone.')) return;
    try {
      const res = await apiRequest(`/admin/students/${id}`, { method: 'DELETE' });
      if (res.success) { showToast('success', res.message); router.push('/admin/students'); }
      else showToast('error', res.message || 'Failed');
    } catch (e: any) { showToast('error', e.message); }
  };

  const handleAdminPassVerify = async () => {
    if (!adminPassword.trim()) { setAdminPassError('Enter your password to confirm'); return; }
    if (!generatedPassword) { setAdminPassError('No password generated'); return; }
    try {
      await api.setStudentPassword(id, generatedPassword, adminPassword);
      setShowAdminPassPopup(false);
      setAdminPassword('');
      setAdminPassError('');
      setGeneratedPassword('');
      setPasswordSaved(true);
      setShowPassword(false);
      showToast('success', 'Password saved successfully');
    } catch (e: any) {
      const msg = e.message || '';
      if (msg.includes('incorrect')) { setAdminPassError('Your password is incorrect.'); showToast('error', 'Wrong password.'); }
      else { setAdminPassError(msg); showToast('error', msg); }
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <button onClick={() => router.push('/admin/students')} className="mb-6 flex items-center gap-1.5 text-xs text-warm-muted hover:text-warm-cream"><ArrowLeft size={13} /> Back to Students</button>

      {/* ── Header ── */}
      <div className="mb-8 flex items-start justify-between gap-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold text-warm-cream tracking-tight">{s.name}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
            {s.rollNumber && <span className="text-sm text-warm-muted/70">Roll No: {s.rollNumber}</span>}
            {s.group && <span className="inline-flex items-center gap-1 rounded-full border border-warm-accent/20 bg-warm-accent/5 px-2.5 py-0.5 text-[11px] text-warm-accent">{s.group.name}{s.group.section ? ` — ${s.group.section}` : ''}</span>}
            <span className={`inline-flex items-center gap-1.5 text-xs ${s.status === 'ACTIVE' ? 'text-green-400' : 'text-warm-muted/50'}`}><span className={`inline-block h-2 w-2 rounded-full ${s.status === 'ACTIVE' ? 'bg-green-400' : 'bg-gray-500'}`} />{s.status}</span>
            {s.username && <span className="text-xs text-warm-accent font-mono">👤 {s.username}</span>}
          </div>
        </div>
        {/* Passport-size photo — clickable with context menu */}
        <div className="relative shrink-0">
          <div className="relative group cursor-pointer"
            onClick={() => {
              if (s.profilePhotoId) {
                setMenuOpen(true);
              } else {
                photoInputRef.current?.click();
              }
            }}>
            <AvatarImage fileId={s.profilePhotoId} className="w-28 h-32 rounded-xl object-cover border-2 border-warm-card-border" fallback={s.name?.charAt(0)} />
            <div className="absolute inset-0 rounded-xl bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-colors">
              <span className="text-white text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                {s.profilePhotoId ? 'Options' : 'Upload'}
              </span>
            </div>
          </div>

          {/* Context menu when photo exists */}
          {s.profilePhotoId && (
            <ProfileOptionMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)}
              items={[
                viewPhotoItem(() => setLightboxOpen(true)),
                uploadNewItem(() => photoInputRef.current?.click()),
              ]} />
          )}

          <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              const token = localStorage.getItem('token');
              const formData = new FormData();
              formData.append('file', file);
              formData.append('purpose', 'profile');
              const res = await fetch(`${config.apiUrl}/api/upload`, {
                method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData,
              });
              const result = await res.json();
              if (!res.ok) throw new Error(result.message || 'Upload failed');
              await api.updateStudent(id, { profilePhotoId: result.data.id });
              showToast('success', 'Photo updated');
              loadData();
            } catch (err: any) {
              showToast('error', err.message || 'Failed to upload photo');
            }
          }} />

          {/* Lightbox for viewing full-size */}
          <Lightbox isOpen={lightboxOpen} onClose={() => setLightboxOpen(false)}
            src={`${config.apiUrl}/api/uploads/${s.profilePhotoId}`}
            alt={s.name} />
        </div>
      </div>

      {/* ══════ 1: Student Information ══════ */}
      <Section title="Student Information" onEdit={openEditStudent} editLabel="Edit">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Card icon={User} label="Full Name" value={s.name} />
          <Card icon={Calendar} label="Date of Birth" value={s.dateOfBirth ? new Date(s.dateOfBirth).toLocaleDateString() : '—'} />
          <Card icon={Award} label="Roll No" value={s.rollNumber || '—'} />
          <Card icon={Award} label="Religion" value={s.religion || '—'} />
          <Card icon={Award} label="Nationality" value={s.nationality || '—'} />
          <Card icon={Heart} label="Gender" value={s.gender ? s.gender.charAt(0).toUpperCase() + s.gender.slice(1) : '—'} />
          <Card icon={CreditCard} label="B-Form / CNIC" value={s.bformCnic || '—'} />
          <Card icon={BookOpen} label="Admission No." value={s.admissionNumber || '—'} />
          <Card icon={Calendar} label="Admission Date" value={s.admissionDate ? new Date(s.admissionDate).toLocaleDateString() : '—'} />
          <Card icon={BookOpen} label="Class" value={s.group?.name || '—'} />
          <Card icon={BookOpen} label="Section" value={s.group?.section || '—'} />
          <Card icon={Award} label="Mother Tongue" value={s.motherTongue || '—'} />
        </div>
        <div className="col-span-3 rounded-lg border border-warm-card-border bg-warm-card p-3 mt-3">
          <span className="text-[10px] tracking-wider text-warm-muted uppercase">Subjects</span>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {subjects.length > 0 ? subjects.map((sub: any) => <span key={sub.id} className="inline-flex items-center gap-1 rounded-full border border-warm-accent/20 bg-warm-accent/5 px-2.5 py-0.5 text-[10px] text-warm-accent">{sub.name}{sub.code ? ` (${sub.code})` : ''}</span>) : <span className="text-xs text-warm-muted/50">—</span>}
          </div>
        </div>
      </Section>

      {/* ══════ 2: Student Contact ══════ */}
      <Section title="Student Contact (Optional)" onEdit={openContact} editLabel={hasContact ? 'Edit' : 'Add'} showContent={!!hasContact}>
        {hasContact ? <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card icon={Phone} label="Phone" value={s.phone || '—'} />
          <Card icon={Mail} label="Email" value={s.studentEmail || '—'} />
          <Card icon={Phone} label="WhatsApp" value={s.studentWhatsapp || '—'} />
        </div> : null}
      </Section>

      {/* ══════ 3: Parent / Guardian ══════ */}
      <Section title="Parent / Guardian" onEdit={() => openParent(s.parents?.[0] || {})} editLabel={s.parents?.length ? 'Edit' : 'Add'}>
        {s.parents && s.parents.length > 0 ? s.parents.map((sp: any, i: number) => {
          const p = sp.parent;
          return <div key={i} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {p?.user?.name && <><Card icon={User} label="Name" value={p.user.name} />
            <Card icon={User} label="Relation" value={sp.relation || p.relation || '—'} />
            <Card icon={CreditCard} label="CNIC" value={p.cnicNumber || '—'} />
            <Card icon={Award} label="Occupation" value={p.occupation || '—'} />
            <Card icon={Award} label="Employer" value={p.employerName || '—'} />
            <Card icon={FileText} label="Monthly Income" value={p.monthlyIncome ? p.monthlyIncome.replace(/_/g, ' ') : '—'} />
            <Card icon={Phone} label="Phone" value={p.phone || '—'} />
            <Card icon={Phone} label="WhatsApp" value={p.whatsapp || '—'} />
            <Card icon={Mail} label="Email" value={p.email || '—'} />
            <Card icon={Heart} label="Marital Status" value={p.maritalStatus || '—'} />
          </>}</div>;
        }) : null}
      </Section>

      {/* ══════ 4: Address ══════ */}
      <Section title="Address" onEdit={openAddress} editLabel={hasAddress ? 'Edit' : 'Add'} showContent={!!hasAddress}>
        {hasAddress ? <><div className="rounded-lg border border-warm-card-border bg-warm-card p-3 col-span-3 mb-2"><span className="text-[10px] tracking-wider text-warm-muted uppercase">Address</span><p className="mt-1 text-sm text-warm-cream">{s.address || '—'}</p></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card icon={MapPin} label="City" value={s.city || '—'} />
          <Card icon={MapPin} label="Country" value={s.country || '—'} />
          <Card icon={MapPin} label="Postal Code" value={s.postalCode || '—'} />
        </div></> : null}
      </Section>

      {/* ══════ 5: Emergency Contact ══════ */}
      <Section title="Emergency Contact" onEdit={() => { const existing = ecList[0]; if (existing) { setEditEcId(existing.id); setEc({ name: existing.name, relationship: existing.relationship || '', phone: existing.phone, whatsapp: existing.whatsapp || '' }); } else { setEditEcId(null); setEc({ name: '', relationship: '', phone: '', whatsapp: '' }); } setShowEcForm(true); }} editLabel={ecList.length ? 'Edit' : 'Add'}>
        {ecList.length > 0 ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{[...ecList].reverse().map((e: any) => <React.Fragment key={e.id}>
          <Card icon={User} label="Name" value={e.name || '—'} />
          <Card icon={User} label="Relationship" value={e.relationship || '—'} />
          <Card icon={Phone} label="Phone" value={e.phone || '—'} />
          <Card icon={Phone} label="WhatsApp" value={e.whatsapp || '—'} />
        </React.Fragment>)}</div> : null}
      </Section>

      {/* ══════ 6: Health & Medical ══════ */}
      <Section title="Health & Medical" onEdit={() => { if (s.healthRecord) setHlth({ ...s.healthRecord }); else setHlth({ bloodGroup: '', hasChronicDisease: false, diseaseDetails: '', allergies: '', disability: '', medicalNotes: '', doctorName: '', doctorPhone: '' }); setShowHlthForm(true); }} editLabel={s.healthRecord ? 'Edit' : 'Add'}>
        {s.healthRecord ? <div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <Card icon={Heart} label="Blood Group" value={s.healthRecord.bloodGroup || '—'} />
            <Card icon={FileText} label="Allergies" value={s.healthRecord.allergies || 'None'} />
            <Card icon={FileText} label="Chronic Disease" value={s.healthRecord.hasChronicDisease ? 'Yes' : 'No'} />
          </div>
          <div className="col-span-3 rounded-lg border border-warm-card-border bg-warm-card p-3 mb-3"><span className="text-[10px] tracking-wider text-warm-muted uppercase">Disease Details</span><p className="mt-1 text-sm text-warm-cream">{s.healthRecord.diseaseDetails || '—'}</p></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <Card icon={User} label="Doctor Name" value={s.healthRecord.doctorName || '—'} />
            <Card icon={Phone} label="Doctor Phone" value={s.healthRecord.doctorPhone || '—'} />
            <Card icon={FileText} label="Disability" value={s.healthRecord.disability || 'None'} />
          </div>
          <div className="col-span-3 rounded-lg border border-warm-card-border bg-warm-card p-3"><span className="text-[10px] tracking-wider text-warm-muted uppercase">Medical Notes</span><p className="mt-1 text-sm text-warm-cream">{s.healthRecord.medicalNotes || '—'}</p></div>
        </div> : null}
      </Section>

      {/* ══════ 7: Previous Education ══════ */}
      <Section title="Previous Education" onEdit={openPrev} editLabel={hasPrev ? 'Edit' : 'Add'} showContent={!!hasPrev}>
        {hasPrev ? <><div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card icon={BookOpen} label="Previous School" value={s.previousSchool || '—'} />
          <Card icon={BookOpen} label="Previous Class" value={s.previousClass || '—'} />
          <Card icon={BookOpen} label="TC Number" value={s.tcNumber || '—'} />
        </div>
        <div className="col-span-3 mt-3 rounded-lg border border-warm-card-border bg-warm-card p-3"><span className="text-[10px] tracking-wider text-warm-muted uppercase">Referred By</span><p className="mt-1 text-sm text-warm-cream">{s.referredBy || '—'}</p></div></> : null}
      </Section>

      {/* ══════ 8: Student Status & Actions ══════ */}
      <section className="mb-10">
        <h2 className="mb-4 text-sm font-medium text-warm-cream">Student Status</h2>
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-warm-muted">Current:</span>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
              data?.status === 'ACTIVE' ? 'bg-green-900/20 text-green-400 border-green-900/30' :
              data?.status === 'SUSPENDED' ? 'bg-yellow-900/20 text-yellow-400 border-yellow-900/30' :
              data?.status === 'WITHDRAWN' ? 'bg-blue-900/20 text-blue-400 border-blue-900/30' :
              data?.status === 'EXPELED' ? 'bg-red-900/20 text-red-400 border-red-900/30' :
              data?.status === 'DECEASED' ? 'bg-gray-900/20 text-gray-400 border-gray-900/30' :
              data?.status === 'TRANSFERRED' ? 'bg-purple-900/20 text-purple-400 border-purple-900/30' :
              'bg-warm-card/50 text-warm-muted/50 border-warm-card-border'
            }`}>{data?.status || 'ACTIVE'}</span>
            <select value="" onChange={(e) => { if (e.target.value) handleChangeStatus(e.target.value); }}
              className="rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-1.5 text-xs text-warm-cream outline-none focus:border-warm-accent">
              <option value="">Change status…</option>
              <option value="SUSPENDED">Suspend</option>
              <option value="ACTIVE">Re-activate</option>
              <option value="WITHDRAWN">Withdrawn</option>
              <option value="TRANSFERRED">Transferred</option>
              <option value="EXPELED">Expelled</option>
              <option value="DECEASED">Deceased</option>
            </select>
            <input type="text" value={statusReason} onChange={(e) => setStatusReason(e.target.value)}
              placeholder="Reason (optional)…"
              className="flex-1 min-w-[200px] rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-1.5 text-xs text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent" />
            {changingStatus && <span className="text-xs text-warm-muted">Saving…</span>}
          </div>

          {statusLogs.length > 0 && (
            <div className="mt-4 border-t border-warm-card-border pt-3">
              <p className="text-[10px] tracking-wider text-warm-muted uppercase mb-2">Status History</p>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {statusLogs.map((log: any) => (
                  <div key={log.id} className="flex items-center gap-2 text-[11px] text-warm-muted/70">
                    <span className="text-warm-muted/40">{new Date(log.createdAt).toLocaleDateString()}</span>
                    <span>{log.previousStatus || '—'} → <strong>{log.newStatus}</strong></span>
                    {log.reason && <span className="italic">({log.reason})</span>}
                    {log.changedBy && <span className="text-warm-muted/50">by {log.changedBy.name}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 border-t border-warm-card-border pt-4 flex justify-end">
            <button onClick={handleDelete} className="rounded-lg border border-red-900/30 px-4 py-2 text-xs text-red-400 hover:bg-red-900/10 transition-colors">
              Delete Student
            </button>
          </div>
        </div>
      </section>

      {/* ══════ 9: Login Credentials ══════ */}
      <section className="mb-10">
        <h2 className="mb-4 text-sm font-medium text-warm-cream">Login Credentials</h2>
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-5">
          {!studentUser ? (
            <div className="text-center py-4">
              <p className="text-xs text-warm-muted mb-3">No login credentials set up yet.</p>
              <button onClick={handleGenerateCredentials}
                className="inline-flex items-center gap-1.5 rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] transition-colors">
                <Key size={13} /> Generate Credentials
              </button>
            </div>
          ) : (
            <>
              {/* Username */}
              <div className="mb-4">
                <p className="mb-1 text-[10px] font-medium tracking-wider text-warm-muted uppercase">Username</p>
                <div className="flex items-center gap-2 rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2.5">
                  <User size={14} className="text-warm-muted shrink-0" />
                  <span className="text-sm text-warm-cream font-mono">{studentUser.username || '—'}</span>
                </div>
              </div>

              {/* Password */}
              <div>
                <p className="mb-1 text-[10px] font-medium tracking-wider text-warm-muted uppercase">Password</p>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input ref={passwordInputRef} type={showPassword ? 'text' : 'password'}
                      value={generatedPassword} readOnly
                      placeholder={passwordSaved ? '••••••••••••' : ''}
                      className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] py-2.5 pl-9 pr-9 text-sm text-warm-cream font-mono outline-none placeholder:text-warm-muted/30 focus:border-warm-accent transition-colors" />
                    <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-muted" />
                    {generatedPassword && (
                      <button onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-muted hover:text-warm-cream transition-colors">
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    )}
                  </div>
                  {generatedPassword && (
                    <button onClick={copyPassword} title="Copy password"
                      className="flex items-center gap-1.5 rounded-lg border border-warm-card-border px-3 py-2.5 text-xs text-warm-muted hover:text-warm-cream hover:border-warm-accent/50 transition-colors">
                      {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  )}
                  <button onClick={generatePassword} title="Generate new password"
                    className="flex items-center gap-1.5 rounded-lg bg-warm-accent px-3 py-2.5 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] transition-colors">
                    <RefreshCw size={14} /> Generate
                  </button>
                </div>
                {generatedPassword && (
                  <div className="mt-3 flex gap-2">
                    <button onClick={handleSavePassword}
                      className="flex items-center gap-1.5 rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] transition-colors">
                      <Save size={13} /> Save
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ══ Admin Password Verification popup ══ */}
      {showAdminPassPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setShowAdminPassPopup(false)}>
          <div className="w-full max-w-sm rounded-xl border border-warm-card-border bg-[#24201e] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-2 text-sm font-medium text-warm-cream">Verify Your Password</h2>
            <p className="mb-4 text-xs text-warm-muted">Enter your own password to confirm saving the student's new credentials.</p>
            <input type="password" value={adminPassword}
              onChange={(e) => { setAdminPassword(e.target.value); setAdminPassError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleAdminPassVerify()}
              placeholder="Your password" autoFocus
              className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2.5 text-sm text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent transition-colors" />
            {adminPassError && <p className="mt-2 text-xs text-red-400">{adminPassError}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => { setShowAdminPassPopup(false); setAdminPassword(''); setAdminPassError(''); }}
                className="rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream transition-colors">Cancel</button>
              <button onClick={handleAdminPassVerify}
                className="rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] transition-colors">Verify</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODALS ══ */}

      {/* Student Edit */}
      <Modal open={editStudent} onClose={() => setEditStudent(false)} title="Edit Student">
        <div className="space-y-4">
          <div><label className="mb-1 block text-xs text-warm-muted">Full Name</label><input value={sf.name} onChange={(e) => setSf((p: any) => ({ ...p, name: e.target.value }))} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="mb-1 block text-xs text-warm-muted">Gender</label><select value={sf.gender || ''} onChange={(e) => setSf((p: any) => ({ ...p, gender: e.target.value }))} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent"><option value="">—</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
            <div><label className="mb-1 block text-xs text-warm-muted">Date of Birth</label><input type="date" value={sf.dateOfBirth || ''} onChange={(e) => setSf((p: any) => ({ ...p, dateOfBirth: e.target.value }))} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
            <div><label className="mb-1 block text-xs text-warm-muted">Blood Group</label><input value={sf.bloodGroup || ''} onChange={(e) => setSf((p: any) => ({ ...p, bloodGroup: e.target.value }))} placeholder="e.g. B+" className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="mb-1 block text-xs text-warm-muted">Roll No</label><input value={sf.rollNumber || ''} onChange={(e) => setSf((p: any) => ({ ...p, rollNumber: e.target.value }))} placeholder="e.g. 012" className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
            <div><label className="mb-1 block text-xs text-warm-muted">Mother Tongue</label><input value={sf.motherTongue || ''} onChange={(e) => setSf((p: any) => ({ ...p, motherTongue: e.target.value }))} placeholder="e.g. Urdu" className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
            <div><label className="mb-1 block text-xs text-warm-muted">B-Form / CNIC</label><input value={sf.bformCnic || ''} onChange={(e) => setSf((p: any) => ({ ...p, bformCnic: e.target.value }))} placeholder="e.g. 61101-..." className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="mb-1 block text-xs text-warm-muted">Religion</label><input value={sf.religion || ''} onChange={(e) => setSf((p: any) => ({ ...p, religion: e.target.value }))} placeholder="e.g. Islam" className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
            <div><label className="mb-1 block text-xs text-warm-muted">Nationality</label><input value={sf.nationality || ''} onChange={(e) => setSf((p: any) => ({ ...p, nationality: e.target.value }))} placeholder="e.g. Pakistani" className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
            <div><label className="mb-1 block text-xs text-warm-muted">Admission Date</label><input type="date" value={sf.admissionDate || ''} onChange={(e) => setSf((p: any) => ({ ...p, admissionDate: e.target.value }))} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-xs text-warm-muted">Admission No.</label><input value={sf.admissionNumber || ''} onChange={(e) => setSf((p: any) => ({ ...p, admissionNumber: e.target.value }))} placeholder="System generated" className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
            <div><label className="mb-1 block text-xs text-warm-muted">Class / Section</label>
              <select value={sf.groupId || ''} onChange={(e) => setSf((p: any) => ({ ...p, groupId: e.target.value }))} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent">
                <option value="">— Select —</option>
                {editSections.map((sec: any) => <option key={sec.id} value={sec.id}>{sec.name}{sec.section ? ` — ${sec.section}` : ''}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2"><button onClick={() => setEditStudent(false)} className="rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream">Cancel</button><button onClick={() => handleSave(`/admin/students/${id}`, sf, () => setEditStudent(false), 'Student updated')} className="rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76]">Save</button></div>
        </div>
      </Modal>

      {/* Contact Edit */}
      <Modal open={editContact} onClose={() => setEditContact(false)} title="Student Contact">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div><label className="mb-1 block text-xs text-warm-muted">Phone</label><input value={cf.phone || ''} onChange={(e) => setCf((p: any) => ({ ...p, phone: e.target.value }))} placeholder="+92 300 ..." className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
            <div><label className="mb-1 block text-xs text-warm-muted">Email</label><input value={cf.studentEmail || ''} onChange={(e) => setCf((p: any) => ({ ...p, studentEmail: e.target.value }))} placeholder="email@example.com" className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
            <div><label className="mb-1 block text-xs text-warm-muted">WhatsApp</label><input value={cf.studentWhatsapp || ''} onChange={(e) => setCf((p: any) => ({ ...p, studentWhatsapp: e.target.value }))} placeholder="+92 300 ..." className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
          </div>
          <div className="flex justify-end gap-2"><button onClick={() => setEditContact(false)} className="rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream">Cancel</button><button onClick={() => handleSave(`/admin/students/${id}`, cf, () => setEditContact(false), 'Contact saved')} className="rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76]">Save</button></div>
        </div>
      </Modal>

      {/* Parent Edit */}
      <Modal open={editParent} onClose={() => setEditParent(false)} title="Parent / Guardian">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div><label className="mb-1 block text-xs text-warm-muted">Name</label><input value={pf.name} onChange={(e) => setPf((p: any) => ({ ...p, name: e.target.value }))} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
            <div><label className="mb-1 block text-xs text-warm-muted">Relation</label><input value={pf.relation} onChange={(e) => setPf((p: any) => ({ ...p, relation: e.target.value }))} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
            <div><label className="mb-1 block text-xs text-warm-muted">CNIC</label><input value={pf.cnicNumber} onChange={(e) => setPf((p: any) => ({ ...p, cnicNumber: e.target.value }))} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="mb-1 block text-xs text-warm-muted">Occupation</label><input value={pf.occupation} onChange={(e) => setPf((p: any) => ({ ...p, occupation: e.target.value }))} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
            <div><label className="mb-1 block text-xs text-warm-muted">Employer</label><input value={pf.employerName} onChange={(e) => setPf((p: any) => ({ ...p, employerName: e.target.value }))} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
            <div><label className="mb-1 block text-xs text-warm-muted">Monthly Income</label><input value={pf.monthlyIncome} onChange={(e) => setPf((p: any) => ({ ...p, monthlyIncome: e.target.value }))} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="mb-1 block text-xs text-warm-muted">Phone</label><input value={pf.phone} onChange={(e) => setPf((p: any) => ({ ...p, phone: e.target.value }))} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
            <div><label className="mb-1 block text-xs text-warm-muted">WhatsApp</label><input value={pf.whatsapp} onChange={(e) => setPf((p: any) => ({ ...p, whatsapp: e.target.value }))} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
            <div><label className="mb-1 block text-xs text-warm-muted">Email</label><input value={pf.email} onChange={(e) => setPf((p: any) => ({ ...p, email: e.target.value }))} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
          </div>
          <div><label className="mb-1 block text-xs text-warm-muted">Marital Status</label>
            <select value={pf.maritalStatus || ''} onChange={(e) => setPf((p: any) => ({ ...p, maritalStatus: e.target.value }))} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent">
              <option value="">—</option>
              <option value="Married">Married</option>
              <option value="Unmarried">Unmarried</option>
              <option value="Widow/er">Widow/er</option>
              <option value="Divorced">Divorced</option>
            </select>
          </div>
          <div className="flex justify-end gap-2"><button onClick={() => setEditParent(false)} className="rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream">Cancel</button><button onClick={async () => { try { await apiRequest(`/admin/students/${id}/parent`, { method: 'PUT', body: JSON.stringify(pf) }); showToast('success', 'Parent updated'); setEditParent(false); loadData(); } catch (e: any) { showToast('error', e.message); } }} className="rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76]">Save</button></div>
        </div>
      </Modal>

      {/* Address Edit */}
      <Modal open={editAddress} onClose={() => setEditAddress(false)} title="Address">
        <div className="space-y-4">
          <div><label className="mb-1 block text-xs text-warm-muted">Address</label><textarea value={af.address || ''} onChange={(e) => setAf((p: any) => ({ ...p, address: e.target.value }))} rows={2} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent resize-none" /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="mb-1 block text-xs text-warm-muted">City</label><input value={af.city || ''} onChange={(e) => setAf((p: any) => ({ ...p, city: e.target.value }))} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
            <div><label className="mb-1 block text-xs text-warm-muted">Country</label><input value={af.country || ''} onChange={(e) => setAf((p: any) => ({ ...p, country: e.target.value }))} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
            <div><label className="mb-1 block text-xs text-warm-muted">Postal Code</label><input value={af.postalCode || ''} onChange={(e) => setAf((p: any) => ({ ...p, postalCode: e.target.value }))} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
          </div>
          <div className="flex justify-end gap-2"><button onClick={() => setEditAddress(false)} className="rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream">Cancel</button><button onClick={() => handleSave(`/admin/students/${id}`, af, () => setEditAddress(false), 'Address saved')} className="rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76]">Save</button></div>
        </div>
      </Modal>

      {/* Emergency Contact Modal */}
      <Modal open={showEcForm} onClose={() => setShowEcForm(false)} title="Emergency Contact">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-xs text-warm-muted">Name *</label><input value={ec.name} onChange={(e) => setEc((p: any) => ({ ...p, name: e.target.value }))} placeholder="e.g. Mother" className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
            <div><label className="mb-1 block text-xs text-warm-muted">Relationship</label><input value={ec.relationship} onChange={(e) => setEc((p: any) => ({ ...p, relationship: e.target.value }))} placeholder="e.g. Mother" className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-xs text-warm-muted">Phone *</label><input value={ec.phone} onChange={(e) => setEc((p: any) => ({ ...p, phone: e.target.value }))} placeholder="+92 300 ..." className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
            <div><label className="mb-1 block text-xs text-warm-muted">WhatsApp</label><input value={ec.whatsapp} onChange={(e) => setEc((p: any) => ({ ...p, whatsapp: e.target.value }))} placeholder="+92 300 ..." className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
          </div>
          <div className="flex justify-end gap-2"><button onClick={() => { setShowEcForm(false); setEditEcId(null); }} className="rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream">Cancel</button><button onClick={async () => { if (!ec.name || !ec.phone) { showToast('error', 'Name and phone required'); return; } try { if (editEcId) { await apiRequest(`/admin/students/${id}/emergency-contact/${editEcId}`, { method: 'PUT', body: JSON.stringify(ec) }); showToast('success', 'Contact updated'); } else { await apiRequest(`/admin/students/${id}/emergency-contact`, { method: 'POST', body: JSON.stringify(ec) }); showToast('success', 'Contact added'); } setShowEcForm(false); setEditEcId(null); setEc({ name: '', relationship: '', phone: '', whatsapp: '' }); loadData(); } catch (e: any) { showToast('error', e.message); } }} className="rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76]">Save</button></div>
        </div>
      </Modal>

      {/* Health Modal */}
      <Modal open={showHlthForm} onClose={() => setShowHlthForm(false)} title="Health & Medical">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div><label className="mb-1 block text-xs text-warm-muted">Blood Group</label><input value={hlth.bloodGroup || ''} onChange={(e) => setHlth((p: any) => ({ ...p, bloodGroup: e.target.value }))} placeholder="e.g. B+" className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
            <div><label className="mb-1 block text-xs text-warm-muted">Allergies</label><input value={hlth.allergies || ''} onChange={(e) => setHlth((p: any) => ({ ...p, allergies: e.target.value }))} placeholder="e.g. Dust" className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
            <div><label className="mb-1 block text-xs text-warm-muted">Chronic Disease</label><select value={hlth.hasChronicDisease ? 'true' : 'false'} onChange={(e) => setHlth((p: any) => ({ ...p, hasChronicDisease: e.target.value === 'true' }))} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent"><option value="false">No</option><option value="true">Yes</option></select></div>
          </div>
          <div><label className="mb-1 block text-xs text-warm-muted">Disease Details</label><textarea value={hlth.diseaseDetails || ''} onChange={(e) => setHlth((p: any) => ({ ...p, diseaseDetails: e.target.value }))} rows={2} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent resize-none" /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="mb-1 block text-xs text-warm-muted">Doctor Name</label><input value={hlth.doctorName || ''} onChange={(e) => setHlth((p: any) => ({ ...p, doctorName: e.target.value }))} placeholder="Dr." className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
            <div><label className="mb-1 block text-xs text-warm-muted">Doctor Phone</label><input value={hlth.doctorPhone || ''} onChange={(e) => setHlth((p: any) => ({ ...p, doctorPhone: e.target.value }))} placeholder="+92" className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
            <div><label className="mb-1 block text-xs text-warm-muted">Disability</label><input value={hlth.disability || ''} onChange={(e) => setHlth((p: any) => ({ ...p, disability: e.target.value }))} placeholder="If any" className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
          </div>
          <div><label className="mb-1 block text-xs text-warm-muted">Medical Notes</label><textarea value={hlth.medicalNotes || ''} onChange={(e) => setHlth((p: any) => ({ ...p, medicalNotes: e.target.value }))} rows={3} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent resize-none" /></div>
          <div className="flex justify-end gap-2"><button onClick={() => setShowHlthForm(false)} className="rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream">Cancel</button><button onClick={async () => { try { await apiRequest(`/admin/students/${id}/health-record`, { method: 'PUT', body: JSON.stringify(hlth) }); showToast('success', 'Health record saved'); setShowHlthForm(false); loadData(); } catch (e: any) { showToast('error', e.message); } }} className="rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76]">Save</button></div>
        </div>
      </Modal>

      {/* Previous Education Edit */}
      <Modal open={editPrev} onClose={() => setEditPrev(false)} title="Previous Education">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div><label className="mb-1 block text-xs text-warm-muted">Previous School</label><input value={prevf.previousSchool || ''} onChange={(e) => setPrevf((p: any) => ({ ...p, previousSchool: e.target.value }))} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
            <div><label className="mb-1 block text-xs text-warm-muted">Previous Class</label><input value={prevf.previousClass || ''} onChange={(e) => setPrevf((p: any) => ({ ...p, previousClass: e.target.value }))} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
            <div><label className="mb-1 block text-xs text-warm-muted">TC Number</label><input value={prevf.tcNumber || ''} onChange={(e) => setPrevf((p: any) => ({ ...p, tcNumber: e.target.value }))} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
          </div>
          <div><label className="mb-1 block text-xs text-warm-muted">Referred By</label><input value={prevf.referredBy || ''} onChange={(e) => setPrevf((p: any) => ({ ...p, referredBy: e.target.value }))} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
          <div className="flex justify-end gap-2"><button onClick={() => setEditPrev(false)} className="rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream">Cancel</button><button onClick={() => handleSave(`/admin/students/${id}`, prevf, () => setEditPrev(false), 'Saved')} className="rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76]">Save</button></div>
        </div>
      </Modal>
    </main>
  );
}

// ── Helpers ──
function Section({ title, children, onEdit, editLabel, showContent = true }: { title: string; children: React.ReactNode; onEdit?: () => void; editLabel?: string; showContent?: boolean }) {
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-warm-cream">{title}</h2>
        {onEdit && <button onClick={onEdit} className="flex items-center gap-1 rounded-lg border border-warm-card-border px-2.5 py-1 text-[10px] text-warm-muted hover:text-warm-cream transition-colors">{editLabel === 'Edit' ? <><Edit3 size={11} /> Edit</> : <><Plus size={12} /> Add</>}</button>}
      </div>
      {showContent && children}
    </section>
  );
}

function Card({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-warm-card-border bg-warm-card p-3">
      <div className="flex items-center gap-2"><Icon size={13} className="text-warm-accent shrink-0" /><span className="text-[10px] tracking-wider text-warm-muted uppercase">{label}</span></div>
      <p className="mt-1 text-sm text-warm-cream break-words">{value}</p>
    </div>
  );
}

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-warm-card-border bg-[#24201e] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-warm-cream">{title}</h2>
          <button onClick={onClose} className="text-warm-muted hover:text-warm-cream"><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
