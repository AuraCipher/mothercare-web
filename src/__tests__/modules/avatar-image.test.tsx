import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../helpers/test-utils';
import AvatarImage from '@/components/avatar-image';

const localStorageMock = (() => {
  let store: Record<string, string> = { token: 'test-jwt' };
  return { getItem: (key: string) => store[key] || null, setItem: () => {}, removeItem: () => {}, clear: () => {} };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('AvatarImage', () => {
  it('renders fallback text when no fileId', () => {
    render(<AvatarImage fileId={null} />);
    expect(screen.getByText('No Photo')).toBeInTheDocument();
  });

  it('renders initial letter fallback when provided', () => {
    render(<AvatarImage fileId={null} fallback="S" />);
    expect(screen.getByText('S')).toBeInTheDocument();
  });

  it('renders img tag when fileId is provided', () => {
    render(<AvatarImage fileId="file-123" alt="Teacher photo" />);
    const img = screen.getByAltText('Teacher photo') as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.src).toContain('/api/uploads/file-123');
  });

  it('applies custom className', () => {
    render(<AvatarImage fileId="file-123" className="custom-class" alt="test" />);
    expect(screen.getByAltText('test')).toHaveClass('custom-class');
  });
});
