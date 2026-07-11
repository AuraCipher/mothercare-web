import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../helpers/test-utils';
import AvatarImage from '@/components/avatar-image';

const localStorageMock = (() => {
  const store: Record<string, string> = { token: 'test-jwt' };
  return { getItem: (key: string) => store[key] || null, setItem: () => {}, removeItem: () => {}, clear: () => {} };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe('AvatarImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(['x'], { type: 'image/jpeg' })),
    });
    URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    URL.revokeObjectURL = vi.fn();
  });

  it('renders fallback text when no fileId', () => {
    render(<AvatarImage fileId={null} />);
    expect(screen.getByText('No Photo')).toBeInTheDocument();
  });

  it('renders initial letter fallback when provided', () => {
    render(<AvatarImage fileId={null} fallback="S" />);
    expect(screen.getByText('S')).toBeInTheDocument();
  });

  it('renders img tag when fileId is provided', async () => {
    render(<AvatarImage fileId="file-123" alt="Teacher photo" />);
    await waitFor(() => {
      expect(screen.getByAltText('Teacher photo')).toBeInTheDocument();
    });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/uploads/file-123'),
      expect.objectContaining({ headers: { Authorization: 'Bearer test-jwt' } }),
    );
  });

  it('applies custom className', async () => {
    render(<AvatarImage fileId="file-123" className="custom-class" alt="test" />);
    await waitFor(() => {
      expect(screen.getByAltText('test')).toHaveClass('custom-class');
    });
  });
});
