# Enhanced Security Middleware Implementation

## Overview
This document outlines the implementation of enhanced security middleware for the MaintAInPro CMMS application, addressing issue #410.

## Features Implemented

### 1. Advanced Rate Limiting (`server/middleware/rate-limiting.ts`)

#### Redis-Backed Distributed Rate Limiting
- **Redis Integration**: Optional Redis backend for distributed rate limiting across multiple server instances
- **Graceful Fallback**: Falls back to in-memory rate limiting if Redis is unavailable

#### Rate Limiting Profiles
```typescript
- auth: 5 requests / 15 minutes (authentication endpoints)
- passwordReset: 3 requests / 1 hour (password reset)
- api: 100 requests / 1 minute (general API, admin bypass available)
- upload: 50 requests / 15 minutes (file uploads)
- export: 10 requests / 1 hour (data exports)
- admin: 200 requests / 5 minutes (admin operations)
```

#### Suspicious Activity Detection
- **Pattern-Based Detection**: Identifies suspicious user agents, endpoints, and query patterns
- **IP Blocking**: Automatically blocks IPs after multiple suspicious activities (configurable threshold)
- **Admin Management**: Provides functions to unblock IPs and get security statistics

### 2. Advanced Input Sanitization (`server/middleware/advanced-sanitization.ts`)

#### XSS Prevention
- **Comprehensive Pattern Removal**: Removes script tags, event handlers, javascript: URLs
- **HTML Entity Encoding**: Encodes remaining HTML entities safely
- **Dangerous Function Removal**: Removes references to alert(), eval(), setTimeout(), etc.

#### SQL Injection Protection
- **Pattern Detection**: Identifies common SQL injection patterns including:
  - Union-based attacks
  - Boolean-based attacks
  - Time-based attacks
  - Comment-based attacks
  - Information schema queries

#### NoSQL Injection Protection
- **MongoDB Operator Detection**: Identifies NoSQL operators like $where, $ne, $gt, etc.
- **Object and String Analysis**: Scans both object properties and serialized strings

#### Path Traversal Protection
- **Directory Traversal Detection**: Identifies ../, ..\\, URL-encoded variants
- **File Name Sanitization**: Cleans file names for safe storage

#### Content Validation
- **Content Type Validation**: Ensures only allowed content types are processed
- **Request Size Validation**: Enforces maximum request payload sizes
- **File Upload Validation**: Validates and sanitizes uploaded file names

### 3. Enhanced Security Headers (`server/middleware/security.middleware.ts`)

#### Helmet.js Integration
- **Content Security Policy (CSP)**: Comprehensive CSP with nonce support
- **Strict Transport Security (HSTS)**: Forces HTTPS connections
- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Prevents MIME type sniffing
- **Referrer Policy**: Controls referrer information

#### Custom Security Headers
- **Permissions Policy**: Restricts access to sensitive browser APIs
- **Custom API Headers**: Version information, request IDs, powered-by headers
- **Enhanced CORS**: Configurable CORS policies for API endpoints

### 4. Security Monitoring and Logging

#### Enhanced Audit Logging
- **Security Event Classification**: Categorizes events as suspicious, blocked, or rate-limited
- **Detailed Context**: Logs IP addresses, user agents, user/organization IDs
- **Database Integration**: Stores security events in system logs table
- **Performance Tracking**: Monitors request duration and response codes

#### Security Statistics
- **Real-Time Monitoring**: Provides current suspicious activity statistics
- **IP Management**: Tracks blocked IPs and suspicious activity counts
- **Admin Dashboard Integration**: Exposes security metrics for monitoring

## Usage Examples

### Basic Implementation
```typescript
import { enhancedSecurityStack } from './middleware/security.middleware';

// Apply global security middleware
app.use(enhancedSecurityStack);
```

### Endpoint-Specific Rate Limiting
```typescript
import { rateLimiters } from './middleware/security.middleware';

// Apply specific rate limiting
app.use('/api/auth', rateLimiters.auth);
app.use('/api', rateLimiters.api); // Skips admins
app.use('/api/upload', rateLimiters.upload);
```

### Advanced Schema Validation
```typescript
import { advancedSchemaValidation } from './middleware/advanced-sanitization';

const createUserSchema = {
  body: z.object({
    name: z.string().min(1).max(100),
    email: z.string().email(),
  }),
};

app.post('/api/users', 
  advancedSchemaValidation(createUserSchema),
  handler
);
```

### Security Management
```typescript
import { getSecurityStats, unblockIP } from './middleware/security.middleware';

// Get security statistics
const stats = getSecurityStats();

// Unblock an IP address
const success = unblockIP('192.168.1.100');
```

## Configuration

### Environment Variables
```env
# Redis configuration for distributed rate limiting
REDIS_URL=redis://localhost:6379

# Frontend URLs for CORS
FRONTEND_URL=http://localhost:3000
PRODUCTION_URL=https://yourdomain.com
```

### Initialization
```typescript
import { initializeSecurity } from './middleware/security.middleware';

// Initialize Redis and other security services
await initializeSecurity();
```

## Security Testing

### Test Coverage
- **Input Sanitization**: 17 unit tests covering XSS, SQL injection, NoSQL injection, path traversal
- **Rate Limiting**: Tests for different rate limit profiles and bypass functionality
- **Suspicious Activity**: Tests for detection patterns and IP blocking
- **Security Headers**: Validation of all security headers

### Running Tests
```bash
# Run all security tests
npm run test:unit -- tests/security/

# Run specific sanitization tests
npm run test:unit -- tests/security/sanitization.unit.test.ts
```

## Performance Considerations

### Redis Integration
- **Optional Dependency**: System works without Redis but benefits from distributed caching
- **Connection Handling**: Graceful error handling and fallback to memory storage
- **Prefix Strategy**: Uses 'rl:' prefix for rate limiting keys

### Memory Usage
- **Automatic Cleanup**: Suspicious IP tracking automatically removes old entries
- **Configurable Thresholds**: Adjustable limits for memory usage vs. security

### Request Processing
- **Middleware Order**: Optimized order for minimal performance impact
- **Early Termination**: Suspicious requests are blocked early in the pipeline

## Future Enhancements

### Planned Features
- [ ] IP Geolocation integration for enhanced threat detection
- [ ] Machine learning-based anomaly detection
- [ ] Integration with external threat intelligence feeds
- [ ] Automated security report generation

### Monitoring Integration
- [ ] Prometheus metrics export
- [ ] Grafana dashboard templates
- [ ] Alert manager integration
- [ ] Real-time security notifications

## Security Compliance

This implementation addresses common security vulnerabilities:

- ✅ **OWASP Top 10 2023**: Injection, XSS, Security Misconfiguration
- ✅ **CIS Controls**: Access Control, Data Protection, System Monitoring
- ✅ **NIST Framework**: Identity Management, Access Control, Monitoring
- ✅ **SOC 2**: Security principles for SaaS applications

## Maintenance

### Regular Tasks
1. **Update Security Patterns**: Review and update detection patterns quarterly
2. **Review Blocked IPs**: Regularly review and clean up blocked IP lists
3. **Monitor Performance**: Track middleware performance impact
4. **Security Audit**: Conduct security audits of the implementation

### Troubleshooting
- **Rate Limiting Issues**: Check Redis connectivity and configuration
- **False Positives**: Review and adjust detection patterns
- **Performance Issues**: Monitor middleware execution times
- **Memory Usage**: Monitor suspicious IP tracking memory usage