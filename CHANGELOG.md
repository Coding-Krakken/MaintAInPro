# CHANGELOG

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- **Red→Green Development System Bootstrap** - Implemented fail-fast, test-first
  development system
  - Continuous watchers: `npm run dev:watch` with concurrent
    type/lint/test/build monitoring
  - Quality gates with instant feedback (<2s response time)
  - Prompt library in `.copilot/prompts/` with 6 surgical development templates
  - VS Code integration with tasks, problem matchers, and code snippets
  - Developer runbooks: `docs/runbooks/dev-watchers.md` and
    `docs/runbooks/ci.md`
  - Bootstrap ADR: `docs/decisions/adr-bootstrap-red-green-system.md`
  - Developer Quickstart guide in README.md

### Changed

- Enhanced ESLint configuration targeting --max-warnings=0 (currently 71
  warnings)
- Added `.gitattributes` for consistent line endings across platforms
- Fixed critical lint errors (unused variables, imports)
- Improved package.json with concurrent watcher scripts
- Updated VS Code workspace with comprehensive task definitions

### Infrastructure

- Added dependencies: `concurrently`, `nodemon` for file watching
- Enhanced `.vscode/tasks.json` with 5 watcher tasks and problem matchers
- Created comprehensive validation documentation in `artifacts/bootstrap/`
- Implemented surgical change workflow with red→green→refactor cycle

### Developer Experience

- 5-command quickstart: install → db setup → watchers → quality → coverage
- Instant feedback loops for all quality gates
- Structured prompt library for consistent, minimal changes
- Comprehensive documentation for CI/CD and development workflows

- Initial changelog created on 2025-08-13.

### Changed

- Enhance format check and fix CodeQL config in CI/CD workflow
  ([b73e62a8f](https://github.com/Coding-Krakken/MaintAInPro/commit/b73e62a8f656ce1a271be07ac2b332d8317773e6))

- Refactor: streamline format check and linting process in CI/CD workflow
  ([e31e1c669](https://github.com/Coding-Krakken/MaintAInPro/commit/e31e1c669af5f3257c12ca12a5c760cdca339fbf))

- deps(deps-dev): bump @tailwindcss/typography from 0.5.15 to 0.5.16 (#298)

* deps(deps-dev): bump @tailwindcss/typography from 0.5.15 to 0.5.16

Bumps
[@tailwindcss/typography](https://github.com/tailwindlabs/tailwindcss-typography)
from 0.5.15 to 0.5.16.

- [Release notes](https://github.com/tailwindlabs/tailwindcss-typography/releases)
- [Changelog](https://github.com/tailwindlabs/tailwindcss-typography/blob/main/CHANGELOG.md)
- [Commits](https://github.com/tailwindlabs/tailwindcss-typography/compare/v0.5.15...v0.5.16)

---

updated-dependencies:

- dependency-name: "@tailwindcss/typography" dependency-version: 0.5.16
  dependency-type: direct:development update-type: version-update:semver-patch
  ...

Signed-off-by: dependabot[bot] <support@github.com>

- style(tests): format code for improved readability in security tests

---

Signed-off-by: dependabot[bot] <support@github.com> Co-authored-by:
dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>
Co-authored-by: Coding-Krakken <davidtraversmailbox@gmail.com>
([8b2f72fa2](https://github.com/Coding-Krakken/MaintAInPro/commit/8b2f72fa295d9fc53597b1883c51061e87acd162))

- Refactor: remove unnecessary domain alias updates for www.unitedautosupply.org
  ([be0879285](https://github.com/Coding-Krakken/MaintAInPro/commit/be0879285d48733dcc7ffe9978e050509088d4c2))
- Refactor: change code structure for improved readability and maintainability
  ([38ca8867f](https://github.com/Coding-Krakken/MaintAInPro/commit/38ca8867f88715ca308e998252ec7770c596e125))
- Add comprehensive unit tests for AssetCard component (#368)

* Initial plan

* Add comprehensive unit tests for AssetCard component

Co-authored-by: Coding-Krakken
<220203495+Coding-Krakken@users.noreply.github.com>

- Fix code formatting for AssetCard component and tests

Co-authored-by: Coding-Krakken
<220203495+Coding-Krakken@users.noreply.github.com>

---

Co-authored-by: copilot-swe-agent[bot]
<198982749+Copilot@users.noreply.github.com> Co-authored-by: Coding-Krakken
<220203495+Coding-Krakken@users.noreply.github.com>
([381762f23](https://github.com/Coding-Krakken/MaintAInPro/commit/381762f23b54fdf1d8ccd69120f60197400f8f5f))

- Add comprehensive unit tests for server/health.ts endpoint (#369)

* Initial plan

* Add comprehensive unit tests for server/health.ts route

Co-authored-by: Coding-Krakken
<220203495+Coding-Krakken@users.noreply.github.com>

---

Co-authored-by: copilot-swe-agent[bot]
<198982749+Copilot@users.noreply.github.com> Co-authored-by: Coding-Krakken
<220203495+Coding-Krakken@users.noreply.github.com>
([3b3429fe1](https://github.com/Coding-Krakken/MaintAInPro/commit/3b3429fe167dc091a7660c39f82b72c7953022c9))

- Add comprehensive integration tests for api/monitoring/ endpoints (#371)

* Initial plan

* Add comprehensive integration tests for api/monitoring/ endpoints

Co-authored-by: Coding-Krakken
<220203495+Coding-Krakken@users.noreply.github.com>

---

Co-authored-by: copilot-swe-agent[bot]
<198982749+Copilot@users.noreply.github.com> Co-authored-by: Coding-Krakken
<220203495+Coding-Krakken@users.noreply.github.com>
([1b719cfac](https://github.com/Coding-Krakken/MaintAInPro/commit/1b719cfaca3b3d2c48735a0edae19731f4f45ca9))

- Add comprehensive ADR for Drizzle ORM adoption (#370)

* Initial plan

* Add comprehensive ADR for Drizzle ORM adoption

Co-authored-by: Coding-Krakken
<220203495+Coding-Krakken@users.noreply.github.com>

---

Co-authored-by: copilot-swe-agent[bot]
<198982749+Copilot@users.noreply.github.com> Co-authored-by: Coding-Krakken
<220203495+Coding-Krakken@users.noreply.github.com>
([41fb75a41](https://github.com/Coding-Krakken/MaintAInPro/commit/41fb75a41055529a903604b11ff8991b54735246))

- Add minimal benchmark for WorkOrderService operations (#372)

* Initial plan

* feat: Add minimal WorkOrderService benchmark with comprehensive performance
  metrics

Co-authored-by: Coding-Krakken
<220203495+Coding-Krakken@users.noreply.github.com>

---

Co-authored-by: copilot-swe-agent[bot]
<198982749+Copilot@users.noreply.github.com> Co-authored-by: Coding-Krakken
<220203495+Coding-Krakken@users.noreply.github.com>
([434e9694b](https://github.com/Coding-Krakken/MaintAInPro/commit/434e9694b6f876dc88fa3980538298cf4902c30e))###
Fixed

- streamline request handling for admin and technician endpoints
  ([3d44744eb](https://github.com/Coding-Krakken/MaintAInPro/commit/3d44744eb559dec359c55d43234db85698434dae))

- remove redundant format check and simplify secret scanning arguments
  ([0c60e9e17](https://github.com/Coding-Krakken/MaintAInPro/commit/0c60e9e17a51afac44dffc1cc133851d4a8aa108))

- enhance secret scanning by failing on verified secrets
  ([24812ce9e](https://github.com/Coding-Krakken/MaintAInPro/commit/24812ce9ed435b1e46e81ebb618d6e7df56be239))

- update secret scanning arguments to include --no-verify option
  ([32b7c4f68](https://github.com/Coding-Krakken/MaintAInPro/commit/32b7c4f68029d9ac7a489e7523718c706ebd68a3))

- update cron schedule for system monitoring to run daily at midnight
  ([688eafd58](https://github.com/Coding-Krakken/MaintAInPro/commit/688eafd58ee9d1451ee8dd36d111b3b8f11da714))

### Added

- enhance system alert handling by closing issues when system health is restored
  ([ae4e43fd8](https://github.com/Coding-Krakken/MaintAInPro/commit/ae4e43fd8da702a05dab3a2beba510933a456fa0))

- add debug endpoints and debug dashboard

- Implemented a new debug router with endpoints for fetching environment
  variables and test summary.
- Created a DebugPage component in the client to display database connection
  status, API health, environment variables, and test results.
- Enhanced error handling in the server to provide more specific error types.
- Updated server index to include the new debug router.
  ([2d8b44372](https://github.com/Coding-Krakken/MaintAInPro/commit/2d8b4437263fb8ff5d2314f6a54d1f7ace081122))

## [e97b962] - 2025-08-13

- Deployment record added to traceability log.
- Skipping changelog update for maintenance commit.

---

Please update this file with details of new features, bug fixes, and other
changes as they are made.
