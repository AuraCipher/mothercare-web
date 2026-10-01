import { describe, expect, test, vi } from 'vitest';
import {
  STUDENT_CREDENTIAL_TEMPLATE,
  TEACHER_CREDENTIAL_TEMPLATE,
  STAFF_CREDENTIAL_TEMPLATE,
  buildStudentCredentialMessage,
  buildTeacherCredentialMessage,
  buildStaffCredentialMessage,
  buildWhatsAppUrl,
  formatClassLabel,
  generateSecurePassword,
  normalizePhoneDigits,
} from '@/lib/whatsappCredential';

describe('generateSecurePassword', () => {
  test('produces 12 chars with all required classes', () => {
    for (let i = 0; i < 25; i++) {
      const pw = generateSecurePassword();
      expect(pw).toHaveLength(12);
      expect(pw).toMatch(/[A-Z]/);
      expect(pw).toMatch(/[a-z]/);
      expect(pw).toMatch(/[0-9]/);
      expect(pw).toMatch(/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/);
    }
  });

  test('produces distinct values', () => {
    const set = new Set(Array.from({ length: 20 }, () => generateSecurePassword()));
    expect(set.size).toBeGreaterThan(1);
  });

  test('uses crypto.getRandomValues, not Math.random', () => {
    const spy = vi.spyOn(Math, 'random');
    generateSecurePassword();
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe('buildStudentCredentialMessage (7 slots)', () => {
  const values = {
    school: 'Test School',
    name: 'Ali Khan',
    className: '3 - A',
    website: 'https://school.test',
    username: 'ali_khan',
    password: 'Xk9mP2qR!aB1',
    appUrl: 'https://school.test/app',
  };

  test('substitutes all seven slots, no placeholders remain', () => {
    const msg = buildStudentCredentialMessage(values);
    expect(msg).not.toContain('{{');
    expect(msg).toContain('Welcome to Test School!');
    expect(msg).toContain('We are pleased to welcome Ali Khan to our school.');
    expect(msg).toContain('Class: 3 - A');
    expect(msg).toContain('Web Portal: https://school.test');
    expect(msg).toContain('Login ID: ali_khan');
    expect(msg).toContain('Security Key: Xk9mP2qR!aB1');
    expect(msg).toContain('App Link: https://school.test/app');
    expect(msg.endsWith('Regards,\nTest School')).toBe(true);
  });

  test.each([
    ['Urdu name', 'علی خان'],
    ['ampersand', 'A&B'],
    ['percent/question/hash', '100%?#ok'],
  ])('handles %s', (_label, input) => {
    const msg = buildStudentCredentialMessage({ ...values, name: input });
    expect(msg).toContain(input);
  });
});

describe('buildTeacherCredentialMessage (6 slots)', () => {
  const values = {
    school: 'Test School',
    name: 'Rubina Bibi',
    website: 'https://school.test',
    username: 'rubina_bibi',
    password: 'Xk9mP2qR!aB1',
    appUrl: 'https://school.test/app',
  };

  test('exact variable order: school, name, website, username, password, app', () => {
    const msg = buildTeacherCredentialMessage(values);
    expect(msg).not.toContain('{{');
    expect(msg).toContain('Welcome to Test School, Rubina Bibi!');
    expect(msg).toContain('Web Portal: https://school.test');
    expect(msg).toContain('Username: rubina_bibi');
    expect(msg).toContain('Password: Xk9mP2qR!aB1');
    expect(msg).toContain('App Link: https://school.test/app');
    expect(msg).not.toContain('{{5}}');
  });

  test('byte/order-sensitive mapping', () => {
    const msg = buildTeacherCredentialMessage({ ...values, name: 'N', website: 'W', username: 'U', password: 'P', school: 'S', appUrl: 'A' });
    expect(msg).toBe(TEACHER_CREDENTIAL_TEMPLATE
      .replaceAll('{{1}}', 'S').replace('{{2}}', 'N').replace('{{3}}', 'W')
      .replace('{{4}}', 'U').replace('{{5}}', 'P').replace('{{6}}', 'A'));
  });
});

describe('buildStaffCredentialMessage (7 slots incl. designation)', () => {
  const values = {
    school: 'Test School',
    name: 'Ahmed Raza',
    designation: 'Accountant',
    website: 'https://school.test',
    username: 'ahmed_raza',
    password: 'Xk9mP2qR!aB1',
    appUrl: 'https://school.test/app',
  };

  test('exact variable order: school, name, designation, website, username, password, app', () => {
    const msg = buildStaffCredentialMessage(values);
    expect(msg).not.toContain('{{');
    expect(msg).toContain('Welcome to Test School, Ahmed Raza!');
    expect(msg).toContain('appointed as Accountant');
    expect(msg).toContain('Web Portal: https://school.test');
    expect(msg).toContain('Username: ahmed_raza');
    expect(msg).toContain('Password: Xk9mP2qR!aB1');
    expect(msg).toContain('App Link: https://school.test/app');
  });

  test('byte/order-sensitive mapping', () => {
    const msg = buildStaffCredentialMessage({ ...values, school: 'S', name: 'N', designation: 'D', website: 'W', username: 'U', password: 'P', appUrl: 'A' });
    expect(msg).toBe(STAFF_CREDENTIAL_TEMPLATE
      .replaceAll('{{1}}', 'S').replace('{{2}}', 'N').replace('{{3}}', 'D')
      .replace('{{4}}', 'W').replace('{{5}}', 'U').replace('{{6}}', 'P').replace('{{7}}', 'A'));
  });

  test.each([
    ['Urdu designation', 'اکاؤنٹنٹ'],
    ['ampersand name', 'A&B'],
  ])('handles %s', (_label, input) => {
    const msg = buildStaffCredentialMessage({ ...values, designation: input });
    expect(msg).toContain(input);
  });
});

describe('formatClassLabel', () => {
  test('strips one leading Class and appends section', () => {
    expect(formatClassLabel('Class 3', 'A')).toBe('3 - A');
  });
  test('matches server cases', () => {
    expect(formatClassLabel('class 10', null)).toBe('10');
    expect(formatClassLabel('Playgroup', null)).toBe('Playgroup');
    expect(formatClassLabel('Classroom Juniors', 'B')).toBe('Classroom Juniors - B');
  });
});

describe('normalizePhoneDigits', () => {
  test.each([
    ['03001234567', '923001234567'],
    ['923001234567', '923001234567'],
    ['+92 300 123 4567', '923001234567'],
    ['0300-123-4567', '923001234567'],
    ['3001234567', '923001234567'],
  ])('%s → %s', (input, expected) => {
    expect(normalizePhoneDigits(input)).toBe(expected);
  });

  test('throws on empty/invalid', () => {
    expect(() => normalizePhoneDigits('')).toThrow();
    expect(() => normalizePhoneDigits('123')).toThrow();
  });
});

describe('buildWhatsAppUrl', () => {
  const msg = buildTeacherCredentialMessage({
    school: 'Test School', name: 'علی خان', website: 'https://school.test',
    username: 'ali&khan?#1', password: 'P%ss#1?', appUrl: 'https://school.test/app',
  });

  test('wa.me form with fully encoded text', () => {
    const url = buildWhatsAppUrl('923001234567', msg);
    expect(url.startsWith('https://wa.me/923001234567?text=')).toBe(true);
    expect(decodeURIComponent(url.split('?text=')[1])).toBe(msg);
  });

  test('no unencoded specials outside structure; password only inside text', () => {
    const url = buildWhatsAppUrl('923001234567', msg);
    const [, query] = url.split('?');
    expect(query.startsWith('text=')).toBe(true);
    expect(query).not.toContain('&');
    expect(query).not.toContain('#');
    const text = decodeURIComponent(query.slice('text='.length));
    expect(text.split('P%ss#1?').length - 1).toBe(1);
  });

  test('newlines survive round-trip', () => {
    const url = buildWhatsAppUrl('923001234567', 'a\nb');
    expect(decodeURIComponent(url.split('?text=')[1])).toBe('a\nb');
  });

  test('rejects bad digits', () => {
    expect(() => buildWhatsAppUrl('', msg)).toThrow();
    expect(() => buildWhatsAppUrl('abc', msg)).toThrow();
  });
});
