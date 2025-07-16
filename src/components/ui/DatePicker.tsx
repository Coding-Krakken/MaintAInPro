import React, { useState, useRef, useEffect } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from 'date-fns';

const datePickerVariants = cva('relative', {
  variants: {
    variant: {
      default: '',
      inline: 'border border-input rounded-md p-3',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const datePickerInputVariants = cva(
  'flex w-full border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'rounded-md',
        ghost: 'border-0 bg-transparent focus-visible:ring-1',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const calendarVariants = cva(
  'absolute z-50 mt-2 rounded-md border bg-popover p-3 text-popover-foreground shadow-md',
  {
    variants: {
      position: {
        default: 'left-0 top-full',
        right: 'right-0 top-full',
        center: 'left-1/2 top-full transform -translate-x-1/2',
      },
    },
    defaultVariants: {
      position: 'default',
    },
  }
);

export interface DatePickerProps
  extends VariantProps<typeof datePickerVariants> {
  value?: Date | undefined;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  calendarClassName?: string;
  minDate?: Date;
  maxDate?: Date;
  position?: 'default' | 'right' | 'center';
  showTime?: boolean;
  format?: string;
}

const DatePicker = React.forwardRef<HTMLDivElement, DatePickerProps>(
  (
    {
      value,
      onChange,
      placeholder = 'Select date',
      disabled,
      variant,
      className,
      inputClassName,
      calendarClassName,
      minDate,
      maxDate,
      position = 'default',
      showTime = false,
      format: dateFormat = 'MMM dd, yyyy',
      ...props
    },
    _ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(value || new Date());
    const containerRef = useRef<HTMLDivElement>(null);

    const handleInputClick = () => {
      if (!disabled) {
        setIsOpen(!isOpen);
      }
    };

    const handleInputKeyDown = (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleInputClick();
      }
    };

    const handleDateSelect = (date: Date) => {
      if (minDate && date < minDate) return;
      if (maxDate && date > maxDate) return;

      onChange?.(date);
      if (!showTime) {
        setIsOpen(false);
      }
    };

    const handleMonthChange = (direction: 'prev' | 'next') => {
      setCurrentMonth(
        direction === 'prev'
          ? subMonths(currentMonth, 1)
          : addMonths(currentMonth, 1)
      );
    };

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [isOpen]);

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    const calendarDays = eachDayOfInterval({
      start: calendarStart,
      end: calendarEnd,
    });

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div
        ref={containerRef}
        className={cn(datePickerVariants({ variant }), className)}
        {...props}
      >
        <div
          className={cn(
            datePickerInputVariants(),
            'cursor-pointer',
            disabled && 'cursor-not-allowed',
            inputClassName
          )}
          onClick={handleInputClick}
          onKeyDown={handleInputKeyDown}
          role='button'
          tabIndex={disabled ? -1 : 0}
          aria-expanded={isOpen}
          aria-haspopup='dialog'
        >
          <span className={cn('flex-1', !value && 'text-muted-foreground')}>
            {value ? format(value, dateFormat) : placeholder}
          </span>
          <CalendarIcon className='h-4 w-4 text-muted-foreground' />
        </div>

        {isOpen && (
          <div
            className={cn(calendarVariants({ position }), calendarClassName)}
            role='dialog'
            aria-modal='true'
          >
            <div className='flex items-center justify-between mb-4'>
              <button
                type='button'
                onClick={() => handleMonthChange('prev')}
                className='p-1 hover:bg-muted rounded-md'
              >
                <ChevronLeftIcon className='h-4 w-4' />
              </button>
              <h2 className='text-sm font-medium'>
                {format(currentMonth, 'MMMM yyyy')}
              </h2>
              <button
                type='button'
                onClick={() => handleMonthChange('next')}
                className='p-1 hover:bg-muted rounded-md'
              >
                <ChevronRightIcon className='h-4 w-4' />
              </button>
            </div>

            <div className='grid grid-cols-7 gap-1 mb-2'>
              {weekDays.map(day => (
                <div
                  key={day}
                  className='text-xs text-muted-foreground text-center p-2 font-medium'
                >
                  {day}
                </div>
              ))}
            </div>

            <div className='grid grid-cols-7 gap-1'>
              {calendarDays.map(day => {
                const isSelected = value && isSameDay(day, value);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isDayToday = isToday(day);
                const isDisabled =
                  (minDate && day < minDate) || (maxDate && day > maxDate);

                return (
                  <button
                    key={day.toISOString()}
                    type='button'
                    onClick={() => handleDateSelect(day)}
                    disabled={isDisabled}
                    className={cn(
                      'p-2 text-sm rounded-md hover:bg-muted transition-colors',
                      !isCurrentMonth && 'text-muted-foreground',
                      isSelected &&
                        'bg-primary text-primary-foreground hover:bg-primary',
                      isDayToday && !isSelected && 'bg-muted',
                      isDisabled && 'cursor-not-allowed opacity-30'
                    )}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';

export { DatePicker, datePickerVariants };
