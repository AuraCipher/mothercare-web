/**
 * M21 — Manual WhatsApp handoff helpers for the Students Operations drawer.
 *
 * Pure functions only. No provider calls, no network, no logging of secrets.
 * The password appears ONLY inside the encoded `text=` parameter of the
 * wa.me URL — never as a separate query parameter, never in a log.
 */

/** Approved student_wc body, constructed locally (M19-verified wording). */
export const STUDENT_CREDENTIAL_TEMPLATE = [
  'Dear Parent/Guardian,',
  '',
  'We are pleased to welcome you at our school.',
  '',
  'Your child has got admission in MCS.',
  '',
  'Student Details:',
  '',
  'Student name: {{1}}. He got admission in Class {{2}}.',
  '',
  'For more information you can visit to our website {{3}}',
  '',
  'Account details: {{4}} and {{5}}.',
  '',
  'In case of any confusion or problem, please contact the school office.',
  '',
  'Regards,',
  '',
  'Mother Care School',
].join('\n');

export interface StudentCredentialValues {
  name: string;
  className: string;
  website: string;
  username: string;
  password: string;
}

/** Substitute {{1}}..{{5}} into the approved template. Exact text preserved. */
export function buildStudentCredentialMessage(values: StudentCredentialValues): string {
  return STUDENT_CREDENTIAL_TEMPLATE
    .replace('{{1}}', values.name)
    .replace('{{2}}', values.className)
    .replace('{{3}}', values.website)
    .replace('{{4}}', values.username)
    .replace('{{5}}', values.password);
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
