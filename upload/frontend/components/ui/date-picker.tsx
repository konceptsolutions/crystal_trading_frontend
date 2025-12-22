'use client';

import * as React from 'react';
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';

type DatePickerValue = string | undefined; // expected "yyyy-MM-dd"

export interface DatePickerProps {
  value?: DatePickerValue;
  onChange: (nextValue: DatePickerValue) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  popoverClassName?: string;
}

function safeParseISODate(value?: string) {
  if (!value) return undefined;
  // Expect yyyy-MM-dd
  const [y, m, d] = value.split('-').map((p) => Number(p));
  if (!y || !m || !d) return undefined;
  const dt = new Date(y, m - 1, d);
  return Number.isNaN(dt.getTime()) ? undefined : dt;
}

function toISODateString(d: Date) {
  return format(d, 'yyyy-MM-dd');
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  disabled = false,
  className = '',
  popoverClassName = '',
}: DatePickerProps) {
  const selected = safeParseISODate(value);
  const [open, setOpen] = React.useState(false);
  const [month, setMonth] = React.useState<Date>(() => selected ?? new Date());
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const buttonRef = React.useRef<HTMLButtonElement | null>(null);

  React.useEffect(() => {
    if (selected) setMonth(selected);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (!open) return;
      const el = rootRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const weeks = React.useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
    const days: Date[] = [];
    for (let d = start; d <= end; d = addDays(d, 1)) days.push(d);
    const rows: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) rows.push(days.slice(i, i + 7));
    return rows;
  }, [month]);

  const displayValue = selected ? format(selected, 'MM/dd/yyyy') : '';

  return (
    <div ref={rootRef} className={`relative w-full ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={[
          'flex h-10 w-full items-center justify-between rounded-lg border bg-white px-3 text-sm',
          'transition-all duration-200',
          'border-orange-300 hover:border-orange-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/20 focus-visible:border-orange-500',
          disabled ? 'cursor-not-allowed opacity-60 bg-gray-50' : '',
        ].join(' ')}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className={`${displayValue ? 'text-gray-900' : 'text-gray-400'}`}>
          {displayValue || placeholder}
        </span>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-4 w-4 text-gray-500"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3M4 11h16M6 21h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
        </svg>
      </button>

      <div
        className={[
          'absolute left-0 z-50 mt-2 w-[18.5rem] origin-top-left rounded-xl border border-gray-200 bg-white shadow-xl',
          'transition-all duration-200 ease-out',
          open ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' : 'opacity-0 -translate-y-1 scale-[0.98] pointer-events-none',
          popoverClassName,
        ].join(' ')}
        role="dialog"
        aria-label="Date picker"
      >
        <div className="flex items-center justify-between px-3 py-2 border-b bg-gray-50 rounded-t-xl">
          <button
            type="button"
            className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-gray-100 transition"
            onClick={() => setMonth((m) => subMonths(m, 1))}
            aria-label="Previous month"
          >
            ‹
          </button>
          <div className="text-sm font-semibold text-gray-900">{format(month, 'MMMM yyyy')}</div>
          <button
            type="button"
            className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-gray-100 transition"
            onClick={() => setMonth((m) => addMonths(m, 1))}
            aria-label="Next month"
          >
            ›
          </button>
        </div>

        <div className="px-3 py-3">
          <div className="grid grid-cols-7 gap-1 text-[11px] text-gray-500 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <div key={d} className="text-center font-medium">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {weeks.flat().map((day) => {
              const inMonth = isSameMonth(day, month);
              const isSelected = selected ? isSameDay(day, selected) : false;
              const today = isToday(day);

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => {
                    onChange(toISODateString(day));
                    setOpen(false);
                    buttonRef.current?.focus();
                  }}
                  className={[
                    'h-9 w-9 rounded-lg text-sm transition',
                    inMonth ? 'text-gray-900' : 'text-gray-400',
                    isSelected ? 'bg-primary-600 text-white hover:bg-primary-700' : 'hover:bg-gray-100',
                    today && !isSelected ? 'ring-1 ring-primary-400' : '',
                  ].join(' ')}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              className="text-xs text-gray-600 hover:text-gray-900 underline underline-offset-4"
              onClick={() => {
                const today = new Date();
                onChange(toISODateString(today));
                setMonth(today);
                setOpen(false);
                buttonRef.current?.focus();
              }}
            >
              Today
            </button>
            <button
              type="button"
              className="text-xs text-gray-600 hover:text-gray-900 underline underline-offset-4"
              onClick={() => {
                onChange(undefined);
                setOpen(false);
                buttonRef.current?.focus();
              }}
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


