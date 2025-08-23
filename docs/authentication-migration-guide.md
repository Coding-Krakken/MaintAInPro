# Authentication System Migration Guide

## Overview

MaintAInPro has migrated from Supabase authentication to a comprehensive
JWT-based authentication system. This document outlines the current
authentication implementation and any migration considerations.

---

## Current Authentication System

### Architecture

The MaintAInPro CMMS now uses a **custom JWT-based authentication system** with
the following features:

#### 🔐 Core Authentication Features

- **JWT Access Tokens**: Short-lived tokens for API authentication
- **JWT Refresh Tokens**: Long-lived tokens for token renewal
- **Session Management**: Secure session tracking with device fingerprinting
- **Password Security**: bcrypt hashing with salt, password history tracking
- **Account Security**: Login attempt tracking, account lockout protection

#### 🛡️ Advanced Security Features

- **Multi-Factor Authentication (MFA)**: TOTP, SMS, and email-based MFA
- **Threat Detection**: IP blacklisting, suspicious activity detection
- **Rate Limiting**: Configurable rate limits per endpoint
- **Security Headers**: CORS, CSP, and other security headers
- **Audit Logging**: Comprehensive security event tracking

#### 👥 Role-Based Access Control (RBAC)

- **User Roles**: Admin, Manager, Supervisor, Technician, Inventory Clerk,
  Contractor, Requester
- **Warehouse Isolation**: Multi-tenant access control by warehouse
- **Resource-Level Permissions**: Granular access control for different
  resources
- **Dynamic Authorization**: Runtime permission checking

---

## Authentication Flow

### 1. Login Process

```typescript
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "securePassword",
  "mfaToken": "123456", // Optional, required if MFA enabled
  "rememberMe": true     // Optional
}

// Response
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "technician",
    "warehouseId": "warehouse-uuid",
    "emailVerified": true,
    "mfaEnabled": false
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", // Access token
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", // Refresh token
  "sessionId": "session-uuid"
}
```

### 2. API Authentication

```typescript
// All authenticated requests require Bearer token
Authorization: Bearer <access-token>

// Example API call
GET /api/work-orders
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Token Refresh

```typescript
POST /api/auth/refresh
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

// Response
{
  "success": true,
  "token": "new-access-token",
  "refreshToken": "new-refresh-token"
}
```

---

## Environment Configuration

### Required Environment Variables

```bash
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-refresh-token-secret-here

# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database
POSTGRES_URL=postgresql://username:password@host:port/database

# Optional: Email Configuration (for MFA and notifications)
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
```

### Security Considerations

1. **JWT Secret Keys**: Use cryptographically secure random keys (minimum 64
   characters)
2. **Database Security**: Ensure PostgreSQL is properly secured with SSL
   connections
3. **Environment Isolation**: Different secrets for development, staging, and
   production
4. **Key Rotation**: Regularly rotate JWT secrets in production

---

## Database Schema

### Authentication Tables

```sql
-- User profiles (main user table)
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role user_role_enum NOT NULL,
  warehouse_id UUID NOT NULL,
  active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User credentials (password storage)
CREATE TABLE user_credentials (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  must_change_password BOOLEAN DEFAULT false,
  previous_passwords JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User sessions (session management)
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_id TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  device_fingerprint TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- MFA configurations
CREATE TABLE user_mfa_configs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type mfa_type_enum NOT NULL, -- 'totp', 'sms', 'email'
  secret TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT false,
  backup_codes_encrypted TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## Migration from Documentation References

### What Changed

1. **Authentication Provider**: Supabase Auth → Custom JWT Authentication
2. **Database Policies**: Supabase RLS → Application-level Authorization
3. **Real-time Features**: Supabase Realtime → WebSocket-based Updates
4. **File Storage**: Supabase Storage → Configurable File Storage
5. **Background Jobs**: Supabase Edge Functions → Express.js Background Services

### What Stayed the Same

1. **Database**: PostgreSQL (same database engine)
2. **User Roles**: Same role system and permissions model
3. **Multi-tenancy**: Same warehouse-based isolation
4. **API Endpoints**: Same REST API structure
5. **Security Requirements**: Same enterprise security standards

---

## Development and Testing

### Test Users

The system includes test users for development:

```typescript
// Available test users (password: 'demo123')
- supervisor@maintainpro.com (Supervisor role)
- technician@maintainpro.com (Technician role)
- manager@maintainpro.com (Manager role)
```

### Integration Tests

The authentication system includes comprehensive integration tests:

- **87% Coverage**: Authentication logic thoroughly tested
- **22 Test Suites**: Core authentication flows validated
- **Security Testing**: Input sanitization, error handling, malicious input
  protection
- **Token Validation**: JWT structure and claims verification

Run tests with:

```bash
npm run test:integration
```

---

## Monitoring and Observability

### Audit Logging

All authentication events are logged:

- User login/logout attempts
- Password changes
- MFA setup and usage
- Failed authentication attempts
- Session creation and termination
- Access control violations

### Metrics to Monitor

1. **Authentication Success Rate**: Monitor failed login attempts
2. **Token Refresh Rate**: Track token refresh patterns
3. **Session Duration**: Monitor average session lengths
4. **MFA Adoption**: Track multi-factor authentication usage
5. **Account Lockouts**: Monitor security incidents

---

## Best Practices

### For Developers

1. **Always Validate JWT**: Check token expiration and signature
2. **Use Middleware**: Implement authentication middleware consistently
3. **Handle Token Refresh**: Implement automatic token refresh logic
4. **Secure Storage**: Store tokens securely on client-side
5. **Log Security Events**: Comprehensive audit logging

### For Deployment

1. **Use HTTPS**: All authentication endpoints must use HTTPS
2. **Secure Headers**: Implement proper security headers
3. **Rate Limiting**: Configure appropriate rate limits
4. **Database Security**: Use SSL connections and proper firewall rules
5. **Regular Updates**: Keep dependencies updated for security patches

---

## Support and Troubleshooting

### Common Issues

1. **Token Expiration**: Implement token refresh logic
2. **CORS Issues**: Configure proper CORS headers for API access
3. **Rate Limiting**: Handle rate limit responses gracefully
4. **Database Connections**: Monitor connection pool usage

### Getting Help

- Check the
  [Authentication Integration Tests](../tests/integration/auth.integration.test.ts)
  for examples
- Review
  [API Documentation](../attached_assets/APISpecification_1752515902050.md)
- Examine [Authentication Service Implementation](../server/services/auth/)

---

## Conclusion

The migration to JWT-based authentication provides:

✅ **Enhanced Security**: Modern JWT standards with comprehensive security
features  
✅ **Better Performance**: Stateless authentication with efficient token
validation  
✅ **Improved Scalability**: No dependency on external authentication services  
✅ **Full Control**: Complete control over authentication logic and user
management  
✅ **Enterprise Features**: MFA, audit logging, session management, and RBAC

The new authentication system maintains all existing functionality while
providing a more robust, secure, and maintainable foundation for the MaintAInPro
CMMS platform.
