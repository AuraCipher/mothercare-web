import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Use | MCS-App',
  description:
    'Terms and conditions governing access to and use of MCS-App, the school management and communication platform.',
};

const toc = [
  { id: 'acceptance', label: '1. Acceptance of Terms' },
  { id: 'description', label: '2. Description of the Service' },
  { id: 'eligibility', label: '3. Eligibility and Authority' },
  { id: 'accounts', label: '4. Accounts and Credentials' },
  { id: 'roles', label: '5. Roles and Permissions' },
  { id: 'school-responsibilities', label: '6. School and Organization Responsibilities' },
  { id: 'acceptable-use', label: '7. Acceptable Use' },
  { id: 'chat-rules', label: '8. Chat and Communication Rules' },
  { id: 'files-media', label: '9. Uploaded Files and Media' },
  { id: 'financial', label: '10. Financial Information and Payments' },
  { id: 'academic', label: '11. Academic and Attendance Records' },
  { id: 'ip', label: '12. Intellectual Property' },
  { id: 'user-content', label: '13. User Content License' },
  { id: 'third-party', label: '14. Third-Party Services' },
  { id: 'availability', label: '15. Service Availability and Changes' },
  { id: 'security', label: '16. Security and Abuse' },
  { id: 'termination', label: '17. Suspension and Termination' },
  { id: 'disclaimers', label: '18. Disclaimers' },
  { id: 'liability', label: '19. Limitation of Liability' },
  { id: 'indemnification', label: '20. Indemnification' },
  { id: 'governing-law', label: '21. Governing Law and Disputes' },
  { id: 'changes', label: '22. Changes to Terms' },
  { id: 'contact', label: '23. Contact' },
];

export default function TermsPage() {
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
          Terms of Use
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

          {/* ─── 1. Acceptance ─── */}
          <section id="acceptance">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using the MCS-App platform, including the web application, mobile
              application, and related services (collectively, the &quot;Service&quot;), you agree
              to be bound by these Terms of Use. If you do not agree to these terms, you must not
              access or use the Service.
            </p>
            <p>
              These Terms of Use form a legally binding agreement between you and [LEGAL ENTITY
              NAME]. Your use of the Service is also governed by our{' '}
              <Link href="/privacy" className="text-warm-accent underline-offset-2 hover:underline">
                Privacy Policy
              </Link>
              , which is incorporated into these terms by reference.
            </p>
            <p>
              The Service is provided exclusively for the use of authorized educational institutions
              and their members. By using the Service, you represent that you have the authority to
              enter into these terms on behalf of yourself or the organization you represent.
            </p>
          </section>

          <hr />

          {/* ─── 2. Description ─── */}
          <section id="description">
            <h2>2. Description of the Service</h2>
            <p>
              MCS-App is a school management and communication platform that provides tools for:
            </p>
            <ul>
              <li><strong>School and branch management:</strong> Multi-branch administration,
                academic year management, and organizational configuration</li>
              <li><strong>Student management:</strong> Student enrollment, profiles, class
                assignments, attendance tracking, and academic records</li>
              <li><strong>Teacher and staff management:</strong> Staff profiles, assignments,
                attendance, payroll, and module-based permissions</li>
              <li><strong>Academic administration:</strong> Exam management, marks entry, grade
                computation, report card generation, and student promotion</li>
              <li><strong>Fee management:</strong> Fee structures, automated fee generation, payment
                tracking, receipts, and family billing</li>
              <li><strong>Attendance:</strong> Student, teacher, and staff attendance recording and
                reporting</li>
              <li><strong>Chat and messaging:</strong> Real-time group chat, direct messages,
                announcements, and system notifications</li>
              <li><strong>File and media sharing:</strong> Upload, storage, and sharing of documents,
                images, audio, and video</li>
              <li><strong>Canteen and stationery:</strong> Product management, sales tracking, and
                student account billing</li>
              <li><strong>Notifications:</strong> Push notifications, attendance alerts, payment
                reminders, and school announcements</li>
              <li><strong>Mobile access:</strong> Offline-capable mobile application for teachers
                and students</li>
            </ul>
            <p>
              The specific features and functionality available to you depend on your role,
              permissions, and the configuration of your school&apos;s instance.
            </p>
          </section>

          <hr />

          {/* ─── 3. Eligibility ─── */}
          <section id="eligibility">
            <h2>3. Eligibility and Authority</h2>
            <p>The Service is available to:</p>
            <ul>
              <li>School administrators and management staff authorized by the school
                organization</li>
              <li>Teachers and academic staff with active branch membership</li>
              <li>Students enrolled at the school with active accounts</li>
              <li>Other staff members (canteen, workers) with assigned roles</li>
            </ul>
            <p>
              Accounts are created by authorized school administrators. You may not create an account
              without authorization. When using the Service, you must:
            </p>
            <ul>
              <li>Provide accurate and complete information when your account is created</li>
              <li>Maintain the confidentiality of your account credentials</li>
              <li>Have the legal capacity or authority to agree to these terms</li>
              <li>Use the Service only within the scope of your authorized role</li>
            </ul>
          </section>

          <hr />

          {/* ─── 4. Accounts ─── */}
          <section id="accounts">
            <h2>4. Accounts and Credentials</h2>
            <p>You are responsible for maintaining the security of your account. You must:</p>
            <ul>
              <li>Keep your password secure and do not share it with anyone</li>
              <li>Not use another user&apos;s account or credentials</li>
              <li>Notify the school administration immediately if you suspect unauthorized access
                to your account</li>
              <li>Ensure that you log out or secure your device when leaving it unattended</li>
            </ul>
            <div className="my-6 rounded-xl border border-warm-accent/30 bg-warm-accent/5 p-4">
              <p className="mb-2 flex items-center gap-2 text-sm font-medium text-warm-cream">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-warm-accent">
                  <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
                </svg>
                Individual Student Accounts
              </p>
              <p className="text-sm leading-relaxed text-warm-muted">
                Each student has an individual account on the platform. Students log in
                independently to view their own academic records, attendance, fee status, and
                results. There is no separate parent account or account switcher in the intended
                product flow.
              </p>
            </div>
            <p>
              The school administration may suspend or deactivate your account at any time for
              security reasons, violation of these terms, or upon your separation from the school
              organization.
            </p>
          </section>

          <hr />

          {/* ─── 5. Roles ─── */}
          <section id="roles">
            <h2>5. Roles and Permissions</h2>
            <p>
              Your access to features and data on the Service is determined by your assigned role,
              branch membership, and permissions. These include:
            </p>
            <ul>
              <li><strong>Global roles:</strong> super_admin, management, teacher, student, parent</li>
              <li><strong>Branch roles:</strong> branch_admin, sub_admin, management, teacher,
                parent, canteen_staff, worker</li>
              <li><strong>Module permissions:</strong> Fine-grained access to specific modules
                (Students, Fees, Attendance, Results, Expenses, etc.) with create, read, update,
                and delete controls</li>
            </ul>
            <p>
              You must not attempt to access data or functionality outside your assigned permissions.
              If you believe your permissions are incorrect, contact the school administration.
            </p>
          </section>

          <hr />

          {/* ─── 6. School Responsibilities ─── */}
          <section id="school-responsibilities">
            <h2>6. School and Organization Responsibilities</h2>
            <div className="my-6 rounded-xl border border-warm-accent/30 bg-warm-accent/5 p-4">
              <p className="mb-2 flex items-center gap-2 text-sm font-medium text-warm-cream">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-warm-accent">
                  <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
                </svg>
                Data Controller Responsibility
              </p>
              <p className="text-sm leading-relaxed text-warm-muted">
                MCS-App is the software platform. The school organization that uses the Service is
                primarily responsible for the data entered into it and how that data is used.
              </p>
            </div>
            <p>Schools and organizations using the Service are responsible for:</p>
            <ul>
              <li>Providing accurate student, teacher, and staff information</li>
              <li>Assigning appropriate permissions and access levels to their members</li>
              <li>Managing account creation, suspension, and deactivation</li>
              <li>Protecting login credentials and preventing unauthorized access</li>
              <li>Ensuring that the collection and use of student information complies with
                applicable laws and parental consent requirements</li>
              <li>Deciding who has access to educational, financial, and communication information</li>
              <li>Correcting inaccurate records and responding to data access requests</li>
              <li>Establishing and enforcing their own communication and acceptable use policies</li>
            </ul>
          </section>

          <hr />

          {/* ─── 7. Acceptable Use ─── */}
          <section id="acceptable-use">
            <h2>7. Acceptable Use</h2>
            <p>
              You agree to use the Service only for its intended educational and administrative
              purposes. You must not:
            </p>
            <ul>
              <li><strong>Unauthorized access:</strong> Attempt to access accounts, data, or
                systems without authorization</li>
              <li><strong>Credential sharing:</strong> Share your login credentials with others or
                use another person&apos;s credentials</li>
              <li><strong>Impersonation:</strong> Impersonate another user, staff member, or
                administrator</li>
              <li><strong>Permission bypass:</strong> Attempt to bypass or circumvent role-based
                access controls or branch isolation</li>
              <li><strong>Cross-branch access:</strong> Attempt to access data from branches you
                are not authorized to access</li>
              <li><strong>Malicious uploads:</strong> Upload files containing malware, viruses,
                worms, or other harmful code</li>
              <li><strong>Dangerous file manipulation:</strong> Attempt to upload or distribute
                files with dangerous MIME types or deceptive file extensions</li>
              <li><strong>Abusive content:</strong> Send messages or upload content that is
                harassing, threatening, abusive, defamatory, or hateful</li>
              <li><strong>Unlawful content:</strong> Upload or share content that violates
                applicable law or regulations</li>
              <li><strong>Spam:</strong> Send unsolicited or excessive messages, advertisements, or
                repetitive content</li>
              <li><strong>Service disruption:</strong> Interfere with or disrupt the Service,
                servers, or networks connected to the Service</li>
              <li><strong>Reverse engineering:</strong> Reverse engineer, decompile, or attempt to
                extract the source code of the Service, except where prohibited by applicable law</li>
              <li><strong>Automated abuse:</strong> Use automated scripts, bots, or tools to access
                or interact with the Service in an unauthorized manner</li>
              <li><strong>Scraping:</strong> Scrape, crawl, or use automated means to extract data
                from the Service without authorization</li>
              <li><strong>Infrastructure attacks:</strong> Attack, probe, or scan the
                Service&apos;s infrastructure, including denial-of-service attacks</li>
              <li><strong>Unauthorized uploads:</strong> Upload content without having the
                necessary rights or permissions to do so</li>
            </ul>
          </section>

          <hr />

          {/* ─── 8. Chat Rules ─── */}
          <section id="chat-rules">
            <h2>8. Chat and Communication Rules</h2>
            <p>
              The Service includes chat rooms, direct messages, and announcement features. When
              using these features:
            </p>
            <ul>
              <li>You are responsible for the content you send. Messages may be visible to other
                users in the same chat room or to administrators</li>
              <li>School communication policies apply to all messages sent through the platform</li>
              <li>You must not share personal information about other users without their consent
                or authorization</li>
              <li>Harassment, bullying, threats, hate speech, and abusive language are prohibited</li>
              <li>School administrators may manage communication spaces, moderate content, and take
                action on messages that violate policies</li>
              <li>System-generated messages (attendance alerts, payment notifications) are created
                automatically by the platform based on recorded events</li>
              <li>We do not routinely monitor or review individual messages, but administrators
                may review communications as permitted by school policy</li>
            </ul>
          </section>

          <hr />

          {/* ─── 9. Files ─── */}
          <section id="files-media">
            <h2>9. Uploaded Files and Media</h2>
            <p>
              When you upload files through the Service, you must have the necessary rights or
              permissions to upload that content. You must not upload:
            </p>
            <ul>
              <li>Content that you do not have the right to share</li>
              <li>Malware, viruses, or other harmful code</li>
              <li>Content that violates applicable law or school policies</li>
              <li>Content that infringes on the intellectual property rights of others</li>
            </ul>
            <p>
              Uploaded files are subject to security validation, size limits, and type
              restrictions. Files that fail security checks may be rejected or reclassified to
              prevent security risks. The platform may restrict or remove uploaded files where
              necessary to protect the Service or its users.
            </p>
            <p>
              You remain responsible for the content you upload. The platform stores files to
              provide the Service functionality, but ownership of uploaded content remains with
              the uploader or their organization as applicable.
            </p>
          </section>

          <hr />

          {/* ─── 10. Financial ─── */}
          <section id="financial">
            <h2>10. Financial Information and Payments</h2>
            <p>
              The platform records and manages financial information related to school fees and
              payments. Important points:
            </p>
            <ul>
              <li>The platform records fee structures, student fee obligations, and payment
                history</li>
              <li>Student financial records are individually associated with each student</li>
              <li>Family is an administrative and payment grouping; family payments can allocate
                amounts across selected student obligations</li>
              <li>Receipts and payment records are generated by the platform for payment tracking
                and audit purposes</li>
              <li>Financial records may be subject to correction, reversal, or adjustment processes
                as managed by school administrators</li>
              <li>The platform does not store credit card numbers, bank account details, or payment
                credentials</li>
              <li>Payment processing for school fees is handled through approved school channels;
                the platform records payment information but is not itself a payment processor</li>
            </ul>
            <p>
              You must provide accurate financial information when recording payments or managing
              fee structures.
            </p>
          </section>

          <hr />

          {/* ─── 11. Academic ─── */}
          <section id="academic">
            <h2>11. Academic and Attendance Records</h2>
            <ul>
              <li>Academic records (marks, results, report cards) may be entered by authorized
                teachers and administrators</li>
              <li>Teachers and administrators are responsible for the accuracy of the records they
                enter</li>
              <li>Published results and report cards may be retained as part of official academic
                documentation</li>
              <li>Attendance records are entered by authorized staff and form part of the
                student&apos;s official record</li>
              <li>If you believe a record is inaccurate, you should report it through the
                appropriate school channels</li>
            </ul>
          </section>

          <hr />

          {/* ─── 12. IP ─── */}
          <section id="ip">
            <h2>12. Intellectual Property</h2>
            <p>
              The Service, including its software, design, interface, branding, logos, and
              documentation, is the intellectual property of [LEGAL ENTITY NAME] and is protected
              by applicable intellectual property laws.
            </p>
            <p>
              Content you or your organization upload to the Service (student records, documents,
              messages, images) remains owned by you or your organization. The platform requires a
              limited license to store, process, and display this content as necessary to provide
              the Service.
            </p>
            <p>
              Third-party content, services, and integrations are the property of their respective
              owners and are subject to their own terms.
            </p>
          </section>

          <hr />

          {/* ─── 13. User Content License ─── */}
          <section id="user-content">
            <h2>13. User Content License</h2>
            <p>
              By uploading content to the Service, you grant [LEGAL ENTITY NAME] a limited license
              to process that content solely as necessary to:
            </p>
            <ul>
              <li>Store the content in our systems</li>
              <li>Transmit the content to authorized recipients</li>
              <li>Display the content to authorized users within the platform</li>
              <li>Process the content for platform functionality (e.g., image resizing, media
                processing)</li>
              <li>Back up the content for disaster recovery</li>
              <li>Deliver notifications and attachments through the communication system</li>
            </ul>
            <p>
              This license is limited to what is necessary to provide the Service and does not
              grant us the right to sell, license, or commercially exploit your content.
            </p>
          </section>

          <hr />

          {/* ─── 14. Third-Party ─── */}
          <section id="third-party">
            <h2>14. Third-Party Services</h2>
            <p>
              Some functionality of the Service depends on third-party services, including cloud
              storage, push notification delivery, email, messaging, and infrastructure hosting.
              These third-party services are subject to their own terms of use and privacy
              policies.
            </p>
            <p>
              We are not responsible for the availability, accuracy, or practices of third-party
              services. Your use of third-party services through the platform is subject to those
              providers&apos; terms.
            </p>
          </section>

          <hr />

          {/* ─── 15. Availability ─── */}
          <section id="availability">
            <h2>15. Service Availability and Changes</h2>
            <p>
              We strive to keep the Service available and reliable, but we do not guarantee
              uninterrupted or error-free operation. The Service may occasionally be unavailable
              due to:
            </p>
            <ul>
              <li>Scheduled maintenance</li>
              <li>Unplanned outages or technical issues</li>
              <li>Updates, upgrades, or configuration changes</li>
              <li>Third-party service disruptions</li>
              <li>Force majeure events</li>
            </ul>
            <p>
              We may modify, update, or discontinue features of the Service at any time. We may
              also update integrations, and third-party services may become unavailable or change
              their terms. We will make reasonable efforts to communicate material changes.
            </p>
          </section>

          <hr />

          {/* ─── 16. Security ─── */}
          <section id="security">
            <h2>16. Security and Abuse</h2>
            <p>
              You must not attack, probe, or attempt to bypass the security of the Service. This
              includes:
            </p>
            <ul>
              <li>Attempting to access accounts or data without authorization</li>
              <li>Launching denial-of-service attacks or similar disruptions</li>
              <li>Scanning ports or probing for vulnerabilities</li>
              <li>Intercepting data not intended for you</li>
            </ul>
            <p>
              Suspicious activity may result in investigation, suspension, or termination of your
              account. The Service may restrict access or take other protective measures to safeguard
              users and infrastructure.
            </p>
          </section>

          <hr />

          {/* ─── 17. Termination ─── */}
          <section id="termination">
            <h2>17. Suspension and Termination</h2>
            <p>
              Your access to the Service may be suspended or terminated in the following
              circumstances:
            </p>
            <ul>
              <li>Violation of these Terms of Use</li>
              <li>Security risk to the Service or other users</li>
              <li>Unauthorized access or suspected fraud</li>
              <li>Abuse of the communication system or other users</li>
              <li>Unlawful use of the Service</li>
              <li>Request by the school organization or administrator</li>
              <li>Account deactivation by the school administration</li>
            </ul>
            <p>
              Upon termination, your right to access and use the Service ceases immediately.
              Certain data may be retained in accordance with the school&apos;s record-keeping
              policies, legal obligations, and the{' '}
              <Link href="/privacy" className="text-warm-accent underline-offset-2 hover:underline">
                Privacy Policy
              </Link>
              . We do not promise immediate deletion of all data upon account termination.
            </p>
          </section>

          <hr />

          {/* ─── 18. Disclaimers ─── */}
          <section id="disclaimers">
            <h2>18. Disclaimers</h2>
            <p>
              The Service is provided on an &quot;as is&quot; and &quot;as available&quot; basis.
              To the maximum extent permitted by applicable law:
            </p>
            <ul>
              <li>We make no warranties or representations regarding the accuracy, completeness,
                or reliability of data entered into the Service by users or school administrators</li>
              <li>We do not warrant that the Service will be uninterrupted, error-free, or secure,
                though we make reasonable efforts to maintain reliability</li>
              <li>Third-party services integrated with the platform are outside our direct control
                and may become unavailable or change their behavior</li>
              <li>The Service is a tool to assist school administration; it does not replace
                official school records, legal documents, or formal communication channels</li>
              <li>Users should verify important academic, financial, and administrative information
                through official school channels</li>
            </ul>
            <p>
              Nothing in these terms excludes or limits warranties that cannot be excluded or
              limited under applicable law.
            </p>
          </section>

          <hr />

          {/* ─── 19. Liability ─── */}
          <section id="liability">
            <h2>19. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, [LEGAL ENTITY NAME] shall not be
              liable for:
            </p>
            <ul>
              <li>Indirect, incidental, special, consequential, or punitive damages</li>
              <li>Loss of profits, data, business, or goodwill</li>
              <li>Damages resulting from unauthorized access to or alteration of your data</li>
              <li>Damages resulting from the acts or omissions of third-party service providers</li>
              <li>Damages resulting from errors, mistakes, or inaccuracies of content entered by
                users</li>
            </ul>
            <p>
              Our total liability for any claim arising from or related to the Service shall not
              exceed the amount paid by the school organization to us for the Service during the
              twelve (12) months preceding the claim.
            </p>
            <p>
              [GOVERNING LAW / JURISDICTION &mdash; LEGAL REVIEW REQUIRED]
            </p>
          </section>

          <hr />

          {/* ─── 20. Indemnification ─── */}
          <section id="indemnification">
            <h2>20. Indemnification</h2>
            <p>
              To the extent permitted by applicable law, you agree to indemnify and hold harmless
              [LEGAL ENTITY NAME] and its officers, directors, and employees from and against any
              claims, losses, damages, liabilities, and expenses (including legal fees) arising
              from:
            </p>
            <ul>
              <li>Your use of the Service in violation of these terms</li>
              <li>Your violation of applicable law or the rights of a third party</li>
              <li>Content you upload or transmit through the Service</li>
              <li>Your unauthorized access to or use of the Service</li>
            </ul>
          </section>

          <hr />

          {/* ─── 21. Governing Law ─── */}
          <section id="governing-law">
            <h2>21. Governing Law and Dispute Resolution</h2>
            <p>
              [GOVERNING LAW / JURISDICTION &mdash; LEGAL REVIEW REQUIRED]
            </p>
            <p>
              Any disputes arising from or relating to these terms or the use of the Service shall
              be resolved in accordance with the governing law and dispute resolution procedures
              determined by [LEGAL ENTITY NAME] and reviewed by qualified legal counsel.
            </p>
          </section>

          <hr />

          {/* ─── 22. Changes ─── */}
          <section id="changes">
            <h2>22. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms of Use at any time. When we make material
              changes, we will update the &quot;Last Updated&quot; date at the top of this page and,
              where appropriate, communicate the changes through the platform.
            </p>
            <p>
              Your continued use of the Service after the effective date of any updated terms
              constitutes your acceptance of the modified terms. If you do not agree to the updated
              terms, you must stop using the Service.
            </p>
          </section>

          <hr />

          {/* ─── 23. Contact ─── */}
          <section id="contact">
            <h2>23. Contact</h2>
            <p>
              For questions about these Terms of Use, please contact:
            </p>
            <div className="my-4 rounded-xl border border-warm-card-border bg-warm-card/40 p-4">
              <p className="text-sm text-warm-muted">
                [LEGAL ENTITY NAME]<br />
                [REGISTERED ADDRESS]<br />
                [LEGAL CONTACT EMAIL]
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
