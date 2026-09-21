import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocSection, DocFaq } from '@/components/docs/doc-blocks';
import { introNav } from '@/lib/docs/navigation';

export default function TroubleshootingPage() {
  return (
    <DocsShell
      title="Troubleshooting"
      subtitle="Common issues and how to fix them — sign-in, connectivity, data, and permissions."
      nav={introNav}
      variant="intro"
    >
      <DocSection title="Sign-in issues">
        <DocFaq
          items={[
            {
              q: 'Cannot log in — wrong credentials',
              a: (
                <>
                  Check caps lock is off. Confirm your username, email, or phone number matches
                  exactly what your admin issued. If the password was recently reset by admin, use
                  the new temporary password. Still failing? Ask admin to verify your account status
                  is <strong>active</strong> and your role is correct.
                </>
              ),
            },
            {
              q: 'Cannot log in — account inactive',
              a: 'Your account may have been deactivated by an admin. Contact your branch administrator to reactivate or verify your account status.',
            },
            {
              q: 'Cannot log in — wrong portal',
              a: (
                <>
                  Your role determines which portal opens after login. CEO → <code>/ceo</code>,
                  admin → <code>/admin</code>, teacher → <code>/teacher</code>, student →{' '}
                  <code>/student</code>. If you land on the wrong portal, your account role may be
                  misconfigured — ask admin to verify <code>User.role</code>.
                </>
              ),
            },
            {
              q: 'Blank page after login',
              a: 'Clear your browser cache, try an incognito/private window, and ensure JavaScript is enabled. If the issue persists, check that your browser is up to date.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Connectivity issues">
        <DocFaq
          items={[
            {
              q: 'No internet — app shows cached data',
              a: 'The mobile app caches some data for offline viewing. Cached data may be stale. Reconnect to the internet and pull to refresh on any screen to sync the latest data.',
            },
            {
              q: 'Messages not sending',
              a: (
                <>
                  Check your internet connection. The app queues outgoing messages and sends them
                  when connectivity is restored. If the message remains stuck, close and reopen the
                  app. If <code>FCM_ENABLED</code> is configured, push notifications also require
                  connectivity to deliver.
                </>
              ),
            },
            {
              q: 'Upload paused during transfer',
              a: 'Uploads pause when connectivity drops and resume automatically when you reconnect. No action needed — wait for the connection to restore.',
            },
            {
              q: 'Upload failed',
              a: 'Tap retry on the failed upload. Check that the file is within the allowed size limit and is a supported file type (images, PDFs). If the issue repeats, try a smaller file or different format.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Data and display issues">
        <DocFaq
          items={[
            {
              q: 'Data appears stale or outdated',
              a: (
                <>
                  Pull down to refresh on mobile. On web, reload the page. Confirm you have the
                  correct <strong>branch</strong> and <strong>academic year</strong> selected in the
                  sidebar — stale data often means viewing the wrong year or branch context.
                </>
              ),
            },
            {
              q: 'Wrong academic year selected',
              a: (
                <>
                  Use the year switcher in the sidebar to select the correct academic year. All
                  module data (fees, attendance, results, enrollment) is scoped to the active year.
                  An archived year shows <em>(Archived)</em> or <em>(Read only)</em> label.
                </>
              ),
            },
            {
              q: 'Empty student list',
              a: 'No academic year is selected, or no students are enrolled for the current year. Select an active year in the sidebar and verify students exist in the Students module.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Upload and notification issues">
        <DocFaq
          items={[
            {
              q: 'App restarted during upload',
              a: 'Pending uploads resume automatically when the app restarts and connectivity is available. Check the upload status indicator to confirm progress.',
            },
            {
              q: 'Notification not appearing',
              a: (
                <>
                  On mobile: ensure push notifications are enabled in device Settings → Apps → the
                  school app → Notifications. Verify <code>FCM_ENABLED</code> is set on the server.
                  On web: notifications are in-app only — refresh the page if the badge does not
                  update. System rooms on mobile populate after the triggering event occurs.
                </>
              ),
            },
          ]}
        />
      </DocSection>

      <DocSection title="Payment issues">
        <DocFaq
          items={[
            {
              q: 'Payment issue — receipt not received',
              a: 'Check the Collections page in Fees to verify the payment was recorded. If the payment is not visible, contact your branch admin to confirm the transaction. Save your payment receipt for reference.',
            },
            {
              q: 'Cannot record a payment',
              a: 'The academic year may be archived (writes blocked), or you lack Fees → Create permission. Check the year status in the sidebar and your staff profile permissions.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Access and permission issues">
        <DocFaq
          items={[
            {
              q: 'WhatsApp credentials not received',
              a: (
                <>
                  Verify your phone number is correct in the system. Check that Twilio (or your
                  SMS provider) is configured and has balance. Ask admin to resend credentials from
                  the student or teacher profile. The message may be delayed by the carrier.
                </>
              ),
            },
            {
              q: 'Cannot access a module',
              a: (
                <>
                  You may lack the required module permission. Contact your branch admin to verify
                  your staff profile has <strong>Read</strong> access for the module you need. See{' '}
                  <Link href="/docs/intro/admin/permissions">Permissions &amp; Staff Roles</Link>{' '}
                  for the full permission matrix.
                </>
              ),
            },
            {
              q: 'Archived year is read-only',
              a: 'This is expected behavior. Archived years lock most write operations to preserve historical data. If you need to edit archived records, your admin must grant archived CRUD permissions on the relevant module.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Related guides">
        <ul>
          <li><Link href="/docs/intro/get-started">Get Started</Link> — sign-in walkthrough and role overview</li>
          <li><Link href="/docs/intro/admin/permissions">Permissions</Link> — module access and staff roles</li>
          <li><Link href="/docs/intro/admin/settings">Settings</Link> — academic year management</li>
          <li><Link href="/docs/intro/notifications">Notifications</Link> — system alerts and push setup</li>
          <li><Link href="/docs/intro/chat">Chat</Link> — messaging and connectivity</li>
        </ul>
      </DocSection>
    </DocsShell>
  );
}
