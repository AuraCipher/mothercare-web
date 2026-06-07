import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmModal from '@/components/confirm-modal';

describe('ConfirmModal', () => {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when closed', () => {
    const { container } = render(
      <ConfirmModal open={false} title="Test" message="Test message" onConfirm={onConfirm} onCancel={onCancel} />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders title and message when open', () => {
    render(
      <ConfirmModal open={true} title="Delete?" message="Are you sure?" onConfirm={onConfirm} onCancel={onCancel} />,
    );
    expect(screen.getByText('Delete?')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('renders default confirm label', () => {
    render(
      <ConfirmModal open={true} title="Test" message="Msg" onConfirm={onConfirm} onCancel={onCancel} />,
    );
    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });

  it('renders custom confirm label', () => {
    render(
      <ConfirmModal open={true} title="Test" message="Msg" confirmLabel="Delete" onConfirm={onConfirm} onCancel={onCancel} />,
    );
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('renders custom cancel label', () => {
    render(
      <ConfirmModal open={true} title="Test" message="Msg" cancelLabel="Go Back" onConfirm={onConfirm} onCancel={onCancel} />,
    );
    expect(screen.getByText('Go Back')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button clicked', () => {
    render(
      <ConfirmModal open={true} title="Test" message="Msg" onConfirm={onConfirm} onCancel={onCancel} />,
    );
    fireEvent.click(screen.getByText('Confirm'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button clicked', () => {
    render(
      <ConfirmModal open={true} title="Test" message="Msg" onConfirm={onConfirm} onCancel={onCancel} />,
    );
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when backdrop clicked', () => {
    render(
      <ConfirmModal open={true} title="Test" message="Msg" onConfirm={onConfirm} onCancel={onCancel} />,
    );
    // The outermost div is the backdrop
    const backdrop = screen.getByRole('dialog').parentElement!;
    fireEvent.click(backdrop);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('does not call onCancel when modal content clicked', () => {
    render(
      <ConfirmModal open={true} title="Test" message="Msg" onConfirm={onConfirm} onCancel={onCancel} />,
    );
    // Click the modal itself (not the backdrop)
    const dialog = screen.getByRole('dialog');
    fireEvent.click(dialog);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('disables buttons when loading', () => {
    render(
      <ConfirmModal open={true} title="Test" message="Msg" loading={true} onConfirm={onConfirm} onCancel={onCancel} />,
    );
    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });

  it('shows "Processing…" when loading', () => {
    render(
      <ConfirmModal open={true} title="Test" message="Msg" loading={true} onConfirm={onConfirm} onCancel={onCancel} />,
    );
    expect(screen.getByText('Processing…')).toBeInTheDocument();
  });

  it('has correct aria attributes', () => {
    render(
      <ConfirmModal open={true} title="Delete?" message="Msg" onConfirm={onConfirm} onCancel={onCancel} />,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'confirm-title');
  });

  it('renders AlertTriangle icon for danger variant', () => {
    const { container } = render(
      <ConfirmModal open={true} title="Test" message="Msg" variant="danger" onConfirm={onConfirm} onCancel={onCancel} />,
    );
    // The icon svg should be inside a danger-styled div
    const iconContainer = container.querySelector('.text-red-400');
    expect(iconContainer).toBeTruthy();
  });

  it('calls onCancel on Escape key', () => {
    render(
      <ConfirmModal open={true} title="Test" message="Msg" onConfirm={onConfirm} onCancel={onCancel} />,
    );
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
