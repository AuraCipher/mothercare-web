import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocCodeBlock, DocSection, DocTable } from '@/components/docs/doc-blocks';
import { apiNav } from '@/lib/docs/navigation';

const pre = 'overflow-x-auto rounded-lg border border-warm-card-border bg-warm-card p-4 text-xs leading-relaxed text-warm-cream';

export default function ApiChatPage() {
  return (
    <DocsShell
      title="Chat & Realtime"
      subtitle="Socket.IO messaging, room types, REST companions, push fanout, and the mobile-only product split."
      nav={apiNav}
      variant="api"
    >
      <h2>Architecture overview</h2>
      <p>
        Chat combines REST endpoints under <code>/chat/*</code> (history, edits, device tokens) with
        Socket.IO for realtime delivery. The Socket.IO server attaches to the same HTTP server as
        Express in <code>backend/server.ts</code>, path <code>SOCKET_PATH</code> (default{' '}
        <code>/socket.io</code>).
      </p>

      <pre className={pre}>
{`flowchart TB
  subgraph clients [Clients]
    M[Flutter mobile]
    W[Web portals bootstrap only]
  end

  subgraph api [Express API]
    REST["/chat/* REST"]
    PORTAL["/teacher|student|staff/chat/*"]
  end

  subgraph realtime [Realtime]
    SIO[Socket.IO server]
    REDIS[(Redis adapter)]
  end

  subgraph workers [Background]
    BQ[BullMQ chat queue]
    FCM[FCM push service]
  end

  subgraph db [PostgreSQL]
    ROOMS[ChatRoom / ChatMessage]
    ROLES[ClassRole definitions]
  end

  M --> REST
  M --> SIO
  W --> PORTAL
  REST --> ROOMS
  PORTAL --> ROOMS
  SIO --> REDIS
  SIO --> ROOMS
  SIO -->|offline recipients| BQ
  BQ --> FCM
  ROLES -->|canPost flags| PORTAL`}
      </pre>

      <ul>
        <li>
          <strong>Redis adapter</strong> — when <code>REDIS_URL</code> is set,{' '}
          <code>@socket.io/redis-adapter</code> fans out events across multiple API instances
        </li>
        <li>
          <strong>BullMQ chat worker</strong> — encrypted FCM push for offline users; attendance
          daily reports to system rooms
        </li>
        <li>
          <strong>Prisma models</strong> — <code>ChatCommunity</code>, <code>ChatRoom</code>,{' '}
          <code>ChatMessage</code>, <code>DeviceToken</code>, <code>ClassRoleDefinition</code>,{' '}
          <code>ClassRoleAssignment</code>
        </li>
      </ul>

      <DocSection title="Connection & authentication">
        <p>
          Clients connect to the same origin as the API (or configured base URL). JWT is required at
          handshake time — unauthenticated connections are rejected.
        </p>
        <DocCodeBlock>{`// Socket.IO client (Flutter / JS)
const socket = io(API_BASE_URL, {
  path: '/socket.io',
  auth: { token: jwtAccessToken },
  // or: extraHeaders: { Authorization: 'Bearer ' + jwtAccessToken }
});`}</DocCodeBlock>
        <p>Handshake middleware in <code>chat.socket.ts</code> reads:</p>
        <ul>
          <li><code>handshake.auth.token</code> — preferred for mobile</li>
          <li><code>Authorization: Bearer &lt;token&gt;</code> header — web fallback</li>
        </ul>
        <DocCallout variant="warn" title="CORS in production">
          Socket.IO uses the same <code>ALLOWED_ORIGINS</code> list as Express when{' '}
          <code>APP_MODE=production</code>. Wildcard origins are not permitted.
        </DocCallout>
      </DocSection>

      <DocSection title="Socket.IO event reference">
        <pre className={pre}>
{`sequenceDiagram
  participant C as Client
  participant S as Socket.IO server
  participant DB as PostgreSQL
  participant Q as BullMQ

  C->>S: chat:join { academicYearId }
  S->>DB: listUserRoomIds
  S-->>C: chat:joined { roomCount }

  C->>S: chat:room:join { roomId }
  S->>DB: ensureChatRoomAccess
  S-->>C: chat:room:joined { roomId }

  C->>S: chat:message:send { roomId, content, ... }
  S->>DB: createRoomMessage
  S-->>C: chat:message:new (broadcast to room)
  S->>Q: enqueueChatPushFanout (if offline)

  C->>S: chat:message:read { roomId, messageId? }
  S->>DB: markRoomRead
  S-->>C: chat:message:read (to room peers)`}
        </pre>

        <DocTable
          headers={['Event', 'Direction', 'Payload / behavior']}
          rows={[
            ['chat:join', 'Client → Server', '{ academicYearId } — join all rooms for user in AY'],
            ['chat:joined', 'Server → Client', '{ roomCount }'],
            ['chat:room:join', 'Client → Server', '{ roomId } — join single room after access check'],
            ['chat:room:joined', 'Server → Client', '{ roomId }'],
            [
              'chat:message:send',
              'Client → Server',
              '{ roomId, type?, content?, title?, mediaFileId?, replyToId? }',
            ],
            ['chat:message:new', 'Server → Room', 'Message envelope broadcast to room:* namespace'],
            ['chat:message:read', 'Client → Server', '{ roomId, messageId? }'],
            ['chat:message:read', 'Server → Room', '{ roomId, userId, messageId } — read receipts'],
            ['chat:message:updated', 'Server → Room', 'After PATCH /chat/messages/:id'],
            ['chat:message:deleted', 'Server → Room', 'After DELETE /chat/messages/:id'],
            ['chat:error', 'Server → Client', '{ message } — validation or permission failure'],
          ]}
        />

        <p>Outbound message envelope (from <code>chat:message:send</code>):</p>
        <DocCodeBlock>{`// chat:message:new
{
  "id": "clx…",
  "roomId": "clx…",
  "type": "text",
  "title": null,
  "content": "Parent-teacher meeting at 3pm",
  "mediaFileId": null,
  "mediaFile": null,
  "sender": { "id": "clx…", "name": "Principal Ahmed" },
  "createdAt": "2026-03-15T09:00:00.000Z"
}`}</DocCodeBlock>
      </DocSection>

      <DocSection title="REST companions (/chat)">
        <DocTable
          headers={['Method', 'Path', 'Purpose']}
          rows={[
            ['GET', '/chat/rooms?academicYearId=', 'List rooms for current user with canPost flags'],
            ['GET', '/chat/rooms/:roomId/messages', 'Paginated history — ?cursor=&limit='],
            ['PATCH', '/chat/messages/:messageId', 'Edit message content (own messages)'],
            ['DELETE', '/chat/messages/:messageId', 'Soft-delete message'],
            ['POST', '/chat/devices', 'Register FCM device token'],
            ['DELETE', '/chat/devices', 'Remove device token on logout'],
          ]}
        />

        <DocCodeBlock>{`POST /chat/devices
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "token": "fcm-device-token-…",
  "platform": "android"
}

// 201 Created
{ "success": true, "data": { "id": "clx…", "platform": "android" } }`}</DocCodeBlock>

        <DocCodeBlock>{`PATCH /chat/messages/:messageId
Content-Type: application/json

{ "content": "Updated announcement text" }`}</DocCodeBlock>
      </DocSection>

      <DocSection title="Portal chat bootstrap">
        <p>
          Each surface exposes landing endpoints that return the room list, unread counts, and{' '}
          <code>canPost</code> flags. Mobile never computes permissions locally — it renders the
          composer only when the API says posting is allowed.
        </p>
        <DocTable
          headers={['Portal', 'Landing', 'Contacts', 'Open DM']}
          rows={[
            [
              'Student',
              'GET /student/chat/landing',
              'GET /student/chat/contacts',
              'POST /student/chat/dm',
            ],
            [
              'Teacher',
              'GET /teacher/chat/landing',
              'GET /teacher/chat/contacts',
              'POST /teacher/chat/dm',
            ],
            [
              'Staff',
              'GET /staff/chat/landing?branchId=&academicYearId=',
              'GET /staff/chat/contacts?branchId=&academicYearId=',
              'POST /staff/chat/dm',
            ],
          ]}
        />
        <DocCodeBlock>{`GET /student/chat/landing

// 200 OK (abbreviated)
{
  "success": true,
  "data": {
    "rooms": [
      {
        "id": "clx…",
        "name": "Grade 8A Announcements",
        "kind": "class_announcement",
        "canPost": false,
        "unreadCount": 2
      },
      {
        "id": "clx…",
        "name": "Mathematics — 8A",
        "kind": "group_chat",
        "canPost": true,
        "unreadCount": 0
      }
    ],
    "directMessagePolicy": "class_roles"
  }
}`}</DocCodeBlock>
        <DocCodeBlock>{`POST /teacher/chat/dm
Content-Type: application/json

{ "participantUserId": "clx…" }

// 201 Created
{
  "success": true,
  "data": {
    "roomId": "clx…",
    "kind": "direct_message",
    "canPost": true
  }
}`}</DocCodeBlock>
      </DocSection>

      <DocSection title="Room kinds & posting rules">
        <DocTable
          headers={['Kind', 'Code', 'Who reads', 'Who posts (default)']}
          rows={[
            ['School announcement', 'school_announcement', 'Branch users in AY', 'Admin + appointed teachers'],
            ['Class announcement', 'class_announcement', 'Class + staff', 'Class teacher + appointed'],
            ['Subject group', 'group_chat', 'Class + subject teacher', 'Subject teacher; students with role'],
            ['Teachers channel', 'teacher_announcement', 'Active teachers', 'Admin + appointed'],
            ['System — attendance', 'system_attendance', 'One student/teacher', 'System-generated'],
            ['System — payment', 'system_payment', 'One student', 'System-generated (fee receipts)'],
            ['Direct message', 'direct_message', 'Two participants', 'DM policy + class roles + app permissions'],
          ]}
        />
        <p>
          <code>resolveCanPost</code> in <code>chat-access.service.ts</code> is the single source of
          truth. Inputs include room kind, user role, branch chat settings, teacher app permissions,
          class teacher status, and student class role assignments.
        </p>

        <pre className={pre}>
{`flowchart TD
  A[User opens room] --> B{Room kind?}
  B -->|announcement| C{Admin or appointed teacher?}
  B -->|group_chat| D{Subject teacher or student role?}
  B -->|direct_message| E{DM policy + class role flags?}
  B -->|system_*| F[Read only — system posts]
  C -->|yes| G[canPost: true]
  C -->|no| H[canPost: false]
  D --> G
  D --> H
  E --> G
  E --> H`}
        </pre>
      </DocSection>

      <DocSection title="Class roles & DM policy">
        <p>
          Student messaging permissions are controlled per class via role definitions. Admins manage
          roles at <code>/admin/communities/*</code>; class teachers manage roles for their classes at{' '}
          <code>/teacher/communities/*</code>.
        </p>
        <DocTable
          headers={['Field', 'Effect']}
          rows={[
            ['canPostInGroups', 'Student can post in subject group chats'],
            ['canReceiveDms', 'Student can receive direct messages'],
            ['canInitiateDms', 'Student can start DMs from contact picker'],
            ['isMessagingRestricted', 'Assignment-level override to block messaging'],
            ['publicDisplayName', 'Optional alias shown in chat UI'],
          ]}
        />
        <DocCodeBlock>{`POST /admin/communities/:communityId/roles
Content-Type: application/json

{
  "name": "Class Monitor",
  "description": "Can post in subject groups",
  "canPostInGroups": true,
  "canReceiveDms": true,
  "canInitiateDms": false
}`}</DocCodeBlock>
      </DocSection>

      <DocSection title="Push notifications">
        <p>
          After <code>chat:message:send</code>, push fanout is enqueued for room kinds:{' '}
          <code>school_announcement</code>, <code>class_announcement</code>,{' '}
          <code>teacher_announcement</code>, <code>direct_message</code>. Offline recipients receive
          encrypted FCM payloads; the mobile app decrypts locally using keys from login.
        </p>
        <DocTable
          headers={['Requirement', 'Env variable']}
          rows={[
            ['Enable push', 'FCM_ENABLED=true'],
            ['Firebase credentials', 'FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON'],
            ['Queue worker', 'REDIS_URL (TCP)'],
            ['Payload encryption', 'PUSH_MASTER_SECRET'],
          ]}
        />
        <p>BullMQ job types handled by <code>chat.worker</code>:</p>
        <ul>
          <li><code>chat_push_fanout</code> — sendEncryptedPushToUsers for offline recipients</li>
          <li><code>chat_offline_deliver</code> — flush pending system notifications on reconnect</li>
          <li><code>attendance_daily_report</code> — daily summary to student system_attendance rooms</li>
        </ul>
      </DocSection>

      <DocSection title="Mobile-only chat decision">
        <p>Product split (see <code>docs/mobile-chat-plan.md</code>):</p>

        <h3>Flutter app (mobile)</h3>
        <ul>
          <li>Full chat UI, read-only academic feeds, announcements</li>
          <li>Composer visibility from <code>canPost</code> API fields only</li>
          <li>FCM push with encrypted payloads</li>
          <li>No permission editing, no role CRUD, no branch chat settings</li>
        </ul>

        <h3>Web portals</h3>
        <ul>
          <li>
            <strong>Admin</strong> — branch chat settings, teacher app permissions, class role
            definitions, student role assignments
          </li>
          <li>
            <strong>Teacher portal</strong> — class student role CRUD for classes where user is class
            teacher
          </li>
          <li>
            <strong>Student web</strong> — limited; primary student experience is mobile
          </li>
        </ul>

        <DocCallout variant="info" title="Web manages, app consumes">
          When web changes permissions or appointments, backend bootstrap/sync endpoints update room
          membership and <code>canPost</code> flags. Mobile reloads bootstrap on launch and reacts to
          Socket.IO events for live updates.
        </DocCallout>
      </DocSection>

      <DocSection title="Admin chat configuration">
        <DocTable
          headers={['Endpoint', 'Purpose']}
          rows={[
            ['GET /admin/branches/:id/chat-settings', 'Branch-level chat toggles'],
            ['PATCH /admin/branches/:id/chat-settings', 'Enable/disable features per branch'],
            ['GET /admin/communities/by-group/:groupId', 'Resolve community from class ID'],
            ['GET|POST|PATCH|DELETE /admin/communities/:id/roles/*', 'Admin class role CRUD'],
            ['GET|POST|PATCH|DELETE /teacher/communities/:id/roles/*', 'Class teacher role CRUD'],
          ]}
        />
        <p>Branch chat settings control defaults such as whether teachers can mark attendance, enter marks, or post in announcement channels without explicit appointment.</p>
      </DocSection>

      <p>
        Next: <Link href="/docs/api/deployment">Deployment</Link> ·{' '}
        <Link href="/docs/api/endpoints">REST Endpoints</Link>
      </p>
    </DocsShell>
  );
}
