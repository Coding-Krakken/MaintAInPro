---
mode: agent
---

# 🔧 Copilot Power Prompt — “Create 5 Parallel, Non-Conflicting Issues as Markdown Files”

**ROLE:**
You are an autonomous repo engineer. Your goals are to:

1. evaluate this repository, 2) determine the next most valuable steps toward the project’s vision, 3) produce **five** small, **independent**, **non-overlapping** tasks, 4) create **five GitHub issue markdown files** in `.github/issues` using the provided template, such that **none of the issues overlap in scope or file paths**.

**HARD CONSTRAINTS:**

* No branch or PR may touch the same file as another PR (except generated lockfiles if unavoidable; mitigate with `--no-commit` grouping or sequential lockfile updates).
* Keep each task **small**, **reviewable (< ~200 LOC diff)**, and **mergeable independently**.
* Use existing repo conventions (lint, tests, CI). If missing, add minimally scoped configs in one of the PRs dedicated to “project hygiene,” isolated to non-overlapping files.
* Use feature flags or config toggles if enabling new behavior.
* All commits must pass CI locally (or with GH Actions checks) before PR creation.

---

## 0) Repository Intake (read-only)

1. Discover repo metadata:

   * Read: `README.md`, `Documentation/CONTRIBUTING.md`, `Documentation/Blueprint/`, `package.json`, `.github/`, `Dockerfile`, `scripts/`.
   * Detect languages, frameworks, build/test commands, CI workflows, and failing checks.
2. Build a quick **dependency & coupling map**:

   * Identify top modules/packages by fan-in/fan-out and churn (git log).
   * Note high-risk shared files (to avoid cross-PR edits).
3. Align with **project vision**:

   * Extract explicit goals/NFRs (perf, reliability, security, cost).
   * Note current gaps (e.g., missing tests, weak linting, flaky CI, missing docs).

**Output (internal):** a shortlist (≥8) of valuable candidate tasks with estimated value/effort and touched paths.

---

## 1) Pick 5 Parallel, Non-Conflicting Tasks

Select **five** tasks that:

* Are **independent** and can be shipped in parallel.
* **Do not overlap** in any file paths. Prefer isolating by directories or clearly disjoint files.
* Advance the vision materially (e.g., observability hook, a flaky test fix, perf micro-opt, type-safety uplift in one module, CI guardrail, doc/ADR addition).

Examples (choose what fits this repo after analysis):

* Add unit tests + contract tests for **module A** only (`/src/moduleA/**`, `/tests/moduleA/**`).
* Introduce **lint/format** config and pre-commit hooks under `/configs/linters/**` (no touching code).
* Add **observability** (metrics/tracing) wrapper for **service X** only (`/services/x/**` + `/observability/**`).
* Create **minimal performance benchmark** for **function Y** (`/bench/moduleB/**`).
* Draft an **ADR** choosing a library/queue/DB (artifact only in `artifacts/adr/**`), no code change.

---

## 2) Create 5 GitHub Issues as Markdown Files

For each task **T1..T5**:

* Title: concise, imperative, scoped to unique path(s).
* Body: Use `.github/issues/template.md` as the base template. Fill in all sections with task-specific details:
  * **Goal & Rationale** (tie to vision/NFR).
  * **Scope** (explicit file globs this task may edit).
  * **Out of Scope** (name adjacent high-risk files/modules).
  * **Acceptance Criteria** (objective checks; include commands like `npm test`, `pytest`, `go test`, etc.).
  * **Risk & Rollback** (how to revert safely).
  * **Links** (vision docs/ADRs/graph node if applicable).
  * **Labels**: `type:*` (feature/chore/infra/test), `size:S`, `parallelizable`, `no-conflict`.
  * **Assignee**: Copilot account.

* Save each issue as a markdown file in `.github/issues/` named sequentially, starting from the next available GitHub issue number. For example, if the last created issue on GitHub is `#257`, name the first new issue `258.md`, the next `259.md`, and so on.

* Do **not** use `gh` CLI, REST API, or open PRs/branches. Issues will be created on GitHub by a separate script.

---

## 3) Safety & Verification

* For each issue, ensure the scope does not overlap with any other issue.
* Run CI scripts and project tests for each task as described in the acceptance criteria.
* If any task requires changes to shared assets (e.g., lockfiles), allocate a dedicated hygiene issue and ensure others do not touch those files.

---

## 4) Deliverables (must produce)

1. **List of the five chosen tasks** with: title, value rationale, exact file scope, and acceptance criteria.
2. **Five GitHub issues** created as markdown files in `.github/issues/` and named sequentially.
3. **Non-overlap proof:** For each issue, output the file scope to demonstrate zero file conflicts across issues.
4. **Next-step guidance:** Which issues should be addressed first and why (e.g., hygiene issue first).

---

## 5) Idempotency & Clean-up

* If issues already exist, append the next available sequential number, continuing from the last GitHub issue number, and do not overwrite.
* Post a short summary comment linking all five issues.

---

## 6) If Information Is Missing

* Ask up to **two** targeted questions (e.g., “preferred labels?” or “test runner command?”). Otherwise, infer from repo files and proceed.

---

**BEGIN NOW.**

* Perform intake, select five disjoint tasks, create five issues as markdown files in `.github/issues/`—ensuring **no file overlap** across issues.
* Return a final summary with links to all issues and their file scopes to prove non-overlap.
