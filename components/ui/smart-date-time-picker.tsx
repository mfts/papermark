import { useCallback, useEffect, useId, useRef } from "react";

import {
  cn,
  formatDateTime,
  getDateTimeLocal,
  parseDateTime,
} from "@/lib/utils";

interface SmartDateTimePickerProps {
  value: Date | null | undefined;
  onChange: (date: Date | null) => void;
  onComplete?: (date: Date | null) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  required?: boolean;
  autoFocus?: boolean;
  options?: Intl.DateTimeFormatOptions;
  formatValue?: (date: Date | null) => string;
  showCalendarIcon?: boolean;
}

export function SmartDateTimePicker({
  value,
  onChange,
  onComplete,
  label,
  placeholder = 'E.g. "tomorrow at 5pm" or "in 2 hours"',
  className,
  required,
  autoFocus = false,
  options,
  formatValue,
  showCalendarIcon = true,
}: SmartDateTimePickerProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const formatDisplayValue = useCallback(
    (date: Date | null | undefined) => {
      if (!date) return "";
      return formatValue ? formatValue(date) : formatDateTime(date);
    },
    [formatValue],
  );

  const updateInputValue = useCallback(
    (date: Date | null | undefined) => {
      if (inputRef.current) {
        inputRef.current.value = formatDisplayValue(date);
      }
    },
    [formatDisplayValue],
  );

  const handleDateChange = useCallback(
    (date: Date | null) => {
      onChange(date);
      updateInputValue(date);
    },
    [onChange, updateInputValue],
  );

  const handleInputBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      if (e.target.value.length > 0) {
        const parsedDateTime = parseDateTime(e.target.value);
        if (parsedDateTime) {
          handleDateChange(parsedDateTime);
          onComplete?.(parsedDateTime);
        }
      } else {
        handleDateChange(null);
        onComplete?.(null);
      }
    },
    [handleDateChange, onComplete],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && inputRef.current) {
        e.preventDefault();
        const parsedDateTime = parseDateTime(inputRef.current.value);
        if (parsedDateTime) {
          handleDateChange(parsedDateTime);
          onComplete?.(parsedDateTime);
        }
      }
    },
    [handleDateChange, onComplete],
  );

  const handleCalendarChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const date = new Date(e.target.value);
      if (!isNaN(date.getTime())) {
        handleDateChange(date);
        onComplete?.(date);
      }
    },
    [handleDateChange, onComplete],
  );

  // Handle autofocus
  useEffect(() => {
    if (inputRef.current && autoFocus) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 10);
    }
  }, [autoFocus]);

  useEffect(() => {
    updateInputValue(value);
  }, [value, updateInputValue]);

  return (
    <div className={className}>
      {label && (
        <div className="flex items-center gap-2">
          <label
            htmlFor={`${id}-datetime`}
            className="block text-sm font-medium text-neutral-700"
          >
            {label}
          </label>
        </div>
      )}
      <div
        className={cn(
          "mt-2 flex w-full items-center justify-between rounded-md border border-neutral-300",
          "bg-white shadow-sm transition-all focus-within:border-neutral-800",
          "focus-within:outline-none focus-within:ring-1 focus-within:ring-neutral-500",
        )}
      >
        <input
          ref={inputRef}
          id={`${id}-datetime`}
          type="text"
          placeholder={placeholder}
          defaultValue={formatDisplayValue(value)}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          onChange={(e) => {
            inputRef.current!.value = e.target.value;
          }}
          className="flex-1 border-none bg-transparent text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-0 sm:text-sm"
        />
        {showCalendarIcon && (
          <input
            type="datetime-local"
            id={`${id}-datetime-local`}
            required={required}
            value={value ? getDateTimeLocal(value) : ""}
            onChange={handleCalendarChange}
            className="w-[40px] border-none bg-transparent text-neutral-500 focus:outline-none focus:ring-0 sm:text-sm"
          />
        )}
      </div>
    </div>
  );
}
