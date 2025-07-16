import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoginMFA from '../pages/LoginMFA';
import { AuthProvider } from '@/modules/auth/hooks/useAuth';
import type { User } from '@/types';

// Mock the auth service
vi.mock('@/modules/auth/services/authService', () => ({
  authService: {
    signIn: vi.fn(),
    verifyMFAAndCompleteLogin: vi.fn(),
    getSession: vi.fn(),
    getCurrentUser: vi.fn(),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
  },
}));

// Mock the MFA service
vi.mock('@/modules/auth/services/mfaService', () => ({
  mfaService: {
    getMFAStatus: vi.fn(),
    verifyMFA: vi.fn(),
  },
}));

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
  },
}));

// Mock the user service
vi.mock('@/lib/database', () => ({
  userService: {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );

  return TestWrapper;
};

describe('LoginMFA', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form correctly', () => {
    render(<LoginMFA />, { wrapper: createWrapper() });

    expect(screen.getByText('Sign in to MaintainPro')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Enter your password')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('shows validation errors for invalid input', async () => {
    render(<LoginMFA />, { wrapper: createWrapper() });

    const submitButton = screen.getByRole('button', { name: 'Sign in' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Please enter a valid email address')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Password must be at least 6 characters')
      ).toBeInTheDocument();
    });
  });

  it('toggles password visibility', () => {
    render(<LoginMFA />, { wrapper: createWrapper() });

    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const toggleButton = screen.getByRole('button', { name: '' }); // Eye icon button

    expect(passwordInput).toHaveAttribute('type', 'password');

    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');

    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('shows MFA form when MFA is required', async () => {
    const { authService } = await import('@/modules/auth/services/authService');
    vi.mocked(authService.signIn).mockResolvedValue({
      user: null,
      error: null,
      requiresMFA: true,
      tempToken: 'temp-token',
    });

    render(<LoginMFA />, { wrapper: createWrapper() });

    // Fill in login form
    fireEvent.change(screen.getByPlaceholderText('Enter your email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { value: 'password123' },
    });

    // Submit login form
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(
        screen.getByText('Multi-Factor Authentication')
      ).toBeInTheDocument();
      expect(screen.getByPlaceholderText('000000')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Verify' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Back to Login' })
      ).toBeInTheDocument();
    });
  });

  it('allows going back to login from MFA form', async () => {
    const { authService } = await import('@/modules/auth/services/authService');
    vi.mocked(authService.signIn).mockResolvedValue({
      user: null,
      error: null,
      requiresMFA: true,
      tempToken: 'temp-token',
    });

    render(<LoginMFA />, { wrapper: createWrapper() });

    // Fill in login form and submit
    fireEvent.change(screen.getByPlaceholderText('Enter your email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(
        screen.getByText('Multi-Factor Authentication')
      ).toBeInTheDocument();
    });

    // Go back to login
    fireEvent.click(screen.getByRole('button', { name: 'Back to Login' }));

    await waitFor(() => {
      expect(screen.getByText('Sign in to MaintainPro')).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('Enter your email')
      ).toBeInTheDocument();
    });
  });

  it('validates MFA code input', async () => {
    const { authService } = await import('@/modules/auth/services/authService');
    vi.mocked(authService.signIn).mockResolvedValue({
      user: null,
      error: null,
      requiresMFA: true,
      tempToken: 'temp-token',
    });

    render(<LoginMFA />, { wrapper: createWrapper() });

    // Navigate to MFA form
    fireEvent.change(screen.getByPlaceholderText('Enter your email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(
        screen.getByText('Multi-Factor Authentication')
      ).toBeInTheDocument();
    });

    // Submit empty MFA form
    fireEvent.click(screen.getByRole('button', { name: 'Verify' }));

    await waitFor(() => {
      expect(screen.getByText('MFA code must be 6 digits')).toBeInTheDocument();
    });
  });

  it('handles MFA verification success', async () => {
    const { authService } = await import('@/modules/auth/services/authService');
    vi.mocked(authService.signIn).mockResolvedValue({
      user: null,
      error: null,
      requiresMFA: true,
      tempToken: 'temp-token',
    });
    vi.mocked(authService.verifyMFAAndCompleteLogin).mockResolvedValue({
      user: {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'org_admin' as const,
        organizationId: 'org-1',
        warehouseIds: [],
        permissions: [],
        isActive: true,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as User,
      error: null,
    });

    render(<LoginMFA />, { wrapper: createWrapper() });

    // Navigate to MFA form
    fireEvent.change(screen.getByPlaceholderText('Enter your email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(
        screen.getByText('Multi-Factor Authentication')
      ).toBeInTheDocument();
    });

    // Enter MFA code and submit
    fireEvent.change(screen.getByPlaceholderText('000000'), {
      target: { value: '123456' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Verify' }));

    await waitFor(() => {
      expect(authService.verifyMFAAndCompleteLogin).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
        '123456'
      );
    });
  });

  it('handles MFA verification failure', async () => {
    const { authService } = await import('@/modules/auth/services/authService');
    vi.mocked(authService.signIn).mockResolvedValue({
      user: null,
      error: null,
      requiresMFA: true,
      tempToken: 'temp-token',
    });
    vi.mocked(authService.verifyMFAAndCompleteLogin).mockRejectedValue(
      new Error('Invalid MFA code')
    );

    render(<LoginMFA />, { wrapper: createWrapper() });

    // Navigate to MFA form
    fireEvent.change(screen.getByPlaceholderText('Enter your email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(
        screen.getByText('Multi-Factor Authentication')
      ).toBeInTheDocument();
    });

    // Enter MFA code and submit
    fireEvent.change(screen.getByPlaceholderText('000000'), {
      target: { value: '123456' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Verify' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid MFA code')).toBeInTheDocument();
    });
  });

  it('displays demo credentials in development mode', () => {
    const originalMode = import.meta.env.MODE;
    import.meta.env.MODE = 'development';

    render(<LoginMFA />, { wrapper: createWrapper() });

    expect(screen.getByText('Demo Credentials')).toBeInTheDocument();
    expect(
      screen.getByText('Admin: admin@maintainpro.com / password123')
    ).toBeInTheDocument();

    import.meta.env.MODE = originalMode;
  });
});
