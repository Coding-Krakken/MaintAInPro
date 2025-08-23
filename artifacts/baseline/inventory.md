# MaintAInPro Repository Inventory

## Stack Overview

| Category      | Details                                                                |
| ------------- | ---------------------------------------------------------------------- |
| Languages     | TypeScript, JavaScript, Shell, Markdown, JSON                          |
| Frontend      | React 18 (client/)                                                     |
| Backend       | Express.js (server/)                                                   |
| ORM           | Drizzle (server/)                                                      |
| Package Mgmt  | npm                                                                    |
| Build Tools   | Vite, tsconfig, Docker, Railway, Vercel                                |
| Test          | Vitest, Playwright, jest-axe, k6                                       |
| Lint/Format   | ESLint, Prettier, Stylelint, Tailwind                                  |
| Type System   | TypeScript (strict)                                                    |
| CI/CD         | Vercel, Railway, custom scripts, quality gates (ci/)                   |
| Infra/IaC     | Dockerfile, docker-compose.yml, Railway, Vercel                        |
| Observability | Health endpoints, audit logs, monitoring config, metrics               |
| Security      | .gitignore, SAST (SARIF), mutation report, dependency scan, RBAC       |
| Data Stores   | PostgreSQL (Drizzle ORM, migrations/, seeds)                           |
| Feature Flags | config/feature-flags.ts                                                |
| Docs          | ADRs, runbooks, changelog, coverage, mutation, postmortem, RFC, threat |

## Repo Layout (Tree Snippet)

```
audit log
config/
CHANGELOG.md
client/
server/
shared/
api/
docs/
runbooks/
requirements/
artifacts/
  adr/
  baseline/
  gate/
  postmortem/
  rfc/
  rollout/
  run/
  threat/
logs/
migrations/
tests/
```

## Health Snapshot

| Gate       | Status | Notes                 |
| ---------- | ------ | --------------------- |
| Build      | 🟡     | Needs validation      |
| Lint       | 🟡     | Needs validation      |
| Typecheck  | 🟡     | Needs validation      |
| Unit Tests | 🟡     | Needs validation      |
| E2E Tests  | ⚪     | Not run yet           |
| Coverage   | 🟡     | Needs validation      |
| Deploy     | 🟡     | Vercel config present |

```

## Key Entry Points
- Frontend: `client/`
- Backend: `server/`
- API: `api/`
- Shared types/schemas: `shared/`
- Migrations: `migrations/`
- Seeds: `npm run seed`
- Feature flags: `config/feature-flags.ts`
- CI/CD: `ci/`, `vercel.json`, `railway.json`
- Docker: `Dockerfile`, `docker-compose.yml`

## Quick Reference
- Start dev: `npm run dev`
- Run all tests: `npm run test:all`
- Build: `npm run build`
- Quality gate: `npm run quality`
- DB ops: `npm run db:push`, `npm run db:generate`, `npm run seed`
- Deploy: `vercel`, `vercel --prod`

---

*See README.md, config/README.md, tests/README.md, artifacts/adr/, Documentation/Blueprint/ for details.*
```
