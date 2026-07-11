import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/* ═══════════════════════════════════════════════
 * Hoisted mocks — vi.hoisted() ensures these are
 * available before the hoisted vi.mock() calls.
 * ═══════════════════════════════════════════════ */

const { mockLogin, mockPush } = vi.hoisted(() => ({
  mockLogin: vi.fn(),
  mockPush: vi.fn(),
}));

const mockApi = vi.hoisted(() => ({
  api: {
    login: mockLogin,
    me: vi.fn().mockResolvedValue({ success: true, user: { id: '1', name: 'Admin', role: 'super_admin' } }),
    refresh: vi.fn(),
    meBranches: vi.fn().mockResolvedValue({ success: true, data: [] }),
  },
}));

/* ═══════════════════════════════════════════════
 * Module mocks
 * ═══════════════════════════════════════════════ */

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/login',
}));

vi.mock('@/lib/api', () => mockApi);

import LoginPage from '@/app/login/page';

/* ═══════════════════════════════════════════════
 * Tests
 * ═══════════════════════════════════════════════ */

describe('Auth Navigation — Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'location', {
      value: { search: '', pathname: '/login' },
      writable: true,
    });
    localStorage.clear();
  });

  it('renders the sign-in form', () => {
    render(<LoginPage />);
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your identifier')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
    expect(screen.getByText('Stay signed in')).toBeInTheDocument();
  });

  it('shows error when identifier is empty', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    await user.click(screen.getByText('Sign In'));
    expect(screen.getByText('Enter your username, email, or phone')).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('redirects to /admin on successful login for branch_admin role', async () => {
    mockLogin.mockResolvedValueOnce({
      success: true,
      token: 'test-token-123',
      user: { id: '1', name: 'Test', role: 'branch_admin' },
    });

    const lsSpy = vi.spyOn(Storage.prototype, 'setItem');
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText('Enter your identifier'), 'admin');
    await user.type(screen.getByPlaceholderText('Enter your password'), 'admin123');
    await user.click(screen.getByText('Sign In'));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin', 'admin123');
    });

    expect(lsSpy).toHaveBeenCalledWith('token', 'test-token-123');
    expect(mockPush).toHaveBeenCalledWith('/admin');
  });

  it('redirects to /ceo on successful login for super_admin role', async () => {
    mockLogin.mockResolvedValueOnce({
      success: true,
      token: 'test-token-ceo',
      user: { id: '2', name: 'CEO', role: 'super_admin' },
    });

    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText('Enter your identifier'), 'ceo');
    await user.type(screen.getByPlaceholderText('Enter your password'), 'ceo123');
    await user.click(screen.getByText('Sign In'));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/ceo');
    });
  });

  it('redirects to the original route when redirect param is present', async () => {
    Object.defineProperty(window, 'location', {
      value: { search: '?redirect=%2Fadmin%2Fbranches', pathname: '/login' },
      writable: true,
    });

    mockLogin.mockResolvedValueOnce({
      success: true,
      token: 'test-token-456',
      user: { id: '1', name: 'Test', role: 'super_admin' },
    });

    const user = userEvent.setup();
    render(<LoginPage />);
    await user.type(screen.getByPlaceholderText('Enter your identifier'), 'admin');
    await user.type(screen.getByPlaceholderText('Enter your password'), 'admin123');
    await user.click(screen.getByText('Sign In'));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin/branches');
    });
  });

  it('disables submit button while loading', async () => {
    mockLogin.mockReturnValueOnce(new Promise(() => {}));
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText('Enter your identifier'), 'admin');
    await user.type(screen.getByPlaceholderText('Enter your password'), 'admin123');
    await user.click(screen.getByText('Sign In'));

    await waitFor(() => {
      expect(screen.getByText('Signing in…')).toBeDisabled();
    });
  });

  it('displays network error on failed request', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Network error'));
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText('Enter your identifier'), 'admin');
    await user.type(screen.getByPlaceholderText('Enter your password'), 'admin123');
    await user.click(screen.getByText('Sign In'));

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });
});

