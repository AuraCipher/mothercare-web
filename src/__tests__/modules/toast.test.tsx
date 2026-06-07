import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import ToastContainer, { showToast } from '@/components/toast';

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing when no toasts', () => {
    const { container } = render(<ToastContainer />);
    expect(container.innerHTML).toBe('');
  });

  it('renders a toast when showToast is called', () => {
    render(<ToastContainer />);
    act(() => { showToast('success', 'Branch created'); });
    expect(screen.getByText('Branch created')).toBeInTheDocument();
  });

  it('renders multiple toasts', () => {
    render(<ToastContainer />);
    act(() => { showToast('success', 'First toast'); });
    act(() => { showToast('error', 'Second toast'); });
    expect(screen.getByText('First toast')).toBeInTheDocument();
    expect(screen.getByText('Second toast')).toBeInTheDocument();
  });

  it('removes toast after 4 seconds', () => {
    render(<ToastContainer />);
    act(() => { showToast('success', 'Auto dismiss'); });
    expect(screen.getByText('Auto dismiss')).toBeInTheDocument();

    // Advance time by 4 seconds
    act(() => { vi.advanceTimersByTime(4000); });
    expect(screen.queryByText('Auto dismiss')).not.toBeInTheDocument();
  });

  it('manually dismisses toast on X button click', () => {
    render(<ToastContainer />);
    act(() => { showToast('info', 'Dismiss me'); });

    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);
    expect(screen.queryByText('Dismiss me')).not.toBeInTheDocument();
  });

  it('renders success toast with green check icon', () => {
    const { container } = render(<ToastContainer />);
    act(() => { showToast('success', 'Success!'); });
    // The success icon has text-green-400 class
    const icon = container.querySelector('.text-green-400');
    expect(icon).toBeTruthy();
  });

  it('renders error toast with red icon', () => {
    const { container } = render(<ToastContainer />);
    act(() => { showToast('error', 'Error!'); });
    const icon = container.querySelector('.text-red-400');
    expect(icon).toBeTruthy();
  });

  it('renders info toast with warm-accent icon', () => {
    const { container } = render(<ToastContainer />);
    act(() => { showToast('info', 'Info!'); });
    const icon = container.querySelector('.text-warm-accent');
    expect(icon).toBeTruthy();
  });
});
