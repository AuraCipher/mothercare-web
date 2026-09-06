import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About',
  description: 'About Mother Care School and its digital platform.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 mb-8 inline-block">
          &larr; Back to Home
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">About Mother Care School</h1>
        <p className="text-sm text-gray-500 mb-10">School Management & Communication Platform</p>

        <div className="space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Our Mission</h2>
            <p>
              Mother Care School is a comprehensive school management and communication platform
              designed to streamline educational administration, enhance teacher-parent communication,
              and provide students with modern digital tools for their academic journey.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">What We Offer</h2>
            <div className="grid gap-4 mt-3">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900">Student Management</h3>
                <p className="text-sm mt-1">
                  Complete student lifecycle management from enrollment to graduation, including
                  profiles, attendance tracking, fee management, and academic records.
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900">Academic Administration</h3>
                <p className="text-sm mt-1">
                  Timetable scheduling, exam management, result processing, report card generation,
                  and batch promotion for year-end transitions.
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900">Fee Management</h3>
                <p className="text-sm mt-1">
                  Fee structure configuration, automated fee generation, payment tracking,
                  receipt management, and family billing with waterfall allocation.
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900">Communication</h3>
                <p className="text-sm mt-1">
                  Secure messaging with group chats, direct messages, school announcements,
                  class communities, and WhatsApp notification integration.
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900">Canteen & Stationary</h3>
                <p className="text-sm mt-1">
                  Inventory management, sales tracking, student accounts, and billing integration
                  with the fee system for school supplies.
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900">Mobile App</h3>
                <p className="text-sm mt-1">
                  Flutter-based mobile app for students with chat, attendance viewing, fee status,
                  results, timetable, and offline support.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Privacy & Security</h2>
            <p>
              We take data protection seriously. All user data is encrypted in transit and at rest.
              Access is controlled through role-based permissions, and every sensitive operation
              is logged for audit. We do not sell or share personal data with third parties.
            </p>
            <p className="mt-2">
              For details, see our{' '}
              <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Technology</h2>
            <p>
              The platform is built with modern, industry-standard technologies:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Next.js 16 web application with TypeScript</li>
              <li>Node.js + Express backend with Prisma ORM</li>
              <li>PostgreSQL database with Redis caching</li>
              <li>Flutter mobile application for iOS and Android</li>
              <li>Socket.IO for real-time communication</li>
              <li>Meta WhatsApp Cloud API for notifications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Terms</h2>
            <p>
              Use of this platform is governed by our{' '}
              <Link href="/terms" className="text-blue-600 hover:underline">Terms of Service</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Contact</h2>
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
