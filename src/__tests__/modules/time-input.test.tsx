import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../helpers/test-utils';
import TimeInput from '@/components/time-input';

describe('TimeInput', () => {
  it('renders with placeholder', () => {
    render(<TimeInput value="" onChange={() => {}} />);
    expect(screen.getByPlaceholderText('HH:MM')).toBeInTheDocument();
  });

  it('shows current value', () => {
    render(<TimeInput value="12:40" onChange={() => {}} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('12:40');
  });

  it('formats 2 digits with trailing colon', () => {
    const onChange = vi.fn();
    render(<TimeInput value="" onChange={onChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '12' } });
    expect(onChange).toHaveBeenCalledWith('12:');
  });

  it('formats 3 digits as HH:M', () => {
    const onChange = vi.fn();
    render(<TimeInput value="" onChange={onChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '124' } });
    expect(onChange).toHaveBeenCalledWith('12:4');
  });

  it('formats 4 digits as HH:MM', () => {
    const onChange = vi.fn();
    render(<TimeInput value="" onChange={onChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '1240' } });
    expect(onChange).toHaveBeenCalledWith('12:40');
  });

  it('strips non-digits from input', () => {
    const onChange = vi.fn();
    render(<TimeInput value="" onChange={onChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '12:ab' } });
    expect(onChange).toHaveBeenCalledWith('12:');
  });

  it('calls onComplete when 4 digits entered', () => {
    const onComplete = vi.fn();
    const onChange = vi.fn();
    render(<TimeInput value="" onChange={onChange} onComplete={onComplete} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '1240' } });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('does not call onComplete for partial input', () => {
    const onComplete = vi.fn();
    render(<TimeInput value="" onChange={() => {}} onComplete={onComplete} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '12' } });
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('limits input to 4 digits', () => {
    const onChange = vi.fn();
    render(<TimeInput value="" onChange={onChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '12345' } });
    expect(onChange).toHaveBeenCalledWith('12:34');
  });

  it('formats 1 digit without colon', () => {
    const onChange = vi.fn();
    render(<TimeInput value="" onChange={onChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '1' } });
    expect(onChange).toHaveBeenCalledWith('1');
  });

  it('handles non-numeric input', () => {
    const onChange = vi.fn();
    render(<TimeInput value="" onChange={onChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'abcd' } });
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('handles mixed input', () => {
    const onChange = vi.fn();
    render(<TimeInput value="" onChange={onChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '1a2b3c' } });
    expect(onChange).toHaveBeenCalledWith('12:3');
  });

  it('renders with custom placeholder', () => {
    render(<TimeInput value="" onChange={() => {}} placeholder="Custom" />);
    expect(screen.getByPlaceholderText('Custom')).toBeInTheDocument();
  });

  it('has inputMode numeric', () => {
    render(<TimeInput value="" onChange={() => {}} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('inputMode', 'numeric');
  });
});
