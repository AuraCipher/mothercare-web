import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../helpers/test-utils';
import LoginPage from '@/app/login/page';

const mockPush = vi.hoisted(() => vi.fn());
const mockReplace = vi.hoisted(() => vi.fn());
const mockLogin = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

vi.mock('@/lib/api', () => ({
  api: {
    login: (...args: any[]) => mockLogin(...args),
    mePermissions: vi.fn().mockResolvedValue({ data: { isRestricted: false } }),
  },
}));

vi.mock('@/lib/staff-permissions', () => ({
  firstAllowedPath: () => '/admin',
}));

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });
Object.defineProperty(window, 'location', {
  value: { search: '' },
  writable: true,
});

const errorCases = [
  { msg: 'Student login is disabled after graduation', expected: /closed after graduation/i },
  { msg: 'disabled after graduation', expected: /closed after graduation/i },
  { msg: 'student Disabled after graduation due to policy', expected: /closed after graduation/i },
  { msg: 'not enrolled in any active academic year', expected: /No active academic-year enrollment/i },
  { msg: 'Student is not enrolled in any active academic year', expected: /No active academic-year enrollment/i },
];

describe('Login page stress interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  for (let run = 1; run <= 20; run += 1) {
    for (const c of errorCases) {
      it(`error mapping flow run=${run} msg="${c.msg.slice(0, 24)}"`, async () => {
        mockLogin.mockRejectedValueOnce(new Error(c.msg));
        render(<LoginPage />);

        fireEvent.change(screen.getByLabelText(/Username, email, or phone/i), { target: { value: 'student01' } });
        fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'pass123' } });
        fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

        expect(await screen.findByText(c.expected)).toBeInTheDocument();
      });
    }
  }

  for (let run = 1; run <= 20; run += 1) {
    it(`success login flow run=${run}`, async () => {
      mockLogin.mockResolvedValueOnce({
        success: true,
        token: `tok-${run}`,
        user: { role: 'teacher' },
      });

      render(<LoginPage />);
      fireEvent.change(screen.getByLabelText(/Username, email, or phone/i), { target: { value: 'teacher01' } });
      fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'pass123' } });
      fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

      await waitFor(() => expect(mockPush).toHaveBeenCalled());
      expect(localStorageMock.getItem('token')).toBe(`tok-${run}`);
    });
  }
});
