# MaintAInPro Operations Documentation

## Runbooks

- Oncall, rollback, release, and calibration procedures in /runbooks/

## Monitoring & Observability

- Dashboards, alert definitions, and SLO configurations
- Post-release monitoring and incident management

## Incident Management

- Triage, resolution, and postmortem writing
- Audit logging and compliance reporting

## Policies & Automation

- Gate enforcement and recalibration rules in .process/policies/
- CI scripts for validation and evidence collection

## CI/CD Pipeline (Elite)

- Workflow: `.github/workflows/ci-cd.yml` implements lint, type-check, test, coverage, security, build, deploy, audit, and rollback gates.
- Custom repo gates: `ci/check_gates.py`, `ci/validate_graph.py`, `ci/render_diagrams.py` are enforced on every PR and merge.
- Secrets required: `SNYK_TOKEN` (security scan), `VERCEL_TOKEN` (production deploy). Add via GitHub repo settings.
- Audit logs: All deployments and rollbacks are logged in `artifacts/adr/deployment.log`.
- Rollback: Manual plan in `runbooks/rollback.md`.
- Artifact retention: Coverage, SARIF, build, and audit logs uploaded for traceability.

See `artifacts/adr/adr-elite-ci-cd.md` for architectural decision rationale.
