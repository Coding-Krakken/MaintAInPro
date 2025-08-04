# Backend & Deployment Security Requirements for MaintAInPro

This document summarizes security measures handled by the frontend (SPA/Vite) and those that must be
enforced by the backend (Supabase) or deployment infrastructure.

## 1. Security Headers (Handled by SPA Build)

- **Content-Security-Policy**: Enforced via Vite plugin for both dev and static builds.
- **X-Frame-Options**: Set to `DENY`.
- **X-XSS-Protection**: Set to `1; mode=block`.
- **X-Content-Type-Options**: Set to `nosniff`.

## 2. Backend & Deployment Security (Supabase/Infra)

The following must be enforced at the backend or infrastructure level:

### a. Authentication & Authorization

- Use Supabase Auth for all user authentication.
- Enforce Row Level Security (RLS) on all tables.
- Validate JWT tokens on all API/database requests.

### b. CSRF Protection

- Not required for pure API/JWT-based SPAs, but ensure no cookies with `SameSite=None` are used
  unless strictly necessary.
- If any server-side endpoints are added, implement CSRF tokens.

### c. Rate Limiting

- Enable rate limiting at the API gateway, CDN, or Supabase Edge Functions to prevent brute force
  and abuse.

### d. CORS

- Restrict CORS origins to only trusted domains (production, staging, local dev as needed).

### e. Input Validation

- All user input is validated client-side (Zod + react-hook-form). Backend should also
  validate/sanitize all input before processing.

### f. HTTPS

- Enforce HTTPS for all environments. Redirect HTTP to HTTPS at the CDN/load balancer level.

### g. Secrets Management

- Never expose secrets in the frontend. Use environment variables and Supabase secrets for backend
  config.

### h. Logging & Monitoring

- Enable logging and monitoring for suspicious activity, failed logins, and errors.

## 3. Recommendations

- Review Supabase security best practices: https://supabase.com/docs/guides/security
- Periodically audit RLS policies and API permissions.
- Use a Web Application Firewall (WAF) if available.
- Regularly update dependencies and monitor for vulnerabilities.

---

This document should be reviewed and updated with every major deployment or infrastructure change.
