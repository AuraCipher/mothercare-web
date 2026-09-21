import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | MCS-App',
  description:
    'Learn how MCS-App collects, uses, protects, stores, and manages personal and educational information.',
};

const toc = [
  { id: 'introduction', label: '1. Introduction' },
  { id: 'information-we-collect', label: '2. Information We Collect' },
  { id: 'how-we-use-information', label: '3. How We Use Information' },
  { id: 'legal-basis', label: '4. Legal Basis for Processing' },
  { id: 'how-information-is-shared', label: '5. How Information Is Shared' },
  { id: 'third-party-services', label: '6. Third-Party Services' },
  { id: 'notifications', label: '7. Notifications' },
  { id: 'cookies-and-storage', label: '8. Cookies and Similar Technologies' },
  { id: 'data-security', label: '9. Data Security' },
  { id: 'data-retention', label: '10. Data Retention' },
  { id: 'data-deletion', label: '11. Data Deletion' },
  { id: 'user-rights', label: '12. User Rights and Choices' },
  { id: 'childrens-information', label: "13. Children's and Student Information" },
  { id: 'international-processing', label: '14. International Data Processing' },
  { id: 'security-incidents', label: '15. Security Incidents' },
  { id: 'changes-to-policy', label: '16. Changes to This Policy' },
  { id: 'contact', label: '17. Contact' },
];

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <div className="mb-10 flex flex-wrap gap-x-4 gap-y-1 text-xs text-warm-muted">
          <span>Effective Date: September 5, 2026</span>
          <span>Last Updated: September 22, 2026</span>
        </div>

        <div className="docs-prose">
          {/* Table of Contents */}
          <nav className="mb-10 rounded-xl border border-warm-card-border bg-warm-card/40 p-5">
            <p className="mb-3 text-sm font-medium text-warm-cream">Table of Contents</p>
            <ol className="!m-0 !mb-0 list-decimal !space-y-1.5 !pl-5">
              {toc.map((item) => (
                <li key={item.id} className="!p-0">
                  <a
                    href={`#${item.id}`}
                    className="text-warm-muted no-underline hover:text-warm-accent hover:underline"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          {/* ─── 1. Introduction ─── */}
          <section id="introduction">
            <h2>1. Introduction</h2>
            <p>
              MCS-App is a school management and communication platform that provides tools for
              managing student enrollment, attendance, academic records, fees and payments, staff
              payroll, chat and messaging, file sharing, and related educational and administrative
              functions. The platform is available through a web application and a mobile application
              for iOS and Android.
            </p>
            <p>
              This Privacy Policy applies to all users of the platform, including school
              administrators and management staff, teachers, students, and other authorized personnel.
              By accessing or using the platform, you acknowledge that you have read and understood
              this Privacy Policy.
            </p>
            <p>
              This Privacy Policy describes how we collect, use, store, protect, and share personal
              and educational information. It should be read alongside our{' '}
              <Link href="/terms" className="text-warm-accent underline-offset-2 hover:underline">
                Terms of Use
              </Link>
              , which govern your use of the platform.
            </p>
            <p>
              The platform is operated by [LEGAL ENTITY NAME]. References to &quot;we&quot;,
              &quot;us&quot;, or &quot;our&quot; in this policy refer to the entity responsible for
              processing your information.
            </p>
          </section>

          <hr />

          {/* ─── 2. Information We Collect ─── */}
          <section id="information-we-collect">
            <h2>2. Information We Collect</h2>
            <p>
              We collect different categories of information depending on your role and how you use
              the platform. The sections below describe each category.
            </p>

            <h3>2.1 Account and Identity Information</h3>
            <p>When an account is created for you or when you register, we collect:</p>
            <ul>
              <li>Full name</li>
              <li>Username and email address (where provided)</li>
              <li>Phone number (where provided)</li>
              <li>Gender and date of birth (where provided)</li>
              <li>Physical address (where provided)</li>
              <li>Role (administrator, management, teacher, student, staff member)</li>
              <li>Branch or school association</li>
              <li>Profile photo (if uploaded)</li>
              <li>Login credentials (passwords are stored in hashed form using bcrypt; plain-text
                passwords are never stored)</li>
              <li>Account status (active, inactive, suspended)</li>
              <li>Login timestamps and last-seen activity</li>
            </ul>
            <p>
              Account creation is managed by authorized school administrators. You are responsible
              for ensuring that the information associated with your account is accurate and current.
            </p>

            <h3>2.2 Student Information</h3>
            <p>
              Student information is entered and managed by authorized school personnel as part of
              school administration. This may include:
            </p>
            <ul>
              <li>Student name, admission number, and enrollment records</li>
              <li>Class or group assignment and academic year placement</li>
              <li>Date of birth, gender, religion, nationality, blood group</li>
              <li>National identity number (B-Form / CNIC)</li>
              <li>Contact information (phone, email, WhatsApp)</li>
              <li>Home address, city, postal code, country</li>
              <li>Previous school and transfer certificate details</li>
              <li>Family association and parent/guardian linkage</li>
              <li>Emergency contacts and their phone numbers</li>
              <li>Health records (blood group, chronic conditions, allergies, disability,
                medical notes, doctor name and phone)</li>
              <li>Attendance records (daily status: present, absent, late, leave, holiday, function)</li>
              <li>Academic results, marks, examination records, and report cards</li>
              <li>Fee records, payment history, receipts, and concessions</li>
              <li>Profile photo and uploaded documents</li>
              <li>Class movements and transfer records</li>
              <li>Credential lifecycle tracking (generation, delivery, first login)</li>
            </ul>
            <p>
              Students have individual accounts on the platform. There is no separate parent portal
              or account switcher; each student logs in independently to view their own permitted
              information.
            </p>

            <h3>2.3 Teacher and Staff Information</h3>
            <p>
              Information about teachers, staff, and management profiles is collected as part of
              employment and branch membership:
            </p>
            <ul>
              <li>Employee ID, job title or work role, department</li>
              <li>Educational qualifications, specialization, work experience</li>
              <li>Joining date and employment history</li>
              <li>Salary information (where applicable)</li>
              <li>Phone number, emergency contact, home address</li>
              <li>Date of birth, gender, blood group, father&apos;s name, national ID number</li>
              <li>Medical information (severe disease, if provided)</li>
              <li>Portal access level and module permissions</li>
              <li>Branch membership and role assignment</li>
              <li>Attendance records</li>
              <li>Payroll records and salary payment history</li>
              <li>Profile photo and uploaded documents</li>
            </ul>

            <h3>2.4 Financial and Payment Information</h3>
            <p>
              The platform records financial information related to school fees and payments. We do
              not store raw credit card numbers, bank account details, or payment credentials. Financial
              data includes:
            </p>
            <ul>
              <li>Fee structures, categories, and amounts</li>
              <li>Student fee records (monthly, term, annual, one-time)</li>
              <li>Payment amounts, dates, and methods (cash, cheque, bank transfer)</li>
              <li>Receipt numbers and reference identifiers (cheque numbers, transaction IDs)</li>
              <li>Payment allocation records and balance history</li>
              <li>Concessions, late fees, and extra charges</li>
              <li>Family payment records and multi-student allocation</li>
              <li>Outgoing payment vouchers (payroll, utilities)</li>
              <li>Payroll records including salary amounts and attendance-derived pay</li>
              <li>Financial audit logs (creation, reversal, reprint, download events)</li>
            </ul>
            <p>
              Payment processing for school fees is handled through approved school channels. The
              platform records payment information but is not itself a payment processor and does not
              handle credit card or bank transactions directly.
            </p>

            <h3>2.5 Academic Information</h3>
            <ul>
              <li>Subjects, classes, and group assignments</li>
              <li>Examination sessions, types, and schedules</li>
              <li>Marks entries (per student, per subject, per exam)</li>
              <li>Grade scales and grade bands</li>
              <li>Subject results and overall percentages</li>
              <li>Report cards (draft and published status)</li>
              <li>Class ranks and academic performance data</li>
            </ul>

            <h3>2.6 Attendance Information</h3>
            <ul>
              <li>Student daily attendance (present, absent, late, leave, holiday, function)</li>
              <li>Teacher attendance records</li>
              <li>Staff attendance records</li>
              <li>Date, time, and note associated with each attendance entry</li>
              <li>Who marked the attendance</li>
            </ul>

            <h3>2.7 Communication Information</h3>
            <p>
              The platform provides chat and messaging features. Information collected in connection
              with communications includes:
            </p>
            <ul>
              <li>Chat messages (text content, images, videos, audio, voice notes, documents)</li>
              <li>Announcements and school-wide notices</li>
              <li>Direct messages between authorized users</li>
              <li>Group and class communications</li>
              <li>System-generated messages (attendance alerts, payment notifications, result
                notifications)</li>
              <li>Message metadata (sender, recipient, room, timestamp, type)</li>
              <li>Attachment file records and media metadata</li>
              <li>Read receipts and message delivery status</li>
            </ul>

            <h3>2.8 Uploaded Files and Media</h3>
            <p>
              Users may upload files through the platform, including profile photos, chat
              attachments, documents, receipts, voice notes, and videos. For each uploaded file, we
              store:
            </p>
            <ul>
              <li>Original filename and file type (MIME type)</li>
              <li>File size and dimensions (for images)</li>
              <li>Storage location and access path</li>
              <li>Upload status and processing status</li>
              <li>Entity association (which student, teacher, or chat message the file is linked to)</li>
              <li>Upload session data (for resumable uploads: byte offset, checksum, state)</li>
            </ul>
            <p>
              Uploaded files are stored in cloud object storage (Cloudflare R2) or local filesystem
              depending on the deployment configuration. Files are subject to security validation
              before storage. Dangerous file types are blocked or reclassified to prevent security
              risks.
            </p>

            <h3>2.9 Device and Technical Information</h3>
            <p>We collect limited technical information necessary to operate the platform:</p>
            <ul>
              <li>Device type, operating system, and application version (mobile app)</li>
              <li>IP address and access timestamps (for authentication and security logging)</li>
              <li>Push notification device tokens (for mobile notifications)</li>
              <li>Session and authentication tokens</li>
              <li>Error logs and diagnostic information (for debugging and reliability)</li>
            </ul>
            <p>
              We do not use third-party analytics services such as Google Analytics, Mixpanel, or
              similar tracking tools. We do not place tracking cookies or use behavioral analytics.
            </p>

            <h3>2.10 Local and Offline Data (Mobile App)</h3>
            <p>
              The mobile application may temporarily store certain information locally on your device
              to support offline functionality. This includes:
            </p>
            <ul>
              <li>Cached dashboard and bootstrap data (expires after 24 hours)</li>
              <li>Recently viewed chat messages (up to 200 per room, retained for 30 days)</li>
              <li>Pending outgoing messages (queued for sending when connectivity is restored)</li>
              <li>Upload tasks in progress (for resumable uploads)</li>
              <li>Active branch and academic year selection</li>
            </ul>
            <p>
              Local cached data is associated with your user account. When you log out, all
              user-specific local data is cleared. If the application is closed unexpectedly, cached
              data may remain temporarily until the next login or cache expiry. You should protect
              access to your device to prevent unauthorized viewing of locally stored information.
            </p>
          </section>

          <hr />

          {/* ─── 3. How We Use Information ─── */}
          <section id="how-we-use-information">
            <h2>3. How We Use Information</h2>
            <p>We use the information we collect for the following purposes:</p>
            <ul>
              <li><strong>Providing the platform:</strong> Operating, maintaining, and delivering the
                features and functionality of the platform</li>
              <li><strong>Authentication and access:</strong> Verifying your identity, managing your
                account, and controlling access based on your role and permissions</li>
              <li><strong>School administration:</strong> Managing student enrollment, class assignments,
                attendance tracking, academic records, and staff management</li>
              <li><strong>Financial management:</strong> Recording fee structures, processing payments,
                generating receipts, and maintaining financial records</li>
              <li><strong>Communication:</strong> Facilitating chat messaging, announcements, and
                direct messages between authorized users</li>
              <li><strong>Notifications:</strong> Sending attendance alerts, payment notifications,
                result notifications, payroll alerts, and school announcements</li>
              <li><strong>File management:</strong> Storing, processing, and delivering uploaded files
                and media to authorized recipients</li>
              <li><strong>Offline functionality:</strong> Caching data locally on mobile devices to
                support use when internet connectivity is unavailable</li>
              <li><strong>Security and fraud prevention:</strong> Detecting unauthorized access,
                preventing misuse, and maintaining audit trails</li>
              <li><strong>Debugging and reliability:</strong> Investigating errors, improving
                performance, and ensuring system stability</li>
              <li><strong>Backup and recovery:</strong> Maintaining database backups for disaster
                recovery and data integrity</li>
              <li><strong>Legal compliance:</strong> Meeting regulatory, record-keeping, and reporting
                obligations as required by applicable law</li>
            </ul>
          </section>

          <hr />

          {/* ─── 4. Legal Basis ─── */}
          <section id="legal-basis">
            <h2>4. Legal Basis for Processing</h2>
            <p>
              We process your information on the following bases, depending on the context:
            </p>
            <ul>
              <li><strong>Service provision:</strong> Processing necessary to provide the platform
                and fulfill our obligations to the school organization</li>
              <li><strong>Legitimate interests:</strong> Processing necessary for legitimate
                operational and security purposes, including fraud prevention and system integrity</li>
              <li><strong>Legal obligations:</strong> Processing required to comply with applicable
                laws, regulations, and record-keeping requirements</li>
              <li><strong>Consent:</strong> Where you have given specific consent for a particular
                processing activity</li>
            </ul>
            <p>
              If you have questions about the legal basis for processing your information, please
              contact us using the details provided in Section 17.
            </p>
          </section>

          <hr />

          {/* ─── 5. How Information Is Shared ─── */}
          <section id="how-information-is-shared">
            <h2>5. How Information Is Shared</h2>
            <p>
              We do not sell, rent, or trade personal information. Information may be shared in the
              following circumstances:
            </p>

            <h3>School and Organization Administrators</h3>
            <p>
              Authorized school personnel may access information necessary for their
              responsibilities. Branch administrators and management staff can view and manage
              records within their branch according to their assigned permissions.
            </p>

            <h3>Teachers and Academic Staff</h3>
            <p>
              Teachers may access information appropriate to their assigned classes, groups, and
              subjects, including student attendance, academic results, and communication channels.
            </p>

            <h3>Students</h3>
            <p>
              Students can access their own permitted information, including their academic records,
              attendance, fee status, and results, through their individual accounts.
            </p>

            <h3>Service Providers</h3>
            <p>
              We share information with third-party service providers who assist in operating the
              platform. These providers process data on our behalf under contractual obligations.
              Current service providers include:
            </p>
            <ul>
              <li>Cloudflare R2 &mdash; cloud object storage for files and database backups</li>
              <li>Firebase (Google) &mdash; push notification delivery via Firebase Cloud Messaging</li>
              <li>Upstash &mdash; Redis-based rate limiting and session management</li>
              <li>Resend &mdash; transactional email delivery</li>
              <li>Twilio &mdash; SMS and WhatsApp messaging</li>
              <li>Sentry &mdash; error monitoring and diagnostics</li>
            </ul>

            <h3>Legal Requirements</h3>
            <p>
              We may disclose information when required by applicable law, court order, lawful
              government request, or to protect the rights, safety, or property of the platform,
              its users, or the public.
            </p>
          </section>

          <hr />

          {/* ─── 6. Third-Party Services ─── */}
          <section id="third-party-services">
            <h2>6. Third-Party Services</h2>
            <p>
              The platform integrates with third-party services that may independently collect or
              process information. We encourage you to review each provider&apos;s own privacy
              policy for details on their data practices.
            </p>
            <table>
              <thead>
                <tr>
                  <th>Provider</th>
                  <th>Purpose</th>
                  <th>Information Involved</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Cloudflare</td>
                  <td>Cloud object storage (files, backups)</td>
                  <td>Uploaded files, database backup files</td>
                </tr>
                <tr>
                  <td>Google Firebase</td>
                  <td>Push notification delivery (FCM)</td>
                  <td>Device tokens, notification content (encrypted)</td>
                </tr>
                <tr>
                  <td>Upstash</td>
                  <td>Redis rate limiting, JWT blacklist</td>
                  <td>Rate limit counters, token identifiers</td>
                </tr>
                <tr>
                  <td>Resend</td>
                  <td>Transactional email (admin invitations)</td>
                  <td>Email address, invitation content</td>
                </tr>
                <tr>
                  <td>Twilio</td>
                  <td>SMS and WhatsApp messaging</td>
                  <td>Phone numbers, message content</td>
                </tr>
                <tr>
                  <td>Sentry</td>
                  <td>Error monitoring (optional)</td>
                  <td>Server-side error reports, HTTP metadata</td>
                </tr>
              </tbody>
            </table>
          </section>

          <hr />

          {/* ─── 7. Notifications ─── */}
          <section id="notifications">
            <h2>7. Notifications</h2>
            <p>
              The platform may send you notifications related to your activity on the platform.
              These include:
            </p>
            <ul>
              <li><strong>Attendance notifications:</strong> Alerts when a student&apos;s attendance
                status is recorded (absent, late, leave)</li>
              <li><strong>Payment notifications:</strong> Alerts when fees are recorded, partially
                paid, or when payments are processed</li>
              <li><strong>Result notifications:</strong> Alerts when marks are entered or report
                cards are published</li>
              <li><strong>Teacher attendance and payroll notifications:</strong> Alerts related to
                teacher attendance and salary payments</li>
              <li><strong>Chat messages:</strong> New messages in chat rooms and direct messages</li>
              <li><strong>Announcements:</strong> School-wide or class-specific notices</li>
            </ul>
            <p>
              Notifications may be delivered through the platform&apos;s internal notification
              system, push notifications on mobile devices, or both. Push notification content may
              contain limited information necessary to identify the event. You can disable push
              notifications through your device settings, though this may limit your ability to
              receive timely updates.
            </p>
          </section>

          <hr />

          {/* ─── 8. Cookies and Storage ─── */}
          <section id="cookies-and-storage">
            <h2>8. Cookies and Similar Technologies</h2>
            <p>The web application uses the following storage technologies:</p>

            <h3>Essential Cookies</h3>
            <ul>
              <li><strong>Session cookie (<code>token</code>):</strong> An httpOnly cookie used to
                maintain your authenticated session. This cookie is essential for the platform to
                function and is set when you log in. It expires after 7 days. In production, this
                cookie is marked as Secure (HTTPS only).</li>
            </ul>

            <h3>Local Storage</h3>
            <ul>
              <li><strong>JWT token:</strong> A fallback copy of your session token</li>
              <li><strong>Active branch and academic year:</strong> Your current branch and year
                selection for the session</li>
            </ul>

            <h3>Session Storage</h3>
            <ul>
              <li><strong>Pending payment forms:</strong> Temporary in-progress payment form data
                that is cleared when the form is submitted or closed</li>
            </ul>
            <p>
              We do not use tracking cookies, analytics cookies, advertising cookies, or any
              third-party cookies. We do not use Google Analytics, Google Tag Manager, or similar
              tracking services on the web application.
            </p>
          </section>

          <hr />

          {/* ─── 9. Data Security ─── */}
          <section id="data-security">
            <h2>9. Data Security</h2>
            <p>
              We implement reasonable technical and organizational safeguards designed to protect
              your information. These measures include:
            </p>
            <ul>
              <li><strong>Password hashing:</strong> Passwords are hashed using bcrypt with 12 salt
                rounds; plain-text passwords are never stored</li>
              <li><strong>Encryption in transit:</strong> All communication between clients and the
                server is encrypted using TLS/HTTPS</li>
              <li><strong>Secure session storage:</strong> JWT tokens are stored in httpOnly cookies
                on the web and in hardware-backed secure storage on mobile devices</li>
              <li><strong>Role-based access control:</strong> Access to data and functionality is
                limited based on user role, branch membership, and module permissions</li>
              <li><strong>Branch isolation:</strong> Data is scoped by branch to prevent cross-tenant
                access</li>
              <li><strong>Upload validation:</strong> Uploaded files are validated for type, size,
                and security before storage</li>
              <li><strong>Encrypted push payloads:</strong> Push notification payloads are encrypted
                using AES-256-GCM with per-user cryptographic keys</li>
              <li><strong>Audit logging:</strong> Sensitive operations including data changes,
                payment events, and access events are logged for audit purposes</li>
              <li><strong>Rate limiting:</strong> API endpoints are protected by rate limiting to
                prevent abuse</li>
              <li><strong>Private object storage:</strong> Files are stored in private cloud storage
                with access controlled through signed URLs or direct service access</li>
              <li><strong>Account lockout:</strong> Accounts are temporarily locked after multiple
                failed login attempts</li>
            </ul>
            <p>
              While we strive to protect your information, no method of transmission over the
              Internet or method of electronic storage is completely secure. We cannot guarantee
              absolute security.
            </p>
          </section>

          <hr />

          {/* ─── 10. Data Retention ─── */}
          <section id="data-retention">
            <h2>10. Data Retention</h2>
            <p>
              We retain your information for as long as necessary to provide the platform and
              fulfill the purposes described in this policy. Specific retention practices include:
            </p>
            <ul>
              <li><strong>Student academic records:</strong> Retained for the duration required by
                educational regulations and the school&apos;s record-keeping policy, which may extend
                beyond the student&apos;s enrollment period</li>
              <li><strong>Financial records:</strong> Retained as required for accounting, audit, and
                legal compliance obligations</li>
              <li><strong>Chat messages:</strong> Retained while the associated chat room and user
                account are active; message read states and metadata are retained for operational
                purposes</li>
              <li><strong>Attendance records:</strong> Retained as part of academic and staff
                administration records</li>
              <li><strong>Uploaded files:</strong> Retained as long as the associated records
                (student profiles, chat messages, receipts) are retained</li>
              <li><strong>Database backups:</strong> Backups are retained for a limited period for
                disaster recovery purposes; backup data may persist after primary data changes</li>
              <li><strong>Audit logs:</strong> Retained for security and compliance purposes for
                a period consistent with operational needs</li>
              <li><strong>Account information:</strong> Retained while the account is active and for
                a reasonable period after account deactivation to support reactivation requests and
                audit requirements</li>
            </ul>
            <p>
              Exact retention schedules are subject to the school organization&apos;s policies and
              applicable legal requirements.
            </p>
          </section>

          <hr />

          {/* ─── 11. Data Deletion ─── */}
          <section id="data-deletion">
            <h2>11. Data Deletion</h2>
            <p>
              You may request deletion of your personal information by contacting the school
              administration. Please note:
            </p>
            <ul>
              <li>Account deletion requests are processed by school administrators</li>
              <li>Student academic and financial records may be subject to legal or regulatory
                retention requirements that prevent immediate deletion</li>
              <li>Records that are part of a school&apos;s official academic or financial
                documentation may be retained in accordance with applicable laws and the
                school&apos;s record-keeping policy</li>
              <li>Database backups may retain information for a limited period after primary data
                changes; backup data is subject to the backup retention cycle</li>
              <li>Audit logs may be retained for security and compliance purposes</li>
              <li>Uploaded files linked to retained records may also be retained</li>
            </ul>
            <p>
              We do not promise immediate permanent deletion of all data, as certain records may
              be subject to legitimate retention requirements.
            </p>
          </section>

          <hr />

          {/* ─── 12. User Rights ─── */}
          <section id="user-rights">
            <h2>12. User Rights and Choices</h2>
            <p>
              Depending on applicable law, you may have the following rights regarding your personal
              information:
            </p>
            <ul>
              <li><strong>Access:</strong> Request a copy of the personal information we hold about
                you</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete
                information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information, subject
                to applicable retention requirements</li>
              <li><strong>Restriction:</strong> Request restriction of processing in certain
                circumstances</li>
              <li><strong>Objection:</strong> Object to processing of your information for specific
                purposes</li>
              <li><strong>Withdrawal of consent:</strong> Where processing is based on consent, you
                may withdraw consent at any time</li>
              <li><strong>Notification preferences:</strong> Manage your notification preferences
                through your device settings</li>
            </ul>
            <p>
              To exercise any of these rights, please contact the school administration through the
              platform or through the contact details provided in Section 17. We will respond to
              requests in accordance with applicable law.
            </p>
          </section>

          <hr />

          {/* ─── 13. Children's Information ─── */}
          <section id="childrens-information">
            <h2>13. Children&apos;s and Student Information</h2>
            <div className="my-6 rounded-xl border border-warm-accent/30 bg-warm-accent/5 p-4">
              <p className="mb-2 flex items-center gap-2 text-sm font-medium text-warm-cream">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-warm-accent">
                  <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
                </svg>
                Student and Minor Information
              </p>
              <p className="text-sm leading-relaxed text-warm-muted">
                This platform is used in an educational context that may involve the processing of
                information about students who are minors. The information described in this policy
                is collected and processed as part of school administration.
              </p>
            </div>
            <ul>
              <li>The platform may process personal information about students, including minors,
                as part of school enrollment and administration</li>
              <li>Student accounts may be created by authorized school administrators as part of the
                enrollment process</li>
              <li>Student information is accessed and processed by authorized school administrators
                and teachers as part of their educational and administrative responsibilities</li>
              <li>Student access to the platform is controlled according to the platform&apos;s
                role and permission system</li>
              <li>The platform is not designed to collect personal information from children beyond
                what is necessary for school administration</li>
            </ul>
            <p>
              Parents or guardians may review their child&apos;s information by contacting the school
              administration through the platform.
            </p>
          </section>

          <hr />

          {/* ─── 14. International Processing ─── */}
          <section id="international-processing">
            <h2>14. International Data Processing</h2>
            <p>
              Your information may be processed in countries other than your own, as the third-party
              services we use (cloud hosting, push notifications, email, messaging) may operate
              data centers in various locations. These transfers are subject to the terms and
              security practices of the respective service providers.
            </p>
            <p>
              We do not make representations regarding the data protection laws of specific
              jurisdictions. You should be aware that data protection laws may vary depending on
              where your information is processed.
            </p>
          </section>

          <hr />

          {/* ─── 15. Security Incidents ─── */}
          <section id="security-incidents">
            <h2>15. Security Incidents</h2>
            <p>
              In the event of a security incident that affects your personal information, we will:
            </p>
            <ul>
              <li>Investigate the incident promptly</li>
              <li>Take appropriate steps to contain and remediate the issue</li>
              <li>Notify affected users and relevant authorities where required by applicable law</li>
            </ul>
            <p>
              We are committed to addressing security incidents responsibly and in accordance with
              applicable legal requirements.
            </p>
          </section>

          <hr />

          {/* ─── 16. Changes ─── */}
          <section id="changes-to-policy">
            <h2>16. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. When we make material changes,
              we will update the &quot;Last Updated&quot; date at the top of this page and, where
              appropriate, communicate the changes through the platform. Your continued use of the
              platform after the effective date of any updated policy constitutes your acknowledgment
              of the changes.
            </p>
          </section>

          <hr />

          {/* ─── 17. Contact ─── */}
          <section id="contact">
            <h2>17. Contact</h2>
            <p>
              For privacy-related inquiries, data requests, or complaints, please contact:
            </p>
            <div className="my-4 rounded-xl border border-warm-card-border bg-warm-card/40 p-4">
              <p className="text-sm text-warm-muted">
                [LEGAL ENTITY NAME]<br />
                [REGISTERED ADDRESS]<br />
                [PRIVACY CONTACT EMAIL]
              </p>
            </div>
            <p>
              You may also contact the school administration through the platform&apos;s built-in
              communication features.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
