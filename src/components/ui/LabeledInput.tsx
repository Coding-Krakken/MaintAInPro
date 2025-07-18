import React from 'react';
import { Input, InputProps } from './Input';
import { cn } from '@/utils/cn';

interface LabeledInputProps extends InputProps {
  label?: string;
  error?: string;
  helperText?: string;
}

const LabeledInput = React.forwardRef<HTMLInputElement, LabeledInputProps>(
  ({ label, error, helperText, className, ...props }, ref) => {
    return (
      <div className='w-full'>
        {label && (
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            {label}
          </label>
        )}
        <Input
          ref={ref}
          className={cn(
            error && 'border-red-500 focus:ring-red-500',
            className
          )}
          {...props}
        />
        {error && <p className='mt-1 text-sm text-red-600'>{error}</p>}
        {helperText && !error && (
          <p className='mt-1 text-sm text-gray-500'>{helperText}</p>
        )}
      </div>
    );
  }
);

LabeledInput.displayName = 'LabeledInput';

export { LabeledInput };
export type { LabeledInputProps };
