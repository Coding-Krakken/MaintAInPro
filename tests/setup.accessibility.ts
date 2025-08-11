import '@testing-library/dom';
import { vi, expect } from 'vitest';
import { configureAxe } from 'vitest-axe';
import * as matchers from 'vitest-axe/matchers';

// Extend Vitest matchers
expect.extend(matchers);

// Configure axe for accessibility testing
const axe = configureAxe({
  rules: {
    // Enable additional accessibility rules
    'color-contrast': { enabled: true },
    'focus-order-semantics': { enabled: true },
    'landmark-unique': { enabled: true },
    region: { enabled: true },
  },
});

// Make axe available globally
global.axe = axe;

// Mock window.matchMedia for accessibility tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

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

// Remove invalid vi.setTimeout usage; use test timeout in individual tests if needed
