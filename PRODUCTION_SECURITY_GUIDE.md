# MaintAInPro Production Security Guide

## 🔒 Security Architecture Overview

MaintAInPro implements enterprise-grade security measures designed for production environments. This guide documents the comprehensive security implementation.

## Security Middleware Stack

### Core Security Components

#### 1. Rate Limiting Protection
- **Authentication Rate Limiting**: 5 attempts per 15 minutes per IP
- **API Rate Limiting**: 1000 requests per minute per IP  
- **Upload Rate Limiting**: 50 uploads per 15 minutes per IP
- **Password Reset Rate Limiting**: 3 attempts per hour per IP
- **Export Rate Limiting**: 10 exports per hour per IP

#### 2. Input Security
- **SQL Injection Protection**: Pattern-based detection and blocking
- **XSS Protection**: HTML tag and script sanitization
- **Input Sanitization**: Comprehensive data cleaning
- **Payload Size Limits**: 50MB maximum request size
- **Suspicious User Agent Detection**: Blocks known attack tools

#### 3. Security Headers
```typescript
// Comprehensive security headers applied to all responses
'X-Content-Type-Options': 'nosniff'
'X-Frame-Options': 'DENY'
'X-XSS-Protection': '1; mode=block'
'Referrer-Policy': 'strict-origin-when-cross-origin'
'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
'Permissions-Policy': 'geolocation=(), microphone=(), camera=()...'
```

#### 4. Authentication & Authorization
- **JWT Token Validation**: Secure session management
- **Role-Based Access Control**: Multi-level permission system
- **Session Validation**: Database-backed session tracking
- **Token Refresh**: Automated token renewal

#### 5. Audit Logging
- **Request Tracking**: Complete API request logging
- **Security Event Logging**: Suspicious activity detection
- **Performance Monitoring**: Response time tracking
- **User Activity Tracking**: Comprehensive audit trails

## IPv6 Security Implementation

Our security middleware properly handles IPv6 addresses using express-rate-limit's default key generator, ensuring proper rate limiting for both IPv4 and IPv6 connections.

## CORS Configuration

Dynamic CORS configuration supports multiple environments:
- Development: localhost:3000, localhost:5173
- Production: Environment-specific URLs
- Secure credential handling

## Deployment Security Checklist

### Environment Variables Required
```env
# Database Security
DATABASE_URL=postgres://...
DB_SSL_MODE=require

# JWT Security  
JWT_SECRET=<strong-secret>
JWT_REFRESH_SECRET=<strong-refresh-secret>

# API Security
API_RATE_LIMIT_WINDOW_MS=60000
API_RATE_LIMIT_MAX=1000

# CORS Security
FRONTEND_URL=https://your-frontend.com
PRODUCTION_URL=https://your-api.com
```

### Pre-Deployment Verification
- [ ] All rate limits configured appropriately for production
- [ ] Security headers validated
- [ ] SQL injection protection tested
- [ ] Authentication flows verified
- [ ] CORS origins properly configured
- [ ] Audit logging operational
- [ ] Error handling secure (no stack traces exposed)

## Security Monitoring

### Key Metrics to Monitor
1. **Rate Limit Violations**: Track blocked requests
2. **Authentication Failures**: Monitor login attempts
3. **SQL Injection Attempts**: Track blocked malicious queries
4. **Suspicious User Agents**: Monitor attack tool usage
5. **Session Anomalies**: Track unusual session patterns

### Log Analysis
All security events are logged with structured data for analysis:
```json
{
  "method": "POST",
  "url": "/api/login",
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "statusCode": 401,
  "timestamp": "2025-08-06T23:45:00.000Z",
  "securityEvent": "AUTHENTICATION_FAILURE"
}
```

## Security Testing

The security implementation includes comprehensive test coverage:
- Input validation tests
- Rate limiting verification  
- Authentication/authorization tests
- CORS configuration tests
- Security header validation
- SQL injection protection tests

## Incident Response

In case of security incidents:
1. Monitor audit logs for patterns
2. Adjust rate limits if under attack
3. Temporarily block suspicious IPs using IP whitelist
4. Review and update security rules as needed
5. Analyze attack vectors and strengthen defenses

## Regular Security Maintenance

### Monthly Tasks
- [ ] Review audit logs for anomalies
- [ ] Update security dependencies
- [ ] Test security measures
- [ ] Review rate limit effectiveness

### Quarterly Tasks  
- [ ] Security penetration testing
- [ ] Update security policies
- [ ] Review access controls
- [ ] Update security documentation

---

**Security Contact**: For security issues, follow responsible disclosure practices.
**Last Updated**: August 6, 2025
**Version**: 1.0.0
