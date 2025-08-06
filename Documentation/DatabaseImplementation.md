MaintAInPro CMMS — PostgreSQL Backend | Full Stack Alignment | Production Readiness

📄 Reference Document: All design, schema, and roadmap decisions must be aligned with Documentation/Development/DatabaseImplementation.md. Treat this as the single source of truth.

🎯 Objective
Ensure the MaintAInPro CMMS backend and PostgreSQL database are developed to the highest possible engineering standard. The implementation must be production-hardened, scalable, test-verified, schema-aligned, security-audited, fully observable, and CI/CD-ready at all times.

✅ CURRENT STATUS SNAPSHOT (Last Updated: 2025-08-06)
🔒 SYSTEM STABILITY
PostgreSQL schema: validated & active

Migration scripts: 0005_unify_audit_system_logs.sql complete

Backend APIs: operational & connected

Frontend forms: functioning and integrated

🔧 REMAINING PRIORITY ITEMS
🔁 Schema validation: fix field mapping (camelCase ↔ snake_case)

📑 API validation: expand input validation rules using Zod

⚡️ Performance: index bottlenecks, optimize queries

🔐 Security: harden endpoints and authentication flows

🪵 Logging: unify structured logs across layers

🧬 WORKFLOW STRUCTURE (Follow Precisely)
1. 📖 Reference & Sync to Blueprint
Sync all implementation decisions with Documentation/Development/DatabaseImplementation.md

Confirm database schema alignment with stated specs, including:

UUID PKs

Multi-tenancy (organization_id)

Soft deletes (deleted_at)

Full audit fields

Extensible entities

Indexing & partitioning strategy

PostGIS where applicable

2. 🔍 Codebase Evaluation Loop
Examine: migrations, models, services, controllers, API types

Identify: schema drifts, deprecated code, inconsistencies

Confirm: adherence to TypeScript best practices, Drizzle ORM schema matching, and end-to-end typings

Ensure all seed data and migrations boot cleanly in ephemeral environments

3. 🚀 Development Protocol
For every feature, enhancement, fix, or refactor:

 Update schema + migration

 Apply changes using repeatable scripts

 Update ORM types and service layer

 Implement controller logic with full logging and error handling

 Sync form validation rules (Zod ↔ backend schema)

 Add tests: unit, integration, schema, E2E

 Document changes and update roadmap file

Enforce:

Full typing (no any, no @ts-ignore)

Lint & format on save

Coverage minimum: 90%

Logs must include: org ID, user ID, request ID, timestamps, and operation context

4. 🧪 Test & Validate
Run full test suite after every change

Validate seed + migration flow in a fresh environment (no state leaks)

Check test coverage using vitest --coverage

Edge-case testing: deletion cascades, missing fields, race conditions

5. 🔧 Debugging & Observability
Use structured logs (pino, winston, or equivalent)

Trace logs from API → service → DB

Enable verbose logging mode in local dev for deep tracing

Implement retry logic for transient failures (e.g., deadlocks, timeouts)

📘 Documentation Guidelines
Update DatabaseImplementation.md after every milestone

Changes must include:

➕ New tables / fields

🔄 Modified behaviors

💥 Breaking changes

🧪 Test case summary

🚑 Rollback steps

Use embedded ER diagrams or MermaidJS as needed

Maintain code examples for API usage, errors, and edge case handling

🚀 CI/CD & Deployment Rules
Git commits must be atomic, descriptive, and scoped (feat:, fix:, db:, etc.)

Push must trigger CI:

✅ Unit & integration tests

✅ Lint & format

✅ Type check

✅ Migration verification

Fail CI on:

⛔️ Test regressions

⛔️ Untyped exports

⛔️ Coverage < 90%

Optionally open PR with reviewer tag if in team mode

🧠 Senior-Level Engineering Directives
These policies must be followed by all contributors acting at a senior engineer level:

🔍 Maintain strict traceability between documentation and implementation

🧱 Avoid fragile abstractions; favor clarity and modularity

🛑 No hardcoded values outside config/environment layers

🧪 Treat seed + migration testing as mandatory per cycle

🚀 Use feature flags for all experimental code

📦 Automate: changelog updates, schema diffing, seed resets

🗃 Version-lock all dependencies and use lockfile linting

⚠️ Validate all user input with typed Zod schemas (no req.body.any)

🧩 Use tags for all breaking or critical migrations

🔁 Plan for data migration, export, import, backup, recovery

🧑‍💻 Pair-review or self-review all changes above 50 LOC

🏛 Maintain operational readiness (0 downtime, 1-command restore, 99.99% uptime assumption)

📌 Prompt for Next Steps
Begin the next cycle of implementation following this elite-level workflow. The authoritative roadmap is located at Documentation/Development/DatabaseImplementation.md. Sync all logic to it.

Focus on:

✅ Finalizing schema test compatibility (camelCase ↔ snake_case)

✅ Strengthening API request validation with full field coverage

✅ Benchmarking and applying performance optimizations for high-load production environments

Ensure the database and backend remain in a clean, tested, deployable state after each change.

