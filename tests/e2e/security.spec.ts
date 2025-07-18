import { test, expect, type APIResponse } from '@playwright/test';

test.describe('Security Testing', () => {
  test('should prevent XSS attacks in form inputs', async ({ page }) => {
    await page.goto('/login');

    const xssPayload = '<script>alert("XSS")</script>';

    // Test XSS in email field
    await page.fill('[data-testid="email-input"]', xssPayload);
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');

    // Check that script is not executed
    const alerts: string[] = [];
    page.on('dialog', dialog => {
      alerts.push(dialog.message());
      dialog.accept();
    });

    await page.waitForTimeout(1000);
    expect(alerts).toHaveLength(0);

    // Check that the payload is properly escaped in the DOM
    const emailValue = await page.inputValue('[data-testid="email-input"]');
    expect(emailValue).toBe(xssPayload); // Should be stored as text, not executed
  });

  test('should enforce proper authentication', async ({ page }) => {
    // Try to access protected route without authentication
    await page.goto('/dashboard');

    // Should redirect to login
    await page.waitForURL('**/login');
    expect(page.url()).toContain('/login');
  });

  test('should validate CSRF protection', async ({ page, request }) => {
    await page.goto('/login');

    // Login first
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');

    // Try to make request without proper CSRF token
    const response = await request.post('/api/work-orders', {
      data: {
        title: 'Test Work Order',
        description: 'Test Description',
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Should be rejected due to missing CSRF token
    expect(response.status()).toBe(403);
  });

  test('should sanitize SQL injection attempts', async ({ page }) => {
    await page.goto('/work-orders');

    const sqlInjectionPayload = "'; DROP TABLE work_orders; --";

    // Try SQL injection in search field
    await page.fill('[data-testid="search-input"]', sqlInjectionPayload);
    await page.press('[data-testid="search-input"]', 'Enter');

    // Application should still function normally
    await page.waitForSelector('[data-testid="work-orders-list"]');

    // Check that no SQL error is displayed
    const errorMessage = await page
      .locator('[data-testid="error-message"]')
      .count();
    expect(errorMessage).toBe(0);
  });

  test('should implement proper session management', async ({
    page,
    context,
  }) => {
    await page.goto('/login');

    // Login
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');

    await page.waitForURL('**/dashboard');

    // Check that session cookie is set with proper security flags
    const cookies = await context.cookies();
    const sessionCookie = cookies.find(
      cookie => cookie.name.includes('session') || cookie.name.includes('auth')
    );

    if (sessionCookie) {
      expect(sessionCookie.httpOnly).toBe(true);
      expect(sessionCookie.secure).toBe(true);
      expect(sessionCookie.sameSite).toBe('Strict');
    }
  });

  test('should prevent unauthorized access to user data', async ({
    context,
  }) => {
    // Create two browser contexts for different users
    const user1Context = await context.browser()?.newContext();
    const user2Context = await context.browser()?.newContext();

    if (!user1Context || !user2Context) return;

    const user1Page = await user1Context.newPage();
    const user2Page = await user2Context.newPage();

    // User 1 logs in
    await user1Page.goto('/login');
    await user1Page.fill('[data-testid="email-input"]', 'user1@example.com');
    await user1Page.fill('[data-testid="password-input"]', 'password123');
    await user1Page.click('[data-testid="login-button"]');

    // User 2 logs in
    await user2Page.goto('/login');
    await user2Page.fill('[data-testid="email-input"]', 'user2@example.com');
    await user2Page.fill('[data-testid="password-input"]', 'password123');
    await user2Page.click('[data-testid="login-button"]');

    // User 1 creates a work order
    await user1Page.goto('/work-orders/new');
    await user1Page.fill('[data-testid="title-input"]', 'Private Work Order');
    await user1Page.fill(
      '[data-testid="description-input"]',
      'Confidential information'
    );
    await user1Page.click('[data-testid="submit-button"]');

    // Get the work order ID
    await user1Page.waitForURL('**/work-orders/**');
    const workOrderUrl = user1Page.url();
    const workOrderId = workOrderUrl.split('/').pop();

    // User 2 tries to access User 1's work order
    await user2Page.goto(`/work-orders/${workOrderId}`);

    // Should be denied access or redirected
    const currentUrl = user2Page.url();
    const hasAccess = currentUrl.includes(`/work-orders/${workOrderId}`);

    if (hasAccess) {
      // If URL is accessible, check if data is properly filtered
      const workOrderTitle = await user2Page
        .locator('[data-testid="work-order-title"]')
        .textContent();
      expect(workOrderTitle).not.toBe('Private Work Order');
    } else {
      // Should be redirected or show access denied
      expect(currentUrl).not.toContain(`/work-orders/${workOrderId}`);
    }

    await user1Context.close();
    await user2Context.close();
  });

  test('should validate file upload security', async ({ page }) => {
    await page.goto('/work-orders/new');

    // Try to upload a malicious file
    const maliciousContent = '<?php system($_GET["cmd"]); ?>';
    const buffer = Buffer.from(maliciousContent);

    // Create a file input if it exists
    const fileInput = page.locator('input[type="file"]');
    const fileInputCount = await fileInput.count();

    if (fileInputCount > 0) {
      await fileInput.setInputFiles({
        name: 'malicious.php',
        mimeType: 'application/x-php',
        buffer: buffer,
      });

      // Try to submit
      await page.click('[data-testid="submit-button"]');

      // Should show error or reject the file
      const errorMessage = await page
        .locator('[data-testid="file-error"]')
        .textContent();
      expect(errorMessage).toContain('file type not allowed');
    }
  });

  test('should implement rate limiting', async ({ request }) => {
    const loginUrl = '/api/auth/login';
    const attempts: Promise<APIResponse>[] = [];

    // Make multiple rapid login attempts
    for (let i = 0; i < 10; i++) {
      const response = request.post(loginUrl, {
        data: {
          email: 'test@example.com',
          password: 'wrongpassword',
        },
      });
      attempts.push(response);
    }

    const responses = await Promise.all(attempts);

    // At least some requests should be rate limited
    const rateLimitedResponses = responses.filter(
      response => response.status() === 429
    );
    expect(rateLimitedResponses.length).toBeGreaterThan(0);
  });

  test('should protect against clickjacking', async ({ page }) => {
    await page.goto('/');

    // Check for X-Frame-Options or CSP frame-ancestors
    const responseHeaders = await page.evaluate(() => {
      return fetch(window.location.href).then(response => {
        const headers: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          headers[key] = value;
        });
        return headers;
      });
    });

    const hasClickjackingProtection =
      responseHeaders['x-frame-options'] ||
      (responseHeaders['content-security-policy'] &&
        responseHeaders['content-security-policy'].includes('frame-ancestors'));

    expect(hasClickjackingProtection).toBeTruthy();
  });

  test('should validate input length limits', async ({ page }) => {
    await page.goto('/work-orders/new');

    // Try to input extremely long text
    const longText = 'A'.repeat(10000);

    await page.fill('[data-testid="title-input"]', longText);
    await page.fill('[data-testid="description-input"]', longText);

    await page.click('[data-testid="submit-button"]');

    // Should show validation error
    const validationError = await page
      .locator('[data-testid="validation-error"]')
      .count();
    expect(validationError).toBeGreaterThan(0);
  });
});
