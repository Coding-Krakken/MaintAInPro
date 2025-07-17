import { test as setup } from '@playwright/test';

const authFile = 'tests/e2e/auth.json';

setup('authenticate', async ({ page }) => {
  // Add environment variables for test mode
  await page.addInitScript(() => {
    // Mock environment variables for test mode
    (
      window as unknown as { process: { env: Record<string, string> } }
    ).process = {
      env: {
        ...((
          window as unknown as { process?: { env?: Record<string, string> } }
        ).process?.env || {}),
        NODE_ENV: 'test',
        VITE_SUPABASE_URL: 'https://test-supabase.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'test-anon-key',
        VITE_TEST_MODE: 'true',
      },
    };
  });

  // Mock authentication for E2E tests to avoid external dependencies
  await page.goto('/');

  // Instead of complex mocking, let's try to intercept the auth service calls
  await page.addInitScript(() => {
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'admin',
      permissions: ['read', 'write', 'admin'],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const mockSession = {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: 'bearer',
      user: mockUser,
    };

    // Override the auth service with mocked implementations
    (
      window as unknown as { mockAuthService: Record<string, unknown> }
    ).mockAuthService = {
      getCurrentUser: () => Promise.resolve(mockUser),
      getSession: () => Promise.resolve(mockSession),
      signIn: () => Promise.resolve({ requiresMFA: false }),
      signOut: () => Promise.resolve(),
      onAuthStateChange: (
        callback: (session: unknown, event: string) => void
      ) => {
        setTimeout(() => callback(mockSession, 'SIGNED_IN'), 100);
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
    };

    // Set localStorage to simulate authenticated state
    localStorage.setItem('auth-session', JSON.stringify(mockSession));
    localStorage.setItem('auth-user', JSON.stringify(mockUser));
  });

  // Wait for the page to load and then navigate to dashboard
  await page.waitForLoadState('networkidle');
  await page.goto('/dashboard');

  // Wait a bit for auth to settle
  await page.waitForTimeout(2000);

  // Save storage state for other tests
  await page.context().storageState({ path: authFile });
});
