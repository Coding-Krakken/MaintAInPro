import { TextEncoder, TextDecoder } from 'util';
import '@testing-library/dom';
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// import { server } from './mocks/server'

// Polyfills for Node.js globals that may not be available in jsdom
import { TextEncoder, TextDecoder } from 'util';

// Ensure TextEncoder is available globally
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Fix for esbuild TextEncoder issue in test environment
if (typeof globalThis !== 'undefined') {
  if (!globalThis.TextEncoder) {
    globalThis.TextEncoder = TextEncoder;
    globalThis.TextDecoder = TextDecoder;
  }
  // Additional fix for vitest/jsdom compatibility
  if (typeof window !== 'undefined') {
    if (!window.TextEncoder) {
      (window as any).TextEncoder = TextEncoder;
      (window as any).TextDecoder = TextDecoder;
    }
  }
}

// Mock environment variables
vi.mock('process', () => ({
  env: {
    NODE_ENV: 'test',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/maintainpro_test',
    REDIS_URL: 'redis://localhost:6379',
    JWT_SECRET: 'test-secret',
    SESSION_SECRET: 'test-session-secret',
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
vi.stubGlobal('localStorage', localStorageMock);

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
vi.stubGlobal('sessionStorage', sessionStorageMock);

// Mock window.matchMedia (only in browser environment)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Setup MSW
// beforeAll(() => server.listen())
afterEach(() => {
  cleanup();
  // server.resetHandlers()
  vi.clearAllMocks();
});
