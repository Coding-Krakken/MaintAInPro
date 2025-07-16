import {
  useState,
  useRef,
  useEffect,
  ReactNode,
  forwardRef,
  HTMLAttributes,
} from 'react';
import { cn } from '../../utils/cn';

export interface DropdownItem {
  label: string;
  value: string;
  disabled?: boolean;
  icon?: ReactNode;
}

export interface DropdownProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  trigger: ReactNode;
  items: DropdownItem[];
  onSelect?: (value: string) => void;
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
}

const Dropdown = forwardRef<HTMLDivElement, DropdownProps>(
  (
    {
      trigger,
      items,
      onSelect,
      placement = 'bottom-start',
      className,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleItemClick = (value: string, disabled?: boolean) => {
      if (disabled) return;
      onSelect?.(value);
      setIsOpen(false);
    };

    const getPlacementClasses = () => {
      switch (placement) {
        case 'bottom-start':
          return 'top-full left-0 mt-1';
        case 'bottom-end':
          return 'top-full right-0 mt-1';
        case 'top-start':
          return 'bottom-full left-0 mb-1';
        case 'top-end':
          return 'bottom-full right-0 mb-1';
        default:
          return 'top-full left-0 mt-1';
      }
    };

    return (
      <div
        ref={ref}
        className={cn('relative inline-block', className)}
        {...props}
      >
        <button
          ref={dropdownRef}
          onClick={() => setIsOpen(!isOpen)}
          className='cursor-pointer'
          type='button'
        >
          {trigger}
        </button>

        {isOpen && (
          <div
            className={cn(
              'absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-white shadow-md',
              'animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
              getPlacementClasses()
            )}
          >
            <div className='py-1'>
              {items.map(item => (
                <button
                  key={item.value}
                  onClick={() => handleItemClick(item.value, item.disabled)}
                  disabled={item.disabled}
                  className={cn(
                    'w-full px-3 py-2 text-sm text-left flex items-center gap-2',
                    'hover:bg-gray-100 focus:bg-gray-100 focus:outline-none',
                    'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent',
                    'transition-colors duration-150'
                  )}
                >
                  {item.icon && (
                    <span className='flex-shrink-0'>{item.icon}</span>
                  )}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
);

Dropdown.displayName = 'Dropdown';

export { Dropdown };
