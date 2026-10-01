/**
 * M21/M22 — Manual WhatsApp handoff helpers (provider-free).
 *
 * Message texts below are the owner-directed wordings (M22): there is no
 * provider and therefore no template approval — the browser sends whatever
 * text is constructed here. Slot orders are covered by byte-sensitive tests.
 *
 * Pure functions only. No provider calls, no network, no logging of secrets.
 * The password appears ONLY inside the encoded `text=` parameter of the
 * wa.me URL — never as a separate query parameter, never in a log.
 */

/** Student/parent handoff text (owner-directed, 7 slots). */
export const STUDENT_CREDENTIAL_TEMPLATE = [
  'Welcome to {{1}}!',
  '',
  'Dear Parent/Guardian,',
  '',
  'We are pleased to welcome {{2}} to our school. We look forward to supporting your child throughout their learning journey.',
  '',
  'Class: {{3}}',
  '',
  'Portal Details',
  'Web Portal: {{4}}',
  'Login ID: {{5}}',
  'Security Key: {{6}}',
  '',
  "Use these exact details in our app to check your child's daily work and important updates.",
  '',
  'App Link: {{7}}',
  '',
  'Please keep these details safe. For help accessing your account, contact the school office.',
  '',
  'Regards,',
  '{{1}}',
].join('\n');

/** Teacher handoff text (owner-directed, 6 slots). */
export const TEACHER_CREDENTIAL_TEMPLATE = [
  'Welcome to {{1}}, {{2}}!',
  '',
  'Your teacher portal account is ready. Use the details below to log in.',
  '',
  'Web Portal: {{3}}',
  'Username: {{4}}',
  'Password: {{5}}',
  '',
  'Use the same login details in our app for chat, class updates, and announcements. App Link: {{6}}',
  '',
  'Through the portal, you can view your timetable, mark attendance, enter exam results, check announcements, and manage your profile.',
  '',
  'For help, contact the school office.',
  '',
  'Regards,',
  '{{1}}',
].join('\n');

/** Staff handoff text (owner-drafted in the same structure + role slot, 7 slots). */
export const STAFF_CREDENTIAL_TEMPLATE = [
  'Welcome to {{1}}, {{2}}!',
  '',
  'Your staff account is ready. You have been appointed as {{3}} at our school.',
  '',
  'Use the details below to log in.',
  '',
  'Web Portal: {{4}}',
  'Username: {{5}}',
  'Password: {{6}}',
  '',
  'Use the same login details in our app for announcements, messages, and updates. App Link: {{7}}',
  '',
  'Through the portal, you can access your assigned modules, view your attendance, check announcements, and manage your profile.',
  '',
  'For help, contact the school office.',
  '',
  'Regards,',
  '{{1}}',
].join('\n');

export interface StudentCredentialValues {
  school: string;
  name: string;
  className: string;
  website: string;
  username: string;
  password: string;
  appUrl: string;
}

export interface TeacherCredentialValues {
  school: string;
  name: string;
  website: string;
  username: string;
  password: string;
  appUrl: string;
}

export interface StaffCredentialValues {
  school: string;
  name: string;
  designation: string;
  website: string;
  username: string;
  password: string;
  appUrl: string;
}

/** Substitute {{1}}..{{7}} into the student text. Exact wording preserved. */
export function buildStudentCredentialMessage(values: StudentCredentialValues): string {
  return STUDENT_CREDENTIAL_TEMPLATE
    .replaceAll('{{1}}', values.school)
    .replace('{{2}}', values.name)
    .replace('{{3}}', values.className)
    .replace('{{4}}', values.website)
    .replace('{{5}}', values.username)
    .replace('{{6}}', values.password)
    .replace('{{7}}', values.appUrl);
}

/** Substitute {{1}}..{{6}} into the teacher text. Exact wording preserved. */
export function buildTeacherCredentialMessage(values: TeacherCredentialValues): string {
  return TEACHER_CREDENTIAL_TEMPLATE
    .replaceAll('{{1}}', values.school)
    .replace('{{2}}', values.name)
    .replace('{{3}}', values.website)
    .replace('{{4}}', values.username)
    .replace('{{5}}', values.password)
    .replace('{{6}}', values.appUrl);
}

/** Substitute {{1}}..{{7}} into the staff text. Exact wording preserved. */
export function buildStaffCredentialMessage(values: StaffCredentialValues): string {
  return STAFF_CREDENTIAL_TEMPLATE
    .replaceAll('{{1}}', values.school)
    .replace('{{2}}', values.name)
    .replace('{{3}}', values.designation)
    .replace('{{4}}', values.website)
    .replace('{{5}}', values.username)
    .replace('{{6}}', values.password)
    .replace('{{7}}', values.appUrl);
}

/**
 * Mirrors server formatClassLabel (M19): the approved body already prints
 * "Class" before {{2}}, so one leading "Class" is stripped from the group name.
 */
export function formatClassLabel(groupName: string, section?: string | null): string {
  const name = groupName.trim().replace(/^class\s+/i, '').trim();
  return section?.trim() ? `${name} - ${section.trim()}` : name;
}

/**
 * Mirrors server normalizeWhatsAppPhone (M19): digits only, leading 0 → 92,
 * bare 10-digit → 92 prefix. Returns digits WITHOUT '+' for wa.me use.
 * Throws on empty/invalid input — fail closed, never guess a recipient.
 */
export function normalizePhoneDigits(phone: string): string {
  const trimmed = phone.trim();
  if (!trimmed) throw new Error('Phone number is required');
  let digits = trimmed.replace(/\D/g, '');
  if (digits.startsWith('0')) digits = `92${digits.slice(1)}`;
  if (digits.length === 10) digits = `92${digits}`;
  if (digits.length < 10 || digits.length > 15) throw new Error('Invalid phone number format');
  return digits;
}

/**
 * Build the manual-handoff URL. Password lives ONLY inside encoded text.
 */
export function buildWhatsAppUrl(digits: string, message: string): string {
  if (!digits || !/^\+?\d+$/.test(digits.replace(/^\+/, ''))) {
    throw new Error('Valid recipient digits are required');
  }
  const bare = digits.startsWith('+') ? digits.slice(1) : digits;
  return `https://wa.me/${bare}?text=${encodeURIComponent(message)}`;
}

const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const DIGITS = '0123456789';
const SPECIAL = '!@#$%^&*()_+-=[]{}|;:,.<>?';

/**
 * Cryptographically secure 12-char password (upper+lower+digit+special).
 * Uses crypto.getRandomValues — never Math.random.
 */
export function generateSecurePassword(): string {
  const cryptoObj: Crypto | undefined =
    typeof globalThis !== 'undefined' ? (globalThis as any).crypto : undefined;
  if (!cryptoObj?.getRandomValues) {
    throw new Error('Secure random number generator is unavailable');
  }
  const pick = (alphabet: string): string => {
    const buf = new Uint32Array(1);
    cryptoObj.getRandomValues(buf);
    return alphabet[buf[0] % alphabet.length];
  };
  const all = UPPER + LOWER + DIGITS + SPECIAL;
  const chars = [pick(UPPER), pick(LOWER), pick(DIGITS), pick(SPECIAL)];
  for (let i = 0; i < 8; i++) chars.push(pick(all));
  // Fisher–Yates with secure randomness
  for (let i = chars.length - 1; i > 0; i--) {
    const buf = new Uint32Array(1);
    cryptoObj.getRandomValues(buf);
    const j = buf[0] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}
