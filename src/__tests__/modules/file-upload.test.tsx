import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../helpers/test-utils';
import userEvent from '@testing-library/user-event';

const mockShowToast = vi.hoisted(() => vi.fn());
vi.mock('@/components/toast', () => ({ showToast: mockShowToast }));

import FileUpload from '@/components/file-upload';

// Mock fetch globally
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

const localStorageMock = (() => {
  let store: Record<string, string> = { token: 'test-jwt' };
  return { getItem: (key: string) => store[key] || null, setItem: () => {}, removeItem: () => {}, clear: () => {} };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('FileUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders upload area when no value', () => {
    render(<FileUpload value={null} onChange={() => {}} />);
    expect(screen.getByText('Upload Photo')).toBeInTheDocument();
  });

  it('renders image preview when value is provided', () => {
    render(<FileUpload value="file-123" onChange={() => {}} />);
    const img = screen.getByRole('img') as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.src).toContain('/api/uploads/file-123');
  });

  it('shows remove button when image is present', () => {
    render(<FileUpload value="file-123" onChange={() => {}} />);
    const removeBtn = document.querySelector('button');
    expect(removeBtn).toBeInTheDocument();
  });

  it('calls onChange with null when remove is clicked', async () => {
    const onChange = vi.fn();
    render(<FileUpload value="file-123" onChange={onChange} />);
    const removeBtn = document.querySelector('button');
    fireEvent.click(removeBtn!);
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('handles upload error gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('Upload failed'));
    const onChange = vi.fn();
    render(<FileUpload value={null} onChange={onChange} />);
    const user = userEvent.setup();

    const file = new File(['dummy'], 'photo.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]')!;
    await user.upload(input, file);

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('error', expect.any(String));
    });
  });
});
