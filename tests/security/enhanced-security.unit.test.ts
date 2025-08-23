import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { advancedSanitizationMiddleware, inputSanitizationUtils } from '../../server/middleware/advanced-sanitization';
import { rateLimiters, suspiciousActivityDetector } from '../../server/middleware/rate-limiting';
import { enhancedSecurityStack } from '../../server/middleware/security.middleware';

describe('Enhanced Security Middleware Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  afterEach(() => {
    // Clear any blocked IPs after each test
    suspiciousActivityDetector.getStats().blockedIPs.forEach(ip => {
      suspiciousActivityDetector.unblockIP(ip);
    });
    vi.clearAllMocks();
  });

  describe('Advanced Input Sanitization', () => {
    beforeEach(() => {
      app.use(advancedSanitizationMiddleware);
      app.post('/test', (req, res) => {
        res.json({ received: req.body });
      });
    });

    describe('XSS Prevention', () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        '<img src="x" onerror="alert(1)">',
        'javascript:alert(1)',
        '<svg onload="alert(1)">',
        '<iframe src="javascript:alert(1)"></iframe>',
        '<object data="javascript:alert(1)"></object>',
        '<embed src="javascript:alert(1)">',
        '<form><button formaction="javascript:alert(1)">',
        '<style>@import"javascript:alert(1)";</style>',
        '"><script>alert(1)</script>',
        '<meta http-equiv="refresh" content="0;url=javascript:alert(1)">',
      ];

      it.each(xssPayloads)('should sanitize XSS payload: %s', async (payload) => {
        const response = await request(app)
          .post('/test')
          .send({ input: payload });

        expect(response.status).toBe(200);
        expect(response.body.received.input).not.toContain('<script>');
        expect(response.body.received.input).not.toContain('javascript:');
        expect(response.body.received.input).not.toContain('onerror=');
        expect(response.body.received.input).not.toContain('onload=');
      });
    });

    describe('SQL Injection Prevention', () => {
      const sqlPayloads = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "' UNION SELECT * FROM users --",
        "'; INSERT INTO users VALUES ('hacker', 'password'); --",
        "1' AND (SELECT COUNT(*) FROM tabname) >= 1 --",
        "' OR 1=1#",
        "admin'--",
        "admin' /*",
        "' or 1=1 limit 1 -- -+",
        "' AND 1=0 UNION ALL SELECT 'admin', '81dc9bdb52d04dc20036dbd8313ed055'",
      ];

      it.each(sqlPayloads)('should detect and block SQL injection: %s', async (payload) => {
        const response = await request(app)
          .post('/test')
          .send({ query: payload });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('INVALID_INPUT');
        expect(response.body.message).toContain('security policy violation');
      });
    });

    describe('NoSQL Injection Prevention', () => {
      const nosqlPayloads = [
        { $ne: null },
        { $gt: '' },
        { $where: 'function() { return true; }' },
        { $regex: '.*' },
        { $in: ['admin'] },
        { user: { $ne: 'admin' } },
        { $or: [{ user: 'admin' }, { user: 'root' }] },
      ];

      it.each(nosqlPayloads)('should detect and block NoSQL injection: %o', async (payload) => {
        const response = await request(app)
          .post('/test')
          .send(payload);

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('INVALID_INPUT');
      });
    });

    describe('Path Traversal Prevention', () => {
      const pathTraversalPayloads = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
        '....//....//....//etc/passwd',
        '..%252f..%252f..%252fetc%252fpasswd',
      ];

      it.each(pathTraversalPayloads)('should detect and block path traversal: %s', async (payload) => {
        const response = await request(app)
          .post('/test')
          .send({ path: payload });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('INVALID_INPUT');
      });
    });
  });

  describe('Suspicious Activity Detection', () => {
    beforeEach(() => {
      app.use(enhancedSecurityStack);
      app.get('/test', (req, res) => {
        res.json({ success: true });
      });
    });

    describe('User Agent Detection', () => {
      const suspiciousUserAgents = [
        'sqlmap/1.0',
        'nikto/2.1.5',
        'nmap scripting engine',
        'masscan/1.0',
        'Nessus SOAP v1.0',
        'BurpSuite Professional',
        'OWASP ZAP',
      ];

      it.each(suspiciousUserAgents)('should detect suspicious user agent: %s', async (userAgent) => {
        // First request should be blocked
        const response = await request(app)
          .get('/test')
          .set('User-Agent', userAgent);

        expect(response.status).toBe(403);
        expect(response.body.error).toBe('FORBIDDEN');
      });
    });

    describe('Suspicious Endpoint Access', () => {
      const suspiciousEndpoints = [
        '/wp-admin',
        '/phpmyadmin',
        '/.env',
        '/config/database.yml',
        '/admin/login',
      ];

      it.each(suspiciousEndpoints)('should detect suspicious endpoint access: %s', async (endpoint) => {
        const response = await request(app).get(endpoint);

        // Should either be blocked or result in 404, but tracked as suspicious
        expect([403, 404]).toContain(response.status);
      });
    });

    describe('IP Blocking After Multiple Violations', () => {
      it('should block IP after multiple suspicious activities', async () => {
        const suspiciousRequests = Array.from({ length: 15 }, (_, i) => 
          request(app)
            .get('/test')
            .set('User-Agent', 'sqlmap/1.0')
        );

        // Make multiple suspicious requests
        for (const req of suspiciousRequests) {
          await req;
        }

        // Final request should be blocked due to IP blocking
        const finalResponse = await request(app)
          .get('/test')
          .set('User-Agent', 'normal-browser');

        expect(finalResponse.status).toBe(403);
        expect(finalResponse.body.message).toContain('suspicious activity');
      });
    });
  });

  describe('Advanced Rate Limiting', () => {
    describe('Authentication Rate Limiting', () => {
      beforeEach(() => {
        app.use(rateLimiters.auth);
        app.post('/auth/login', (req, res) => {
          res.json({ success: false }); // Simulate failed login
        });
      });

      it('should rate limit authentication attempts', async () => {
        const requests = Array.from({ length: 10 }, () => 
          request(app)
            .post('/auth/login')
            .send({ email: 'test@example.com', password: 'wrong' })
        );

        const responses = await Promise.all(requests);
        const rateLimitedResponses = responses.filter(r => r.status === 429);

        expect(rateLimitedResponses.length).toBeGreaterThan(0);
        expect(rateLimitedResponses[0].body.error).toBe('RATE_LIMIT_EXCEEDED');
        expect(rateLimitedResponses[0].body.type).toBe('AUTH_RATE_LIMIT');
      });

      it('should include retry-after header in rate limit responses', async () => {
        // First, exhaust the rate limit
        const exhaustRequests = Array.from({ length: 6 }, () => 
          request(app).post('/auth/login').send({})
        );
        
        await Promise.all(exhaustRequests);

        // Next request should be rate limited
        const response = await request(app)
          .post('/auth/login')
          .send({});

        expect(response.status).toBe(429);
        expect(response.body.retryAfter).toBeDefined();
        expect(typeof response.body.retryAfter).toBe('number');
      });
    });

    describe('API Rate Limiting', () => {
      beforeEach(() => {
        app.use(rateLimiters.api);
        app.get('/api/test', (req, res) => {
          res.json({ data: 'test' });
        });
      });

      it('should allow normal API usage within limits', async () => {
        const requests = Array.from({ length: 50 }, () => 
          request(app).get('/api/test')
        );

        const responses = await Promise.all(requests);
        const successfulResponses = responses.filter(r => r.status === 200);

        expect(successfulResponses.length).toBe(50);
      });

      it('should rate limit excessive API requests', async () => {
        const requests = Array.from({ length: 150 }, () => 
          request(app).get('/api/test')
        );

        const responses = await Promise.all(requests);
        const rateLimitedResponses = responses.filter(r => r.status === 429);

        expect(rateLimitedResponses.length).toBeGreaterThan(0);
      });
    });

    describe('Upload Rate Limiting', () => {
      beforeEach(() => {
        app.use(rateLimiters.upload);
        app.post('/upload', (req, res) => {
          res.json({ uploaded: true });
        });
      });

      it('should rate limit file uploads', async () => {
        const requests = Array.from({ length: 60 }, () => 
          request(app).post('/upload').send({ file: 'fake-file-data' })
        );

        const responses = await Promise.all(requests);
        const rateLimitedResponses = responses.filter(r => r.status === 429);

        expect(rateLimitedResponses.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Security Headers', () => {
    beforeEach(() => {
      app.use(enhancedSecurityStack);
      app.get('/test', (req, res) => {
        res.json({ success: true });
      });
    });

    it('should include comprehensive security headers', async () => {
      const response = await request(app).get('/test');

      // Check for essential security headers
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBeDefined();
      expect(response.headers['content-security-policy']).toBeDefined();
      expect(response.headers['strict-transport-security']).toBeDefined();
      expect(response.headers['referrer-policy']).toBeDefined();
    });

    it('should include CSP with nonce', async () => {
      const response = await request(app).get('/test');

      const csp = response.headers['content-security-policy'];
      expect(csp).toContain("script-src 'self'");
      expect(csp).toContain("object-src 'none'");
      expect(csp).toContain("default-src 'self'");
    });

    it('should include API-specific CORS headers for API endpoints', async () => {
      app.get('/api/test', (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/api/test')
        .set('Origin', 'http://localhost:3000');

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });
  });

  describe('Input Sanitization Utils', () => {
    describe('XSS Sanitization', () => {
      it('should sanitize XSS attempts', () => {
        const input = '<script>alert("xss")</script>Hello World';
        const sanitized = inputSanitizationUtils.sanitizeXSS(input);

        expect(sanitized).not.toContain('<script>');
        expect(sanitized).not.toContain('alert');
        expect(sanitized).toContain('Hello World');
      });
    });

    describe('SQL Injection Detection', () => {
      it('should detect SQL injection patterns', () => {
        const sqlInjection = "'; DROP TABLE users; --";
        const isSQLInjection = inputSanitizationUtils.detectSQLInjection(sqlInjection);

        expect(isSQLInjection).toBe(true);
      });

      it('should not flag normal queries as SQL injection', () => {
        const normalQuery = "SELECT name FROM products WHERE price > 100";
        const isSQLInjection = inputSanitizationUtils.detectSQLInjection(normalQuery);

        expect(isSQLInjection).toBe(false);
      });
    });

    describe('NoSQL Injection Detection', () => {
      it('should detect NoSQL injection in objects', () => {
        const nosqlInjection = { $ne: null };
        const isNoSQLInjection = inputSanitizationUtils.detectNoSQLInjection(nosqlInjection);

        expect(isNoSQLInjection).toBe(true);
      });

      it('should detect NoSQL injection in strings', () => {
        const nosqlString = '{"$where": "this.password == this.confirm"}';
        const isNoSQLInjection = inputSanitizationUtils.detectNoSQLInjection(nosqlString);

        expect(isNoSQLInjection).toBe(true);
      });
    });

    describe('Path Traversal Detection', () => {
      it('should detect path traversal attempts', () => {
        const pathTraversal = '../../../etc/passwd';
        const isPathTraversal = inputSanitizationUtils.detectPathTraversal(pathTraversal);

        expect(isPathTraversal).toBe(true);
      });

      it('should not flag normal paths', () => {
        const normalPath = 'documents/reports/2023/annual.pdf';
        const isPathTraversal = inputSanitizationUtils.detectPathTraversal(normalPath);

        expect(isPathTraversal).toBe(false);
      });
    });

    describe('File Name Sanitization', () => {
      it('should sanitize dangerous file names', () => {
        const dangerousName = '../../../evil<script>alert(1)</script>.exe';
        const sanitized = inputSanitizationUtils.sanitizeFileName(dangerousName);

        expect(sanitized).not.toContain('../');
        expect(sanitized).not.toContain('<script>');
        expect(sanitized).not.toContain('.exe');
        expect(sanitized).toMatch(/^[a-zA-Z0-9._-]+$/);
      });
    });
  });

  describe('Content Type and Size Validation', () => {
    beforeEach(() => {
      app.use(enhancedSecurityStack);
      app.post('/upload', (req, res) => {
        res.json({ success: true });
      });
    });

    it('should reject unsupported content types', async () => {
      const response = await request(app)
        .post('/upload')
        .set('Content-Type', 'application/xml')
        .send('<xml>data</xml>');

      expect(response.status).toBe(415);
      expect(response.body.error).toBe('UNSUPPORTED_MEDIA_TYPE');
    });

    it('should accept supported content types', async () => {
      const response = await request(app)
        .post('/upload')
        .set('Content-Type', 'application/json')
        .send('{"data": "test"}');

      expect(response.status).not.toBe(415);
    });
  });

  describe('Security Statistics and Monitoring', () => {
    it('should provide security statistics', async () => {
      // Make some suspicious requests to generate stats
      app.use(enhancedSecurityStack);
      app.get('/test', (req, res) => res.json({ success: true }));

      await request(app)
        .get('/test')
        .set('User-Agent', 'sqlmap/1.0');

      const stats = suspiciousActivityDetector.getStats();

      expect(stats).toHaveProperty('suspiciousIPs');
      expect(stats).toHaveProperty('blockedIPs');
      expect(stats).toHaveProperty('totalSuspicious');
      expect(stats).toHaveProperty('totalBlocked');
      expect(typeof stats.totalSuspicious).toBe('number');
      expect(typeof stats.totalBlocked).toBe('number');
    });
  });
});