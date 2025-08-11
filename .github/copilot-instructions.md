# MaintAInPro CMMS - GitHub Copilot Agent Instructions

**ALWAYS follow these instructions first and only search for additional information if these instructions are incomplete or found to be in error.**

## Quick Start - Essential Commands

Bootstrap and run the application:
```bash
# Install dependencies (takes ~3 minutes, NEVER CANCEL)
npm install

# Run all quality checks and basic validation (takes ~40 seconds total)
npm run quality

# Build the application (takes ~15 seconds, NEVER CANCEL)
npm run build

# Start development server (runs indefinitely until stopped)
npm run dev
```

## Project Architecture

MaintAInPro is an enterprise-grade CMMS (Computerized Maintenance Management System) with:

- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS (`client/`)
- **Backend**: Express.js + TypeScript + Drizzle ORM (`server/`)
- **Database**: PostgreSQL with multi-tenant support, fallback to in-memory storage
- **Shared**: Common schemas, types, validation (`shared/`)
- **Deployment**: Vercel with edge functions, Railway support

## Working Effectively

### Initial Setup (Required for Fresh Clone)

```bash
# 1. Install dependencies (NEVER CANCEL - takes 3+ minutes)
npm install
# Timeout: Set 10+ minutes, expect warnings about vulnerabilities (these are acceptable)

# 2. Install testing library dependency (if not present)
npm install --save-dev @testing-library/jest-dom

# 3. Verify environment setup
npm run type-check    # Takes ~20 seconds
npm run lint:check    # Takes ~5 seconds (warnings OK, errors must be fixed)
npm run format:check  # Takes ~15 seconds
```

### Core Development Commands

```bash
# DEVELOPMENT SERVER
npm run dev                    # Start full-stack dev server on port 5000
# NEVER CANCEL - runs indefinitely, includes hot reload
# Access: http://localhost:5000
# Health check: http://localhost:5000/health should return 200

# BUILD AND VALIDATION
npm run build                  # Full production build, takes ~15 seconds, NEVER CANCEL
npm run quality               # Complete quality pipeline, takes ~45 seconds total
# Quality includes: lint + format + type-check + test:run

# TESTING FRAMEWORK
npm run test:unit             # Vitest unit tests, takes ~5 seconds
npm run test:integration      # API integration tests, takes ~2 seconds  
npm run test:e2e              # Playwright E2E tests, takes 5+ minutes, requires database
npm run test:all              # All test suites, takes 5+ minutes, NEVER CANCEL
# Timeout: Set 10+ minutes for test:all

# DATABASE OPERATIONS
npm run db:push               # Apply schema changes to database
npm run db:generate           # Generate new migrations
npm run seed                  # Seed development data (requires database)

# CODE QUALITY
npm run lint                  # Fix linting issues automatically
npm run format               # Fix formatting issues automatically
```

### Critical Timing Information

**ALWAYS use these timeout values - DO NOT use shorter timeouts:**

| Command | Duration | Timeout | Notes |
|---------|----------|---------|-------|
| `npm install` | ~3 minutes | **10+ minutes** | NEVER CANCEL - includes native dependencies |
| `npm run build` | ~15 seconds | **60+ seconds** | NEVER CANCEL - full production build |
| `npm run quality` | ~45 seconds | **120+ seconds** | NEVER CANCEL - runs all quality checks |
| `npm run test:all` | 5+ minutes | **15+ minutes** | NEVER CANCEL - includes E2E tests |
| `npm run test:e2e` | 5+ minutes | **15+ minutes** | Requires database, may fail without proper setup |
| `npm run dev` | Indefinite | N/A | Runs until manually stopped |

## Database and Environment Setup

### Local Development Mode (Default)
The application works WITHOUT database setup:
```bash
# The application automatically uses in-memory storage for development
npm run dev  # Works immediately after npm install
```

### PostgreSQL Database Mode (Production/Testing)
For full functionality including E2E tests:
```bash
# 1. Set up database environment variables in .env.local:
DATABASE_URL=postgres://user:password@host:port/database?sslmode=require
NODE_ENV=production

# 2. Apply database schema
npm run db:push

# 3. Seed with sample data
npm run seed
```

**Database Notes:**
- E2E tests REQUIRE database setup and WILL FAIL without proper DATABASE_URL
- Unit and integration tests work with mock data
- Application gracefully falls back to in-memory storage if database unavailable
- Environment variables loaded from `.env.local` then `.env`

## Testing and Validation

### Test Strategy
```bash
# Fast validation (suitable for frequent testing)
npm run test:unit               # ~5 seconds - DOM and logic tests
npm run test:integration        # ~2 seconds - API endpoint tests

# Complete validation (before committing)
npm run test:all               # ~5+ minutes - includes E2E tests, NEVER CANCEL

# Quality gates (required before commits)
npm run quality                # ~45 seconds - lint + format + type + tests
```

### Manual Validation Scenarios

**ALWAYS test these scenarios after making changes:**

1. **Development Server Health**:
   ```bash
   npm run dev
   # Wait for "serving on port 5000" message
   curl http://localhost:5000/health  # Should return 200
   ```

2. **Build Integrity**:
   ```bash
   npm run build
   # Check dist/public/ directory contains built assets
   ls -la dist/public/assets/  # Should show .js and .css files
   ```

3. **Application Login Flow** (if database configured):
   - Navigate to http://localhost:5000
   - Should show login page or dashboard
   - Test basic navigation and API responses

## Project Structure and Key Files

### Repository Organization
```
MaintAInPro/
├── client/                    # React frontend application
│   ├── src/components/       # Reusable UI components  
│   ├── src/pages/           # Route-level components
│   ├── src/services/        # API client functions
│   └── src/hooks/           # Custom React hooks
├── server/                   # Express.js backend
│   ├── routes/              # API route handlers
│   ├── services/            # Business logic services
│   ├── middleware/          # Express middleware
│   └── index.ts             # Server entry point
├── shared/                   # Common types and schemas
│   ├── schema.ts            # Drizzle database schema + Zod validation
│   ├── types/               # TypeScript type definitions
│   └── validation-utils.ts  # Validation helpers
├── tests/                    # Comprehensive test suite
│   ├── unit/                # Component and service tests
│   ├── integration/         # API integration tests
│   ├── e2e/                 # End-to-end Playwright tests
│   └── config/              # Test configuration files
├── Documentation/            # Comprehensive documentation
└── .github/workflows/       # CI/CD pipelines
```

### Critical Configuration Files
- `package.json` - Dependencies and npm scripts
- `vite.config.ts` - Frontend build configuration
- `vitest.config.ts` - Test configuration
- `drizzle.config.ts` - Database configuration
- `vercel.json` - Deployment configuration
- `tsconfig.json` - TypeScript configuration

## Multi-Tenant Architecture Patterns

**ALWAYS follow these patterns when working with data:**

```typescript
// Database queries - ALWAYS include organizationId
const workOrders = await storage.getWorkOrders(organizationId);

// Route handlers - ALWAYS validate organizationId
app.get('/api/work-orders', async (req, res) => {
  const { organizationId } = req.user; // From auth middleware
  const data = await storage.getWorkOrders(organizationId);
});

// Schema validation - Use shared schemas
import { insertWorkOrderSchema } from '@shared/schema';
const validatedData = insertWorkOrderSchema.parse(requestBody);
```

## Common Issues and Solutions

### Build Issues
```bash
# If npm install fails
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# If TypeScript errors
npm run type-check  # Shows specific type errors
# Fix TypeScript issues, avoid using 'any' types

# If lint errors (must fix before committing)
npm run lint        # Automatically fixes many issues
npm run format      # Fixes formatting issues
```

### Test Issues
```bash
# If unit tests fail with "toBeInTheDocument" errors
npm install --save-dev @testing-library/jest-dom
# Ensure tests/setup.ts imports '@testing-library/jest-dom'

# If E2E tests fail
# Verify database connection: DATABASE_URL environment variable
# E2E tests REQUIRE real database, will fail with in-memory storage
```

### Runtime Issues
```bash
# If dev server fails to start
# Check port 5000 availability: lsof -i :5000
# Kill existing process: kill -9 $(lsof -t -i:5000)

# If database connection errors
# Application falls back to in-memory storage (this is expected)
# For full functionality, configure DATABASE_URL in .env.local
```

## Quality Standards and CI Requirements

### Pre-Commit Checklist
**ALWAYS run these commands before committing:**

```bash
npm run quality                # Takes ~45 seconds, NEVER CANCEL
# This includes:
# - ESLint check (warnings OK, errors must be fixed)
# - Prettier format check
# - TypeScript type checking
# - Unit test execution

npm run build                  # Verify build works, takes ~15 seconds
```

### Code Quality Gates
- **TypeScript**: Strict mode, no `any` types without justification
- **ESLint**: Warnings allowed, errors must be fixed
- **Prettier**: Consistent formatting required
- **Tests**: Unit tests required for new components/services
- **Security**: No secrets in code, proper input validation

### CI/CD Pipeline
The GitHub Actions workflows require:
- All quality checks pass (`npm run quality`)
- Build succeeds (`npm run build`)
- Security scans pass
- No critical vulnerabilities in dependencies

## Development Workflow

### Working with Issues
- **ONLY** work on Issues labeled with `agent-ok`
- Keep PRs focused and under 300 lines changed
- Include tests for all new functionality
- Update documentation for API changes

### Authentication and Security
- JWT-based authentication with role-based access control
- All API routes require authentication (except /health)
- Input validation using Zod schemas
- Rate limiting on API endpoints
- Audit trails for all data modifications

### Performance Considerations
- Bundle size monitoring (target <1MB)
- Database query optimization required
- Caching strategies implemented
- Vercel edge optimization for global performance

## Troubleshooting Quick Reference

| Issue | Solution |
|-------|----------|
| Tests fail with DOM errors | Install `@testing-library/jest-dom` |
| Build timeout | Set timeout 60+ seconds, NEVER CANCEL |
| E2E tests fail | Configure DATABASE_URL or skip E2E tests |
| Server won't start | Check port 5000, kill existing processes |
| Slow npm install | Expected ~3 minutes, network dependent |
| Lint errors | Run `npm run lint` to auto-fix |
| Format errors | Run `npm run format` to auto-fix |
| Type errors | Fix manually, avoid `any` types |

## Deployment and Production

### Vercel Deployment
```bash
# Local Vercel testing
vercel dev                     # Test with Vercel functions locally
vercel                         # Deploy to preview
vercel --prod                 # Deploy to production

# Build verification
npm run build                  # Verify build works locally first
```

### Environment Variables (Production)
Required for full functionality:
- `DATABASE_URL` - PostgreSQL connection string
- `NODE_ENV=production` - Enables PostgreSQL storage
- `JWT_SECRET` - JWT token signing secret
- Authentication provider keys (Stack Auth)

---

## Quick Command Reference

```bash
# ESSENTIAL DEVELOPMENT CYCLE
npm install                    # 3+ min, timeout 10+ min, NEVER CANCEL
npm run dev                    # Start dev server (indefinite)
npm run quality               # 45 sec, timeout 2+ min, NEVER CANCEL  
npm run build                 # 15 sec, timeout 60+ sec, NEVER CANCEL

# TESTING COMMANDS  
npm run test:unit             # 5 sec - Fast unit tests
npm run test:integration      # 2 sec - API tests
npm run test:all              # 5+ min, timeout 15+ min, NEVER CANCEL

# CODE QUALITY
npm run lint                  # Auto-fix linting issues
npm run format               # Auto-fix formatting
npm run type-check           # Verify TypeScript

# DATABASE
npm run db:push              # Apply schema changes
npm run seed                 # Seed sample data
```

**Remember: This is an enterprise CMMS focused on operational excellence, security, and scalability. Always consider multi-tenancy, audit trails, and performance impacts when making changes.**
