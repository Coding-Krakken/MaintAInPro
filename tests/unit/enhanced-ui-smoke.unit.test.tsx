import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import Auth from '../../client/src/pages/Auth';

// Mock the hooks with minimal setup
vi.mock('../../client/src/hooks/useAuth', () => ({
  useAuth: () => ({
    login: vi.fn(),
    logout: vi.fn(),
    user: null,
    isAuthenticated: false,
    isLoading: false,
  }),
}));

vi.mock('../../client/src/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock('wouter', () => ({
  useLocation: () => ['/login', vi.fn()],
}));

describe('Enhanced Auth Component - Data TestIDs', () => {
  test('renders all new data-testid selectors', () => {
    render(<Auth />);

    // Check that new selectors exist (basic smoke test)
    expect(screen.getByTestId('password-toggle-button')).toBeInTheDocument();
    expect(screen.getByTestId('remember-me-checkbox')).toBeInTheDocument();
    expect(screen.getByTestId('remember-me-label')).toBeInTheDocument();

    // Original selectors should still exist
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('login-button')).toBeInTheDocument();
  });
});
