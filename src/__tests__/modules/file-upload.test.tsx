import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../helpers/test-utils';
import userEvent from '@testing-library/user-event';

const mockShowToast = vi.hoisted(() => vi.fn());
vi.mock('@/components/toast', () => ({ showToast: mockShowToast }));

import FileUpload from '@/components/file-upload';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

const localStorageMock = (() => {
  const store: Record<string, string> = { token: 'test-jwt' };
  return { getItem: (key: string) => store[key] || null, setItem: () => {}, removeItem: () => {}, clear: () => {} };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('FileUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    URL.revokeObjectURL = vi.fn();
    mockFetch.mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(['x'], { type: 'image/jpeg' })),
    });
  });

  it('renders upload area when no value', () => {
    render(<FileUpload value={null} onChange={() => {}} />);
    expect(screen.getByText('Upload Photo')).toBeInTheDocument();
  });

  it('renders image preview when value is provided', async () => {
    render(<FileUpload value="file-123" onChange={() => {}} />);
    await waitFor(() => {
      expect(screen.getByRole('img')).toBeInTheDocument();
    });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/uploads/file-123'),
      expect.any(Object),
    );
  });

  it('shows remove button when image is present', async () => {
    render(<FileUpload value="file-123" onChange={() => {}} />);
    await waitFor(() => {
      expect(screen.getByRole('img')).toBeInTheDocument();
    });
    const removeBtn = document.querySelector('button');
    expect(removeBtn).toBeInTheDocument();
  });

  it('calls onChange with null when remove is clicked', async () => {
    const onChange = vi.fn();
    render(<FileUpload value="file-123" onChange={onChange} />);
    await waitFor(() => {
      expect(screen.getByRole('img')).toBeInTheDocument();
    });
    const removeBtn = document.querySelector('button');
    fireEvent.click(removeBtn!);
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('handles upload error gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Upload failed'));
    const onChange = vi.fn();
    render(<FileUpload value={null} onChange={onChange} />);
    const user = userEvent.setup();

    const file = new File(['dummy'], 'photo.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]')!;
    await user.upload(input as HTMLElement, file);

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('error', expect.any(String));
    });
  });
});
