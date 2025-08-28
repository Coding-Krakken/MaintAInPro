import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import Auth from '../../client/src/pages/Auth';
import { useAuth } from '../../client/src/hooks/useAuth';
import { useToast } from '../../client/src/hooks/use-toast';

// Mock the hooks
vi.mock('../../client/src/hooks/useAuth');
vi.mock('../../client/src/hooks/use-toast');
vi.mock('wouter', () => ({
  useLocation: () => ['/login', vi.fn()],
}));

const mockUseAuth = vi.mocked(useAuth);
const mockUseToast = vi.mocked(useToast);

describe('Auth Component Enhanced UI', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      login: vi.fn(),
      logout: vi.fn(),
      user: null,
      isAuthenticated: false,
      isLoading: false,
    } as any);

    mockUseToast.mockReturnValue({
      toast: vi.fn(),
    } as any);
  });

  test('renders all required data-testid attributes', () => {
    render(<Auth />);

    // Check for existing data-testid attributes
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('login-button')).toBeInTheDocument();

    // Check for new data-testid attributes
    expect(screen.getByTestId('password-toggle-button')).toBeInTheDocument();
    expect(screen.getByTestId('remember-me-checkbox')).toBeInTheDocument();
    expect(screen.getByTestId('remember-me-label')).toBeInTheDocument();
  });

  test('password strength meter appears when password is entered', async () => {
    render(<Auth />);

    const passwordInput = screen.getByTestId('password-input');

    // Initially, no password strength meter
    expect(screen.queryByTestId('password-strength-meter')).not.toBeInTheDocument();

    // Enter a weak password
    fireEvent.change(passwordInput, { target: { value: 'weak' } });

    await waitFor(() => {
      expect(screen.getByTestId('password-strength-meter')).toBeInTheDocument();
      expect(screen.getByTestId('password-strength-bar')).toBeInTheDocument();
      expect(screen.getByTestId('password-strength-tip')).toBeInTheDocument();
      expect(screen.getByText('Weak')).toBeInTheDocument();
    });
  });

  test('password strength meter shows strong password feedback', async () => {
    render(<Auth />);

    const passwordInput = screen.getByTestId('password-input');

    // Enter a strong password
    fireEvent.change(passwordInput, { target: { value: 'StrongPassword123!' } });

    await waitFor(() => {
      expect(screen.getByTestId('password-strength-meter')).toBeInTheDocument();
      expect(screen.getByText('Strong')).toBeInTheDocument();
      expect(screen.getByTestId('password-strength-success')).toBeInTheDocument();
    });
  });

  test('password toggle button works correctly', () => {
    render(<Auth />);

    const passwordInput = screen.getByTestId('password-input') as HTMLInputElement;
    const toggleButton = screen.getByTestId('password-toggle-button');

    // Initially password is hidden
    expect(passwordInput.type).toBe('password');

    // Click toggle button to show password
    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('text');

    // Click again to hide password
    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('password');
  });

  test('remember me checkbox can be toggled', () => {
    render(<Auth />);

    const checkbox = screen.getByTestId('remember-me-checkbox');

    // Initially unchecked
    expect(checkbox).not.toBeChecked();

    // Click to check
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    // Click again to uncheck
    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  test('error message has correct data-testid', async () => {
    const mockLogin = vi.fn().mockRejectedValue(new Error('Invalid credentials'));
    mockUseAuth.mockReturnValue({
      login: mockLogin,
      logout: vi.fn(),
      user: null,
      isAuthenticated: false,
      isLoading: false,
    } as any);

    render(<Auth />);

    // Fill form and submit
    fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'password' } });
    fireEvent.click(screen.getByTestId('login-button'));

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(screen.getByTestId('error-message')).toHaveTextContent('Invalid credentials');
    });
  });

  test('form accessibility attributes are present', () => {
    render(<Auth />);

    // Check aria-label on password toggle
    expect(screen.getByTestId('password-toggle-button')).toHaveAttribute('aria-label');

    // Check label associations
    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const rememberMeLabel = screen.getByTestId('remember-me-label');

    expect(emailInput).toHaveAttribute('id', 'email');
    expect(passwordInput).toHaveAttribute('id', 'password');
    expect(rememberMeLabel).toHaveAttribute('for', 'remember-me');
  });
});
