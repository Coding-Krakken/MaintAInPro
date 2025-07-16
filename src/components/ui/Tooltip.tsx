import React, { useState, useRef, useEffect } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const tooltipVariants = cva(
  'absolute z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95',
  {
    variants: {
      side: {
        top: 'bottom-full mb-1 left-1/2 transform -translate-x-1/2',
        bottom: 'top-full mt-1 left-1/2 transform -translate-x-1/2',
        left: 'right-full mr-1 top-1/2 transform -translate-y-1/2',
        right: 'left-full ml-1 top-1/2 transform -translate-y-1/2',
      },
    },
    defaultVariants: {
      side: 'top',
    },
  }
);

export interface TooltipProps extends VariantProps<typeof tooltipVariants> {
  children: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
  delayDuration?: number;
  className?: string;
}

const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(
  (
    {
      children,
      content,
      disabled,
      delayDuration = 300,
      side = 'top',
      className,
      ...props
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout>();
    const triggerRef = useRef<HTMLDivElement>(null);

    const showTooltip = () => {
      if (disabled) return;
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setIsVisible(true);
      }, delayDuration);
    };

    const hideTooltip = () => {
      clearTimeout(timeoutRef.current);
      setIsVisible(false);
    };

    useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, []);

    return (
      <div
        ref={triggerRef}
        className='relative inline-block'
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        {...props}
      >
        {children}
        {isVisible && content && (
          <div
            ref={ref}
            className={cn(tooltipVariants({ side }), className)}
            role='tooltip'
            aria-hidden={!isVisible}
          >
            {content}
          </div>
        )}
      </div>
    );
  }
);

Tooltip.displayName = 'Tooltip';

export { Tooltip, tooltipVariants };
