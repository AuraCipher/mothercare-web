import { describe, expect, test, vi, beforeEach } from 'vitest';
import { performManualHandoff } from '@/lib/manualHandoff';

const save = { website: 'https://school.test', schoolName: 'S', appUrl: 'https://school.test/app' };
const buildMessage = () => 'hello parent';

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', vi.fn());
});

describe('performManualHandoff', () => {
  test('opens blank synchronously, navigates on success', async () => {
    const popup = { closed: false, close: vi.fn(), location: { href: '' } };
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(popup as any);
    vi.mocked(fetch).mockResolvedValue({ json: async () => ({ success: true, data: save }) } as any);

    const res = await performManualHandoff({
      saveUrl: 'http://x/save-credential', token: 't',
      body: { password: 'P1', adminPassword: 'A', replaceExisting: false, idempotencyKey: 'k' },
      buildMessage, rawPhone: '03001234567',
    });

    expect(openSpy).toHaveBeenCalledWith('about:blank', '_blank');
    expect(res.status).toBe('opened');
    if (res.status === 'opened') {
      expect(res.url.startsWith('https://wa.me/923001234567?text=')).toBe(true);
      expect(popup.location.href).toBe(res.url);
    }
    const sent = JSON.parse(String((vi.mocked(fetch).mock.calls[0]?.[1] as any)?.body ?? '{}'));
    expect(sent).toMatchObject({ password: 'P1', replaceExisting: false, idempotencyKey: 'k' });
    openSpy.mockRestore();
  });

  test('blocked popup returns same url without second save', async () => {
    vi.spyOn(window, 'open').mockReturnValue(null);
    vi.mocked(fetch).mockResolvedValue({ json: async () => ({ success: true, data: save }) } as any);

    const res = await performManualHandoff({
      saveUrl: 'http://x/save-credential', token: 't',
      body: { password: 'P1', adminPassword: 'A', replaceExisting: true },
      buildMessage, rawPhone: '03001234567',
    });

    expect(res.status).toBe('blocked');
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
    if (res.status === 'blocked') {
      expect(res.url.startsWith('https://wa.me/923001234567?text=')).toBe(true);
    }
    (window.open as any).mockRestore?.();
  });

  test('failure closes popup and preserves code', async () => {
    const popup = { closed: false, close: vi.fn(), location: { href: '' } };
    vi.spyOn(window, 'open').mockReturnValue(popup as any);
    vi.mocked(fetch).mockResolvedValue({
      json: async () => ({ success: false, code: 'PASSWORD_REPLACEMENT_REQUIRED', message: 'Confirm replacement.' }),
    } as any);

    const res = await performManualHandoff({
      saveUrl: 'http://x/save-credential', token: 't',
      body: { password: 'P1', adminPassword: 'A', replaceExisting: false },
      buildMessage, rawPhone: '03001234567',
    });

    expect(res).toMatchObject({ status: 'failed', code: 'PASSWORD_REPLACEMENT_REQUIRED' });
    expect(popup.close).toHaveBeenCalled();
    expect(popup.location.href).toBe('');
    (window.open as any).mockRestore?.();
  });

  test('network error fails closed', async () => {
    vi.spyOn(window, 'open').mockReturnValue({ closed: false, close: vi.fn(), location: { href: '' } } as any);
    vi.mocked(fetch).mockRejectedValue(new Error('down'));

    const res = await performManualHandoff({
      saveUrl: 'http://x/save-credential', token: null,
      body: { password: 'P1', adminPassword: 'A', replaceExisting: false },
      buildMessage, rawPhone: '03001234567',
    });

    expect(res.status).toBe('failed');
    (window.open as any).mockRestore?.();
  });
});
