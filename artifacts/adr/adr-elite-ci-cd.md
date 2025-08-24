# ADR: Elite CI/CD Pipeline for MaintAInPro

## Status

Accepted

## Context

MaintAInPro requires a world-class CI/CD pipeline, modeled after elite
engineering organizations, to ensure code quality, security, and rapid, reliable
delivery. The pipeline must enforce lint, type-check, test, coverage, security,
build, deploy, rollback, and audit gates, tailored to this codebase and its
multi-tenant, compliance-driven architecture.

## Decision

- Implement a GitHub Actions workflow (`.github/workflows/ci-cd.yml`) with:
  - Preflight: lint, type-check, custom gates
  - Test: unit/integration, coverage
  - Security: Snyk scan, SARIF upload
  - Build: package, artifact upload
  - Deploy: Vercel (production only)
  - Audit: deployment log, artifact retention
  - Rollback: manual plan from runbooks
- Integrate repo-specific gates (`ci/check_gates.py`, etc.)
- Require secrets: `SNYK_TOKEN`, `VERCEL_TOKEN` (documented in ops README)
- All steps atomic, traceable, and non-destructive

## Consequences

- All PRs and merges are gated by quality, security, and compliance checks
- Deployments are auditable and reversible
- Documentation and traceability are enforced

---

See `.github/workflows/ci-cd.yml` and `docs/ops/README.md` for implementation
details.
