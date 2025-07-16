import React from 'react';
import { useForm, FieldValues, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/utils/cn';

// Form root component
interface FormProps<T extends FieldValues> {
  children: React.ReactNode;
  onSubmit: SubmitHandler<T>;
  schema: z.ZodSchema<T>;
  defaultValues?: Partial<T>;
  className?: string;
}

function Form<T extends FieldValues>({
  children,
  onSubmit,
  schema,
  defaultValues,
  className,
}: FormProps<T>) {
  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as never,
  });

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className={cn('space-y-6', className)}
    >
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { ...form } as Record<
            string,
            unknown
          >);
        }
        return child;
      })}
    </form>
  );
}

// Form field wrapper component
interface FormFieldProps {
  name: string;
  label?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  error?: string;
}

function FormField({
  name,
  label,
  description,
  children,
  className,
  error,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label
          htmlFor={name}
          className='block text-sm font-medium text-secondary-700'
        >
          {label}
        </label>
      )}

      {children}

      {description && (
        <p className='text-sm text-secondary-500'>{description}</p>
      )}

      {error && <p className='text-sm text-error-600'>{error}</p>}
    </div>
  );
}

// Form message component
interface FormMessageProps {
  children: React.ReactNode;
  variant?: 'error' | 'success' | 'warning';
}

function FormMessage({ children, variant = 'error' }: FormMessageProps) {
  const variantClasses = {
    error: 'text-error-600',
    success: 'text-success-600',
    warning: 'text-warning-600',
  };

  return <p className={cn('text-sm', variantClasses[variant])}>{children}</p>;
}

// Form submit button component
interface FormSubmitProps {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  isLoading?: boolean;
}

function FormSubmit({
  children,
  className,
  disabled,
  isLoading,
}: FormSubmitProps) {
  return (
    <button
      type='submit'
      disabled={disabled || isLoading}
      className={cn(
        'w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      {isLoading ? (
        <div className='flex items-center'>
          <div className='animate-spin -ml-1 mr-3 h-5 w-5 text-white'>
            <svg className='h-5 w-5' fill='none' viewBox='0 0 24 24'>
              <circle
                className='opacity-25'
                cx='12'
                cy='12'
                r='10'
                stroke='currentColor'
                strokeWidth='4'
              />
              <path
                className='opacity-75'
                fill='currentColor'
                d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
              />
            </svg>
          </div>
          Processing...
        </div>
      ) : (
        children
      )}
    </button>
  );
}

export { Form, FormField, FormMessage, FormSubmit };
