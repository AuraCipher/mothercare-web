'use client';

import { forwardRef, useCallback } from 'react';

interface TimeInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: () => void;
  placeholder?: string;
  className?: string;
}

/**
 * Smart time input that auto-formats as the user types.
 *
 * - Strips non-digits, auto-inserts ":" after the 2nd digit
 * - Calls onComplete when 4 digits are entered (HHMM → "HH:MM")
 * - Auto-selects all text on focus for quick overwrite
 *
 * Flow: "" → "1" → "12:" → "12:4" → "12:40" (onComplete fires)
 */
const TimeInput = forwardRef<HTMLInputElement, TimeInputProps>(
  ({ value, onChange, onComplete, placeholder = 'HH:MM', className }, ref) => {
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        // Strip non-digits, keep max 4
        const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
        let formatted = digits;
        if (digits.length >= 3) {
          formatted = digits.slice(0, 2) + ':' + digits.slice(2);
        } else if (digits.length === 2) {
          formatted = digits + ':';
        }
        onChange(formatted);
        // Auto-tab to next field when time is complete (4 digits entered)
        if (digits.length === 4 && onComplete) {
          onComplete();
        }
      },
      [onChange, onComplete],
    );

    const handleFocus = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        e.target.select();
      },
      [],
    );

    return (
      <input
        ref={ref}
        type="text"
        inputMode="numeric"
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        placeholder={placeholder}
        maxLength={5}
        className={className}
      />
    );
  },
);

TimeInput.displayName = 'TimeInput';

export default TimeInput;
