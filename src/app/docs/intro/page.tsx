import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function IntroOverviewPage() {
  return (
    <DocsShell
      title="Mother Care School — User Guide"
      subtitle="Learn how each portal works, what you can do in every module, and how permissions affect your daily work."
      nav={introNav}
      variant="intro"
    >
      <p>
        This guide is for everyone who uses Mother Care School software — CEO, branch administrators,
        teachers, and students. It explains features in plain language with step-by-step instructions.
      </p>

      <h2>Who this guide is for</h2>
      <ul>
        <li><strong>CEO</strong> — manages branches, invites branch admins, and oversees API keys.</li>
        <li><strong>Admin staff</strong> — runs day-to-day school operations (fees, attendance, results, staff).</li>
        <li><strong>Teachers</strong> — use the web portal and mobile app for classes, marks, and chat.</li>
        <li><strong>Students</strong> — use the mobile app for academics, fees, attendance, and chat.</li>
      </ul>

      <h2>Four portal areas</h2>
      <ul>
        <li><Link href="/docs/intro/ceo">CEO Portal</Link> — organization setup</li>
        <li><Link href="/docs/intro/admin">Admin Portal</Link> — full school ERP</li>
        <li><Link href="/docs/intro/teacher">Teacher Portal & App</Link> — classroom work</li>
        <li><Link href="/docs/intro/student">Student App</Link> — read-only academics + chat</li>
      </ul>

      <DocCallout variant="tip" title="Contextual help">
        Look for the <strong>?</strong> icon on portal pages — it opens the guide for that exact screen.
      </DocCallout>

      <h2>Technical documentation</h2>
      <p>
        Engineers should read the <Link href="/docs/api">API & architecture docs</Link> for endpoints,
        authentication, deployment, and system design decisions.
      </p>
    </DocsShell>
  );
}
