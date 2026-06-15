'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Calendar, Heart, Phone, Mail, MapPin, BookOpen, Award, CreditCard, FileText } from 'lucide-react';

const mockStudent = {
  id: 'stu-001',
  name: 'Ali Hassan',
  rollNumber: '012',
  admissionNumber: 'MCS-2026-0042',
  dateOfBirth: '2014-01-15',
  gender: 'male',
  bloodGroup: 'B+',
  religion: 'Islam',
  nationality: 'Pakistani',
  address: 'House #12, Street 5, F-8/3, Islamabad',
  phone: '+92 300 1234567',
  studentEmail: 'ali.hassan@email.com',
  studentWhatsapp: '+92 300 1234567',
  bformCnic: '61101-9876543-1',
  previousSchool: 'Islamabad Public School',
  previousClass: 'Class 4',
  profilePhotoId: null,
  status: 'ACTIVE',

  // Guardian
  guardian: {
    name: 'Muhammad Hassan',
    relation: 'Father',
    cnic: '61101-1234567-1',
    occupation: 'Business',
    employerName: 'Hassan & Sons Trading',
    maritalStatus: 'Married',
    monthlyIncome: 'above_20k',
    phone: '+92 300 9876543',
    whatsapp: '+92 300 9876543',
    email: 'm.hassan@email.com',
  },

  // Emergency contact
  emergencyContact: {
    name: 'Fatima Hassan',
    relation: 'Mother',
    phone: '+92 300 1112223',
    whatsapp: '+92 300 1112223',
  },

  // Health
  health: {
    bloodGroup: 'B+',
    hasChronicDisease: true,
    diseaseDetails: 'Asthma (mild) — uses inhaler during pollen season',
    allergies: 'Dust, Pollen',
    disability: '',
    medicalNotes: 'Avoid outdoor activities during high pollen days. Inhaler kept in school bag.',
    doctorName: 'Dr. Ayesha Khan',
    doctorPhone: '+92 300 5556677',
  },

  // Class
  class: { name: 'Class 5', section: 'A' },
  subjects: ['Mathematics', 'English', 'Urdu', 'Science', 'Islamiat'],
};

export default function MockStudentProfile() {
  const router = useRouter();

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <button onClick={() => router.push('/admin/students')} className="mb-6 flex items-center gap-1.5 text-xs text-warm-muted hover:text-warm-cream transition-colors">
        <ArrowLeft size={13} /> Back to Students
      </button>

      {/* Profile header */}
      <div className="mb-8 flex items-start justify-between gap-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold text-warm-cream tracking-tight">{mockStudent.name}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
            <span className="text-sm text-warm-muted/70">Roll No: {mockStudent.rollNumber}</span>
            <span className="inline-flex items-center gap-1 rounded-full border border-warm-accent/20 bg-warm-accent/5 px-2.5 py-0.5 text-[11px] text-warm-accent">
              {mockStudent.class.name} — {mockStudent.class.section}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-green-400">
              <span className="inline-block h-2 w-2 rounded-full bg-green-400" />
              {mockStudent.status}
            </span>
          </div>
        </div>

        {/* Photo placeholder */}
        <div className="w-28 h-32 rounded-xl border-2 border-warm-card-border bg-warm-card flex items-center justify-center shrink-0">
          <User size={32} className="text-warm-muted/40" />
        </div>
      </div>

      {/* Detail cards */}
      <section className="mb-10">
        <h2 className="mb-4 text-sm font-medium text-warm-cream">Student Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <DetailCard icon={User} label="Full Name" value={mockStudent.name} />
          <DetailCard icon={Calendar} label="Date of Birth" value={new Date(mockStudent.dateOfBirth).toLocaleDateString()} />
          <DetailCard icon={Heart} label="Gender" value={mockStudent.gender} />
          <DetailCard icon={Heart} label="Blood Group" value={mockStudent.bloodGroup} />
          <DetailCard icon={Award} label="Religion" value={mockStudent.religion} />
          <DetailCard icon={Award} label="Nationality" value={mockStudent.nationality} />
          <DetailCard icon={Phone} label="Phone" value={mockStudent.phone} />
          <DetailCard icon={Mail} label="Email" value={mockStudent.studentEmail} />
          <DetailCard icon={Phone} label="WhatsApp" value={mockStudent.studentWhatsapp} />
          <DetailCard icon={MapPin} label="Address" value={mockStudent.address} />
          <DetailCard icon={BookOpen} label="Admission No." value={mockStudent.admissionNumber} />
          <DetailCard icon={CreditCard} label="B-Form / CNIC" value={mockStudent.bformCnic || '—'} />
        </div>
      </section>

      {/* Guardian / Parent */}
      <section className="mb-10">
        <h2 className="mb-4 text-sm font-medium text-warm-cream">Parent / Guardian</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <DetailCard icon={User} label="Full Name" value={mockStudent.guardian.name} />
          <DetailCard icon={User} label="Relation" value={mockStudent.guardian.relation} />
          <DetailCard icon={CreditCard} label="CNIC No." value={mockStudent.guardian.cnic} />
          <DetailCard icon={Award} label="Occupation" value={mockStudent.guardian.occupation} />
          <DetailCard icon={Award} label="Employer" value={mockStudent.guardian.employerName} />
          <DetailCard icon={Award} label="Marital Status" value={mockStudent.guardian.maritalStatus} />
          <DetailCard icon={FileText} label="Monthly Income" value={mockStudent.guardian.monthlyIncome.replace('_', ' ')} />
          <DetailCard icon={Phone} label="Phone" value={mockStudent.guardian.phone} />
          <DetailCard icon={Phone} label="WhatsApp" value={mockStudent.guardian.whatsapp} />
          <DetailCard icon={Mail} label="Email" value={mockStudent.guardian.email} />
        </div>
      </section>

      {/* Emergency Contact */}
      <section className="mb-10">
        <h2 className="mb-4 text-sm font-medium text-warm-cream">Emergency Contact</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <DetailCard icon={User} label="Name" value={mockStudent.emergencyContact.name} />
          <DetailCard icon={User} label="Relation" value={mockStudent.emergencyContact.relation} />
          <DetailCard icon={Phone} label="Phone" value={mockStudent.emergencyContact.phone} />
          <DetailCard icon={Phone} label="WhatsApp" value={mockStudent.emergencyContact.whatsapp} />
        </div>
      </section>

      {/* Health / Medical */}
      <section className="mb-10">
        <h2 className="mb-4 text-sm font-medium text-warm-cream">Health & Medical</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <DetailCard icon={Heart} label="Blood Group" value={mockStudent.health.bloodGroup} />
          <DetailCard icon={FileText} label="Chronic Disease" value={mockStudent.health.hasChronicDisease ? 'Yes' : 'No'} />
          <DetailCard icon={FileText} label="Disease Details" value={mockStudent.health.diseaseDetails || '—'} />
          <DetailCard icon={FileText} label="Allergies" value={mockStudent.health.allergies || 'None'} />
          <DetailCard icon={FileText} label="Disability" value={mockStudent.health.disability || 'None'} />
          <DetailCard icon={User} label="Doctor Name" value={mockStudent.health.doctorName || '—'} />
          <DetailCard icon={Phone} label="Doctor Phone" value={mockStudent.health.doctorPhone || '—'} />
          <div className="col-span-2">
            <DetailCard icon={FileText} label="Medical Notes" value={mockStudent.health.medicalNotes || '—'} />
          </div>
        </div>
      </section>
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
      <p className="mt-1 text-sm text-warm-cream">{value}</p>
    </div>
  );
}
