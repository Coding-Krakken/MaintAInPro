# Supabase Authentication Configuration Update

## Problem

Playwright E2E tests are failing because Supabase authentication is configured for production URL
(`https://maintenance-pro.vercel.app`) but tests run against `http://localhost:3000`.

## Solution: Add Multiple URLs to Supabase Auth Settings

### 1. Update Site URL Configuration in Supabase Dashboard

Go to your Supabase project dashboard:

1. Navigate to **Authentication** > **URL Configuration**
2. Update the following settings:

**Site URL**: `https://maintenance-pro.vercel.app`

**Redirect URLs** (add all of these):

```
https://maintenance-pro.vercel.app/auth/callback
http://localhost:3000/auth/callback
http://localhost:3000/dashboard
http://localhost:3000
https://maintenance-pro.vercel.app/dashboard
https://maintenance-pro.vercel.app
```

### 2. Environment Variables for Testing

Create a `.env.test` file for test-specific configuration:

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_APP_URL=http://localhost:3000
```

### 3. Update Auth Service

The auth service should use the appropriate redirect URL based on environment:

```typescript
// In your auth service
import { getAuthBaseUrl } from '@/lib/supabase';

// For sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

// For sign up with redirect
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: `${getAuthBaseUrl()}/auth/callback`,
  },
});
```

### 4. Alternative: Mock Authentication for Tests

For E2E tests, you can mock the authentication entirely:

```typescript
// In your E2E tests setup
beforeEach(async ({ page }) => {
  // Mock authentication state
  await page.addInitScript(() => {
    const mockAuth = {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      session: {
        access_token: 'mock-token',
        refresh_token: 'mock-refresh-token',
        expires_at: Date.now() + 3600000, // 1 hour from now
      },
    };

    localStorage.setItem('supabase.auth.token', JSON.stringify(mockAuth));
    window.supabase = {
      auth: {
        getSession: () => Promise.resolve({ data: { session: mockAuth.session } }),
        getUser: () => Promise.resolve({ data: { user: mockAuth.user } }),
      },
    };
  });
});
```

## Recommended Approach

1. **Immediate Fix**: Add localhost URLs to Supabase auth configuration
2. **Long-term**: Implement environment-aware auth configuration
3. **Testing**: Consider mocking auth for E2E tests to avoid external dependencies

This ensures your tests work reliably regardless of network conditions or external service
availability.
