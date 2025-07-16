import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent, expect } from '@storybook/test';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { action } from '@storybook/addon-actions';
import LoginMFA from '../pages/LoginMFA';
import { AuthProvider } from '@/modules/auth/hooks/useAuth';

// Mock the auth service
const mockAuthService = {
  signIn: action('signIn'),
  verifyMFAAndCompleteLogin: action('verifyMFAAndCompleteLogin'),
  getSession: () => Promise.resolve(null),
  getCurrentUser: () => Promise.resolve(null),
  onAuthStateChange: () => ({
    data: { subscription: { unsubscribe: () => {} } },
  }),
};

// Mock the MFA service
const mockMFAService = {
  getMFAStatus: () => Promise.resolve({ enabled: false }),
  verifyMFA: () => Promise.resolve({ success: true }),
};

// Mock the user service
const mockUserService = {
  getProfile: () => Promise.resolve(null),
  updateProfile: () => Promise.resolve(null),
};

// Mock modules
const mockModules = {
  '@/modules/auth/services/authService': { authService: mockAuthService },
  '@/modules/auth/services/mfaService': { mfaService: mockMFAService },
  '@/lib/database': { userService: mockUserService },
  '@/lib/supabase': {
    supabase: {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null } }),
        getUser: () => Promise.resolve({ data: { user: null } }),
        onAuthStateChange: () => ({
          data: { subscription: { unsubscribe: () => {} } },
        }),
      },
    },
  },
};

// Set up mocks
Object.entries(mockModules).forEach(([path, module]) => {
  (
    window as typeof window & { __STORYBOOK_MOCKS__?: Record<string, unknown> }
  ).__STORYBOOK_MOCKS__ = {
    ...((
      window as typeof window & {
        __STORYBOOK_MOCKS__?: Record<string, unknown>;
      }
    ).__STORYBOOK_MOCKS__ || {}),
    [path]: module,
  };
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const meta: Meta<typeof LoginMFA> = {
  title: 'Pages/LoginMFA',
  component: LoginMFA,
  decorators: [
    Story => (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <Story />
            <Toaster />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
The LoginMFA component provides a comprehensive login experience with multi-factor authentication support.

## Features
- **Email and Password Login**: Standard authentication with validation
- **MFA Support**: Two-factor authentication with TOTP codes
- **Progressive Enhancement**: Seamlessly transitions to MFA when required
- **Form Validation**: Real-time validation with helpful error messages
- **Accessibility**: Full keyboard navigation and screen reader support
- **Development Mode**: Shows demo credentials in development environment

## Authentication Flow
1. User enters email and password
2. System checks if MFA is enabled for the user
3. If MFA is required, user is prompted for authentication code
4. Upon successful verification, user is logged in
5. If MFA is not required, user is logged in immediately

## Security Features
- Password visibility toggle
- MFA code input with numeric keyboard
- Automatic form reset on MFA failure
- Session management integration
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof LoginMFA>;

export const Default: Story = {
  name: 'Login Form',
  parameters: {
    docs: {
      description: {
        story: 'The default login form with email and password fields.',
      },
    },
  },
};

export const WithValidationErrors: Story = {
  name: 'Validation Errors',
  parameters: {
    docs: {
      description: {
        story:
          'Form validation errors are displayed when invalid data is entered.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Try to submit empty form
    const submitButton = canvas.getByRole('button', { name: 'Sign in' });
    await userEvent.click(submitButton);

    // Check for validation errors
    await expect(
      canvas.getByText('Please enter a valid email address')
    ).toBeInTheDocument();
    await expect(
      canvas.getByText('Password must be at least 6 characters')
    ).toBeInTheDocument();
  },
};

export const PasswordVisibilityToggle: Story = {
  name: 'Password Visibility',
  parameters: {
    docs: {
      description: {
        story: 'Users can toggle password visibility using the eye icon.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const passwordInput = canvas.getByPlaceholderText('Enter your password');
    const toggleButton = canvas.getByRole('button', { name: '' }); // Eye icon

    // Initially password is hidden
    expect(passwordInput).toHaveAttribute('type', 'password');

    // Click to show password
    await userEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');

    // Click to hide password again
    await userEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  },
};

export const MFARequired: Story = {
  name: 'MFA Required',
  parameters: {
    docs: {
      description: {
        story:
          'When MFA is enabled, users are prompted for their authentication code.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Mock the signIn to return MFA requirement
    mockAuthService.signIn = () =>
      Promise.resolve({
        requiresMFA: true,
        tempToken: 'temp-token',
      });

    // Fill in login form
    await userEvent.type(
      canvas.getByPlaceholderText('Enter your email'),
      'test@example.com'
    );
    await userEvent.type(
      canvas.getByPlaceholderText('Enter your password'),
      'password123'
    );

    // Submit form
    await userEvent.click(canvas.getByRole('button', { name: 'Sign in' }));

    // Should show MFA form
    await expect(
      canvas.getByText('Multi-Factor Authentication')
    ).toBeInTheDocument();
    await expect(canvas.getByPlaceholderText('000000')).toBeInTheDocument();
    await expect(
      canvas.getByRole('button', { name: 'Verify' })
    ).toBeInTheDocument();
  },
};

export const MFAVerification: Story = {
  name: 'MFA Verification',
  parameters: {
    docs: {
      description: {
        story:
          'Users can enter their 6-digit MFA code to complete authentication.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Mock the signIn to return MFA requirement
    mockAuthService.signIn = () =>
      Promise.resolve({
        requiresMFA: true,
        tempToken: 'temp-token',
      });

    // Fill in login form and submit
    await userEvent.type(
      canvas.getByPlaceholderText('Enter your email'),
      'test@example.com'
    );
    await userEvent.type(
      canvas.getByPlaceholderText('Enter your password'),
      'password123'
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Sign in' }));

    // Fill in MFA code
    await userEvent.type(canvas.getByPlaceholderText('000000'), '123456');

    // Verify the code input
    expect(canvas.getByPlaceholderText('000000')).toHaveValue('123456');
  },
};

export const MFABackToLogin: Story = {
  name: 'Back to Login',
  parameters: {
    docs: {
      description: {
        story: 'Users can return to the login form from the MFA screen.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Mock the signIn to return MFA requirement
    mockAuthService.signIn = () =>
      Promise.resolve({
        requiresMFA: true,
        tempToken: 'temp-token',
      });

    // Navigate to MFA form
    await userEvent.type(
      canvas.getByPlaceholderText('Enter your email'),
      'test@example.com'
    );
    await userEvent.type(
      canvas.getByPlaceholderText('Enter your password'),
      'password123'
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Sign in' }));

    // Should be on MFA form
    await expect(
      canvas.getByText('Multi-Factor Authentication')
    ).toBeInTheDocument();

    // Go back to login
    await userEvent.click(
      canvas.getByRole('button', { name: 'Back to Login' })
    );

    // Should be back on login form
    await expect(
      canvas.getByText('Sign in to MaintainPro')
    ).toBeInTheDocument();
  },
};

export const LoadingStates: Story = {
  name: 'Loading States',
  parameters: {
    docs: {
      description: {
        story: 'Login and MFA forms show loading states during authentication.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Mock delayed response
    mockAuthService.signIn = () =>
      new Promise(resolve =>
        setTimeout(() => resolve({ requiresMFA: false }), 2000)
      );

    // Fill in form
    await userEvent.type(
      canvas.getByPlaceholderText('Enter your email'),
      'test@example.com'
    );
    await userEvent.type(
      canvas.getByPlaceholderText('Enter your password'),
      'password123'
    );

    // Submit and check loading state
    await userEvent.click(canvas.getByRole('button', { name: 'Sign in' }));

    // Should show loading state
    expect(canvas.getByText('Signing in...')).toBeInTheDocument();
    expect(
      canvas.getByRole('button', { name: /Signing in.../i })
    ).toBeDisabled();
  },
};

export const DevelopmentMode: Story = {
  name: 'Development Mode',
  parameters: {
    docs: {
      description: {
        story:
          'In development mode, demo credentials are displayed to help with testing.',
      },
    },
  },
  beforeEach: () => {
    // Mock development mode
    Object.defineProperty(import.meta, 'env', {
      value: { MODE: 'development' },
      writable: true,
    });
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Check for demo credentials
    await expect(canvas.getByText('Demo Credentials')).toBeInTheDocument();
    await expect(
      canvas.getByText('Admin: admin@maintainpro.com / password123')
    ).toBeInTheDocument();
    await expect(
      canvas.getByText('Manager: manager@maintainpro.com / password123')
    ).toBeInTheDocument();
    await expect(
      canvas.getByText('Technician: tech@maintainpro.com / password123')
    ).toBeInTheDocument();
  },
};

export const ResponsiveDesign: Story = {
  name: 'Responsive Design',
  parameters: {
    docs: {
      description: {
        story:
          'The login form is fully responsive and works on all screen sizes.',
      },
    },
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: {
            width: '375px',
            height: '667px',
          },
        },
        tablet: {
          name: 'Tablet',
          styles: {
            width: '768px',
            height: '1024px',
          },
        },
      },
    },
  },
};
