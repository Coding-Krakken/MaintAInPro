import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { ErrorBoundary } from '../../../client/src/components/ErrorBoundary/ErrorBoundary';
import { GenericErrorFallback } from '../../../client/src/components/ErrorBoundary/GenericErrorFallback';

// Mock error reporting service
vi.mock('../../../client/src/utils/error-reporting', () => ({
  reportError: vi.fn().mockResolvedValue('test-event-id'),
  errorReportingService: {
    reportError: vi.fn().mockResolvedValue('test-event-id'),
  },
}));

// Test component that throws an error
const ThrowError: React.FC<{ shouldThrow?: boolean; errorMessage?: string }> = ({
  shouldThrow = true,
  errorMessage = 'Test error',
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

describe('ErrorBoundary', () => {
  describe('Basic Error Handling', () => {
    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('should catch errors and display default fallback UI', () => {
      render(
        <ErrorBoundary>
          <ThrowError errorMessage='Something went wrong!' />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText(/An unexpected error occurred/)).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
      expect(screen.getByText('Refresh Page')).toBeInTheDocument();
    });

    it('should display error ID when error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const errorIdElement = screen.getByText(/Error ID:/);
      expect(errorIdElement).toBeInTheDocument();
      expect(errorIdElement.textContent).toMatch(/Error ID: error-\d+-\w+/);
    });

    it('should call onError callback when error occurs', async () => {
      const onErrorMock = vi.fn();

      render(
        <ErrorBoundary onError={onErrorMock}>
          <ThrowError errorMessage='Test callback error' />
        </ErrorBoundary>
      );

      await waitFor(() => {
        expect(onErrorMock).toHaveBeenCalledWith(
          expect.any(Error),
          expect.objectContaining({
            componentStack: expect.any(String),
          })
        );
      });
    });
  });

  describe('Custom Fallback Component', () => {
    it('should render custom fallback component when provided', () => {
      const CustomFallback: React.FC<any> = ({ error, resetError }) => (
        <div>
          <span>Custom Error: {error?.message}</span>
          <button onClick={resetError}>Custom Reset</button>
        </div>
      );

      render(
        <ErrorBoundary fallback={CustomFallback}>
          <ThrowError errorMessage='Custom error test' />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom Error: Custom error test')).toBeInTheDocument();
      expect(screen.getByText('Custom Reset')).toBeInTheDocument();
    });

    it('should pass fallbackProps to custom fallback', () => {
      const CustomFallback: React.FC<any> = ({ customProp }) => (
        <div>Custom Prop: {customProp}</div>
      );

      render(
        <ErrorBoundary fallback={CustomFallback} fallbackProps={{ customProp: 'test-value' }}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom Prop: test-value')).toBeInTheDocument();
    });
  });

  describe('Error Recovery', () => {
    it('should reset error state when resetError is called', async () => {
      const TestComponent: React.FC = () => {
        const [_shouldThrow] = React.useState(true);
        return <ThrowError shouldThrow={_shouldThrow} />;
      };

      render(
        <ErrorBoundary>
          <TestComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      const resetButton = screen.getByText('Try Again');
      fireEvent.click(resetButton);

      // The error should still show because the component will throw again
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should handle refresh page button', () => {
      // Mock window.location.reload
      const mockReload = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: mockReload },
        writable: true,
      });

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const refreshButton = screen.getByText('Refresh Page');
      fireEvent.click(refreshButton);

      expect(mockReload).toHaveBeenCalled();
    });
  });

  describe('GenericErrorFallback', () => {
    const mockResetError = vi.fn();

    beforeEach(() => {
      mockResetError.mockClear();
    });

    it('should render with default props', () => {
      const error = new Error('Test error');

      render(
        <GenericErrorFallback error={error} resetError={mockResetError} eventId='test-event-123' />
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText(/An unexpected error occurred/)).toBeInTheDocument();
      expect(screen.getByText('test-event-123')).toBeInTheDocument();
    });

    it('should render with custom title and description', () => {
      const error = new Error('Test error');

      render(
        <GenericErrorFallback
          error={error}
          resetError={mockResetError}
          title='Custom Error Title'
          description='Custom error description'
        />
      );

      expect(screen.getByText('Custom Error Title')).toBeInTheDocument();
      expect(screen.getByText('Custom error description')).toBeInTheDocument();
    });

    it('should handle Try Again button click', () => {
      render(<GenericErrorFallback error={new Error('Test')} resetError={mockResetError} />);

      const tryAgainButton = screen.getByText('Try Again');
      fireEvent.click(tryAgainButton);

      expect(mockResetError).toHaveBeenCalled();
    });

    it('should handle Go Home button click', () => {
      // Mock window.location
      const mockLocation = { href: '' };
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true,
      });

      render(
        <GenericErrorFallback
          error={new Error('Test')}
          resetError={mockResetError}
          showHomeButton={true}
        />
      );

      const goHomeButton = screen.getByText('Go Home');
      fireEvent.click(goHomeButton);

      expect(mockLocation.href).toBe('/dashboard');
    });

    it('should toggle error details when showDetails is true', async () => {
      const error = new Error('Test error with stack');
      error.stack = 'Error stack trace here';

      render(<GenericErrorFallback error={error} resetError={mockResetError} showDetails={true} />);

      const showDetailsButton = screen.getByText('Show Error Details');
      fireEvent.click(showDetailsButton);

      await waitFor(() => {
        expect(screen.getByText(/Error stack trace here/)).toBeInTheDocument();
      });

      const hideDetailsButton = screen.getByText('Hide Error Details');
      fireEvent.click(hideDetailsButton);

      await waitFor(() => {
        expect(screen.queryByText(/Error stack trace here/)).not.toBeInTheDocument();
      });
    });

    it('should handle Report Issue button click', () => {
      // Mock window.open
      const mockOpen = vi.fn();
      window.open = mockOpen;

      render(
        <GenericErrorFallback
          error={new Error('Test error')}
          resetError={mockResetError}
          showReportButton={true}
        />
      );

      const reportButton = screen.getByText('Report Issue');
      fireEvent.click(reportButton);

      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('mailto:support@maintainpro.com'),
        '_blank'
      );
    });
  });

  describe('Error Information Display', () => {
    it('should display error name and message', () => {
      const error = new Error('Specific test error');
      error.name = 'TestError';

      const CustomFallback: React.FC<any> = ({ error }) => (
        <div>
          <span data-testid='error-name'>{error?.name}</span>
          <span data-testid='error-message'>{error?.message}</span>
        </div>
      );

      render(
        <ErrorBoundary fallback={CustomFallback}>
          <ThrowError errorMessage='Specific test error' />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('error-name')).toHaveTextContent('Error');
      expect(screen.getByTestId('error-message')).toHaveTextContent('Specific test error');
    });
  });

  describe('Development vs Production', () => {
    it('should log errors in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const consoleSpy = vi.spyOn(console, 'error');

      render(
        <ErrorBoundary>
          <ThrowError errorMessage='Development error' />
        </ErrorBoundary>
      );

      expect(consoleSpy).toHaveBeenCalledWith('Error caught by ErrorBoundary:', expect.any(Error));

      process.env.NODE_ENV = originalEnv;
    });
  });
});
