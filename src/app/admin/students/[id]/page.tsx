'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api, apiRequest } from '@/lib/api';
import {
  ArrowLeft, User, Calendar, Heart, Phone, Mail, MapPin, BookOpen,
  Award, CreditCard, FileText, AlertTriangle, Plus, Trash2, X, Edit3,
} from 'lucide-react';
import AvatarImage from '@/components/avatar-image';
import { showToast } from '@/components/toast';

export default function StudentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = () => {
    setLoading(true);
    api.getStudent(id)
      .then(d => { if (d.success) setData(d.data); })
      .catch(e => setError(e.message || 'Failed to load student'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [id]);

  // ─── Emergency Contact form ────────────────────────
  const [showEcForm, setShowEcForm] = useState(false);
  const [ec, setEc] = useState({ name: '', relationship: '', phone: '', whatsapp: '' });
  const handleAddEc = async () => {
    if (!ec.name || !ec.phone) { showToast('error', 'Name and phone required'); return; }
    try {
      await apiRequest(`/admin/students/${id}/emergency-contact`, {
        method: 'POST', body: JSON.stringify(ec),
      });
      showToast('success', 'Emergency contact added');
      setShowEcForm(false); setEc({ name: '', relationship: '', phone: '', whatsapp: '' });
      loadData();
    } catch (e: any) { showToast('error', e.message || 'Failed'); }
  };
  const handleDeleteEc = async (contactId: string) => {
    try {
      await apiRequest(`/admin/students/${id}/emergency-contact/${contactId}`, { method: 'DELETE' });
      showToast('success', 'Contact removed');
      loadData();
    } catch (e: any) { showToast('error', e.message || 'Failed'); }
  };

  // ─── Health Record form ────────────────────────────
  const [showHlthForm, setShowHlthForm] = useState(false);
  const [hlth, setHlth] = useState<any>({});
  const openHealthForm = () => {
    if (data?.healthRecord) setHlth({ ...data.healthRecord });
    else setHlth({ bloodGroup: '', hasChronicDisease: false, diseaseDetails: '', allergies: '', disability: '', medicalNotes: '', doctorName: '', doctorPhone: '' });
    setShowHlthForm(true);
  };
  const handleSaveHealth = async () => {
    try {
      await apiRequest(`/admin/students/${id}/health-record`, {
        method: 'PUT', body: JSON.stringify(hlth),
      });
      showToast('success', 'Health record saved');
      setShowHlthForm(false); loadData();
    } catch (e: any) { showToast('error', e.message || 'Failed'); }
  };

  // ─── Student Info inline edit ──────────────────────
  const [editStudent, setEditStudent] = useState(false);
  const [sf, setSf] = useState<any>({});
  const openEditStudent = () => { setSf({ name: s.name, gender: s.gender, dateOfBirth: s.dateOfBirth ? s.dateOfBirth.substring(0, 10) : '', bloodGroup: s.bloodGroup || '', religion: s.religion || '', nationality: s.nationality || '', phone: s.phone || '', studentEmail: s.studentEmail || '', studentWhatsapp: s.studentWhatsapp || '', address: s.address || '', city: s.city || '', bformCnic: s.bformCnic || '' }); setEditStudent(true); };
  const handleSaveStudent = async () => {
    try { await api.updateStudent(id, sf); showToast('success', 'Updated'); setEditStudent(false); loadData(); }
    catch (e: any) { showToast('error', e.message || 'Failed'); }
  };

  // ─── Parent inline edit ────────────────────────────
  const [editParent, setEditParent] = useState(false);
  const [pf, setPf] = useState<any>({});
  const openEditParent = (p: any) => {
    setPf({ name: p.user?.name || '', relation: p.relation || '', cnicNumber: p.cnicNumber || '', occupation: p.occupation || '', employerName: p.employerName || '', maritalStatus: p.maritalStatus || '', monthlyIncome: p.monthlyIncome || '', phone: p.phone || '', whatsapp: p.whatsapp || '', email: p.email || '' });
    setEditParent(true);
  };

  if (loading) return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6 h-5 w-32 animate-pulse rounded bg-warm-card" />
      <div className="mb-8 h-8 w-64 animate-pulse rounded bg-warm-card" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[1,2,3,4].map(i => <div key={i} className="h-24 rounded-xl bg-warm-card animate-pulse" />)}
      </div>
    </main>
  );

  if (error || !data) return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <button onClick={() => router.push('/admin/students')} className="mb-6 flex items-center gap-1.5 text-xs text-warm-muted hover:text-warm-cream transition-colors">
        <ArrowLeft size={13} /> Back to Students
      </button>
      <div className="rounded-xl border border-warm-card-border bg-warm-card p-8 text-center">
        <AlertTriangle size={28} className="mx-auto mb-3 text-warm-muted" />
        <p className="text-sm text-warm-muted">{error || 'Student not found'}</p>
      </div>
    </main>
  );

  const s = data;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <button onClick={() => router.push('/admin/students')} className="mb-6 flex items-center gap-1.5 text-xs text-warm-muted hover:text-warm-cream transition-colors">
        <ArrowLeft size={13} /> Back to Students
      </button>

      {/* Profile header */}
      <div className="mb-8 flex items-start justify-between gap-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold text-warm-cream tracking-tight">{s.name}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
            {s.rollNumber && <span className="text-sm text-warm-muted/70">Roll No: {s.rollNumber}</span>}
            {s.group && (
              <span className="inline-flex items-center gap-1 rounded-full border border-warm-accent/20 bg-warm-accent/5 px-2.5 py-0.5 text-[11px] text-warm-accent">
                {s.group.name}{s.group.section ? ` — ${s.group.section}` : ''}
              </span>
            )}
            <span className={`inline-flex items-center gap-1.5 text-xs ${s.status === 'ACTIVE' ? 'text-green-400' : 'text-warm-muted/50'}`}>
              <span className={`inline-block h-2 w-2 rounded-full ${s.status === 'ACTIVE' ? 'bg-green-400' : 'bg-gray-500'}`} />
              {s.status}
            </span>
          </div>
        </div>

        {/* Photo */}
        <AvatarImage fileId={s.profilePhotoId} className="w-28 h-32 rounded-xl object-cover border-2 border-warm-card-border" fallback={s.name?.charAt(0)} />
      </div>

      {/* Student Information — 12 fields */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-warm-cream">Student Information</h2>
          <button onClick={openEditStudent} className="flex items-center gap-1.5 rounded-lg border border-warm-card-border px-3 py-1.5 text-[10px] text-warm-muted hover:text-warm-cream transition-colors">
            <Edit3 size={11} /> Edit
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <DetailCard icon={User} label="Full Name" value={s.name} />
          <DetailCard icon={Calendar} label="Date of Birth" value={s.dateOfBirth ? new Date(s.dateOfBirth).toLocaleDateString() : '—'} />
          <DetailCard icon={Heart} label="Gender" value={s.gender ? s.gender.charAt(0).toUpperCase() + s.gender.slice(1) : '—'} />
          <DetailCard icon={Heart} label="Blood Group" value={s.bloodGroup || '—'} />
          <DetailCard icon={Award} label="Religion" value={s.religion || '—'} />
          <DetailCard icon={Award} label="Nationality" value={s.nationality || '—'} />
          <DetailCard icon={Phone} label="Phone" value={s.phone || '—'} />
          <DetailCard icon={Mail} label="Email" value={s.studentEmail || '—'} />
          <DetailCard icon={Phone} label="WhatsApp" value={s.studentWhatsapp || '—'} />
          <DetailCard icon={MapPin} label="Address" value={[s.address, s.city].filter(Boolean).join(', ') || '—'} />
          <DetailCard icon={BookOpen} label="Admission No." value={s.admissionNumber || '—'} />
          <DetailCard icon={CreditCard} label="B-Form / CNIC" value={s.bformCnic || '—'} />
        </div>
      </section>

      {/* Parent / Guardian — 10 fields */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-warm-cream">Parent / Guardian</h2>
          <button onClick={() => openEditParent(s.parents?.[0] || {})} className="flex items-center gap-1.5 rounded-lg border border-warm-card-border px-3 py-1.5 text-[10px] text-warm-muted hover:text-warm-cream transition-colors">
            {s.parents?.length ? <><Edit3 size={11} /> Edit</> : <><Plus size={12} /> Add</>}
          </button>
        </div>
        {s.parents && s.parents.length > 0 ? s.parents.map((sp: any) => {
          const p = sp.parent;
          return (
            <div key={sp.id} className="mb-3 rounded-xl border border-warm-card-border bg-warm-card p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <DetailCard icon={User} label="Name" value={p.user?.name || '—'} />
                <DetailCard icon={User} label="Relation" value={sp.relation || p.relation || '—'} />
                <DetailCard icon={CreditCard} label="CNIC" value={p.cnicNumber || '—'} />
                <DetailCard icon={Award} label="Occupation" value={p.occupation || '—'} />
                <DetailCard icon={Award} label="Employer" value={p.employerName || '—'} />
                <DetailCard icon={Award} label="Marital Status" value={p.maritalStatus || '—'} />
                <DetailCard icon={FileText} label="Monthly Income" value={p.monthlyIncome ? p.monthlyIncome.replace(/_/g, ' ') : '—'} />
                <DetailCard icon={Phone} label="Phone" value={p.phone || '—'} />
                <DetailCard icon={Phone} label="WhatsApp" value={p.whatsapp || '—'} />
                <DetailCard icon={Mail} label="Email" value={p.email || '—'} />
              </div>
            </div>
          );
        }) : (
          <p className="text-xs text-warm-muted/50">No parent/guardian linked yet.</p>
        )}
      </section>

      {/* Emergency Contacts */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-warm-cream">Emergency Contacts</h2>
          <button onClick={() => setShowEcForm(true)}
            className="flex items-center gap-1.5 rounded-lg border border-warm-card-border px-3 py-1.5 text-[10px] text-warm-muted hover:text-warm-cream transition-colors">
            <Plus size={12} /> Add
          </button>
        </div>

        {s.emergencyContacts && s.emergencyContacts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {s.emergencyContacts.map((ecItem: any) => (
              <div key={ecItem.id} className="relative rounded-xl border border-warm-card-border bg-warm-card p-4">
                <button onClick={() => handleDeleteEc(ecItem.id)}
                  className="absolute top-2 right-2 rounded p-0.5 text-warm-muted hover:text-red transition-colors">
                  <Trash2 size={12} />
                </button>
                <DetailCard icon={User} label="Name" value={ecItem.name} />
                <div className="mt-2 space-y-1 text-xs text-warm-muted">
                  <p><span className="text-warm-muted/60">Relation:</span> {ecItem.relationship}</p>
                  <p><span className="text-warm-muted/60">Phone:</span> {ecItem.phone}</p>
                  {ecItem.whatsapp && <p><span className="text-warm-muted/60">WhatsApp:</span> {ecItem.whatsapp}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-warm-muted/50">No emergency contacts added yet.</p>
        )}
      </section>

      {/* Health */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-warm-cream">Health & Medical</h2>
          <button onClick={openHealthForm}
            className="flex items-center gap-1.5 rounded-lg border border-warm-card-border px-3 py-1.5 text-[10px] text-warm-muted hover:text-warm-cream transition-colors">
            {s.healthRecord ? <><Edit3 size={11} /> Edit</> : <><Plus size={12} /> Add</>}
          </button>
        </div>

        {s.healthRecord ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <DetailCard icon={Heart} label="Blood Group" value={s.healthRecord.bloodGroup || '—'} />
            <DetailCard icon={FileText} label="Chronic Disease" value={s.healthRecord.hasChronicDisease ? 'Yes' : 'No'} />
            <DetailCard icon={FileText} label="Disease Details" value={s.healthRecord.diseaseDetails || '—'} />
            <DetailCard icon={FileText} label="Allergies" value={s.healthRecord.allergies || 'None'} />
            <DetailCard icon={FileText} label="Disability" value={s.healthRecord.disability || 'None'} />
            <DetailCard icon={User} label="Doctor Name" value={s.healthRecord.doctorName || '—'} />
            <DetailCard icon={Phone} label="Doctor Phone" value={s.healthRecord.doctorPhone || '—'} />
            <div className="lg:col-span-2">
              <DetailCard icon={FileText} label="Medical Notes" value={s.healthRecord.medicalNotes || '—'} />
            </div>
          </div>
        ) : (
          <p className="text-xs text-warm-muted/50">No health record added yet.</p>
        )}
      </section>

      {/* Health record modal */}
      {showHlthForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setShowHlthForm(false)}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-warm-card-border bg-[#24201e] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-warm-cream">Health & Medical Record</h2>
              <button onClick={() => setShowHlthForm(false)} className="text-warm-muted hover:text-warm-cream"><X size={16} /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1 block text-xs text-warm-muted">Blood Group</label>
                  <input value={hlth.bloodGroup || ''} onChange={(e) => setHlth((p: any) => ({ ...p, bloodGroup: e.target.value }))} placeholder="e.g. B+" className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
                <div><label className="mb-1 block text-xs text-warm-muted">Chronic Disease</label>
                  <select value={hlth.hasChronicDisease ? 'true' : 'false'} onChange={(e) => setHlth((p: any) => ({ ...p, hasChronicDisease: e.target.value === 'true' }))}
                    className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent">
                    <option value="false">No</option><option value="true">Yes</option>
                  </select></div>
              </div>
              <div><label className="mb-1 block text-xs text-warm-muted">Disease Details</label>
                <textarea value={hlth.diseaseDetails || ''} onChange={(e) => setHlth((p: any) => ({ ...p, diseaseDetails: e.target.value }))} rows={2} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent resize-none" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1 block text-xs text-warm-muted">Allergies</label>
                  <input value={hlth.allergies || ''} onChange={(e) => setHlth((p: any) => ({ ...p, allergies: e.target.value }))} placeholder="e.g. Dust, Pollen" className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
                <div><label className="mb-1 block text-xs text-warm-muted">Disability</label>
                  <input value={hlth.disability || ''} onChange={(e) => setHlth((p: any) => ({ ...p, disability: e.target.value }))} placeholder="If any" className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1 block text-xs text-warm-muted">Doctor Name</label>
                  <input value={hlth.doctorName || ''} onChange={(e) => setHlth((p: any) => ({ ...p, doctorName: e.target.value }))} placeholder="e.g. Dr. Ayesha" className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
                <div><label className="mb-1 block text-xs text-warm-muted">Doctor Phone</label>
                  <input value={hlth.doctorPhone || ''} onChange={(e) => setHlth((p: any) => ({ ...p, doctorPhone: e.target.value }))} placeholder="+92 300 5556677" className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
              </div>
              <div><label className="mb-1 block text-xs text-warm-muted">Medical Notes</label>
                <textarea value={hlth.medicalNotes || ''} onChange={(e) => setHlth((p: any) => ({ ...p, medicalNotes: e.target.value }))} rows={3} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent resize-none" /></div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setShowHlthForm(false)} className="rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream">Cancel</button>
              <button onClick={handleSaveHealth} className="rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76]">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Student Edit modal */}
      {editStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setEditStudent(false)}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-warm-card-border bg-[#24201e] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-warm-cream">Edit Student</h2>
              <button onClick={() => setEditStudent(false)} className="text-warm-muted hover:text-warm-cream"><X size={16} /></button>
            </div>
            <div className="space-y-4">
              <div><label className="mb-1 block text-xs text-warm-muted">Full Name</label>
                <input placeholder="e.g. Ali Hassan" value={sf.name} onChange={(e) => setSf((p: any) => ({ ...p, name: e.target.value }))} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1 block text-xs text-warm-muted">Gender</label>
                  <select value={sf.gender} onChange={(e) => setSf((p: any) => ({ ...p, gender: e.target.value }))} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent">
                    <option value="">-- Select --</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
                  </select></div>
                <div><label className="mb-1 block text-xs text-warm-muted">Date of Birth</label>
                  <input type="date" value={sf.dateOfBirth || '"'} onChange={(e) => setSf((p: any) => ({ ...p, dateOfBirth: e.target.value }))} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1 block text-xs text-warm-muted">Blood Group</label>
                  <input value={sf.bloodGroup} onChange={(e) => setSf((p: any) => ({ ...p, bloodGroup: e.target.value }))} placeholder="e.g. B+" className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
                <div><label className="mb-1 block text-xs text-warm-muted">Religion</label>
                  <input value={sf.religion} onChange={(e) => setSf((p: any) => ({ ...p, religion: e.target.value }))} placeholder="e.g. Islam" className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1 block text-xs text-warm-muted">Phone</label>
                  <input placeholder="e.g. +92 300 1234567" value={sf.phone} onChange={(e) => setSf((p: any) => ({ ...p, phone: e.target.value }))} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
                <div><label className="mb-1 block text-xs text-warm-muted">Email</label>
                  <input placeholder="e.g. ali@email.com" value={sf.studentEmail} onChange={(e) => setSf((p: any) => ({ ...p, studentEmail: e.target.value }))} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
              </div>
              <div><label className="mb-1 block text-xs text-warm-muted">Nationality</label>
                <input value={sf.nationality} onChange={(e) => setSf((p: any) => ({ ...p, nationality: e.target.value }))} placeholder="e.g. Pakistani" className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
              <div><label className="mb-1 block text-xs text-warm-muted">WhatsApp</label>
                <input value={sf.studentWhatsapp} onChange={(e) => setSf((p: any) => ({ ...p, studentWhatsapp: e.target.value }))} placeholder="e.g. +92 300 1234567" className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1 block text-xs text-warm-muted">City</label>
                  <input value={sf.city} onChange={(e) => setSf((p: any) => ({ ...p, city: e.target.value }))} placeholder="e.g. Islamabad" className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
                <div><label className="mb-1 block text-xs text-warm-muted">B-Form / CNIC</label>
                  <input value={sf.bformCnic} onChange={(e) => setSf((p: any) => ({ ...p, bformCnic: e.target.value }))} placeholder="e.g. 61101-1234567-1" className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
              </div>
              <div><label className="mb-1 block text-xs text-warm-muted">Address</label>
                <textarea placeholder="Complete address" value={sf.address} onChange={(e) => setSf((p: any) => ({ ...p, address: e.target.value }))} rows={2} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent resize-none" /></div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setEditStudent(false)} className="rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream">Cancel</button>
              <button onClick={handleSaveStudent} className="rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76]">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Parent Edit modal */}
      {editParent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setEditParent(false)}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-warm-card-border bg-[#24201e] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-warm-cream">Edit Parent / Guardian</h2>
              <button onClick={() => setEditParent(false)} className="text-warm-muted hover:text-warm-cream"><X size={16} /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1 block text-xs text-warm-muted">Name</label>
                  <input placeholder="e.g. Muhammad Hassan" value={pf.name} onChange={(e) => setPf((p: any) => ({ ...p, name: e.target.value }))} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
                <div><label className="mb-1 block text-xs text-warm-muted">Relation</label>
                  <input placeholder="e.g. Father" value={pf.relation} onChange={(e) => setPf((p: any) => ({ ...p, relation: e.target.value }))} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1 block text-xs text-warm-muted">CNIC</label>
                  <input placeholder="e.g. 61101-1234567-1" value={pf.cnicNumber} onChange={(e) => setPf((p: any) => ({ ...p, cnicNumber: e.target.value }))} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
                <div><label className="mb-1 block text-xs text-warm-muted">Occupation</label>
                  <input placeholder="e.g. Business" value={pf.occupation} onChange={(e) => setPf((p: any) => ({ ...p, occupation: e.target.value }))} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1 block text-xs text-warm-muted">Employer</label>
                  <input placeholder="e.g. Employer name" value={pf.employerName} onChange={(e) => setPf((p: any) => ({ ...p, employerName: e.target.value }))} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
                <div><label className="mb-1 block text-xs text-warm-muted">Marital Status</label>
                  <input placeholder="e.g. Married" value={pf.maritalStatus} onChange={(e) => setPf((p: any) => ({ ...p, maritalStatus: e.target.value }))} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1 block text-xs text-warm-muted">Monthly Income</label>
                  <input placeholder="e.g. above_20k" value={pf.monthlyIncome} onChange={(e) => setPf((p: any) => ({ ...p, monthlyIncome: e.target.value }))} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
                <div><label className="mb-1 block text-xs text-warm-muted">Phone</label>
                  <input placeholder="e.g. +92 300 9876543" value={pf.phone} onChange={(e) => setPf((p: any) => ({ ...p, phone: e.target.value }))} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1 block text-xs text-warm-muted">WhatsApp</label>
                  <input placeholder="e.g. +92 300 9876543" value={pf.whatsapp} onChange={(e) => setPf((p: any) => ({ ...p, whatsapp: e.target.value }))} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
                <div><label className="mb-1 block text-xs text-warm-muted">Email</label>
                  <input placeholder="e.g. parent@email.com" value={pf.email} onChange={(e) => setPf((p: any) => ({ ...p, email: e.target.value }))} className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setEditParent(false)} className="rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream">Cancel</button>
              <button onClick={async () => {
                try {
                  await apiRequest(`/admin/students/${id}/parent`, { method: 'PUT', body: JSON.stringify(pf) });
                  showToast('success', 'Parent updated'); setEditParent(false); loadData();
                } catch (e: any) { showToast('error', e.message || 'Failed'); }
              }} className="rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76]">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Contact modal */}
      {showEcForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setShowEcForm(false)}>
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl border border-warm-card-border bg-[#24201e] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-warm-cream">Add Emergency Contact</h2>
              <button onClick={() => setShowEcForm(false)} className="text-warm-muted hover:text-warm-cream"><X size={16} /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1 block text-xs text-warm-muted">Name *</label>
                  <input value={ec.name} onChange={(e) => setEc((p: any) => ({ ...p, name: e.target.value }))} placeholder="e.g. Fatima Hassan" className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
                <div><label className="mb-1 block text-xs text-warm-muted">Relationship</label>
                  <input value={ec.relationship} onChange={(e) => setEc((p: any) => ({ ...p, relationship: e.target.value }))} placeholder="e.g. Mother" className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1 block text-xs text-warm-muted">Phone *</label>
                  <input value={ec.phone} onChange={(e) => setEc((p: any) => ({ ...p, phone: e.target.value }))} placeholder="e.g. +92 300 1112223" className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
                <div><label className="mb-1 block text-xs text-warm-muted">WhatsApp</label>
                  <input value={ec.whatsapp} onChange={(e) => setEc((p: any) => ({ ...p, whatsapp: e.target.value }))} placeholder="e.g. +92 300 1112223" className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent" /></div>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setShowEcForm(false)} className="rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream">Cancel</button>
              <button onClick={handleAddEc} className="rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76]">Save</button>
            </div>
          </div>
        </div>
      )}


    </main>
  );
}

function DetailCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-warm-card-border bg-warm-card p-3">
      <div className="flex items-center gap-2">
        <Icon size={13} className="text-warm-accent shrink-0" />
        <span className="text-[10px] tracking-wider text-warm-muted uppercase">{label}</span>
      </div>
      <p className="mt-1 text-sm text-warm-cream break-words">{value}</p>
    </div>
  );
}
