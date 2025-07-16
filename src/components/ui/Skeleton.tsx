import { forwardRef, HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  animation?: 'pulse' | 'wave' | 'none';
}

const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      className,
      width = '100%',
      height = '1rem',
      rounded = 'md',
      animation = 'pulse',
      style,
      ...props
    },
    ref
  ) => {
    const roundedClasses = {
      none: 'rounded-none',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      full: 'rounded-full',
    };

    const animationClasses = {
      pulse: 'animate-pulse',
      wave: 'animate-pulse', // Can be enhanced with custom wave animation
      none: '',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'bg-gray-200',
          roundedClasses[rounded],
          animationClasses[animation],
          className
        )}
        style={{
          width,
          height,
          ...style,
        }}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

// Skeleton variants for common use cases
const SkeletonText = forwardRef<HTMLDivElement, Omit<SkeletonProps, 'height'>>(
  ({ className, ...props }, ref) => (
    <Skeleton
      ref={ref}
      height='1rem'
      className={cn('my-1', className)}
      {...props}
    />
  )
);

SkeletonText.displayName = 'SkeletonText';

const SkeletonButton = forwardRef<
  HTMLDivElement,
  Omit<SkeletonProps, 'height' | 'rounded'>
>(({ className, ...props }, ref) => (
  <Skeleton
    ref={ref}
    height='2.5rem'
    width='6rem'
    rounded='md'
    className={cn('', className)}
    {...props}
  />
));

SkeletonButton.displayName = 'SkeletonButton';

const SkeletonCard = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-4 space-y-4', className)} {...props}>
      <Skeleton height='1.5rem' width='60%' />
      <Skeleton height='1rem' width='100%' />
      <Skeleton height='1rem' width='80%' />
      <div className='flex justify-between'>
        <SkeletonButton width='4rem' />
        <SkeletonButton width='5rem' />
      </div>
    </div>
  )
);

SkeletonCard.displayName = 'SkeletonCard';

export { Skeleton, SkeletonText, SkeletonButton, SkeletonCard };
