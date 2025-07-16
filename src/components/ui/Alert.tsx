import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const alertVariants = cva(
  'relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        destructive:
          'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive',
        warning:
          'border-yellow-500/50 text-yellow-600 bg-yellow-50 dark:bg-yellow-900/10 dark:text-yellow-400 [&>svg]:text-yellow-600 dark:[&>svg]:text-yellow-400',
        success:
          'border-green-500/50 text-green-600 bg-green-50 dark:bg-green-900/10 dark:text-green-400 [&>svg]:text-green-600 dark:[&>svg]:text-green-400',
        info: 'border-blue-500/50 text-blue-600 bg-blue-50 dark:bg-blue-900/10 dark:text-blue-400 [&>svg]:text-blue-600 dark:[&>svg]:text-blue-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      role='alert'
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
);
Alert.displayName = 'Alert';

interface AlertDescriptionProps extends React.HTMLAttributes<HTMLDivElement> {}

const AlertDescription = React.forwardRef<
  HTMLDivElement,
  AlertDescriptionProps
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-sm [&_p]:leading-relaxed', className)}
    {...props}
  />
));
AlertDescription.displayName = 'AlertDescription';

interface AlertTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

const AlertTitle = React.forwardRef<HTMLHeadingElement, AlertTitleProps>(
  ({ className, children, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn('mb-1 font-medium leading-none tracking-tight', className)}
      {...props}
    >
      {children}
    </h5>
  )
);
AlertTitle.displayName = 'AlertTitle';

export { Alert, AlertDescription, AlertTitle };
export type { AlertProps };
