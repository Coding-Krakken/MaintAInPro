import { test as setup } from '@playwright/test';

const authFile = 'tests/e2e/auth.json';

setup('authenticate', async ({ page }) => {
  // Mock authentication for E2E tests to avoid external dependencies
  await page.goto('/');

  // Mock Supabase auth state using addInitScript for reliability
  await page.addInitScript(() => {
    const mockAuthState = {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        confirmation_sent_at: null,
        confirmed_at: new Date().toISOString(),
        email_confirmed_at: new Date().toISOString(),
        phone: null,
        phone_confirmed_at: null,
        last_sign_in_at: new Date().toISOString(),
        role: 'authenticated',
        factors: [],
      },
      session: {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer',
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      },
    };

    // Store in localStorage as Supabase does, with error handling
    try {
      localStorage.setItem(
        'sb-supabase-auth-token',
        JSON.stringify(mockAuthState)
      );
    } catch (error) {
      console.warn('localStorage not available in test environment');
    }

    // Mock window.supabase if needed
    (
      window as unknown as Window & { mockAuth: typeof mockAuthState }
    ).mockAuth = mockAuthState;
  });

  // Navigate to dashboard to verify authentication works
  await page.goto('/dashboard');

  // Save storage state for other tests
  await page.context().storageState({ path: authFile });
});
