/**
 * Shared CredentialDrawer tests — student / teacher / staff variants.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import CredentialDrawer, { CredentialDrawerPerson } from '@/components/credential-drawer';

vi.mock('@/components/toast', () => ({ showToast: vi.fn() }));

const student: CredentialDrawerPerson = {
  id: 's1', type: 'student', name: 'Ali Khan', username: 'ali_khan',
  phone: '03001234567', classLabel: '3 - A', designation: null,
  hasExistingPassword: false,
  saveUrl: 'http://localhost:5000/admin/students/s1/save-credential',
  branchId: 'b1',
};

const teacher: CredentialDrawerPerson = {
  id: 't1', type: 'teacher', name: 'Rubina Bibi', username: 'rubina_bibi',
  phone: '03007654321', classLabel: null, designation: null,
  hasExistingPassword: true,
  saveUrl: 'http://localhost:5000/admin/teachers/t1/save-credential',
  branchId: 'b1',
};

const staff: CredentialDrawerPerson = {
  id: 'u9', type: 'staff', name: 'Ahmed Raza', username: 'ahmed_raza',
  phone: '03001112222', classLabel: null, designation: 'Accountant',
  hasExistingPassword: false,
  saveUrl: 'http://localhost:5000/admin/staff/u9/save-credential',
  branchId: 'b1',
};

function renderOpen(person: CredentialDrawerPerson, onClose = vi.fn(), onSaved = vi.fn()) {
  const trigger = document.createElement('button');
  document.body.appendChild(trigger);
  const ref = { current: trigger } as React.RefObject<HTMLButtonElement | null>;
  const utils = render(<CredentialDrawer person={person} open={true} onClose={onClose} triggerRef={ref} onSaved={onSaved} />);
  return { ...utils, onClose, onSaved, trigger };
}

const saveOk = {
  success: true,
  data: {
    website: 'https://school.test', schoolName: 'Test School', appUrl: 'https://school.test/app',
    credentialSentAt: '2026-09-30T00:00:00.000Z', credentialGeneratedAt: '2026-09-30T00:00:00.000Z',
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  localStorage.setItem('token', 'test-token');
  vi.stubGlobal('fetch', vi.fn());
  document.body.innerHTML = '';
});

describe('variants', () => {
  it('student shows class row, teacher does not, staff shows designation', () => {
    const { unmount } = renderOpen(student);
    expect(screen.getByText('Student Credentials')).toBeInTheDocument();
    expect(screen.getByText('3 - A')).toBeInTheDocument();
    unmount();
    renderOpen(teacher);
    expect(screen.getByText('Teacher Credentials')).toBeInTheDocument();
    expect(screen.queryByText('Class')).not.toBeInTheDocument();
  });

  it('staff shows designation + masked phone', () => {
    renderOpen(staff);
    expect(screen.getByText('Staff Credentials')).toBeInTheDocument();
    expect(screen.getByText('Accountant')).toBeInTheDocument();
    expect(screen.getByText('0300****22')).toBeInTheDocument();
  });

  it('gates Generate without username; student also needs class', () => {
    renderOpen({ ...student, username: null });
    expect(screen.getByRole('button', { name: /Generate/ })).toBeDisabled();
    expect(screen.getByText(/Username and class are required/)).toBeInTheDocument();
  });
});

describe('generate + eye + escape', () => {
  it('generates masked password; eye toggles with aria state', async () => {
    renderOpen(teacher);
    await userEvent.click(screen.getByRole('button', { name: /Generate/ }));
    expect(screen.getByText('••••••••••••')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(screen.getByRole('button', { name: 'Hide password' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('Escape calls onClose; X too', async () => {
    const { onClose } = renderOpen(student);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('returns focus to trigger on unmount after close', async () => {
    const { trigger, onClose } = renderOpen(student);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
    expect(trigger).toBeDefined();
  });
});

describe('replacement + save per type', () => {
  async function generateAndSave(hasExisting: boolean) {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({ json: async () => saveOk } as any);
    const popup = { closed: false, close: vi.fn(), location: { href: '' } };
    vi.spyOn(window, 'open').mockReturnValue(popup as any);
    return { fetchMock, popup };
  }

  it('teacher existing → confirm → Yes → save navigates with 6-slot message', async () => {
    const { fetchMock, popup } = await generateAndSave(true);
    const onSaved = vi.fn();
    renderOpen(teacher, vi.fn(), onSaved);
    await userEvent.click(screen.getByRole('button', { name: /Generate/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Save & Send' }));
    await waitFor(() => expect(screen.getByText('Password already exists')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Yes, Replace' }));
    await userEvent.type(screen.getByPlaceholderText('Your password'), 'AdminPass123!');
    await userEvent.click(screen.getByRole('button', { name: 'Confirm Save' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const body = JSON.parse(String((fetchMock.mock.calls[0]?.[1] as any)?.body ?? '{}'));
    expect(body.replaceExisting).toBe(true);
    const text = decodeURIComponent((popup.location.href.split('?text=')[1] || ''));
    expect(text).toContain('Welcome to Test School, Rubina Bibi!');
    expect(text).toContain('Username: rubina_bibi');
    expect(onSaved).toHaveBeenCalledWith('t1', expect.objectContaining({ credentialStatus: 'sent' }));
    (window.open as any).mockRestore?.();
  });

  it('staff existing-via-409 → confirm → Yes → save navigates with designation', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce({ json: async () => ({ success: false, code: 'PASSWORD_REPLACEMENT_REQUIRED' }) } as any)
      .mockResolvedValueOnce({ json: async () => saveOk } as any);
    const popup = { closed: false, close: vi.fn(), location: { href: '' } };
    vi.spyOn(window, 'open').mockReturnValue(popup as any);
    renderOpen({ ...staff, hasExistingPassword: false });
    await userEvent.click(screen.getByRole('button', { name: /Generate/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Save & Send' }));
    await userEvent.type(screen.getByPlaceholderText('Your password'), 'AdminPass123!');
    await userEvent.click(screen.getByRole('button', { name: 'Confirm Save' }));
    await waitFor(() => expect(screen.getByText('Password already exists')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Yes, Replace' }));
    await userEvent.type(screen.getByPlaceholderText('Your password'), 'AdminPass123!');
    await userEvent.click(screen.getByRole('button', { name: 'Confirm Save' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const second = JSON.parse(String((fetchMock.mock.calls[1]?.[1] as any)?.body ?? '{}'));
    expect(second.replaceExisting).toBe(true);
    const text = decodeURIComponent((popup.location.href.split('?text=')[1] || ''));
    expect(text).toContain('appointed as Accountant');
    (window.open as any).mockRestore?.();
  });

  it('Cancel performs zero mutations and keeps password', async () => {
    renderOpen(teacher);
    await userEvent.click(screen.getByRole('button', { name: /Generate/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Save & Send' }));
    await waitFor(() => expect(screen.getByText('Password already exists')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'No, Cancel' }));
    await waitFor(() => expect(screen.queryByText('Password already exists')).not.toBeInTheDocument());
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
    expect(screen.getByText('••••••••••••')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('blocked popup shows fallback link with same URL, single save', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({ json: async () => saveOk } as any);
    vi.spyOn(window, 'open').mockReturnValue(null);
    renderOpen(student);
    await userEvent.click(screen.getByRole('button', { name: /Generate/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Save & Send' }));
    await userEvent.type(screen.getByPlaceholderText('Your password'), 'AdminPass123!');
    await userEvent.click(screen.getByRole('button', { name: 'Confirm Save' }));
    await waitFor(() => expect(screen.getByText(/could not be opened automatically/)).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const href = screen.getByRole('link', { name: 'Open WhatsApp' }).getAttribute('href') || '';
    expect(href.startsWith('https://wa.me/923001234567?text=')).toBe(true);
    expect(decodeURIComponent(href.split('?text=')[1])).toContain('We are pleased to welcome Ali Khan');
    (window.open as any).mockRestore?.();
  });

  it('never emits provider-shaped requests', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({ json: async () => saveOk } as any);
    vi.spyOn(window, 'open').mockReturnValue({ closed: false, close: vi.fn(), location: { href: '' } } as any);
    renderOpen(student);
    await userEvent.click(screen.getByRole('button', { name: /Generate/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Save & Send' }));
    await userEvent.type(screen.getByPlaceholderText('Your password'), 'AdminPass123!');
    await userEvent.click(screen.getByRole('button', { name: 'Confirm Save' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    for (const call of fetchMock.mock.calls) {
      expect(String(call[0])).not.toMatch(/twilio|send-credentials|Messages\.json|ContentSid/i);
    }
    (window.open as any).mockRestore?.();
  });
});
