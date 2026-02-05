// components/booking/PhoneInput.tsx
// Phone number input with automatic US formatting (light theme)
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
  const cleaned = input.replace(/\D/g, '');
  const limited = cleaned.slice(0, 10);

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
                ? 'text-red-400'
                : showSuccess
                ? 'text-emerald-500'
                : focused
                ? 'text-cyan-600'
                : 'text-slate-400'
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
            w-full rounded-xl border bg-white pl-11 pr-4 py-3
            text-slate-900 placeholder-slate-400
            transition-colors min-h-[48px]
            focus:outline-none focus:ring-2
            ${
              error
                ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                : showSuccess
                ? 'border-emerald-300 focus:border-emerald-500 focus:ring-emerald-200'
                : 'border-slate-200 focus:border-cyan-500 focus:ring-cyan-200'
            }
            ${className}
          `}
        />
        {showSuccess && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <svg
              className="h-4 w-4 text-emerald-500"
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

      {error && <p className="text-sm text-red-600">{error}</p>}
      {helperText && !error && (
        <p className="text-xs text-slate-400">{helperText}</p>
      )}
    </div>
  );
}
