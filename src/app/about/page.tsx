import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About | MCS-App',
  description: 'About Mother Care School and its digital platform.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#1a1614]">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link
          href="/"
          className="mb-8 inline-block text-xs text-warm-muted transition-colors hover:text-warm-cream"
        >
          &larr; Back to Home
        </Link>

        <h1 className="mb-2 text-3xl font-light tracking-tight text-warm-cream">
          About Mother Care School
        </h1>
        <p className="mb-10 text-xs text-warm-muted">
          School Management & Communication Platform
        </p>

        <div className="docs-prose">
          <section>
            <h2>Our Mission</h2>
            <p>
              Mother Care School is a comprehensive school management and communication platform
              designed to streamline educational administration, enhance teacher-parent
              communication, and provide students with modern digital tools for their academic
              journey.
            </p>
          </section>

          <section>
            <h2>What We Offer</h2>
            <div className="!my-6 grid gap-4">
              {[
                {
                  title: 'Student Management',
                  desc: 'Complete student lifecycle management from enrollment to graduation, including profiles, attendance tracking, fee management, and academic records.',
                },
                {
                  title: 'Academic Administration',
                  desc: 'Timetable scheduling, exam management, result processing, report card generation, and batch promotion for year-end transitions.',
                },
                {
                  title: 'Fee Management',
                  desc: 'Fee structure configuration, automated fee generation, payment tracking, receipt management, and family billing with waterfall allocation.',
                },
                {
                  title: 'Communication',
                  desc: 'Secure messaging with group chats, direct messages, school announcements, class communities, and push notification integration.',
                },
                {
                  title: 'Canteen & Stationery',
                  desc: 'Inventory management, sales tracking, student accounts, and billing integration with the fee system for school supplies.',
                },
                {
                  title: 'Mobile App',
                  desc: 'Flutter-based mobile app for students with chat, attendance viewing, fee status, results, timetable, and offline support.',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border border-warm-card-border bg-warm-card/40 p-5"
                >
                  <h3 className="font-medium text-warm-cream">{item.title}</h3>
                  <p className="mt-1 text-sm text-warm-muted">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2>Privacy &amp; Security</h2>
            <p>
              We take data protection seriously. All user data is encrypted in transit and at rest.
              Access is controlled through role-based permissions, and every sensitive operation
              is logged for audit. We do not sell or share personal data with third parties.
            </p>
            <p>
              For details, see our{' '}
              <Link href="/privacy" className="text-warm-accent underline-offset-2 hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </section>

          <section>
            <h2>Technology</h2>
            <p>The platform is built with modern, industry-standard technologies:</p>
            <ul>
              <li>Next.js web application with TypeScript</li>
              <li>Node.js + Express backend with Prisma ORM</li>
              <li>PostgreSQL database with Redis caching</li>
              <li>Flutter mobile application for iOS and Android</li>
              <li>Socket.IO for real-time communication</li>
              <li>Cloudflare R2 for secure file storage</li>
              <li>Firebase Cloud Messaging for push notifications</li>
            </ul>
          </section>

          <section>
            <h2>Terms</h2>
            <p>
              Use of this platform is governed by our{' '}
              <Link href="/terms" className="text-warm-accent underline-offset-2 hover:underline">
                Terms of Use
              </Link>
              .
            </p>
          </section>

          <section>
            <h2>Contact</h2>
            <p>
              For inquiries about the platform, contact the school administration through the
              platform or visit the school&apos;s official contact page.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
