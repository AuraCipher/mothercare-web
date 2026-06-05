import config from '@/config';
import { Lock, Megaphone, Layers, Users, GraduationCap, BookOpen, School, ArrowRight } from 'lucide-react';
import HeroCanvas from '@/components/hero-canvas-wrapper';

const features = [
  {
    icon: Lock,
    title: 'Private Communication',
    description: 'End-to-end privacy for school-parent messaging. Every conversation stays secure and confidential.',
  },
  {
    icon: Megaphone,
    title: 'Smart Broadcasting',
    description: 'Reach the right parents with targeted announcements. No more blanket messages that get ignored.',
  },
  {
    icon: Layers,
    title: 'Batch Management',
    description: 'Automatic yearly promotion ensures student records follow seamlessly — never lose data between terms.',
  },
] as const;

const stats = [
  { icon: Users, label: 'Students', value: '500+' },
  { icon: GraduationCap, label: 'Teachers', value: '40+' },
  { icon: BookOpen, label: 'Classes', value: '13' },
  { icon: School, label: 'Years Active', value: '8+' },
] as const;

const steps = [
  { number: '01', title: 'Admin Creates Accounts', description: 'All users are created by school administration. No self-signup, no spam, full control.' },
  { number: '02', title: 'Teachers Broadcast', description: 'Teachers send messages to their assigned class groups. Parents receive instantly.' },
  { number: '03', title: 'Parents Stay Informed', description: 'Parents see only their child\'s group. Privacy-first, no member lists, no distractions.' },
] as const;

export default function Home() {
  return (
    <>
      <HeroCanvas />

      {/* ── Hero ──────────────────────────────────── */}
      <section className="relative flex min-h-screen flex-col items-center px-6 pt-32 text-center md:pt-48">
        {/* Logo */}
        <div className="mb-8">
          <svg
            viewBox="0 0 24 24"
            className="h-10 w-10 stroke-warm-accent"
            fill="none"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>

        <h1 className="mb-6 text-4xl font-light tracking-tight text-warm-cream md:text-5xl lg:text-6xl">
          {config.appName}
        </h1>

        <p className="mb-10 max-w-lg text-base leading-relaxed text-warm-muted md:text-lg">
          School broadcasting &amp; communication platform. Built for privacy, role-based access, and seamless
          parent-teacher connection.
        </p>

        <a
          href="/login"
          className="inline-flex items-center justify-center rounded-lg bg-warm-accent px-8 py-3 text-sm font-medium text-[#1a1614] transition-colors hover:bg-[#b39a76]"
        >
          Get Started
        </a>
      </section>

      {/* ── Stats ──────────────────────────────────── */}
      <section className="relative px-6 pb-24">
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="rounded-xl border bg-warm-card border-warm-card-border p-5 text-center">
                  <Icon className="mx-auto mb-2 h-5 w-5 text-warm-accent" aria-hidden="true" />
                  <p className="text-2xl font-light text-warm-cream">{stat.value}</p>
                  <p className="mt-0.5 text-xs text-warm-muted">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────── */}
      <section className="relative px-6 pb-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-2xl font-light text-warm-cream md:text-3xl">How It Works</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <p className="mb-2 text-sm font-medium text-warm-accent">{step.number}</p>
                <h3 className="mb-2 text-lg font-medium text-warm-cream">{step.title}</h3>
                <p className="text-sm leading-relaxed text-warm-muted">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────── */}
      <section className="relative px-6 pb-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-2xl font-light text-warm-cream md:text-3xl">Why Mother Care</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="rounded-xl border bg-warm-card border-warm-card-border p-6">
                  <Icon className="mb-4 h-6 w-6 text-warm-accent" aria-hidden="true" />
                  <h3 className="mb-2 text-lg font-medium text-warm-cream">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-warm-muted">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────── */}
      <section className="relative px-6 pb-32 text-center">
        <div className="mx-auto max-w-lg">
          <h2 className="mb-4 text-2xl font-light text-warm-cream md:text-3xl">Ready to get started?</h2>
          <p className="mb-8 text-sm leading-relaxed text-warm-muted">
            Sign in to your school portal. All credentials are managed by your school administrator.
          </p>
          <a
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg bg-warm-accent px-8 py-3 text-sm font-medium text-[#1a1614] transition-colors hover:bg-[#b39a76]"
          >
            Sign In <ArrowRight size={16} aria-hidden="true" />
          </a>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────── */}
      <footer className="relative pb-8 text-center">
        <p className="text-xs text-warm-muted">
          &copy; {new Date().getFullYear()} {config.appName}. All rights reserved.
        </p>
      </footer>
    </>
  );
}
