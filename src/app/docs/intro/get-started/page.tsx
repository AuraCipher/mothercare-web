import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocSteps, DocStep } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function GetStartedPage() {
  return (
    <DocsShell
      title="Get Started"
      subtitle="Sign in, understand your role, and find the right portal."
      nav={introNav}
      variant="intro"
    >
      <h2>Signing in</h2>
      <DocSteps>
        <DocStep title="Open the portal">
          Go to <Link href="/login">/login</Link> from the school website or bookmark provided by your admin.
        </DocStep>
        <DocStep title="Enter credentials">
          Use the username, email, or phone number and password given by your school administrator.
          There is no public self-registration.
        </DocStep>
        <DocStep title="Land in your portal">
          After sign-in you are redirected automatically:
          <ul>
            <li>CEO → <code>/ceo</code></li>
            <li>Admin / staff → <code>/admin</code> (module access may be restricted)</li>
            <li>Teacher → <code>/teacher</code></li>
            <li>Student → <code>/student</code> (web) or mobile app</li>
          </ul>
        </DocStep>
      </DocSteps>

      <h2>Mobile app</h2>
      <p>
        Teachers, students, and branch admins use the <strong>Flutter mobile app</strong> for chat,
        announcements, and role-specific workspaces. Install the APK/IPA provided by your school and
        sign in with the same credentials.
      </p>

      <h2>Branch & academic year</h2>
      <p>
        Most admin work is scoped to an <strong>active branch</strong> and <strong>academic year</strong>.
        Select these from the header or sidebar before working in fees, attendance, or results.
      </p>

      <DocCallout variant="warn" title="Archived years">
        When an academic year is archived, many modules become read-only. Contact your branch admin
        if you need historical access.
      </DocCallout>

      <h2>Next steps by role</h2>
      <ul>
        <li><Link href="/docs/intro/ceo">CEO guide</Link></li>
        <li><Link href="/docs/intro/admin">Admin guide</Link></li>
        <li><Link href="/docs/intro/teacher">Teacher guide</Link></li>
        <li><Link href="/docs/intro/student">Student guide</Link></li>
      </ul>
    </DocsShell>
  );
}
