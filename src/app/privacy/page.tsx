import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Mother Care School collects, uses, and protects your personal information.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 mb-8 inline-block">
          &larr; Back to Home
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-10">Effective Date: September 5, 2026</p>

        <div className="space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Introduction</h2>
            <p>
              Mother Care School (&quot;MCS&quot;, &quot;we&quot;, &quot;our&quot;) is committed to protecting the privacy of
              students, parents, teachers, and staff. This Privacy Policy explains how we collect, use,
              store, and protect personal information through our platform (web, mobile, and related services).
            </p>
            <p className="mt-2">
              This policy complies with applicable data protection laws, including the Pakistan Personal
              Data Protection Bill and general principles of data minimization and purpose limitation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Information We Collect</h2>
            <p className="font-medium">Account and Identity Information:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Name, username, email address, phone number</li>
              <li>Role (administrator, teacher, student, staff)</li>
              <li>Profile photo (optional)</li>
              <li>Login credentials (passwords are hashed, never stored in plain text)</li>
            </ul>

            <p className="font-medium mt-3">Student Academic Records:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Enrollment details, class assignments, and attendance</li>
              <li>Academic results, grades, and report cards</li>
              <li>Fee records and payment history</li>
              <li>Medical information (blood group, allergies — if provided)</li>
              <li>Emergency contacts and parent/guardian information</li>
            </ul>

            <p className="font-medium mt-3">Communication Data:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Group chat messages and announcements</li>
              <li>Direct messages between authorized users</li>
              <li>Attachments (photos, documents, voice notes)</li>
            </ul>

            <p className="font-medium mt-3">Technical Data:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Device information (for mobile app: device type, OS version)</li>
              <li>IP addresses and access logs (for security)</li>
              <li>Push notification tokens (for mobile notifications)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. How We Use Your Information</h2>
            <p>We use collected information for the following purposes:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>School Administration:</strong> Managing student enrollment, attendance, fees, and academic records</li>
              <li><strong>Communication:</strong> Facilitating messaging between authorized school members</li>
              <li><strong>Notifications:</strong> Sending attendance alerts, fee reminders, and school announcements via WhatsApp or push notifications</li>
              <li><strong>Security:</strong> Authenticating users, preventing unauthorized access, and maintaining audit trails</li>
              <li><strong>Reporting:</strong> Generating academic reports, fee summaries, and administrative analytics</li>
              <li><strong>Legal Compliance:</strong> Meeting regulatory and record-keeping requirements</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Data Sharing</h2>
            <p>We do not sell or rent personal information to third parties. Data may be shared only:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>Within the school:</strong> Authorized staff access data based on their role and permissions</li>
              <li><strong>Service Providers:</strong> With infrastructure providers (hosting, database) under strict data processing agreements</li>
              <li><strong>Legal Requirements:</strong> When required by law, court order, or government authority</li>
              <li><strong>With Consent:</strong> When you explicitly authorize sharing (e.g., forwarding records to another school)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Data Security</h2>
            <p>We implement industry-standard security measures:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Passwords are hashed using bcrypt with 12 salt rounds</li>
              <li>All communication is encrypted in transit (TLS/HTTPS)</li>
              <li>JWT tokens are stored in httpOnly cookies (web) or hardware-backed secure storage (mobile)</li>
              <li>Role-based access control limits data access to authorized personnel</li>
              <li>Audit logs track all sensitive operations</li>
              <li>Regular security updates and dependency audits</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Data Retention</h2>
            <p>
              Student academic records are retained for the duration required by educational regulations.
              Communication data is retained while the account is active. After account termination or
              graduation, data is retained according to the school&apos;s record-keeping policy and may be
              archived. You may request data deletion by contacting school administration.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Your Rights</h2>
            <p>As a data subject, you have the right to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Request correction of inaccurate data</li>
              <li><strong>Deletion:</strong> Request deletion of your data (subject to legal retention requirements)</li>
              <li><strong>Portability:</strong> Request your data in a machine-readable format</li>
              <li><strong>Objection:</strong> Object to processing of your data for specific purposes</li>
            </ul>
            <p className="mt-2">
              To exercise these rights, contact the school administration through the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Children&apos;s Privacy</h2>
            <p>
              The Service is used in an educational context involving minors. We collect student data
              as part of school administration with parental/guardian consent obtained through school
              enrollment. We do not collect data from children for marketing purposes. Parents may
              review their child&apos;s data through the platform or by contacting the school.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Push Notifications</h2>
            <p>
              The mobile app may send push notifications for attendance alerts, fee reminders, and
              school announcements. You can disable notifications in your device settings. Notification
              tokens are stored securely and are only used for delivering relevant school communications.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy periodically. Changes will be communicated through the
              platform and the effective date will be updated. Continued use after changes constitutes
              acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Contact</h2>
            <p>
              For privacy-related inquiries, data requests, or complaints, contact the school
              administration through the platform or at the school&apos;s official contact channels.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
