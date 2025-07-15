import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const spinnerVariants = cva('spinner border-transparent', {
  variants: {
    size: {
      xs: 'h-3 w-3 border',
      sm: 'h-4 w-4 border',
      md: 'h-6 w-6 border-2',
      lg: 'h-8 w-8 border-2',
      xl: 'h-12 w-12 border-4',
    },
    color: {
      primary: 'border-t-primary-600',
      secondary: 'border-t-secondary-600',
      white: 'border-t-white',
    },
  },
  defaultVariants: {
    size: 'md',
    color: 'primary',
  },
});

interface LoadingSpinnerProps extends VariantProps<typeof spinnerVariants> {
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size,
  color,
  className,
}) => {
  return (
    <div
      className={cn(spinnerVariants({ size, color }), className)}
      role='status'
      aria-label='Loading'
    >
      <span className='sr-only'>Loading...</span>
    </div>
  );
};
