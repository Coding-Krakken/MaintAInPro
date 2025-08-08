# MaintAInPro CMMS - AI Agent Instructions

## Project Architecture

MaintAInPro is an enterprise CMMS (Computerized Maintenance Management System) built with a modern full-stack architecture:

- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS (`client/`)
- **Backend**: Express.js + TypeScript + Drizzle ORM (`server/`)
- **Database**: PostgreSQL with strategic indexing and multi-tenant support
- **Shared**: Common schemas, types, and validation (`shared/`)
- **Deployment**: Vercel for production hosting with edge functions

## Strategic Blueprint Framework

The project follows a comprehensive 6-tier documentation structure in `Documentation/Blueprint/`:

### 0-Executive/ - Strategic Leadership
- `ENTERPRISE_BLUEPRINT.md` - Master strategic document and engineering excellence standards
- `COMPETITIVE_ANALYSIS.md` - Market positioning vs Atlas CMMS and industry analysis
- `TECHNICAL_EXCELLENCE_FRAMEWORK.md` - Elite engineering quality standards (95%+ test coverage, <200ms P95 latency)

### 1-Vision/ - Product Strategy
- `ProductVision.md` - Product vision with competitive differentiation
- `UserPersonas.md` - Detailed workflow mapping and pain point analysis
- `BusinessModel.md` - Revenue strategy and go-to-market approach

### 2-Features/ - Feature Excellence
- Core CMMS modules (Work Orders, Equipment, Preventive Maintenance, Parts Inventory)
- Advanced Intelligence (AI Automation, Workflow Engine, Real-time Collaboration)
- Enterprise features (RBAC, Compliance, Data Governance)

### 3-Architecture/ - Technical Excellence
- `SystemArchitecture.md` - Comprehensive technical architecture
- `SecurityArchitecture.md` - Zero-trust security model with SOC 2 compliance
- `DevOpsExcellence.md` - CI/CD pipelines and deployment strategies

### 4-UX-Flow/ - Experience Excellence
- `UserExperienceFlow.md` - User journey mapping with accessibility standards
- `DesignSystem.md` - Complete design system and component library

### 5-Traceability/ - Quality Tracking
- `TraceabilityMatrix.md` - Complete feature-to-implementation mapping
- `PerformanceBenchmarks.md` - SLA targets and performance metrics
- `QualityMetrics.md` - Code quality and technical debt tracking

### 6-Operations/ - Operational Excellence
- `IncidentResponse.md` - Comprehensive incident management procedures
- `CapacityPlanning.md` - Resource and scaling strategies

**Blueprint Usage**: Always reference relevant Blueprint sections when implementing features or making architectural decisions.

## Copilot Agent Guidelines

### Work Scope Restrictions
- **ONLY** work on Issues labeled with `agent-ok`
- **IGNORE** all other Issues, even if they seem important
- If an Issue lacks the `agent-ok` label, comment asking for human review and label addition

### PR Quality Standards
- Keep PRs **single-purpose** and focused
- **Maximum 300 lines changed** per PR (excluding auto-generated files)
- If a task requires more than 300 lines, break it into multiple Issues/PRs
- Use clear, descriptive commit messages following conventional commits

### Required Testing
- Add or extend **unit tests** matching all Acceptance Criteria
- Ensure **integration tests** cover API endpoints if applicable
- Add **E2E tests** for user-facing features
- Run `npm run test:all` before submitting PR
- Include test evidence in PR description

### Documentation Requirements
- Update relevant docs under `Documentation/` for any feature changes
- Update API documentation for endpoint changes
- Add entries to `CHANGELOG.md` for user-facing changes
- Update Blueprint documentation if architecture changes

### Code Quality Gates
- All code must pass `npm run quality` (lint + format + type-check + tests)
- Follow existing architectural patterns in the codebase
- Use TypeScript strictly - no `any` types without justification
- Implement proper error handling and logging
- Follow security best practices (input validation, SQL injection prevention)

### Multi-Tenant Considerations
- Always include `organizationId` validation in database queries
- Ensure data isolation between tenants
- Use audit trails for all data modifications
- Follow RBAC patterns for permission checks

### Autonomous Decision Making
- If requirements are **clear and unambiguous**: proceed with implementation
- If requirements are **unclear or conflicting**: open PR with:
  - Questions in the PR description
  - Add `needs-human` label
  - Request clarification in comments
  - Propose alternative approaches

## Key Architectural Patterns

### Multi-Tenant Architecture
The system uses organization-based multi-tenancy with a hierarchical structure:
```typescript
organizations -> users -> equipment/work orders/parts
```
Always validate `organizationId` in queries and ensure data isolation between tenants.

### Service Layer Pattern
Business logic is centralized in `server/services/`:
- **Security**: JWT auth with RBAC in `auth/security.service.ts`
- **Performance**: Real-time monitoring via `performance.service.ts`
- **Caching**: Multi-tier caching via `cache.service.ts`
- **AI/ML**: Predictive maintenance in `ai-predictive.service.ts`
- **Background Jobs**: Scheduled tasks via `background-jobs.ts`

### Schema-First Development
All data structures are defined in `shared/schema.ts` using Drizzle + Zod:
- Database tables use `pgTable` with UUID primary keys
- Validation schemas use `createInsertSchema` from drizzle-zod
- Field validation rules in `shared/validation-utils.ts`

## Development Workflows

### Essential Commands
```bash
# Development server with hot reload
npm run dev

# Database operations
npm run db:push      # Push schema changes
npm run db:generate  # Generate migrations
npm run seed         # Seed development data

# Testing (comprehensive framework)
npm run test:unit        # Vitest unit tests
npm run test:integration # API integration tests  
npm run test:e2e         # Playwright end-to-end
npm run test:all         # Run complete test suite

# Quality checks
npm run quality     # Lint + format + type-check + test
npm run build       # Production build

# Vercel deployment
vercel              # Deploy to preview
vercel --prod       # Deploy to production
vercel logs         # View deployment logs
```

### Vercel Deployment
The application is optimized for Vercel deployment:
- **Build Output**: Vite builds to `dist/public/` for static assets
- **API Routes**: Express.js server runs as serverless functions
- **Environment**: Uses `vercel.json` for configuration
- **Database**: PostgreSQL connection via environment variables
- **Edge Functions**: Optimized for global performance

Always test locally before deploying:
```bash
npm run build       # Verify build succeeds
vercel dev         # Test locally with Vercel functions
```

### Docker Development
For local development consistency:
```bash
docker build -t app-test .
docker run --rm app-test
```

## Project-Specific Conventions

### API Route Structure
Routes follow RESTful patterns with enterprise security:
```typescript
// In server/routes.ts - all routes include audit trails
app.use(auditMiddleware);
app.use('/api', apiRateLimit);
app.use('/api/auth', authRateLimit);

// Multi-tenant data access pattern
const workOrders = await storage.getWorkOrders(organizationId);
```

### Frontend Component Organization
```
client/src/
├── components/     # Reusable UI components
├── pages/         # Route-level components
├── hooks/         # Custom React hooks
├── services/      # API client functions
├── lib/           # Utilities and configurations
└── types/         # TypeScript type definitions
```

### Error Handling Pattern
Use structured error responses with audit logging:
```typescript
// Server-side error pattern
throw new Error(`[${context}] ${message}`);

// Client-side error handling in services/api.ts
export const handleApiError = (error: unknown) => {
  // Structured error handling with user-friendly messages
};
```

### Database Patterns
- Use transactions for multi-table operations
- Always include `organizationId` in WHERE clauses
- Implement soft deletes with `deletedAt` timestamp
- Use `createdBy/updatedBy` for audit trails

## Integration Points

### Authentication Flow
JWT-based auth with role-based permissions:
1. Login via `/api/auth/login` returns JWT token
2. All API requests include `Authorization: Bearer <token>`
3. Middleware validates token and sets `req.user`

### File Upload System
Centralized file management via `fileManagementService`:
- Supports local filesystem and cloud storage
- Automatic file type validation and virus scanning
- Generates secure download URLs

### Background Job Processing
Scheduled tasks via `background-jobs.ts`:
- PM schedule generation
- Email notifications
- Data cleanup and archival

### Real-time Features
WebSocket integration for live updates:
- Work order status changes
- Equipment alerts
- System notifications

## Performance Considerations

### Caching Strategy
Multi-tier caching via `CacheService`:
- Memory cache for frequently accessed data
- Database query optimization with strategic indexes
- CDN for static assets

### Database Optimization
- Use `databaseOptimizer.service.ts` for query analysis
- Implement connection pooling
- Regular VACUUM and ANALYZE operations

### Bundle Optimization
Vite configuration includes:
- Code splitting by feature (`vendor`, `ui`, `forms`, `charts`)
- Tree shaking for unused code
- Production minification with esbuild
- Vercel-optimized build output for edge deployment

### Vercel Edge Optimization
- **Static Assets**: Served via Vercel's global CDN
- **API Functions**: Serverless functions with automatic scaling
- **Environment Variables**: Managed via Vercel dashboard
- **Preview Deployments**: Automatic on PR creation
- **Analytics**: Built-in Web Vitals monitoring

## Security Patterns

### Input Validation
All inputs validated using Zod schemas:
```typescript
const validatedData = insertWorkOrderSchema.parse(requestBody);
```

### SQL Injection Prevention
Always use Drizzle ORM parameterized queries - never string concatenation.

### Rate Limiting
Different limits for endpoint types:
- `/api/auth/*`: Strict rate limiting
- `/api/upload/*`: File-specific limits
- `/api/*`: General API limits

Remember: This is an enterprise-grade CMMS focused on operational excellence, security, and scalability. Always consider multi-tenancy, audit trails, and performance impacts when making changes.

## Blueprint Integration Guidelines

When implementing features or making architectural decisions:

1. **Strategic Alignment**: Reference `Documentation/Blueprint/0-Executive/` for business impact and competitive positioning
2. **Technical Standards**: Follow `TECHNICAL_EXCELLENCE_FRAMEWORK.md` for quality gates and engineering standards
3. **Feature Specifications**: Check `Documentation/Blueprint/2-Features/` for detailed requirements
4. **Architecture Compliance**: Validate against `Documentation/Blueprint/3-Architecture/` patterns
5. **User Experience**: Ensure consistency with `Documentation/Blueprint/4-UX-Flow/` guidelines
6. **Quality Tracking**: Update `Documentation/Blueprint/5-Traceability/TraceabilityMatrix.md` for significant changes
7. **Operational Impact**: Consider `Documentation/Blueprint/6-Operations/` procedures for production changes

## Vercel-Specific Considerations

### Environment Management
- Use Vercel dashboard for environment variables
- Separate environments: Development, Preview, Production
- Database connections via secure environment variables

### Performance Optimization
- Leverage Vercel's Edge Network for global performance
- Monitor Core Web Vitals via Vercel Analytics
- Optimize for Vercel's serverless function limits (10s timeout, 50MB response)

### Deployment Strategy
- **Preview Deployments**: Every PR gets automatic preview URL
- **Production Deployments**: Deploy from main branch
- **Rollback**: Use Vercel dashboard for instant rollbacks
- **Monitoring**: Built-in error tracking and performance monitoring
