'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Printer } from 'lucide-react';

/**
 * Printable Student Admission Form.
 *
 * A blank, hand-fillable A4 sheet covering every field the student detail page
 * stores, so it can be printed, given to parents, and keyed back in by office
 * staff. Nothing here talks to the API — it is a pure print artefact.
 *
 * Layout mirrors the detail page's 7 sections, plus a non-fillable Office Use
 * strip (admission no / roll no / admission date / class-section) that office
 * staff complete after the student is created in the system.
 */

/* ── Primitives ───────────────────────────────────────────── */

/** Label above a ruled blank line (or `lines` of them for free-text answers). */
function Field({ label, className = '', lines = 1 }: { label: string; className?: string; lines?: number }) {
  return (
    <div className={className}>
      <p className="text-[7.5pt] font-semibold uppercase tracking-[0.06em] text-[#555]">{label}</p>
      <div className="mt-[3px]">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="h-[15px] border-b border-[#9a9a9a]" />
        ))}
      </div>
    </div>
  );
}

/** Label above a row of tick-boxes. */
function CheckField({ label, options, className = '' }: { label: string; options: string[]; className?: string }) {
  return (
    <div className={className}>
      <p className="text-[7.5pt] font-semibold uppercase tracking-[0.06em] text-[#555]">{label}</p>
      <div className="mt-[6px] flex flex-wrap items-center gap-x-[14px] gap-y-1">
        {options.map((o) => (
          <span key={o} className="flex items-center gap-[5px] text-[8.5pt] text-[#111]">
            <span className="inline-block h-[10px] w-[10px] border border-[#666]" />
            {o}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Numbered section with a heading bar and a 3-column field grid. */
function FormSection({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-[14px] break-inside-avoid">
      <div className="mb-[9px] flex items-center gap-[7px] border-b-[1.5px] border-[#111] pb-[4px]">
        <span className="flex h-[15px] w-[15px] shrink-0 items-center justify-center bg-[#111] text-[8pt] font-bold text-white print-exact">
          {n}
        </span>
        <h2 className="text-[9.5pt] font-bold uppercase tracking-[0.1em] text-[#111]">{title}</h2>
      </div>
      <div className="grid grid-cols-3 gap-x-[16px] gap-y-[11px]">{children}</div>
    </section>
  );
}

/** One parent's details — Father / Mother / Guardian block. */
function ParentBlock({ label }: { label: string }) {
  return (
    <div className="mb-[10px] break-inside-avoid border border-[#c4c4c4] p-[9px]">
      <p className="mb-[9px] inline-block bg-[#ececec] px-[7px] py-[2px] text-[7.5pt] font-bold uppercase tracking-[0.1em] text-[#111] print-exact">
        {label}
      </p>
      <div className="grid grid-cols-3 gap-x-[16px] gap-y-[11px]">
        <Field label="Full Name" className="col-span-2" />
        <Field label="CNIC / B-Form No." />
        <Field label="Occupation" />
        <Field label="Employer / Organization" />
        <Field label="Monthly Income" />
        <Field label="Mobile Number" />
        <Field label="WhatsApp Number" />
        <Field label="Email Address" />
        <CheckField label="Marital Status" options={['Married', 'Unmarried', 'Widowed', 'Divorced']} className="col-span-3" />
      </div>
    </div>
  );
}

/** Signature / date rule used in the closing declaration block. */
function SignatureLine({ label, wide = false }: { label: string; wide?: boolean }) {
  return (
    <div className={wide ? 'col-span-2' : ''}>
      <div className="h-[30px]" />
      <div className="border-t border-[#111]" />
      <p className="mt-[3px] text-[7.5pt] text-[#444]">{label}</p>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────── */

export default function AdmissionFormPage() {
  const router = useRouter();

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      {/* Screen-only toolbar — never printed */}
      <div className="mb-6 flex items-center justify-between print:hidden">
        <button
          onClick={() => router.push('/admin/students')}
          className="flex items-center gap-1.5 text-xs text-warm-muted transition-colors hover:text-warm-cream"
        >
          <ArrowLeft size={13} /> Back to Students
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] transition-colors hover:bg-[#b39a76]"
        >
          <Printer size={13} /> Print Form
        </button>
      </div>

      {/* ── The A4 sheet ── */}
      <div className="print-sheet mx-auto max-w-[190mm] bg-white p-[14mm] text-[#111] shadow-xl print:max-w-none">
        {/* Header: school identity + photo box */}
        <div className="mb-[14px] flex items-start justify-between gap-6 border-b-[2px] border-[#111] pb-[12px]">
          <div className="flex-1">
            <h1 className="text-[17pt] font-bold uppercase leading-tight tracking-[0.04em] text-[#111]">
              Mother Care School
            </h1>
            <p className="mt-[3px] text-[8.5pt] uppercase tracking-[0.18em] text-[#555]">
              Student Admission Form
            </p>
            <p className="mt-[9px] text-[8.5pt] text-[#333]">
              Academic Year:&nbsp;
              <span className="inline-block w-[90px] border-b border-[#9a9a9a]" />
            </p>
          </div>

          {/* Passport-photo box */}
          <div className="shrink-0 text-center">
            <div className="flex h-[105px] w-[85px] items-center justify-center border border-dashed border-[#888] p-1">
              <span className="text-[6.5pt] leading-tight text-[#888]">Affix recent photograph</span>
            </div>
            <p className="mt-[4px] text-[6.5pt] uppercase tracking-[0.08em] text-[#888]">Passport size</p>
          </div>
        </div>

        {/* Office Use strip — not filled by the parent */}
        <div className="mb-[16px] break-inside-avoid bg-[#ececec] px-[10px] py-[9px] print-exact">
          <p className="mb-[7px] text-[7pt] font-bold uppercase tracking-[0.16em] text-[#444]">
            For Office Use Only
          </p>
          <div className="grid grid-cols-5 gap-x-[14px]">
            {['Admission No.', 'Roll No.', 'Admission Date', 'Class / Section', 'Received By'].map((l) => (
              <div key={l}>
                <p className="text-[7pt] font-semibold uppercase tracking-[0.05em] text-[#666]">{l}</p>
                <div className="mt-[3px] h-[15px] border-b border-[#9a9a9a]" />
              </div>
            ))}
          </div>
        </div>

        {/* 1. Student Information */}
        <FormSection n={1} title="Student Information">
          <Field label="Full Name" className="col-span-2" />
          <Field label="Date of Birth" />
          <CheckField label="Gender" options={['Male', 'Female', 'Other']} className="col-span-2" />
          <Field label="Blood Group" />
          <Field label="B-Form / CNIC No." className="col-span-2" />
          <Field label="Religion" />
          <Field label="Nationality" />
          <Field label="Mother Tongue" />
          <Field label="Any sibling already studying here? (Name & Class)" />
        </FormSection>

        {/* 2. Student Contact */}
        <FormSection n={2} title="Student Contact (Optional — for older students)">
          <Field label="Mobile Number" />
          <Field label="Email Address" />
          <Field label="WhatsApp Number" />
        </FormSection>

        {/* 3. Parent / Guardian */}
        <section className="mb-[14px] break-inside-avoid">
          <div className="mb-[9px] flex items-center gap-[7px] border-b-[1.5px] border-[#111] pb-[4px]">
            <span className="flex h-[15px] w-[15px] shrink-0 items-center justify-center bg-[#111] text-[8pt] font-bold text-white print-exact">
              3
            </span>
            <h2 className="text-[9.5pt] font-bold uppercase tracking-[0.1em] text-[#111]">Parent / Guardian</h2>
          </div>
          <ParentBlock label="Father" />
          <ParentBlock label="Mother" />
        </section>

        {/* 4. Address */}
        <FormSection n={4} title="Residential Address">
          <Field label="Full Address" className="col-span-3" lines={2} />
          <Field label="City" />
          <Field label="Country" />
          <Field label="Postal Code" />
        </FormSection>

        {/* 5. Emergency Contact */}
        <FormSection n={5} title="Emergency Contact">
          <Field label="Name" />
          <Field label="Relationship to Student" />
          <Field label="Mobile Number" />
          <Field label="WhatsApp Number" />
          <Field label="Alternate Contact / Address" className="col-span-2" />
        </FormSection>

        {/* 6. Health & Medical */}
        <FormSection n={6} title="Health & Medical">
          <CheckField label="Any chronic disease?" options={['No', 'Yes']} />
          <Field label="If yes, disease details" className="col-span-2" />
          <Field label="Allergies" className="col-span-2" />
          <Field label="Disability / Special needs" />
          <Field label="Doctor Name" />
          <Field label="Doctor Phone" />
          <Field label="Any regular medication?" />
          <Field label="Medical notes" className="col-span-3" lines={2} />
        </FormSection>

        {/* 7. Previous Education */}
        <FormSection n={7} title="Previous Education">
          <Field label="Previous School" className="col-span-2" />
          <Field label="Previous Class" />
          <Field label="TC Number" />
          <Field label="Referred By" className="col-span-2" />
        </FormSection>

        {/* Declaration & signatures */}
        <section className="mt-[16px] break-inside-avoid">
          <div className="mb-[9px] border-b-[1.5px] border-[#111] pb-[4px]">
            <h2 className="text-[9.5pt] font-bold uppercase tracking-[0.1em] text-[#111]">Declaration</h2>
          </div>
          <p className="text-[8pt] leading-[1.55] text-[#333]">
            I hereby declare that the information provided above is true and correct to the best of my
            knowledge. I understand that any false or withheld information may result in the admission being
            cancelled, and I agree to the school&rsquo;s rules, fee policy and code of conduct.
          </p>
          <div className="mt-[10px] grid grid-cols-3 gap-x-[16px]">
            <SignatureLine label="Parent / Guardian Signature &amp; Date" />
            <SignatureLine label="Student Signature &amp; Date" />
            <SignatureLine label="Office — Received By &amp; Date" />
          </div>
        </section>
      </div>
    </main>
  );
}
