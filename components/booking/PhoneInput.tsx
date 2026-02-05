// components/booking/PhoneInput.tsx
// Phone number input with automatic US formatting
// Formats as (XXX) XXX-XXXX as user types

'use client';

import { Phone } from 'lucide-react';
import { useCallback, useState } from 'react';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  id?: string;
  className?: string;
  error?: string;
  helperText?: string;
}

// Format phone number as user types
function formatPhoneNumber(input: string): string {
  // Strip all non-numeric characters
  const cleaned = input.replace(/\D/g, '');

  // Limit to 10 digits
  const limited = cleaned.slice(0, 10);

  // Format based on length
  if (limited.length === 0) {
    return '';
  } else if (limited.length <= 3) {
    return `(${limited}`;
  } else if (limited.length <= 6) {
    return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
  } else {
    return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
  }
}

// Extract raw digits from formatted number
function getDigits(formatted: string): string {
  return formatted.replace(/\D/g, '');
}

export function PhoneInput({
  value,
  onChange,
  placeholder = '(555) 123-4567',
  required = false,
  id,
  className = '',
  error,
  helperText,
}: PhoneInputProps) {
  const [focused, setFocused] = useState(false);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatPhoneNumber(e.target.value);
      onChange(formatted);
    },
    [onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow backspace to work naturally
      if (e.key === 'Backspace') {
        const digits = getDigits(value);
        if (digits.length > 0) {
          const newDigits = digits.slice(0, -1);
          const formatted = formatPhoneNumber(newDigits);
          e.preventDefault();
          onChange(formatted);
        }
      }
    },
    [value, onChange]
  );

  const isValid = getDigits(value).length === 10;
  const showSuccess = isValid && !focused && value.length > 0;

  return (
    <div className="space-y-1">
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          <Phone
            className={`h-4 w-4 transition-colors ${
              error
                ? 'text-rose-400'
                : showSuccess
                ? 'text-green-400'
                : focused
                ? 'text-cyan-400'
                : 'text-slate-500'
            }`}
          />
        </div>
        <input
          type="tel"
          id={id}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          required={required}
          autoComplete="tel"
          inputMode="tel"
          className={`
            w-full rounded-lg border bg-slate-900 pl-11 pr-4 py-3
            text-slate-100 placeholder-slate-500
            transition-colors
            focus:outline-none focus:ring-2
            ${
              error
                ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/50'
                : showSuccess
                ? 'border-green-500/50 focus:border-green-500 focus:ring-green-500/50'
                : 'border-slate-600 focus:border-cyan-500 focus:ring-cyan-500/50'
            }
            ${className}
          `}
        />
        {showSuccess && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <svg
              className="h-4 w-4 text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-rose-400">{error}</p>}
      {helperText && !error && (
        <p className="text-xs text-slate-500">{helperText}</p>
      )}
    </div>
  );
}
