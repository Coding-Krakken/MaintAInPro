import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { withErrorBoundary, withNetworkErrorBoundary, withChunkErrorBoundary } from '../../../client/src/components/ErrorBoundary/withErrorBoundary';

// Mock error reporting service
vi.mock('../../../client/src/utils/error-reporting', () => ({
  reportError: vi.fn().mockResolvedValue('test-event-id'),
}));

// Test component that throws an error
const ThrowError: React.FC<{ shouldThrow?: boolean; errorMessage?: string }> = ({ 
  shouldThrow = true, 
  errorMessage = 'Test error' 
}) => {
  if (shouldThrow) {
    throw new Error(errorMessage);
  }
  return <div>No error</div>;
};

// Suppress console.error for tests
const originalError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalError;
  vi.clearAllMocks();
});

describe('withErrorBoundary HOCs', () => {
  describe('withErrorBoundary', () => {
    it('should wrap component with error boundary', () => {
      const WrappedComponent = withErrorBoundary(ThrowError);
      
      render(<WrappedComponent shouldThrow={false} />);
      expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('should catch errors and display fallback UI', () => {
      const WrappedComponent = withErrorBoundary(ThrowError);
      
      render(<WrappedComponent errorMessage="HOC test error" />);
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should use custom context in error reporting', () => {
      const WrappedComponent = withErrorBoundary(ThrowError, {
        context: 'Custom Test Context'
      });
      
      render(<WrappedComponent />);
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should use network fallback when type is network', () => {
      const WrappedComponent = withErrorBoundary(ThrowError, {
        type: 'network'
      });
      
      render(<WrappedComponent />);
      // Check for network-specific UI elements
      expect(screen.getByText('Network error occurred')).toBeInTheDocument();
    });

    it('should use chunk fallback when type is chunk', () => {
      const WrappedComponent = withErrorBoundary(ThrowError, {
        type: 'chunk'
      });
      
      render(<WrappedComponent />);
      // Check for chunk-specific UI elements
      expect(screen.getByText('Failed to load application')).toBeInTheDocument();
    });
  });

  describe('withNetworkErrorBoundary', () => {
    it('should wrap component with network error boundary', () => {
      const WrappedComponent = withNetworkErrorBoundary(ThrowError);
      
      render(<WrappedComponent />);
      expect(screen.getByText('Network error occurred')).toBeInTheDocument();
    });

    it('should show retry button for network errors', () => {
      const WrappedComponent = withNetworkErrorBoundary(ThrowError);
      
      render(<WrappedComponent />);
      
      const retryButton = screen.getByText('Retry');
      expect(retryButton).toBeInTheDocument();
      
      // Test retry button click
      fireEvent.click(retryButton);
      // Should still show error as component will throw again
      expect(screen.getByText('Network error occurred')).toBeInTheDocument();
    });
  });

  describe('withChunkErrorBoundary', () => {
    it('should wrap component with chunk error boundary', () => {
      const WrappedComponent = withChunkErrorBoundary(ThrowError);
      
      render(<WrappedComponent />);
      expect(screen.getByText('Failed to load application')).toBeInTheDocument();
    });

    it('should show cache clear button for chunk errors', () => {
      const WrappedComponent = withChunkErrorBoundary(ThrowError);
      
      render(<WrappedComponent />);
      
      const clearCacheButton = screen.getByText('Clear Cache & Reload');
      expect(clearCacheButton).toBeInTheDocument();
    });
  });

  describe('Component Props and Refs', () => {
    interface TestProps {
      testProp: string;
      onClick?: () => void;
    }

    const TestComponent = React.forwardRef<HTMLDivElement, TestProps>(({ testProp, onClick }, ref) => (
      <div ref={ref} onClick={onClick} data-testid="test-component">
        {testProp}
      </div>
    ));
    TestComponent.displayName = 'TestComponent';

    it('should preserve component props', () => {
      const WrappedComponent = withErrorBoundary(TestComponent);
      
      render(<WrappedComponent testProp="test value" />);
      expect(screen.getByTestId('test-component')).toHaveTextContent('test value');
    });

    it('should preserve component event handlers', () => {
      const onClick = vi.fn();
      const WrappedComponent = withErrorBoundary(TestComponent);
      
      render(<WrappedComponent testProp="test" onClick={onClick} />);
      
      fireEvent.click(screen.getByTestId('test-component'));
      expect(onClick).toHaveBeenCalled();
    });

    it('should preserve display name', () => {
      const WrappedComponent = withErrorBoundary(TestComponent);
      expect(WrappedComponent.displayName).toBe('withErrorBoundary(TestComponent)');
    });
  });

  describe('Error Boundary Options', () => {
    it('should call custom onError handler', async () => {
      const onError = vi.fn();
      const WrappedComponent = withErrorBoundary(ThrowError, {
        onError
      });
      
      render(<WrappedComponent errorMessage="Custom error test" />);
      
      // Wait for async error handling
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // onError should be called
      expect(onError).toHaveBeenCalled();
    });

    it('should pass custom fallback props', () => {
      const CustomFallback: React.FC<any> = ({ customMessage }) => (
        <div>{customMessage}</div>
      );

      const WrappedComponent = withErrorBoundary(ThrowError, {
        fallback: CustomFallback,
        fallbackProps: { customMessage: 'Custom fallback message' }
      });
      
      render(<WrappedComponent />);
      expect(screen.getByText('Custom fallback message')).toBeInTheDocument();
    });
  });
});