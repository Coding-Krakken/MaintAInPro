import React, { useState, useRef, useEffect } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const popoverVariants = cva(
  'absolute z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95',
  {
    variants: {
      side: {
        top: 'bottom-full mb-2 left-1/2 transform -translate-x-1/2',
        bottom: 'top-full mt-2 left-1/2 transform -translate-x-1/2',
        left: 'right-full mr-2 top-1/2 transform -translate-y-1/2',
        right: 'left-full ml-2 top-1/2 transform -translate-y-1/2',
      },
      align: {
        start: 'left-0',
        center: 'left-1/2 transform -translate-x-1/2',
        end: 'right-0',
      },
    },
    defaultVariants: {
      side: 'bottom',
      align: 'center',
    },
  }
);

export interface PopoverProps extends VariantProps<typeof popoverVariants> {
  children: React.ReactNode;
  content: React.ReactNode;
  trigger?: 'click' | 'hover';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  className?: string;
}

const Popover = React.forwardRef<HTMLDivElement, PopoverProps>(
  (
    {
      children,
      content,
      trigger = 'click',
      open,
      onOpenChange,
      disabled,
      side = 'bottom',
      align = 'center',
      className,
      ...props
    },
    _ref
  ) => {
    const [isOpen, setIsOpen] = useState(open || false);
    const triggerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    const handleOpen = () => {
      if (disabled) return;
      const newOpen = !isOpen;
      setIsOpen(newOpen);
      onOpenChange?.(newOpen);
    };

    const handleClose = React.useCallback(() => {
      setIsOpen(false);
      onOpenChange?.(false);
    }, [onOpenChange]);

    useEffect(() => {
      if (open !== undefined) {
        setIsOpen(open);
      }
    }, [open]);

    useEffect(() => {
      if (trigger === 'click' && isOpen) {
        const handleClickOutside = (event: MouseEvent) => {
          if (
            triggerRef.current &&
            contentRef.current &&
            !triggerRef.current.contains(event.target as Node) &&
            !contentRef.current.contains(event.target as Node)
          ) {
            handleClose();
          }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () =>
          document.removeEventListener('mousedown', handleClickOutside);
      }
      return undefined;
    }, [isOpen, trigger, handleClose]);

    const triggerProps =
      trigger === 'click'
        ? {
            onClick: handleOpen,
          }
        : {
            onMouseEnter: () => {
              if (!disabled) {
                setIsOpen(true);
                onOpenChange?.(true);
              }
            },
            onMouseLeave: () => {
              setIsOpen(false);
              onOpenChange?.(false);
            },
          };

    return (
      <div ref={triggerRef} className='relative inline-block' {...props}>
        <div {...triggerProps}>{children}</div>
        {isOpen && (
          <div
            ref={contentRef}
            className={cn(popoverVariants({ side, align }), className)}
            role='dialog'
            aria-modal='true'
          >
            {content}
          </div>
        )}
      </div>
    );
  }
);

Popover.displayName = 'Popover';

export { Popover, popoverVariants };
