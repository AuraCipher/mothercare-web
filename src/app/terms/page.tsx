import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms and conditions for using the Mother Care School platform.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 mb-8 inline-block">
          &larr; Back to Home
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-10">Effective Date: September 5, 2026</p>

        <div className="space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the Mother Care School (&quot;MCS&quot;) platform, including the web application,
              mobile application, and related services (collectively, the &quot;Service&quot;), you agree to be bound
              by these Terms of Service. If you do not agree, do not use the Service.
            </p>
            <p className="mt-2">
              The Service is provided exclusively for the use of Mother Care School and its authorized
              staff, teachers, students, and families. Unauthorized access is prohibited.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Eligibility</h2>
            <p>
              The Service is available only to authorized members of Mother Care School, including:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>School administrators and management staff</li>
              <li>Teachers and academic staff</li>
              <li>Students enrolled at the school</li>
              <li>Parents and guardians of enrolled students</li>
            </ul>
            <p className="mt-2">
              Accounts are created by school administration. You may not create an account without authorization.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Account Responsibilities</h2>
            <p>
              You are responsible for maintaining the confidentiality of your login credentials. You must:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Keep your password secure and do not share it with others</li>
              <li>Notify the school administration immediately if you suspect unauthorized access</li>
              <li>Not use another user&apos;s account without permission</li>
              <li>Ensure all information provided during registration is accurate</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Acceptable Use</h2>
            <p>You agree to use the Service only for its intended educational and administrative purposes:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Managing student records, attendance, fees, and academic results</li>
              <li>Communication between authorized school members</li>
              <li>Administrative tasks related to school operations</li>
            </ul>
            <p className="mt-2">You must not:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Use the Service for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to other accounts or systems</li>
              <li>Upload malicious content or viruses</li>
              <li>Harass, bully, or threaten other users</li>
              <li>Share content that violates school policies</li>
              <li>Reverse engineer or attempt to extract source code</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Intellectual Property</h2>
            <p>
              The Service, including its design, code, and content, is the intellectual property of Mother Care School.
              Student data entered into the system remains the property of the student and their family. The school
              retains ownership of administrative data and configurations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Data and Privacy</h2>
            <p>
              Your use of the Service is also governed by our{' '}
              <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>,
              which describes how we collect, use, and protect your personal information. By using the Service,
              you consent to the data practices described in the Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Communication Features</h2>
            <p>
              The Service includes messaging features (group chats, direct messages, announcements). These
              communications are monitored by school administration and must comply with school policies.
              The school reserves the right to access, review, and take action on messages that violate policies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Fees and Payments</h2>
            <p>
              The Service facilitates viewing and management of school fees. Payment processing is handled
              through approved school channels. The Service is not a payment processor and does not store
              payment card information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Limitation of Liability</h2>
            <p>
              The Service is provided &quot;as is&quot; without warranties of any kind. Mother Care School shall not
              be liable for any indirect, incidental, or consequential damages arising from the use of the Service.
              The school makes reasonable efforts to ensure data accuracy but does not guarantee uninterrupted
              or error-free operation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Termination</h2>
            <p>
              The school may suspend or terminate your access to the Service at any time for violation of
              these terms or school policies. Upon termination, your right to use the Service ceases immediately.
              Data retention after termination is governed by school record-keeping policies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Changes to Terms</h2>
            <p>
              Mother Care School reserves the right to modify these terms at any time. Changes will be
              communicated through the platform. Continued use after changes constitutes acceptance of
              the modified terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Contact</h2>
            <p>
              For questions about these Terms of Service, contact the school administration through
              the platform or at the school&apos;s official contact channels.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
