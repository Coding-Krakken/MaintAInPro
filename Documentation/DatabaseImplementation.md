## Database Implementation: Advanced Development Workflow Prompt

**Objective:**  
Continue implementing and refining the MaintAInPro CMMS PostgreSQL database and related backend, ensuring a fully working, production-grade, and maintainable system. Always evaluate the codebase for completeness, correctness, and best practices.

---

### Current Progress Summary (Updated: August 6, 2025)

#### ✅ **Completed Milestones:**
1. **Migration & Schema Alignment**: Created unified audit/system logs migration (`0005_unify_audit_system_logs.sql`)
2. **Database Structure**: All migration scripts applied successfully, tables verified
3. **Frontend API Integration**: Fixed Equipment and Parts creation with proper API endpoints
4. **Schema Validation**: Added alias exports for backward compatibility with tests
5. **Utility Functions**: Created `/shared/utils.ts` with required utility functions
6. **Service Mocks**: Fixed MemoryStorage export for test compatibility
7. **UI Components**: 
   - Fixed controlled/uncontrolled input warnings in forms
   - Added DialogDescription components for accessibility
   - Created PartFormModal for inventory management
   - Updated EquipmentFormModal to use proper hooks

#### 🔧 **Currently In Progress:**
1. **Test Suite Alignment**: Schema validation tests need field name mapping (snake_case vs camelCase)
2. **API Endpoint Enhancement**: Basic CRUD operations for Equipment and Parts
3. **Database Implementation Refinement**: Production-ready optimizations

#### 📋 **Next Priorities:**
1. **Schema Test Compatibility**: Align test expectations with actual database schema
2. **Enhanced API Validation**: Implement comprehensive field validation 
3. **Performance Optimization**: Database indexing and query optimization
4. **Security Hardening**: Enhanced authentication and authorization
5. **Error Handling**: Comprehensive error logging and recovery

---

### Technical Implementation Status

#### **Database Schema** (✅ Complete)
- PostgreSQL tables: 15+ entities (Users, Work Orders, Equipment, Parts, etc.)
- Drizzle ORM integration with TypeScript types
- Migration scripts: 5 applied successfully
- Audit/system logging unified

#### **Backend API** (🔧 In Progress)
- Express.js server with TypeScript
- RESTful endpoints for core entities
- Authentication middleware
- Rate limiting and security features
- File upload and management

#### **Frontend Integration** (✅ Mostly Complete)
- React components with shadcn/ui
- React Hook Form with Zod validation
- TanStack Query for API state management
- Modal forms for CRUD operations
- Accessibility improvements

#### **Testing Infrastructure** (🔧 Needs Alignment)
- Vitest test runner configured
- Unit tests for services and utilities
- Integration tests for API endpoints
- Schema validation tests (require field mapping fixes)

---

### Workflow Instructions

1. **Evaluate the Current State**
   - Review the entire codebase and documentation for gaps, inconsistencies, or missing features.
   - Ensure all schema, migrations, and seed data are up-to-date and match the documented roadmap.
   - Check for deprecated patterns, security issues, or performance bottlenecks.

2. **Iterative Development**
   - For each new feature, bugfix, or refactor:
     - Write or update the schema, migration, and seed scripts.
     - Implement code with verbose logging and debugging enabled by default.
     - Add or update comprehensive documentation (inline, README, and API docs).
     - Write full unit, integration, and end-to-end tests for all new/changed code.
     - Ensure all code is type-safe (TypeScript), linted, and formatted.

3. **Testing & Validation**
   - Run all tests (unit, integration, E2E) after every change.
   - Use test coverage tools to ensure all critical paths are tested.
   - Manually test edge cases and error handling.
   - Validate migrations and seed scripts in a fresh environment.

4. **Debugging & Logging**
   - Use structured, verbose logging for all database and API operations.
   - Ensure logs include context (user, org, request ID, timestamps).
   - Add debug-level logs for all critical workflows and error paths.

5. **Documentation**
   - Update `DatabaseImplementation.md` and related docs after every milestone.
   - Document schema changes, migration steps, and any breaking changes.
   - Provide usage examples, troubleshooting tips, and rollback instructions.

6. **Commit & Push Workflow**
   - After every successful milestone (feature, fix, refactor, or doc update):
     - Stage and commit all changes with a clear, descriptive message.
     - Push to the remote repository.
     - Optionally, open a pull request for review if working in a team.

7. **Continuous Integration**
   - Ensure CI runs all tests, lints, and type checks on every push.
   - Block merges on failed checks or insufficient coverage.

8. **Review & Repeat**
   - Regularly review code, tests, and documentation for improvements.
   - Refactor and optimize as needed.
   - Repeat the cycle for each new requirement or improvement.

---

### Additional Senior Developer Instructions

- Proactively identify and address technical debt.
- Ensure all database changes are backward-compatible or provide clear migration paths.
- Use feature flags for risky or experimental features.
- Maintain a changelog for all database and API changes.
- Automate repetitive tasks (e.g., code generation, documentation updates).
- Enforce code reviews and pair programming for critical changes.
- Monitor and profile database performance regularly.
- Plan for disaster recovery and data migration scenarios.
- Always keep security, compliance, and data privacy in mind.

---

**Prompt for Next Steps:**  
> Continue implementing the MaintAInPro CMMS database and backend according to the roadmap. For each change, follow the workflow above: evaluate, implement, log, test, document, commit, and push. Ensure the system is always in a deployable, production-ready state. After each milestone, update this document with what was accomplished and what remains.

**Current Focus:** Fix schema validation test compatibility, enhance API validation, and continue database optimization for production deployment.

