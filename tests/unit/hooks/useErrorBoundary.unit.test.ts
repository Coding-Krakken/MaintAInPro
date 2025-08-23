import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useErrorBoundary } from '../../../client/src/hooks/useErrorBoundary';
import * as errorReporting from '../../../client/src/utils/error-reporting';

// Mock error reporting service
vi.mock('../../../client/src/utils/error-reporting', () => ({
  errorReportingService: {
    reportError: vi.fn().mockResolvedValue('test-event-id'),
    reportNetworkError: vi.fn().mockResolvedValue('network-event-id'),
    reportChunkError: vi.fn().mockResolvedValue('chunk-event-id'),
  },
}));

// Suppress console.error for tests
const originalError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalError;
  vi.clearAllMocks();
});

describe('useErrorBoundary', () => {
  describe('Basic Functionality', () => {
    it('should provide error handling functions', () => {
      const { result } = renderHook(() => useErrorBoundary());

      expect(result.current).toHaveProperty('captureError');
      expect(result.current).toHaveProperty('reportError');
      expect(result.current).toHaveProperty('captureNetworkError');
      expect(result.current).toHaveProperty('captureChunkError');
      expect(typeof result.current.captureError).toBe('function');
      expect(typeof result.current.reportError).toBe('function');
      expect(typeof result.current.captureNetworkError).toBe('function');
      expect(typeof result.current.captureChunkError).toBe('function');
    });

    it('should accept options during initialization', () => {
      const onError = vi.fn();
      const context = 'test-context';

      const { result } = renderHook(() => 
        useErrorBoundary({ context, onError })
      );

      expect(result.current.captureError).toBeDefined();
    });
  });

  describe('captureError', () => {
    it('should report error and throw to trigger boundary with Error object', async () => {
      const onError = vi.fn();
      const context = 'test-capture';
      
      const { result } = renderHook(() => 
        useErrorBoundary({ context, onError })
      );

      const testError = new Error('Test capture error');

      try {
        await act(async () => {
          await result.current.captureError(testError);
        });
        // Should not reach here as error should be thrown
        expect(true).toBe(false);
      } catch (thrownError) {
        expect(thrownError).toBe(testError);
        expect(errorReporting.errorReportingService.reportError).toHaveBeenCalledWith(
          testError,
          undefined,
          { context }
        );
        expect(onError).toHaveBeenCalledWith(testError);
      }
    });

    it('should convert string errors to Error objects', async () => {
      const { result } = renderHook(() => useErrorBoundary());

      try {
        await act(async () => {
          await result.current.captureError('String error message');
        });
        expect(true).toBe(false);
      } catch (thrownError) {
        expect(thrownError).toBeInstanceOf(Error);
        expect((thrownError as Error).message).toBe('String error message');
      }
    });

    it('should include errorInfo when provided', async () => {
      const { result } = renderHook(() => useErrorBoundary());
      const testError = new Error('Test error');
      const errorInfo = {
        componentStack: '\n    in TestComponent\n    in ErrorBoundary',
      };

      try {
        await act(async () => {
          await result.current.captureError(testError, errorInfo);
        });
        expect(true).toBe(false);
      } catch (_thrownError) {
        expect(errorReporting.errorReportingService.reportError).toHaveBeenCalledWith(
          testError,
          errorInfo,
          expect.any(Object)
        );
      }
    });

    it('should still throw error even if reporting fails', async () => {
      // Mock reporting to fail
      vi.mocked(errorReporting.errorReportingService.reportError).mockRejectedValueOnce(
        new Error('Reporting failed')
      );

      const { result } = renderHook(() => useErrorBoundary());
      const testError = new Error('Test error');

      try {
        await act(async () => {
          await result.current.captureError(testError);
        });
        expect(true).toBe(false);
      } catch (thrownError) {
        expect(thrownError).toBe(testError);
      }
    });
  });

  describe('reportError', () => {
    it('should report error without throwing', async () => {
      const onError = vi.fn();
      const context = 'test-report';
      
      const { result } = renderHook(() => 
        useErrorBoundary({ context, onError })
      );

      const testError = new Error('Test report error');

      await act(async () => {
        const eventId = await result.current.reportError(testError);
        expect(eventId).toBe('test-event-id');
        expect(errorReporting.errorReportingService.reportError).toHaveBeenCalledWith(
          testError,
          undefined,
          { context }
        );
        expect(onError).toHaveBeenCalledWith(testError);
      });
    });

    it('should convert string errors to Error objects for reporting', async () => {
      const { result } = renderHook(() => useErrorBoundary());

      await act(async () => {
        await result.current.reportError('String error for reporting');
      });

      expect(errorReporting.errorReportingService.reportError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'String error for reporting'
        }),
        undefined,
        expect.any(Object)
      );
    });

    it('should return empty string if reporting fails', async () => {
      vi.mocked(errorReporting.errorReportingService.reportError).mockRejectedValueOnce(
        new Error('Reporting failed')
      );

      const { result } = renderHook(() => useErrorBoundary());

      await act(async () => {
        const eventId = await result.current.reportError(new Error('Test'));
        expect(eventId).toBe('');
      });
    });
  });

  describe('captureNetworkError', () => {
    it('should report network errors', async () => {
      const context = 'test-network';
      const { result } = renderHook(() => useErrorBoundary({ context }));

      await act(async () => {
        await result.current.captureNetworkError('/api/test', 500, 'Internal Server Error');
      });

      expect(errorReporting.errorReportingService.reportNetworkError).toHaveBeenCalledWith(
        '/api/test',
        500,
        'Internal Server Error',
        { context }
      );
    });

    it('should handle network errors without status', async () => {
      const { result } = renderHook(() => useErrorBoundary());

      await act(async () => {
        await result.current.captureNetworkError('/api/test');
      });

      expect(errorReporting.errorReportingService.reportNetworkError).toHaveBeenCalledWith(
        '/api/test',
        undefined,
        undefined,
        expect.any(Object)
      );
    });

    it('should handle reporting failures gracefully', async () => {
      vi.mocked(errorReporting.errorReportingService.reportNetworkError).mockRejectedValueOnce(
        new Error('Network reporting failed')
      );

      const { result } = renderHook(() => useErrorBoundary());

      // Should not throw
      await act(async () => {
        await result.current.captureNetworkError('/api/test');
      });

      expect(console.error).toHaveBeenCalledWith(
        'Failed to report network error:',
        expect.any(Error)
      );
    });
  });

  describe('captureChunkError', () => {
    it('should report and throw chunk errors', async () => {
      const onError = vi.fn();
      const context = 'test-chunk';
      
      const { result } = renderHook(() => 
        useErrorBoundary({ context, onError })
      );

      try {
        await act(async () => {
          await result.current.captureChunkError('test-chunk');
        });
        expect(true).toBe(false);
      } catch (thrownError) {
        expect(thrownError).toBeInstanceOf(Error);
        expect((thrownError as Error).name).toBe('ChunkLoadError');
        expect((thrownError as Error).message).toBe('Failed to load chunk: test-chunk');
        
        expect(errorReporting.errorReportingService.reportChunkError).toHaveBeenCalledWith(
          'test-chunk',
          { context }
        );
        expect(onError).toHaveBeenCalled();
      }
    });

    it('should handle chunk errors without chunk name', async () => {
      const { result } = renderHook(() => useErrorBoundary());

      try {
        await act(async () => {
          await result.current.captureChunkError();
        });
        expect(true).toBe(false);
      } catch (thrownError) {
        expect((thrownError as Error).message).toBe('Failed to load chunk: unknown');
      }
    });

    it('should still throw error even if chunk reporting fails', async () => {
      vi.mocked(errorReporting.errorReportingService.reportChunkError).mockRejectedValueOnce(
        new Error('Chunk reporting failed')
      );

      const { result } = renderHook(() => useErrorBoundary());

      try {
        await act(async () => {
          await result.current.captureChunkError('test-chunk');
        });
        expect(true).toBe(false);
      } catch (thrownError) {
        expect(thrownError).toBeInstanceOf(Error);
        expect((thrownError as Error).name).toBe('ChunkLoadError');
      }
    });
  });

  describe('Options Handling', () => {
    it('should use provided context in all error reporting', async () => {
      const context = 'custom-context';
      const { result } = renderHook(() => useErrorBoundary({ context }));

      // Test with reportError (doesn't throw)
      await act(async () => {
        await result.current.reportError(new Error('Test'));
      });

      expect(errorReporting.errorReportingService.reportError).toHaveBeenCalledWith(
        expect.any(Error),
        undefined,
        { context }
      );

      // Test with captureNetworkError
      await act(async () => {
        await result.current.captureNetworkError('/api/test');
      });

      expect(errorReporting.errorReportingService.reportNetworkError).toHaveBeenCalledWith(
        '/api/test',
        undefined,
        undefined,
        { context }
      );
    });

    it('should call onError callback for applicable methods', async () => {
      const onError = vi.fn();
      const { result } = renderHook(() => useErrorBoundary({ onError }));

      // Should call onError
      await act(async () => {
        await result.current.reportError(new Error('Test'));
      });
      expect(onError).toHaveBeenCalled();

      onError.mockClear();

      // Should NOT call onError for network errors
      await act(async () => {
        await result.current.captureNetworkError('/api/test');
      });
      expect(onError).not.toHaveBeenCalled();
    });
  });
});