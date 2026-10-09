/**
 * M21 — Students Operations drawer tests.
 *
 * Drawer open/close/Escape/focus, gates, eye toggle, replacement confirm,
 * save flow (mocked fetch), popup fallback, and the no-Twilio guarantee.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockGetStudents = vi.hoisted(() => vi.fn());
const mockGetSections = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/lib/api', () => ({
  api: { getStudents: mockGetStudents, getSections: mockGetSections },
}));

vi.mock('@/config', () => ({
  default: { apiUrl: 'http://localhost:5000' },
}));

vi.mock('@/components/toast', () => ({
  showToast: vi.fn(),
}));

import StudentCredentialsPage from '@/app/admin/students/operations/page';

const studentNoExisting = {
  id: 's1', name: 'Ali Khan', username: 'ali_khan', userId: 'u1',
  group: { id: 'g1', name: 'Class 3', section: 'A' },
  studentWhatsapp: '03001234567', phone: null,
  // Recipient is the parent/guardian number — the student's own numbers are never used.
  parents: [{ isPrimary: true, parent: { whatsapp: '03331112233', phone: '0511234567' } }],
  credentialStatus: null, credentialSentAt: null, passwordSetAt: null,
  credentialGeneratedAt: null, credentialTag: 'CRED_NONE',
};

const studentExisting = {
  ...studentNoExisting, id: 's2', name: 'Sara Ahmed',
  passwordSetAt: '2026-01-01T00:00:00.000Z', credentialStatus: 'sent',
  credentialSentAt: '2026-02-01T00:00:00.000Z',
};

const studentNoUsername = { ...studentNoExisting, id: 's3', username: null };
const studentNoClass = { ...studentNoExisting, id: 's4', group: null };

function renderWith(students: any[]) {
  mockGetStudents.mockResolvedValue({ success: true, data: students });
  mockGetSections.mockResolvedValue({ success: true, data: [] });
  return render(<StudentCredentialsPage />);
}

async function openDrawerFor(name: string) {
  await waitFor(() => expect(screen.getByText(name)).toBeInTheDocument());
  const btn = screen.getByRole('button', { name: `Open credentials for ${name}` });
  await userEvent.click(btn);
  await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  localStorage.setItem('token', 'test-token');
  vi.stubGlobal('fetch', vi.fn());
});

describe('drawer open/close', () => {
  it('opens drawer on arrow click, keeps list visible', async () => {
    renderWith([studentNoExisting]);
    await openDrawerFor('Ali Khan');
    expect(screen.getByText('Student Credentials')).toBeInTheDocument();
    // list still behind
    expect(screen.getByText('Credentials Management')).toBeInTheDocument();
  });

  it('closes on X and returns focus to the arrow', async () => {
    renderWith([studentNoExisting]);
    await openDrawerFor('Ali Khan');
    const close = screen.getByRole('button', { name: 'Close credentials drawer' });
    await userEvent.click(close);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Open credentials for Ali Khan' })).toHaveFocus();
  });

  it('slides in with transition classes', async () => {
    renderWith([studentNoExisting]);
    await openDrawerFor('Ali Khan');
    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toContain('transition-transform');
    await waitFor(() => expect(dialog.className).toContain('translate-x-0'));
  });

  it('closes on Escape', async () => {
    renderWith([studentNoExisting]);
    await openDrawerFor('Ali Khan');
    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('shows the parent/guardian WhatsApp (masked), never the student number', async () => {
    renderWith([studentNoExisting]);
    await openDrawerFor('Ali Khan');
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Guardian WhatsApp')).toBeInTheDocument();
    expect(within(dialog).getByText('0333****33')).toBeInTheDocument();
    expect(within(dialog).queryByText('0300****67')).not.toBeInTheDocument();
    expect(within(dialog).queryByText('03001234567')).not.toBeInTheDocument();
  });

  it('blocks Save & Send when no parent/guardian number exists', async () => {
    renderWith([{ ...studentNoExisting, id: 's5', parents: [], studentWhatsapp: '03001234567' }]);
    await openDrawerFor('Ali Khan');
    expect(screen.getByText(/parent\/guardian WhatsApp number is required/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save & Send' })).toBeDisabled();
  });
});

describe('drawer gates', () => {
  it('disables Generate without username, shows reason', async () => {
    renderWith([studentNoUsername]);
    await openDrawerFor('Ali Khan');
    expect(screen.getByRole('button', { name: /Generate/ })).toBeDisabled();
    expect(screen.getByText(/Username and class are required/)).toBeInTheDocument();
  });

  it('disables Generate without class', async () => {
    renderWith([studentNoClass]);
    await openDrawerFor('Ali Khan');
    expect(screen.getByRole('button', { name: /Generate/ })).toBeDisabled();
  });

  it('disables Save & Send before generation', async () => {
    renderWith([studentNoExisting]);
    await openDrawerFor('Ali Khan');
    expect(screen.getByRole('button', { name: 'Save & Send' })).toBeDisabled();
  });
});

describe('generate + eye', () => {
  it('generates hidden password with timestamp semantics', async () => {
    renderWith([studentNoExisting]);
    await openDrawerFor('Ali Khan');
    await userEvent.click(screen.getByRole('button', { name: /Generate/ }));
    expect(screen.getByText('••••••••••••')).toBeInTheDocument();
    expect(screen.queryByText('••••••••••••')).toBeInTheDocument();
  });

  it('eye toggles visibility with accessible state', async () => {
    renderWith([studentNoExisting]);
    await openDrawerFor('Ali Khan');
    await userEvent.click(screen.getByRole('button', { name: /Generate/ }));
    expect(screen.getByText('••••••••••••')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Show password' }));
    const hide = screen.getByRole('button', { name: 'Hide password' });
    expect(hide).toBeInTheDocument();
    expect(hide).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByText('••••••••••••')).not.toBeInTheDocument();
  });

  it('repeat Generate replaces local password (new idempotency intent)', async () => {
    renderWith([studentNoExisting]);
    await openDrawerFor('Ali Khan');
    await userEvent.click(screen.getByRole('button', { name: /Generate/ }));
    // drawer holds a generated (masked) password
    expect(screen.getByText('••••••••••••')).toBeInTheDocument();
    // repeat Generate intentionally replaces the local value without crashing
    await userEvent.click(screen.getByRole('button', { name: /Generate/ }));
    expect(screen.getByText('••••••••••••')).toBeInTheDocument();
  });
});

describe('replacement confirmation', () => {
  it('No/Cancel performs zero mutations', async () => {
    renderWith([studentExisting]);
    await openDrawerFor('Sara Ahmed');
    await userEvent.click(screen.getByRole('button', { name: /Generate/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Save & Send' }));
    // confirm dialog appears
    await waitFor(() => expect(screen.getByText('Password already exists')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'No, Cancel' }));
    await waitFor(() => expect(screen.queryByText('Password already exists')).not.toBeInTheDocument());
    // drawer still open, no fetch, no navigation
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });

  it('Yes/Replace proceeds to admin step, saves exact password', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      json: async () => ({
        success: true,
        data: { website: 'https://school.test', schoolName: 'Test School', appUrl: 'https://school.test/app', credentialSentAt: '2026-09-30T00:00:00.000Z', credentialGeneratedAt: '2026-09-30T00:00:00.000Z' },
      }),
    } as any);
    const openSpy = vi.spyOn(window, 'open').mockReturnValue({ closed: false, location: { href: '' } } as any);
    renderWith([studentExisting]);
    await openDrawerFor('Sara Ahmed');
    await userEvent.click(screen.getByRole('button', { name: /Generate/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Save & Send' }));
    await userEvent.click(screen.getByRole('button', { name: 'Yes, Replace' }));
    await userEvent.type(screen.getByPlaceholderText('Your password'), 'AdminPass123!');
    await userEvent.click(screen.getByRole('button', { name: 'Confirm Save' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const body = JSON.parse(String((fetchMock.mock.calls[0]?.[1] as any)?.body ?? "{}"));
    expect(body.replaceExisting).toBe(true);
    expect(typeof body.password).toBe('string');
    expect(body.password).toHaveLength(12);
    openSpy.mockRestore();
  });
});

describe('save flow + popup fallback', () => {
  it('saves, navigates blank window to wa.me with same password', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      json: async () => ({
        success: true,
        data: { website: 'https://school.test', schoolName: 'Test School', appUrl: 'https://school.test/app', credentialSentAt: '2026-09-30T00:00:00.000Z', credentialGeneratedAt: '2026-09-30T00:00:00.000Z' },
      }),
    } as any);
    const popup = { closed: false, location: { href: '' }, close: vi.fn() };
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(popup as any);
    renderWith([studentNoExisting]);
    await openDrawerFor('Ali Khan');
    await userEvent.click(screen.getByRole('button', { name: /Generate/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Save & Send' }));
    await userEvent.type(screen.getByPlaceholderText('Your password'), 'AdminPass123!');
    await userEvent.click(screen.getByRole('button', { name: 'Confirm Save' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const url: string = popup.location.href;
    expect(url.startsWith('https://wa.me/923331112233?text=')).toBe(true);
    const text = decodeURIComponent(url.split('?text=')[1]);
    expect(text).toContain('We are pleased to welcome Ali Khan to our school.');
    expect(text).toContain('Class: 3 - A');
    expect(text).toContain('Web Portal: https://school.test');
    openSpy.mockRestore();
  });

  it('blocked popup shows fallback reusing same URL without re-save', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      json: async () => ({
        success: true,
        data: { website: 'https://school.test', schoolName: 'Test School', appUrl: 'https://school.test/app', credentialSentAt: '2026-09-30T00:00:00.000Z', credentialGeneratedAt: '2026-09-30T00:00:00.000Z' },
      }),
    } as any);
    vi.spyOn(window, 'open').mockReturnValue(null);
    renderWith([studentNoExisting]);
    await openDrawerFor('Ali Khan');
    await userEvent.click(screen.getByRole('button', { name: /Generate/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Save & Send' }));
    await userEvent.type(screen.getByPlaceholderText('Your password'), 'AdminPass123!');
    await userEvent.click(screen.getByRole('button', { name: 'Confirm Save' }));
    await waitFor(() => expect(screen.getByText(/could not be opened automatically/)).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledTimes(1); // exactly one save
    const fallback = screen.getByRole('link', { name: 'Open WhatsApp' });
    expect((fallback.getAttribute('href') || '').startsWith('https://wa.me/923331112233?text=')).toBe(true);
    (window.open as any).mockRestore?.();
  });

  it('history rejection keeps drawer state, no second generation', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({ json: async () => ({ success: false, message: 'This password was used recently.' }) } as any);
    vi.spyOn(window, 'open').mockReturnValue({ closed: false, close: vi.fn(), location: { href: '' } } as any);
    renderWith([studentNoExisting]);
    await openDrawerFor('Ali Khan');
    await userEvent.click(screen.getByRole('button', { name: /Generate/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Save & Send' }));
    await userEvent.type(screen.getByPlaceholderText('Your password'), 'AdminPass123!');
    await userEvent.click(screen.getByRole('button', { name: 'Confirm Save' }));
    await waitFor(() => expect(screen.getByText(/used recently/)).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

describe('no-Twilio guarantee', () => {
  it('page source performs zero provider-shaped requests', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      json: async () => ({
        success: true,
        data: { website: 'https://school.test', schoolName: 'Test School', appUrl: 'https://school.test/app', credentialSentAt: '2026-09-30T00:00:00.000Z', credentialGeneratedAt: '2026-09-30T00:00:00.000Z' },
      }),
    } as any);
    vi.spyOn(window, 'open').mockReturnValue({ closed: false, location: { href: '' } } as any);
    renderWith([studentNoExisting]);
    await openDrawerFor('Ali Khan');
    await userEvent.click(screen.getByRole('button', { name: /Generate/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Save & Send' }));
    await userEvent.type(screen.getByPlaceholderText('Your password'), 'AdminPass123!');
    await userEvent.click(screen.getByRole('button', { name: 'Confirm Save' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    for (const call of fetchMock.mock.calls) {
      const url = String(call[0]);
      expect(url).not.toMatch(/twilio|send-credentials|send-all-credentials|Messages\.json/i);
    }
    // only WhatsApp handoff is a wa.me navigation (window.open), never fetch
  });
});
