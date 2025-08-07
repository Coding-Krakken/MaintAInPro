# Code Organization and Standards - MaintAInPro CMMS

## 📁 Project Structure

```
MaintAInPro/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Base UI components (Button, Form, Modal, etc.)
│   │   ├── layout/         # Layout components (Header, Sidebar, etc.)
│   │   └── offline/        # Offline-specific components
│   ├── modules/            # Feature-based modules
│   │   ├── auth/           # Authentication module
│   │   │   ├── components/ # Auth-specific components
│   │   │   ├── hooks/      # Auth hooks (useAuth, etc.)
│   │   │   └── services/   # Auth services
│   │   └── work-orders/    # Work order management module
│   │       ├── components/ # Work order components
│   │       ├── hooks/      # Work order hooks
│   │       └── services/   # Work order services
│   ├── pages/              # Page components (route handlers)
│   ├── hooks/              # Global custom React hooks
│   ├── lib/                # External library configurations
│   │   ├── offline/        # Offline/IndexedDB utilities
│   │   └── supabase/       # Supabase client configuration
│   ├── services/           # API services and data fetching
│   ├── test/               # Test utilities and setup
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
├── tests/                  # Test files
│   ├── e2e/               # End-to-end tests (Playwright)
│   └── unit/              # Unit test utilities
├── Documentation/          # Project documentation
│   ├── Development/       # Development guides and architecture docs
│   └── Blueprint/         # Project blueprints and specifications
├── supabase/              # Database migrations and functions
│   ├── migrations/        # SQL migrations
│   └── functions/         # Edge functions
└── public/                # Static assets
```

## 🎯 Component Organization Principles

### 1. Component Categories

#### Base UI Components (`src/components/ui/`)

Reusable, framework-agnostic UI components:

- `Button.tsx` - Button component with variants
- `Form.tsx` - Form system with React Hook Form integration
- `Modal.tsx` - Modal system with Headless UI
- `Input.tsx` - Input components with validation
- `Card.tsx` - Card layout components
- `Table.tsx` - Data table components
- `Badge.tsx` - Status and label badges
- `Tooltip.tsx` - Accessible tooltip system

#### Layout Components (`src/components/layout/`)

Application layout and navigation:

- `Header.tsx` - Main application header
- `Sidebar.tsx` - Navigation sidebar
- `Layout.tsx` - Main layout wrapper

#### Module Components (`src/modules/*/components/`)

Feature-specific components organized by domain:

- Authentication components in `src/modules/auth/components/`
- Work order components in `src/modules/work-orders/components/`

### 2. File Naming Conventions

```
# Components (PascalCase)
Button.tsx
WorkOrderForm.tsx
MobileWorkOrderList.tsx

# Hooks (camelCase with 'use' prefix)
useAuth.ts
useOffline.ts
useWorkOrders.ts

# Services (camelCase)
authService.ts
workOrderService.ts
qrCodeService.ts

# Types (PascalCase with 'Types' suffix)
AuthTypes.ts
WorkOrderTypes.ts
ApiTypes.ts

# Tests (same as component + .test)
Button.test.tsx
WorkOrderForm.test.tsx
useAuth.test.tsx
```

## 🧩 Component Architecture Patterns

### 1. Component Structure Template

```tsx
// Imports organized by type
import React, { useState, useEffect } from 'react';
import { SomeLibrary } from 'external-library';
import { InternalComponent } from '@/components/ui/Component';
import { useCustomHook } from '@/hooks/useCustomHook';
import { utilityFunction } from '@/utils/utilities';
import type { ComponentProps } from '@/types/ComponentTypes';

// Type definitions
interface Props {
  title: string;
  children: React.ReactNode;
  onAction?: (data: unknown) => void;
  variant?: 'primary' | 'secondary';
}

// Component implementation
export const Component: React.FC<Props> = ({ title, children, onAction, variant = 'primary' }) => {
  // State management
  const [isLoading, setIsLoading] = useState(false);

  // Custom hooks
  const { data, error } = useCustomHook();

  // Event handlers
  const handleAction = useCallback(
    (data: unknown) => {
      setIsLoading(true);
      onAction?.(data);
      setIsLoading(false);
    },
    [onAction]
  );

  // Effects
  useEffect(() => {
    // Effect logic
  }, []);

  // Early returns for loading/error states
  if (error) return <div>Error: {error.message}</div>;

  // Main render
  return (
    <div className={cn('base-styles', variantStyles[variant])}>
      <h2>{title}</h2>
      {children}
      <button onClick={handleAction} disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Action'}
      </button>
    </div>
  );
};

// Export types for external use
export type { Props as ComponentProps };
```

### 2. Hook Pattern

```tsx
// Custom hook structure
import { useState, useEffect, useCallback } from 'react';
import { serviceFunction } from '@/services/service';
import type { DataType, ErrorType } from '@/types/Types';

interface UseCustomHookOptions {
  autoFetch?: boolean;
  onSuccess?: (data: DataType) => void;
  onError?: (error: ErrorType) => void;
}

export function useCustomHook(options: UseCustomHookOptions = {}) {
  const { autoFetch = true, onSuccess, onError } = options;

  // State
  const [data, setData] = useState<DataType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ErrorType | null>(null);

  // Fetch function
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await serviceFunction();
      setData(result);
      onSuccess?.(result);
    } catch (err) {
      const error = err as ErrorType;
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [onSuccess, onError]);

  // Auto-fetch effect
  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [autoFetch, fetchData]);

  // Return hook interface
  return {
    data,
    isLoading,
    error,
    fetchData,
    refetch: fetchData,
  };
}
```

## 📦 Module Organization

### 1. Feature Module Structure

```
src/modules/work-orders/
├── components/
│   ├── WorkOrderForm.tsx       # Main form component
│   ├── WorkOrderList.tsx       # List view component
│   ├── WorkOrderCard.tsx       # Individual work order card
│   ├── QRCodeScanner.tsx       # QR scanning component
│   └── MobileWorkOrderList.tsx # Mobile-optimized list
├── hooks/
│   ├── useWorkOrders.ts        # Work order data management
│   ├── useWorkOrderForm.ts     # Form state management
│   └── useQRScanner.ts         # QR scanning logic
├── services/
│   ├── workOrderService.ts     # API calls
│   ├── qrCodeService.ts        # QR code utilities
│   └── workOrderValidation.ts # Validation schemas
├── types/
│   └── WorkOrderTypes.ts       # TypeScript definitions
└── __tests__/
    ├── components/             # Component tests
    ├── hooks/                  # Hook tests
    └── services/               # Service tests
```

### 2. Shared Module (`src/lib/`)

```
src/lib/
├── supabase/
│   ├── client.ts              # Supabase client configuration
│   ├── auth.ts                # Authentication utilities
│   └── database.ts            # Database utilities
├── offline/
│   ├── database.ts            # IndexedDB setup
│   ├── syncManager.ts         # Data synchronization
│   └── types.ts               # Offline data types
└── utils/
    ├── cn.ts                  # Class name utility
    ├── formatters.ts          # Data formatters
    └── validators.ts          # Validation utilities
```

## 🎨 Styling Standards

### 1. Tailwind CSS Organization

```tsx
// Use utility classes with consistent patterns
const buttonVariants = {
  primary: 'bg-primary-600 hover:bg-primary-700 text-white',
  secondary: 'bg-secondary-200 hover:bg-secondary-300 text-secondary-900',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
};

// Group related utilities
const cardStyles = cn(
  // Layout
  'relative overflow-hidden rounded-lg',
  // Spacing
  'p-6 m-4',
  // Colors
  'bg-white border border-gray-200',
  // Interactive states
  'hover:shadow-lg transition-shadow duration-200',
  // Responsive
  'sm:p-8 lg:p-10'
);
```

### 2. Component Styling Patterns

```tsx
// Extract variant styles to separate objects
const sizeVariants = {
  sm: 'px-2 py-1 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

const colorVariants = {
  blue: 'bg-blue-500 text-white',
  green: 'bg-green-500 text-white',
  red: 'bg-red-500 text-white',
};

// Use cn utility for conditional classes
const buttonClass = cn(
  'rounded font-medium transition-colors',
  sizeVariants[size],
  colorVariants[color],
  disabled && 'opacity-50 cursor-not-allowed',
  className // Allow custom classes
);
```

## 🔧 TypeScript Standards

### 1. Type Organization

```tsx
// Base types
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

// Feature-specific types
export interface WorkOrder extends BaseEntity {
  work_order_number: string;
  title: string;
  description?: string;
  status: WorkOrderStatus;
  priority: Priority;
  assigned_to?: string;
  equipment_id?: string;
}

// Enum types
export type WorkOrderStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

// API response types
export interface WorkOrderResponse {
  data: WorkOrder[];
  count: number;
  error?: string;
}

// Form types (derived from schemas)
export type WorkOrderFormData = z.infer<typeof workOrderSchema>;
```

### 2. Component Prop Types

```tsx
// Use interfaces for component props
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  isLoading?: boolean;
  onClick?: () => void;
  className?: string;
}

// Use generics for reusable components
interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
}

// Forward ref types
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = 'primary', ...props }, ref) => {
    return (
      <button ref={ref} className={buttonVariants[variant]} {...props}>
        {children}
      </button>
    );
  }
);
```

## 🧪 Testing Organization

### 1. Test File Structure

```
src/components/ui/Button.test.tsx
src/modules/auth/hooks/useAuth.test.tsx
src/services/workOrderService.test.ts
```

### 2. Test Categories

```tsx
describe('Button Component', () => {
  // Rendering tests
  describe('Rendering', () => {
    it('renders with correct text', () => {
      // Test basic rendering
    });
  });

  // Interaction tests
  describe('Interactions', () => {
    it('handles click events', () => {
      // Test user interactions
    });
  });

  // Variant tests
  describe('Variants', () => {
    it('applies correct styles for primary variant', () => {
      // Test different variants
    });
  });

  // Accessibility tests
  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      // Test accessibility
    });
  });
});
```

## 📊 Performance Standards

### 1. Code Splitting

```tsx
// Lazy load page components
const WorkOrdersPage = lazy(() => import('@/pages/WorkOrdersPage'));
const InventoryPage = lazy(() => import('@/pages/InventoryPage'));

// Route-based code splitting
const AppRoutes = () => (
  <Routes>
    <Route
      path='/work-orders'
      element={
        <Suspense fallback={<LoadingSpinner />}>
          <WorkOrdersPage />
        </Suspense>
      }
    />
  </Routes>
);
```

### 2. Memoization Patterns

```tsx
// Memoize expensive calculations
const expensiveData = useMemo(() => {
  return processLargeDataset(rawData);
}, [rawData]);

// Memoize callback functions
const handleSubmit = useCallback(
  (data: FormData) => {
    submitForm(data);
  },
  [submitForm]
);

// Memoize components with React.memo
const WorkOrderCard = React.memo<WorkOrderCardProps>(({ workOrder }) => {
  return <div>{workOrder.title}</div>;
});
```

## 🔄 State Management Patterns

### 1. Local State

```tsx
// Simple component state
const [isOpen, setIsOpen] = useState(false);

// Complex state with reducer
const [state, dispatch] = useReducer(formReducer, initialState);
```

### 2. Global State (React Query)

```tsx
// Query hooks for server state
const { data: workOrders, isLoading } = useQuery({
  queryKey: ['workOrders'],
  queryFn: fetchWorkOrders,
});

// Mutation hooks for updates
const mutation = useMutation({
  mutationFn: createWorkOrder,
  onSuccess: () => {
    queryClient.invalidateQueries(['workOrders']);
  },
});
```

## 📝 Documentation Standards

### 1. Component Documentation

````tsx
/**
 * Button component with multiple variants and states
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="lg" onClick={handleClick}>
 *   Click me
 * </Button>
 * ```
 */
export const Button: React.FC<ButtonProps> = ({ ... }) => {
  // Implementation
};
````

### 2. Hook Documentation

````tsx
/**
 * Custom hook for managing work order data
 *
 * @param options - Configuration options
 * @returns Work order data and management functions
 *
 * @example
 * ```tsx
 * const { data, isLoading, createWorkOrder } = useWorkOrders({
 *   autoFetch: true,
 *   onSuccess: (data) => console.log('Loaded:', data.length)
 * });
 * ```
 */
export function useWorkOrders(options: UseWorkOrdersOptions) {
  // Implementation
}
````

## ✅ Code Quality Checklist

### Before Committing

- [ ] All TypeScript errors resolved
- [ ] All tests passing (247/247)
- [ ] ESLint warnings addressed
- [ ] Prettier formatting applied
- [ ] Component props documented
- [ ] Accessibility attributes added
- [ ] Responsive design tested
- [ ] Performance optimizations applied

### Code Review Guidelines

- [ ] Component follows single responsibility principle
- [ ] Props are properly typed
- [ ] Error boundaries are implemented where needed
- [ ] Loading states are handled
- [ ] Accessibility requirements met
- [ ] Test coverage is adequate
- [ ] Documentation is updated

---

**Status**: Production Ready ✅  
**Maintained By**: Development Team  
**Last Updated**: August 7, 2025  
**Code Quality**: 100% TypeScript, ESLint Compliant
