import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep, DocFaq, DocTable } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function GetStartedPage() {
  return (
    <DocsShell
      title="Get Started"
      subtitle="Sign in, understand your role, and find the right portal."
      nav={introNav}
      variant="intro"
    >
      <h2>Before you sign in</h2>
      <p>
        Mother Care School does not offer public registration. Your branch administrator creates your
        account and shares credentials — typically via WhatsApp or in person. You will receive a
        username (or email / phone number) and a temporary password. Change your password after first
        login if your school requires it.
      </p>
      <p>You need:</p>
      <ul>
        <li>Credentials issued by your school administrator</li>
        <li>A modern web browser (Chrome, Firefox, Safari, or Edge) for web portals</li>
        <li>The school-provided mobile app (APK for Android or IPA for iOS) for chat and on-the-go access</li>
        <li>A stable internet connection — the app caches some data offline but requires connectivity to sync</li>
      </ul>

      <h2>Signing in on the web</h2>
      <DocSteps>
        <DocStep title="Open the login page">
          Navigate to <Link href="/login">/login</Link> from the school website or use the bookmark
          your administrator provided. Bookmark this page on devices you use regularly.
        </DocStep>
        <DocStep title="Enter your credentials">
          Type your username, email, or phone number in the first field and your password in the
          second. There is no &quot;Sign up&quot; or &quot;Forgot password&quot; self-service link
          unless your school has configured one — contact your admin to reset a lost password.
        </DocStep>
        <DocStep title="Submit and wait for redirect">
          After a successful login the system reads your role from the session token and redirects
          you automatically. You should never need to guess which URL to open.
          <ul>
            <li><strong>CEO</strong> (<code>super_admin</code>) → <code>/ceo</code></li>
            <li><strong>Branch admin / management staff</strong> → <code>/admin</code></li>
            <li><strong>Teacher</strong> → <code>/teacher</code></li>
            <li><strong>Student</strong> → <code>/student</code></li>
          </ul>
        </DocStep>
        <DocStep title="Confirm you are in the right place">
          Check the portal header. CEO pages show &quot;CEO Panel&quot;; admin pages show your branch
          name; teacher pages show assignment counts; student pages greet you by first name. If you
          land somewhere unexpected, your account role may be misconfigured — contact your admin.
        </DocStep>
      </DocSteps>

      <h2>Signing in on the mobile app</h2>
      <DocSteps>
        <DocStep title="Install the app">
          Install the Flutter mobile app build provided by your school. Do not download from public
          app stores unless your school explicitly publishes there — builds are often distributed
          directly as APK/IPA files.
        </DocStep>
        <DocStep title="Sign in with the same credentials">
          Open the app, enter the same username and password you use on the web. Teachers, students,
          and branch admin staff all use this app; the home screen adapts to your role after login.
        </DocStep>
        <DocStep title="Allow notifications (recommended)">
          When prompted, allow push notifications so you receive alerts for new chat messages,
          announcements, and system room updates (fee receipts, attendance marks, result publications).
        </DocStep>
        <DocStep title="Explore your tabs">
          Teachers see <strong>Chats</strong>, <strong>Workspace</strong>, and <strong>Profile</strong>.
          Students see <strong>Chats</strong>, <strong>Academics</strong>, and <strong>Profile</strong>.
          Admin staff see a chat-focused shell similar to teachers.
        </DocStep>
      </DocSteps>

      <DocCallout variant="info" title="Web vs mobile by role">
        Teachers do most classroom work (marks entry, full attendance grids) on the web portal. The
        mobile app is best for chat, quick attendance checks, and timetable glances. Students
        primarily use the mobile app; the web student portal at <code>/student</code> offers the same
        read-only academics if you prefer a larger screen.
      </DocCallout>

      <h2>Understanding your role</h2>
      <p>
        Your role is fixed when the administrator creates your account. It controls which portal opens,
        which API endpoints you can call, and which mobile tabs appear.
      </p>
      <ul>
        <li>
          <strong>super_admin (CEO)</strong> — organization-wide access. Cannot be combined with
          teacher or student duties in normal setups.
        </li>
        <li>
          <strong>management (admin staff)</strong> — branch ERP access, optionally restricted to
          specific modules (Fees, Attendance, etc.) by the branch admin.
        </li>
        <li>
          <strong>teacher</strong> — scoped to assigned subjects and classes. May also be designated
          class teacher or Head of Department (HOD).
        </li>
        <li>
          <strong>student</strong> — read-only access to own academic records and class chat rooms.
        </li>
      </ul>
      <p>
        A single person cannot switch roles without a separate account. If you are both a teacher and
        an admin, your school may issue two logins or assign a management account with teacher
        modules disabled.
      </p>

      <h2>Branch and academic year</h2>
      <p>
        Admin staff must select an <strong>active branch</strong> and <strong>academic year</strong>{' '}
        from the sidebar before working in fees, attendance, results, or student records. Teachers
        and students are bound to their branch&apos;s current year automatically — you will see the
        year label in the mobile app header and teacher dashboard.
      </p>
      <p>Academic year statuses you may encounter:</p>
      <ul>
        <li><strong>Active</strong> — normal read/write operation</li>
        <li><strong>Build stage</strong> — year is being prepared; some features may be limited</li>
        <li><strong>On hold</strong> — view only until admin resumes the year</li>
        <li><strong>Archived</strong> — year has ended; all portals switch to read-only</li>
      </ul>

      <DocCallout variant="warn" title="Archived years">
        When an academic year is archived, teachers cannot enter marks or attendance, and students
        cannot interact with write-enabled chat rooms. Historical data remains visible for reference.
        Contact your branch admin if you need a specific archived-year permission.
      </DocCallout>

      <h2>Multi-branch teachers</h2>
      <p>
        If you teach at more than one campus, your account may list multiple branches. On the teacher
        web portal, use the branch switcher in the header to change context. Mobile bootstrap loads
        your primary branch — contact admin if assignments at another branch do not appear.
      </p>

      <h2>Next steps by role</h2>
      <p>Continue to the guide written for your role:</p>
      <ul>
        <li><Link href="/docs/intro/ceo">CEO guide</Link> — branches, admin invitations, API keys</li>
        <li><Link href="/docs/intro/admin">Admin guide</Link> — full ERP walkthrough</li>
        <li>
          <Link href="/docs/intro/teacher">Teacher guide</Link> — web portal modules, mobile app,
          and <Link href="/docs/intro/teacher/permissions">permissions</Link>
        </li>
        <li>
          <Link href="/docs/intro/student">Student guide</Link> — academics, chat, and{' '}
          <Link href="/docs/intro/student/mobile-app">mobile app details</Link>
        </li>
      </ul>

      <h2>Signing out and session security</h2>
      <p>
        Click your profile menu and choose <strong>Sign out</strong> to end your session. On the web,
        this clears the httpOnly JWT cookie and blacklists the token server-side (when Redis is
        configured). On mobile, sign out also removes your FCM device token so you stop receiving
        push notifications on that device.
      </p>
      <ul>
        <li>Always sign out on shared or public computers</li>
        <li>Do not share your password — each person should have their own account</li>
        <li>If you suspect unauthorized access, tell your admin immediately so they can reset your password</li>
      </ul>

      <h2>Password changes</h2>
      <p>
        Teachers and students can change their own password from the profile page on web or mobile
        (when the feature is enabled). There is no self-service &quot;Forgot password&quot; link unless
        your school has configured one — contact your branch office to reset a lost password. Admins
        can set a new temporary password from the student or teacher profile in the ERP.
      </p>

      <h2>Troubleshooting sign-in</h2>
      <DocTable
        headers={['Problem', 'What to try']}
        rows={[
          ['Wrong portal after login', 'Your account role may be misconfigured — ask admin to verify User.role'],
          ['"Invalid credentials"', 'Check caps lock; confirm username with admin; password may have been reset'],
          ['Blank page after login', 'Clear browser cache; try incognito; ensure JavaScript is enabled'],
          ['Mobile: "No active academic year"', 'Branch admin must publish an academic year and link your enrollment'],
          ['Mobile: chat rooms empty', 'Confirm you are in the correct branch; pull to refresh on Chats tab'],
          ['Repeated logouts', 'Another device may have signed out; or token expired — sign in again'],
        ]}
      />

      <h2>Language & accessibility</h2>
      <p>
        The web portals use responsive layouts that work on phone-sized screens, but complex tasks
        (marks grids, fee collection) are easier on a laptop. Screen readers can navigate the main
        sidebar landmarks. If you need larger text, use your browser or OS accessibility settings —
        the app respects system font scaling on mobile.
      </p>

      <h2>Common questions</h2>
      <DocFaq
        items={[
          {
            q: 'I signed in but was redirected to the wrong portal.',
            a: (
              <>
                Your JWT role does not match the portal you expected. A teacher account always goes to{' '}
                <code>/teacher</code>. Ask your admin to verify the role on your user record. Signing
                out and back in after a role change may be required.
              </>
            ),
          },
          {
            q: 'The mobile app says "No active academic year".',
            a: 'Your branch admin has not activated an academic year yet, or your student record is not linked to the current year. Contact the school office.',
          },
          {
            q: 'Can I use the web portal on my phone?',
            a: 'Yes — teacher and student web portals are responsive. For chat and push notifications, use the native mobile app.',
          },
          {
            q: 'Where is the help button?',
            a: (
              <>
                Web portal pages show a <strong>?</strong> icon in the header. It links directly to the
                relevant section of this user guide.
              </>
            ),
          },
          {
            q: 'I forgot my password.',
            a: 'Contact your branch administrator or school office. They can set a new temporary password from the admin ERP. There is no public password-reset page unless your school has enabled one.',
          },
          {
            q: 'Can parents log in?',
            a: 'Parent accounts exist in the database for legacy family linking, but the primary student experience uses the student login. Ask your school whether parent portal access is enabled for your branch.',
          },
        ]}
      />
    </DocsShell>
  );
}
