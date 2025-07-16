import React, { useState, useRef, useEffect } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

const accordionVariants = cva('border-b border-border', {
  variants: {
    variant: {
      default: 'bg-background',
      bordered: 'border border-border rounded-lg mb-2',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const accordionTriggerVariants = cva(
  'flex w-full items-center justify-between py-4 text-left font-medium transition-all hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'px-0',
        bordered: 'px-4',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const accordionContentVariants = cva('overflow-hidden text-sm transition-all', {
  variants: {
    variant: {
      default: 'pb-4 pt-0',
      bordered: 'px-4 pb-4 pt-0',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface AccordionItemProps
  extends VariantProps<typeof accordionVariants> {
  children: React.ReactNode;
  className?: string;
}

export interface AccordionTriggerProps
  extends VariantProps<typeof accordionTriggerVariants> {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  isOpen?: boolean;
}

export interface AccordionContentProps
  extends VariantProps<typeof accordionContentVariants> {
  children: React.ReactNode;
  className?: string;
  isOpen?: boolean;
}

const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ children, variant, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(accordionVariants({ variant }), className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

const AccordionTrigger = React.forwardRef<
  HTMLButtonElement,
  AccordionTriggerProps
>(({ children, variant, className, onClick, isOpen, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(accordionTriggerVariants({ variant }), className)}
      onClick={onClick}
      aria-expanded={isOpen}
      type='button'
      {...props}
    >
      <span>{children}</span>
      <ChevronDownIcon
        className={cn(
          'h-4 w-4 transition-transform duration-200',
          isOpen && 'rotate-180'
        )}
      />
    </button>
  );
});

const AccordionContent = React.forwardRef<
  HTMLDivElement,
  AccordionContentProps
>(({ children, variant, className, isOpen, ...props }, ref) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (contentRef.current) {
      if (isOpen) {
        setHeight(contentRef.current.scrollHeight);
      } else {
        setHeight(0);
      }
    }
  }, [isOpen]);

  return (
    <div
      ref={ref}
      className='overflow-hidden transition-all duration-300 ease-out'
      style={{ height }}
      {...props}
    >
      <div
        ref={contentRef}
        className={cn(accordionContentVariants({ variant }), className)}
      >
        {children}
      </div>
    </div>
  );
});

export interface AccordionProps extends VariantProps<typeof accordionVariants> {
  children: React.ReactNode;
  type?: 'single' | 'multiple';
  defaultValue?: string | string[];
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  className?: string;
  collapsible?: boolean;
}

const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  (
    {
      children,
      type = 'single',
      defaultValue,
      value,
      onValueChange,
      variant,
      className,
      collapsible = false,
      ...props
    },
    ref
  ) => {
    const [openItems, setOpenItems] = useState<string[]>(() => {
      if (value) {
        return Array.isArray(value) ? value : [value];
      }
      if (defaultValue) {
        return Array.isArray(defaultValue) ? defaultValue : [defaultValue];
      }
      return [];
    });

    const handleItemToggle = (itemValue: string) => {
      if (type === 'single') {
        const newValue = openItems.includes(itemValue)
          ? collapsible
            ? []
            : [itemValue]
          : [itemValue];
        setOpenItems(newValue);
        onValueChange?.(newValue[0] || '');
      } else {
        const newValue = openItems.includes(itemValue)
          ? openItems.filter(item => item !== itemValue)
          : [...openItems, itemValue];
        setOpenItems(newValue);
        onValueChange?.(newValue);
      }
    };

    React.useEffect(() => {
      if (value !== undefined) {
        setOpenItems(Array.isArray(value) ? value : [value]);
      }
    }, [value]);

    const childrenWithProps = React.Children.map(children, (child, index) => {
      if (React.isValidElement(child)) {
        const itemValue = child.props.value || `item-${index}`;
        const isOpen = openItems.includes(itemValue);

        return React.cloneElement(child, {
          ...child.props,
          variant,
          isOpen,
          onToggle: () => handleItemToggle(itemValue),
        });
      }
      return child;
    });

    return (
      <div ref={ref} className={cn('', className)} {...props}>
        {childrenWithProps}
      </div>
    );
  }
);

AccordionItem.displayName = 'AccordionItem';
AccordionTrigger.displayName = 'AccordionTrigger';
AccordionContent.displayName = 'AccordionContent';
Accordion.displayName = 'Accordion';

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
