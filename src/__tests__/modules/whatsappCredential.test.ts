import { describe, expect, test, vi } from 'vitest';
import {
  STUDENT_CREDENTIAL_TEMPLATE,
  buildStudentCredentialMessage,
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

describe('buildStudentCredentialMessage', () => {
  const values = {
    name: 'Ali Khan',
    className: '3 - A',
    website: 'https://mothercareschool.pk',
    username: 'ali_khan',
    password: 'Xk9mP2qR!aB1',
  };

  test('substitutes all five slots, no placeholders remain', () => {
    const msg = buildStudentCredentialMessage(values);
    expect(msg).not.toContain('{{');
    expect(msg).toContain('Student name: Ali Khan. He got admission in Class 3 - A.');
    expect(msg).toContain('website https://mothercareschool.pk');
    expect(msg).toContain('Account details: ali_khan and Xk9mP2qR!aB1.');
  });

  test('preserves approved wording byte-for-byte around slots', () => {
    const msg = buildStudentCredentialMessage({ ...values, name: 'N', className: 'C', website: 'W', username: 'U', password: 'P' });
    expect(msg).toBe(STUDENT_CREDENTIAL_TEMPLATE
      .replace('{{1}}', 'N').replace('{{2}}', 'C').replace('{{3}}', 'W')
      .replace('{{4}}', 'U').replace('{{5}}', 'P'));
  });

  test.each([
    ['Urdu name', 'علی خان', 'علی خان'],
    ['ampersand', 'A&B', 'A&B'],
    ['percent/question/hash', '100%?#ok', '100%?#ok'],
    ['multiline-safe class', '8 - CS', '8 - CS'],
  ])('handles %s', (_label, input, expected) => {
    const msg = buildStudentCredentialMessage({ ...values, name: input });
    expect(msg).toContain(expected);
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
  const msg = buildStudentCredentialMessage({
    name: 'علی خان', className: '3 - A', website: 'https://mothercareschool.pk',
    username: 'ali&khan?#1', password: 'P%ss#1?',
  });

  test('wa.me form with fully encoded text', () => {
    const url = buildWhatsAppUrl('923001234567', msg);
    expect(url.startsWith('https://wa.me/923001234567?text=')).toBe(true);
    const text = decodeURIComponent(url.split('?text=')[1]);
    expect(text).toBe(msg);
  });

  test('no unencoded specials outside structure; password only inside text', () => {
    const url = buildWhatsAppUrl('923001234567', msg);
    const [, query] = url.split('?');
    expect(query.startsWith('text=')).toBe(true);
    expect(query).not.toContain('&');
    expect(query).not.toContain('#');
    // password appears exactly once and only inside the text param
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
