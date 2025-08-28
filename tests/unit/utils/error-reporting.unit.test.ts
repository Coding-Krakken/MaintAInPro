import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ErrorReportingService,
  reportError,
  reportNetworkError,
  reportChunkError,
} from '../../../client/src/utils/error-reporting';
import type { ErrorInfo } from '../../../client/src/components/ErrorBoundary/ErrorBoundary';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock navigator
Object.defineProperty(window, 'navigator', {
  value: { userAgent: 'test-user-agent' },
});

// Mock location
Object.defineProperty(window, 'location', {
  value: { href: 'http://localhost:3000/test' },
});

// Suppress console logs for tests
const originalConsole = {
  error: console.error,
  warn: console.warn,
  group: console.group,
  groupEnd: console.groupEnd,
};

beforeEach(() => {
  console.error = vi.fn();
  console.warn = vi.fn();
  console.group = vi.fn();
  console.groupEnd = vi.fn();
  vi.clearAllMocks();
  localStorageMock.getItem.mockReturnValue(null);
});

afterEach(() => {
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  console.group = originalConsole.group;
  console.groupEnd = originalConsole.groupEnd;
});

describe('ErrorReportingService', () => {
  let service: ErrorReportingService;

  beforeEach(() => {
    service = new ErrorReportingService();
  });

  describe('Initialization', () => {
    it('should create instance with session ID', () => {
      const sessionId = service.getSessionId();
      expect(sessionId).toMatch(/^session-\d+-\w+$/);
    });

    it('should create singleton instance', () => {
      const instance1 = ErrorReportingService.getInstance();
      const instance2 = ErrorReportingService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('reportError', () => {
    it('should report error with basic information', async () => {
      const error = new Error('Test error');
      const eventId = await service.reportError(error);

      expect(eventId).toMatch(/^error-\d+-\w+$/);
    });

    it('should report error with error info', async () => {
      const error = new Error('Test error');
      const errorInfo: ErrorInfo = {
        componentStack: '\n    in TestComponent\n    in ErrorBoundary',
      };

      const eventId = await service.reportError(error, errorInfo);
      expect(eventId).toMatch(/^error-\d+-\w+$/);
    });

    it('should report error with options', async () => {
      const error = new Error('Test error');
      const options = {
        context: 'test-context',
        userId: 'user-123',
        tags: { component: 'test-component' },
        extra: { customData: 'test' },
      };

      const eventId = await service.reportError(error, undefined, options);
      expect(eventId).toMatch(/^error-\d+-\w+$/);
    });

    it('should store error locally', async () => {
      const error = new Error('Test error');
      await service.reportError(error);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'maintainpro_error_log',
        expect.stringContaining('Test error')
      );
    });

    it('should handle localStorage failure gracefully', async () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('LocalStorage full');
      });

      const error = new Error('Test error');
      const eventId = await service.reportError(error);

      expect(eventId).toMatch(/^error-\d+-\w+$/);
      expect(console.warn).toHaveBeenCalledWith(
        'Failed to store error locally:',
        expect.any(Error)
      );
    });

    it('should not report when disabled', async () => {
      service.setEnabled(false);

      const error = new Error('Test error');
      const eventId = await service.reportError(error);

      expect(eventId).toBe('');
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should log detailed information in development', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Test error');
      error.stack = 'Error stack trace';

      const errorInfo: ErrorInfo = {
        componentStack: '\n    in Component',
      };

      await service.reportError(error, errorInfo, { context: 'test' });

      expect(console.group).toHaveBeenCalledWith(
        expect.stringMatching(/🚨 Error Report \[error-\d+-\w+\]/)
      );
      expect(console.error).toHaveBeenCalledWith('Error:', 'Error', '-', 'Test error');
      expect(console.error).toHaveBeenCalledWith('Stack:', 'Error stack trace');
      expect(console.error).toHaveBeenCalledWith('Component Stack:', '\n    in Component');
      expect(console.groupEnd).toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('reportNetworkError', () => {
    it('should report network error with URL and status', async () => {
      const eventId = await service.reportNetworkError('/api/test', 404, 'Not Found');

      expect(eventId).toMatch(/^error-\d+-\w+$/);
    });

    it('should report network error without status', async () => {
      const eventId = await service.reportNetworkError('/api/test');

      expect(eventId).toMatch(/^error-\d+-\w+$/);
    });

    it('should include URL in error message', async () => {
      await service.reportNetworkError('/api/test', 500, 'Server Error');

      const setItemCall = localStorageMock.setItem.mock.calls[0];
      const storedData = JSON.parse(setItemCall[1]);

      expect(storedData[0].error.message).toContain('/api/test');
      expect(storedData[0].error.message).toContain('500');
      expect(storedData[0].error.message).toContain('Server Error');
    });
  });

  describe('reportChunkError', () => {
    it('should report chunk error with chunk name', async () => {
      const eventId = await service.reportChunkError('vendor-chunk');

      expect(eventId).toMatch(/^error-\d+-\w+$/);
    });

    it('should report chunk error without chunk name', async () => {
      const eventId = await service.reportChunkError();

      expect(eventId).toMatch(/^error-\d+-\w+$/);
    });

    it('should include chunk name in error message', async () => {
      await service.reportChunkError('test-chunk');

      const setItemCall = localStorageMock.setItem.mock.calls[0];
      const storedData = JSON.parse(setItemCall[1]);

      expect(storedData[0].error.message).toContain('test-chunk');
      expect(storedData[0].error.name).toBe('ChunkLoadError');
    });
  });

  describe('Local Storage Management', () => {
    it('should retrieve stored errors', () => {
      const mockErrors = [
        { error: { message: 'Error 1' }, timestamp: '2023-01-01T00:00:00Z' },
        { error: { message: 'Error 2' }, timestamp: '2023-01-02T00:00:00Z' },
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockErrors));

      const storedErrors = service.getStoredErrors();
      expect(storedErrors).toEqual(mockErrors);
    });

    it('should return empty array if no stored errors', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const storedErrors = service.getStoredErrors();
      expect(storedErrors).toEqual([]);
    });

    it('should return empty array if localStorage parsing fails', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');

      const storedErrors = service.getStoredErrors();
      expect(storedErrors).toEqual([]);
    });

    it('should clear stored errors', () => {
      service.clearStoredErrors();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('maintainpro_error_log');
    });

    it('should handle clear errors failure gracefully', () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('Cannot remove');
      });

      service.clearStoredErrors();
      expect(console.warn).toHaveBeenCalledWith(
        'Failed to clear stored errors:',
        expect.any(Error)
      );
    });

    it('should limit stored errors to 50 items', async () => {
      // Setup 55 existing errors
      const existingErrors = Array.from({ length: 55 }, (_, i) => ({
        error: { message: `Error ${i}` },
        timestamp: new Date().toISOString(),
      }));
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingErrors));

      const error = new Error('New error');
      await service.reportError(error);

      const setItemCall = localStorageMock.setItem.mock.calls[0];
      const storedData = JSON.parse(setItemCall[1]);

      expect(storedData).toHaveLength(50);
      // Should keep the most recent errors (last 49 + the new one)
      expect(storedData[0].error.message).toBe('Error 6'); // First kept error
      expect(storedData[49].error.message).toBe('New error'); // New error
    });
  });

  describe('Enable/Disable Functionality', () => {
    it('should be enabled by default', () => {
      expect(service['isEnabled']).toBe(true);
    });

    it('should allow enabling and disabling', () => {
      service.setEnabled(false);
      expect(service['isEnabled']).toBe(false);

      service.setEnabled(true);
      expect(service['isEnabled']).toBe(true);
    });
  });
});

describe('Convenience Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should export reportError convenience function', async () => {
    const error = new Error('Convenience test');
    const eventId = await reportError(error);

    expect(eventId).toMatch(/^error-\d+-\w+$/);
  });

  it('should export reportNetworkError convenience function', async () => {
    const eventId = await reportNetworkError('/api/test', 404);

    expect(eventId).toMatch(/^error-\d+-\w+$/);
  });

  it('should export reportChunkError convenience function', async () => {
    const eventId = await reportChunkError('test-chunk');

    expect(eventId).toMatch(/^error-\d+-\w+$/);
  });
});
