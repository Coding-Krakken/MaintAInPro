# MaintAInPro Copilot Agent Instructions

## Big Picture Architecture

- **Frontend**: React 18 + TypeScript (client/)
- **Backend**: Express.js + TypeScript + Drizzle ORM (server/)
- **Database**: PostgreSQL, multi-tenant, strategic indexing (shared/)
- **Shared**: Common schemas, types, validation (shared/)
- **DevOps**: Vercel, Docker, CI/CD, edge functions
- **Docs & Blueprints**: See Documentation/Blueprint/ for strategic, technical,
  and operational guides

## Developer Workflows

- **Start Dev Server**: `npm run dev`
- **Run All Tests**: `npm run test:all` (or VS Code task)
- **Build**: `npm run build`
- **Quality Gate**: `npm run quality` (lint, format, type-check, test)
- **Database Ops**: `npm run db:push`, `npm run db:generate`, `npm run seed`
- **Deploy**: `vercel` (preview), `vercel --prod` (production)
- **Test Types**: Unit (Vitest), Integration (Vitest+Supertest), E2E
  (Playwright), Performance (k6), Accessibility (jest-axe)
- **Test Configs**: See tests/config/ for all test configs

## Project-Specific Conventions

- **Feature Flags**: Controlled via config/feature-flags.ts. Use
  `isFeatureEnabled` and `getFeatureConfig` for rollout, environment, and user
  targeting. See config/README.md for usage and rollback.
- **Multi-Tenant**: All backend logic must respect tenant boundaries. Use
  shared/ for schemas and validation.
- **RBAC**: Role-based access enforced at API and UI layers. See
  Documentation/Blueprint/ for details.
- **Audit & Traceability**: All changes logged. See artifacts/adr/ and
  Documentation/Blueprint/5-Traceability/.
- **CI/CD Gates**: All PRs must pass lint, type-check, test, coverage, and
  security scan. See ci/check_gates.py, ci/validate_graph.py,
  ci/render_diagrams.py.
- **Testing**: Use AAA pattern, descriptive names, mock external dependencies,
  and cover edge cases. See tests/README.md for best practices.
- **File Naming**: Tests use `.test.ts` or `.spec.ts` suffixes.

## Integration Points & External Dependencies

- **API**: See api/ for endpoints. Use Supertest for integration tests.
- **WebSockets**: Real-time updates and notifications (client/ & server/)
- **Third-Party**: Integrations via feature flags and config. See
  config/README.md and Documentation/API/.
- **Monitoring**: Health endpoints, audit logs, performance metrics (monitoring
  config/)

## Examples

- **Feature Flag Usage**:
  ```typescript
  import { isFeatureEnabled } from '../config/feature-flags';
  if (isFeatureEnabled('qrCodeGeneration')) {
    /* ... */
  }
  ```
- **Test Utility Usage**:
  ```typescript
  import { renderWithProviders } from '../tests/utils/test-utils';
  ```
- **API Route Guard**:
  ```typescript
  app.use('/api/bulk-inventory', featureGuard('bulkInventoryOperations'));
  ```

## Key References

- `README.md`, `config/README.md`, `tests/README.md`, `artifacts/adr/`,
  `Documentation/Blueprint/`, `ci/check_gates.py`

---

_If any section is unclear or missing, please provide feedback for iterative
improvement._
