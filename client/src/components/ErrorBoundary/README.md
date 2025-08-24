# React Error Boundary System - Usage Examples

This document demonstrates how to use the comprehensive Error Boundary system
implemented in MaintAInPro.

## Overview

The Error Boundary system provides:

- **Graceful error handling** with user-friendly fallback UIs
- **Error reporting and tracking** with unique event IDs
- **Recovery mechanisms** (retry, refresh, navigation)
- **Multiple fallback types** for different error scenarios
- **Easy integration** through HOCs and hooks

## Basic Usage

### 1. Using ErrorBoundary Component Directly

```tsx
import React from 'react';
import {
  ErrorBoundary,
  GenericErrorFallback,
} from '@/components/ErrorBoundary';

function MyComponent() {
  return (
    <ErrorBoundary
      fallback={GenericErrorFallback}
      onError={(error, errorInfo) => {
        console.log('Error caught:', error.message);
      }}
    >
      <YourComponent />
    </ErrorBoundary>
  );
}
```

### 2. Using withErrorBoundary HOC

```tsx
import React from 'react';
import { withErrorBoundary } from '@/components/ErrorBoundary';

const MyComponent = ({ data }: { data: any }) => {
  // Component that might throw an error
  return <div>{data.someProperty}</div>;
};

// Wrap with error boundary
export default withErrorBoundary(MyComponent, {
  type: 'generic',
  context: 'MyComponent',
});
```

### 3. Using useErrorBoundary Hook

```tsx
import React from 'react';
import { useErrorBoundary } from '@/hooks/useErrorBoundary';

function MyComponent() {
  const { captureError, reportError } = useErrorBoundary({
    context: 'MyComponent',
    onError: error => console.log('Error reported:', error.message),
  });

  const handleAction = async () => {
    try {
      // Some risky operation
      await riskyOperation();
    } catch (error) {
      // Report error without triggering boundary
      await reportError(error);
      // Or capture error and trigger boundary
      // await captureError(error);
    }
  };

  return <button onClick={handleAction}>Perform Action</button>;
}
```

## Different Error Types

### Generic Errors (Default)

```tsx
import { withErrorBoundary } from '@/components/ErrorBoundary';

const Component = withErrorBoundary(MyComponent, {
  type: 'generic', // Default fallback
  context: 'Generic Component Error',
});
```

### Network Errors

```tsx
import { withNetworkErrorBoundary } from '@/components/ErrorBoundary';

// Specialized HOC for network components
const NetworkComponent = withNetworkErrorBoundary(MyAPIComponent, {
  context: 'API Data Loading',
});

// Or using type option
const NetworkComponent2 = withErrorBoundary(MyAPIComponent, {
  type: 'network',
  context: 'Network Request',
});
```

### Chunk Loading Errors

```tsx
import { withChunkErrorBoundary } from '@/components/ErrorBoundary';

// For lazy-loaded components
const LazyComponent = React.lazy(() => import('./LazyComponent'));

const ChunkProtectedComponent = withChunkErrorBoundary(LazyComponent, {
  context: 'Lazy Component Loading',
});

// Usage in Suspense
function App() {
  return (
    <Suspense fallback={<Loading />}>
      <ChunkProtectedComponent />
    </Suspense>
  );
}
```

## Strategic Placement Examples

### Route-Level Protection

```tsx
import {
  ErrorBoundary,
  GenericErrorFallback,
} from '@/components/ErrorBoundary';
import { reportError } from '@/utils/error-reporting';

function ProtectedRoute({ children }) {
  return (
    <ErrorBoundary
      fallback={GenericErrorFallback}
      onError={async (error, errorInfo) => {
        await reportError(error, errorInfo, {
          context: 'Route Protection',
          userId: currentUser?.id,
        });
      }}
    >
      <AppLayout>{children}</AppLayout>
    </ErrorBoundary>
  );
}
```

### Feature-Level Protection

```tsx
import { createErrorBoundary } from '@/components/ErrorBoundary';

// Create isolated boundary for specific features
const InventoryErrorBoundary = createErrorBoundary({
  type: 'generic',
  context: 'Inventory Management',
  fallbackProps: {
    title: 'Inventory System Error',
    description:
      'There was an issue with the inventory system. Please try refreshing.',
    showHomeButton: true,
  },
});

function InventoryPage() {
  return (
    <InventoryErrorBoundary>
      <InventoryDashboard />
      <InventoryList />
      <InventoryActions />
    </InventoryErrorBoundary>
  );
}
```

## Custom Fallback Components

```tsx
import React from 'react';
import { ErrorFallbackProps } from '@/components/ErrorBoundary';

const CustomErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  eventId,
}) => {
  return (
    <div className='custom-error-container'>
      <h2>Oops! Something went wrong in our app</h2>
      <p>We've been notified about this issue.</p>
      <details>
        <summary>Error details</summary>
        <pre>{error?.message}</pre>
        <p>Error ID: {eventId}</p>
      </details>
      <div className='error-actions'>
        <button onClick={resetError}>Try Again</button>
        <button onClick={() => window.location.reload()}>Refresh Page</button>
      </div>
    </div>
  );
};

// Usage
const ProtectedComponent = withErrorBoundary(MyComponent, {
  fallback: CustomErrorFallback,
  context: 'Custom Protected Component',
});
```

## Error Reporting Integration

```tsx
import {
  reportError,
  reportNetworkError,
  reportChunkError,
} from '@/utils/error-reporting';

// Manual error reporting
async function handleError(error: Error) {
  const eventId = await reportError(error, undefined, {
    context: 'User Action',
    userId: currentUser.id,
    tags: { feature: 'inventory', action: 'create' },
    extra: { timestamp: new Date().toISOString() },
  });

  console.log('Error reported with ID:', eventId);
}

// Network error reporting
async function handleNetworkError(response: Response) {
  await reportNetworkError(response.url, response.status, response.statusText, {
    context: 'API Request',
  });
}

// Chunk error reporting
async function handleChunkError(chunkName: string) {
  await reportChunkError(chunkName, {
    context: 'Dynamic Import',
  });
}
```

## Testing Error Boundaries

```tsx
import { render, screen } from '@testing-library/react';
import { withErrorBoundary } from '@/components/ErrorBoundary';

// Test component that throws errors
const ThrowError = ({ shouldThrow = true }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('Error Boundary Tests', () => {
  it('should catch and display errors', () => {
    const WrappedComponent = withErrorBoundary(ThrowError);

    render(<WrappedComponent />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('should render normally when no error', () => {
    const WrappedComponent = withErrorBoundary(ThrowError);

    render(<WrappedComponent shouldThrow={false} />);

    expect(screen.getByText('No error')).toBeInTheDocument();
  });
});
```

## Best Practices

1. **Strategic Placement**: Place error boundaries at route and feature levels
2. **Context Information**: Always provide meaningful context for error
   reporting
3. **User Experience**: Use appropriate fallback UIs for different error types
4. **Recovery Options**: Provide clear recovery paths (retry, refresh, navigate)
5. **Error Tracking**: Include relevant metadata for debugging (user ID,
   feature, action)
6. **Testing**: Test both error and success scenarios
7. **Performance**: Use lazy loading with chunk error boundaries for code
   splitting

## Monitoring and Debugging

The error reporting system stores errors locally for debugging:

```tsx
import { errorReportingService } from '@/utils/error-reporting';

// Get stored errors for debugging
const storedErrors = errorReportingService.getStoredErrors();
console.log('Recent errors:', storedErrors);

// Clear stored errors
errorReportingService.clearStoredErrors();

// Get current session ID
const sessionId = errorReportingService.getSessionId();
console.log('Current session:', sessionId);
```

This comprehensive error boundary system ensures that your React application
handles errors gracefully while providing excellent user experience and
debugging capabilities.
