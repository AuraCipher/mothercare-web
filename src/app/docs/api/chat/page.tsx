import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocTable } from '@/components/docs/doc-blocks';
import { apiNav } from '@/lib/docs/navigation';

export default function ApiChatPage() {
  return (
    <DocsShell
      title="Chat & Realtime"
      subtitle="Socket.IO messaging, room types, REST companions, and the mobile-only product split."
      nav={apiNav}
      variant="api"
    >
      <h2>Architecture</h2>
      <p>
        Chat combines REST endpoints (<code>/chat/*</code>) for history and device tokens with Socket.IO for
        realtime delivery. The Socket.IO server attaches to the same HTTP server as Express, path{' '}
        <code>SOCKET_PATH</code> (default <code>/socket.io</code>).
      </p>
      <ul>
        <li><strong>Redis adapter</strong> — when <code>REDIS_URL</code> is set, uses <code>@socket.io/redis-adapter</code> for multi-instance fanout</li>
        <li><strong>BullMQ chat worker</strong> — FCM push fanout for offline users, attendance daily reports</li>
        <li><strong>Prisma models</strong> — <code>ChatRoom</code>, <code>ChatMessage</code>, <code>ChatCommunity</code>, device tokens</li>
      </ul>

      <h2>Socket.IO authentication</h2>
      <p>
        Clients pass JWT in <code>handshake.auth.token</code> or <code>Authorization: Bearer</code> header.
        Unauthenticated connections are rejected.
      </p>

      <h2>Socket events</h2>
      <DocTable
        headers={['Event', 'Direction', 'Payload / behavior']}
        rows={[
          ['chat:join', 'Client → Server', '{ academicYearId } — join all rooms for user in AY'],
          ['chat:joined', 'Server → Client', '{ roomCount }'],
          ['chat:room:join', 'Client → Server', '{ roomId } — join single room after access check'],
          ['chat:room:joined', 'Server → Client', '{ roomId }'],
          ['chat:message:send', 'Client → Server', '{ roomId, type?, content?, title?, mediaFileId?, replyToId? }'],
          ['chat:message:new', 'Server → Room', 'Message envelope broadcast to room:*'],
          ['chat:message:read', 'Client → Server', '{ roomId, messageId? }'],
          ['chat:message:updated', 'Server → Room', 'After PATCH /chat/messages/:id'],
          ['chat:message:deleted', 'Server → Room', 'After DELETE /chat/messages/:id'],
          ['chat:error', 'Server → Client', '{ message }'],
        ]}
      />

      <h2>REST companions</h2>
      <DocTable
        headers={['Method', 'Path', 'Purpose']}
        rows={[
          ['GET', '/chat/rooms?academicYearId=', 'List rooms for current user'],
          ['GET', '/chat/rooms/:roomId/messages', 'Paginated history (cursor, limit)'],
          ['PATCH', '/chat/messages/:messageId', 'Edit message content'],
          ['DELETE', '/chat/messages/:messageId', 'Soft-delete message'],
          ['POST', '/chat/devices', 'Register FCM device token'],
          ['DELETE', '/chat/devices', 'Remove device token'],
        ]}
      />

      <h3>Portal chat bootstrap</h3>
      <p>Each surface exposes a landing endpoint that returns room list + <code>canPost</code> flags:</p>
      <ul>
        <li><code>GET /student/chat/landing</code> · <code>GET /student/chat/contacts</code> · <code>POST /student/chat/dm</code></li>
        <li><code>GET /teacher/chat/landing</code> · <code>GET /teacher/chat/contacts</code> · <code>POST /teacher/chat/dm</code></li>
        <li><code>GET /staff/chat/landing</code> · <code>GET /staff/chat/contacts</code> · <code>POST /staff/chat/dm</code></li>
      </ul>

      <h2>Room kinds & posting rules</h2>
      <DocTable
        headers={['Kind', 'Code', 'Who reads', 'Who posts (default)']}
        rows={[
          ['School announcement', 'school_announcement', 'Branch users in AY', 'Admin only (+ appointed teachers)'],
          ['Class announcement', 'class_announcement', 'Class + staff', 'Class teacher (+ appointed)'],
          ['Subject group', 'group_chat', 'Class + subject teacher', 'Subject teacher; students with role'],
          ['Teachers channel', 'teacher_announcement', 'Active teachers', 'Admin only (+ appointed)'],
          ['System feeds', 'system_attendance, system_payment', 'One student', 'System-generated'],
          ['Direct message', 'direct_message', 'Two participants', 'DM policy + app permissions'],
        ]}
      />
      <p>
        <code>resolveCanPost</code> in the backend is the single source of truth. Mobile shows/hides the composer
        based on API flags — it never edits permissions locally.
      </p>

      <h2>Mobile-only chat decision</h2>
      <p>Product split (confirmed in <code>docs/mobile-chat-plan.md</code>):</p>

      <h3>Flutter app (mobile)</h3>
      <ul>
        <li>Chat UI, read-only academic feeds, announcements</li>
        <li>Composer visibility from <code>canPost</code> API fields</li>
        <li>FCM push with encrypted payloads (<code>PUSH_MASTER_SECRET</code>, <code>FCM_ENABLED</code>)</li>
        <li>No permission editing, no role CRUD, no branch chat settings</li>
      </ul>

      <h3>Web portals</h3>
      <ul>
        <li><strong>Admin</strong> — branch chat settings, teacher app permissions, class role definitions, student role assignments</li>
        <li><strong>Teacher portal</strong> — class student role CRUD for classes where user is class teacher</li>
        <li><strong>Student web</strong> — limited; primary student experience is mobile</li>
      </ul>

      <DocCallout variant="info" title="Web manages, app consumes">
        When web changes permissions or appointments, backend bootstrap/sync endpoints update room membership
        and <code>canPost</code> flags. Mobile polls bootstrap on launch and via Socket.IO events.
      </DocCallout>

      <h2>Push notifications</h2>
      <p>
        After <code>chat:message:send</code>, push fanout is enqueued for room kinds:{' '}
        <code>school_announcement</code>, <code>class_announcement</code>, <code>teacher_announcement</code>,{' '}
        <code>direct_message</code>. FCM payloads are encrypted; the app decrypts locally.
      </p>
      <p>Requires:</p>
      <ul>
        <li><code>FCM_ENABLED=true</code></li>
        <li><code>FIREBASE_SERVICE_ACCOUNT_PATH</code> or <code>FIREBASE_SERVICE_ACCOUNT_JSON</code></li>
        <li><code>REDIS_URL</code> for the chat BullMQ worker</li>
      </ul>

      <h2>Admin chat configuration</h2>
      <ul>
        <li><code>GET/PATCH /admin/branches/:id/chat-settings</code> — branch-level chat toggles</li>
        <li><code>/admin/communities/*</code> — class role CRUD (admin)</li>
        <li><code>/teacher/communities/:communityId/roles/*</code> — class teacher role management</li>
      </ul>

      <p>
        Next: <Link href="/docs/api/deployment">Deployment</Link>
      </p>
    </DocsShell>
  );
}
