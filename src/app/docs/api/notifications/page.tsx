import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocCodeBlock, DocSection, DocTable } from '@/components/docs/doc-blocks';
import { apiNav } from '@/lib/docs/navigation';

const pre = 'overflow-x-auto rounded-lg border border-warm-card-border bg-warm-card p-4 text-xs leading-relaxed text-warm-cream';

export default function ApiNotificationsPage() {
  return (
    <DocsShell
      title="Notifications"
      subtitle="System notification pipeline — 22 templates, FCM push, encrypted payloads, and delivery guarantees."
      nav={apiNav}
      variant="api"
    >
      <h2>Overview</h2>
      <p>
        Notifications flow through a multi-stage pipeline: business event → database write → recipient
        determination → queue enqueue → FCM push → mobile delivery. The system supports 22 notification
        templates covering attendance, payments, results, and payroll.
      </p>

      <pre className={pre}>
{`flowchart LR
  A[Business Event] --> B[Database Write]
  B --> C[Recipient Determination]
  C --> D[Queue Enqueue]
  D --> E[FCM Push]
  E --> F[Mobile Delivery]

  B -.-> G[SystemNotification table]
  C -.-> H[DeviceToken lookup]
  D -.-> I[BullMQ notifications queue]`}
      </pre>

      <DocSection title="Notification templates">
        <p>The system defines 22 notification templates across these categories:</p>
        <DocTable
          headers={['Category', 'Templates', 'Examples']}
          rows={[
            ['Attendance', '6', 'Student absent, teacher absent, daily summary, monthly report'],
            ['Payments', '4', 'Fee reminder, payment received, overdue warning, receipt generated'],
            ['Results', '4', 'Report card published, marks entered, exam schedule, grade update'],
            ['Payroll', '3', 'Salary credited, salary pending, payroll processed'],
            ['Credentials', '3', 'Login credentials sent, password reset, account activated'],
            ['General', '2', 'System maintenance, announcement']]}
        />
      </DocSection>

      <DocSection title="Pipeline flow">
        <DocCodeBlock>{`// Business event triggers notification creation
await notificationService.createNotification({
  templateKey: 'ATTENDANCE_ABSENT',
  recipientId: student.userId,
  branchId: student.branchId,
  data: {
    studentName: student.name,
    date: '2026-03-15',
    className: group.name,
  },
});`}</DocCodeBlock>

        <h3>Recipient determination</h3>
        <p>
          The service resolves recipients based on template type. Student absence notifications go to
          the student's parent contacts. Payment notifications go to the student. Teacher notifications
          go to the teacher's user account.
        </p>

        <h3>Queue processing</h3>
        <DocCodeBlock>{`// BullMQ worker processes notification queue
// backend/src/workers/notification.worker.ts

notificationQueue.process('send-notification', async (job) => {
  const { notificationId, recipientId, templateKey, data } = job.data;

  // 1. Look up device tokens
  const tokens = await prisma.deviceToken.findMany({
    where: { userId: recipientId, active: true },
  });

  // 2. Encrypt payload per device
  for (const token of tokens) {
    const encrypted = await pushCrypto.encrypt(
      token.publicKey,
      JSON.stringify({ templateKey, ...data })
    );

    // 3. Send via FCM
    await firebaseAdmin.messaging().send({
      token: token.fcmToken,
      data: { payload: encrypted },
    });
  }
});`}</DocCodeBlock>
      </DocSection>

      <DocSection title="System notification service">
        <p>
          The <code>SystemNotificationService</code> provides idempotent notification creation using{' '}
          <code>withEventLock</code>. This prevents duplicate notifications from concurrent requests.
        </p>
        <DocCodeBlock>{`// Idempotent notification creation
await notificationService.withEventLock(
  'attendance',           // event type
  studentId,              // entity ID
  async () => {
    // Create notification record
    // Determine recipients
    // Enqueue push jobs
  }
);

// Event lock prevents duplicate processing
// within a configurable window (default 5 minutes)`}</DocCodeBlock>
        <DocCallout variant="info" title="Idempotency">
          <code>withEventLock</code> uses a Redis-backed lock with TTL. If the lock cannot be acquired,
          the notification is skipped (not retried). This ensures exactly-once delivery per event.
        </DocCallout>
      </DocSection>

      <DocSection title="FCM push delivery">
        <p>
          Push notifications use Firebase Admin SDK with AES-256-GCM encrypted payloads. The mobile app
          decrypts payloads locally using keys derived during login.
        </p>

        <h3>Encryption flow</h3>
        <DocCodeBlock>{`// Backend encrypts payload per device
const encrypted = await pushCrypto.encrypt(
  deviceToken.publicKey,   // Device-specific key
  JSON.stringify({
    title: 'Fee Reminder',
    body: 'Your fee of PKR 15,000 is due on March 20',
    data: { screen: 'fees', feeId: '...' },
  })
);

// FCM data-only message (no notification payload)
await firebaseAdmin.messaging().send({
  token: deviceToken.fcmToken,
  data: { payload: encrypted },
});`}</DocCodeBlock>

        <h3>Device token management</h3>
        <DocTable
          headers={['Endpoint', 'Purpose']}
          rows={[
            ['POST /chat/devices', 'Register FCM device token on login'],
            ['DELETE /chat/devices', 'Remove device token on logout'],
            ['GET /student/devices', 'List active devices for student'],
            ['GET /teacher/devices', 'List active devices for teacher'],
          ]}
        />

        <h3>Push crypto</h3>
        <p>
          On login, teacher and student roles receive <code>push</code> material from{' '}
          <code>issuePushCryptoMaterial()</code>. This derives per-device encryption keys using HKDF
          from <code>PUSH_MASTER_SECRET</code> (or <code>JWT_SECRET</code> fallback). The mobile app
          uses these keys to decrypt FCM data payloads.
        </p>
        <DocTable
          headers={['Model', 'Purpose']}
          rows={[
            ['UserPushCryptoKey', 'Stores per-device public key and key version'],
            ['DeviceToken', 'FCM token + platform + active status'],
          ]}
        />
      </DocSection>

      <DocSection title="Events and delivery behavior">
        <h3>Push vs socket-only events</h3>
        <DocTable
          headers={['Event type', 'Push?', 'Socket?', 'Notes']}
          rows={[
            ['Attendance absent', 'Yes', 'Yes', 'Student absent notification to parent contacts'],
            ['Payment received', 'Yes', 'Yes', 'Fee receipt notification to student'],
            ['Report card published', 'Yes', 'Yes', 'Results notification to student'],
            ['Teacher payroll processed', 'Yes', 'Yes', 'Salary notification to teacher'],
            ['Chat message', 'Yes', 'Yes', 'Only for offline recipients (encrypted payload)'],
            ['Marks entered', 'No', 'Yes', 'Socket-only — teacher sees grid update in realtime'],
            ['Fee structure changed', 'No', 'Yes', 'Socket-only — admin sees list refresh'],
          ]}
        />

        <h3>Failure behavior</h3>
        <p>
          Push delivery failures are non-fatal. The system logs the error and continues. BullMQ retries
          failed jobs with exponential backoff (3 attempts). After final failure, the job is moved to
          failed state but does not affect the originating business operation.
        </p>
      </DocSection>

      <DocSection title="Environment variables">
        <DocTable
          headers={['Variable', 'Required', 'Purpose']}
          rows={[
            [<code>FCM_ENABLED</code>, 'For push', 'Set to "true" to enable FCM delivery'],
            [<code>PUSH_MASTER_SECRET</code>, 'For encryption', 'Master secret for HKDF key derivation (min 32 chars)'],
            [<code>FIREBASE_SERVICE_ACCOUNT_PATH</code>, 'For FCM', 'Path to Firebase service account JSON'],
            [<code>FIREBASE_SERVICE_ACCOUNT_JSON</code>, 'Alternative', 'Inline JSON (if path not feasible)'],
            [<code>REDIS_URL</code>, 'For queue', 'BullMQ job queue backend'],
          ]}
        />
        <DocCallout variant="warn" title="Without Redis">
          Without <code>REDIS_URL</code>, notifications are sent synchronously. This blocks the request
          until delivery completes and may cause timeouts for bulk operations.
        </DocCallout>
      </DocSection>

      <p>
        Next: <Link href="/docs/api/financial-system">Financial System</Link> ·{' '}
        <Link href="/docs/api/chat">Chat &amp; Realtime</Link>
      </p>
    </DocsShell>
  );
}
