import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocCodeBlock, DocSection, DocTable } from '@/components/docs/doc-blocks';
import { apiNav } from '@/lib/docs/navigation';

const pre = 'overflow-x-auto rounded-lg border border-warm-card-border bg-warm-card p-4 text-xs leading-relaxed text-warm-cream';

export default function ApiMobilePage() {
  return (
    <DocsShell
      title="Mobile Architecture"
      subtitle="Flutter app internals — offline cache, resumable uploads, push crypto, and reconciliation."
      nav={apiNav}
      variant="api"
    >
      <h2>Flutter architecture</h2>
      <p>
        Single Flutter codebase serves all mobile roles. Role-based shells load at launch based on
        the authenticated user's <code>User.role</code> and <code>BranchMember.role</code>.
      </p>

      <DocTable
        headers={['Shell', 'Entry point', 'Access']}
        rows={[
          ['Student', 'lib/features/student/', 'student role only'],
          ['Teacher', 'lib/features/teacher/', 'teacher role only'],
          ['Staff', 'lib/features/staff/', 'branch_admin, sub_admin, management, canteen_staff, worker'],
        ]}
      />

      <h2>Authentication &amp; session isolation</h2>
      <DocSection title="Login flow">
        <pre className={pre}>
{`sequenceDiagram
  participant U as User
  participant F as Flutter App
  participant API as Express API
  participant DB as PostgreSQL
  participant R as Upstash Redis

  U->>F: Enter credentials
  F->>API: POST /auth/login
  API->>DB: findUser + verifyPassword
  API->>DB: loadBranchMembers
  API-->>F: JWT + user + push crypto keys
  F->>F: Store token in secure storage
  F->>F: Initialize SQLite cache
  F->>F: Load role-based shell`}
        </pre>

        <p>
          JWT is stored in <code>flutter_secure_storage</code> (Keychain on iOS, EncryptedSharedPreferences
          on Android). Token is attached as <code>Authorization: Bearer &lt;jwt&gt;</code> on every request.
        </p>
      </DocSection>

      <DocSection title="Per-user cache isolation">
        <p>
          SQLite database is partitioned by user ID. Each authenticated user gets their own isolated
          cache namespace — data from one user is never visible to another.
        </p>
        <DocTable
          headers={['Action', 'Behavior']}
          rows={[
            ['Login', 'Open (or create) SQLite DB keyed to user ID'],
            ['Logout', 'Wipe entire SQLite database for that user'],
            ['Account switch', 'Close current DB, wipe, open new user DB'],
            ['App reinstall', 'Clean slate — no residual data'],
          ]}
        />
      </DocSection>

      <DocSection title="Logout wipe">
        <DocCodeBlock>{`// On logout:
// 1. Call POST /auth/logout (blacklists JWT in Upstash)
// 2. Wipe local SQLite database entirely
// 3. Clear secure storage (JWT, refresh tokens)
// 4. Reset in-memory state (providers, streams)
// 5. Navigate to login screen`}</DocCodeBlock>
        <DocCallout variant="warn" title="No partial wipe">
          Logout performs a full database wipe, not a selective one. This ensures no stale data
          leaks between accounts on shared devices.
        </DocCallout>
      </DocSection>

      <h2>Offline operation</h2>
      <DocSection title="Cached data">
        <p>
          On launch, the app syncs essential data into SQLite: student profiles, class rosters,
          attendance records, fee status, and chat messages. Once cached, these are available
          offline.
        </p>
        <DocTable
          headers={['Data type', 'Cache behavior', 'Stale policy']}
          rows={[
            ['Student profile', 'Synced on login', 'Re-sync on next connect'],
            ['Class roster', 'Synced per active AY', 'Re-sync on next connect'],
            ['Attendance', 'Written locally first', 'Push to server on reconnect'],
            ['Fee records', 'Read-only cache', 'Re-sync on next connect'],
            ['Chat messages', 'Synced on join', 'Incremental sync on reconnect'],
          ]}
        />
      </DocSection>

      <DocSection title="Queued operations">
        <p>
          Mutations made offline are queued locally and replayed when connectivity is restored.
          Each queue entry tracks status, retry count, and server response.
        </p>

        <h3>Message send queue</h3>
        <DocTable
          headers={['Field', 'Purpose']}
          rows={[
            ['id', 'Local queue entry ID'],
            ['roomId', 'Target chat room'],
            ['content', 'Message text or payload'],
            ['status', 'pending | sent | failed'],
            ['retryCount', 'Number of retry attempts'],
            ['createdAt', 'Local timestamp'],
          ]}
        />

        <h3>Upload queue (UploadQueue)</h3>
        <DocTable
          headers={['Field', 'Purpose']}
          rows={[
            ['id', 'Local queue entry ID'],
            ['filePath', 'Local file path to upload'],
            ['fileId', 'Server-assigned file ID (assigned pre-upload)'],
            ['totalBytes', 'Total file size'],
            ['uploadedBytes', 'Bytes uploaded so far (for resumption)'],
            ['status', 'pending | uploading | completed | failed'],
            ['endpoint', 'Target upload endpoint'],
            ['concurrencySlot', 'Which parallel slot this uses'],
          ]}
        />
      </DocSection>

      <DocSection title="Upload scheduler">
        <p>
          The upload scheduler manages concurrency, retries, and backoff for file uploads. It
          ensures uploads don&apos;t saturate the network and handles partial upload resumption.
        </p>
        <pre className={pre}>
{`flowchart TD
  A[File selected] --> B[Enqueue to UploadQueue]
  B --> C{Slots available?}
  C -->|yes| D[Start upload - assign slot]
  C -->|no| E[Wait for slot]
  D --> F{Upload complete?}
  F -->|yes| G[Mark completed - free slot]
  F -->|network error| H[Increment retry - exponential backoff]
  F -->|server error 5xx| H
  F -->|client error 4xx| I[Mark failed - no retry]
  H --> J{Retries < max?}
  J -->|yes| C
  J -->|no| I`}
        </pre>

        <DocTable
          headers={['Setting', 'Value', 'Notes']}
          rows={[
            ['Max concurrent uploads', '3', 'Configurable per platform'],
            ['Max retries', '5', 'Per upload entry'],
            ['Initial backoff', '2 seconds', 'Doubles each retry, caps at 60s'],
            ['Resumable threshold', '1 MB', 'Files smaller than this use simple upload'],
          ]}
        />
      </DocSection>

      <DocSection title="Resumable upload protocol">
        <DocCodeBlock>{`// Step 1: Request upload slot
POST /api/upload/init
{ "fileName": "photo.jpg", "fileSize": 5242880, "mimeType": "image/jpeg" }
→ { "fileId": "clx…", "uploadUrl": "/api/upload/chunks" }

// Step 2: Upload chunks (resumable)
POST /api/upload/chunks
Headers: X-File-Id: clx…
Body: multipart chunk (5MB parts)
→ { "uploadedBytes": 5242880, "complete": true }

// Step 3: Confirm
POST /api/upload/complete
{ "fileId": "clx…" }
→ { "id": "clx…", "url": "https://r2.example.com/…" }`}</DocCodeBlock>

        <DocCallout variant="info" title="Resumption">
          If the app is killed mid-upload, the <code>UploadQueue</code> persists progress in SQLite.
          On relaunch, it resumes from the last committed chunk — no re-uploading from the start.
        </DocCallout>
      </DocSection>

      <h2>Reconnect behavior</h2>
      <DocSection title="Reconnection flow">
        <pre className={pre}>
{`sequenceDiagram
  participant F as Flutter App
  participant Q as Local Queue
  participant API as Express API

  Note over F: Network restored
  F->>API: POST /auth/login (silent refresh)
  API-->>F: New JWT

  loop Each queued message
    F->>API: chat:message:send
    API-->>F: 201 Created
    F->>Q: Mark sent
  end

  loop Each queued upload
    F->>API: Resume chunk upload
    API-->>F: Chunk acknowledged
    F->>Q: Update uploadedBytes
  end

  F->>API: Sync pending data
  API-->>F: Latest state`}
        </pre>
      </DocSection>

      <DocSection title="Server-wins reconciliation">
        <p>
          After reconnection, the server&apos;s version of truth wins. Local mutations that conflict
          with server state are resolved by accepting the server version and logging the conflict
          for user review.
        </p>
        <DocTable
          headers={['Scenario', 'Resolution']}
          rows={[
            ['Attendance marked offline, teacher marked online', 'Server version wins, local overwritten'],
            ['Fee payment offline, fee already paid', 'Conflict logged, user notified'],
            ['Chat message offline, room deleted', 'Message dropped, conflict logged'],
            ['Profile edit offline, profile edited server-side', 'Server version wins'],
          ]}
        />
      </DocSection>

      <h2>Push notifications</h2>
      <DocSection title="Notification cold-start routing">
        <p>
          When a push notification arrives and the app is not running, the notification payload
          is inspected to determine which screen to navigate to on cold start.
        </p>
        <DocCodeBlock>{`// FCM payload structure
{
  "data": {
    "type": "chat_message",
    "roomId": "clx…",
    "senderId": "cly…",
    "title": "New message from Ahmed",
    "body": "Parent-teacher meeting at 3pm"
  }
}

// Cold-start routing
switch (payload.type) {
  case 'chat_message':
    navigateTo(ChatRoomScreen(roomId: payload.roomId));
    break;
  case 'fee_reminder':
    navigateTo(FeeDetailScreen(studentId: payload.studentId));
    break;
  case 'attendance_alert':
    navigateTo(AttendanceScreen);
    break;
  default:
    navigateTo(HomeScreen);
}`}</DocCodeBlock>

        <p>
          Push payloads are encrypted with <code>PUSH_MASTER_SECRET</code>. The mobile app
          decrypts locally using keys provided at login — the server never stores plaintext
          push content.
        </p>
      </DocSection>

      <h2>Configuration</h2>
      <DocSection title="API URL via dart-define">
        <DocCodeBlock>{`# Build with production API
flutter build apk --dart-define=API_BASE_URL=https://api.yourschool.pk

# Build with staging API
flutter build apk --dart-define=API_BASE_URL=https://staging-api.yourschool.pk

# Runtime check
const apiBase = String.fromEnvironment('API_BASE_URL',
  defaultValue: 'http://10.0.2.2:5000');`}</DocCodeBlock>

        <DocCallout variant="info" title="No runtime URL change">
          The API base URL is baked in at build time via <code>--dart-define</code>. Users cannot
          change it at runtime — this prevents accidental connection to wrong environments.
        </DocCallout>
      </DocSection>

      <DocSection title="Offline indicators">
        <DocTable
          headers={['Indicator', 'Behavior']}
          rows={[
            ['Connectivity stream', 'Listens to ConnectivityResult changes'],
            ['Offline banner', 'Shown when no connectivity for > 3 seconds'],
            ['Queue badge', 'Shows count of pending offline operations'],
            ['Retry button', 'Manual retry for failed operations'],
          ]}
        />
      </DocSection>

      <p>
        Next: <Link href="/docs/api/chat">Chat &amp; Realtime</Link> ·{' '}
        <Link href="/docs/api/deployment">Deployment</Link>
      </p>
    </DocsShell>
  );
}
