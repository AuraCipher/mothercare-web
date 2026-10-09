import type { Metadata } from 'next';
import Link from 'next/link';
import { AppLogo } from '@/components/app-logo';
import { DownloadAppButton } from '@/components/download-app-button';
import HeroCanvas from '@/components/hero-canvas-wrapper';
import { Smartphone, ShieldCheck, Wifi } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Download',
  description:
    'Download the Mother Care School Android app — stay connected with classes, announcements, fees and results from your phone.',
  alternates: { canonical: '/download' },
};

const steps = [
  {
    number: '01',
    title: 'Tap Download',
    description: 'The APK file saves straight to your phone — no store, no account.',
  },
  {
    number: '02',
    title: 'Open the file',
    description: 'Pull down your notifications and tap the finished download, or find it in Files → Downloads.',
  },
  {
    number: '03',
    title: 'Allow & install',
    description: 'If Android asks, allow installs from your browser — then tap Install. Sign in with the credentials your school gave you.',
  },
] as const;

const requirements = [
  { icon: Smartphone, label: 'Android 7.0 or newer' },
  { icon: Wifi, label: 'About 70 MB download' },
  { icon: ShieldCheck, label: 'Official Mother Care School release' },
] as const;

export default function DownloadPage() {
  return (
    <>
      <HeroCanvas />

      {/* ── Hero ──────────────────────────────────── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-5">
          <AppLogo size={112} priority className="mx-auto h-auto w-24 rounded-2xl shadow-lg shadow-black/20 md:w-[112px]" />
        </div>

        <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-warm-accent">
          Mother Care School
        </p>

        <h1 className="mb-4 text-4xl font-light tracking-tight text-warm-cream md:text-5xl lg:text-6xl">
          Get the App
        </h1>

        <p className="mb-10 max-w-md text-base leading-relaxed text-warm-muted md:text-lg">
          Classes, announcements, fees and results — everything from school, in your pocket.
          Built for parents, teachers and staff.
        </p>

        <DownloadAppButton />

        {/* Requirements */}
        <ul className="mt-10 flex flex-col items-center gap-3 text-xs text-warm-muted sm:flex-row sm:gap-6">
          {requirements.map((req) => {
            const Icon = req.icon;
            return (
              <li key={req.label} className="flex items-center gap-2">
                <Icon size={14} className="shrink-0 text-warm-accent" aria-hidden="true" />
                {req.label}
              </li>
            );
          })}
        </ul>
      </section>

      {/* ── Install steps ─────────────────────────── */}
      <section className="relative px-6 pb-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-2xl font-light text-warm-cream md:text-3xl">
            Install in under a minute
          </h2>
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

      {/* ── Already have an account? ──────────────── */}
      <section className="relative px-6 pb-28 text-center">
        <div className="mx-auto max-w-lg rounded-xl border bg-warm-card border-warm-card-border p-8">
          <h2 className="mb-3 text-xl font-light text-warm-cream">Already have an account?</h2>
          <p className="mb-6 text-sm leading-relaxed text-warm-muted">
            Your school administrator creates every login. Use the credentials you were given —
            no self-signup needed.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-lg bg-warm-accent px-8 py-3 text-sm font-medium text-[#1a1614] transition-colors hover:bg-[#b39a76]"
          >
            Sign In
          </Link>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────── */}
      <footer className="relative pb-8 text-center">
        <div className="mb-3 flex items-center justify-center gap-4 text-xs text-warm-muted">
          <Link href="/" className="transition-colors hover:text-warm-cream">
            Home
          </Link>
          <span className="text-warm-card-border">|</span>
          <Link href="/about" className="transition-colors hover:text-warm-cream">
            About
          </Link>
          <span className="text-warm-card-border">|</span>
          <Link href="/terms" className="transition-colors hover:text-warm-cream">
            Terms of Service
          </Link>
          <span className="text-warm-card-border">|</span>
          <Link href="/privacy" className="transition-colors hover:text-warm-cream">
            Privacy Policy
          </Link>
        </div>
        <p className="text-xs text-warm-muted">
          &copy; {new Date().getFullYear()} Mother Care School. All rights reserved.
        </p>
      </footer>
    </>
  );
}
