import { forwardRef } from 'react';
import { cn } from '../../utils/cn';

export interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  name: string;
  error?: string;
  helperText?: string;
  label?: string;
  className?: string;
}

const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(
  (
    { options, value, onChange, name, error, helperText, label, className },
    ref
  ) => {
    return (
      <div className={cn('w-full', className)} ref={ref}>
        {label && (
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            {label}
          </label>
        )}
        <div className='space-y-2'>
          {options.map(option => (
            <div key={option.value} className='flex items-center space-x-2'>
              <input
                id={`${name}-${option.value}`}
                type='radio'
                name={name}
                value={option.value}
                checked={value === option.value}
                onChange={e => onChange?.(e.target.value)}
                disabled={option.disabled}
                className={cn(
                  'h-4 w-4 border-gray-300 text-blue-600',
                  'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                  error && 'border-red-500 focus:ring-red-500'
                )}
              />
              <label
                htmlFor={`${name}-${option.value}`}
                className={cn(
                  'text-sm font-medium text-gray-700',
                  option.disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {option.label}
              </label>
            </div>
          ))}
        </div>
        {error && <p className='mt-1 text-sm text-red-600'>{error}</p>}
        {helperText && !error && (
          <p className='mt-1 text-sm text-gray-500'>{helperText}</p>
        )}
      </div>
    );
  }
);

RadioGroup.displayName = 'RadioGroup';

export { RadioGroup };
